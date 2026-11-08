import { buildPulseBoardFilter } from '../buildPulseBoardFilter';
import { type PulsePipeline } from '@/pulse-pipelines/hooks/usePulsePipelines';

const searchFilter = (
  pipeline: PulsePipeline,
  hasPipelineField: boolean,
  query: string,
) =>
  buildPulseBoardFilter(pipeline, hasPipelineField, query) as {
    and?: unknown[];
    or?: unknown;
  };

const pipeline: PulsePipeline = {
  viewId: 'sales',
  name: 'Sales',
  pipelineValue: 'SMB',
  stageFieldName: 'salesStage',
  isDefault: false,
  stages: [],
};

describe('pipeline search boundaries', () => {
  it('keeps every text match inside the selected named pipeline', () => {
    const filter = searchFilter(pipeline, true, 'Sarah');
    expect(filter?.and?.[0]).toEqual({ pipeline: { in: ['SMB'] } });
    expect(filter?.or).toBeUndefined();
    expect(filter?.and).toHaveLength(2);
  });
  it('supports a full name split between first and last name without requiring a contiguous field value', () => {
    const filter = searchFilter(pipeline, true, '  Sarah   Williams  ');
    expect(filter?.and).toHaveLength(3);
    expect(filter?.and?.[1]).toEqual(
      expect.objectContaining({
        or: expect.arrayContaining([
          { pointOfContact: { name: { firstName: { ilike: '%Sarah%' } } } },
        ]),
      }),
    );
    expect(filter?.and?.[2]).toEqual(
      expect.objectContaining({
        or: expect.arrayContaining([
          { pointOfContact: { name: { lastName: { ilike: '%Williams%' } } } },
        ]),
      }),
    );
  });
  it('keeps the original pipeline scoped to deals outside named pipelines', () => {
    const filter = searchFilter(
      { ...pipeline, isDefault: true, pipelineValue: null },
      true,
      'Sarah',
    );
    expect(filter?.and?.[0]).toEqual({ pipeline: { is: 'NULL' } });
  });
  it('scopes older boards to their actual custom stage field', () => {
    const filter = searchFilter(
      { ...pipeline, pipelineValue: null },
      false,
      'Sarah',
    );
    expect(filter?.and?.[0]).toEqual({ salesStage: { is: 'NOT_NULL' } });
  });
  it('does not turn wildcard characters into a match-all search', () => {
    const filter = searchFilter(pipeline, true, '%_');
    const nameFilter = filter?.and?.[1] as {
      or: { name?: { ilike: string } }[];
    };
    expect(nameFilter.or[0].name?.ilike).not.toBe('%%_%');
    expect(nameFilter.or[0].name?.ilike).toContain('\\%');
    expect(nameFilter.or[0].name?.ilike).toContain('\\_');
  });
  it('does not search without a pipeline, and whitespace keeps the ordinary board filter', () => {
    expect(buildPulseBoardFilter(undefined, true, 'Sarah')).toBeUndefined();
    expect(buildPulseBoardFilter(pipeline, true, '   ')).toEqual({
      pipeline: { in: ['SMB'] },
    });
  });
});
