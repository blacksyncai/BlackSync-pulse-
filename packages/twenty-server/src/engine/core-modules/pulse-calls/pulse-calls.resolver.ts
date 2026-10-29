import { UseFilters, UseGuards } from '@nestjs/common';
import { Args, Mutation } from '@nestjs/graphql';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import { UserInputError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import { LogPulseCallInput } from 'src/engine/core-modules/pulse-calls/dtos/log-pulse-call.input';
import { PulseRecordingService } from 'src/engine/core-modules/pulse-calls/services/pulse-recording.service';
import { PulseCallLogService } from 'src/engine/core-modules/pulse-calls/services/pulse-call-log.service';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
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
@UseFilters(PreventNestToAutoLogGraphqlErrorsFilter)
@MetadataResolver()
export class PulseCallsResolver {
  constructor(
    private readonly pulseCallLogService: PulseCallLogService,
    private readonly pulseRecordingService: PulseRecordingService,
  ) {}

  @Mutation(() => String)
  async logPulseCall(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: AuthContextUser,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('input') input: LogPulseCallInput,
  ): Promise<string> {
    return this.pulseCallLogService.logCall({
      workspaceId: workspace.id,
      workspaceMemberId,
      callerName: [user.firstName, user.lastName].filter(Boolean).join(' '),
      input,
    });
  }

  @Mutation(() => String, { nullable: true })
  async pulseTranscribeCall(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('noteId', { type: () => String }) noteId: string,
    @Args('recordingUrl', { type: () => String }) recordingUrl: string,
  ): Promise<string | null> {
    try {
      return await this.pulseRecordingService.transcribeStoredRecording({
        workspaceId: workspace.id,
        noteId,
        recordingUrl,
      });
    } catch (error) {
      throw new UserInputError(
        error instanceof Error
          ? error.message
          : 'Could not transcribe this call',
      );
    }
  }
}
