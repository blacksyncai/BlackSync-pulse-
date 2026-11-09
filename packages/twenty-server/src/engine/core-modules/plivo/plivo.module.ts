import { TypeOrmModule } from '@nestjs/typeorm';
import { KeyValuePairEntity } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { CrmPhoneNumbersService } from './services/crm-phone-numbers.service';
import { CrmPhoneStripeController } from './controllers/crm-phone-stripe.controller';
import { Module } from '@nestjs/common';

import { PlivoWebhookController } from 'src/engine/core-modules/plivo/controllers/plivo-webhook.controller';
import { PlivoResolver } from 'src/engine/core-modules/plivo/plivo.resolver';
import { PlivoService } from 'src/engine/core-modules/plivo/services/plivo.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([KeyValuePairEntity, UserWorkspaceEntity]),
    PermissionsModule,
  ],
  controllers: [PlivoWebhookController, CrmPhoneStripeController],
  providers: [PlivoService, PlivoResolver, CrmPhoneNumbersService],
  exports: [PlivoService, CrmPhoneNumbersService],
})
export class PlivoModule {}
