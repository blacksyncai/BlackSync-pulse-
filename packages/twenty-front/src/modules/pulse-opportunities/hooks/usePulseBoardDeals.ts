import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useMemo } from 'react';
import { buildPulseBoardFilter } from '@/pulse-opportunities/utils/buildPulseBoardFilter';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { type PulsePipeline } from '@/pulse-pipelines/hooks/usePulsePipelines';
import { CoreObjectNameSingular, FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

type FullName = { firstName: string | null; lastName: string | null } | null;

export type PulseBoardDeal = ObjectRecord & {
  name: string | null;
  closeDate: string | null;
  updatedAt: string;
  pipeline?: string | null;
  industryLabel?: string | null;
  amount: { amountMicros: number | null; currencyCode: string | null } | null;
  company: {
    id: string;
    name: string | null;
    domainName: { primaryLinkUrl: string | null } | null;
    [fieldName: string]: unknown;
  } | null;
  owner: { id: string; name: FullName } | null;
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
  options: { search?: string; skip?: boolean; limit?: number } = {},
) => {
  const { objectMetadataItem: companyMetadata } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Company,
  });
  const supportedIndustryTypes: string[] = [
    FieldMetadataType.TEXT,
    FieldMetadataType.SELECT,
    FieldMetadataType.MULTI_SELECT,
  ];
  const industryField = companyMetadata.fields.find(
    (field) =>
      field.isActive !== false &&
      (field.name.toLowerCase() === 'industry' ||
        field.label.trim().toLowerCase() === 'industry') &&
      supportedIndustryTypes.includes(field.type),
  );
  const {
    records,
    loading,
    error,
    refetch,
    totalCount,
    hasNextPage,
    fetchMoreRecords,
  } = useFindManyRecords<PulseBoardDeal>({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
    filter: buildPulseBoardFilter(pipeline, hasPipelineField, options.search),
    recordGqlFields: {
      id: true,
      name: true,
      closeDate: true,
      updatedAt: true,
      amount: { amountMicros: true, currencyCode: true },
      ...(hasPipelineField ? { pipeline: true } : {}),
      ...(isDefined(pipeline) ? { [pipeline.stageFieldName]: true } : {}),
      company: {
        id: true,
        name: true,
        domainName: { primaryLinkUrl: true },
        ...(isDefined(industryField) ? { [industryField.name]: true } : {}),
      },
      owner: { id: true, name: { firstName: true, lastName: true } },
      pointOfContact: {
        id: true,
        name: { firstName: true, lastName: true },
        emails: { primaryEmail: true },
        phones: { primaryPhoneNumber: true, primaryPhoneCallingCode: true },
      },
    },
    orderBy: [{ position: 'AscNullsLast' }],
    limit: options.limit ?? 1000,
    skip: !isDefined(pipeline) || options.skip,
  });

  const deals = useMemo(
    () =>
      records.map((record) => {
        const value = isDefined(industryField)
          ? record.company?.[industryField.name]
          : undefined;
        const values = Array.isArray(value) ? value : [value];
        const labels = values
          .filter(
            (item): item is string =>
              typeof item === 'string' && item.trim().length > 0,
          )
          .map(
            (item) =>
              industryField?.options?.find((option) => option.value === item)
                ?.label ?? item,
          );
        return { ...record, industryLabel: labels.join(' · ') || null };
      }),
    [records, industryField],
  );

  return {
    deals,
    loading,
    error,
    refetch,
    totalCount,
    hasNextPage,
    fetchMoreRecords,
  };
};
