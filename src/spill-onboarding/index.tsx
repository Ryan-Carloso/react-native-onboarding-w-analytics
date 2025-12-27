import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  type ImageSourcePropType,
  View,
  BackHandler,
  Platform,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import OnboardingIntroPanel from './components/OnboardingIntroPanel';
import OnboardingPaywallPanel from './components/OnboardingPaywallPanel';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import OnboardingStepPanel from './components/OnboardingStepPanel';
import OnboardingStepContainer from './components/OnboardingStepContainer';
import OnboardingImageContainer from './components/OnboardingImageContainer';
import OnboardingModal from './components/OnboardingModal';
import { type OnboardingProps } from './types';
import useMeasureHeight from './hooks/useMeasureHeight';
import { type Theme } from '../utils/theme';
import { trackEvent } from './analytics';

function SpillOnboarding({
  animationDuration = 500,
  introPanel: introPanelProps,
  steps,
  onComplete,
  onSkip,
  onStepChange: onStepChangeProps,
  showCloseButton = true,
  showBackButton = true,
  wrapInModalOnWeb = true,
  background,
  skipButton,
  apiKey,
  isDev,
  paywallPanel: paywallPanelProps,
  backButtonIcon,
}: OnboardingProps) {
  const { theme } = useTheme();

  const styles = useMemo(() => createStyles(theme), [theme]);
  const backgroundSpillProgress = useSharedValue(0);

  const [step, setStep] = useState(-1);
  const currentStep = step >= 0 ? steps[step] : undefined;
  const firstStep = steps[0];
  const isPaywall = step === steps.length;

  const onStepChange = useCallback(
    (stepNumber: number) => {
      const getStepName = (index: number) => {
        if (index === -1) {
          return 'Intro';
        }
        if (index === steps.length) {
          return 'Paywall';
        }
        const s = steps[index];
        if (!s) {
          return 'Unknown';
        }
        if ('title' in s && s.title) {
          return s.title;
        }
        return `Step ${index + 1}`;
      };

      const fromStepName = getStepName(step);
      const toStepName = getStepName(stepNumber);

      console.log('🔄 Onboarding Step Change:', {
        from: fromStepName,
        to: toStepName,
        index: stepNumber,
      });

      setStep(stepNumber);
      onStepChangeProps?.(stepNumber);

      trackEvent(
        apiKey,
        'step_change',
        {
          from_index: step,
          to_index: stepNumber,
          from_step: fromStepName,
          to_step: toStepName,
        },
        isDev
      );
    },
    [onStepChangeProps, apiKey, step, steps, isDev]
  );

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (step > 0) {
          onStepChange(step - 1);
          return true;
        } else if (step === 0) {
          backgroundSpillProgress.set(
            withTiming(0, {
              duration: animationDuration,
            })
          );
          setTimeout(() => setStep(-1), animationDuration / 2);
          onStepChange(-1);
          return true;
        }

        // stepNumber === -1 (intro panel) - allow default back action
        return false;
      }
    );

    return () => backHandler.remove();
  }, [step, backgroundSpillProgress, onStepChange, animationDuration]);

  const introPanel = useMeasureHeight();
  const stepPanel = useMeasureHeight();
  const screen = useMeasureHeight();

  const onPressStart = () => {
    backgroundSpillProgress.set(
      withTiming(1, {
        duration: animationDuration,
      })
    );
    onStepChange(0);
  };

  const onNextPress = () => {
    if (step === steps.length - 1) {
      if (paywallPanelProps) {
        onStepChange(steps.length);
        return;
      }
      trackEvent(apiKey, 'complete', {}, isDev);
      return onComplete();
    }

    onStepChange(step + 1);
  };

  const onBackPress = () => {
    if (step === 0) {
      backgroundSpillProgress.set(
        withTiming(0, {
          duration: animationDuration,
        })
      );

      onStepChange(-1);
      return;
    }

    onStepChange(step - 1);
  };

  const renderIntroPanel = () => {
    if (typeof introPanelProps === 'function') {
      return introPanelProps({ onPressStart });
    }

    return (
      <OnboardingIntroPanel
        onPressStart={onPressStart}
        title={introPanelProps.title}
        subtitle={introPanelProps.subtitle}
        button={introPanelProps.button}
        image={
          typeof introPanelProps.image === 'function'
            ? introPanelProps.image
            : undefined
        }
      />
    );
  };

  const onPaywallContinue = (planId: string) => {
    trackEvent(apiKey, 'paywall_select', { plan_id: planId }, isDev);
    trackEvent(apiKey, 'complete', { plan_id: planId }, isDev);
    onComplete(planId);
  };

  const renderPaywallPanel = () => {
    if (!paywallPanelProps) return null;

    if (typeof paywallPanelProps === 'function') {
      return paywallPanelProps({ onPressContinue: onPaywallContinue });
    }

    const { onPressContinue, ...otherProps } = paywallPanelProps;

    // Use the provided onPressContinue if available, otherwise use default
    const handleContinue = onPressContinue || onPaywallContinue;

    return (
      <OnboardingPaywallPanel
        onPressContinue={handleContinue}
        {...otherProps}
      />
    );
  };

  const renderStepContent = () => {
    if (!currentStep) {
      return null;
    }
    if (typeof currentStep.component === 'function') {
      return currentStep.component({
        onNext: onNextPress,
        onBack: onBackPress,
        isLast: step === steps.length - 1,
      });
    }

    return (
      <OnboardingStepPanel
        label={currentStep.label}
        title={currentStep.title}
        description={currentStep.description}
        buttonLabel={currentStep.buttonLabel}
        onBackPress={onBackPress}
        onNextPress={onNextPress}
        buttonPrimary={step === steps.length - 1}
        showBackButton={currentStep.showBackButton ?? showBackButton}
        backButtonIcon={currentStep.backButtonIcon ?? backButtonIcon}
      />
    );
  };

  const currentStepImage: ImageSourcePropType | undefined = useMemo(() => {
    if (isPaywall) {
      // Paywall image is rendered inside the panel scrollview
      return undefined;
    }

    if (!currentStep) {
      if (
        typeof introPanelProps !== 'function' &&
        introPanelProps.image &&
        typeof introPanelProps.image !== 'function'
      ) {
        return introPanelProps.image;
      }
      return firstStep?.image;
    }

    return currentStep.image;
  }, [currentStep, firstStep?.image, isPaywall, introPanelProps]);

  const onboardingContent = (
    <View style={styles.container} ref={screen.ref}>
      <View ref={introPanel.ref} style={styles.bottomPanel}>
        {renderIntroPanel()}
      </View>

      <OnboardingImageContainer
        currentStep={currentStep}
        currentStepImage={currentStepImage}
        position={currentStep?.position ?? firstStep?.position ?? 'top'}
        animationDuration={animationDuration}
        backgroundSpillProgress={backgroundSpillProgress}
        screenHeight={screen.height}
        introPanel={introPanel}
        stepPanel={stepPanel}
        background={background}
      />

      {isPaywall ? (
        <View style={styles.fullScreenPanel}>{renderPaywallPanel()}</View>
      ) : (
        <OnboardingStepContainer
          currentStep={currentStep}
          animationDuration={animationDuration}
          showCloseButton={showCloseButton}
          renderStepContent={renderStepContent}
          onSkip={onSkip}
          ref={stepPanel.ref}
          skipButton={skipButton}
        />
      )}
    </View>
  );

  // On web, wrap in modal; on mobile, render directly
  if (Platform.OS === 'web' && wrapInModalOnWeb) {
    return (
      <OnboardingModal onSkip={onSkip}>{onboardingContent}</OnboardingModal>
    );
  }

  return onboardingContent;
}

export default SpillOnboarding;

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg.secondary,
    },
    bottomPanel: {
      paddingHorizontal: 16,
      paddingBottom: 16 + theme.insets.bottom,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    fullScreenPanel: {
      flex: 1,
      zIndex: 10,
    },
  });
