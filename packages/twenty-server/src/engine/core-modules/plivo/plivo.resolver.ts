import { GraphQLJSON } from 'graphql-type-json';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthUserWorkspaceId } from 'src/engine/decorators/auth/auth-user-workspace-id.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { CrmPhoneNumbersService } from './services/crm-phone-numbers.service';
import { UseFilters, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

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
  constructor(
    private readonly plivoService: PlivoService,
    private readonly numbers: CrmPhoneNumbersService,
  ) {}

  @Query(() => PlivoVoiceAccessDTO)
  async plivoVoiceAccess(
    @AuthUser() user: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<PlivoVoiceAccessDTO> {
    const callerIds = await this.numbers.list(workspace.id);
    const voiceSetup = callerIds.length
      ? await this.plivoService.getVoiceSetup()
      : null;

    if (voiceSetup === null) {
      return {
        isEnabled: false,
        accessToken: null,
        callerIds: [],
        defaultCallerId: null,
      };
    }

    return {
      isEnabled: true,
      accessToken: await this.plivoService.createAccessToken(
        user.id,
        voiceSetup,
      ),
      callerIds,
      defaultCallerId: callerIds[0]?.number ?? null,
    };
  }
  @Query(() => GraphQLJSON)
  crmPhoneNumbers(@AuthWorkspace() workspace: WorkspaceEntity) {
    return this.numbers.settings(workspace.id);
  }
  @Query(() => GraphQLJSON)
  searchCrmPhoneNumbers(@Args('areaCode') areaCode: string) {
    return this.numbers.search(areaCode);
  }
  @Mutation(() => String)
  checkoutCrmPhoneNumber(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: AuthContextUser,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @Args('number') number: string,
    @Args('requestId') requestId: string,
  ) {
    return this.numbers.checkout(
      { workspaceId: workspace.id, userId: user.id, userWorkspaceId },
      number,
      requestId,
    );
  }
  @Mutation(() => Boolean)
  async refreshCrmPhoneNumbers(@AuthWorkspace() workspace: WorkspaceEntity) {
    await this.numbers.refresh(workspace.id);
    return true;
  }
  @Mutation(() => String)
  crmPhoneCallGrant(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: AuthContextUser,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @Args('destination') destination: string,
    @Args('number', { nullable: true, type: () => String })
    number: string | null,
    @Args('record') record: boolean,
  ) {
    return this.numbers.callGrant(
      { workspaceId: workspace.id, userId: user.id, userWorkspaceId },
      destination,
      number,
      record,
    );
  }
  @Mutation(() => String)
  manageCrmPhoneNumber(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @Args('orderId') orderId: string,
  ) {
    return this.numbers.portal(workspace.id, userWorkspaceId, orderId);
  }
}
