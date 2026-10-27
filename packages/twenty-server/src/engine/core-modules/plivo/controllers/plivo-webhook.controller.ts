import {
  Controller,
  Header,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';
import { ApiPath } from 'twenty-shared/types';

import { PlivoService } from 'src/engine/core-modules/plivo/services/plivo.service';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

// Plivo fetches this when a browser endpoint places a call. Returning dial XML
// grants nothing on its own: Plivo only acts on it for calls that an
// authenticated endpoint started.
@Controller()
export class PlivoWebhookController {
  constructor(private readonly plivoService: PlivoService) {}

  @Post(`${ApiPath.Webhooks}/plivo/answer`)
  @HttpCode(200)
  @Header('Content-Type', 'application/xml')
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  answer(@Req() request: Request): string {
    const destination = request.body?.To ?? request.query?.To;

    return this.plivoService.buildAnswerXml(
      typeof destination === 'string' ? destination : undefined,
    );
  }
}
