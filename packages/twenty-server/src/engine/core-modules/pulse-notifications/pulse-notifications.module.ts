import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CloseImportModule } from 'src/engine/core-modules/close-import/close-import.module';
import { WorkspaceDomainsModule } from 'src/engine/core-modules/domain/workspace-domains/workspace-domains.module';
import { KeyValuePairModule } from 'src/engine/core-modules/key-value-pair/key-value-pair.module';
import { PulseTaskReminderCronCommand } from 'src/engine/core-modules/pulse-notifications/crons/commands/pulse-task-reminder.cron.command';
import { PulseTaskReminderCronJob } from 'src/engine/core-modules/pulse-notifications/crons/jobs/pulse-task-reminder.cron.job';
import { PulseTaskReminderService } from 'src/engine/core-modules/pulse-notifications/services/pulse-task-reminder.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceEntity]),
    KeyValuePairModule,
    CloseImportModule,
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
