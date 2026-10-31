import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Section } from 'twenty-ui/components';
import { themeCssVariables } from 'twenty-ui/theme';
import { AppPath, SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { LightCopyIconButton } from '@/object-record/record-field/ui/components/LightCopyIconButton';
import { buildMcpServerUrl } from '@/settings/mcp-and-apis/utils/mcpSetup';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

const StyledGuide = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  p,
  li {
    color: ${themeCssVariables.font.color.secondary};
    font-size: ${themeCssVariables.font.size.md};
    line-height: 1.7;
  }
  p {
    margin: 0;
  }
  ol {
    margin: 0;
    padding-left: 24px;
  }
  a {
    color: ${themeCssVariables.accent.accent11};
  }
`;
const StyledEndpoint = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 8px;
  code {
    overflow-wrap: anywhere;
    flex: 1;
    font-size: 12px;
  }
`;
const StyledCode = styled.pre`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 8px;
  padding: 16px;
  overflow: auto;
  max-width: 100%;
  font-size: 12px;
  line-height: 1.7;
`;

export const BlackSyncIntegrationGuide = () => {
  const { t } = useLingui();
  const base = REACT_APP_SERVER_BASE_URL.replace(/\/+$/, '');
  const callEndpoint = `${base}/rest/pulse/calls`;
  const example = JSON.stringify(
    {
      source: 'blacksync-si',
      externalId: 'call-12345',
      phoneNumber: '+15551234567',
      direction: 'inbound',
      durationSeconds: 120,
      outcome: 'answered',
      personId: 'REPLACE_WITH_CONTACT_UUID',
      companyId: 'REPLACE_WITH_LEAD_UUID',
      summary: 'Discussed the proposal and agreed on a follow-up.',
      transcript: 'Agent: Thanks for calling.\nCustomer: I would like a demo.',
    },
    null,
    2,
  );
  const request = `curl --request POST '${callEndpoint}' \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '${example}'`;
  return (
    <StyledGuide>
      <Section.Root>
        <Section.Header
          title={t`Connect BlackSync to Claude & ChatGPT`}
          description={t`Use your own workspace's MCP server and authorize access to your BlackSync data.`}
        />
        <StyledEndpoint>
          <code>{buildMcpServerUrl(base)}</code>
          <LightCopyIconButton copyText={buildMcpServerUrl(base)} />
        </StyledEndpoint>
        <ol>
          <li>{t`In ChatGPT, open Plugins, choose Add, then add a custom MCP server. Name it BlackSync Cloud and paste the URL above. Access depends on your plan and workspace permissions.`}</li>
          <li>{t`Choose OAuth, sign in to BlackSync, and review the permissions. In Claude, add the same URL as a custom connector and complete authorization.`}</li>
          <li>{t`For clients that support static headers, create an API key and use Authorization: Bearer YOUR_API_KEY. Keep keys in your integration's secret store.`}</li>
        </ol>
      </Section.Root>
      <Section.Root>
        <Section.Header
          title={t`Push calls into the CRM`}
          description={t`Use an automation step or a server-side adapter to send completed call activity.`}
        />
        <StyledEndpoint>
          <code>POST {callEndpoint}</code>
          <LightCopyIconButton copyText={callEndpoint} />
        </StyledEndpoint>
        <p>{t`Create an API key with permission to read the selected contacts or leads and to read and create notes and note targets. Replace the UUID placeholders below with real record IDs. You can omit either personId or companyId, but one is required.`}</p>
        <a
          href={getSettingsPath(SettingsPath.NewApiKey)}
        >{t`Create an API key`}</a>
        <StyledEndpoint>
          <span>{t`Example request`}</span>
          <LightCopyIconButton copyText={request} />
        </StyledEndpoint>
        <StyledCode>{request}</StyledCode>
        <p>{t`The first request returns 201 and a noteId. Retrying the same source and externalId in the same workspace returns 200 and the same noteId without creating another call. The first saved call is kept; use a new externalId for a different call.`}</p>
        <p>{t`Optional recordingUrl must use HTTPS. It is linked on the call card; this endpoint does not download or transcribe external recordings. Plivo's existing recording flow continues separately.`}</p>
        <p>{t`This endpoint expects the normalized JSON shown above. A provider that cannot send a Bearer header needs an adapter; do not send raw provider webhooks directly or put your API key in the URL.`}</p>
      </Section.Root>
      <Section.Root>
        <Section.Header
          title={t`Tags, records & outgoing events`}
          description={t`Use the same record fields from the CRM, the API, workflows, and MCP.`}
        />
        <p>{t`Open Customize → Tags to create multi-select tags for leads, contacts, or deals. Tag values are available from the field metadata; update the record's tags array through its normal record API.`}</p>
        <a href={AppPath.PulseCustomize}>{t`Customize tags and fields`}</a>
        <StyledCode>{`GET ${base}/rest/people\nGET ${base}/rest/companies\nGET ${base}/rest/opportunities\nGET ${base}/rest/tasks\nPATCH ${base}/rest/people/CONTACT_UUID\n{ "tags": ["YOUR_CONFIGURED_TAG_VALUE"] }`}</StyledCode>
        <p>{t`Updating tags replaces that record's tag list. Read the current values first if you want to append tags. Outgoing webhooks notify your systems when subscribed CRM records change.`}</p>
        <a
          href={getSettingsPath(SettingsPath.NewWebhook)}
        >{t`Create an outgoing webhook`}</a>
      </Section.Root>
    </StyledGuide>
  );
};
