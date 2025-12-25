import { View, StyleSheet, Alert } from 'react-native';
import { ExamplePaywall } from '../components/ExamplePaywall';

export default function JustPaywall() {
  return (
    <View style={styles.container}>
      <ExamplePaywall
        onPressContinue={(planId) => {
          Alert.alert('Continue clicked', `Plan: ${planId}`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
