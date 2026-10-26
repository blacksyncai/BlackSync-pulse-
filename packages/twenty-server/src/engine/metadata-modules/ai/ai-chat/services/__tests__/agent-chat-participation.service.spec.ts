import { Logger } from '@nestjs/common';

import { CacheLockService } from 'src/engine/core-modules/cache-lock/cache-lock.service';
import { AgentChatParticipationService } from 'src/engine/metadata-modules/ai/ai-chat/services/agent-chat-participation.service';

const participationArguments = {
  workspaceId: 'workspace-id',
  workspaceMemberId: 'member-id',
  threadId: 'thread-id',
  messageId: 'first-message-id',
  isAssistantMentioned: false,
  recipientWorkspaceMemberIds: ['recipient-id'],
};

const buildService = () => {
  const chatService = {
    hasMessage: jest.fn().mockResolvedValue(true),
  };
  const threadService = {
    isInitialMessage: jest.fn().mockResolvedValue(true),
    addAssistantParticipant: jest.fn(),
    addParticipants: jest.fn().mockResolvedValue(['recipient-id']),
  };
  const service = new AgentChatParticipationService(
    chatService as never,
    threadService as never,
    { withLock: jest.fn().mockImplementation((work) => work()) } as never,
  );

  return { service, chatService, threadService };
};

describe('AgentChatParticipationService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('holds concurrent sends until the first send has saved its Ada choice', async () => {
    let markSecondAttempted: () => void = () => undefined;
    let markFirstReleased: () => void = () => undefined;
    const secondAttempted = new Promise<void>((resolve) => {
      markSecondAttempted = resolve;
    });
    const firstReleased = new Promise<void>((resolve) => {
      markFirstReleased = resolve;
    });
    let isLocked = false;
    const cacheLockService = new CacheLockService({
      acquireLock: async () => {
        if (isLocked) {
          markSecondAttempted();

          return null;
        }

        isLocked = true;

        return 'owner-token';
      },
      releaseLock: async () => {
        isLocked = false;
        markFirstReleased();
      },
      extendLock: async () => true,
    } as never);
    jest
      .spyOn(cacheLockService, 'delay')
      .mockImplementation(() => firstReleased);
    const service = new AgentChatParticipationService(
      {} as never,
      {} as never,
      cacheLockService,
    );
    let isAssistantParticipant = true;
    const firstSend = service.runWithMessageLock({
      workspaceId: 'workspace-id',
      threadId: 'thread-id',
      work: async () => {
        await secondAttempted;
        isAssistantParticipant = false;
      },
    });
    const secondSend = service.runWithMessageLock({
      workspaceId: 'workspace-id',
      threadId: 'thread-id',
      work: async () => isAssistantParticipant,
    });

    await expect(secondSend).resolves.toBe(false);
    await firstSend;
  });

  it('leaves initial choices editable when sending fails before message acceptance', async () => {
    const { service, chatService, threadService } = buildService();
    chatService.hasMessage.mockResolvedValue(false);

    await service.recoverMessage(participationArguments);

    expect(threadService.isInitialMessage).not.toHaveBeenCalled();
    expect(threadService.addParticipants).not.toHaveBeenCalled();
    expect(threadService.addAssistantParticipant).not.toHaveBeenCalled();
    expect(chatService.hasMessage).toHaveBeenCalledWith({
      workspaceId: 'workspace-id',
      workspaceMemberId: 'member-id',
      threadId: 'thread-id',
      messageId: 'first-message-id',
    });
  });

  it('delivers recipients after the first accepted message without creating mentions', async () => {
    const { service, threadService } = buildService();

    await expect(
      service.completeMessage(participationArguments),
    ).resolves.toEqual(['recipient-id']);

    expect(threadService.isInitialMessage).toHaveBeenCalledWith({
      workspaceId: 'workspace-id',
      workspaceMemberId: 'member-id',
      threadId: 'thread-id',
      messageId: 'first-message-id',
    });
    expect(threadService.addParticipants).toHaveBeenCalledWith({
      workspaceId: 'workspace-id',
      workspaceMemberId: 'member-id',
      threadId: 'thread-id',
      participantWorkspaceMemberIds: ['recipient-id'],
      isMention: false,
    });
  });

  it('recovers participant state after a stored message fails during later publication', async () => {
    const { service, threadService } = buildService();

    await service.recoverMessage(participationArguments);

    expect(threadService.isInitialMessage).toHaveBeenCalled();
    expect(threadService.addParticipants).toHaveBeenCalled();
  });

  it('does not expose participant rows or add people on an ordinary send', async () => {
    const { service, threadService } = buildService();
    threadService.isInitialMessage.mockResolvedValue(false);

    await expect(
      service.completeMessage(participationArguments),
    ).resolves.toEqual([]);

    expect(threadService.addParticipants).not.toHaveBeenCalled();
  });

  it('adds Ada when an accepted message explicitly mentions Ada', async () => {
    const { service, threadService } = buildService();
    threadService.isInitialMessage.mockResolvedValue(false);

    await service.completeMessage({
      ...participationArguments,
      isAssistantMentioned: true,
    });

    expect(threadService.addAssistantParticipant).toHaveBeenCalledWith({
      workspaceId: 'workspace-id',
      workspaceMemberId: 'member-id',
      threadId: 'thread-id',
    });
  });

  it('preserves a later Ada join when the initial excluded-Ada message is replayed', async () => {
    const { service, threadService } = buildService();
    threadService.isInitialMessage
      .mockResolvedValueOnce(true)
      .mockResolvedValue(false);

    await service.completeMessage(participationArguments);
    await service.completeMessage({
      ...participationArguments,
      messageId: 'later-mentioned-message-id',
      isAssistantMentioned: true,
    });
    threadService.addAssistantParticipant.mockClear();
    threadService.addParticipants.mockClear();

    await service.completeMessage(participationArguments);

    expect(threadService.addAssistantParticipant).not.toHaveBeenCalled();
    expect(threadService.addParticipants).not.toHaveBeenCalled();
  });

  it('reports failed recipients without turning a stored message into a send failure', async () => {
    const { service, threadService } = buildService();
    threadService.addParticipants.mockRejectedValue(new Error('share failed'));
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    await expect(
      service.completeMessage(participationArguments),
    ).resolves.toEqual([]);
  });
});
