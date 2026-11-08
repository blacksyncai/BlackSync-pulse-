import { type PulsePipeline } from '@/pulse-pipelines/hooks/usePulsePipelines';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { escapeForIlike, isDefined } from 'twenty-shared/utils';

export const buildPulseBoardFilter = (
  pipeline: PulsePipeline | undefined,
  hasPipelineField: boolean,
  search = '',
): RecordGqlOperationFilter | undefined => {
  if (!isDefined(pipeline)) return undefined;
  const membership: RecordGqlOperationFilter | undefined = isDefined(
    pipeline.pipelineValue,
  )
    ? { pipeline: { in: [pipeline.pipelineValue] } }
    : !pipeline.isDefault
      ? { [pipeline.stageFieldName]: { is: 'NOT_NULL' } }
      : hasPipelineField
        ? { pipeline: { is: 'NULL' } }
        : undefined;
  const tokens = search
    .trim()
    .slice(0, 120)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);
  if (!tokens.length) return membership;
  const filter = {
    and: [
      ...(membership ? [membership] : []),
      ...tokens.map((token) => {
        const ilike = `%${escapeForIlike(token)}%`;
        return {
          or: [
            { name: { ilike } },
            { company: { name: { ilike } } },
            { pointOfContact: { name: { firstName: { ilike } } } },
            { pointOfContact: { name: { lastName: { ilike } } } },
            { pointOfContact: { emails: { primaryEmail: { ilike } } } },
          ],
        };
      }),
    ],
  };
  // The API supports nested relation filters; the shared leaf-filter union does not model them yet.
  return filter as unknown as RecordGqlOperationFilter;
};
