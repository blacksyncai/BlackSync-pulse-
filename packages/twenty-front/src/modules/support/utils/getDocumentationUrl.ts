import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

export const getDocumentationUrl = (
  _options: { locale?: string | null; path?: string } = {},
): string => getSettingsPath(SettingsPath.Community);
