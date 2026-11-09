import { useMemo } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import {
  buildConversation,
  type ConversationAttachment,
  type ConversationNote,
  type ConversationTarget,
} from '@/pulse-conversations/utils/buildConversation';

export const useConversations = () => {
  const notes = useFindManyRecords<ConversationNote>({
    objectNameSingular: CoreObjectNameSingular.Note,
    recordGqlFields: {
      id: true,
      title: true,
      createdAt: true,
      createdBy: { name: true },
      bodyV2: { markdown: true },
    },
    filter: {
      or: [
        { title: { ilike: 'Outbound call%' } },
        { title: { ilike: 'Inbound call%' } },
        { title: { ilike: 'Call call%' } },
      ],
    },
    orderBy: [{ createdAt: 'DescNullsLast' }, { id: 'DescNullsLast' }],
    limit: 50,
  });
  const noteIds = notes.records.map((note) => note.id);
  const companyFields = {
    id: true,
    name: true,
    address: { addressCity: true, addressState: true, addressCountry: true },
  };
  const targets = useFindManyRecords<ConversationTarget>({
    objectNameSingular: CoreObjectNameSingular.NoteTarget,
    filter: { noteId: { in: noteIds } },
    recordGqlFields: {
      id: true,
      noteId: true,
      targetCompany: companyFields,
      targetPerson: {
        id: true,
        name: { firstName: true, lastName: true },
        company: companyFields,
      },
    },
    limit: 500,
    skip: noteIds.length === 0,
  });
  const attachments = useFindManyRecords<ConversationAttachment>({
    objectNameSingular: CoreObjectNameSingular.Attachment,
    filter: { targetNoteId: { in: noteIds } },
    recordGqlFields: { id: true, targetNoteId: true, file: true },
    limit: 500,
    skip: noteIds.length === 0,
  });
  const conversations = useMemo(
    () =>
      notes.records.map((note) =>
        buildConversation(note, targets.records, attachments.records),
      ),
    [notes.records, targets.records, attachments.records],
  );
  return {
    conversations,
    notes,
    targets,
    attachments,
    loading: notes.loading || targets.loading || attachments.loading,
    error: notes.error ?? targets.error ?? attachments.error,
    refresh: async () => {
      await Promise.all([
        notes.refetch(),
        ...(noteIds.length ? [targets.refetch(), attachments.refetch()] : []),
      ]);
    },
  };
};
