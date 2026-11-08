import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useSaveSelectOptions } from '@/pulse-customize/hooks/useSaveSelectOptions';
import {
  assignmentMemberName,
  PULSE_ASSIGNMENT_TEAM_FIELD,
  usePulseAssignment,
  type PulseAssignmentTeam,
} from '@/pulse-assignment/contexts/PulseAssignmentContext';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { CoreObjectNameSingular, FieldMetadataType } from 'twenty-shared/types';
import { useToast } from 'twenty-ui/components';
import { themeCssVariables } from 'twenty-ui/theme';
import { v4 } from 'uuid';
const StyledEditor = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  fieldset {
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 12px;
    padding: 16px;
    min-width: 0;
  }
  label {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
  }
  input,
  button {
    font: inherit;
    max-width: 100%;
    box-sizing: border-box;
  }
  input[type='text'] {
    background: ${themeCssVariables.background.primary};
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 8px;
    color: ${themeCssVariables.font.color.primary};
    padding: 8px;
  }
  button {
    background: ${themeCssVariables.accent.quaternary};
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 8px;
    color: ${themeCssVariables.font.color.primary};
    padding: 8px;
    cursor: pointer;
    margin: 4px;
  }
  p {
    color: ${themeCssVariables.font.color.secondary};
  }
`;
export const PulseTeamsEditor = () => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { teams, members, saveTeams } = usePulseAssignment();
  const { objectMetadataItem: company } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Company,
  });
  const { objectMetadataItem: task } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Task,
  });
  const { saveSelectOptions } = useSaveSelectOptions();
  const [editing, setEditing] = useState<PulseAssignmentTeam | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const save = async () => {
    if (!editing || !editing.name.trim() || isSaving) return;
    if (
      teams.some(
        (team) =>
          team.id !== editing.id &&
          team.name.toLowerCase() === editing.name.trim().toLowerCase(),
      )
    ) {
      enqueueToast({
        variant: 'error',
        children: t`A team with that name already exists.`,
      });
      return;
    }
    setIsSaving(true);
    try {
      for (const metadata of [company, task]) {
        const field = metadata.fields.find(
          (candidate) => candidate.name === PULSE_ASSIGNMENT_TEAM_FIELD,
        );
        if (field && field.type !== FieldMetadataType.SELECT)
          throw new Error('Team field type mismatch');
        const options = [...(field?.options ?? [])].map((option) => ({
          ...option,
          label:
            option.value === editing.id ? editing.name.trim() : option.label,
        }));
        if (!options.some((option) => option.value === editing.id))
          options.push({
            id: v4(),
            value: editing.id,
            label: editing.name.trim(),
            color: 'purple',
            position: options.length,
          });
        const saved = await saveSelectOptions({
          objectMetadataId: metadata.id,
          field,
          fieldName: PULSE_ASSIGNMENT_TEAM_FIELD,
          label: t`Assignment team`,
          icon: 'IconUsers',
          options,
        });
        if (!saved) throw new Error('Team field could not be saved');
      }
      await saveTeams([
        ...teams.filter((team) => team.id !== editing.id),
        { ...editing, name: editing.name.trim() },
      ]);
      setEditing(null);
      enqueueToast({ variant: 'success', children: t`Team saved.` });
    } catch {
      enqueueToast({
        variant: 'error',
        children: t`Could not save the team. You need permission to manage the data model and workspace members.`,
      });
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <StyledEditor>
      <p>{t`Teams are shared work queues. A lead or task can have both an assigned user and a team. Team membership does not change record access permissions.`}</p>
      {teams.map((team) => (
        <fieldset key={team.id}>
          <legend>
            {team.name}
            {team.archived ? t` (archived)` : ''}
          </legend>
          <p>{t`${team.memberIds.length} members`}</p>
          <button
            type="button"
            disabled={isSaving}
            onClick={() =>
              setEditing({ ...team, memberIds: [...team.memberIds] })
            }
          >{t`Edit team`}</button>
        </fieldset>
      ))}
      {!editing ? (
        <button
          type="button"
          onClick={() =>
            setEditing({
              id: 'TEAM_' + v4().replace(/-/g, '').toUpperCase(),
              name: '',
              memberIds: [],
              archived: false,
            })
          }
        >{t`Create team`}</button>
      ) : (
        <fieldset disabled={isSaving}>
          <legend>{t`Team details`}</legend>
          <input
            type="text"
            aria-label={t`Team name`}
            maxLength={80}
            value={editing.name}
            onChange={(event) =>
              setEditing({ ...editing, name: event.target.value })
            }
          />
          {members.map((member) => (
            <label key={member.id}>
              <input
                type="checkbox"
                checked={editing.memberIds.includes(member.id)}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    memberIds: event.target.checked
                      ? [...editing.memberIds, member.id]
                      : editing.memberIds.filter((id) => id !== member.id),
                  })
                }
              />
              {assignmentMemberName(member)}
            </label>
          ))}
          <label>
            <input
              type="checkbox"
              checked={editing.archived}
              onChange={(event) =>
                setEditing({ ...editing, archived: event.target.checked })
              }
            />
            {t`Archive team (keep existing assignments)`}
          </label>
          <button
            type="button"
            disabled={!editing.name.trim()}
            onClick={() => void save()}
          >
            {isSaving ? t`Saving…` : t`Save team`}
          </button>
          <button
            type="button"
            onClick={() => setEditing(null)}
          >{t`Cancel`}</button>
        </fieldset>
      )}
    </StyledEditor>
  );
};
