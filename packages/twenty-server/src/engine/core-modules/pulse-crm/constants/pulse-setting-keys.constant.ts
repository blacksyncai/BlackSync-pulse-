// Workspace-wide Pulse settings a member may read and write from the app.
export const PULSE_SETTING_KEYS = [
  'smartViews',
  'dealCardLayout',
  'emailTemplates',
  'sequences',
  'notificationPreferences',
] as const;

export type PulseSettingKey = (typeof PULSE_SETTING_KEYS)[number];
