import Onboarding from '../../../../src';
import { steps } from './pages';
import { ExamplePaywall } from '../../components/ExamplePaywall';

const renderPaywall = ({
  onPressContinue,
}: {
  onPressContinue: (planId: string) => void;
}) => <ExamplePaywall onPressContinue={onPressContinue} />;

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
      paywallPanel={renderPaywall}
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
