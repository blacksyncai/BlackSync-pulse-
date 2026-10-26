import {
  AiException,
  AiExceptionCode,
} from 'src/engine/metadata-modules/ai/ai.exception';
import { AgentChatResolver } from 'src/engine/metadata-modules/ai/ai-chat/resolvers/agent-chat.resolver';
import { AgentChatThreadLifecycleService } from 'src/engine/metadata-modules/ai/ai-chat/services/agent-chat-thread-lifecycle.service';
import { AgentChatService } from 'src/engine/metadata-modules/ai/ai-chat/services/agent-chat.service';
import { AgentChatQueueService } from 'src/engine/metadata-modules/ai/ai-chat/services/agent-chat-queue.service';
import { AgentChatThreadService } from 'src/engine/metadata-modules/ai/ai-chat/services/agent-chat-thread.service';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { AgentChatTurnPreflightService } from 'src/engine/metadata-modules/ai/ai-chat/services/agent-chat-turn-preflight.service';
import {
  TwentyOrmException,
  TwentyOrmExceptionCode,
} from 'src/engine/twenty-orm/exceptions/twenty-orm.exception';

const WORKSPACE_ID = 'workspace';
const THREAD_ID = 'thread';
const VIEWER_ID = 'viewer';
const workspace = { id: WORKSPACE_ID } as never;

const buildResolver = () => {
  const threadRepository = {
    existsBy: jest.fn().mockResolvedValue(true),
    findOne: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({ affected: 0 }),
    delete: jest.fn(),
  };
  const messages = {
    existsBy: jest.fn().mockResolvedValue(true),
    findOne: jest.fn().mockResolvedValue({ id: 'queued', threadId: THREAD_ID }),
    find: jest.fn(),
    delete: jest.fn(),
    query: jest.fn().mockResolvedValue([]),
  };
  const sharing = {
    assertAssistantParticipationAvailable: jest
      .fn()
      .mockResolvedValue(undefined),
    findEligibleParticipantWorkspaceMemberIds: jest
      .fn()
      .mockImplementation(async ({ memberIds }) => memberIds),
    createThread: jest.fn().mockResolvedValue({ id: THREAD_ID }),
    getAuthContext: jest.fn().mockResolvedValue({ userWorkspaceId: 'owner' }),
    getReadableThread: jest
      .fn()
      .mockResolvedValue({ id: THREAD_ID, workspaceMemberId: 'owner' }),
    getThreadWithAccess: jest
      .fn()
      .mockImplementation(async ({ workspaceMemberId }) => {
        if (workspaceMemberId !== 'owner')
          throw new AiException(
            'Thread not found',
            AiExceptionCode.THREAD_NOT_FOUND,
          );
        return {
          id: THREAD_ID,
          workspaceMemberId: 'owner',
          workspaceId: WORKSPACE_ID,
          isAssistantParticipant: true,
        };
      }),
    restoreThreadWithAccess: jest
      .fn()
      .mockRejectedValue(
        new AiException('Thread not found', AiExceptionCode.THREAD_NOT_FOUND),
      ),
  };
  const recordEvents = {
    emitThreadCreated: jest.fn(),
    emitThreadUpdated: jest.fn(),
  };
  const threadService = new AgentChatThreadService(
    threadRepository as never,
    sharing as never,
    recordEvents as never,
    {
      recordMemberActivity: jest.fn().mockResolvedValue({
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      }),
      emitParticipantCreated: jest.fn(),
    } as never,
    {} as never,
    {} as never,
  );
  jest
    .spyOn(threadService, 'setInitialAssistantParticipation')
    .mockResolvedValue(undefined);
  const chatService = new AgentChatService(
    threadRepository as never,
    { find: jest.fn().mockResolvedValue([]) } as never,
    messages as never,
    {} as never,
    sharing as never,
    recordEvents as never,
    {} as never,
    threadService,
  );
  const streaming = {
    streamAgentChat: jest
      .fn()
      .mockResolvedValue({ queued: false, messageId: 'message' }),
    saveMessageWithoutReply: jest
      .fn()
      .mockResolvedValue({ messageId: 'message' }),
  };
  const streamRecovery = { reapDeadStream: jest.fn().mockResolvedValue(null) };
  const events = {
    publish: jest.fn(),
    getAccumulatedChunks: jest
      .fn()
      .mockResolvedValue({ chunks: [], maxSeq: 0 }),
  };
  const redis = { getClient: jest.fn() };
  const featureFlags = {
    isFeatureEnabled: jest.fn().mockResolvedValue(true),
  };
  const threadLifecycle = new AgentChatThreadLifecycleService(
    threadRepository as never,
    redis as never,
    {} as never,
    recordEvents as never,
    {} as never,
    {} as never,
  );
  const messageReactions = {
    findReactionsByMessageId: jest.fn().mockResolvedValue(new Map()),
  };
  const replyPolicy = {
    shouldReply: jest.fn().mockResolvedValue(true),
  };
  const participation = {
    runWithMessageLock: jest.fn().mockImplementation(({ work }) => work()),
    completeMessage: jest.fn().mockResolvedValue([]),
    recoverMessage: jest.fn().mockResolvedValue(undefined),
  };
  const queueService = new AgentChatQueueService(
    {} as never,
    messages as never,
    {} as never,
    {} as never,
    {} as never,
    threadService,
  );
  const resolver = new AgentChatResolver(
    chatService,
    queueService,
    threadService,
    sharing as never,
    streaming as never,
    streamRecovery as never,
    events as never,
    {} as never,
    new AgentChatTurnPreflightService(
      {
        getAvailableModels: () => ['model'],
        validateModelAvailability: jest.fn(),
      } as never,
      threadService,
      { assertAiExecutionAllowed: jest.fn() } as never,
    ),
    threadLifecycle,
    { findLatestTurnError: jest.fn().mockResolvedValue(null) } as never,
    {
      getOrRecompute: jest.fn().mockResolvedValue({
        flatWorkspaceMemberMaps: {
          byId: { 'sender-member': { userId: 'sender-user' } },
          userWorkspaceIdByUserId: { 'sender-user': 'sender-user-workspace' },
        },
      }),
    } as never,
    featureFlags as never,
    messageReactions as never,
    replyPolicy as never,
    participation as never,
  );
  return {
    resolver,
    chatService,
    threadService,
    threadRepository,
    featureFlags,
    messages,
    sharing,
    streaming,
    events,
    redis,
    recordEvents,
    replyPolicy,
    participation,
  };
};

const sendWithParticipation = ({
  resolver,
  isAssistantParticipant = true,
  isAssistantMentioned = false,
  mentionedWorkspaceMemberIds = [],
  recipientWorkspaceMemberIds = [],
}: {
  resolver: AgentChatResolver;
  isAssistantParticipant?: boolean;
  isAssistantMentioned?: boolean;
  mentionedWorkspaceMemberIds?: string[];
  recipientWorkspaceMemberIds?: string[];
}) =>
  resolver.sendChatMessage(
    THREAD_ID,
    'Can you help?',
    'message',
    null,
    undefined,
    null,
    mentionedWorkspaceMemberIds,
    null,
    'owner-user',
    'owner',
    workspace,
    true,
    isAssistantParticipant,
    isAssistantMentioned,
    recipientWorkspaceMemberIds,
  );

describe('AgentChatResolver assistant participation', () => {
  it('uses current draft choices when a previous first send left an empty thread', async () => {
    const context = buildResolver();
    context.messages.existsBy.mockResolvedValue(false);
    context.replyPolicy.shouldReply.mockResolvedValue(false);

    await sendWithParticipation({
      resolver: context.resolver,
      isAssistantParticipant: false,
    });

    expect(context.replyPolicy.shouldReply).toHaveBeenCalledWith(
      expect.objectContaining({
        thread: expect.objectContaining({ isAssistantParticipant: false }),
      }),
    );
    expect(context.streaming.saveMessageWithoutReply).toHaveBeenCalled();
    expect(
      context.threadService.setInitialAssistantParticipation,
    ).toHaveBeenCalledWith({
      threadId: THREAD_ID,
      workspaceId: WORKSPACE_ID,
      workspaceMemberId: 'owner',
      isAssistantParticipant: false,
    });
  });

  it('counts only validated mentions and initial recipients for reply selection', async () => {
    const context = buildResolver();
    context.messages.existsBy.mockResolvedValue(false);
    context.sharing.findEligibleParticipantWorkspaceMemberIds.mockResolvedValue(
      ['eligible-recipient'],
    );

    await sendWithParticipation({
      resolver: context.resolver,
      mentionedWorkspaceMemberIds: ['foreign-member'],
      recipientWorkspaceMemberIds: ['eligible-recipient'],
    });

    expect(context.replyPolicy.shouldReply).toHaveBeenCalledWith(
      expect.objectContaining({
        additionalWorkspaceMemberIds: ['eligible-recipient'],
        workspaceMemberId: 'owner',
      }),
    );
  });

  it('completes participant delivery after the message is accepted', async () => {
    const context = buildResolver();
    context.participation.completeMessage.mockResolvedValue(['recipient']);
    context.streaming.streamAgentChat.mockImplementation(async () => {
      expect(context.participation.completeMessage).not.toHaveBeenCalled();

      return { queued: false, messageId: 'message' };
    });

    const result = await sendWithParticipation({
      resolver: context.resolver,
      recipientWorkspaceMemberIds: ['recipient'],
    });

    expect(result.recipientParticipantWorkspaceMemberIds).toEqual([
      'recipient',
    ]);
    expect(context.participation.completeMessage).toHaveBeenCalledWith(
      expect.objectContaining({ recipientWorkspaceMemberIds: ['recipient'] }),
    );
  });

  it('preserves the send failure and recovers any message already accepted', async () => {
    const context = buildResolver();
    const sendError = new Error('queue publication failed');
    context.streaming.streamAgentChat.mockRejectedValue(sendError);

    await expect(
      sendWithParticipation({ resolver: context.resolver }),
    ).rejects.toBe(sendError);

    expect(context.participation.recoverMessage).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: 'message' }),
    );
    expect(context.participation.completeMessage).not.toHaveBeenCalled();
  });

  it('allows a changed first-message Ada selection after a failed send', async () => {
    const context = buildResolver();
    context.messages.existsBy.mockResolvedValue(false);
    context.replyPolicy.shouldReply
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);
    context.streaming.saveMessageWithoutReply.mockRejectedValueOnce(
      new Error('message storage failed'),
    );

    await expect(
      sendWithParticipation({
        resolver: context.resolver,
        isAssistantParticipant: false,
      }),
    ).rejects.toThrow('message storage failed');

    await sendWithParticipation({
      resolver: context.resolver,
      isAssistantParticipant: true,
    });

    expect(context.replyPolicy.shouldReply).toHaveBeenLastCalledWith(
      expect.objectContaining({
        thread: expect.objectContaining({ isAssistantParticipant: true }),
      }),
    );
    expect(context.streaming.streamAgentChat).toHaveBeenCalledTimes(1);
  });

  it('preserves legacy reply dispatch when the explicit mention signal is absent', async () => {
    const context = buildResolver();
    context.replyPolicy.shouldReply.mockResolvedValue(false);

    await context.resolver.sendChatMessage(
      THREAD_ID,
      '@Ada can you help?',
      'message',
      null,
      undefined,
      null,
      [],
      null,
      'owner-user',
      'owner',
      workspace,
      true,
    );

    expect(context.replyPolicy.shouldReply).not.toHaveBeenCalled();
    expect(context.streaming.streamAgentChat).toHaveBeenCalled();
  });

  it('uses server reply selection when the client explicitly reports no Ada mention', async () => {
    const context = buildResolver();
    context.replyPolicy.shouldReply.mockResolvedValue(false);

    await sendWithParticipation({ resolver: context.resolver });

    expect(context.replyPolicy.shouldReply).toHaveBeenCalled();
    expect(context.streaming.streamAgentChat).not.toHaveBeenCalled();
    expect(context.streaming.saveMessageWithoutReply).toHaveBeenCalled();
  });

  it.each([
    { hasMessages: true, initialSelection: true },
    { hasMessages: false, initialSelection: false },
  ])(
    'keeps Ada excluded for a cached client when hasMessages is $hasMessages',
    async ({ hasMessages, initialSelection }) => {
      const context = buildResolver();
      context.messages.existsBy.mockResolvedValue(hasMessages);
      context.sharing.getThreadWithAccess.mockResolvedValue({
        id: THREAD_ID,
        workspaceMemberId: 'owner',
        workspaceId: WORKSPACE_ID,
        isAssistantParticipant: false,
      });

      await context.resolver.sendChatMessage(
        THREAD_ID,
        'Can another person take this?',
        'message',
        null,
        undefined,
        null,
        [],
        null,
        'owner-user',
        'owner',
        workspace,
        true,
        initialSelection,
      );

      expect(context.replyPolicy.shouldReply).not.toHaveBeenCalled();
      expect(context.streaming.streamAgentChat).not.toHaveBeenCalled();
      expect(context.streaming.saveMessageWithoutReply).toHaveBeenCalled();
    },
  );
});

describe('Shared conversation API boundaries', () => {
  it('does not announce a restore when the transaction rolls back', async () => {
    const context = buildResolver();
    context.threadRepository.findOne.mockResolvedValue({
      id: THREAD_ID,
      workspaceMemberId: 'owner',
      workspaceId: WORKSPACE_ID,
      deletedAt: '2026-09-01T00:00:00.000Z',
    });
    context.sharing.restoreThreadWithAccess.mockRejectedValue(
      new Error('restore failed'),
    );
    await expect(
      context.threadService.restoreThread({
        threadId: THREAD_ID,
        workspaceMemberId: 'owner',
        workspaceId: WORKSPACE_ID,
      }),
    ).rejects.toThrow('restore failed');
    expect(context.recordEvents.emitThreadUpdated).not.toHaveBeenCalled();
  });

  it('restores a soft deleted conversation before sending to it', async () => {
    const { resolver, sharing, streaming, recordEvents, threadRepository } =
      buildResolver();
    const deletedThread = {
      id: THREAD_ID,
      workspaceMemberId: 'owner',
      workspaceId: WORKSPACE_ID,
      isAssistantParticipant: true,
      deletedAt: '2026-09-01T00:00:00.000Z',
    };
    sharing.getThreadWithAccess.mockResolvedValue(deletedThread);
    threadRepository.findOne.mockResolvedValue(deletedThread);
    sharing.restoreThreadWithAccess.mockResolvedValue({
      ...deletedThread,
      deletedAt: null,
    });
    await resolver.sendChatMessage(
      THREAD_ID,
      'Pick this back up',
      'message',
      null,
      undefined,
      null,
      null,
      null,
      VIEWER_ID,
      'member',
      workspace,
    );
    expect(sharing.restoreThreadWithAccess).toHaveBeenCalledWith({
      threadId: THREAD_ID,
      workspaceMemberId: 'member',
      workspaceId: WORKSPACE_ID,
    });
    expect(recordEvents.emitThreadUpdated).toHaveBeenCalledWith(
      expect.objectContaining({
        threadBefore: deletedThread,
        action: DatabaseEventAction.RESTORED,
      }),
    );
    expect(streaming.streamAgentChat).toHaveBeenCalled();
  });

  it('creates the thread of a new chat on its first message', async () => {
    const { resolver, sharing, threadRepository, streaming } = buildResolver();
    threadRepository.existsBy.mockResolvedValue(false);
    await resolver.sendChatMessage(
      THREAD_ID,
      'Hello',
      'message',
      null,
      undefined,
      null,
      null,
      null,
      'member-workspace',
      'owner',
      workspace,
    );
    expect(sharing.createThread).toHaveBeenCalledWith({
      id: THREAD_ID,
      workspaceMemberId: 'owner',
      workspaceId: WORKSPACE_ID,
    });
    expect(streaming.streamAgentChat).toHaveBeenCalled();
  });

  it('does not let a new chat id take over a thread created concurrently by someone else', async () => {
    const { resolver, sharing, threadRepository, streaming } = buildResolver();
    threadRepository.existsBy.mockResolvedValue(false);
    sharing.createThread.mockRejectedValue(
      new TwentyOrmException(
        'Duplicate',
        TwentyOrmExceptionCode.DUPLICATE_ENTRY_DETECTED,
      ),
    );
    await expect(
      resolver.sendChatMessage(
        THREAD_ID,
        'Hello',
        'message',
        null,
        undefined,
        null,
        null,
        null,
        'viewer-workspace',
        VIEWER_ID,
        workspace,
      ),
    ).rejects.toMatchObject({ code: 'THREAD_NOT_FOUND' });
    expect(streaming.streamAgentChat).not.toHaveBeenCalled();
  });

  it('returns readable threads and catchup to viewers without granting ownership', async () => {
    const { resolver } = buildResolver();
    const thread = await resolver.chatThread(THREAD_ID, VIEWER_ID, workspace);
    expect(thread).toMatchObject({ id: THREAD_ID });
    expect(thread).not.toHaveProperty('permissions');
    await expect(
      resolver.chatStreamCatchupChunks(THREAD_ID, VIEWER_ID, workspace),
    ).resolves.toMatchObject({ chunks: [] });
  });

  it.each(['send', 'restore', 'deleteQueued'] as const)(
    'rejects %s from a viewer without mutating or executing',
    async (operation) => {
      const context = buildResolver();
      const { resolver } = context;
      const operations = {
        send: () =>
          resolver.sendChatMessage(
            THREAD_ID,
            'Execute a tool',
            'message',
            null,
            undefined,
            null,
            null,
            null,
            VIEWER_ID,
            'member',
            workspace,
          ),
        restore: () =>
          context.threadService.restoreThread({
            threadId: THREAD_ID,
            workspaceMemberId: VIEWER_ID,
            workspaceId: WORKSPACE_ID,
          }),
        deleteQueued: () =>
          resolver.deleteQueuedChatMessage('queued', VIEWER_ID, workspace),
      };
      await expect(operations[operation]()).rejects.toMatchObject({
        code: 'THREAD_NOT_FOUND',
      });
      if (operation === 'deleteQueued') {
        expect(context.sharing.getThreadWithAccess).toHaveBeenCalledWith(
          expect.objectContaining({
            workspaceMemberId: VIEWER_ID,
            operationType: 'update',
          }),
        );
      }
      expect(context.threadRepository.update).not.toHaveBeenCalled();
      expect(context.threadRepository.delete).not.toHaveBeenCalled();
      expect(context.recordEvents.emitThreadUpdated).not.toHaveBeenCalled();
      expect(context.messages.delete).not.toHaveBeenCalled();
      expect(context.streaming.streamAgentChat).not.toHaveBeenCalled();
      expect(context.events.publish).not.toHaveBeenCalled();
      expect(context.redis.getClient).not.toHaveBeenCalled();
    },
  );

  it('passes the editing participant identity to execution', async () => {
    const { resolver, sharing, streaming } = buildResolver();
    sharing.getThreadWithAccess.mockResolvedValue({
      id: THREAD_ID,
      workspaceMemberId: 'owner',
      workspaceId: WORKSPACE_ID,
      isAssistantParticipant: true,
    });
    await resolver.sendChatMessage(
      THREAD_ID,
      'My request',
      'message',
      null,
      undefined,
      null,
      null,
      null,
      VIEWER_ID,
      'member',
      workspace,
    );
    expect(streaming.streamAgentChat).toHaveBeenCalledWith(
      expect.objectContaining({
        thread: expect.objectContaining({ id: THREAD_ID }),
        userWorkspaceId: VIEWER_ID,
        workspaceMemberId: 'member',
        text: 'My request',
      }),
    );
  });

  const sendWithAssistantOff = (resolver: AgentChatResolver) =>
    resolver.sendChatMessage(
      THREAD_ID,
      'Tim, can you take this one?',
      'message',
      null,
      undefined,
      null,
      ['tim'],
      null,
      'owner-user',
      'owner',
      workspace,
      false,
    );

  it('saves a message without starting a turn when the assistant is off', async () => {
    const { resolver, streaming } = buildResolver();

    const result = await sendWithAssistantOff(resolver);

    expect(streaming.saveMessageWithoutReply).toHaveBeenCalled();
    expect(streaming.streamAgentChat).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({ messageId: 'message', queued: false }),
    );
    expect(result.streamId).toBeUndefined();
  });

  it('still replies when the assistant is off but the inbox is not enabled', async () => {
    const { resolver, streaming, featureFlags } = buildResolver();

    featureFlags.isFeatureEnabled.mockResolvedValue(false);

    await sendWithAssistantOff(resolver);

    expect(streaming.streamAgentChat).toHaveBeenCalled();
    expect(streaming.saveMessageWithoutReply).not.toHaveBeenCalled();
  });

  it('adds the mentioned members once the message is sent', async () => {
    const { resolver, threadService, streaming } = buildResolver();
    const addParticipants = jest
      .spyOn(threadService, 'addParticipants')
      .mockResolvedValue(['jony']);

    const result = await resolver.sendChatMessage(
      THREAD_ID,
      'Can you look at this @Jony @Tim',
      'message',
      null,
      undefined,
      null,
      ['jony', 'tim'],
      null,
      'owner-user',
      'owner',
      workspace,
    );

    expect(streaming.streamAgentChat).toHaveBeenCalled();
    expect(addParticipants).toHaveBeenCalledWith({
      threadId: THREAD_ID,
      workspaceMemberId: 'owner',
      workspaceId: WORKSPACE_ID,
      participantWorkspaceMemberIds: ['jony', 'tim'],
    });
    expect(result.mentionedParticipantWorkspaceMemberIds).toEqual(['jony']);
  });

  it('keeps a sent message sent when its mentions cannot be applied', async () => {
    const { resolver, threadService } = buildResolver();

    jest
      .spyOn(threadService, 'addParticipants')
      .mockRejectedValue(new Error('share failed'));

    const result = await resolver.sendChatMessage(
      THREAD_ID,
      'Can you look at this @Jony',
      'message',
      null,
      undefined,
      null,
      ['jony'],
      null,
      'owner-user',
      'owner',
      workspace,
    );

    expect(result).toMatchObject({
      messageId: 'message',
      mentionedParticipantWorkspaceMemberIds: [],
    });
  });

  it('allows an editor to remove a queued message after update authorization', async () => {
    const { resolver, sharing, messages } = buildResolver();
    sharing.getThreadWithAccess.mockResolvedValue({
      id: THREAD_ID,
      workspaceMemberId: 'owner',
      workspaceId: WORKSPACE_ID,
    });
    messages.delete.mockResolvedValue({ affected: 1 });
    await resolver.deleteQueuedChatMessage('queued', VIEWER_ID, workspace);
    expect(sharing.getThreadWithAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceMemberId: VIEWER_ID,
        operationType: 'update',
      }),
    );
    expect(messages.delete).toHaveBeenCalled();
  });

  it('does not let ownership bypass a revoked update permission', async () => {
    const { threadService, sharing } = buildResolver();
    sharing.getThreadWithAccess.mockRejectedValue(
      new AiException('Thread not found', AiExceptionCode.THREAD_NOT_FOUND),
    );
    await expect(
      threadService.getWritableThread({
        threadId: THREAD_ID,
        workspaceMemberId: 'owner',
        workspaceId: WORKSPACE_ID,
      }),
    ).rejects.toMatchObject({ code: 'THREAD_NOT_FOUND' });
  });

  it('allows an authorized stop to be a no-op when the thread is idle', async () => {
    const { resolver, redis } = buildResolver();
    await expect(
      resolver.stopAgentChatStream(THREAD_ID, 'owner', workspace),
    ).resolves.toBe(true);
    expect(redis.getClient).not.toHaveBeenCalled();
  });

  it('does not cancel an owner stream when a viewer requests stop', async () => {
    const { resolver, redis, threadRepository } = buildResolver();
    await expect(
      resolver.stopAgentChatStream(THREAD_ID, VIEWER_ID, workspace),
    ).rejects.toMatchObject({ code: 'THREAD_NOT_FOUND' });
    expect(redis.getClient).not.toHaveBeenCalled();
    expect(threadRepository.update).not.toHaveBeenCalled();
  });

  it('names message senders by their membership for fronts cached from the release before', async () => {
    const { resolver, messages } = buildResolver();
    messages.find.mockResolvedValue([
      { id: 'from-member', senderWorkspaceMemberId: 'sender-member' },
      { id: 'from-agent', senderWorkspaceMemberId: null },
    ]);

    await expect(
      resolver.chatMessages(THREAD_ID, VIEWER_ID, workspace),
    ).resolves.toEqual([
      {
        id: 'from-member',
        senderWorkspaceMemberId: 'sender-member',
        senderUserWorkspaceId: 'sender-user-workspace',
        reactions: [],
      },
      {
        id: 'from-agent',
        senderWorkspaceMemberId: null,
        senderUserWorkspaceId: null,
        reactions: [],
      },
    ]);
  });

  it('does not read messages or catchup after access is revoked', async () => {
    const { resolver, messages, sharing, events } = buildResolver();
    sharing.getReadableThread.mockRejectedValue(new Error('access revoked'));
    await expect(
      resolver.chatMessages(THREAD_ID, VIEWER_ID, workspace),
    ).rejects.toThrow('access revoked');
    await expect(
      resolver.chatStreamCatchupChunks(THREAD_ID, VIEWER_ID, workspace),
    ).rejects.toThrow('access revoked');
    expect(messages.find).not.toHaveBeenCalled();
    expect(events.getAccumulatedChunks).not.toHaveBeenCalled();
  });
});
