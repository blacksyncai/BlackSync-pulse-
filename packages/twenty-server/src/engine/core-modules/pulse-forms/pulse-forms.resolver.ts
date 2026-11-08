import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { AuthUserWorkspaceId } from 'src/engine/decorators/auth/auth-user-workspace-id.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { PulseFormsService } from './services/pulse-forms.service';

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
export class PulseFormsResolver {
  constructor(private readonly forms: PulseFormsService) {}
  @Query(() => GraphQLJSON)
  pulseForms(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: AuthContextUser,
    @AuthUserWorkspaceId() userWorkspaceId: string,
  ) {
    return this.forms.list({
      workspaceId: workspace.id,
      userId: user.id,
      userWorkspaceId,
    });
  }
  @Mutation(() => GraphQLJSON)
  savePulseForm(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: AuthContextUser,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @Args('definition', { type: () => GraphQLJSON }) definition: unknown,
    @Args('id', { type: () => String, nullable: true }) id?: string,
    @Args('revision', { type: () => Int, nullable: true }) revision?: number,
  ) {
    return this.forms.save(
      { workspaceId: workspace.id, userId: user.id, userWorkspaceId },
      definition,
      id,
      revision,
    );
  }
  @Query(() => GraphQLJSON)
  pulseFormSubmissions(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: AuthContextUser,
    @AuthUserWorkspaceId() userWorkspaceId: string,
    @Args('id', { type: () => String }) id: string,
  ) {
    return this.forms.submissions(
      { workspaceId: workspace.id, userId: user.id, userWorkspaceId },
      id,
    );
  }
}
