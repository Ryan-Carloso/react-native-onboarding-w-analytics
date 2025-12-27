import { Alert } from 'react-native';
import { OnboardingPaywallPanel } from '../../../../src';
import { products } from './onboard.consts';

export default function PaywallScreen() {
  console.log('PaywallScreen: Rendering');
  return (
    <OnboardingPaywallPanel
      title="Unlock Premium Features"
      subtitle="Get unlimited lists and more"
      image={require('@/assets/images/create.png')}
      helperTextContinue="7 days free"
      onClose={() => console.log('PaywallScreen: Close clicked')}
      onRestorePurchase={{
        text: 'Restore',
        onPress: () => {
          console.log('PaywallScreen: Restore Purchase clicked');
          Alert.alert('Restore Purchase clicked');
        },
      }}
      onTerms={{
        text: 'Terms',
        onPress: () => Alert.alert('Terms clicked'),
      }}
      onPrivacy={{
        text: 'Privacy',
        onPress: () => Alert.alert('Privacy clicked'),
      }}
      button="Continue"
      onPurchaseResult={(result) => {
        if (result.status === 'success') {
          console.log('PaywallScreen: Purchase successful', result);
          // TODO: here use to route and replace to home

          // eg: router.replace('/(tabs)/home');
        } else {
          console.log('PaywallScreen: Purchase failed', result);
          Alert.alert(
            'Purchase Failed',
            result.error?.message ?? 'Unknown error'
          );
        }
      }}
      onPressContinue={(id) => {
        console.log('PaywallScreen: onPressContinue called with', id);
      }}
      products={products}
    />
  );
}
