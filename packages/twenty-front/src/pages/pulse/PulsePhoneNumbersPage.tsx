import { gql } from '@apollo/client';
import { useApolloClient, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { v4 } from 'uuid';
import { IconPhone } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
const SETTINGS = gql`
  query CrmPhoneNumbers {
    crmPhoneNumbers
  }
`;
const SEARCH = gql`
  query SearchCrmPhoneNumbers($areaCode: String!) {
    searchCrmPhoneNumbers(areaCode: $areaCode)
  }
`;
const CHECKOUT = gql`
  mutation CheckoutCrmPhoneNumber($number: String!, $requestId: String!) {
    checkoutCrmPhoneNumber(number: $number, requestId: $requestId)
  }
`;
const REFRESH = gql`
  mutation RefreshCrmPhoneNumbers {
    refreshCrmPhoneNumbers
  }
`;
const PORTAL = gql`
  mutation ManageCrmPhoneNumber($orderId: String!) {
    manageCrmPhoneNumber(orderId: $orderId)
  }
`;
type Settings = {
  numbers: { number: string }[];
  orders: { id: string; number: string; status: string }[];
  checkoutConfigured: boolean;
  carrierConfigured: boolean;
};
const StyledPage = styled.div`
  padding: 24px;
  overflow: auto;
  flex: 1;
  min-height: 0;
  color: ${themeCssVariables.font.color.primary};
  section {
    max-width: 880px;
    margin: 20px 0;
    padding: 24px;
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 12px;
    background: ${themeCssVariables.background.primary};
  }
  h1 {
    font-size: 24px;
    margin: 0 0 10px;
  }
  h2 {
    font-size: 18px;
  }
  p {
    color: ${themeCssVariables.font.color.secondary};
    line-height: 1.6;
  }
  input,
  button {
    font: inherit;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid ${themeCssVariables.border.color.strong};
    background: ${themeCssVariables.background.secondary};
    color: inherit;
  }
  button {
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  input {
    max-width: 100px;
    margin: 8px 12px 8px 0;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    padding: 14px 0;
    border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  }
  [role='alert'] {
    color: ${themeCssVariables.font.color.danger};
  }
  button:focus-visible,
  input:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.accent9};
    outline-offset: 3px;
  }
  @media (max-width: 640px) {
    padding: 16px;
    section {
      padding: 16px;
    }
  }
`;
export const PulsePhoneNumbersPage = () => {
  const { t, i18n } = useLingui();
  const client = useApolloClient();
  const { data, loading, error, refetch } = useQuery<{
    crmPhoneNumbers: Settings;
  }>(SETTINGS);
  const settings = data?.crmPhoneNumbers;
  const [areaCode, setAreaCode] = useState('');
  const [available, setAvailable] = useState<{ number: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const [requestIds] = useState(() => new Map<string, string>());
  const refresh = async () => {
    setBusy(true);
    setFailure('');
    try {
      await client.mutate({ mutation: REFRESH });
      await refetch();
    } catch (caught) {
      setFailure(
        caught instanceof Error
          ? caught.message
          : t`Could not refresh numbers.`,
      );
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get('checkout') !== 'success'
    )
      return;
    let active = true;
    const poll = async () => {
      try {
        await client.mutate({ mutation: REFRESH });
        if (active) await refetch();
      } catch {
        if (active)
          setFailure(t`Your payment is being checked. Refresh to check again.`);
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 15000);
    const timeout = window.setTimeout(
      () => window.clearInterval(timer),
      120000,
    );
    return () => {
      active = false;
      window.clearInterval(timer);
      window.clearTimeout(timeout);
    };
  }, [client, refetch, i18n]);
  const statusLabel = (status: string) =>
    ({
      active: t`Active`,
      awaiting_payment: t`Awaiting payment`,
      suspended: t`Billing inactive`,
      provisioning_failed: t`Paid · provisioning needs attention`,
    })[status] ?? t`Pending`;
  return (
    <PageCardLayout
      header={<PageHeader title={t`CRM phone numbers`} Icon={IconPhone} />}
    >
      <StyledPage>
        <h1>{t`Your workspace. Your numbers.`}</h1>
        <p>{t`Dedicated outbound CRM calling numbers cost $3.50 per number per month. These lines belong to this workspace and are separate from AI calling campaign numbers. Your Stripe promotion code can be entered at checkout. Calling usage is separate from the number rental.`}</p>
        {loading && <p role="status">{t`Loading your numbers…`}</p>}
        {(error || failure) && <p role="alert">{failure || error?.message}</p>}
        <section>
          <h2>{t`Your CRM numbers`}</h2>
          <button disabled={busy} onClick={() => void refresh()}>
            {busy ? t`Checking…` : t`Refresh payment and number status`}
          </button>
          {settings?.orders.length === 0 && (
            <p>{t`No CRM numbers purchased yet. Existing AI campaign numbers are not available here.`}</p>
          )}
          <ul>
            {settings?.orders.map((order) => (
              <li key={order.id}>
                <span>
                  <strong>{order.number}</strong> · {statusLabel(order.status)}
                </span>
                {order.status !== 'awaiting_payment' && (
                  <button
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setFailure('');
                      try {
                        const result = await client.mutate<{
                          manageCrmPhoneNumber: string;
                        }>({
                          mutation: PORTAL,
                          variables: { orderId: order.id },
                        });
                        if (result.data?.manageCrmPhoneNumber)
                          window.location.assign(
                            result.data.manageCrmPhoneNumber,
                          );
                      } catch (caught) {
                        setFailure(
                          caught instanceof Error
                            ? caught.message
                            : t`Could not open billing.`,
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >{t`Manage subscription`}</button>
                )}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>{t`Get a dedicated number`}</h2>
          {settings && !settings.checkoutConfigured && (
            <p role="alert">
              {t`Number purchasing is off because the CRM services have no live Stripe key. Add a live key as the BILLING_STRIPE_API_KEY repository secret (Settings → Secrets and variables → Actions), make sure the PULSE_RAILWAY_IMAGE_DEPLOYS variable is true, then re-run the Pulse deploy workflow so the key is copied to the server and worker. Never paste the key into the repo or chat — rotate it in the Stripe Dashboard if it was ever shared.`}
            </p>
          )}
          {settings && !settings.carrierConfigured && (
            <p role="alert">{t`Number purchasing needs Plivo credentials (PLIVO_AUTH_ID and PLIVO_AUTH_TOKEN) on the CRM services. Existing campaign numbers will not be shared as a fallback.`}</p>
          )}
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setFailure('');
              setAvailable([]);
              try {
                const result = await client.query<{
                  searchCrmPhoneNumbers: { number: string }[];
                }>({
                  query: SEARCH,
                  variables: { areaCode },
                  fetchPolicy: 'network-only',
                });
                setAvailable(result.data?.searchCrmPhoneNumbers ?? []);
              } catch (caught) {
                setFailure(
                  caught instanceof Error
                    ? caught.message
                    : t`Could not search numbers.`,
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <label htmlFor="crm-area-code">{t`US area code`}</label>
            <br />
            <input
              id="crm-area-code"
              inputMode="numeric"
              pattern="[2-9][0-9]{2}"
              maxLength={3}
              value={areaCode}
              onChange={(event) =>
                setAreaCode(event.target.value.replace(/\D/g, ''))
              }
              placeholder="212"
              required
            />
            <button
              disabled={
                busy ||
                !settings?.carrierConfigured ||
                !settings?.checkoutConfigured
              }
            >{t`Find numbers`}</button>
          </form>
          <ul>
            {available.map(({ number }) => (
              <li key={number}>
                <strong>{number}</strong>
                <button
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setFailure('');
                    try {
                      const requestId = requestIds.get(number) ?? v4();
                      requestIds.set(number, requestId);
                      const result = await client.mutate<{
                        checkoutCrmPhoneNumber: string;
                      }>({
                        mutation: CHECKOUT,
                        variables: { number, requestId },
                      });
                      if (result.data?.checkoutCrmPhoneNumber)
                        window.location.assign(
                          result.data.checkoutCrmPhoneNumber,
                        );
                    } catch (caught) {
                      setFailure(
                        caught instanceof Error
                          ? caught.message
                          : t`Could not open checkout.`,
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >{t`Continue to Stripe · $3.50/month`}</button>
              </li>
            ))}
          </ul>
          <p>{t`A workspace billing administrator completes checkout. A number becomes callable only after Stripe confirms payment and carrier provisioning succeeds.`}</p>
        </section>
      </StyledPage>
    </PageCardLayout>
  );
};
