import React, { createContext, useContext, useMemo } from 'react';
import { defaultTheme, type Theme, DarkTheme, LightTheme } from './theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  type OnboardingColors,
  type OnboardingFonts,
} from '../spill-onboarding/types';

const ThemeContext = createContext<{ theme: Theme }>({
  theme: {
    ...defaultTheme,
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
  },
});

interface ThemeProviderProps {
  children: React.ReactNode;
  theme?: 'dark' | 'light';
  colors?: Partial<OnboardingColors>;
  fonts?: OnboardingFonts | string;
}

export default function ThemeProvider({
  children,
  theme: themePreset = 'light',
  colors: customColors,
  fonts: customFonts,
}: ThemeProviderProps) {
  const insets = useSafeAreaInsets();

  const theme: Theme = useMemo(() => {
    const baseTheme = themePreset === 'dark' ? DarkTheme : LightTheme;

    console.log('🎨 ThemeProvider:', {
      preset: themePreset,
      isDark: themePreset === 'dark',
      baseBg: baseTheme.bg.primary,
      baseText: baseTheme.text.primary,
      customColors,
    });

    const fonts =
      typeof customFonts === 'string'
        ? {
            introTitle: customFonts,
            introSubtitle: customFonts,
            introButton: customFonts,
            stepLabel: customFonts,
            stepTitle: customFonts,
            stepDescription: customFonts,
            stepButton: customFonts,
            primaryButton: customFonts,
            secondaryButton: customFonts,
          }
        : {
            introTitle: customFonts?.introTitle ?? baseTheme.fonts.introTitle,
            introSubtitle:
              customFonts?.introSubtitle ?? baseTheme.fonts.introSubtitle,
            introButton:
              customFonts?.introButton ?? baseTheme.fonts.introButton,
            stepLabel: customFonts?.stepLabel ?? baseTheme.fonts.stepLabel,
            stepTitle: customFonts?.stepTitle ?? baseTheme.fonts.stepTitle,
            stepDescription:
              customFonts?.stepDescription ?? baseTheme.fonts.stepDescription,
            stepButton: customFonts?.stepButton ?? baseTheme.fonts.stepButton,
            primaryButton:
              customFonts?.primaryButton ?? baseTheme.fonts.primaryButton,
            secondaryButton:
              customFonts?.secondaryButton ?? baseTheme.fonts.secondaryButton,
          };

    const { background, text: textColors } = customColors ?? {};
    const bg = {
      primary: background?.primary ?? baseTheme.bg.primary,
      secondary: background?.secondary ?? baseTheme.bg.secondary,
      label: background?.label ?? baseTheme.bg.label,
      accent: background?.accent ?? baseTheme.bg.accent,
    };
    const text = {
      primary: textColors?.primary ?? baseTheme.text.primary,
      secondary: textColors?.secondary ?? baseTheme.text.secondary,
      contrast: textColors?.contrast ?? baseTheme.text.contrast,
    };

    return { bg, text, fonts, insets };
  }, [insets, themePreset, customColors, customFonts]);

  return (
    <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
