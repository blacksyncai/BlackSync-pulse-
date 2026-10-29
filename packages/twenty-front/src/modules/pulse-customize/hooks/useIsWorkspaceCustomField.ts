import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Fields the workspace created itself belong to its custom application.
export const useIsWorkspaceCustomField = () => {
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const customApplicationId = currentWorkspace?.workspaceCustomApplication?.id;

  return (field: FieldMetadataItem) =>
    customApplicationId !== undefined &&
    field.applicationId === customApplicationId;
};
