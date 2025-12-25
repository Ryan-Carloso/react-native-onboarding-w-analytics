import ThemeProvider from './utils/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  type OnboardingProps,
  type OnboardingColors,
  type OnboardingFonts,
  type OnboardingIntroPanelProps,
  type OnboardingStepPanelProps,
  type OnboardingStep,
  type OnboardingPaywallPanelProps,
  type PaywallPlan,
} from './spill-onboarding/types';
import SpillOnboarding from './spill-onboarding';
import OnboardingPaywallPanel from './spill-onboarding/components/OnboardingPaywallPanel';
import { Platform } from 'react-native';
import React from 'react';

function Onboarding({ colors, fonts, theme, ...props }: OnboardingProps) {
  const SafeArea = Platform.OS === 'web' ? React.Fragment : SafeAreaProvider;

  return (
    <SafeArea>
      <ThemeProvider colors={colors} fonts={fonts} theme={theme}>
        <SpillOnboarding {...props} />
      </ThemeProvider>
    </SafeArea>
  );
}

export default Onboarding;
export { OnboardingPaywallPanel };
export type {
  OnboardingProps,
  OnboardingColors,
  OnboardingFonts,
  OnboardingIntroPanelProps,
  OnboardingStepPanelProps,
  OnboardingStep,
  OnboardingPaywallPanelProps,
  PaywallPlan,
};
