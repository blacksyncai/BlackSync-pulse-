import { usePulseSetting } from '@/pulse-settings/hooks/usePulseSetting';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { themeCssVariables } from 'twenty-ui/theme';

export type PulseNotificationPreferences = {
  emailDueReminders: boolean;
  emailAssignments: boolean;
  reminderLeadMinutes: number;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: PulseNotificationPreferences = {
  emailDueReminders: true,
  emailAssignments: true,
  reminderLeadMinutes: 15,
};

const StyledRow = styled.label`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[3]} 0;

  small {
    color: ${themeCssVariables.font.color.tertiary};
    display: block;
    font-size: ${themeCssVariables.font.size.sm};
  }

  input[type='checkbox'] {
    accent-color: ${themeCssVariables.accent.accent9};
    height: 18px;
    width: 18px;
  }

  select {
    background: ${themeCssVariables.background.primary};
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 8px;
    color: ${themeCssVariables.font.color.primary};
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.md};
    height: 34px;
  }
`;

export const PulseNotificationPreferencesEditor = () => {
  const { t } = useLingui();
  const { value, save } = usePulseSetting<PulseNotificationPreferences>(
    'notificationPreferences',
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const preferences = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...value };

  const update = (patch: Partial<PulseNotificationPreferences>) =>
    void save({ ...preferences, ...patch });

  return (
    <div>
      <StyledRow>
        <span>
          {t`Email me before a task is due`}
          <small>{t`Sent to whoever the task is assigned to.`}</small>
        </span>
        <input
          type="checkbox"
          checked={preferences.emailDueReminders}
          onChange={(event) =>
            update({ emailDueReminders: event.target.checked })
          }
        />
      </StyledRow>
      <StyledRow>
        <span>{t`How early`}</span>
        <select
          value={preferences.reminderLeadMinutes}
          onChange={(event) =>
            update({ reminderLeadMinutes: Number(event.target.value) })
          }
        >
          <option value={5}>{t`5 minutes before`}</option>
          <option value={15}>{t`15 minutes before`}</option>
          <option value={30}>{t`30 minutes before`}</option>
          <option value={60}>{t`1 hour before`}</option>
        </select>
      </StyledRow>
      <StyledRow>
        <span>
          {t`Email when someone assigns me a task`}
          <small>{t`Not sent for tasks you create for yourself.`}</small>
        </span>
        <input
          type="checkbox"
          checked={preferences.emailAssignments}
          onChange={(event) =>
            update({ emailAssignments: event.target.checked })
          }
        />
      </StyledRow>
    </div>
  );
};
