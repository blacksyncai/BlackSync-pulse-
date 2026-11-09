import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeyValuePairEntity } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { MessageChannelEntity } from 'src/engine/metadata-modules/message-channel/entities/message-channel.entity';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { CloseImportModule } from 'src/engine/core-modules/close-import/close-import.module';
import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { WorkspaceManyOrAllFlatEntityMapsCacheModule } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { PulseTicketsResolver } from './pulse-tickets.resolver';
import { PulseTicketProvisioningService } from './services/pulse-ticket-provisioning.service';
import { PulseTicketEmailService } from './services/pulse-ticket-email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KeyValuePairEntity,
      UserEntity,
      UserWorkspaceEntity,
      MessageChannelEntity,
    ]),
    WorkspaceCacheModule,
    CloseImportModule,
    ObjectMetadataModule,
    FieldMetadataModule,
    WorkspaceManyOrAllFlatEntityMapsCacheModule,
    PermissionsModule,
  ],
  providers: [
    PulseTicketsResolver,
    PulseTicketProvisioningService,
    PulseTicketEmailService,
  ],
  exports: [PulseTicketEmailService],
})
export class PulseTicketsModule {}
