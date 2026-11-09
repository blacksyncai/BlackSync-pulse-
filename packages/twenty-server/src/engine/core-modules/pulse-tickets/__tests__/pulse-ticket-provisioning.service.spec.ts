import { PulseTicketProvisioningService } from '../services/pulse-ticket-provisioning.service';

const setup = () => {
  const objects: { id: string; nameSingular: string; description?: string }[] =
    [
      { id: 'company', nameSingular: 'company' },
      { id: 'member', nameSingular: 'workspaceMember' },
    ];
  const fields: { id: string; name: string; objectMetadataId: string }[] = [];
  const storage = {
    manager: { transaction: jest.fn() },
    findOne: jest.fn(),
    save: jest.fn(),
    create: (value: unknown) => value,
  };
  storage.manager.transaction.mockImplementation(async (work) =>
    work({ query: jest.fn(), getRepository: () => storage }),
  );
  const objectService = {
    createOneObject: jest
      .fn()
      .mockImplementation(async ({ createObjectInput }) => {
        const object = { ...createObjectInput, id: 'tickets' };
        objects.push(object);
        return object;
      }),
  };
  const fieldService = {
    createOneField: jest
      .fn()
      .mockImplementation(async ({ createFieldInput }) => {
        const field = { ...createFieldInput, id: createFieldInput.name };
        fields.push(field);
        return field;
      }),
    updateOneField: jest.fn(),
  };
  const cache = {
    getOrRecomputeManyOrAllFlatEntityMaps: jest.fn(async () => ({
      flatObjectMetadataMaps: {
        byUniversalIdentifier: Object.fromEntries(
          objects.map((item) => [item.id, item]),
        ),
      },
      flatFieldMetadataMaps: {
        byUniversalIdentifier: Object.fromEntries(
          fields.map((item) => [item.id, item]),
        ),
      },
    })),
  };
  const boards = {
    ensureSelectField: jest.fn().mockImplementation(async ({ fieldName }) => ({
      fieldId: fieldName,
    })),
    ensureKanbanBoard: jest.fn().mockResolvedValue('board'),
  };
  const permissions = {
    userHasWorkspaceSettingPermission: jest.fn().mockResolvedValue(true),
  };
  const service = new PulseTicketProvisioningService(
    storage as never,
    objectService as never,
    fieldService as never,
    cache as never,
    boards as never,
    permissions as never,
  );
  return {
    service,
    storage,
    objectService,
    fieldService,
    boards,
    permissions,
    objects,
  };
};

describe('client ticket setup', () => {
  it('requires data model permission before any schema mutation', async () => {
    const context = setup();
    context.permissions.userHasWorkspaceSettingPermission.mockResolvedValue(
      false,
    );
    await expect(
      context.service.setup('workspace', 'membership'),
    ).rejects.toThrow('administrator');
    expect(context.objectService.createOneObject).not.toHaveBeenCalled();
  });
  it('creates client and assignee relations and a board with delivery fields', async () => {
    const context = setup();
    await expect(
      context.service.setup('workspace', 'membership'),
    ).resolves.toMatchObject({ href: '/objects/clientTickets?viewId=board' });
    expect(context.fieldService.createOneField).toHaveBeenCalledWith(
      expect.objectContaining({
        createFieldInput: expect.objectContaining({
          name: 'client',
          relationCreationPayload: expect.objectContaining({
            targetObjectMetadataId: 'company',
          }),
        }),
      }),
    );
    expect(context.fieldService.createOneField).toHaveBeenCalledWith(
      expect.objectContaining({
        createFieldInput: expect.objectContaining({
          name: 'assignee',
          relationCreationPayload: expect.objectContaining({
            targetObjectMetadataId: 'member',
          }),
        }),
      }),
    );
    expect(
      context.boards.ensureKanbanBoard.mock.calls[0][0].cardFieldNames,
    ).toEqual(
      expect.arrayContaining([
        'client',
        'assignee',
        'project',
        'priority',
        'dueAt',
      ]),
    );
  });
  it('reuses existing fields on retry instead of duplicating them', async () => {
    const context = setup();
    await context.service.setup('workspace', 'membership');
    const fieldsCreated = context.fieldService.createOneField.mock.calls.length;
    await context.service.setup('workspace', 'membership');
    expect(context.objectService.createOneObject).toHaveBeenCalledTimes(1);
    expect(context.fieldService.createOneField).toHaveBeenCalledTimes(
      fieldsCreated,
    );
  });
  it('does not take over an unrelated existing custom object', async () => {
    const context = setup();
    context.objects.push({
      id: 'other',
      nameSingular: 'clientTicket',
      description: 'Customer-defined data',
    });
    await expect(
      context.service.setup('workspace', 'membership'),
    ).rejects.toThrow('review');
    expect(context.fieldService.createOneField).not.toHaveBeenCalled();
  });
});
