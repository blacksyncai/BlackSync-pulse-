import { UseFilters, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { isNonEmptyString } from '@sniptt/guards';
import { GraphQLJSON } from 'graphql-type-json';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import { UserInputError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import {
  PulseEmailNotConfiguredError,
  PulseEmailSenderService,
} from 'src/engine/core-modules/pulse-outreach/services/pulse-email-sender.service';
import {
  PulseSequenceNotFoundError,
  PulseSequenceService,
} from 'src/engine/core-modules/pulse-outreach/services/pulse-sequence.service';
import { type PulseSender } from 'src/engine/core-modules/pulse-outreach/types/pulse-outreach.type';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';

const toSender = (
  user: AuthContextUser,
  workspaceMemberId: string | undefined,
): PulseSender => ({
  workspaceMemberId: workspaceMemberId ?? null,
  firstName: user.firstName ?? '',
  lastName: user.lastName ?? '',
  email: user.email,
});

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
export class PulseOutreachResolver {
  constructor(
    private readonly pulseEmailSenderService: PulseEmailSenderService,
    private readonly pulseSequenceService: PulseSequenceService,
  ) {}

  @Query(() => GraphQLJSON)
  async pulseOutreachStatus(
    @AuthUser() user: AuthContextUser,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ) {
    return {
      canSend: this.pulseEmailSenderService.canSend(),
      fromAddress: this.pulseEmailSenderService.buildFromAddress(
        toSender(user, workspaceMemberId),
      ),
      replyTo: user.email,
    };
  }

  @Mutation(() => String)
  async pulseSendEmail(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: AuthContextUser,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('personId', { type: () => String }) personId: string,
    @Args('subject', { type: () => String }) subject: string,
    @Args('body', { type: () => String }) body: string,
  ) {
    if (!isNonEmptyString(subject.trim()) || !isNonEmptyString(body.trim())) {
      throw new UserInputError('Add a subject and a message');
    }

    const { recipients } = await this.pulseEmailSenderService.findRecipients(
      workspace.id,
      { personIds: [personId], companyIds: [] },
    );

    if (recipients.length === 0) {
      throw new UserInputError('This contact has no email address');
    }

    try {
      return await this.pulseEmailSenderService.send({
        workspaceId: workspace.id,
        sender: toSender(user, workspaceMemberId),
        recipient: recipients[0],
        subject: subject.trim(),
        body: body.trim(),
      });
    } catch (error) {
      if (error instanceof PulseEmailNotConfiguredError) {
        throw new UserInputError(
          'Email sending is not set up yet. Add the Resend API key first.',
        );
      }

      throw new UserInputError(
        `The email could not be sent: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @Mutation(() => GraphQLJSON)
  async pulseEnrollInSequence(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: AuthContextUser,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('sequenceId', { type: () => String }) sequenceId: string,
    @Args('personIds', { type: () => [String], nullable: true })
    personIds: string[] | null,
    @Args('companyIds', { type: () => [String], nullable: true })
    companyIds: string[] | null,
  ) {
    try {
      return await this.pulseSequenceService.enroll({
        workspaceId: workspace.id,
        sequenceId,
        personIds: personIds ?? [],
        companyIds: companyIds ?? [],
        sender: toSender(user, workspaceMemberId),
      });
    } catch (error) {
      if (error instanceof PulseSequenceNotFoundError) {
        throw new UserInputError(error.message);
      }

      throw error;
    }
  }

  @Query(() => GraphQLJSON)
  async pulseSequenceEnrollments(@AuthWorkspace() workspace: WorkspaceEntity) {
    return this.pulseSequenceService.listEnrollments(workspace.id);
  }

  @Mutation(() => Boolean)
  async pulseStopEnrollment(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('enrollmentId', { type: () => String }) enrollmentId: string,
  ) {
    return this.pulseSequenceService.stop(workspace.id, enrollmentId);
  }
}
