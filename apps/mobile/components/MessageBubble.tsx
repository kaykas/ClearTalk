import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { Message } from '../lib/supabase';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  showVerificationBadge?: boolean;
}

export default function MessageBubble({
  message,
  isCurrentUser,
  showVerificationBadge = true,
}: MessageBubbleProps) {
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusIcon = () => {
    if (message.read_at) {
      return 'check-all'; // Double check - read
    }
    if (message.delivered_at) {
      return 'check-all'; // Double check - delivered
    }
    return 'check'; // Single check - sent
  };

  const getStatusColor = () => {
    if (message.read_at) {
      return '#4CAF50'; // Green - read
    }
    return '#999'; // Gray - sent/delivered
  };

  return (
    <View
      style={[
        styles.container,
        isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText,
          ]}
        >
          {message.content}
        </Text>

        <View style={styles.footer}>
          <Text
            style={[
              styles.timestamp,
              isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp,
            ]}
          >
            {formatTime(message.created_at)}
          </Text>

          {showVerificationBadge && (
            <IconButton
              icon="shield-check"
              size={14}
              iconColor={isCurrentUser ? '#fff' : '#4CAF50'}
              style={styles.verificationBadge}
            />
          )}

          {isCurrentUser && (
            <IconButton
              icon={getStatusIcon()}
              size={14}
              iconColor={getStatusColor()}
              style={styles.statusIcon}
            />
          )}
        </View>

        {message.biff_score && (
          <View style={styles.biffScoreContainer}>
            <Text
              style={[
                styles.biffScore,
                isCurrentUser ? styles.currentUserBiffScore : styles.otherUserBiffScore,
              ]}
            >
              BIFF: {Math.round(message.biff_score.overall)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  currentUserContainer: {
    justifyContent: 'flex-end',
  },
  otherUserContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentUserBubble: {
    backgroundColor: '#007AFF',
  },
  otherUserBubble: {
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#fff',
  },
  otherUserText: {
    color: '#000',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  currentUserTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherUserTimestamp: {
    color: '#999',
  },
  verificationBadge: {
    margin: 0,
    padding: 0,
    marginLeft: 4,
  },
  statusIcon: {
    margin: 0,
    padding: 0,
    marginLeft: 2,
  },
  biffScoreContainer: {
    marginTop: 4,
  },
  biffScore: {
    fontSize: 10,
    fontWeight: '600',
  },
  currentUserBiffScore: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherUserBiffScore: {
    color: '#666',
  },
});
