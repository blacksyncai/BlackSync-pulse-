import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';
import { v4 } from 'uuid';

import { PulseSettingsService } from 'src/engine/core-modules/pulse-crm/services/pulse-settings.service';
import { PulseEmailSenderService } from 'src/engine/core-modules/pulse-outreach/services/pulse-email-sender.service';
import { PulseEnrollmentStoreService } from 'src/engine/core-modules/pulse-outreach/services/pulse-enrollment-store.service';
import {
  type PulseEmailTemplate,
  type PulseEnrollment,
  type PulseSender,
  type PulseSequence,
} from 'src/engine/core-modules/pulse-outreach/types/pulse-outreach.type';
import {
  buildTemplateVariables,
  renderPulseTemplate,
} from 'src/engine/core-modules/pulse-outreach/utils/render-pulse-template.util';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_SENDS_PER_RUN = 50;

export class PulseSequenceNotFoundError extends Error {}

@Injectable()
export class PulseSequenceService {
  private readonly logger = new Logger(PulseSequenceService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly pulseSettingsService: PulseSettingsService,
    private readonly pulseEmailSenderService: PulseEmailSenderService,
    private readonly pulseEnrollmentStoreService: PulseEnrollmentStoreService,
  ) {}

  async enroll({
    workspaceId,
    sequenceId,
    personIds,
    companyIds,
    sender,
  }: {
    workspaceId: string;
    sequenceId: string;
    personIds: string[];
    companyIds: string[];
    sender: PulseSender;
  }) {
    const sequences =
      (await this.pulseSettingsService.get<PulseSequence[]>(
        workspaceId,
        'sequences',
      )) ?? [];
    const sequence = sequences.find((candidate) => candidate.id === sequenceId);

    if (!isDefined(sequence) || sequence.steps.length === 0) {
      throw new PulseSequenceNotFoundError(
        'That sequence does not exist or has no steps',
      );
    }

    const { recipients, missingEmail } =
      await this.pulseEmailSenderService.findRecipients(workspaceId, {
        personIds,
        companyIds,
      });
    const existing = await this.pulseEnrollmentStoreService.list(workspaceId);
    const alreadyActive = new Set(
      existing
        .filter(
          (enrollment) =>
            enrollment.sequenceId === sequenceId &&
            enrollment.status === 'active',
        )
        .map((enrollment) => enrollment.personId),
    );
    const now = Date.now();
    let enrolled = 0;

    for (const recipient of recipients) {
      if (alreadyActive.has(recipient.personId)) {
        continue;
      }

      await this.pulseEnrollmentStoreService.save(workspaceId, {
        ...recipient,
        id: v4(),
        sequenceId,
        status: 'active',
        stepIndex: 0,
        nextSendAt: new Date(
          now + (sequence.steps[0].delayDays ?? 0) * DAY_MS,
        ).toISOString(),
        enrolledAt: new Date(now).toISOString(),
        lastSentAt: null,
        sentCount: 0,
        lastError: null,
        sender,
      });
      enrolled++;
    }

    return {
      enrolled,
      alreadyEnrolled: recipients.length - enrolled,
      missingEmail,
    };
  }

  async stop(workspaceId: string, enrollmentId: string) {
    const enrollment = (
      await this.pulseEnrollmentStoreService.list(workspaceId)
    ).find((candidate) => candidate.id === enrollmentId);

    if (!isDefined(enrollment)) {
      return false;
    }

    await this.pulseEnrollmentStoreService.save(workspaceId, {
      ...enrollment,
      status: 'stopped',
      nextSendAt: null,
    });

    return true;
  }

  async listEnrollments(workspaceId: string) {
    return (await this.pulseEnrollmentStoreService.list(workspaceId)).sort(
      (left, right) => right.enrolledAt.localeCompare(left.enrolledAt),
    );
  }

  async processDueSteps(workspaceId: string): Promise<void> {
    if (!this.pulseEmailSenderService.canSend()) {
      return;
    }

    const now = Date.now();
    const due = (await this.pulseEnrollmentStoreService.list(workspaceId))
      .filter(
        (enrollment) =>
          enrollment.status === 'active' &&
          isDefined(enrollment.nextSendAt) &&
          new Date(enrollment.nextSendAt).getTime() <= now,
      )
      .slice(0, MAX_SENDS_PER_RUN);

    if (due.length === 0) {
      return;
    }

    const [sequences, templates] = await Promise.all([
      this.pulseSettingsService.get<PulseSequence[]>(workspaceId, 'sequences'),
      this.pulseSettingsService.get<PulseEmailTemplate[]>(
        workspaceId,
        'emailTemplates',
      ),
    ]);
    const repliedPersonIds = await this.findRepliedPeople(workspaceId, due);

    for (const enrollment of due) {
      const sequence = (sequences ?? []).find(
        (candidate) => candidate.id === enrollment.sequenceId,
      );
      const step = sequence?.steps[enrollment.stepIndex];
      const template = (templates ?? []).find(
        (candidate) => candidate.id === step?.templateId,
      );

      if (repliedPersonIds.has(enrollment.personId)) {
        await this.pulseEnrollmentStoreService.save(workspaceId, {
          ...enrollment,
          status: 'replied',
          nextSendAt: null,
        });
        continue;
      }

      // Paused sequences keep their place and resume when switched back on.
      if (isDefined(sequence) && !sequence.isActive) {
        continue;
      }

      if (!isDefined(sequence) || !isDefined(step) || !isDefined(template)) {
        await this.pulseEnrollmentStoreService.save(workspaceId, {
          ...enrollment,
          status:
            isDefined(sequence) && !isDefined(step) ? 'finished' : 'failed',
          nextSendAt: null,
          lastError: isDefined(sequence)
            ? isDefined(step)
              ? 'The email template for this step was deleted'
              : null
            : 'The sequence was deleted',
        });
        continue;
      }

      const variables = buildTemplateVariables(enrollment, enrollment.sender);

      try {
        await this.pulseEmailSenderService.send({
          workspaceId,
          sender: enrollment.sender,
          recipient: enrollment,
          subject: renderPulseTemplate(template.subject, variables),
          body: renderPulseTemplate(template.body, variables),
          sequenceName: sequence.name,
        });

        const nextStep = sequence.steps[enrollment.stepIndex + 1];

        await this.pulseEnrollmentStoreService.save(workspaceId, {
          ...enrollment,
          stepIndex: enrollment.stepIndex + 1,
          status: isDefined(nextStep) ? 'active' : 'finished',
          nextSendAt: isDefined(nextStep)
            ? new Date(now + nextStep.delayDays * DAY_MS).toISOString()
            : null,
          lastSentAt: new Date(now).toISOString(),
          sentCount: enrollment.sentCount + 1,
          lastError: null,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        this.logger.warn(
          `Sequence email to ${enrollment.email} failed: ${message}`,
        );
        await this.pulseEnrollmentStoreService.save(workspaceId, {
          ...enrollment,
          status: 'failed',
          nextSendAt: null,
          lastError: message.slice(0, 300),
        });
      }
    }
  }

  // A reply shows up as an "Email received" note (Close sync) or an inbound message
  // (mailbox sync) from that contact after they were enrolled.
  private async findRepliedPeople(
    workspaceId: string,
    enrollments: PulseEnrollment[],
  ): Promise<Set<string>> {
    const schema = `"${getWorkspaceSchemaName(workspaceId).replace(/"/g, '')}"`;
    const personIds = enrollments.map((enrollment) => enrollment.personId);
    const since = enrollments
      .map((enrollment) => enrollment.enrolledAt)
      .sort()[0];

    const rows = await this.coreDataSource.query<
      { personId: string; repliedAt: string }[]
    >(
      `SELECT nt."targetPersonId" AS "personId", max(n."createdAt") AS "repliedAt"
       FROM ${schema}."noteTarget" nt
       JOIN ${schema}.note n ON n.id = nt."noteId" AND n."deletedAt" IS NULL
       WHERE nt."targetPersonId" = ANY($1::uuid[])
         AND n.title ILIKE 'Email received%'
         AND n."createdAt" >= $2
       GROUP BY nt."targetPersonId"
       UNION ALL
       SELECT mp."personId", max(m."receivedAt")
       FROM ${schema}."messageParticipant" mp
       JOIN ${schema}.message m ON m.id = mp."messageId" AND m."deletedAt" IS NULL
       WHERE mp."personId" = ANY($1::uuid[])
         AND mp.role = 'from'
         AND m."receivedAt" >= $2
       GROUP BY mp."personId"`,
      [personIds, since],
    );

    const enrolledAtByPerson = new Map(
      enrollments.map((enrollment) => [
        enrollment.personId,
        enrollment.enrolledAt,
      ]),
    );

    return new Set(
      rows
        .filter(
          (row) =>
            new Date(row.repliedAt).getTime() >=
            new Date(enrolledAtByPerson.get(row.personId) ?? 0).getTime(),
        )
        .map((row) => row.personId),
    );
  }
}
