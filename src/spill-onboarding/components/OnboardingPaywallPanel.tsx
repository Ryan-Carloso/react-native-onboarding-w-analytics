import { useMemo, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import type { Theme } from '../../utils/theme';
import PrimaryButton from '../buttons/PrimaryButton';
import { fontSizes, lineHeights } from '../../utils/fontStyles';
import type { OnboardingPaywallPanelProps } from '../types';

const { height: screenHeight } = Dimensions.get('window');

function OnboardingPaywallPanel({
  onPressContinue,
  title,
  subtitle,
  button,
  image,
  plans,
  helperTextContinue,
  onRestorePurchase,
  onTerms,
  onPrivacy,
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

  const renderFooterLinks = () => {
    if (!onRestorePurchase && !onTerms && !onPrivacy) return null;

    return (
      <View style={styles.footerLinksContainer}>
        {onRestorePurchase && (
          <TouchableOpacity onPress={onRestorePurchase.onPress}>
            <Text style={styles.footerLinkText}>{onRestorePurchase.text}</Text>
          </TouchableOpacity>
        )}

        {onRestorePurchase && (onTerms || onPrivacy) && (
          <Text style={styles.footerLinkSeparator}>•</Text>
        )}

        {onTerms && (
          <TouchableOpacity onPress={onTerms.onPress}>
            <Text style={styles.footerLinkText}>{onTerms.text}</Text>
          </TouchableOpacity>
        )}

        {onTerms && onPrivacy && (
          <Text style={styles.footerLinkSeparator}>•</Text>
        )}

        {onPrivacy && (
          <TouchableOpacity onPress={onPrivacy.onPress}>
            <Text style={styles.footerLinkText}>{onPrivacy.text}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.headerImageContainer}>
        {typeof image === 'function'
          ? image()
          : image && (
              <Image source={image} style={styles.image} resizeMode="cover" />
            )}
      </View>

      <View style={styles.sheetContainer}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.contentWrapper}>
            <View style={styles.headerContainer}>
              {renderTitle()}
              {renderSubtitle()}
            </View>

            {renderFeatures()}

            {renderPlans()}

            {renderFooterLinks()}
          </View>
        </ScrollView>
        <View style={styles.footerContainer}>
          {helperTextContinue && (
            <Text style={styles.helperText}>{helperTextContinue}</Text>
          )}

          {renderButton()}
        </View>
      </View>
    </View>
  );
}

export default OnboardingPaywallPanel;

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: theme.bg.secondary,
    },
    headerImageContainer: {
      height: screenHeight * 0.3,
      width: '100%',
    },
    sheetContainer: {
      flex: 1,
      marginTop: -6,
      backgroundColor: theme.bg.secondary,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      overflow: 'hidden',
    },
    container: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: 40,
    },
    footerContainer: {
      paddingHorizontal: 16,
      paddingBottom: 40,
      paddingTop: 16,
      backgroundColor: theme.bg.secondary,
    },
    contentWrapper: {
      paddingHorizontal: 16,
      paddingTop: 32,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: 24,
      marginTop: 8,
    },
    text: {
      fontSize: fontSizes.xxl,
      lineHeight: lineHeights.xxl,
      textAlign: 'center',
    },
    line1: {
      color: theme.text.primary,
    },
    line2: {
      marginTop: 8,
      color: theme.text.secondary,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.md,
    },
    titleText: {
      fontFamily: theme.fonts.introTitle,
      fontWeight: 'bold',
    },
    subtitleText: {
      fontFamily: theme.fonts.introSubtitle,
    },
    featuresContainer: {
      marginBottom: 24,
      paddingHorizontal: 8,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    checkIcon: {
      color: theme.bg.accent,
      fontSize: fontSizes.lg,
      marginRight: 12,
      fontWeight: 'bold',
    },
    featureText: {
      color: theme.text.primary,
      fontSize: fontSizes.md,
      fontWeight: '500',
    },
    plansContainer: {
      gap: 12,
      marginBottom: 24,
    },
    planCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      minHeight: 76,
      borderRadius: 16,
      backgroundColor: theme.bg.secondary,
      borderWidth: 1,
      borderColor: theme.bg.label,
      // Shadow for elevation
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    planCardSelected: {
      borderColor: theme.bg.accent,
      backgroundColor: theme.bg.label,
      borderWidth: 2,
    },
    planTitle: {
      fontSize: fontSizes.md,
      fontWeight: '600',
      color: theme.text.primary,
    },
    planTitleSelected: {
      color: theme.text.primary,
      fontWeight: '700',
    },
    planInterval: {
      fontSize: fontSizes.sm,
      color: theme.text.secondary,
      marginTop: 2,
    },
    planIntervalSelected: {
      color: theme.text.secondary,
    },
    planPrice: {
      fontSize: fontSizes.lg,
      fontWeight: '700',
      color: theme.text.primary,
    },
    planPriceSelected: {
      color: theme.bg.accent,
    },
    helperText: {
      textAlign: 'center',
      color: theme.text.secondary,
      fontSize: fontSizes.sm,
      marginBottom: 8,
      fontWeight: '500',
    },
    footerLinksContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 4,
      gap: 8,
    },
    footerLinkText: {
      fontSize: fontSizes.md,
      color: theme.text.secondary,
    },
    footerLinkSeparator: {
      fontSize: fontSizes.xs,
      color: theme.text.secondary,
    },
  });
