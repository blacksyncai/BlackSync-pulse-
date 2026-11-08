import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useMemo } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';

export type PulseClosingDeal = ObjectRecord & {
  name: string | null;
  stage: string | null;
  closeDate: string | null;
  amount: { amountMicros: number | null; currencyCode: string | null } | null;
  company: { name: string | null } | null;
};

export type PulseRecentCall = ObjectRecord & {
  title: string | null;
  createdAt: string;
};

export const usePulseSalesWorkspace = () => {
  const closingBefore = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  }, []);

  const deals = useFindManyRecords<PulseClosingDeal>({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
    recordGqlFields: {
      id: true,
      name: true,
      stage: true,
      closeDate: true,
      amount: { amountMicros: true, currencyCode: true },
      company: { name: true },
    },
    filter: {
      and: [
        { stage: { neq: 'CUSTOMER' } },
        { closeDate: { lte: closingBefore } },
      ],
    },
    orderBy: [{ closeDate: 'AscNullsLast' }],
    limit: 12,
  });

  const calls = useFindManyRecords<PulseRecentCall>({
    objectNameSingular: CoreObjectNameSingular.Note,
    recordGqlFields: { id: true, title: true, createdAt: true },
    filter: { title: { ilike: '%call ·%' } },
    orderBy: [{ createdAt: 'DescNullsLast' }],
    limit: 8,
  });

  return { deals, calls };
};
