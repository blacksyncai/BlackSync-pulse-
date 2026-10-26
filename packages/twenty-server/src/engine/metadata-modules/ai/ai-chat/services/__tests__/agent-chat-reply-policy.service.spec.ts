import { Logger } from '@nestjs/common';

import { UsageOperationType } from 'src/engine/core-modules/usage/enums/usage-operation-type.enum';
import { AgentChatReplyPolicyService } from 'src/engine/metadata-modules/ai/ai-chat/services/agent-chat-reply-policy.service';
import { type AgentChatThreadWorkspaceEntity } from 'src/engine/metadata-modules/ai/ai-history/standard-objects/agent-chat-thread.workspace-entity';

const replyArguments = {
  workspaceId: 'workspace-id',
  workspaceMemberId: 'member-id',
  userWorkspaceId: 'user-workspace-id',
  thread: {
    id: 'thread-id',
    isAssistantParticipant: true,
  } as AgentChatThreadWorkspaceEntity,
  additionalWorkspaceMemberIds: [],
  isAssistantMentioned: false,
  text: 'Can you help with this task?',
};

const buildService = () => {
  const participantService = {
    countMembers: jest.fn().mockResolvedValue(2),
  };
  const aiEvaluationService = {
    isAvailable: jest.fn().mockReturnValue(true),
    evaluate: jest.fn().mockResolvedValue({
      answers: {
        shouldAssistantReply: { type: 'boolean', probability: 0.8 },
      },
    }),
  };
  const conversationReaderService = {
    loadMessages: jest.fn().mockResolvedValue([]),
  };
  const service = new AgentChatReplyPolicyService(
    participantService as never,
    aiEvaluationService as never,
    conversationReaderService as never,
  );

  return {
    service,
    participantService,
    aiEvaluationService,
    conversationReaderService,
  };
};

describe('AgentChatReplyPolicyService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps Ada out of a conversation until explicitly mentioned', async () => {
    const { service, participantService, aiEvaluationService } = buildService();

    await expect(
      service.shouldReply({
        ...replyArguments,
        thread: { ...replyArguments.thread, isAssistantParticipant: false },
      }),
    ).resolves.toBe(false);

    expect(participantService.countMembers).not.toHaveBeenCalled();
    expect(aiEvaluationService.evaluate).not.toHaveBeenCalled();
  });

  it('always replies to the only person participating with Ada', async () => {
    const { service, participantService, aiEvaluationService } = buildService();
    participantService.countMembers.mockResolvedValue(1);

    await expect(service.shouldReply(replyArguments)).resolves.toBe(true);

    expect(participantService.countMembers).toHaveBeenCalledWith({
      workspaceId: 'workspace-id',
      threadId: 'thread-id',
      additionalWorkspaceMemberIds: ['member-id'],
    });
    expect(aiEvaluationService.evaluate).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    'uses the mention-only group default without JEV when mentioned is %s',
    async (isAssistantMentioned) => {
      const { service, aiEvaluationService } = buildService();
      aiEvaluationService.isAvailable.mockReturnValue(false);

      await expect(
        service.shouldReply({ ...replyArguments, isAssistantMentioned }),
      ).resolves.toBe(isAssistantMentioned);

      expect(aiEvaluationService.evaluate).not.toHaveBeenCalled();
    },
  );

  it.each([
    { probability: 0.49, shouldReply: false },
    { probability: 0.5, shouldReply: true },
  ])(
    'selects a group reply at JEV probability $probability',
    async ({ probability, shouldReply }) => {
      const { service, aiEvaluationService } = buildService();
      aiEvaluationService.evaluate.mockResolvedValue({
        answers: {
          shouldAssistantReply: { type: 'boolean', probability },
        },
      });

      await expect(service.shouldReply(replyArguments)).resolves.toBe(
        shouldReply,
      );
    },
  );

  it('evaluates an explicit group mention and replies even when JEV declines', async () => {
    const { service, aiEvaluationService } = buildService();
    aiEvaluationService.evaluate.mockResolvedValue({
      answers: {
        shouldAssistantReply: { type: 'boolean', probability: 0 },
      },
    });

    await expect(
      service.shouldReply({
        ...replyArguments,
        thread: { ...replyArguments.thread, isAssistantParticipant: false },
        isAssistantMentioned: true,
      }),
    ).resolves.toBe(true);

    expect(aiEvaluationService.evaluate).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])(
    'falls back to the mention rule when JEV fails and mentioned is %s',
    async (isAssistantMentioned) => {
      const { service, aiEvaluationService } = buildService();
      aiEvaluationService.evaluate.mockRejectedValue(new Error('JEV timeout'));
      jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

      await expect(
        service.shouldReply({ ...replyArguments, isAssistantMentioned }),
      ).resolves.toBe(isAssistantMentioned);
    },
  );

  it.each([{}, { shouldAssistantReply: { type: 'choice', choice: 'yes' } }])(
    'does not invoke Ada from a missing or incompatible evaluation answer',
    async (answers) => {
      const { service, aiEvaluationService } = buildService();
      aiEvaluationService.evaluate.mockResolvedValue({ answers });

      await expect(service.shouldReply(replyArguments)).resolves.toBe(false);
    },
  );

  it('evaluates actor-scoped conversation text with the latest human message', async () => {
    const { service, conversationReaderService, aiEvaluationService } =
      buildService();
    conversationReaderService.loadMessages.mockResolvedValue([
      { role: 'system', parts: [{ type: 'text', text: 'Private setup' }] },
      {
        role: 'assistant',
        parts: [{ type: 'text', text: 'What should I do?' }],
      },
    ]);

    await service.shouldReply({
      ...replyArguments,
      additionalWorkspaceMemberIds: ['another-member-id'],
    });

    expect(conversationReaderService.loadMessages).toHaveBeenCalledWith({
      workspaceId: 'workspace-id',
      threadId: 'thread-id',
      actor: { type: 'user', workspaceMemberId: 'member-id' },
    });
    expect(aiEvaluationService.evaluate).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace-id',
        userWorkspaceId: 'user-workspace-id',
        operationType: UsageOperationType.AI_CHAT_TOKEN,
        state: {
          conversation: [{ role: 'assistant', text: 'What should I do?' }],
          message: { text: replyArguments.text, isAssistantMentioned: false },
        },
      }),
    );
  });

  it('reevaluates the current participant count for each message', async () => {
    const { service, participantService, aiEvaluationService } = buildService();
    participantService.countMembers
      .mockResolvedValueOnce(1)
      .mockResolvedValue(2);
    aiEvaluationService.isAvailable.mockReturnValue(false);

    await expect(service.shouldReply(replyArguments)).resolves.toBe(true);
    await expect(service.shouldReply(replyArguments)).resolves.toBe(false);
  });
});
