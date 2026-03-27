import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { IconButton } from 'react-native-paper';
import BIFFScoreBar from './BIFFScoreBar';
import { getBIFFCoachingDebounced, ClaudeResponse } from '../lib/claude';

interface ComposeMessageProps {
  onSend: (message: string, biffScore: any) => void;
  disabled?: boolean;
  minBiffScore?: number;
}

export default function ComposeMessage({
  onSend,
  disabled = false,
  minBiffScore = 60,
}: ComposeMessageProps) {
  const [message, setMessage] = useState('');
  const [coaching, setCoaching] = useState<ClaudeResponse | null>(null);
  const [showCoaching, setShowCoaching] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (message.trim()) {
      getBIFFCoachingDebounced(message, (response) => {
        setCoaching(response);
      });
    } else {
      setCoaching(null);
    }
  }, [message]);

  const handleSend = async () => {
    if (!message.trim() || !coaching || isSending) return;

    const canSend = coaching.biff_score.overall >= minBiffScore;
    if (!canSend) {
      setShowCoaching(true);
      return;
    }

    setIsSending(true);
    try {
      await onSend(message, coaching.biff_score);
      setMessage('');
      setCoaching(null);
      setShowCoaching(false);
    } finally {
      setIsSending(false);
    }
  };

  const canSend =
    message.trim() &&
    coaching &&
    coaching.biff_score.overall >= minBiffScore &&
    !disabled &&
    !isSending;

  return (
    <View style={styles.container}>
      {showCoaching && coaching && (
        <View style={styles.coachingContainer}>
          <View style={styles.coachingHeader}>
            <Text style={styles.coachingTitle}>AI Coaching</Text>
            <IconButton
              icon="close"
              size={20}
              onPress={() => setShowCoaching(false)}
            />
          </View>

          <BIFFScoreBar score={coaching.biff_score} />

          <Text style={styles.coachingMessage}>{coaching.coaching_message}</Text>

          {coaching.biff_score.suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Suggestions:</Text>
              {coaching.biff_score.suggestions.map((suggestion, index) => (
                <Text key={index} style={styles.suggestion}>
                  • {suggestion}
                </Text>
              ))}
            </View>
          )}

          {coaching.improved_version && (
            <View style={styles.improvedVersionContainer}>
              <Text style={styles.improvedVersionTitle}>Suggested rewrite:</Text>
              <TouchableOpacity
                onPress={() => setMessage(coaching.improved_version!)}
                style={styles.improvedVersionButton}
              >
                <Text style={styles.improvedVersionText}>
                  {coaching.improved_version}
                </Text>
                <Text style={styles.useThisText}>Tap to use this version</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
            editable={!disabled && !isSending}
          />

          {coaching && (
            <TouchableOpacity
              style={styles.scoreIndicator}
              onPress={() => setShowCoaching(!showCoaching)}
            >
              <Text
                style={[
                  styles.scoreText,
                  {
                    color:
                      coaching.biff_score.overall >= 75
                        ? '#4CAF50'
                        : coaching.biff_score.overall >= 50
                        ? '#FFC107'
                        : '#F44336',
                  },
                ]}
              >
                {Math.round(coaching.biff_score.overall)}%
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.actions}>
          <IconButton
            icon="paperclip"
            size={24}
            onPress={() => {
              // TODO: Implement attachment picker
            }}
            disabled={disabled || isSending}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              canSend ? styles.sendButtonActive : styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!canSend}
          >
            <IconButton
              icon="send"
              size={24}
              iconColor={canSend ? '#fff' : '#999'}
              style={{ margin: 0 }}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.characterCount}>
        {message.length} / 1000 characters
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  coachingContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    maxHeight: 400,
  },
  coachingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  coachingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  coachingMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
  suggestionsContainer: {
    marginTop: 12,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  suggestion: {
    fontSize: 13,
    color: '#666',
    marginVertical: 2,
    lineHeight: 18,
  },
  improvedVersionContainer: {
    marginTop: 12,
  },
  improvedVersionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  improvedVersionButton: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  improvedVersionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  useThisText: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 120,
  },
  input: {
    fontSize: 16,
    color: '#333',
    minHeight: 40,
  },
  scoreIndicator: {
    position: 'absolute',
    right: 8,
    top: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  scoreText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendButton: {
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#007AFF',
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  characterCount: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    paddingRight: 16,
    paddingBottom: 8,
  },
});
