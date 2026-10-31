import { useLingui } from '@lingui/react/macro';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { Section } from 'twenty-ui/components';

export const SettingsLegalDpaNew = () => {
  const { t } = useLingui();
  return (
    <SettingsPageLayout
      title={t`BlackSync data processing terms`}
      links={[
        { children: t`Legal`, href: getSettingsPath(SettingsPath.Legal) },
        { children: t`Data processing agreement` },
      ]}
    >
      <SettingsPageContainer>
        <Section.Root>
          <Section.Header
            title={t`BlackSync data processing agreement`}
            description={t`Review BlackSync's data processing terms and arrange an agreement with BlackSync. Existing signed documents remain in your agreement history.`}
          />
          <a
            href="https://blacksync.ai/legal/dpa"
            target="_blank"
            rel="noopener noreferrer"
          >{t`Open BlackSync data processing terms`}</a>
        </Section.Root>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
