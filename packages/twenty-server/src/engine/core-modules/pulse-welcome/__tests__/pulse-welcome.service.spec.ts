import { Logger } from '@nestjs/common';
import { type EntityManager, type Repository } from 'typeorm';
import { KeyValuePairEntity } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import {
  PULSE_WELCOME_KEY,
  PulseWelcomeService,
} from '../services/pulse-welcome.service';

type Row = {
  id: string;
  userId: string;
  key: string;
  value: { status: string; queuedAt?: string };
};
const makeFixture = () => {
  let rows: Row[] = [];
  let locked = false;
  const users = new Map([
    [
      'user-1',
      {
        id: 'user-1',
        firstName: 'Alex',
        email: 'alex@gmail.com',
        locale: 'en',
      },
    ],
    [
      'user-2',
      {
        id: 'user-2',
        firstName: 'Sam',
        email: 'sam@outlook.com',
        locale: 'en',
      },
    ],
  ]);
  const configValues: Record<string, string> = {
    EMAIL_DRIVER: 'SMTP',
    EMAIL_FROM_ADDRESS: 'crm@blacksync.ai',
    EMAIL_FROM_NAME: 'BlackSync Cloud',
  };
  const email = { send: jest.fn().mockResolvedValue(undefined) };
  const matches = (row: Row, parameters: Record<string, unknown>) =>
    row.key === PULSE_WELCOME_KEY &&
    row.value.status === 'pending' &&
    (!parameters.userId || row.userId === parameters.userId) &&
    (!parameters.id || row.id === parameters.id);
  const repository = {
    manager: {} as EntityManager,
    createQueryBuilder: jest.fn(() => {
      const parameters: Record<string, unknown> = {};
      let insertValue: Partial<Row> = {};
      const query = {
        where: jest.fn((_sql: string, input: Record<string, unknown>) => {
          Object.assign(parameters, input);
          return query;
        }),
        andWhere: jest.fn((_sql: string, input?: Record<string, unknown>) => {
          Object.assign(parameters, input);
          return query;
        }),
        orderBy: jest.fn(() => query),
        take: jest.fn(() => query),
        setLock: jest.fn(() => query),
        setOnLocked: jest.fn(() => query),
        getMany: jest.fn(async () =>
          rows.filter((row) => matches(row, parameters)),
        ),
        getOne: jest.fn(async () =>
          locked
            ? null
            : (rows.find((row) => matches(row, parameters)) ?? null),
        ),
        insert: jest.fn(() => query),
        values: jest.fn((value) => {
          insertValue = value;
          return query;
        }),
        orIgnore: jest.fn(() => query),
        execute: jest.fn(async () => {
          if (!rows.some((row) => row.userId === insertValue.userId))
            rows.push({
              ...insertValue,
              id: 'marker-' + insertValue.userId,
            } as Row);
        }),
      };
      return query;
    }),
    update: jest.fn(async (id: string, patch: Partial<Row>) => {
      rows = rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
    }),
  };
  const userRepository = {
    findOne: jest.fn(
      async ({ where }: { where: { id: string } }) =>
        users.get(where.id) ?? null,
    ),
  };
  const manager = {
    getRepository: jest.fn((entity) =>
      entity === UserEntity ? userRepository : repository,
    ),
    save: jest.fn(),
    transaction: jest.fn(
      async (callback: (manager: EntityManager) => Promise<unknown>) => {
        const snapshot = JSON.parse(JSON.stringify(rows)) as Row[];
        try {
          return await callback(manager as unknown as EntityManager);
        } catch (error) {
          rows = snapshot;
          throw error;
        }
      },
    ),
  };
  repository.manager = manager as unknown as EntityManager;
  const service = new PulseWelcomeService(
    repository as unknown as Repository<KeyValuePairEntity>,
    email as never,
    { get: (key: string) => configValues[key] } as never,
    { getBaseUrl: () => new URL('https://crm.blacksync.cloud/') } as never,
    {
      getI18nInstance: () => ({
        _: (descriptor: { id: string; message?: string }) =>
          descriptor.message ?? descriptor.id,
      }),
    } as never,
  );
  return {
    service,
    email,
    manager,
    users,
    configValues,
    getRows: () => rows,
    setLocked: () => {
      locked = true;
    },
  };
};

describe('welcome email lifecycle', () => {
  beforeEach(() =>
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined),
  );
  afterEach(() => jest.restoreAllMocks());
  it('creates a persistent marker once across account creation and joining', async () => {
    const f = makeFixture();
    await f.service.schedule('user-1', f.manager as unknown as EntityManager);
    await f.service.schedule('user-1', f.manager as unknown as EntityManager);
    expect(f.getRows()).toHaveLength(1);
    expect(f.email.send).not.toHaveBeenCalled();
  });
  it('uses the caller transaction, so a rolled-back signup has no welcome', async () => {
    const f = makeFixture();
    await expect(
      f.manager.transaction(async (manager) => {
        await f.service.schedule('user-1', manager);
        throw Error('signup rolled back');
      }),
    ).rejects.toThrow();
    expect(f.getRows()).toHaveLength(0);
    await f.service.dispatchPending();
    expect(f.email.send).not.toHaveBeenCalled();
  });
  it('sends to arbitrary recipient domains from the configured system address', async () => {
    const f = makeFixture();
    for (const id of f.users.keys())
      await f.service.schedule(id, f.manager as unknown as EntityManager);
    expect(await f.service.dispatchPending()).toBe(2);
    expect(f.email.send.mock.calls.map((call) => call[0].to)).toEqual([
      'alex@gmail.com',
      'sam@outlook.com',
    ]);
    expect(f.email.send.mock.calls[0][0]).toMatchObject({
      from: 'BlackSync Cloud <crm@blacksync.ai>',
      subject: 'Welcome to BlackSync Cloud',
    });
    expect(f.email.send.mock.calls[0][1]).toEqual({
      id: 'pulse-welcome-user-1',
      deduplication: { id: 'pulse-welcome-user-1' },
    });
  });
  it('does not send another welcome on retries or another join', async () => {
    const f = makeFixture();
    await f.service.schedule('user-1', f.manager as unknown as EntityManager);
    await f.service.queueForUser('user-1');
    await f.service.schedule('user-1', f.manager as unknown as EntityManager);
    await f.service.queueForUser('user-1');
    expect(f.email.send).toHaveBeenCalledTimes(1);
    expect(f.getRows()[0].value.status).toBe('queued');
  });
  it('only processes the newly joined user in the immediate path', async () => {
    const f = makeFixture();
    for (const id of f.users.keys())
      await f.service.schedule(id, f.manager as unknown as EntityManager);
    await f.service.queueForUser('user-2');
    expect(f.email.send).toHaveBeenCalledTimes(1);
    expect(f.email.send.mock.calls[0][0].to).toBe('sam@outlook.com');
    expect(f.getRows()[0].value.status).toBe('pending');
  });
  it('keeps failed work pending without failing signup, then retries it', async () => {
    const f = makeFixture();
    await f.service.schedule('user-1', f.manager as unknown as EntityManager);
    f.email.send.mockRejectedValueOnce(Error('queue unavailable'));
    await expect(f.service.queueForUser('user-1')).resolves.toBeUndefined();
    expect(f.getRows()[0].value.status).toBe('pending');
    await f.service.dispatchPending();
    expect(f.getRows()[0].value.status).toBe('queued');
  });
  it('does not roll back earlier users when a later queue request fails', async () => {
    const f = makeFixture();
    for (const id of f.users.keys())
      await f.service.schedule(id, f.manager as unknown as EntityManager);
    f.email.send
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(Error('queue unavailable'));
    await expect(f.service.dispatchPending()).rejects.toThrow();
    expect(f.getRows().map((row) => row.value.status)).toEqual([
      'queued',
      'pending',
    ]);
  });
  it('waits for real email configuration instead of consuming welcomes in logger mode', async () => {
    const f = makeFixture();
    await f.service.schedule('user-1', f.manager as unknown as EntityManager);
    f.configValues.EMAIL_DRIVER = 'LOGGER';
    expect(await f.service.dispatchPending()).toBe(0);
    expect(f.getRows()[0].value.status).toBe('pending');
    expect(f.email.send).not.toHaveBeenCalled();
  });
  it('skips deleted users and users without an email', async () => {
    const f = makeFixture();
    for (const id of f.users.keys())
      await f.service.schedule(id, f.manager as unknown as EntityManager);
    f.users.delete('user-1');
    f.users.get('user-2')!.email = '';
    expect(await f.service.dispatchPending()).toBe(0);
    expect(f.getRows().every((row) => row.value.status === 'skipped')).toBe(
      true,
    );
  });
  it('does not duplicate a marker claimed by another dispatcher', async () => {
    const f = makeFixture();
    await f.service.schedule('user-1', f.manager as unknown as EntityManager);
    f.setLocked();
    expect(await f.service.dispatchPending()).toBe(0);
    expect(f.email.send).not.toHaveBeenCalled();
  });
  it('does not backfill or email existing users merely because the service starts', async () => {
    const f = makeFixture();
    expect(await f.service.dispatchPending()).toBe(0);
    expect(f.email.send).not.toHaveBeenCalled();
  });
});
