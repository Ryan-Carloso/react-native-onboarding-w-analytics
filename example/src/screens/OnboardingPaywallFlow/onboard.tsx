import Onboarding from '../../../../src/spill-onboarding';
import { steps } from './onboard.consts';
import PaywallScreen from './paywall';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
export default function OnboardingChecklist() {
  const handleComplete = async () => {
    // todo: fazer isso melhor n ser string usar o expoSecureToken
    await AsyncStorage.setItem('SawOnboard', JSON.stringify(true));
    console.log('Onboarding completed');
  };

  return (
    <Onboarding
      isDev={true}
      showBackButton={true}
      backButtonIcon={
        <FontAwesome5 name="arrow-left" size={24} color="white" />
      }
      wrapInModalOnWeb={true}
      apiKey="apiKey-websiteTRACKER"
      animationDuration={500}
      theme="dark"
      introPanel={{
        image: require('@/assets/images/share.png'),
        title: 'The Right Way to do',
        subtitle: 'Shopping lists',
        button: 'Get Started',
      }}
      steps={steps}
      paywallPanel={PaywallScreen}
      onComplete={(planId) => {
        if (planId) {
          console.log('onComplete clicked with plan:', planId);
        } else {
          console.log('onComplete clicked without plan');
        }
        handleComplete();
        // Make here a route to send when user complete
        // eg: router.replace('/(tabs)/home');
      }}
    />
  );
}
