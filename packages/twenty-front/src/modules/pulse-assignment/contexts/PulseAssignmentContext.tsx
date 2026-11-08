import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { usePulseSetting } from '@/pulse-settings/hooks/usePulseSetting';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { createContext, useContext, type ReactNode } from 'react';
import { CoreObjectNameSingular, FieldMetadataType } from 'twenty-shared/types';

export const PULSE_ASSIGNMENT_TEAM_FIELD = 'assignmentTeam';
export type PulseAssignmentTeam = {
  id: string;
  name: string;
  memberIds: string[];
  archived: boolean;
};
export type PulseAssignment = {
  memberId: string | null;
  teamValue: string | null;
};
type AssignmentMember = ObjectRecord & {
  name: { firstName: string | null; lastName: string | null } | null;
  userEmail: string | null;
};
const EMPTY_TEAMS: PulseAssignmentTeam[] = [];
const PulseAssignmentContext = createContext({
  members: [] as AssignmentMember[],
  teams: EMPTY_TEAMS,
  loading: false,
  currentMemberId: null as string | null,
  hasLeadTeam: false,
  hasTaskTeam: false,
  saveTeams: async (_teams: PulseAssignmentTeam[]) => {},
});
export const usePulseAssignment = () => useContext(PulseAssignmentContext);
export const assignmentMemberName = (member: AssignmentMember) =>
  [member.name?.firstName, member.name?.lastName].filter(Boolean).join(' ') ||
  member.userEmail ||
  member.id;
export const PulseAssignmentProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const currentMember = useAtomStateValue(currentWorkspaceMemberState);
  const {
    value: teams,
    save: saveTeams,
    loading: teamsLoading,
  } = usePulseSetting<PulseAssignmentTeam[]>('assignmentTeams', EMPTY_TEAMS);
  const { records: members, loading: membersLoading } =
    useFindManyRecords<AssignmentMember>({
      objectNameSingular: CoreObjectNameSingular.WorkspaceMember,
      recordGqlFields: {
        id: true,
        name: { firstName: true, lastName: true },
        userEmail: true,
      },
      limit: 1000,
    });
  const { objectMetadataItem: company } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Company,
  });
  const { objectMetadataItem: task } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Task,
  });
  const hasTeam = (fields: typeof company.fields) =>
    fields.some(
      (field) =>
        field.name === PULSE_ASSIGNMENT_TEAM_FIELD &&
        field.type === FieldMetadataType.SELECT &&
        field.isActive !== false,
    );
  return (
    <PulseAssignmentContext.Provider
      value={{
        members,
        teams,
        saveTeams,
        currentMemberId: currentMember?.id ?? null,
        loading: teamsLoading || membersLoading,
        hasLeadTeam: hasTeam(company.fields),
        hasTaskTeam: hasTeam(task.fields),
      }}
    >
      {children}
    </PulseAssignmentContext.Provider>
  );
};
