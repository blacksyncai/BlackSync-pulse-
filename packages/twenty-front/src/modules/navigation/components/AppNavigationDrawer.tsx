import { ThemeProvider } from 'twenty-ui/theme';
import { useIsSettingsDrawer } from '@/navigation/hooks/useIsSettingsDrawer';

import { MainNavigationDrawerContent } from '@/navigation/components/MainNavigationDrawerContent';
import { MainNavigationDrawerModeSwitcher } from '@/navigation/components/MainNavigationDrawerModeSwitcher';
import { NavigationDrawerModeTransition } from '@/navigation/components/NavigationDrawerModeTransition';
import { SettingsNavigationDrawerContent } from '@/navigation/components/SettingsNavigationDrawerContent';
import { NavigationDrawer } from '@/ui/navigation/navigation-drawer/components/NavigationDrawer';
import { NavigationDrawerFixedContent } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerFixedContent';
import { useIsMobile } from 'twenty-ui/utilities';

export type AppNavigationDrawerProps = {
  className?: string;
};

export const AppNavigationDrawer = ({
  className,
}: AppNavigationDrawerProps) => {
  const isMobile = useIsMobile();
  const isSettingsDrawer = useIsSettingsDrawer();

  // The main navigation is the home page on mobile, not a drawer.
  if (isMobile && !isSettingsDrawer) {
    return null;
  }

  return (
    <ThemeProvider
      colorScheme="dark"
      applyToRoot={false}
      overrides={{
        '--t-background-primary': '#201f1c',
        '--t-background-secondary': '#24231f',
        '--t-background-tertiary': '#34322d',
        '--t-font-color-primary': '#f3f0e8',
        '--t-font-color-secondary': '#c2bdb1',
        '--t-font-color-tertiary': '#a39d90',
        '--t-border-color-light': '#ffffff12',
        '--t-border-color-medium': '#ffffff20',
        '--t-accent-quaternary': '#39332b',
        '--t-accent-primary': '#654433',
        '--t-accent-secondary': '#654433',
        '--t-accent-tertiary': '#332b26',
        '--t-accent-accent9': '#b45537',
        '--t-accent-accent10': '#a3482d',
        '--t-accent-accent12': '#fae4d4',
        '--t-accent-accent5': '#6d503c',
        '--t-accent-accent11': '#e9b299',
        '--bs-nav-background': '#1d1d1b',
      }}
    >
      <NavigationDrawer className={className}>
        {/* Mobile switches modes from the bottom navigation bar instead. */}
        {!isMobile && (
          <NavigationDrawerFixedContent>
            <MainNavigationDrawerModeSwitcher />
          </NavigationDrawerFixedContent>
        )}

        <NavigationDrawerModeTransition>
          {isSettingsDrawer ? (
            <SettingsNavigationDrawerContent />
          ) : (
            <MainNavigationDrawerContent />
          )}
        </NavigationDrawerModeTransition>
      </NavigationDrawer>
    </ThemeProvider>
  );
};
