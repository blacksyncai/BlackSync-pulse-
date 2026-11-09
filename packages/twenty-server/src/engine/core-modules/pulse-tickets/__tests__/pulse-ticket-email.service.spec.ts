import { PulseTicketEmailService } from '../services/pulse-ticket-email.service';

const setup = () => {
  const rule = {
    channelId: '1cc32bfa-7a93-4c36-8ca1-04c1cc196abb',
    enabled: true,
    keywords: ['help'],
    enabledAt: '2026-11-09T00:00:00Z',
    cursorAt: '2026-11-09T00:00:00Z',
    cursorId: '00000000-0000-0000-0000-000000000000',
    userId: 'user',
    userWorkspaceId: 'membership',
  };
  const row = {
    id: 'rule',
    workspaceId: 'workspace',
    userId: 'user',
    value: rule,
  };
  const storage = {
    find: jest.fn().mockResolvedValue([row]),
    findOneByOrFail: jest
      .fn()
      .mockImplementation(async () => ({ ...row, value: { ...rule } })),
    update: jest.fn(),
    manager: { transaction: jest.fn() },
  };
  const manager = { query: jest.fn(), getRepository: () => storage };
  storage.manager.transaction.mockImplementation(async (work) => work(manager));
  const channels = {
    findOne: jest.fn().mockResolvedValue({
      isSyncEnabled: true,
      connectedAccount: { authFailedAt: null },
    }),
  };
  const users = {
    findOneBy: jest
      .fn()
      .mockResolvedValue({ id: 'user', email: 'owner@example.com' }),
  };
  const memberships = {
    findOneBy: jest.fn().mockResolvedValue({ id: 'membership' }),
  };
  const cache = {
    getOrRecompute: jest.fn().mockResolvedValue({
      flatWorkspaceMemberMaps: {
        idByUserId: { user: 'member' },
        byId: { member: { id: 'member' } },
      },
    }),
  };
  const association = {
    id: 'association',
    messageId: 'message',
    createdAt: new Date('2026-11-09T01:00:00.123Z'),
  };
  const message = {
    id: 'message',
    subject: 'Help with my project',
    text: 'PRIVATE BODY',
    receivedAt: new Date('2026-11-09T01:00:00Z'),
    messageThreadId: 'thread',
    isDraft: false,
  };
  const cursorQuery = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest
      .fn()
      .mockResolvedValue({ cursorAt: '2026-11-09T01:00:00.123456Z' }),
  };
  const associations = {
    find: jest.fn().mockResolvedValue([association]),
    createQueryBuilder: jest.fn().mockReturnValue(cursorQuery),
  };
  const messages = { findOneBy: jest.fn().mockResolvedValue(message) };
  const participants = {
    find: jest.fn().mockResolvedValue([{ personId: 'contact' }]),
  };
  const people = {
    findOneBy: jest.fn().mockResolvedValue({ companyId: 'client' }),
    find: jest.fn(),
  };
  const company = { findOneBy: jest.fn().mockResolvedValue({ id: 'client' }) };
  const tickets = {
    findOne: jest.fn().mockResolvedValue(null),
    insert: jest.fn(),
  };
  const repositories: Record<string, unknown> = {
    messageChannelMessageAssociation: associations,
    message: messages,
    messageParticipant: participants,
    person: people,
    company,
    clientTicket: tickets,
  };
  const orm = {
    getRepositoryWithContextPermissions: jest.fn(
      (name: string) => repositories[name],
    ),
    runInWorkspaceTransaction: jest.fn(async (work) =>
      work({ executeRawQuery: jest.fn() }),
    ),
    executeInWorkspaceContext: jest
      .fn()
      .mockImplementation(async (work) => work()),
  };
  const service = new PulseTicketEmailService(
    storage as never,
    users as never,
    memberships as never,
    channels as never,
    cache as never,
    orm as never,
  );
  return {
    service,
    rule,
    row,
    storage,
    channels,
    memberships,
    associations,
    messages,
    participants,
    people,
    tickets,
    orm,
    message,
  };
};

describe('client ticket email capture', () => {
  it('creates a scoped client ticket without copying the body', async () => {
    const context = setup();
    await context.service.scanWorkspace('workspace');
    expect(context.tickets.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Help with my project',
        status: 'NEW',
        source: 'EMAIL',
        clientId: 'client',
        assigneeId: 'member',
      }),
    );
    expect(JSON.stringify(context.tickets.insert.mock.calls)).not.toContain(
      'PRIVATE BODY',
    );
    expect(
      context.orm.executeInWorkspaceContext.mock.calls[0][1],
    ).toMatchObject({ type: 'user', userWorkspaceId: 'membership' });
    expect(context.participants.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { messageId: 'message', role: 'FROM' },
      }),
    );
    expect(
      context.associations.find.mock.calls[0][0].where.every(
        (condition: { direction: string }) =>
          condition.direction === 'INCOMING',
      ),
    ).toBe(true);
  });
  it('does not duplicate an existing or deleted thread ticket', async () => {
    const context = setup();
    context.tickets.findOne.mockResolvedValue({
      id: 'existing',
      deletedAt: new Date(),
    });
    await context.service.scanWorkspace('workspace');
    expect(context.tickets.insert).not.toHaveBeenCalled();
    expect(context.tickets.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ withDeleted: true }),
    );
  });
  it('uses the same ticket ID when retrying a failed cursor save', async () => {
    const context = setup();
    context.storage.update.mockRejectedValueOnce(new Error('retry'));
    await context.service.scanWorkspace('workspace');
    await context.service.scanWorkspace('workspace');
    expect(context.tickets.insert.mock.calls[0][0].id).toBe(
      context.tickets.insert.mock.calls[1][0].id,
    );
  });
  it('does not read email after membership removal', async () => {
    const context = setup();
    context.memberships.findOneBy.mockResolvedValue(null);
    await context.service.scanWorkspace('workspace');
    expect(context.orm.executeInWorkspaceContext).not.toHaveBeenCalled();
  });
  it('requires mailbox ownership again on every scan', async () => {
    const context = setup();
    context.channels.findOne.mockResolvedValue(null);
    await context.service.scanWorkspace('workspace');
    expect(context.orm.executeInWorkspaceContext).not.toHaveBeenCalled();
    expect(context.channels.findOne.mock.calls[0][0].where).toMatchObject({
      workspaceId: 'workspace',
      connectedAccount: { userWorkspaceId: 'membership' },
    });
  });
  it('does not scan disabled rules', async () => {
    const context = setup();
    context.rule.enabled = false;
    await context.service.scanWorkspace('workspace');
    expect(context.channels.findOne).not.toHaveBeenCalled();
  });
  it('does not create a ticket for an ambiguous client', async () => {
    const context = setup();
    context.participants.find.mockResolvedValue([
      { personId: 'first' },
      { personId: 'second' },
    ]);
    context.people.findOneBy
      .mockResolvedValueOnce({ companyId: 'first-client' })
      .mockResolvedValueOnce({ companyId: 'second-client' });
    await context.service.scanWorkspace('workspace');
    expect(context.tickets.insert).not.toHaveBeenCalled();
  });
  it('does not backfill old mail imported today', async () => {
    const context = setup();
    context.message.receivedAt = new Date('2026-11-08T00:00:00Z');
    await context.service.scanWorkspace('workspace');
    expect(context.tickets.insert).not.toHaveBeenCalled();
    expect(context.storage.update).toHaveBeenCalledWith(
      'rule',
      expect.objectContaining({
        value: expect.objectContaining({
          cursorAt: '2026-11-09T01:00:00.123456Z',
        }),
      }),
    );
  });
  it('preserves cursor for retry if record permissions reject ticket creation', async () => {
    const context = setup();
    context.tickets.insert.mockRejectedValue(new Error('forbidden'));
    await context.service.scanWorkspace('workspace');
    expect(context.storage.update).not.toHaveBeenCalled();
  });
});
