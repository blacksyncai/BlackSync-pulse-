import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { type PulseTimelineItem } from '@/pulse-record/types/PulseTimelineItem';
import { parsePulseNoteActivity } from '@/pulse-record/utils/parsePulseNoteActivity';
import { useMemo } from 'react';
import { CoreObjectNameSingular, FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

const NO_MATCH_ID = '00000000-0000-0000-0000-000000000000';
const LEAD_STATUS_FIELD_NAME = 'leadStatus';
const PIPELINE_FIELD_NAME = 'pipeline';
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'm4a', 'ogg', 'webm'];

type FullName = { firstName: string | null; lastName: string | null } | null;

export type PulseAccount = ObjectRecord & {
  name: string | null;
  domainName: { primaryLinkUrl: string | null } | null;
  address: {
    addressStreet1: string | null;
    addressCity: string | null;
    addressState: string | null;
    addressCountry: string | null;
  } | null;
  leadStatus?: string | null;
};

export type PulseContact = ObjectRecord & {
  name: FullName;
  jobTitle: string | null;
  emails: { primaryEmail: string | null } | null;
  phones: {
    primaryPhoneNumber: string | null;
    primaryPhoneCallingCode: string | null;
  } | null;
};

export type PulseDeal = {
  id: string;
  name: string;
  amount: number;
  currencyCode: string;
  pipelineLabel: string | null;
  stageLabel: string | null;
  stageColor: string;
};

type DealRecord = ObjectRecord & {
  name: string | null;
  amount: { amountMicros: number | null; currencyCode: string | null } | null;
  stage: string | null;
  [fieldName: string]: unknown;
};

type NoteTargetRecord = ObjectRecord & {
  targetPerson: { name: FullName } | null;
  note: {
    id: string;
    title: string | null;
    createdAt: string;
    bodyV2: { markdown: string | null } | null;
    attachments?: {
      id: string;
      file: { url?: string; extension?: string }[] | null;
    }[];
  } | null;
};

type TaskTargetRecord = ObjectRecord & {
  task: {
    id: string;
    title: string | null;
    status: string | null;
    dueAt: string | null;
    createdAt: string;
    bodyV2: { markdown: string | null } | null;
  } | null;
};

type AttachmentRecord = ObjectRecord & {
  name: string | null;
  createdAt: string;
  file: { url?: string; extension?: string; label: string }[] | null;
};

type MessageParticipantRecord = ObjectRecord & {
  role: string | null;
  person: { name: FullName } | null;
  message: {
    id: string;
    subject: string | null;
    text: string | null;
    receivedAt: string | null;
  } | null;
};

export const formatFullName = (name: FullName | undefined) =>
  [name?.firstName, name?.lastName].filter(Boolean).join(' ');

export const usePulseAccountData = (companyId: string) => {
  const { objectMetadataItem: companyMetadata } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Company,
  });
  const { objectMetadataItem: dealMetadata } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
  });

  const leadStatusField = companyMetadata.fields.find(
    (field) => field.name === LEAD_STATUS_FIELD_NAME,
  );
  const dealSelectFields = dealMetadata.fields.filter(
    (field) =>
      field.type === FieldMetadataType.SELECT &&
      (field.name === PIPELINE_FIELD_NAME ||
        field.name === 'stage' ||
        field.name.endsWith('Stage')),
  );

  const { record: account, loading: accountLoading } =
    useFindOneRecord<PulseAccount>({
      objectNameSingular: CoreObjectNameSingular.Company,
      objectRecordId: companyId,
      recordGqlFields: {
        id: true,
        name: true,
        domainName: { primaryLinkUrl: true },
        address: {
          addressStreet1: true,
          addressCity: true,
          addressState: true,
          addressCountry: true,
        },
        ...(isDefined(leadStatusField) ? { leadStatus: true } : {}),
      },
    });

  const { records: contacts } = useFindManyRecords<PulseContact>({
    objectNameSingular: CoreObjectNameSingular.Person,
    filter: { companyId: { eq: companyId } },
    recordGqlFields: {
      id: true,
      name: { firstName: true, lastName: true },
      jobTitle: true,
      emails: { primaryEmail: true },
      phones: { primaryPhoneNumber: true, primaryPhoneCallingCode: true },
    },
    limit: 50,
  });

  const contactIds = contacts.map((contact) => contact.id);
  const contactIdsOrNone = contactIds.length > 0 ? contactIds : [NO_MATCH_ID];

  const { records: dealRecords } = useFindManyRecords<DealRecord>({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
    filter: { companyId: { eq: companyId } },
    recordGqlFields: {
      id: true,
      name: true,
      amount: { amountMicros: true, currencyCode: true },
      ...Object.fromEntries(
        dealSelectFields.map((field) => [field.name, true]),
      ),
    },
    limit: 50,
  });

  const {
    records: noteTargets,
    loading: notesLoading,
    refetch: refetchNotes,
  } = useFindManyRecords<NoteTargetRecord>({
    objectNameSingular: CoreObjectNameSingular.NoteTarget,
    filter: {
      or: [
        { targetCompanyId: { eq: companyId } },
        { targetPersonId: { in: contactIdsOrNone } },
      ],
    },
    recordGqlFields: {
      id: true,
      targetPerson: { name: { firstName: true, lastName: true } },
      note: {
        id: true,
        title: true,
        createdAt: true,
        bodyV2: { markdown: true },
        attachments: { id: true, file: true },
      },
    },
    limit: 500,
  });

  const { records: taskTargets, refetch: refetchTasks } =
    useFindManyRecords<TaskTargetRecord>({
      objectNameSingular: CoreObjectNameSingular.TaskTarget,
      filter: {
        or: [
          { targetCompanyId: { eq: companyId } },
          { targetPersonId: { in: contactIdsOrNone } },
        ],
      },
      recordGqlFields: {
        id: true,
        task: {
          id: true,
          title: true,
          status: true,
          dueAt: true,
          createdAt: true,
          bodyV2: { markdown: true },
        },
      },
      limit: 200,
    });

  const { records: attachments } = useFindManyRecords<AttachmentRecord>({
    objectNameSingular: CoreObjectNameSingular.Attachment,
    filter: { targetCompanyId: { eq: companyId } },
    recordGqlFields: { id: true, name: true, createdAt: true, file: true },
    limit: 100,
  });

  const { records: messageParticipants } =
    useFindManyRecords<MessageParticipantRecord>({
      objectNameSingular: CoreObjectNameSingular.MessageParticipant,
      filter: { personId: { in: contactIdsOrNone } },
      recordGqlFields: {
        id: true,
        role: true,
        person: { name: { firstName: true, lastName: true } },
        message: { id: true, subject: true, text: true, receivedAt: true },
      },
      limit: 200,
      skip: contactIds.length === 0,
    });

  const deals = useMemo<PulseDeal[]>(() => {
    const fieldByName = new Map(
      dealSelectFields.map((field) => [field.name, field]),
    );
    const pipelineField = fieldByName.get(PIPELINE_FIELD_NAME);

    return dealRecords.map((deal) => {
      const pipelineOption = pipelineField?.options?.find(
        (option) => option.value === deal[PIPELINE_FIELD_NAME],
      );
      const stageField = isDefined(pipelineOption)
        ? dealSelectFields.find(
            (field) =>
              field.label.toLowerCase() ===
              `${pipelineOption.label} stage`.toLowerCase(),
          )
        : fieldByName.get('stage');
      const stageOption = stageField?.options?.find(
        (option) => option.value === deal[stageField.name],
      );

      return {
        id: deal.id,
        name: deal.name ?? 'Untitled deal',
        amount: (deal.amount?.amountMicros ?? 0) / 1_000_000,
        currencyCode: deal.amount?.currencyCode || 'USD',
        pipelineLabel: pipelineOption?.label ?? null,
        stageLabel: stageOption?.label ?? null,
        stageColor: stageOption?.color ?? 'gray',
      };
    });
  }, [dealRecords, dealSelectFields]);

  const timeline = useMemo<PulseTimelineItem[]>(() => {
    const seen = new Set<string>();
    const items: PulseTimelineItem[] = [];

    for (const target of noteTargets) {
      const note = target.note;

      if (!isDefined(note) || seen.has(note.id)) {
        continue;
      }

      seen.add(note.id);

      const activity = parsePulseNoteActivity(
        note.title ?? '',
        note.bodyV2?.markdown ?? '',
      );
      const contactName = formatFullName(target.targetPerson?.name);

      // Recordings copied into Pulse play from storage; older notes still carry a link.
      const storedRecordingUrl = note.attachments
        ?.flatMap((attachment) => attachment.file ?? [])
        .find((file) =>
          AUDIO_EXTENSIONS.includes((file.extension ?? '').toLowerCase()),
        )?.url;

      items.push({
        ...activity,
        recordingUrl: storedRecordingUrl ?? activity.recordingUrl,
        title:
          activity.kind === 'call' && contactName.length > 0
            ? activity.direction === 'inbound'
              ? `Call from ${contactName}`
              : `Called ${contactName}`
            : activity.title,
        id: note.id,
        date: new Date(note.createdAt),
        isDone: false,
        openRecordId: note.id,
        openObjectNameSingular: CoreObjectNameSingular.Note,
      });
    }

    for (const target of taskTargets) {
      const task = target.task;

      if (!isDefined(task) || seen.has(task.id)) {
        continue;
      }

      seen.add(task.id);
      items.push({
        id: task.id,
        kind: 'task',
        title: task.title || 'Untitled task',
        body: task.bodyV2?.markdown ?? '',
        date: new Date(task.dueAt ?? task.createdAt),
        direction: null,
        duration: null,
        outcome: null,
        recordingUrl: null,
        isDone: task.status === 'DONE',
        openRecordId: task.id,
        openObjectNameSingular: CoreObjectNameSingular.Task,
      });
    }

    for (const participant of messageParticipants) {
      const message = participant.message;

      if (!isDefined(message) || seen.has(message.id)) {
        continue;
      }

      seen.add(message.id);

      const isFromContact = participant.role?.toLowerCase() === 'from';
      const contactName = formatFullName(participant.person?.name);

      items.push({
        id: message.id,
        kind: 'email',
        title: message.subject || '(no subject)',
        body: [
          isFromContact ? `From: ${contactName}` : `To: ${contactName}`,
          message.text ?? '',
        ].join('\n\n'),
        date: new Date(message.receivedAt ?? 0),
        direction: isFromContact ? 'inbound' : 'outbound',
        duration: null,
        outcome: null,
        recordingUrl: null,
        isDone: false,
        openRecordId: message.id,
        openObjectNameSingular: CoreObjectNameSingular.Message,
      });
    }

    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [noteTargets, taskTargets, messageParticipants]);

  const leadStatus = isDefined(leadStatusField)
    ? {
        fieldName: leadStatusField.name,
        value: account?.leadStatus ?? null,
        options: [...(leadStatusField.options ?? [])].sort(
          (a, b) => a.position - b.position,
        ),
      }
    : null;

  return {
    account,
    loading: accountLoading || notesLoading,
    contacts,
    deals,
    timeline,
    attachments,
    leadStatus,
    refetchActivity: () =>
      Promise.all([refetchNotes(), refetchTasks()]).then(() => undefined),
  };
};
