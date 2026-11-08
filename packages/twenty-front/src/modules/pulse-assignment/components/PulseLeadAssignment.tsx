import { PulseAssignmentPicker } from '@/pulse-assignment/components/PulseAssignmentPicker';
import {
  PULSE_ASSIGNMENT_TEAM_FIELD,
  usePulseAssignment,
  type PulseAssignment,
} from '@/pulse-assignment/contexts/PulseAssignmentContext';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { useToast } from 'twenty-ui/components';
type AssignedLead = ObjectRecord & {
  accountOwnerId: string | null;
  assignmentTeam?: string | null;
};
export const PulseLeadAssignment = ({ companyId }: { companyId: string }) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { hasLeadTeam } = usePulseAssignment();
  const [isSaving, setIsSaving] = useState(false);
  const { record, refetch, loading } = useFindOneRecord<AssignedLead>({
    objectNameSingular: CoreObjectNameSingular.Company,
    objectRecordId: companyId,
    recordGqlFields: {
      id: true,
      accountOwnerId: true,
      ...(hasLeadTeam ? { [PULSE_ASSIGNMENT_TEAM_FIELD]: true } : {}),
    },
  });
  const { updateOneRecord } = useUpdateOneRecord();
  const save = async (assignment: PulseAssignment) => {
    if (isSaving || !record) return;
    setIsSaving(true);
    try {
      await updateOneRecord({
        objectNameSingular: CoreObjectNameSingular.Company,
        idToUpdate: companyId,
        updateOneRecordInput: {
          accountOwnerId: assignment.memberId,
          ...(hasLeadTeam
            ? { [PULSE_ASSIGNMENT_TEAM_FIELD]: assignment.teamValue }
            : {}),
        },
      });
      await refetch();
    } catch {
      enqueueToast({
        variant: 'error',
        children: t`Could not update the lead assignment.`,
      });
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <PulseAssignmentPicker
      value={{
        memberId: record?.accountOwnerId ?? null,
        teamValue: record?.assignmentTeam ?? null,
      }}
      allowTeam={hasLeadTeam}
      disabled={isSaving || loading || !record}
      onChange={(assignment) => void save(assignment)}
    />
  );
};
