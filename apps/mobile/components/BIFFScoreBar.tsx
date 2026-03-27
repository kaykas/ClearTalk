import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar } from 'react-native-paper';

interface BIFFScoreBarProps {
  score: {
    brief: number;
    informative: number;
    friendly: number;
    firm: number;
    overall: number;
  };
  compact?: boolean;
}

export default function BIFFScoreBar({ score, compact = false }: BIFFScoreBarProps) {
  const getColor = (value: number): string => {
    if (value >= 75) return '#4CAF50'; // Green
    if (value >= 50) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  const scores = [
    { label: 'Brief', value: score.brief, key: 'brief' },
    { label: 'Informative', value: score.informative, key: 'informative' },
    { label: 'Friendly', value: score.friendly, key: 'friendly' },
    { label: 'Firm', value: score.firm, key: 'firm' },
  ];

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactLabel}>BIFF Score</Text>
        <ProgressBar
          progress={score.overall / 100}
          color={getColor(score.overall)}
          style={styles.compactBar}
        />
        <Text style={[styles.compactScore, { color: getColor(score.overall) }]}>
          {Math.round(score.overall)}%
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BIFF Score</Text>
        <Text style={[styles.overallScore, { color: getColor(score.overall) }]}>
          {Math.round(score.overall)}%
        </Text>
      </View>

      {scores.map((item) => (
        <View key={item.key} style={styles.scoreRow}>
          <Text style={styles.label}>{item.label}</Text>
          <View style={styles.barContainer}>
            <ProgressBar
              progress={item.value / 100}
              color={getColor(item.value)}
              style={styles.bar}
            />
            <Text style={[styles.value, { color: getColor(item.value) }]}>
              {Math.round(item.value)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  overallScore: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    minWidth: 35,
    textAlign: 'right',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  compactLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
    minWidth: 70,
  },
  compactBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
  },
  compactScore: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    minWidth: 35,
    textAlign: 'right',
  },
});
