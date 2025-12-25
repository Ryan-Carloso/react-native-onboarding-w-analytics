import React from 'react';
import { Alert } from 'react-native';
import { OnboardingPaywallPanel } from '../../../src';

interface ExamplePaywallProps {
  onPressContinue: (planId: string) => void;
}

export function ExamplePaywall({ onPressContinue }: ExamplePaywallProps) {
  return (
    <OnboardingPaywallPanel
      title="Unlock Premium Features"
      subtitle="Get unlimited lists and more"
      image={require('../../assets/checklist/create.png')}
      helperTextContinue="7 days free"
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
      ]}
      button="Continue"
      onPressContinue={onPressContinue}
    />
  );
}
