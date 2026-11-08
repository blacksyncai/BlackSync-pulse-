import { PulseFormsService } from '../services/pulse-forms.service';
import { type StoredPulseForm } from '../utils/pulse-form-definition';

const formId = '00000000-0000-4000-8000-000000000001';
const submissionId = '00000000-0000-4000-8000-000000000002';
const viewId = '00000000-0000-4000-8000-000000000003';
const publisher = {
  workspaceId: 'workspace',
  userId: 'publisher',
  userWorkspaceId: 'membership',
};
const definition = (): StoredPulseForm => ({
  id: formId,
  userWorkspaceId: 'membership',
  revision: 1,
  title: 'Website',
  description: '',
  successMessage: 'Thanks',
  submitLabel: 'Send',
  published: true,
  fields: [{ key: 'email', label: 'Email', required: true }],
  pondValue: 'WEBSITE',
  pipelineViewId: viewId,
  stageValue: 'QUALIFIED',
});

type Insert = {
  object: string;
  value: Record<string, unknown> | Record<string, unknown>[];
};
const setup = () => {
  const form = definition();
  const row = {
    id: 'config',
    workspaceId: 'workspace',
    userId: 'publisher',
    value: form,
  };
  let committed: Insert[] = [];
  let pending: Insert[] = [];
  let receipt: Record<string, unknown> | undefined;
  let pendingReceipt: Record<string, unknown> | undefined;
  const peopleFind = jest.fn().mockResolvedValue([]);
  const companyFind = jest.fn().mockResolvedValue({ id: 'existing-company' });
  let failInsert: string | null = null;
  const memberships = {
    findOne: jest.fn().mockResolvedValue({ id: 'membership' }),
  };
  const storage = {
    findOne: jest.fn().mockImplementation(async () => row),
    find: jest.fn().mockResolvedValue([row]),
    manager: {
      transaction: jest.fn(
        async (callback: (manager: unknown) => Promise<unknown>) =>
          callback({ getRepository: () => storage }),
      ),
    },
    save: jest.fn(),
  };
  const metadata = {
    flatWorkspaceMemberMaps: {
      idByUserId: { publisher: 'member' },
      byId: { member: { id: 'member' } },
    },
    flatObjectMetadataMaps: {
      byId: {
        company: { id: 'company', nameSingular: 'company' },
        opportunity: { id: 'opportunity', nameSingular: 'opportunity' },
      },
    },
    flatFieldMetadataMaps: {
      byId: {
        pond: {
          id: 'pond',
          objectMetadataId: 'company',
          name: 'leadPond',
          type: 'SELECT',
          isActive: true,
          options: [{ value: 'WEBSITE' }],
        },
        stage: {
          id: 'stage',
          objectMetadataId: 'opportunity',
          name: 'salesStage',
          type: 'SELECT',
          isActive: true,
          options: [{ value: 'QUALIFIED' }],
        },
        pipeline: {
          id: 'pipeline',
          objectMetadataId: 'opportunity',
          name: 'pipeline',
          type: 'SELECT',
          isActive: true,
          options: [{ value: 'SALES' }],
        },
      },
    },
    flatViewMaps: {
      byId: {
        [viewId]: {
          id: viewId,
          objectMetadataId: 'opportunity',
          type: 'KANBAN',
          mainGroupByFieldMetadataId: 'stage',
        },
      },
    },
    flatViewFilterMaps: {
      byId: {
        filter: {
          id: 'filter',
          viewId,
          fieldMetadataId: 'pipeline',
          operand: 'IS',
          value: '["SALES"]',
        },
      },
    },
  };
  const transaction = {
    executeRawQuery: jest.fn(async (sql: string, parameters: unknown[]) => {
      if (sql.startsWith('SELECT value') && sql.includes('WHERE key'))
        return receipt ? [{ value: receipt }] : [];
      if (sql.startsWith('SELECT value')) return [{ value: form }];
      if (sql.startsWith('INSERT INTO'))
        pendingReceipt = JSON.parse(parameters[2] as string);
      return [];
    }),
  };
  const orm = {
    executeInWorkspaceContext: jest.fn(
      async (callback: () => Promise<unknown>, _context: unknown) => callback(),
    ),
    getRepositoryWithContextPermissions: jest.fn((object: string) => ({
      find: peopleFind,
      findOne: companyFind,
      insert: jest.fn(async (value: Insert['value']) => {
        if (object === failInsert) throw new Error('write denied');
        pending.push({ object, value });
      }),
    })),
    runInWorkspaceTransaction: jest.fn(
      async (callback: (transaction: unknown) => Promise<unknown>) => {
        pending = [];
        pendingReceipt = undefined;
        const result = await callback(transaction);
        committed.push(...pending);
        if (pendingReceipt) receipt = pendingReceipt;
        return result;
      },
    ),
  };
  const dependencies = [
    storage,
    { findOne: jest.fn().mockResolvedValue({ id: 'publisher' }) },
    memberships,
    { getOrRecompute: jest.fn().mockResolvedValue(metadata) },
    orm,
  ] as unknown as ConstructorParameters<typeof PulseFormsService>;
  const service = new PulseFormsService(...dependencies);
  return {
    service,
    form,
    row,
    storage,
    orm,
    transaction,
    metadata,
    memberships,
    peopleFind,
    companyFind,
    writes: () => committed,
    fail: (object: string) => {
      failInsert = object;
    },
  };
};

describe('form routing and receipt transactions', () => {
  it('routes only to the saved pond, pipeline and custom stage under publisher permissions', async () => {
    const fixture = setup();
    expect(
      await fixture.service.submit(formId, submissionId, {
        email: 'ann@example.com',
        pondValue: 'ATTACKER',
        workspaceId: 'other',
      }),
    ).toEqual({ success: true });
    const writes = fixture.writes();
    expect(
      writes.find((write) => write.object === 'company')?.value,
    ).toMatchObject({ leadPond: 'WEBSITE', accountOwnerId: null });
    expect(
      writes.find((write) => write.object === 'opportunity')?.value,
    ).toMatchObject({
      pipeline: 'SALES',
      salesStage: 'QUALIFIED',
      ownerId: null,
    });
    expect(
      fixture.orm.executeInWorkspaceContext.mock.calls[0][1],
    ).toMatchObject({
      type: 'user',
      workspace: { id: 'workspace' },
      userWorkspaceId: 'membership',
    });
    expect(
      fixture.orm.getRepositoryWithContextPermissions,
    ).toHaveBeenCalledWith('person', fixture.transaction);
    expect(
      writes.find((write) => write.object === 'noteTarget')?.value,
    ).toHaveLength(3);
  });
  it('does not create a second lead, deal or note when the same browser POST is retried', async () => {
    const fixture = setup();
    await fixture.service.submit(formId, submissionId, {
      email: 'ann@example.com',
    });
    const count = fixture.writes().length;
    await fixture.service.submit(formId, submissionId, {
      email: 'ann@example.com',
    });
    expect(fixture.writes()).toHaveLength(count);
    await expect(
      fixture.service.submit(formId, submissionId, {
        email: 'different@example.com',
      }),
    ).rejects.toThrow('Submission ID already used');
  });
  it('commits neither the records nor the receipt if a later write fails', async () => {
    const fixture = setup();
    fixture.fail('noteTarget');
    await expect(
      fixture.service.submit(formId, submissionId, {
        email: 'ann@example.com',
      }),
    ).rejects.toThrow('write denied');
    expect(fixture.writes()).toEqual([]);
    expect(
      fixture.transaction.executeRawQuery.mock.calls.some(([query]) =>
        query.startsWith('INSERT INTO'),
      ),
    ).toBe(false);
  });
  it('preserves an existing contact and its company instead of moving it into the form pond', async () => {
    const fixture = setup();
    fixture.peopleFind.mockResolvedValue([
      { id: 'existing-person', companyId: 'existing-company' },
    ]);
    await fixture.service.submit(formId, submissionId, {
      email: 'ann@example.com',
    });
    expect(
      fixture
        .writes()
        .some((write) => ['person', 'company'].includes(write.object)),
    ).toBe(false);
    expect(
      fixture.writes().find((write) => write.object === 'opportunity')?.value,
    ).toMatchObject({
      companyId: 'existing-company',
      pointOfContactId: 'existing-person',
    });
  });
  it('rejects ambiguous contacts without writing', async () => {
    const fixture = setup();
    fixture.peopleFind.mockResolvedValue([{ id: 'one' }, { id: 'two' }]);
    await expect(
      fixture.service.submit(formId, submissionId, {
        email: 'ann@example.com',
      }),
    ).rejects.toThrow('could not process');
    expect(fixture.writes()).toEqual([]);
  });
  it('stops after the publisher loses workspace membership', async () => {
    const fixture = setup();
    fixture.memberships.findOne.mockResolvedValue(null);
    await expect(
      fixture.service.submit(formId, submissionId, {
        email: 'ann@example.com',
      }),
    ).rejects.toThrow('no longer available');
    expect(fixture.orm.runInWorkspaceTransaction).not.toHaveBeenCalled();
  });
  it('rejects a removed pond or stage instead of silently dropping into a default', async () => {
    const fixture = setup();
    fixture.metadata.flatFieldMetadataMaps.byId.stage.options = [];
    await expect(
      fixture.service.submit(formId, submissionId, {
        email: 'ann@example.com',
      }),
    ).rejects.toThrow('no longer exists');
    expect(fixture.writes()).toEqual([]);
  });
  it('does not accept paused forms', async () => {
    const fixture = setup();
    fixture.form.published = false;
    await expect(
      fixture.service.submit(formId, submissionId, {
        email: 'ann@example.com',
      }),
    ).rejects.toThrow('unavailable');
    expect(fixture.writes()).toEqual([]);
  });
  it('saves a lead and note without a deal when the form has no pipeline destination', async () => {
    const fixture = setup();
    fixture.form.pipelineViewId = null;
    fixture.form.stageValue = null;
    await fixture.service.submit(formId, submissionId, {
      email: 'ann@example.com',
    });
    expect(
      fixture.writes().some((write) => write.object === 'opportunity'),
    ).toBe(false);
    expect(
      fixture.writes().find((write) => write.object === 'noteTarget')?.value,
    ).toHaveLength(2);
  });
  it('prevents editing a form from another workspace or publisher', async () => {
    const fixture = setup();
    fixture.row.workspaceId = 'another-workspace';
    await expect(
      fixture.service.save(publisher, fixture.form, formId, 1),
    ).rejects.toThrow('not found');
    expect(fixture.storage.save).not.toHaveBeenCalled();
  });
  it('rejects stale editor revisions rather than overwrite a newer save', async () => {
    const fixture = setup();
    await expect(
      fixture.service.save(publisher, fixture.form, formId, 0),
    ).rejects.toThrow('changed');
    expect(fixture.storage.save).not.toHaveBeenCalled();
  });
  it('matches email case-insensitively while escaping SQL wildcard characters', async () => {
    const fixture = setup();
    await fixture.service.submit(formId, submissionId, {
      email: 'Ann%_@example.com',
    });
    const pattern =
      fixture.peopleFind.mock.calls[0][0].where.emails.primaryEmail.ilike;
    expect(pattern).toBe('Ann\\%\\_@example.com');
  });
  it('does not accept a view belonging to a different object', async () => {
    const fixture = setup();
    fixture.metadata.flatViewMaps.byId[viewId].objectMetadataId = 'company';
    await expect(
      fixture.service.submit(formId, submissionId, {
        email: 'ann@example.com',
      }),
    ).rejects.toThrow('no longer exists');
    expect(fixture.writes()).toEqual([]);
  });
});
