import { UseFilters, UseGuards } from '@nestjs/common';
import { Query } from '@nestjs/graphql';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { AuthGraphqlApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-graphql-api-exception.filter';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import { PlivoVoiceAccessDTO } from 'src/engine/core-modules/plivo/dtos/plivo-voice-access.dto';
import { PlivoService } from 'src/engine/core-modules/plivo/services/plivo.service';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';

@UseGuards(
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: false,
      playground: false,
      workspaceAgnostic: false,
    },
    apiKey: false,
    oauthClient: false,
    application: false,
  }),
  NoPermissionGuard,
)
@UseFilters(
  PreventNestToAutoLogGraphqlErrorsFilter,
  AuthGraphqlApiExceptionFilter,
)
@MetadataResolver()
export class PlivoResolver {
  constructor(private readonly plivoService: PlivoService) {}

  @Query(() => PlivoVoiceAccessDTO)
  async plivoVoiceAccess(
    @AuthUser() user: AuthContextUser,
  ): Promise<PlivoVoiceAccessDTO> {
    const voiceSetup = await this.plivoService.getVoiceSetup();

    if (voiceSetup === null) {
      return { isEnabled: false, accessToken: null };
    }

    return {
      isEnabled: true,
      accessToken: this.plivoService.createAccessToken(
        user.id,
        voiceSetup.endpointUsername,
      ),
    };
  }
}
