import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, List, Switch, Button, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase, Profile } from '../../lib/supabase';
import {
  isBiometricSupported,
  isBiometricLoginEnabled,
  enableBiometricLogin,
  disableBiometricLogin,
  getBiometricTypes,
  getBiometricName,
} from '../../lib/biometric';

export default function SettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometric');

  useEffect(() => {
    loadProfile();
    checkBiometric();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const checkBiometric = async () => {
    const isSupported = await isBiometricSupported();
    setBiometricAvailable(isSupported);

    if (isSupported) {
      const types = await getBiometricTypes();
      setBiometricName(getBiometricName(types));

      const isEnabled = await isBiometricLoginEnabled();
      setBiometricEnabled(isEnabled);
    }
  };

  const toggleBiometric = async (enabled: boolean) => {
    try {
      if (enabled) {
        const success = await enableBiometricLogin();
        if (success) {
          setBiometricEnabled(true);
          Alert.alert('Success', `${biometricName} login enabled`);
        } else {
          Alert.alert('Error', 'Failed to enable biometric login');
        }
      } else {
        await disableBiometricLogin();
        setBiometricEnabled(false);
        Alert.alert('Success', `${biometricName} login disabled`);
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      Alert.alert('Error', 'Failed to update biometric settings');
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Account</Text>
        <List.Item
          title={profile?.full_name || 'No name set'}
          description={profile?.email}
          left={(props) => <List.Icon {...props} icon="account" />}
        />
        <Divider />

        <Text style={styles.sectionTitle}>Security</Text>
        {biometricAvailable && (
          <>
            <List.Item
              title={`${biometricName} Login`}
              description={`Use ${biometricName} to unlock the app`}
              left={(props) => <List.Icon {...props} icon="fingerprint" />}
              right={() => (
                <Switch value={biometricEnabled} onValueChange={toggleBiometric} />
              )}
            />
            <Divider />
          </>
        )}

        <List.Item
          title="Change Password"
          description="Update your account password"
          left={(props) => <List.Icon {...props} icon="lock" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {
            // TODO: Navigate to change password screen
          }}
        />
        <Divider />

        <Text style={styles.sectionTitle}>Notifications</Text>
        <List.Item
          title="Push Notifications"
          description="Receive notifications for new messages"
          left={(props) => <List.Icon {...props} icon="bell" />}
          right={() => <Switch value={true} onValueChange={() => {}} />}
        />
        <Divider />

        <Text style={styles.sectionTitle}>Privacy</Text>
        <List.Item
          title="Data Export"
          description="Download your conversation history"
          left={(props) => <List.Icon {...props} icon="download" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {
            // TODO: Implement data export
          }}
        />
        <Divider />

        <List.Item
          title="Delete Account"
          description="Permanently delete your account and data"
          left={(props) => <List.Icon {...props} icon="delete" color="#F44336" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {
            // TODO: Implement account deletion
          }}
        />
        <Divider />

        <Text style={styles.sectionTitle}>About</Text>
        <List.Item
          title="Version"
          description="1.0.0"
          left={(props) => <List.Icon {...props} icon="information" />}
        />
        <Divider />

        <List.Item
          title="Terms of Service"
          left={(props) => <List.Icon {...props} icon="file-document" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {
            // TODO: Open terms of service
          }}
        />
        <Divider />

        <List.Item
          title="Privacy Policy"
          left={(props) => <List.Icon {...props} icon="shield-account" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {
            // TODO: Open privacy policy
          }}
        />
        <Divider />

        <Button
          mode="contained"
          onPress={handleSignOut}
          style={styles.signOutButton}
          buttonColor="#F44336"
        >
          Sign Out
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  signOutButton: {
    margin: 16,
    marginTop: 32,
  },
});
