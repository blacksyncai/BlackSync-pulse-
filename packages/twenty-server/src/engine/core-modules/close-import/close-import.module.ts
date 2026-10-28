import { Module } from '@nestjs/common';

import { CloseImportJob } from 'src/engine/core-modules/close-import/jobs/close-import.job';
import { CloseImportResolver } from 'src/engine/core-modules/close-import/close-import.resolver';
import { CloseImportService } from 'src/engine/core-modules/close-import/services/close-import.service';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';

@Module({
  imports: [PermissionsModule],
  providers: [CloseImportService, CloseImportResolver, CloseImportJob],
})
export class CloseImportModule {}
