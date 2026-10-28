import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { type PulsePipeline } from '@/pulse-pipelines/hooks/usePulsePipelines';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

type FullName = { firstName: string | null; lastName: string | null } | null;

export type PulseBoardDeal = ObjectRecord & {
  name: string | null;
  closeDate: string | null;
  updatedAt: string;
  pipeline?: string | null;
  amount: { amountMicros: number | null; currencyCode: string | null } | null;
  company: {
    id: string;
    name: string | null;
    domainName: { primaryLinkUrl: string | null } | null;
  } | null;
  pointOfContact: {
    id: string;
    name: FullName;
    emails: { primaryEmail: string | null } | null;
    phones: {
      primaryPhoneNumber: string | null;
      primaryPhoneCallingCode: string | null;
    } | null;
  } | null;
  [fieldName: string]: unknown;
};

export const usePulseBoardDeals = (
  pipeline: PulsePipeline | undefined,
  hasPipelineField: boolean,
) => {
  // Named pipelines filter on the pipeline field; Cloud boards on having a stage of their
  // own; the original board on deals that belong to no named pipeline.
  const pipelineFilter = !isDefined(pipeline)
    ? undefined
    : isDefined(pipeline.pipelineValue)
      ? { pipeline: { in: [pipeline.pipelineValue] } }
      : !pipeline.isDefault
        ? { [pipeline.stageFieldName]: { is: 'NOT_NULL' as const } }
        : hasPipelineField
          ? { pipeline: { is: 'NULL' as const } }
          : undefined;

  const { records, loading } = useFindManyRecords<PulseBoardDeal>({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
    filter: pipelineFilter,
    recordGqlFields: {
      id: true,
      name: true,
      closeDate: true,
      updatedAt: true,
      amount: { amountMicros: true, currencyCode: true },
      ...(hasPipelineField ? { pipeline: true } : {}),
      ...(isDefined(pipeline) ? { [pipeline.stageFieldName]: true } : {}),
      company: { id: true, name: true, domainName: { primaryLinkUrl: true } },
      pointOfContact: {
        id: true,
        name: { firstName: true, lastName: true },
        emails: { primaryEmail: true },
        phones: { primaryPhoneNumber: true, primaryPhoneCallingCode: true },
      },
    },
    orderBy: [{ position: 'AscNullsLast' }],
    limit: 1000,
    skip: !isDefined(pipeline),
  });

  return { deals: records, loading };
};
