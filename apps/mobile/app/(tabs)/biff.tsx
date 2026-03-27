import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import BIFFScoreBar from '../../components/BIFFScoreBar';
import { analyzeBIFFScore, ClaudeResponse } from '../../lib/claude';

export default function BIFFScreen() {
  const [message, setMessage] = useState('');
  const [coaching, setCoaching] = useState<ClaudeResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!message.trim()) return;

    setAnalyzing(true);
    try {
      const response = await analyzeBIFFScore(message);
      setCoaching(response);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>BIFF Coach</Text>
        <Text style={styles.subtitle}>
          Practice writing Brief, Informative, Friendly, and Firm messages
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>What is BIFF?</Text>
            <Text style={styles.description}>
              BIFF is a communication method developed by Bill Eddy for responding to
              high-conflict situations:
            </Text>
            <View style={styles.biffExplanation}>
              <Text style={styles.biffItem}>
                <Text style={styles.biffLabel}>Brief:</Text> Keep it short and to the point
              </Text>
              <Text style={styles.biffItem}>
                <Text style={styles.biffLabel}>Informative:</Text> Provide necessary facts
                without emotion
              </Text>
              <Text style={styles.biffItem}>
                <Text style={styles.biffLabel}>Friendly:</Text> Use a respectful,
                non-hostile tone
              </Text>
              <Text style={styles.biffItem}>
                <Text style={styles.biffLabel}>Firm:</Text> Set clear boundaries without
                being aggressive
              </Text>
            </View>
          </Card.Content>
        </Card>

        <TextInput
          label="Your Message"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={6}
          mode="outlined"
          style={styles.input}
          placeholder="Type or paste a message to analyze..."
        />

        <Button
          mode="contained"
          onPress={handleAnalyze}
          loading={analyzing}
          disabled={!message.trim() || analyzing}
          style={styles.button}
        >
          Analyze Message
        </Button>

        {coaching && (
          <View style={styles.results}>
            <BIFFScoreBar score={coaching.biff_score} />

            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>AI Feedback</Text>
                <Text style={styles.coachingMessage}>{coaching.coaching_message}</Text>

                {coaching.biff_score.suggestions.length > 0 && (
                  <View style={styles.suggestions}>
                    <Text style={styles.suggestionsTitle}>Suggestions:</Text>
                    {coaching.biff_score.suggestions.map((suggestion, index) => (
                      <Text key={index} style={styles.suggestion}>
                        • {suggestion}
                      </Text>
                    ))}
                  </View>
                )}

                {coaching.improved_version && (
                  <View style={styles.improvedVersion}>
                    <Text style={styles.improvedVersionTitle}>
                      Suggested Rewrite:
                    </Text>
                    <Text style={styles.improvedVersionText}>
                      {coaching.improved_version}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          </View>
        )}
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
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  biffExplanation: {
    paddingLeft: 8,
  },
  biffItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  biffLabel: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginBottom: 24,
  },
  results: {
    marginTop: 8,
  },
  coachingMessage: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  suggestions: {
    marginTop: 12,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  suggestion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  improvedVersion: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  improvedVersionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  improvedVersionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});
