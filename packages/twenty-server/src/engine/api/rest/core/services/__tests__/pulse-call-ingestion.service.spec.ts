import 'reflect-metadata';
import { PulseCallIngestionService } from 'src/engine/api/rest/core/services/pulse-call-ingestion.service';
import { type IngestPulseCallDto } from 'src/engine/api/rest/core/dtos/ingest-pulse-call.dto';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';

jest.mock('src/engine/twenty-orm/workspace-orm.manager', () => ({
  WorkspaceOrmManager: jest.fn(),
}));
jest.mock(
  'src/engine/core-modules/record-transformer/utils/transform-rich-text.util',
  () => ({ transformRichTextValue: jest.fn(async (value: unknown) => value) }),
);
jest.mock(
  'src/engine/core-modules/close-import/utils/close-import-mappers.util',
  () => ({
    formatCallDuration: (seconds: number) =>
      `${Math.floor(seconds / 60)}m ${seconds % 60}s`,
  }),
);

const INPUT: IngestPulseCallDto = {
  source: 'external-dialer',
  externalId: 'call-123',
  phoneNumber: '+15551234567',
  direction: 'inbound',
  durationSeconds: 120,
  outcome: 'answered',
  personId: '1066b48e-11fd-4af8-8f6f-f6afea47cc21',
};
const AUTH = {
  type: 'apiKey',
  workspace: { id: 'workspace-one' },
  apiKey: { id: 'api-key' },
} as WorkspaceAuthContext;

describe('external call ingestion', () => {
  const stored = new Map<string, unknown>();
  const notes = {
    findOne: jest.fn(async ({ where }: { where: { id: string } }) =>
      stored.get(where.id),
    ),
    insert: jest.fn(async (note: { id: string }) => {
      stored.set(note.id, note);
    }),
  };
  const targets = { insert: jest.fn() };
  const people = { findOne: jest.fn() };
  const companies = { findOne: jest.fn() };
  const transaction = { executeRawQuery: jest.fn() };
  const orm = {
    executeInWorkspaceContext: jest.fn(async (work: () => unknown) => work()),
    runInWorkspaceTransaction: jest.fn(
      async (work: (scope: unknown) => unknown) => work(transaction),
    ),
    getRepositoryWithContextPermissions: jest.fn(
      (name: string) =>
        ({
          note: notes,
          noteTarget: targets,
          person: people,
          company: companies,
        })[name],
    ),
  };
  const service = new PulseCallIngestionService(
    orm as unknown as WorkspaceOrmManager,
  );
  beforeEach(() => {
    jest.clearAllMocks();
    stored.clear();
    people.findOne.mockResolvedValue({ id: INPUT.personId });
    companies.findOne.mockResolvedValue({ id: 'company-id' });
  });

  it('creates an inbound call on the supplied contact using the authenticated workspace and permissions', async () => {
    const result = await service.ingest(INPUT, AUTH);
    expect(result.created).toBe(true);
    expect(orm.executeInWorkspaceContext).toHaveBeenCalledWith(
      expect.any(Function),
      AUTH,
    );
    expect(orm.getRepositoryWithContextPermissions).toHaveBeenCalledWith(
      'note',
      transaction,
    );
    expect(notes.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: result.noteId,
        title: 'Inbound call · 2m 0s · Answered',
        createdBy: expect.objectContaining({
          source: 'API',
          name: 'external-dialer',
        }),
      }),
    );
    expect(targets.insert).toHaveBeenCalledWith([
      { noteId: result.noteId, targetPersonId: INPUT.personId },
    ]);
  });
  it('returns the original note on a repeated event without creating another note or relation', async () => {
    const first = await service.ingest(INPUT, AUTH);
    const replay = await service.ingest({ ...INPUT, summary: 'A retry' }, AUTH);
    expect(replay).toEqual({ noteId: first.noteId, created: false });
    expect(notes.insert).toHaveBeenCalledTimes(1);
    expect(targets.insert).toHaveBeenCalledTimes(1);
    expect(transaction.executeRawQuery).toHaveBeenCalledTimes(2);
  });
  it('separates the same upstream ID by source and workspace', async () => {
    const first = await service.ingest(INPUT, AUTH);
    const otherSource = await service.ingest(
      { ...INPUT, source: 'another-dialer' },
      AUTH,
    );
    const otherWorkspace = await service.ingest(INPUT, {
      ...AUTH,
      workspace: { ...AUTH.workspace, id: 'workspace-two' },
    });
    expect(
      new Set([first.noteId, otherSource.noteId, otherWorkspace.noteId]).size,
    ).toBe(3);
  });
  it('rejects inaccessible contacts without creating a call', async () => {
    people.findOne.mockResolvedValueOnce(null);
    await expect(service.ingest(INPUT, AUTH)).rejects.toThrow(
      'Contact not found',
    );
    expect(notes.insert).not.toHaveBeenCalled();
  });
  it('rejects inaccessible leads without creating a call', async () => {
    companies.findOne.mockResolvedValueOnce(null);
    await expect(
      service.ingest({ ...INPUT, companyId: 'company-id' }, AUTH),
    ).rejects.toThrow('Lead not found');
    expect(notes.insert).not.toHaveBeenCalled();
  });
  it('requires an existing target instead of silently creating an unattached note', async () => {
    await expect(
      service.ingest({ ...INPUT, personId: undefined }, AUTH),
    ).rejects.toThrow('Provide personId or companyId');
    expect(orm.runInWorkspaceTransaction).not.toHaveBeenCalled();
  });
  it('stores summary, transcript, and recording in the timeline call-card format', async () => {
    await service.ingest(
      {
        ...INPUT,
        direction: 'outbound',
        summary: 'Send proposal',
        transcript: 'Agent: Hello',
        recordingUrl: 'https://recordings.example.com/123.mp3',
      },
      AUTH,
    );
    expect(notes.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Outbound call · 2m 0s · Answered',
        bodyV2: expect.objectContaining({
          markdown: expect.stringContaining(
            '[Call recording](https://recordings.example.com/123.mp3)',
          ),
        }),
      }),
    );
    const note = notes.insert.mock.calls[0][0] as unknown as {
      bodyV2: { markdown: string };
    };
    expect(note.bodyV2.markdown).toContain('**Summary**\nSend proposal');
    expect(note.bodyV2.markdown).toContain('**Transcript**\nAgent: Hello');
  });
  it('propagates permission and transaction errors rather than acknowledging an unsaved call', async () => {
    targets.insert.mockRejectedValueOnce(new Error('Permission denied'));
    await expect(service.ingest(INPUT, AUTH)).rejects.toThrow(
      'Permission denied',
    );
  });
});
