import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpException,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { ThrottlerService } from 'src/engine/core-modules/throttler/throttler.service';
import { ThrottlerException } from 'src/engine/core-modules/throttler/throttler.exception';
import { PulseFormsService } from './services/pulse-forms.service';
import { renderPulseFormPage } from './utils/render-pulse-form';

@Controller('webhooks/forms')
@UseGuards(PublicEndpointGuard, NoPermissionGuard)
export class PulseFormsController {
  constructor(
    private readonly forms: PulseFormsService,
    private readonly throttler: ThrottlerService,
  ) {}

  @Get(':id')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  @Header(
    'Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'self'",
  )
  async show(@Param('id') id: string) {
    const { form } = await this.forms.publicForm(id);
    return renderPulseFormPage(form);
  }

  @Post(':id')
  @Header('Cache-Control', 'no-store')
  @Header(
    'Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'self'",
  )
  async submit(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    if (!body || JSON.stringify(body).length > 16000)
      throw new BadRequestException('Submission is too large.');
    try {
      await this.throttler.atomicTokenBucketThrottleOrThrow({
        key: `public-form:ip:${request.ip ?? 'unknown'}`,
        maxTokens: 10,
        timeWindow: 60000,
      });
      await this.throttler.atomicTokenBucketThrottleOrThrow({
        key: `public-form:${id}`,
        maxTokens: 100,
        timeWindow: 3600000,
      });
    } catch (error) {
      if (error instanceof ThrottlerException)
        throw new HttpException(
          'Too many submissions. Please try again later.',
          429,
        );
      throw error;
    }
    const { form } = await this.forms.publicForm(id);
    const json = request.is('application/json');
    if (!body.websiteConfirmation) {
      try {
        if (typeof body.submissionId !== 'string')
          throw new BadRequestException('Reload this form before submitting.');
        await this.forms.submit(id, body.submissionId, body);
      } catch (error) {
        const message =
          error instanceof BadRequestException
            ? error.message
            : 'We could not save your submission. Please try again or contact the business directly.';
        if (json)
          return response
            .status(error instanceof BadRequestException ? 400 : 503)
            .json({ success: false, message });
        const answers = Object.fromEntries(
          form.fields.map((field) => [
            field.key,
            typeof body[field.key] === 'string'
              ? (body[field.key] as string)
              : '',
          ]),
        );
        return response
          .status(error instanceof BadRequestException ? 400 : 503)
          .type('html')
          .send(renderPulseFormPage(form, { error: message, answers }));
      }
    }
    if (json)
      return response
        .status(200)
        .json({ success: true, message: form.successMessage });
    return response
      .status(200)
      .type('html')
      .send(renderPulseFormPage(form, { success: true }));
  }
}
