import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, RadioButton, Card, Button } from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import ShieldIndicator from '../../components/ShieldIndicator';

type ShieldLevel = 'open' | 'moderate' | 'strict';

export default function ShieldScreen() {
  const [shieldLevel, setShieldLevel] = useState<ShieldLevel>('moderate');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadShieldLevel();
  }, []);

  const loadShieldLevel = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('shield_level')
        .eq('id', user.id)
        .single();

      if (profile) {
        setShieldLevel(profile.shield_level);
      }
    } catch (error) {
      console.error('Error loading shield level:', error);
    }
  };

  const saveShieldLevel = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ shield_level: shieldLevel })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Success', 'Shield level updated');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Message Shield</Text>
        <Text style={styles.subtitle}>
          Control how messages are filtered and presented
        </Text>

        <View style={styles.currentShield}>
          <Text style={styles.currentShieldLabel}>Current Setting:</Text>
          <ShieldIndicator level={shieldLevel} />
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Choose Your Shield Level</Text>

            <RadioButton.Group
              onValueChange={(value) => setShieldLevel(value as ShieldLevel)}
              value={shieldLevel}
            >
              <View style={styles.option}>
                <RadioButton.Item
                  label="Open"
                  value="open"
                  position="leading"
                  style={styles.radioItem}
                />
                <Text style={styles.optionDescription}>
                  All messages delivered immediately without filtering. You'll see
                  BIFF scores but messages won't be delayed.
                </Text>
              </View>

              <View style={styles.option}>
                <RadioButton.Item
                  label="Moderate"
                  value="moderate"
                  position="leading"
                  style={styles.radioItem}
                />
                <Text style={styles.optionDescription}>
                  Messages with low BIFF scores (below 50) are held for review. AI
                  coaching suggests improvements before delivery.
                </Text>
              </View>

              <View style={styles.option}>
                <RadioButton.Item
                  label="Strict"
                  value="strict"
                  position="leading"
                  style={styles.radioItem}
                />
                <Text style={styles.optionDescription}>
                  All messages are analyzed and held until they meet BIFF standards
                  (score above 60). Maximum protection from hostile communication.
                </Text>
              </View>
            </RadioButton.Group>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>How It Works</Text>
            <View style={styles.howItWorks}>
              <Text style={styles.step}>
                <Text style={styles.stepNumber}>1.</Text> Messages are analyzed by AI
                for BIFF compliance
              </Text>
              <Text style={styles.step}>
                <Text style={styles.stepNumber}>2.</Text> Low-scoring messages are
                flagged based on your shield level
              </Text>
              <Text style={styles.step}>
                <Text style={styles.stepNumber}>3.</Text> AI coaching helps improve
                flagged messages
              </Text>
              <Text style={styles.step}>
                <Text style={styles.stepNumber}>4.</Text> Verified messages are stored
                with cryptographic proof
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={saveShieldLevel}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Save Settings
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
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  currentShield: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  currentShieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  option: {
    marginBottom: 16,
  },
  radioItem: {
    paddingLeft: 0,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 48,
    marginTop: -8,
    marginBottom: 8,
  },
  howItWorks: {
    paddingLeft: 8,
  },
  step: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  stepNumber: {
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 4,
  },
  button: {
    marginTop: 8,
    marginBottom: 24,
  },
});
