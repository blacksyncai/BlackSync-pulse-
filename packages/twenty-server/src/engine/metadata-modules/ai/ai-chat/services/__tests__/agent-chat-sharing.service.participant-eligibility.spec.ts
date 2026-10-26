import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { MetadataReadability } from 'twenty-shared/types';

import {
  RecordShareException,
  RecordShareExceptionCode,
} from 'src/engine/core-modules/record-share/record-share.exception';
import { AgentChatSharingService } from 'src/engine/metadata-modules/ai/ai-chat/services/agent-chat-sharing.service';
import {
  AiException,
  AiExceptionCode,
} from 'src/engine/metadata-modules/ai/ai.exception';

const accessArguments = {
  workspaceId: 'workspace-id',
  workspaceMemberId: 'owner-id',
  threadId: 'thread-id',
};

const buildService = () => {
  const userAuthContextService = {
    resolveWorkspaceMember: jest
      .fn()
      .mockImplementation(async ({ workspaceMemberId }) => ({
        workspace: { id: 'workspace-id' },
        workspaceMemberId,
        userWorkspaceId: `${workspaceMemberId}-user-workspace`,
      })),
  };
  const recordSharingService = {
    getSharing: jest.fn().mockResolvedValue({ canManageSharing: true }),
    setShare: jest.fn(),
  };
  const workspaceCacheService = {
    getOrRecompute: jest.fn().mockResolvedValue({
      featureFlagsMap: {},
      flatFieldMetadataMaps: {
        byUniversalIdentifier: {
          [STANDARD_OBJECTS.agentChatThread.fields.isAssistantParticipant
            .universalIdentifier]: { id: 'assistant-participant-field-id' },
        },
      },
    }),
  };
  const permissionsService = {
    userHasWorkspaceSettingPermission: jest.fn().mockResolvedValue(true),
  };
  const repository = {
    isObjectOperationPermittedByRole: jest.fn().mockResolvedValue(true),
  };
  const workspaceOrmManager = {
    executeInWorkspaceContext: jest.fn(async (work) => work()),
    getRepositoryWithContextPermissions: () => repository,
    runInWorkspaceTransaction: jest.fn(async (work) => work({})),
  };
  const recordSharePrincipalService = {
    assertPrincipalsReachRecordsOrThrow: jest.fn().mockResolvedValue(undefined),
  };
  const service = new AgentChatSharingService(
    {} as never,
    userAuthContextService as never,
    {} as never,
    recordSharingService as never,
    workspaceCacheService as never,
    permissionsService as never,
    workspaceOrmManager as never,
    {} as never,
    recordSharePrincipalService as never,
  );
  jest
    .spyOn(
      service as unknown as {
        getThreadObjectMetadata: () => Promise<unknown>;
      },
      'getThreadObjectMetadata',
    )
    .mockResolvedValue({
      id: 'thread-object-metadata-id',
      nameSingular: 'agentChatThread',
      readability: MetadataReadability.PRIVATE,
      isSystem: true,
    });

  return {
    service,
    userAuthContextService,
    recordSharingService,
    workspaceCacheService,
    permissionsService,
    repository,
    recordSharePrincipalService,
  };
};

describe('AgentChatSharingService participant eligibility', () => {
  it('excludes a member outside this workspace before reply selection', async () => {
    const { service, userAuthContextService } = buildService();
    userAuthContextService.resolveWorkspaceMember.mockImplementation(
      async ({ workspaceMemberId }) => {
        if (workspaceMemberId === 'foreign-member') {
          throw new AiException(
            'Member not found',
            AiExceptionCode.THREAD_NOT_FOUND,
          );
        }

        return {
          workspace: { id: 'workspace-id' },
          workspaceMemberId,
          userWorkspaceId: `${workspaceMemberId}-user-workspace`,
        };
      },
    );

    await expect(
      service.findEligibleParticipantWorkspaceMemberIds({
        ...accessArguments,
        memberIds: ['foreign-member', 'eligible-member'],
      }),
    ).resolves.toEqual(['eligible-member']);
  });

  it('excludes recipients without AI access or a role that allows replying', async () => {
    const { service, permissionsService, repository } = buildService();
    permissionsService.userHasWorkspaceSettingPermission.mockImplementation(
      async ({ userWorkspaceId }) =>
        userWorkspaceId !== 'no-ai-member-user-workspace',
    );
    repository.isObjectOperationPermittedByRole.mockResolvedValue(false);

    await expect(
      service.findEligibleParticipantWorkspaceMemberIds({
        ...accessArguments,
        memberIds: ['no-ai-member', 'read-only-member'],
      }),
    ).resolves.toEqual([]);
  });

  it('checks role row access without creating shares during reply selection', async () => {
    const { service, recordSharePrincipalService, recordSharingService } =
      buildService();

    await expect(
      service.findEligibleParticipantWorkspaceMemberIds({
        ...accessArguments,
        memberIds: ['recipient', 'recipient'],
      }),
    ).resolves.toEqual(['recipient']);

    expect(
      recordSharePrincipalService.assertPrincipalsReachRecordsOrThrow,
    ).toHaveBeenCalledTimes(1);
    expect(recordSharingService.setShare).not.toHaveBeenCalled();
  });

  it('excludes a recipient whose role row restrictions prevent sharing the chat', async () => {
    const { service, recordSharePrincipalService } = buildService();
    recordSharePrincipalService.assertPrincipalsReachRecordsOrThrow.mockRejectedValue(
      new RecordShareException(
        'Recipient cannot reach this record',
        RecordShareExceptionCode.INVALID_SHARE_WITH,
      ),
    );

    await expect(
      service.findEligibleParticipantWorkspaceMemberIds({
        ...accessArguments,
        memberIds: ['restricted-recipient'],
      }),
    ).resolves.toEqual([]);
  });

  it('requires existing reply access when the sender cannot manage sharing', async () => {
    const { service, recordSharingService } = buildService();
    recordSharingService.getSharing.mockResolvedValue({
      canManageSharing: false,
    });
    jest
      .spyOn(service, 'getThreadWithAccess')
      .mockRejectedValue(
        new AiException('Thread not found', AiExceptionCode.THREAD_NOT_FOUND),
      );

    await expect(
      service.findEligibleParticipantWorkspaceMemberIds({
        ...accessArguments,
        memberIds: ['inaccessible-recipient'],
      }),
    ).resolves.toEqual([]);
  });

  it('fences participation until the workspace schema includes its required field', async () => {
    const { service, workspaceCacheService } = buildService();
    workspaceCacheService.getOrRecompute.mockResolvedValue({
      flatFieldMetadataMaps: { byUniversalIdentifier: {} },
    });

    await expect(
      service.assertAssistantParticipationAvailable('workspace-id'),
    ).rejects.toMatchObject({
      code: AiExceptionCode.CHAT_PARTICIPATION_UNAVAILABLE,
    });
  });
});
