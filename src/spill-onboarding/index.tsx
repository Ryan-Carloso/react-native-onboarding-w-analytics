import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  type ImageSourcePropType,
  View,
  BackHandler,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useTheme } from '../utils/ThemeContext';
import OnboardingIntroPanel from './components/OnboardingIntroPanel';
import { useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import OnboardingStepPanel from './components/OnboardingStepPanel';
import OnboardingStepContainer from './components/OnboardingStepContainer';
import OnboardingImageContainer from './components/OnboardingImageContainer';
import OnboardingModal from './components/OnboardingModal';
import { type OnboardingProps } from './types';
import useMeasureHeight from './hooks/useMeasureHeight';
import { type Theme } from '../utils/theme';
import { trackEvent } from './analytics';
import { useLogDev } from './hooks/useLogDev';

function SpillOnboarding({
  animationDuration = 500,
  introPanel: introPanelProps,
  steps,
  onComplete,
  onSkip,
  onStepChange: onStepChangeProps,
  showBackButton = true,
  wrapInModalOnWeb = true,
  background,
  skipButton,
  apiKey,
  isDev,
  backButtonIcon,
}: OnboardingProps) {
  const { theme } = useTheme();
  const logDev = useLogDev(!!isDev);

  const styles = useMemo(() => createStyles(theme), [theme]);
  const backgroundSpillProgress = useSharedValue(0);

  const [step, setStep] = useState(-1);
  const stepRef = useRef(step);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const currentStep = step >= 0 ? steps[step] : undefined;
  const firstStep = steps[0];

  const onStepChange = useCallback(
    (stepNumber: number) => {
      const getStepName = (index: number) => {
        if (index === -1) {
          return 'Intro';
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

      logDev('Onboarding Step Change:', {
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
    [onStepChangeProps, apiKey, step, steps, isDev, logDev]
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

  const onPressStart = useCallback(() => {
    backgroundSpillProgress.set(
      withTiming(1, {
        duration: animationDuration,
      })
    );
    onStepChange(0);
  }, [backgroundSpillProgress, animationDuration, onStepChange]);

  const onNextPress = useCallback(() => {
    if (step === steps.length - 1) {
      trackEvent(apiKey, 'complete', {}, isDev);
      return onComplete();
    }

    onStepChange(step + 1);
  }, [step, steps.length, apiKey, isDev, onComplete, onStepChange]);

  const onBackPress = useCallback(() => {
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
  }, [step, backgroundSpillProgress, animationDuration, onStepChange]);

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
        buttonPrimary={false}
        showBackButton={currentStep.showBackButton ?? showBackButton}
        backButtonIcon={currentStep.backButtonIcon ?? backButtonIcon}
      />
    );
  };

  const currentStepImage: ImageSourcePropType | undefined = useMemo(() => {
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
  }, [currentStep, firstStep?.image, introPanelProps]);

  const handleSwipeAdvance = useCallback(() => {
    if (step === -1) {
      onPressStart();
    } else {
      onNextPress();
    }
  }, [step, onPressStart, onNextPress]);

  const handleSwipeReturn = useCallback(() => {
    if (step === -1) return;
    onBackPress();
  }, [step, onBackPress]);

  const processSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const timestamp = new Date().toISOString();
      const currentStepIndex = stepRef.current;

      let allowed = true;
      let restrictionReason = '';

      // Determine constraints
      if (direction === 'left' && currentStepIndex <= 0) {
        allowed = false;
        restrictionReason = 'Blocked left swipe: Already at first item';
      } else if (
        direction === 'right' &&
        currentStepIndex === steps.length - 1
      ) {
        allowed = false;
        restrictionReason = 'Blocked right swipe: Reached last item';
      }

      const debugMsg = `Step: ${currentStepIndex}\nDirection: ${direction}\nAllowed: ${allowed}\nReason: ${restrictionReason}`;
      console.log('Swipe Debug:', debugMsg);
      Alert.alert('Swipe Debug', debugMsg);

      logDev('Swipe Gesture:', {
        timestamp,
        currentIndex: currentStepIndex,
        direction,
        allowed,
        restrictionReason: restrictionReason || 'None',
      });

      if (!allowed) {
        return;
      }

      if (direction === 'right') {
        handleSwipeAdvance();
      } else {
        handleSwipeReturn();
      }
    },
    [steps.length, logDev, handleSwipeAdvance, handleSwipeReturn]
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-20, 20])
        .onEnd((e) => {
          const { translationX, velocityX } = e;
          const threshold = 50;
          const velocityThreshold = 500;

          if (
            translationX > threshold ||
            (translationX > 20 && velocityX > velocityThreshold)
          ) {
            runOnJS(processSwipe)('right');
          } else if (
            translationX < -threshold ||
            (translationX < -20 && velocityX < -velocityThreshold)
          ) {
            runOnJS(processSwipe)('left');
          }
        }),
    [processSwipe]
  );

  const onboardingContent = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.container} ref={screen.ref}>
          <View ref={introPanel.ref} style={styles.bottomPanel}>
            {renderIntroPanel()}
          </View>

          <OnboardingImageContainer
            currentStep={currentStep}
            currentStepImage={currentStepImage}
            animationDuration={animationDuration}
            backgroundSpillProgress={backgroundSpillProgress}
            screenHeight={screen.height}
            introPanel={introPanel}
            stepPanel={stepPanel}
            background={background}
            propimageStyle={
              typeof introPanelProps !== 'function'
                ? introPanelProps.propimageStyle
                : undefined
            }
            // If introPanel.image is a function, do NOT render it in ImageContainer
            // because it's already rendered in OnboardingIntroPanel
            hideImage={
              !currentStep &&
              typeof introPanelProps !== 'function' &&
              typeof introPanelProps.image === 'function'
            }
          />

          <OnboardingStepContainer
            currentStep={currentStep}
            animationDuration={animationDuration}
            renderStepContent={renderStepContent}
            onSkip={onSkip}
            ref={stepPanel.ref}
            skipButton={skipButton}
          />
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
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
    flex1: {
      flex: 1,
    },
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
