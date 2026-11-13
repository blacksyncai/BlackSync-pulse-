import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { domainConfigurationState } from '@/domain-manager/states/domainConfigurationState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useReadDefaultDomainFromConfiguration } from '@/domain-manager/hooks/useReadDefaultDomainFromConfiguration';

export const useIsCurrentLocationOnDefaultDomain = () => {
  const isMultiWorkspaceEnabled = useAtomStateValue(
    isMultiWorkspaceEnabledState,
  );
  const { defaultDomain } = useReadDefaultDomainFromConfiguration();
  const domainConfiguration = useAtomStateValue(domainConfigurationState);
  // The apex domain (frontDomain itself) hosts the landing page and auth flows,
  // same as the default app subdomain; only workspace subdomains run the app.
  const isDefaultDomain = isMultiWorkspaceEnabled
    ? window.location.hostname === defaultDomain ||
      window.location.hostname === domainConfiguration.frontDomain
    : true;

  return {
    isDefaultDomain,
  };
};
