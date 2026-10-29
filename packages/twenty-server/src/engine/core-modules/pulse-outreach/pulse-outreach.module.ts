import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ResendApiClientService } from 'src/engine/core-modules/emailing-domain/drivers/resend/services/resend-api-client.service';
import { KeyValuePairEntity } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairModule } from 'src/engine/core-modules/key-value-pair/key-value-pair.module';
import { PulseCrmModule } from 'src/engine/core-modules/pulse-crm/pulse-crm.module';
import { PulseSequenceCronCommand } from 'src/engine/core-modules/pulse-outreach/crons/commands/pulse-sequence.cron.command';
import { PulseSequenceCronJob } from 'src/engine/core-modules/pulse-outreach/crons/jobs/pulse-sequence.cron.job';
import { PulseOutreachResolver } from 'src/engine/core-modules/pulse-outreach/pulse-outreach.resolver';
import { PulseEmailSenderService } from 'src/engine/core-modules/pulse-outreach/services/pulse-email-sender.service';
import { PulseEnrollmentStoreService } from 'src/engine/core-modules/pulse-outreach/services/pulse-enrollment-store.service';
import { PulseSequenceService } from 'src/engine/core-modules/pulse-outreach/services/pulse-sequence.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([KeyValuePairEntity, WorkspaceEntity]),
    KeyValuePairModule,
    PulseCrmModule,
  ],
  providers: [
    ResendApiClientService,
    PulseEmailSenderService,
    PulseEnrollmentStoreService,
    PulseSequenceService,
    PulseOutreachResolver,
    PulseSequenceCronJob,
    PulseSequenceCronCommand,
  ],
  exports: [PulseSequenceCronCommand],
})
export class PulseOutreachModule {}
