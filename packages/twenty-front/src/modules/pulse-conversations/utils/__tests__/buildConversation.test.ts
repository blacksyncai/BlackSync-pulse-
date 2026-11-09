import {
  buildConversation,
  filterConversations,
  type ConversationAttachment,
  type ConversationNote,
  type ConversationTarget,
} from '../buildConversation';
const note = {
  id: 'call-1',
  __typename: 'Note',
  title: 'Outbound call · 2m 15s · Answered',
  createdAt: '2026-11-09T13:00:00Z',
  createdBy: { name: 'Sarah' },
  bodyV2: {
    markdown:
      'Phone: +12125550123\n\n**Transcript**\nCustomer: Please send the proposal.',
  },
} as ConversationNote;
const targets = [
  {
    id: 'target',
    __typename: 'NoteTarget',
    noteId: note.id,
    targetPerson: {
      id: 'person',
      name: { firstName: 'Alex', lastName: 'Rivera' },
      company: {
        id: 'company',
        name: 'Acme',
        address: { addressCity: 'Miami', addressState: 'FL' },
      },
    },
    targetCompany: null,
  },
] as ConversationTarget[];
describe('conversation history mapping', () => {
  it('shows the linked contact, company, recorded location, phone and transcript state', () => {
    expect(buildConversation(note, targets, [])).toMatchObject({
      contactName: 'Alex Rivera',
      companyName: 'Acme',
      location: 'Miami, FL',
      phone: '+12125550123',
      direction: 'outbound',
      duration: '2m 15s',
      outcome: 'Answered',
      repName: 'Sarah',
      hasTranscript: true,
    });
  });
  it('does not infer names or locations when a call has no linked contact', () => {
    expect(buildConversation(note, [], [])).toMatchObject({
      contactName: null,
      location: '',
      companyName: '',
      phone: '+12125550123',
    });
  });
  it('prefers this note’s stored audio over an older imported link', () => {
    const attachments = [
      {
        id: 'other',
        targetNoteId: 'different-note',
        file: [{ url: 'https://example.com/wrong.mp3', extension: 'mp3' }],
      },
      {
        id: 'mine',
        targetNoteId: note.id,
        file: [{ url: 'https://example.com/stored.mp3', extension: 'MP3' }],
      },
    ] as ConversationAttachment[];
    const source = {
      ...note,
      bodyV2: {
        markdown:
          'Phone: +12125550123\n[Call recording](https://example.com/old.mp3)',
      },
    };
    expect(buildConversation(source, targets, attachments).recordingUrl).toBe(
      'https://example.com/stored.mp3',
    );
    expect(buildConversation(source, targets, []).recordingUrl).toBe(
      'https://example.com/old.mp3',
    );
  });
  it('rejects unsafe recording URL schemes', () => {
    expect(
      buildConversation(
        { ...note, bodyV2: { markdown: '[Call recording](javascript:alert)' } },
        [],
        [],
      ).recordingUrl,
    ).toBeNull();
  });
  it('searches names, company, phone, location and transcript together', () => {
    const call = buildConversation(note, targets, []);
    expect(
      filterConversations([call], 'ALEX proposal Miami', 'all', false),
    ).toHaveLength(1);
    expect(
      filterConversations([call], '2125550123', 'all', false),
    ).toHaveLength(1);
    expect(
      filterConversations([call], 'Unknown company', 'all', false),
    ).toHaveLength(0);
  });
  it('supports direction and recording filters without making up recordings', () => {
    const call = buildConversation(note, targets, []);
    expect(filterConversations([call], '', 'inbound', false)).toHaveLength(0);
    expect(filterConversations([call], '', 'outbound', true)).toHaveLength(0);
    expect(
      filterConversations(
        [{ ...call, recordingUrl: 'https://example.com/audio.mp3' }],
        '',
        'outbound',
        true,
      ),
    ).toHaveLength(1);
  });
});
