import { Module } from '@nestjs/common';

import { PlivoWebhookController } from 'src/engine/core-modules/plivo/controllers/plivo-webhook.controller';
import { PlivoResolver } from 'src/engine/core-modules/plivo/plivo.resolver';
import { PlivoService } from 'src/engine/core-modules/plivo/services/plivo.service';

@Module({
  controllers: [PlivoWebhookController],
  providers: [PlivoService, PlivoResolver],
})
export class PlivoModule {}
