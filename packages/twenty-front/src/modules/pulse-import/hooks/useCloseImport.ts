import {
  CLOSE_IMPORT_STATUS,
  REMOVE_CLOSE_IMPORT,
  START_CLOSE_IMPORT,
} from '@/pulse-import/graphql/closeImport';
import { useMutation, useQuery } from '@apollo/client/react';

export type CloseImportCounts = {
  companies: number;
  people: number;
  opportunities: number;
  notes: number;
  calls: number;
  emails: number;
  texts: number;
  tasks: number;
};

export type CloseImportStatus = {
  state: 'idle' | 'running' | 'done' | 'failed';
  organizationName: string | null;
  currentStep: string | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  counts: CloseImportCounts;
};

// The import runs in the worker; polling is the simplest way to show live counts.
const STATUS_POLL_INTERVAL_MS = 3000;

export const useCloseImport = () => {
  const { data } = useQuery<{ closeImportStatus: CloseImportStatus }>(
    CLOSE_IMPORT_STATUS,
    { fetchPolicy: 'network-only', pollInterval: STATUS_POLL_INTERVAL_MS },
  );

  const [startCloseImportMutation, { loading: isStarting }] = useMutation<{
    startCloseImport: CloseImportStatus;
  }>(START_CLOSE_IMPORT, { refetchQueries: [CLOSE_IMPORT_STATUS] });

  const [removeCloseImportMutation, { loading: isRemoving }] = useMutation<{
    removeCloseImport: CloseImportStatus;
  }>(REMOVE_CLOSE_IMPORT, { refetchQueries: [CLOSE_IMPORT_STATUS] });

  const startCloseImport = async (apiKey: string) => {
    await startCloseImportMutation({ variables: { apiKey } });
  };

  const removeCloseImport = async () => {
    await removeCloseImportMutation();
  };

  return {
    status: data?.closeImportStatus,
    isStarting,
    isRemoving,
    startCloseImport,
    removeCloseImport,
  };
};
