import { type ImageSourcePropType } from 'react-native';
import type { OnboardingStep } from 'rn-onboarding-analytics';

const imageMap: Record<string, ImageSourcePropType> = {
  create: require('../../../assets/checklist/create.png'),
  share: require('../../../assets/checklist/share.png'),
  categorize: require('../../../assets/checklist/categorize.png'),
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
