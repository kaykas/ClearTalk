import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';

interface ShieldIndicatorProps {
  level: 'open' | 'moderate' | 'strict';
  onPress?: () => void;
}

export default function ShieldIndicator({ level, onPress }: ShieldIndicatorProps) {
  const getShieldColor = () => {
    switch (level) {
      case 'open':
        return '#4CAF50';
      case 'moderate':
        return '#FFC107';
      case 'strict':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getShieldIcon = () => {
    switch (level) {
      case 'open':
        return 'shield-outline';
      case 'moderate':
        return 'shield-half-full';
      case 'strict':
        return 'shield';
      default:
        return 'shield-outline';
    }
  };

  const getShieldLabel = () => {
    switch (level) {
      case 'open':
        return 'Open';
      case 'moderate':
        return 'Moderate';
      case 'strict':
        return 'Strict';
      default:
        return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      <IconButton
        icon={getShieldIcon()}
        size={24}
        iconColor={getShieldColor()}
        onPress={onPress}
        style={styles.icon}
      />
      <Text style={[styles.label, { color: getShieldColor() }]}>
        {getShieldLabel()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    margin: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: -4,
  },
});
