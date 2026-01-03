import { useMemo, type ReactNode } from 'react';
import type { ImageProps as ExpoImageProps } from 'expo-image';
import {
  Image,
  type ImageSourcePropType,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  interpolate,
  useDerivedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  type SharedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { useTheme } from '../../utils/ThemeContext';
import useMeasureHeight from '../hooks/useMeasureHeight';
import type { Theme } from '../../utils/theme';
import type { OnboardingStep } from '../types';
import { ExpoImage } from '../adapters/expo-image';
import type { StyleProp, ImageStyle } from 'react-native';

interface OnboardingImageContainerProps {
  currentStep: OnboardingStep | undefined;
  currentStepImage: ImageSourcePropType | undefined;
  animationDuration: number;
  backgroundSpillProgress: SharedValue<number>;
  introPanel: any;
  stepPanel: any;
  screenHeight: number;
  background?: () => ReactNode;
  propimageStyle?: StyleProp<ImageStyle>;
  hideImage?: boolean;
}

function OnboardingImageContainer({
  currentStep,
  currentStepImage,
  animationDuration,
  backgroundSpillProgress,
  introPanel,
  stepPanel,
  screenHeight,
  background,
  propimageStyle,
  hideImage,
}: OnboardingImageContainerProps) {
  const { theme } = useTheme();
  const image = useMeasureHeight();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const extraPadding = Platform.OS === 'web' ? 16 : 0;
  const { width: screenWidth } = useWindowDimensions();

  // bottom panel height (intro or step)
  const bottomPanelHeight = (currentStep ? stepPanel : introPanel).height || 0;

  /**
   * When 0 -> no spill; when 1 -> fully spilled by bottomPanelHeight
   */
  const backgroundSpillDistance = useDerivedValue(() =>
    interpolate(backgroundSpillProgress.value, [0, 1], [0, bottomPanelHeight])
  );

  const imageWrapperHeight = useDerivedValue(
    () => screenHeight - bottomPanelHeight + backgroundSpillDistance.value
  );

  const imageWrapperAnimation = useAnimatedStyle(() => ({
    height: imageWrapperHeight.value,
  }));

  const imageTargetY = useDerivedValue(() => {
    return theme.insets.top + extraPadding + 16;
  });

  const hasMounted = useSharedValue(false);

  const imageAnimation = useAnimatedStyle(() => {
    const translateY = withTiming(
      imageTargetY.value,
      {
        duration: hasMounted.value ? animationDuration : 0,
        easing: Easing.out(Easing.cubic),
      },
      () => (hasMounted.value = true)
    );
    const sideEdges = Math.max(32 + 24 - backgroundSpillDistance.value, 0);

    return {
      transform: [{ translateY }],
      maxWidth: screenWidth - sideEdges,
    };
  }, [animationDuration]);

  const backgroundAnimation = useAnimatedStyle(() => {
    const topEdge = Math.max(
      theme.insets.top + extraPadding - backgroundSpillDistance.value,
      0
    );
    const sideEdge = Math.max(16 - backgroundSpillDistance.value, 0);

    return {
      position: 'absolute',
      top: topEdge,
      left: sideEdge,
      right: sideEdge,
      bottom: screenHeight - imageWrapperHeight.value,
      borderRadius: Math.max(12 - backgroundSpillDistance.value, 0),
    };
  });

  return (
    <>
      {background ? (
        <Animated.View style={backgroundAnimation}>
          {background()}
        </Animated.View>
      ) : (
        <Animated.View style={[styles.colorBg, backgroundAnimation]} />
      )}

      {currentStepImage && !hideImage && (
        <Animated.View style={[styles.imageWrapper, imageWrapperAnimation]}>
          <Animated.View style={[styles.image, imageAnimation]} ref={image.ref}>
            {ExpoImage ? (
              <ExpoImage
                source={currentStepImage as ExpoImageProps['source']}
                contentFit="contain"
                transition={0}
                style={[
                  styles.imageStyle,
                  currentStep?.propimageStyle || propimageStyle,
                ]}
              />
            ) : (
              <Image
                source={currentStepImage}
                resizeMode="contain"
                fadeDuration={0}
                style={[
                  styles.imageStyle,
                  currentStep?.propimageStyle || propimageStyle,
                ]}
              />
            )}
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}

export default OnboardingImageContainer;

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    colorBg: {
      backgroundColor: theme.bg.primary,
      overflow: 'hidden',
    },
    imageWrapper: {
      position: 'relative',
      overflow: 'visible',
    },
    image: {
      alignSelf: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
    },
    imageStyle: {
      width: '100%',
      height: '100%',
    },
  });
