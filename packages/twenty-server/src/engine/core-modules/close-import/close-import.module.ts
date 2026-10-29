import { Module } from '@nestjs/common';

import { CloseImportRemovalJob } from 'src/engine/core-modules/close-import/jobs/close-import-removal.job';
import { CloseImportJob } from 'src/engine/core-modules/close-import/jobs/close-import.job';
import { CloseImportResolver } from 'src/engine/core-modules/close-import/close-import.resolver';
import { CloseImportService } from 'src/engine/core-modules/close-import/services/close-import.service';
import { PulsePipelineProvisioningService } from 'src/engine/core-modules/close-import/services/pulse-pipeline-provisioning.service';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { WorkspaceManyOrAllFlatEntityMapsCacheModule } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.module';
import { NavigationMenuItemModule } from 'src/engine/metadata-modules/navigation-menu-item/navigation-menu-item.module';
import { KeyValuePairModule } from 'src/engine/core-modules/key-value-pair/key-value-pair.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { PulseCallsModule } from 'src/engine/core-modules/pulse-calls/pulse-calls.module';
import { ViewFieldModule } from 'src/engine/metadata-modules/view-field/view-field.module';
import { ViewFilterModule } from 'src/engine/metadata-modules/view-filter/view-filter.module';
import { ViewModule } from 'src/engine/metadata-modules/view/view.module';

@Module({
  imports: [
    PermissionsModule,
    KeyValuePairModule,
    PulseCallsModule,
    FieldMetadataModule,
    ViewModule,
    ViewFieldModule,
    ViewFilterModule,
    NavigationMenuItemModule,
    WorkspaceManyOrAllFlatEntityMapsCacheModule,
  ],
  providers: [
    CloseImportService,
    CloseImportResolver,
    CloseImportJob,
    CloseImportRemovalJob,
    PulsePipelineProvisioningService,
  ],
  exports: [PulsePipelineProvisioningService],
})
export class CloseImportModule {}
