import { Injectable } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { FieldActorSource } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { In } from 'typeorm';
import { v4 } from 'uuid';

import { ResendApiClientService } from 'src/engine/core-modules/emailing-domain/drivers/resend/services/resend-api-client.service';
import {
  type PulseRecipient,
  type PulseSender,
} from 'src/engine/core-modules/pulse-outreach/types/pulse-outreach.type';
import { plainTextToEmailHtml } from 'src/engine/core-modules/pulse-outreach/utils/render-pulse-template.util';
import { transformRichTextValue } from 'src/engine/core-modules/record-transformer/utils/transform-rich-text.util';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { NoteTargetWorkspaceEntity } from 'src/modules/note/standard-objects/note-target.workspace-entity';
import { NoteWorkspaceEntity } from 'src/modules/note/standard-objects/note.workspace-entity';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';

export class PulseEmailNotConfiguredError extends Error {}

@Injectable()
export class PulseEmailSenderService {
  constructor(
    private readonly resendApiClientService: ResendApiClientService,
    private readonly twentyConfigService: TwentyConfigService,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
  ) {}

  canSend(): boolean {
    return isNonEmptyString(this.twentyConfigService.get('RESEND_API_KEY'));
  }

  // Members on the verified domain send as themselves; everyone else sends from the
  // workspace address with replies routed back to their own inbox.
  buildFromAddress(sender: PulseSender) {
    const domain = this.twentyConfigService.get('RESEND_FROM_DOMAIN');
    const senderName = [sender.firstName, sender.lastName]
      .filter(Boolean)
      .join(' ');
    const isOnVerifiedDomain =
      isNonEmptyString(domain) &&
      sender.email.toLowerCase().endsWith(`@${domain.toLowerCase()}`);

    return isOnVerifiedDomain
      ? `${senderName || sender.email} <${sender.email}>`
      : `${senderName || 'BlackSync Cloud'} <${this.twentyConfigService.get('EMAIL_FROM_ADDRESS')}>`;
  }

  async findRecipients(
    workspaceId: string,
    { personIds, companyIds }: { personIds: string[]; companyIds: string[] },
  ): Promise<{ recipients: PulseRecipient[]; missingEmail: number }> {
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const personRepository = this.workspaceOrmManager.getRepository(
        PersonWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      );
      const companyRepository = this.workspaceOrmManager.getRepository(
        CompanyWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      );

      const people = [
        ...(personIds.length > 0
          ? await personRepository.find({ where: { id: In(personIds) } })
          : []),
        ...(companyIds.length > 0
          ? await personRepository.find({
              where: { companyId: In(companyIds) },
              order: { createdAt: 'ASC' },
            })
          : []),
      ];
      const companies =
        people.length > 0
          ? await companyRepository.find({
              where: {
                id: In(
                  [...new Set(people.map((person) => person.companyId))].filter(
                    isDefined,
                  ),
                ),
              },
            })
          : [];
      const companyNameById = new Map(
        companies.map((company) => [company.id, company.name ?? '']),
      );

      const recipients: PulseRecipient[] = [];
      const coveredCompanyIds = new Set<string>();
      const seenPersonIds = new Set<string>();

      for (const person of people) {
        const email = person.emails?.primaryEmail?.trim();
        const isFromCompany =
          !personIds.includes(person.id) && isDefined(person.companyId);

        if (
          seenPersonIds.has(person.id) ||
          !isNonEmptyString(email) ||
          (isFromCompany && coveredCompanyIds.has(person.companyId ?? ''))
        ) {
          continue;
        }

        seenPersonIds.add(person.id);

        // A lead picked as a whole is emailed once, at its first contact with an email.
        if (isFromCompany) {
          coveredCompanyIds.add(person.companyId ?? '');
        }

        recipients.push({
          personId: person.id,
          companyId: person.companyId ?? null,
          email,
          firstName: person.name?.firstName ?? '',
          lastName: person.name?.lastName ?? '',
          companyName: companyNameById.get(person.companyId ?? '') ?? '',
        });
      }

      const requested = personIds.length + companyIds.length;

      return {
        recipients,
        missingEmail: Math.max(0, requested - recipients.length),
      };
    }, buildSystemAuthContext(workspaceId));
  }

  async send({
    workspaceId,
    sender,
    recipient,
    subject,
    body,
    sequenceName,
  }: {
    workspaceId: string;
    sender: PulseSender;
    recipient: PulseRecipient;
    subject: string;
    body: string;
    sequenceName?: string;
  }): Promise<string> {
    if (!this.canSend()) {
      throw new PulseEmailNotConfiguredError(
        'Email sending is not set up yet (RESEND_API_KEY is missing)',
      );
    }

    await this.resendApiClientService.sendEmail({
      from: this.buildFromAddress(sender),
      to: [recipient.email],
      reply_to: [sender.email],
      subject,
      text: body,
      html: plainTextToEmailHtml(body),
    });

    return this.logSentEmail({
      workspaceId,
      sender,
      recipient,
      subject,
      body,
      sequenceName,
    });
  }

  // Sent emails land on the lead's timeline like imported Close emails.
  private async logSentEmail({
    workspaceId,
    sender,
    recipient,
    subject,
    body,
    sequenceName,
  }: {
    workspaceId: string;
    sender: PulseSender;
    recipient: PulseRecipient;
    subject: string;
    body: string;
    sequenceName?: string;
  }) {
    const noteId = v4();
    const sentBy = {
      source: FieldActorSource.MANUAL,
      name: [sender.firstName, sender.lastName].filter(Boolean).join(' '),
      workspaceMemberId: sender.workspaceMemberId,
      context: {},
    };
    const header = [
      `From: ${sender.email}`,
      `To: ${recipient.email}`,
      ...(isNonEmptyString(sequenceName) ? [`Sequence: ${sequenceName}`] : []),
    ].join('\n\n');

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const noteRepository = this.workspaceOrmManager.getRepository(
        NoteWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      );
      const noteTargetRepository = this.workspaceOrmManager.getRepository(
        NoteTargetWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      );

      await noteRepository.insert({
        id: noteId,
        title: `Email sent: ${subject}`,
        bodyV2: await transformRichTextValue({
          markdown: `${header}\n\n${body}`,
          blocknote: null,
        }),
        position: Date.now(),
        createdBy: sentBy,
        updatedBy: sentBy,
      });
      await noteTargetRepository.insert([
        { noteId, targetPersonId: recipient.personId },
        ...(isNonEmptyString(recipient.companyId)
          ? [{ noteId, targetCompanyId: recipient.companyId }]
          : []),
      ]);
    }, buildSystemAuthContext(workspaceId));

    return noteId;
  }
}
