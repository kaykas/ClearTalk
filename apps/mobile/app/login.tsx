import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, Switch, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import {
  isBiometricSupported,
  enableBiometricLogin,
  getBiometricTypes,
  getBiometricName,
} from '../lib/biometric';
import { registerForPushNotifications, savePushToken } from '../lib/notifications';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometric');

  React.useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const isSupported = await isBiometricSupported();
    setBiometricAvailable(isSupported);

    if (isSupported) {
      const types = await getBiometricTypes();
      setBiometricName(getBiometricName(types));
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Create profile
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            email: data.user.email,
            shield_level: 'moderate',
            biometric_enabled: enableBiometric,
          });

          if (profileError) throw profileError;

          // Register for push notifications
          const pushToken = await registerForPushNotifications();
          if (pushToken) {
            await savePushToken(data.user.id, pushToken);
          }

          // Enable biometric if requested
          if (enableBiometric) {
            await enableBiometricLogin();
          }

          Alert.alert('Success', 'Account created! Please check your email to verify.');
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Update push token
          const pushToken = await registerForPushNotifications();
          if (pushToken) {
            await savePushToken(data.user.id, pushToken);
          }

          // Navigate to main app
          router.replace('/(tabs)/chat');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>ClearTalk</Text>
        <Text style={styles.subtitle}>
          High-conflict communication made simple
        </Text>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            mode="outlined"
            style={styles.input}
            disabled={loading}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            style={styles.input}
            disabled={loading}
          />

          {isSignUp && biometricAvailable && (
            <View style={styles.biometricContainer}>
              <View style={styles.biometricLabel}>
                <Text>Enable {biometricName}</Text>
                <HelperText type="info">
                  Use {biometricName} to quickly unlock the app
                </HelperText>
              </View>
              <Switch
                value={enableBiometric}
                onValueChange={setEnableBiometric}
                disabled={loading}
              />
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleAuth}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>

          <Button
            mode="text"
            onPress={() => setIsSignUp(!isSignUp)}
            disabled={loading}
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#007AFF',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 48,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
  biometricContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  biometricLabel: {
    flex: 1,
  },
});
