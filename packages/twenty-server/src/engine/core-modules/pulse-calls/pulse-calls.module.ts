import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { FileStorageModule } from 'src/engine/core-modules/file-storage/file-storage.module';
import { PlivoModule } from 'src/engine/core-modules/plivo/plivo.module';
import { PulseCallRecordingJob } from 'src/engine/core-modules/pulse-calls/jobs/pulse-call-recording.job';
import { PulseCallsResolver } from 'src/engine/core-modules/pulse-calls/pulse-calls.resolver';
import { PulseCallLogService } from 'src/engine/core-modules/pulse-calls/services/pulse-call-log.service';
import { PulseRecordingService } from 'src/engine/core-modules/pulse-calls/services/pulse-recording.service';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { provideWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/provide-workspace-scoped-repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplicationEntity, FieldMetadataEntity]),
    FileStorageModule,
    PlivoModule,
  ],
  providers: [
    PulseRecordingService,
    PulseCallLogService,
    PulseCallsResolver,
    PulseCallRecordingJob,
    provideWorkspaceScopedRepository(FieldMetadataEntity),
    provideWorkspaceScopedRepository(ApplicationEntity),
  ],
  exports: [PulseRecordingService],
})
export class PulseCallsModule {}
