import {
  buildStageOptions,
  makeUnique,
  toCamelCaseFieldName,
  toSelectOptionValue,
} from '@/pulse-pipelines/utils/buildPulsePipelineIdentifiers';

describe('buildPulsePipelineIdentifiers', () => {
  it('builds a camelCase field name from a pipeline name', () => {
    expect(toCamelCaseFieldName('SMB Sales')).toBe('smbSales');
    expect(toCamelCaseFieldName('Enterprise / Corporate Sales')).toBe(
      'enterpriseCorporateSales',
    );
    expect(toCamelCaseFieldName('2026 Deals')).toBe('pipeline2026Deals');
  });

  it('builds select option values that start with a letter', () => {
    expect(toSelectOptionValue('Legal & procurement')).toBe(
      'LEGAL_PROCUREMENT',
    );
    expect(toSelectOptionValue('1st call')).toBe('OPTION_1ST_CALL');
  });

  it('suffixes taken names', () => {
    expect(makeUnique('smbSalesStage', ['smbSalesStage'])).toBe(
      'smbSalesStage2',
    );
  });

  it('dedupes stage values and colors won and lost stages', () => {
    const options = buildStageOptions(['New', 'new', 'Closed won', 'Lost']);

    expect(options.map((option) => option.value)).toEqual([
      'NEW',
      'NEW2',
      'CLOSED_WON',
      'LOST',
    ]);
    expect(options[2].color).toBe('green');
    expect(options[3].color).toBe('red');
  });
});
