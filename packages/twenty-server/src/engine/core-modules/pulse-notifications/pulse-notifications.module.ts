import { PlivoModule } from 'src/engine/core-modules/plivo/plivo.module';
import { PulseTicketsModule } from 'src/engine/core-modules/pulse-tickets/pulse-tickets.module';
import { PulseWelcomeModule } from 'src/engine/core-modules/pulse-welcome/pulse-welcome.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PulseCrmModule } from 'src/engine/core-modules/pulse-crm/pulse-crm.module';
import { CloseImportModule } from 'src/engine/core-modules/close-import/close-import.module';
import { WorkspaceDomainsModule } from 'src/engine/core-modules/domain/workspace-domains/workspace-domains.module';
import { KeyValuePairModule } from 'src/engine/core-modules/key-value-pair/key-value-pair.module';
import { PulseTaskReminderCronCommand } from 'src/engine/core-modules/pulse-notifications/crons/commands/pulse-task-reminder.cron.command';
import { PulseTaskReminderCronJob } from 'src/engine/core-modules/pulse-notifications/crons/jobs/pulse-task-reminder.cron.job';
import { PulseTaskReminderService } from 'src/engine/core-modules/pulse-notifications/services/pulse-task-reminder.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

@Module({
  imports: [
    PulseWelcomeModule,
    PlivoModule,
    PulseTicketsModule,
    TypeOrmModule.forFeature([WorkspaceEntity]),
    KeyValuePairModule,
    CloseImportModule,
    PulseCrmModule,
    WorkspaceDomainsModule,
  ],
  providers: [
    PulseTaskReminderService,
    PulseTaskReminderCronJob,
    PulseTaskReminderCronCommand,
  ],
  exports: [PulseTaskReminderCronCommand],
})
export class PulseNotificationsModule {}
