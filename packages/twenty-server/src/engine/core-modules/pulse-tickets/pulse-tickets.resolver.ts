import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { AuthUserWorkspaceId } from 'src/engine/decorators/auth/auth-user-workspace-id.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { PulseTicketProvisioningService } from './services/pulse-ticket-provisioning.service';
import { PulseTicketEmailService } from './services/pulse-ticket-email.service';

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
@MetadataResolver()
export class PulseTicketsResolver {
  constructor(
    private readonly provisioning: PulseTicketProvisioningService,
    private readonly email: PulseTicketEmailService,
  ) {}

  @Query(() => GraphQLJSON)
  async pulseClientTickets(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: AuthContextUser,
    @AuthUserWorkspaceId() userWorkspaceId: string,
  ) {
    return {
      board: await this.provisioning.state(workspace.id),
      ...(await this.email.settings({
        workspaceId: workspace.id,
        userId: user.id,
        userWorkspaceId,
      })),
    };
  }

  @Mutation(() => GraphQLJSON)
  setupPulseClientTickets(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId() userWorkspaceId: string,
  ) {
    return this.provisioning.setup(workspace.id, userWorkspaceId);
  }

  @Mutation(() => GraphQLJSON)
  async savePulseTicketEmailRule(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: AuthContextUser,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @Args('rule', { type: () => GraphQLJSON }) rule: unknown,
  ) {
    if (!(await this.provisioning.state(workspace.id)))
      throw new Error('Enable Client Tickets first.');
    return this.email.save(
      { workspaceId: workspace.id, userId: user.id, userWorkspaceId },
      rule,
    );
  }
}
