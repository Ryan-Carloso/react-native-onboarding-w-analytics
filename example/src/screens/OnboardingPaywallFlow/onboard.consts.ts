import { type ImageSourcePropType } from 'react-native';
import type { OnboardingStep } from 'rn-onboarding-analytics';

const imageMap: Record<string, ImageSourcePropType> = {
  create: require('@/assets/images/paywall/create.png'),
  share: require('@/assets/images/paywall/share.png'),
  categorize: require('@/assets/images/paywall/categorize.png'),
};

const pages = [
  {
    key: 'create',
    text: 'You can create unlimited lists for any occasion',
    title: 'Create Shopping Lists',
  },
  {
    key: 'share',
    text: 'Share and update your lists in real-time with friends and family',
    title: 'Share Lists with Others',
  },
  {
    key: 'categorize',
    text: 'Organize items by categories like dairy, vegetables or meat',
    title: 'Categorize your Items',
  },
];

export const steps: OnboardingStep[] = pages.map((page, index) => ({
  title: page.title,
  description: page.text,
  buttonLabel: 'Continue',
  image: imageMap[page.key] as ImageSourcePropType,
  position: index === 0 ? ('top' as const) : ('bottom' as const),
}));

export default function Pages() {
  return null;
}

export const products = [
  {
    SKus: {
      ios: ['weeklyDose'],
    },
    title: 'Weekly',
    helperText: 'Best Value',
    featues: ['Unlimited lists', 'Priority support', 'No ads', 'Cloud backup'],
    sortOrder: 1,
  },
  {
    SKus: {
      ios: ['montly_dailydose1'],
      android: ['monthly_subscription'],
    },
    title: 'Monthly',
    featues: ['Unlimited lists', 'Priority support', 'No ads', 'Cloud backup'],
    sortOrder: 2,
  },
  {
    SKus: {
      ios: ['LifeTime_DailyDose'],
      android: ['lifetime_access'],
    },
    title: 'Lifetime',
    featues: [
      'All monthly features',
      'One-time payment',
      'Lifetime access',
      'Cloud backup',
    ],
    sortOrder: 3,
  },
];
