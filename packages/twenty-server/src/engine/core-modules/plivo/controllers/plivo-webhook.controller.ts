import { CrmPhoneNumbersService } from '../services/crm-phone-numbers.service';
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

import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

// Plivo fetches this when a browser endpoint places a call. Returning dial XML
// grants nothing on its own: Plivo only acts on it for calls that an
// authenticated endpoint started.
@Controller()
export class PlivoWebhookController {
  constructor(private readonly numbers: CrmPhoneNumbersService) {}

  @Post(`${ApiPath.Webhooks}/plivo/answer`)
  @HttpCode(200)
  @Header('Content-Type', 'application/xml')
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  async answer(@Req() request: Request): Promise<string> {
    const params: Record<string, unknown> = {
      ...(request.query ?? {}),
      ...(request.body ?? {}),
    };
    // The browser sends its choices as X-PH- SIP headers, which Plivo forwards as params.
    const header = (name: string) => {
      const value = Object.entries(params).find(
        ([key]) => key.toLowerCase() === name,
      )?.[1];

      return typeof value === 'string' ? value : undefined;
    };
    const destination = params.To;

    return this.numbers.answer(
      header('x-ph-grant'),
      typeof destination === 'string' ? destination : undefined,
      typeof params.CallUUID === 'string' ? params.CallUUID : undefined,
    );
  }
}
