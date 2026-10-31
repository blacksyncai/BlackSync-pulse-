import { BlackSyncIntegrationGuide } from '@/settings/mcp-and-apis/components/BlackSyncIntegrationGuide';
import { SettingsCard } from '@/settings/components/SettingsCard';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsLabContent } from '@/settings/lab/components/SettingsLabContent';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { Section } from 'twenty-ui/components';
import { IconCode, IconApi, IconHistory } from 'twenty-ui/icon';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

const StyledLinks = styled.div`
  display: grid;
  gap: 12px;
  a {
    color: inherit;
    text-decoration: none;
  }
`;
export const SettingsCommunity = () => (
  <SettingsPageLayout
    title={t`BlackSync resources`}
    links={[
      { children: t`Workspace`, href: getSettingsPath(SettingsPath.General) },
      { children: t`Resources` },
    ]}
  >
    <SettingsPageContainer>
      <Section.Root>
        <Section.Header
          title={t`Your BlackSync workspace`}
          description={t`Connect your tools, follow product changes, and manage your workspace.`}
        />
        <StyledLinks>
          <a href={getSettingsPath(SettingsPath.ApiWebhooks)}>
            <SettingsCard
              Icon={<IconApi size={20} />}
              title={t`MCP, APIs & webhooks`}
            />
          </a>
          <a
            href="https://github.com/blacksyncai/BlackSync-pulse-"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SettingsCard
              Icon={<IconCode size={20} />}
              title={t`BlackSync source code`}
            />
          </a>
          <a
            href="https://github.com/blacksyncai/BlackSync-pulse-/commits/application-registration-ownership-guard/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SettingsCard
              Icon={<IconHistory size={20} />}
              title={t`BlackSync changelog`}
            />
          </a>
        </StyledLinks>
      </Section.Root>
      <BlackSyncIntegrationGuide />
      <Section.Root>
        <Section.Header
          title={t`Experimental features`}
          description={t`Review features available for this workspace.`}
        />
        <SettingsLabContent />
      </Section.Root>
    </SettingsPageContainer>
  </SettingsPageLayout>
);
