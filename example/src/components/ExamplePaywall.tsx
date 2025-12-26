import { Alert } from 'react-native';
import { OnboardingPaywallPanel } from 'rn-onboarding-analytics';

interface ExamplePaywallProps {
  onPressContinue: (planId: string) => void;
}

const iosMonthly = 'com.example.monthly';
const iosYearly = 'com.example.yearly';

const subscriptionSkus = {
  ios: [iosMonthly, iosYearly, 'weekly_footbal'],
  android: ['androidTestSku'],
};

export function ExamplePaywall({ onPressContinue }: ExamplePaywallProps) {
  return (
    <OnboardingPaywallPanel
      title="Unlock Premium Features"
      subtitle="Get unlimited lists and more"
      image={require('../../assets/checklist/create.png')}
      helperTextContinue="7 days free"
      subscriptionSkus={subscriptionSkus}
      onRestorePurchase={{
        text: 'Restore',
        onPress: () => Alert.alert('Restore Purchase clicked'),
      }}
      onTerms={{
        text: 'Terms',
        onPress: () => Alert.alert('Terms clicked'),
      }}
      onPrivacy={{
        text: 'Privacy',
        onPress: () => Alert.alert('Privacy clicked'),
      }}
      plans={[
        {
          id: iosMonthly,
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
          id: iosYearly,
          title: 'Yearly',
          price: '$49.99',
          interval: '/ year',
          features: [
            'All monthly features',
            'One-time payment',
            'Lifetime access',
            'Cloud backup',
          ],
        },
      ]}
      button="Continue"
      onPressContinue={onPressContinue}
    />
  );
}
