import { useMemo, useState, useEffect } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import {
  initConnection,
  getSubscriptions,
  getProducts,
  requestSubscription,
  requestPurchase,
  endConnection,
  type Subscription,
  type Product,
} from 'react-native-iap';
import { useTheme } from '../../utils/ThemeContext';
import type { Theme } from '../../utils/theme';
import PrimaryButton from '../buttons/PrimaryButton';
import { fontSizes, lineHeights } from '../../utils/fontStyles';
import type { OnboardingPaywallPanelProps, PlatformSku } from '../types';

const { height: screenHeight } = Dimensions.get('window');

function OnboardingPaywallPanel({
  onPressContinue,
  title,
  subtitle,
  button,
  image,
  plans = [],
  products,
  helperTextContinue,
  onRestorePurchase,
  onTerms,
  onPrivacy,
  subscriptionSkus,
}: OnboardingPaywallPanelProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Initialize selectedPlanId based on available configuration
  const initialPlanId = useMemo(() => {
    if (products && products.length > 0) {
      // Sort first to pick the first one correctly if needed,
      // but simplistic approach: pick the first product's first SKU for the current platform
      const firstProduct = products[0];
      if (!firstProduct) return '';
      let firstSku = '';
      if (Array.isArray(firstProduct.SKus)) {
        firstSku = firstProduct.SKus[0] || '';
      } else {
        const skusObj = firstProduct.SKus as PlatformSku;
        const skus = Platform.select({
          ios: skusObj.ios,
          android: skusObj.android,
        });
        firstSku = skus?.[0] || '';
      }
      return firstSku;
    }
    return plans?.[0]?.id || '';
  }, [products, plans]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId);
  const [iapProducts, setIapProducts] = useState<(Subscription | Product)[]>(
    []
  );

  useEffect(() => {
    let isMounted = true;

    const fetchIapProducts = async (skus: string[]) => {
      try {
        await initConnection();
        if (!isMounted) return;

        // Fetch both subscriptions and products to cover all bases
        const [subs, prods] = await Promise.all([
          getSubscriptions({ skus }).catch(() => [] as Subscription[]),
          getProducts({ skus }).catch(() => [] as Product[]),
        ]);

        if (isMounted) {
          // Filter out duplicates if any (unlikely but safe)
          const allItems = [...subs, ...prods];
          const uniqueItems = Array.from(
            new Map(allItems.map((item) => [item.productId, item])).values()
          );
          setIapProducts(uniqueItems);
        }
      } catch (err) {
        console.warn('IAP Error:', err);
      }
    };

    if (products && products.length > 0) {
      // Collect all SKUs from all products for current platform
      const allSkus = products.flatMap((p) => {
        if (Array.isArray(p.SKus)) {
          return p.SKus;
        }
        const skusObj = p.SKus as PlatformSku;
        const skus = Platform.select({
          ios: skusObj.ios,
          android: skusObj.android,
        });
        return skus || [];
      });

      if (allSkus.length > 0) {
        fetchIapProducts(allSkus);
      }
    } else if (subscriptionSkus) {
      const skus = Platform.select({
        ios: subscriptionSkus.ios,
        android: subscriptionSkus.android,
      });

      if (skus && skus.length > 0) {
        fetchIapProducts(skus);
      }
    }

    return () => {
      isMounted = false;
      if (subscriptionSkus || products) {
        endConnection();
      }
    };
  }, [subscriptionSkus, products]);

  const displayPlans = useMemo(() => {
    // New Configuration Mode
    if (products && products.length > 0) {
      const mappedPlans = products.map((config) => {
        // Find if any of the product's SKUs matches a fetched IAP product
        let targetSkus: string[] = [];
        if (Array.isArray(config.SKus)) {
          targetSkus = config.SKus;
        } else {
          const skusObj = config.SKus as PlatformSku;
          targetSkus =
            Platform.select({
              ios: skusObj.ios,
              android: skusObj.android,
            }) || [];
        }

        const iapProduct = iapProducts.find((p) =>
          targetSkus.includes(p.productId)
        );

        let price = '...'; // Default loading state
        let id = targetSkus[0] || ''; // Default ID to first SKU

        if (iapProduct) {
          id = iapProduct.productId;
          if (Platform.OS === 'ios') {
            price = (iapProduct as any).localizedPrice || price;
          } else if (Platform.OS === 'android') {
            const offer = (iapProduct as any).subscriptionOfferDetails?.[0];
            price =
              offer?.pricingPhases?.pricingPhaseList?.[0]?.formattedPrice ||
              (iapProduct as any).localizedPrice ||
              price;
          }
        }

        return {
          id,
          title: config.title,
          price,
          // features with typo 'featues' mapped to correct prop 'features'
          features: config.featues,
          interval: '', // Could be inferred from IAP if needed
          sortOrder: config.sortOrder,
        };
      });

      // Sort based on sortOrder
      return mappedPlans.sort((a, b) => {
        if (
          typeof a.sortOrder === 'number' &&
          typeof b.sortOrder === 'number'
        ) {
          return a.sortOrder - b.sortOrder;
        }
        return String(a.sortOrder).localeCompare(String(b.sortOrder));
      });
    }

    // Legacy Mode
    if (iapProducts.length === 0) return plans;

    return plans.map((plan) => {
      const iapProduct = iapProducts.find((p) => p.productId === plan.id);
      if (iapProduct) {
        let price = plan.price;
        if (Platform.OS === 'ios') {
          price = (iapProduct as any).localizedPrice || plan.price;
        } else if (Platform.OS === 'android') {
          // Android specific logic for RNIap v12+
          const offer = (iapProduct as any).subscriptionOfferDetails?.[0];
          price =
            offer?.pricingPhases?.pricingPhaseList?.[0]?.formattedPrice ||
            (iapProduct as any).localizedPrice ||
            plan.price;
        }
        return {
          ...plan,
          price,
        };
      }
      return plan;
    });
  }, [products, plans, iapProducts]);

  const selectedPlan = displayPlans.find((p) => p.id === selectedPlanId);

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
        {displayPlans.map((plan) => {
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
    const handlePress = async () => {
      console.log('OnboardingPaywallPanel: handlePress', { selectedPlanId });
      if ((subscriptionSkus || products) && selectedPlanId) {
        try {
          const iapProduct = iapProducts.find(
            (p) => p.productId === selectedPlanId
          );
          if (iapProduct) {
            // Determine if it's a subscription or one-time purchase
            // Subscriptions usually have 'subscriptionPeriodNumberIOS' or 'subscriptionOfferDetails'
            const isSubscription =
              'subscriptionPeriodNumberIOS' in iapProduct ||
              'subscriptionOfferDetails' in iapProduct;

            console.log('OnboardingPaywallPanel: Processing purchase', {
              isSubscription,
              productId: iapProduct.productId,
            });

            if (isSubscription) {
              // For Android, we might need offerToken if available
              let offerToken;
              if (Platform.OS === 'android') {
                offerToken = (iapProduct as any).subscriptionOfferDetails?.[0]
                  ?.offerToken;
              }

              console.log('OnboardingPaywallPanel: Requesting subscription', {
                sku: selectedPlanId,
                offerToken,
              });
              await requestSubscription({
                sku: selectedPlanId,
                ...(offerToken && {
                  subscriptionOffers: [{ sku: selectedPlanId, offerToken }],
                }),
              });
            } else {
              console.log(
                'OnboardingPaywallPanel: Requesting one-time purchase',
                { sku: selectedPlanId }
              );
              await requestPurchase({
                sku: selectedPlanId,
              });
            }
          } else {
            // Fallback if product not found in fetched list but ID exists
            // Try subscription first as default legacy behavior
            console.log(
              'OnboardingPaywallPanel: Product not in IAP list, attempting fallback purchase',
              selectedPlanId
            );
            try {
              console.log(
                'OnboardingPaywallPanel: Fallback - attempting requestSubscription',
                selectedPlanId
              );
              await requestSubscription({ sku: selectedPlanId });
            } catch (subErr) {
              console.warn(
                'OnboardingPaywallPanel: Fallback requestSubscription failed',
                subErr
              );
              console.log(
                'OnboardingPaywallPanel: Fallback - attempting requestPurchase',
                selectedPlanId
              );
              try {
                await requestPurchase({ sku: selectedPlanId });
              } catch (purchErr) {
                console.warn(
                  'OnboardingPaywallPanel: Fallback requestPurchase failed',
                  purchErr
                );
                throw purchErr;
              }
            }
          }
        } catch (err) {
          console.warn('Purchase Error:', err);
          if (typeof err === 'object') {
            console.warn(
              'Purchase Error Details:',
              JSON.stringify(err, null, 2)
            );
          }
          return;
        }
      }
      onPressContinue(selectedPlanId);
    };

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
      marginTop: -24,
      backgroundColor: theme.bg.secondary,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      overflow: 'scroll',
    },
    container: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: 24,
    },
    footerContainer: {
      paddingHorizontal: 8,
      marginBottom: 40,
      paddingTop: 4,
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
