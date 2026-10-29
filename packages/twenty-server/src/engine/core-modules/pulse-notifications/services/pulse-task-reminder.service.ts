import { Injectable, Logger } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { Between, In, IsNull, MoreThanOrEqual, Not } from 'typeorm';

import { PulsePipelineProvisioningService } from 'src/engine/core-modules/close-import/services/pulse-pipeline-provisioning.service';
import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { EmailService } from 'src/engine/core-modules/email/email.service';
import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import {
  buildTaskReminderEmail,
  type TaskReminderKind,
} from 'src/engine/core-modules/pulse-notifications/utils/build-task-reminder-email.util';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';
import { WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

const SENT_KEY = 'pulse-task-reminders:sent';
const DUE_SOON_MS = 15 * 60 * 1000;
// Reminders the cron missed (worker restarts, a slow run) still go out within this window.
const DUE_LATE_MS = 60 * 60 * 1000;
const ASSIGNED_LOOKBACK_MS = 30 * 60 * 1000;
const SENT_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;
const URGENT_PRIORITY = 'URGENT';
const TASK_PRIORITY_OPTIONS = [
  { label: 'Urgent', color: 'red' },
  { label: 'High', color: 'orange' },
  { label: 'Normal', color: 'blue' },
  { label: 'Low', color: 'gray' },
];

type PendingReminder = {
  key: string;
  kind: TaskReminderKind;
  task: TaskWorkspaceEntity;
};

@Injectable()
export class PulseTaskReminderService {
  private readonly logger = new Logger(PulseTaskReminderService.name);
  private readonly workspaceIdsWithPriority = new Set<string>();

  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly keyValuePairService: KeyValuePairService,
    private readonly emailService: EmailService,
    private readonly workspaceDomainsService: WorkspaceDomainsService,
    private readonly twentyConfigService: TwentyConfigService,
    private readonly pulsePipelineProvisioningService: PulsePipelineProvisioningService,
  ) {}

  async sendWorkspaceReminders(workspace: WorkspaceEntity): Promise<void> {
    await this.ensureTaskPriorityField(workspace.id);

    const now = Date.now();
    const sent = await this.readSent(workspace.id);
    const isUnsent = (key: string) => !isDefined(sent[key]);

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const taskRepository = this.workspaceOrmManager.getRepository(
        TaskWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      );
      const workspaceMemberRepository = this.workspaceOrmManager.getRepository(
        WorkspaceMemberWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      );

      const [dueTasks, newTasks] = await Promise.all([
        taskRepository.find({
          where: {
            assigneeId: Not(IsNull()),
            dueAt: Between(
              new Date(now - DUE_LATE_MS),
              new Date(now + DUE_SOON_MS),
            ),
          },
        }),
        taskRepository.find({
          where: {
            assigneeId: Not(IsNull()),
            createdAt: MoreThanOrEqual(new Date(now - ASSIGNED_LOOKBACK_MS)),
          },
        }),
      ]);

      const pending: PendingReminder[] = [
        ...newTasks
          .filter(
            (task) => task.createdBy?.workspaceMemberId !== task.assigneeId,
          )
          .map((task) => ({
            key: `assigned:${task.id}`,
            kind: 'assigned' as const,
            task,
          })),
        ...dueTasks.map((task) => ({
          key: `due:${task.id}:${new Date(task.dueAt ?? 0).getTime()}`,
          kind: 'due' as const,
          task,
        })),
      ].filter(
        (reminder) => reminder.task.status !== 'DONE' && isUnsent(reminder.key),
      );

      if (pending.length === 0) {
        return;
      }

      const assigneeIds = [
        ...new Set(pending.map((reminder) => reminder.task.assigneeId)),
      ].filter(isDefined);
      const assignees = await workspaceMemberRepository.find({
        where: { id: In(assigneeIds) },
      });
      const assigneeById = new Map(
        assignees.map((assignee) => [assignee.id, assignee]),
      );
      const link = this.workspaceDomainsService
        .buildWorkspaceURL({ workspace, pathname: '/todo' })
        .toString();

      for (const reminder of pending) {
        const assignee = assigneeById.get(reminder.task.assigneeId ?? '');

        sent[reminder.key] = now;

        if (!isNonEmptyString(assignee?.userEmail)) {
          continue;
        }

        const email = buildTaskReminderEmail({
          kind: reminder.kind,
          taskTitle: reminder.task.title ?? '',
          dueAt: isDefined(reminder.task.dueAt)
            ? new Date(reminder.task.dueAt)
            : null,
          isUrgent:
            (reminder.task as TaskWorkspaceEntity & { priority?: string })
              .priority === URGENT_PRIORITY,
          timeZone: assignee.timeZone,
          link,
        });

        await this.emailService.send({
          from: `${this.twentyConfigService.get('EMAIL_FROM_NAME')} <${this.twentyConfigService.get('EMAIL_FROM_ADDRESS')}>`,
          to: assignee.userEmail,
          ...email,
        });
      }

      this.logger.log(
        `Sent ${pending.length} task reminder(s) for workspace ${workspace.id}`,
      );
    }, buildSystemAuthContext(workspace.id));

    await this.writeSent(
      workspace.id,
      Object.fromEntries(
        Object.entries(sent).filter(
          ([, sentAt]) => now - sentAt < SENT_RETENTION_MS,
        ),
      ),
    );
  }

  // Every workspace gets a task Priority field so the to-do list can flag urgent work.
  private async ensureTaskPriorityField(workspaceId: string) {
    if (this.workspaceIdsWithPriority.has(workspaceId)) {
      return;
    }

    await this.pulsePipelineProvisioningService.ensureSelectField({
      workspaceId,
      objectNameSingular: 'task',
      fieldName: 'priority',
      label: 'Priority',
      icon: 'IconFlag',
      options: TASK_PRIORITY_OPTIONS,
    });
    this.workspaceIdsWithPriority.add(workspaceId);
  }

  private async readSent(workspaceId: string) {
    const [stored] = await this.keyValuePairService.get({
      workspaceId,
      userId: null,
      type: KeyValuePairType.USER_VARIABLE,
      key: SENT_KEY,
    });

    return { ...((stored?.value as Record<string, number> | undefined) ?? {}) };
  }

  private async writeSent(workspaceId: string, value: Record<string, number>) {
    await this.keyValuePairService.set({
      workspaceId,
      userId: null,
      type: KeyValuePairType.USER_VARIABLE,
      key: SENT_KEY,
      value,
    });
  }
}
