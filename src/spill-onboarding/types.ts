import { type ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type {
  PurchaseError,
  ProductPurchase,
  SubscriptionPurchase,
} from 'react-native-iap';

/**
 * Theme color tokens used by onboarding components.
 */
export interface OnboardingColors {
  /**
   * Background colors used across the UI.
   */
  background?: {
    /**
     * Primary page/screen background color.
     */
    primary?: string;

    /**
     * Background for panels or cards.
     */
    secondary?: string;

    /**
     * Subtle background for labels.
     */
    label?: string;

    /**
     * Accented background for emphasis areas.
     */
    accent?: string;
  };

  /**
   * Text colors used for typography.
   */
  text?: {
    /**
     * Default body text color for readability on `background.primary`.
     */
    primary?: string;

    /**
     * Subdued text color for secondary information.
     */
    secondary?: string;

    /**
     * High-contrast text color intended for buttons/overlays.
     */
    contrast?: string;
  };
}

/**
 * Font family names used for specific text roles. Values are platform-registered font family strings.
 */
export interface OnboardingFonts {
  /** Font for the intro screen title. */
  introTitle?: string;

  /** Font for the intro screen subtitle. */
  introSubtitle?: string;

  /** Font for the intro screen button label. */
  introButton?: string;

  /** Font for a step label (small caption above title). */
  stepLabel?: string;

  /** Font for a step title. */
  stepTitle?: string;

  /** Font for a step description/body. */
  stepDescription?: string;

  /** Font for a step primary action label. */
  stepButton?: string;

  /** Font for primary button labels. */
  primaryButton?: string;

  /** Font for secondary button labels. */
  secondaryButton?: string;
}

/**
 * Props for the introductory panel shown before steps begin.
 */
export interface OnboardingIntroPanelProps {
  /** Callback invoked when the user starts the onboarding. */
  onPressStart: () => void;

  /** Title content; string or custom React node. */
  title?: string | ReactNode;

  /** Subtitle content; string or custom React node. */
  subtitle?: string | ReactNode;

  /**
   * Button content. Either a simple string label or a render function
   * that receives `onPressStart` to wire up a custom button.
   */
  button:
    | string
    | (({ onPressStart }: { onPressStart: () => void }) => ReactNode);

  /** Optional image shown on the intro panel. */
  image?: ImageSourcePropType | (() => ReactNode);
}

type OnboardingStepDefault = {
  /** Discriminator: for default steps, `component` must be omitted. */
  component?: never;

  /** Optional small label displayed above the title. */
  label?: string;

  /** Step title text. */
  title: string;

  /** Step description/body text. */
  description: string;

  /** Label for the primary action button. */
  buttonLabel: string;

  /** Image displayed alongside the step content. */
  image: ImageSourcePropType;

  /** Placement of the image relative to content. */
  position: 'top' | 'bottom';

  /** Optional: Override global showBackButton for this step */
  showBackButton?: boolean;

  /** Optional: Override global backButtonIcon for this step */
  backButtonIcon?: ReactNode;
};

type OnboardingStepCustom = {
  /**
   * Custom step renderer. Receives navigation helpers and state.
   */
  component: (props: {
    /** Advance to the next step. */
    onNext: () => void;
    /** Go back to the previous step. */
    onBack: () => void;
    /** True if this is the last step. */
    isLast: boolean;
  }) => ReactNode;

  /** Image displayed alongside the custom step. */
  image: ImageSourcePropType;

  /** Placement of the image relative to content. */
  position: 'top' | 'bottom';
};

/**
 * A single onboarding step. Either a default text-based step or a fully custom component.
 */
export type OnboardingStep = OnboardingStepDefault | OnboardingStepCustom;

/**
 * Props consumed by the internal step panel component.
 */
export interface OnboardingStepPanelProps {
  /** Optional small label displayed above the title. */
  label?: string;

  /** Step title text. */
  title: string;

  /** Step description text. */
  description: string;

  /** Label for the primary action button. */
  buttonLabel: string;

  /** Handler for the back button. */
  onBackPress?: () => void;

  /** Handler for the next/continue button. */
  onNextPress: () => void;

  /** Whether the primary styling should be applied to the button. */
  buttonPrimary: boolean;

  /** Controls visibility of the back button. */
  showBackButton?: boolean;

  /** Custom icon for the back button. */
  backButtonIcon?: ReactNode;
}

type OnboardingIntroPanel =
  | Omit<OnboardingIntroPanelProps, 'onPressStart'>
  | (({ onPressStart }: { onPressStart: () => void }) => ReactNode);

/**
 * Top-level props for the `Onboarding` component.
 */
export interface OnboardingProps {
  /** Duration in milliseconds for step transition animations. */
  animationDuration?: number;

  /**
   * Intro panel content. Either props for the default panel (without `onPressStart`)
   * or a render function receiving `onPressStart` for a fully custom intro.
   */
  introPanel: OnboardingIntroPanel;

  /** Ordered list of steps to render. */
  steps: OnboardingStep[];

  /** Called when the user completes the final step. */
  onComplete: (planId?: string) => void;

  /** Called when the user skips the onboarding. */
  onSkip?: () => void;

  /** Notifies consumers when the active step index changes. */
  onStepChange?: (stepIndex: number) => void;

  /** Whether to show a back button on steps */
  showBackButton?: boolean;

  /** Whether to wrap the onboarding in a modal on web. */
  wrapInModalOnWeb?: boolean;

  /** Optional custom background element rendered behind content. */
  background?: () => ReactNode;

  /** Optional custom close button renderer. */
  skipButton?: ({ onPress }: { onPress: () => void }) => ReactNode;

  /** Theme colors to use for styling. */
  theme?: 'dark' | 'light';

  /** Theme colors to use for styling. */
  colors?: Partial<OnboardingColors>;

  /** Font family set or a single family name applied where appropriate. */
  fonts?: OnboardingFonts | string;

  /**
   * API Key for analytics.
   * Optional. If not provided, analytics will be disabled.
   */
  apiKey?: string;

  /**
   * If true, analytics events will be logged to console but not sent to the server.
   * Useful for development.
   */
  isDev?: boolean;

  /** Custom icon for the back button. */
  backButtonIcon?: ReactNode;

  /**
   * Optional Paywall panel content.
   * If provided, it will be shown after the last step.
   */
  paywallPanel?: OnboardingPaywallPanelConfig;
}

export interface PlatformSku {
  ios?: string[];
  android?: string[];
}

export interface PaywallPlan {
  id: string;
  title: string;
  price: string;
  interval?: string;
  features?: string[];
  helperText?: string;
}

/**
 * Simplified configuration for a single paywall product/plan.
 */
export interface PaywallProductConfig {
  /** SKUs for different platforms. */
  SKus: PlatformSku | string[];

  /** Main product title/name. */
  title: string;

  /** Array of product features. */
  featues: string[];

  /** Numeric or alphanumeric sorting preference. */
  sortOrder: number | string;

  /** Optional helper text (max 15 chars). */
  helperText?: string;
}

/**
 * Props for the paywall panel.
 */
export interface OnboardingPaywallPanelProps {
  /** Callback invoked when the user taps the main action button. */
  onPressContinue: (planId: string) => void;

  /** Title content. */
  title?: string | ReactNode;

  /** Subtitle content. */
  subtitle?: string | ReactNode;

  /**
   * List of plans to display.
   * Required if `products` is not provided.
   */
  plans?: PaywallPlan[];

  /**
   * Simplified configuration for paywall products.
   * If provided, handles fetching and displaying products automatically.
   */
  products?: PaywallProductConfig[];

  /**
   * Button content. Either a simple string label or a render function.
   */
  button: string | (({ onPress }: { onPress: () => void }) => ReactNode);

  /** Optional image shown on the paywall panel. */
  image?: ImageSourcePropType | (() => ReactNode);

  /** Helper text displayed above the continue button. */
  helperTextContinue?: string;

  /** Link for restore purchase action. */
  onRestorePurchase?: { text?: string; onPress: () => void };

  /** Link for terms of service action. */
  onTerms?: { text?: string; onPress: () => void };

  /** Link for privacy policy action. */
  onPrivacy?: { text?: string; onPress: () => void };

  /**
   * SKUs for In-App Purchases (Subscriptions).
   * If provided, the component will attempt to fetch product details from the store
   * using react-native-iap and handle purchases.
   */
  subscriptionSkus?: PlatformSku;

  /**
   * Callback invoked when a purchase attempt finishes (success or failure).
   * @param result Object containing status, planId, and optionally error or data.
   */
  onPurchaseResult?: (result: {
    status: 'success' | 'error';
    planId: string;
    error?: PurchaseError;
    data?:
      | ProductPurchase
      | ProductPurchase[]
      | SubscriptionPurchase
      | void
      | null;
  }) => void;

  /**
   * Callback invoked when the user taps the close button.
   * If provided, a close button will be rendered in the header.
   */
  onClose?: () => void;

  /**
   * Design variation for A/B testing.
   */
  design?: 'design1' | 'design2';

  /**
   * Theme colors to use for styling the paywall.
   */
  colors?: Partial<OnboardingColors>;

  /**
   * API Key for analytics.
   */
  apiKey?: string;

  /**
   * If true, analytics events will be logged to console but not sent to the server.
   */
  isDev?: boolean;
}

type OnboardingPaywallPanelConfig =
  | OnboardingPaywallPanelProps
  | (({
      onPressContinue,
    }: {
      onPressContinue: (planId: string) => void;
    }) => ReactNode);
