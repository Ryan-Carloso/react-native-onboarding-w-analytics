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
  useSafeAreaInsets,
  SafeAreaView,
} from 'react-native-safe-area-context';
import {
  initConnection,
  getSubscriptions,
  getProducts,
  requestSubscription,
  requestPurchase,
  endConnection,
  type Subscription,
  type Product,
  type PurchaseError,
} from 'react-native-iap';
import { useTheme } from '../../utils/ThemeContext';
import { type Theme, resolveTheme } from '../../utils/theme';
import PrimaryButton from '../buttons/PrimaryButton';
import SkipButton from '../buttons/SkipButton';
import { fontSizes, lineHeights } from '../../utils/fontStyles';
import type { OnboardingPaywallPanelProps, PlatformSku } from '../types';
import Skeleton from './Skeleton';
import { trackEvent } from '../analytics';
import { useLogDev } from '../hooks/useLogDev';

const { height: screenHeight } = Dimensions.get('window');

function OnboardingPaywallPanel({
  onPressContinue,
  onClose,
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
  onPurchaseResult,
  apiKey,
  isDev,
  colors,
  design,
  theme: themeProp,
}: OnboardingPaywallPanelProps) {
  const { theme: contextTheme } = useTheme();

  const theme = useMemo(() => {
    return resolveTheme(themeProp, contextTheme, 'dark');
  }, [contextTheme, themeProp]);

  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, colors, !!image, insets),
    [theme, colors, image, insets]
  );

  const logDev = useLogDev(!!isDev);

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

  // Determine if we need to fetch data
  const shouldFetch = !!(products?.length || subscriptionSkus);
  const [isLoading, setIsLoading] = useState(shouldFetch);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

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
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('IAP Error:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    if (shouldFetch) {
      // Set 120s timeout
      timeoutId = setTimeout(() => {
        if (isMounted) {
          console.warn('IAP Fetch Timeout (120s) - showing partial data');
          setIsLoading(false);
        }
      }, 120000);

      // Collect all SKUs from all products for current platform
      let allSkus: string[] = [];

      if (products && products.length > 0) {
        allSkus = products.flatMap((p) => {
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
      } else if (subscriptionSkus) {
        const skus = Platform.select({
          ios: subscriptionSkus.ios,
          android: subscriptionSkus.android,
        });
        if (skus) allSkus = skus;
      }

      if (allSkus.length > 0) {
        fetchIapProducts(allSkus);
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (shouldFetch) {
        endConnection();
      }
    };
  }, [subscriptionSkus, products, shouldFetch]);

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
          helperText: config.helperText,
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
    if (isLoading) {
      return (
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Skeleton width={200} height={32} style={{ borderRadius: 8 }} />
        </View>
      );
    }
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
    if (isLoading) {
      return (
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Skeleton
            width={280}
            height={16}
            style={{ borderRadius: 4, marginBottom: 4 }}
          />
          <Skeleton width={180} height={16} style={{ borderRadius: 4 }} />
        </View>
      );
    }
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
    if (isLoading) {
      return (
        <View style={styles.featuresContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.featureRow}>
              <Skeleton
                width={20}
                height={20}
                style={{ borderRadius: 10, marginRight: 12 }}
              />
              <Skeleton width={200} height={16} style={{ borderRadius: 4 }} />
            </View>
          ))}
        </View>
      );
    }
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

  const renderSkeletonPlans = () => {
    return (
      <View style={styles.plansContainer}>
        {[1, 2, 3].map((key) => (
          <View
            key={key}
            style={[styles.planCard, { opacity: 1, padding: 16 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Radio button placeholder */}
              <Skeleton
                width={24}
                height={24}
                style={{ borderRadius: 12, marginRight: 12 }}
              />
              <View>
                {/* Title */}
                <Skeleton
                  width={100}
                  height={16}
                  style={{ marginBottom: 6, borderRadius: 4 }}
                />
                {/* Interval/Subtitle */}
                <Skeleton width={60} height={12} style={{ borderRadius: 4 }} />
              </View>
            </View>
            {/* Price */}
            <Skeleton width={70} height={20} style={{ borderRadius: 4 }} />
          </View>
        ))}
      </View>
    );
  };

  const renderPlans = () => {
    if (isLoading) {
      return renderSkeletonPlans();
    }

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
                {/* Helper Text Rendering */}
                {plan.helperText && (
                  <View style={styles.helperTextContainer}>
                    <Text style={styles.helperTextBadge}>
                      {plan.helperText.length > 15
                        ? plan.helperText.substring(0, 15).trim() + '...'
                        : plan.helperText}
                    </Text>
                  </View>
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
      logDev('OnboardingPaywallPanel: handlePress', { selectedPlanId });

      // Track purchase attempt
      trackEvent(
        apiKey,
        'purchase_attempt',
        {
          plan_id: selectedPlanId,
          design,
        },
        isDev
      );

      if ((subscriptionSkus || products) && selectedPlanId) {
        try {
          let result;
          const iapProduct = iapProducts.find(
            (p) => p.productId === selectedPlanId
          );
          if (iapProduct) {
            // Determine if it's a subscription or one-time purchase
            // Subscriptions usually have 'subscriptionPeriodNumberIOS' or 'subscriptionOfferDetails'
            const isSubscription =
              'subscriptionPeriodNumberIOS' in iapProduct ||
              'subscriptionOfferDetails' in iapProduct;

            logDev('OnboardingPaywallPanel: Processing purchase', {
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

              logDev('OnboardingPaywallPanel: Requesting subscription', {
                sku: selectedPlanId,
                offerToken,
              });
              result = await requestSubscription({
                sku: selectedPlanId,
                ...(offerToken && {
                  subscriptionOffers: [{ sku: selectedPlanId, offerToken }],
                }),
              });
            } else {
              logDev('OnboardingPaywallPanel: Requesting one-time purchase', {
                sku: selectedPlanId,
              });
              result = await requestPurchase({
                sku: selectedPlanId,
              });
            }
          } else {
            // Fallback if product not found in fetched list but ID exists
            // Try subscription first as default legacy behavior
            logDev(
              'OnboardingPaywallPanel: Product not in IAP list, attempting fallback purchase',
              selectedPlanId
            );
            try {
              logDev(
                'OnboardingPaywallPanel: Fallback - attempting requestSubscription',
                selectedPlanId
              );
              result = await requestSubscription({ sku: selectedPlanId });
            } catch (subErr) {
              console.warn(
                'OnboardingPaywallPanel: Fallback requestSubscription failed',
                subErr
              );
              logDev(
                'OnboardingPaywallPanel: Fallback - attempting requestPurchase',
                selectedPlanId
              );
              try {
                result = await requestPurchase({ sku: selectedPlanId });
              } catch (purchErr) {
                console.warn(
                  'OnboardingPaywallPanel: Fallback requestPurchase failed',
                  purchErr
                );
                throw purchErr;
              }
            }
          }

          if (onPurchaseResult) {
            onPurchaseResult({
              status: 'success',
              planId: selectedPlanId,
              data: result,
            });
          }

          // Track successful purchase
          trackEvent(
            apiKey,
            'purchase_success',
            {
              plan_id: selectedPlanId,
              design,
            },
            isDev
          );
        } catch (err) {
          logDev('PaywallScreen: Purchase failed', err);

          // Track failed purchase
          trackEvent(
            apiKey,
            'purchase_failed',
            {
              plan_id: selectedPlanId,
              design,
              error:
                typeof err === 'object' ? JSON.stringify(err) : String(err),
            },
            isDev
          );

          if (onPurchaseResult) {
            onPurchaseResult({
              status: 'error',
              planId: selectedPlanId,
              error: err as PurchaseError,
            });
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

  const handleClose = () => {
    logDev('[OnboardingPaywallPanel] Close button pressed');
    trackEvent(
      apiKey,
      'paywall_close',
      {
        design,
      },
      isDev
    );
    if (onClose) {
      onClose();
    } else {
      console.warn('[OnboardingPaywallPanel] onClose is undefined');
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer} edges={['top', 'bottom']}>
      {onClose && (
        <View style={styles.closeButton} pointerEvents="box-none">
          <SkipButton onPress={handleClose} />
        </View>
      )}
      {image && (
        <View style={styles.headerImageContainer}>
          {typeof image === 'function'
            ? image()
            : image && (
                <Image source={image} style={styles.image} resizeMode="cover" />
              )}
        </View>
      )}

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
    </SafeAreaView>
  );
}

export default OnboardingPaywallPanel;

const createStyles = (
  theme: Theme,
  colors?: OnboardingPaywallPanelProps['colors'],
  hasImage?: boolean,
  insets?: { top: number; bottom: number; left: number; right: number }
) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: colors?.background?.primary || theme.bg.secondary,
    },
    closeButton: {
      position: 'absolute',
      top: (insets?.top || 0) + 8,
      right: 16,
      zIndex: 10,
    },
    headerImageContainer: {
      height: screenHeight * 0.35,
      width: '100%',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    sheetContainer: {
      flex: 1,
      backgroundColor: colors?.background?.primary || theme.bg.secondary,
      borderTopLeftRadius: hasImage ? 24 : 0,
      borderTopRightRadius: hasImage ? 24 : 0,
      marginTop: hasImage ? -24 : 0,
      overflow: 'hidden',
    },
    container: {
      flex: 1,
    },
    contentContainer: {
      padding: 24,
      paddingTop: hasImage ? 32 : (insets?.top || 0) + 40,
      paddingBottom: 120, // Add padding for footer
    },
    contentWrapper: {
      flex: 1,
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    text: {
      textAlign: 'center',
      color: colors?.text?.primary || theme.text.primary,
    },
    line1: {
      fontSize: fontSizes.xl,
      fontWeight: '700',
      marginBottom: 12,
      lineHeight: lineHeights.xl,
    },
    line2: {
      fontSize: fontSizes.md,
      color: colors?.text?.secondary || theme.text.secondary,
      lineHeight: lineHeights.md,
      marginTop: 4,
    },
    titleText: {
      color: colors?.text?.primary || theme.text.primary,
    },
    subtitleText: {
      color: colors?.text?.secondary || theme.text.secondary,
    },
    featuresContainer: {
      marginBottom: 32,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    checkIcon: {
      fontSize: 18,
      color: colors?.background?.accent || theme.bg.accent,
      marginRight: 12,
      fontWeight: 'bold',
    },
    featureText: {
      fontSize: fontSizes.md,
      color: colors?.text?.primary || theme.text.primary,
      flex: 1,
      lineHeight: lineHeights.md,
    },
    plansContainer: {
      marginBottom: 24,
      gap: 12,
    },
    planCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors?.background?.label || theme.bg.label,
      backgroundColor: 'transparent',
    },
    planCardSelected: {
      borderColor: colors?.background?.accent || theme.bg.accent,
      backgroundColor: colors?.background?.label || theme.bg.label,
    },
    planTitle: {
      fontSize: fontSizes.md,
      fontWeight: '600',
      color: colors?.text?.primary || theme.text.primary,
      marginBottom: 4,
    },
    planTitleSelected: {
      color: colors?.text?.primary || theme.text.primary,
    },
    planInterval: {
      fontSize: fontSizes.sm,
      color: colors?.text?.secondary || theme.text.secondary,
    },
    planIntervalSelected: {
      color: colors?.text?.secondary || theme.text.secondary,
    },
    planPrice: {
      fontSize: fontSizes.lg,
      fontWeight: '700',
      color: colors?.text?.primary || theme.text.primary,
    },
    planPriceSelected: {
      color: colors?.text?.primary || theme.text.primary,
    },
    footerContainer: {
      padding: 24,
      paddingBottom: (insets?.bottom || 0) + 16,
      borderTopWidth: 1,
      borderTopColor: colors?.background?.label || theme.bg.label,
      backgroundColor: colors?.background?.primary || theme.bg.secondary,
    },
    helperText: {
      textAlign: 'center',
      fontSize: fontSizes.xs,
      color: colors?.text?.secondary || theme.text.secondary,
      marginBottom: 16,
    },
    footerLinksContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 12,
    },
    footerLinkText: {
      fontSize: fontSizes.xs,
      color: colors?.text?.secondary || theme.text.secondary,
      textDecorationLine: 'underline',
    },
    footerLinkSeparator: {
      fontSize: fontSizes.xs,
      color: colors?.text?.secondary || theme.text.secondary,
      marginHorizontal: 8,
    },
    helperTextContainer: {
      marginTop: 4,
    },
    helperTextBadge: {
      fontSize: fontSizes.xs,
      color: colors?.background?.accent || theme.bg.accent,
      fontWeight: '600',
    },
  });
