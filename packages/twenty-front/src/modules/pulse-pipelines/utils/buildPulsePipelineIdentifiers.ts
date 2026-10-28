import { v4 } from 'uuid';

const STAGE_COLORS = ['gray', 'sky', 'blue', 'purple', 'orange', 'yellow'];

const toWords = (label: string) =>
  label
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter((word) => word.length > 0);

export const toSelectOptionValue = (label: string) => {
  const value = toWords(label).join('_').toUpperCase();

  // Select option values must start with a letter.
  return /^[A-Z]/.test(value) ? value : `OPTION_${value || 'EMPTY'}`;
};

export const toCamelCaseFieldName = (label: string) => {
  const words = toWords(label).map((word) => word.toLowerCase());
  const name = words
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join('');

  return /^[a-z]/.test(name) ? name : `pipeline${name}`;
};

export const makeUnique = (candidate: string, taken: string[]) => {
  let unique = candidate;

  for (let suffix = 2; taken.includes(unique); suffix++) {
    unique = `${candidate}${suffix}`;
  }

  return unique;
};

export const getStageColor = (label: string, index: number) => {
  if (/lost|churn|disqualif|dead/i.test(label)) {
    return 'red';
  }

  if (/won|renewed|signed|funded|closed|active partner/i.test(label)) {
    return 'green';
  }

  return STAGE_COLORS[index % STAGE_COLORS.length];
};

export const buildStageOptions = (stages: string[]) => {
  const usedValues: string[] = [];

  return stages.map((label, index) => {
    const value = makeUnique(toSelectOptionValue(label), usedValues);

    usedValues.push(value);

    return {
      id: v4(),
      label: label.trim(),
      value,
      position: index,
      color: getStageColor(label, index),
    };
  });
};
