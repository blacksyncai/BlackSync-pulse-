import {
  BadRequestException,
  Controller,
  Headers,
  Get,
  HttpCode,
  Post,
  type RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { type Request } from 'express';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { CrmPhoneNumbersService } from '../services/crm-phone-numbers.service';
@Controller()
export class CrmPhoneStripeController {
  constructor(private readonly numbers: CrmPhoneNumbersService) {}
  @Get('webhooks/crm-phone-numbers/status')
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  status() {
    return this.numbers.capabilities();
  }
  @Post('webhooks/crm-phone-numbers/stripe')
  @HttpCode(200)
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  async webhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!request.rawBody || !signature)
      throw new BadRequestException('Missing Stripe signature.');
    await this.numbers.webhook(request.rawBody, signature);
    return { received: true };
  }
}
