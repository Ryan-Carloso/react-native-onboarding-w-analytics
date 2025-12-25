import Onboarding from '../../../../src';
import { steps } from './pages';

export default function OnboardingChecklist() {
  return (
    <Onboarding
      isDev={true}
      onSkip={() => {}}
      showCloseButton={true}
      showBackButton={true}
      wrapInModalOnWeb={true}
      apiKey="apiKey-websiteTRACKER"
      animationDuration={500}
      theme="dark"
      introPanel={{
        image: require('../../../assets/checklist/share.png'),
        title: 'The Right Way to do',
        subtitle: 'Shopping lists',
        button: 'Get Started',
      }}
      steps={steps}
      paywallPanel={{
        title: 'Unlock Premium Features',
        subtitle: 'Get unlimited lists and more',
        image: require('../../../assets/checklist/create.png'),
        helperTextContinue: '7 days free',
        onRestorePurchase: {
          text: 'Restore',
          onPress: () => console.log('Restore Purchase clicked'),
        },
        onTerms: {
          text: 'Terms',
          onPress: () => console.log('Terms clicked'),
        },
        onPrivacy: {
          text: 'Privacy',
          onPress: () => console.log('Privacy clicked'),
        },
        plans: [
          {
            id: 'weekly',
            title: 'Weekly',
            price: '$2.99',
            interval: '/ week',
            features: ['Unlimited lists', 'Priority support', 'No ads'],
          },
          {
            id: 'monthly',
            title: 'Monthly',
            price: '$9.99',
            interval: '/ month',
            features: [
              'Unlimited lists',
              'Priority support',
              'No ads',
              'Cloud backup',
            ],
          },
          {
            id: 'lifetime',
            title: 'Lifetime',
            price: '$49.99',
            features: [
              'All monthly features',
              'One-time payment',
              'Lifetime access',
            ],
          },
        ],
        button: 'Continue',
      }}
      onComplete={(planId) => {
        if (planId) {
          console.log('onComplete clicked with plan:', planId);
        } else {
          console.log('onComplete clicked without plan');
        }
      }}
    />
  );
}
