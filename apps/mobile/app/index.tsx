import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { isBiometricLoginEnabled, authenticateWithBiometrics } from '../lib/biometric';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // Check if user has active session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // No session, go to login
        router.replace('/login');
        return;
      }

      // Check if biometric login is enabled
      const biometricEnabled = await isBiometricLoginEnabled();

      if (biometricEnabled) {
        // Require biometric authentication
        const result = await authenticateWithBiometrics();

        if (!result.success) {
          // Biometric failed, sign out and go to login
          await supabase.auth.signOut();
          router.replace('/login');
          return;
        }
      }

      // Session valid and authenticated, go to main app
      router.replace('/(tabs)/chat');
    } catch (error) {
      console.error('Error checking session:', error);
      router.replace('/login');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
