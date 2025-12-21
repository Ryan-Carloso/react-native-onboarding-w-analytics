import { useMemo, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import type { Theme } from '../../utils/theme';
import PrimaryButton from '../buttons/PrimaryButton';
import { fontSizes, lineHeights } from '../../utils/fontStyles';
import type { OnboardingPaywallPanelProps } from '../types';

function OnboardingPaywallPanel({
  onPressContinue,
  title,
  subtitle,
  button,
  image,
  plans,
}: OnboardingPaywallPanelProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    plans[0]?.id || ''
  );

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const renderTitle = () => {
    if (!title) return null;
    if (typeof title === 'string') {
      return (
        <Text style={[styles.text, styles.line1, styles.titleText]}>
          {title}
        </Text>
      );
    }
    return title;
  };

  const renderSubtitle = () => {
    if (!subtitle) return null;
    if (typeof subtitle === 'string') {
      return (
        <Text style={[styles.text, styles.line2, styles.subtitleText]}>
          {subtitle}
        </Text>
      );
    }
    return subtitle;
  };

  const renderFeatures = () => {
    if (!selectedPlan?.features || selectedPlan.features.length === 0)
      return null;

    return (
      <View style={styles.featuresContainer}>
        {selectedPlan.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={styles.checkIcon}>✓</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPlans = () => {
    return (
      <View style={styles.plansContainer}>
        {plans.map((plan) => {
          const isSelected = plan.id === selectedPlanId;
          return (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, isSelected && styles.planCardSelected]}
              onPress={() => setSelectedPlanId(plan.id)}
              activeOpacity={0.8}
            >
              <View>
                <Text
                  style={[
                    styles.planTitle,
                    isSelected && styles.planTitleSelected,
                  ]}
                >
                  {plan.title}
                </Text>
                {plan.interval && (
                  <Text
                    style={[
                      styles.planInterval,
                      isSelected && styles.planIntervalSelected,
                    ]}
                  >
                    {plan.interval}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.planPrice,
                  isSelected && styles.planPriceSelected,
                ]}
              >
                {plan.price}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderButton = () => {
    const handlePress = () => onPressContinue(selectedPlanId);

    if (typeof button === 'string') {
      return <PrimaryButton text={button} onPress={handlePress} />;
    }
    return button({ onPress: handlePress });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {typeof image === 'function'
        ? image()
        : image && <Image source={image} style={styles.image} />}

      <View style={styles.headerContainer}>
        {renderTitle()}
        {renderSubtitle()}
      </View>

      {renderFeatures()}

      {renderPlans()}

      {renderButton()}
    </ScrollView>
  );
}

export default OnboardingPaywallPanel;

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      marginTop: 16,
    },
    contentContainer: {
      paddingBottom: 40,
    },
    image: {
      alignSelf: 'center',
      marginBottom: 20,
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    text: {
      fontSize: fontSizes.xxl,
      lineHeight: lineHeights.xxl,
      textAlign: 'center',
    },
    line1: {
      marginTop: 20,
      color: theme.text.primary,
    },
    line2: {
      color: theme.bg.primary,
    },
    titleText: {
      fontFamily: theme.fonts.introTitle,
    },
    subtitleText: {
      fontFamily: theme.fonts.introSubtitle,
    },
    featuresContainer: {
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    checkIcon: {
      color: theme.bg.accent,
      fontSize: fontSizes.lg,
      marginRight: 8,
      fontWeight: 'bold',
    },
    featureText: {
      color: theme.text.primary,
      fontSize: fontSizes.md,
    },
    plansContainer: {
      gap: 12,
      marginBottom: 32,
    },
    planCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 12,
      backgroundColor: theme.bg.secondary,
      borderWidth: 1,
      borderColor: theme.bg.label,
    },
    planCardSelected: {
      borderColor: theme.bg.accent,
      backgroundColor: theme.bg.accent + '10', // 10% opacity
    },
    planTitle: {
      fontSize: fontSizes.md,
      fontWeight: '600',
      color: theme.text.primary,
    },
    planTitleSelected: {
      color: theme.bg.accent,
    },
    planInterval: {
      fontSize: fontSizes.sm,
      color: theme.text.secondary,
      marginTop: 2,
    },
    planIntervalSelected: {
      color: theme.bg.accent,
    },
    planPrice: {
      fontSize: fontSizes.lg,
      fontWeight: '700',
      color: theme.text.primary,
    },
    planPriceSelected: {
      color: theme.bg.accent,
    },
  });
