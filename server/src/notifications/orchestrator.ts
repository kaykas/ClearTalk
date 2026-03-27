/**
 * Notification Orchestrator
 *
 * Triple-redundant notification delivery system:
 * 1. Push notification (target: 95% delivery in 5s)
 * 2. SMS fallback (target: 99% delivery in 30s)
 * 3. Email fallback (target: 99.9% delivery in 5min)
 *
 * Overall SLA: 99.95% delivery within 5 minutes
 */

import { sendPushNotification, PushNotificationPayload } from './push';
import { sendSMSNotification, SMSNotificationPayload } from './sms';
import { sendEmailNotification, EmailNotificationPayload } from './email';
import { trackNotificationSend, updateDeliveryStatus, checkIfRead } from './tracker';

export interface UserPreferences {
  userId: string;
  notificationChannels: {
    push: boolean;
    sms: boolean;
    email: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "07:00"
    timezone: string; // "America/Los_Angeles"
  };
  notificationPriority: 'all' | 'urgent_only' | 'none';
}

export interface NotificationContext {
  messageId: string;
  conversationId: string;
  recipientUserId: string;
  senderName: string;
  messagePreview: string;
  biffScore?: number;
  priority: 'normal' | 'high' | 'urgent';
}

export interface NotificationResult {
  success: boolean;
  channelUsed: 'push' | 'sms' | 'email' | 'none';
  deliveredAt?: Date;
  error?: string;
  escalationPath?: string[]; // Track which channels were tried
}

/**
 * Main orchestration function - handles triple-redundant notification delivery
 */
export async function sendNotification(
  context: NotificationContext
): Promise<NotificationResult> {
  const escalationPath: string[] = [];

  try {
    // 1. Get user preferences
    const preferences = await getUserPreferences(context.recipientUserId);

    // 2. Check if notifications are disabled entirely
    if (preferences.notificationPriority === 'none') {
      return {
        success: false,
        channelUsed: 'none',
        error: 'Notifications disabled by user'
      };
    }

    // 3. Check if this is urgent-only mode and message is not urgent
    if (preferences.notificationPriority === 'urgent_only' && context.priority !== 'urgent') {
      return {
        success: false,
        channelUsed: 'none',
        error: 'Non-urgent notifications disabled by user'
      };
    }

    // 4. Check quiet hours (unless urgent)
    if (context.priority !== 'urgent' && isInQuietHours(preferences)) {
      return {
        success: false,
        channelUsed: 'none',
        error: 'In quiet hours (non-urgent message)'
      };
    }

    // 5. Try Push Notification (if enabled)
    if (preferences.notificationChannels.push) {
      const pushResult = await attemptPushNotification(context, escalationPath);
      if (pushResult.success) {
        return pushResult;
      }
    }

    // 6. Try SMS (if enabled)
    if (preferences.notificationChannels.sms) {
      const smsResult = await attemptSMSNotification(context, escalationPath);
      if (smsResult.success) {
        return smsResult;
      }
    }

    // 7. Try Email (if enabled)
    if (preferences.notificationChannels.email) {
      const emailResult = await attemptEmailNotification(context, escalationPath);
      return emailResult;
    }

    // 8. All channels disabled or failed
    return {
      success: false,
      channelUsed: 'none',
      error: 'All notification channels disabled or failed',
      escalationPath
    };

  } catch (error) {
    console.error('Notification orchestration error:', error);
    return {
      success: false,
      channelUsed: 'none',
      error: error instanceof Error ? error.message : 'Unknown error',
      escalationPath
    };
  }
}

/**
 * Attempt push notification with automatic escalation
 */
async function attemptPushNotification(
  context: NotificationContext,
  escalationPath: string[]
): Promise<NotificationResult> {
  escalationPath.push('push');

  try {
    console.log(`[Push] Sending notification for message ${context.messageId}`);

    const payload: PushNotificationPayload = {
      userId: context.recipientUserId,
      messageId: context.messageId,
      conversationId: context.conversationId,
      senderName: context.senderName,
      messagePreview: context.messagePreview,
      priority: context.priority === 'urgent' ? 'high' : 'normal'
    };

    // Send push notification
    const result = await sendPushNotification(payload);

    // Track send
    await trackNotificationSend(
      context.messageId,
      context.recipientUserId,
      'push',
      result.ticketId
    );

    if (!result.delivered) {
      console.log(`[Push] Failed: ${result.error}`);
      await updateDeliveryStatus(context.messageId, 'push', 'failed', result.error);
      return { success: false, channelUsed: 'push', error: result.error, escalationPath };
    }

    console.log(`[Push] Sent successfully, waiting 30s for delivery confirmation...`);

    // Wait 30 seconds to check if delivered or message was read
    await sleep(30000);

    // Check if message was read (user opened app)
    const isRead = await checkIfRead(context.messageId);
    if (isRead) {
      console.log(`[Push] Message read - notification successful`);
      await updateDeliveryStatus(context.messageId, 'push', 'read');
      return {
        success: true,
        channelUsed: 'push',
        deliveredAt: new Date(),
        escalationPath
      };
    }

    // If still not read after 30s, escalate to SMS
    console.log(`[Push] Not read after 30s - escalating to SMS`);
    return { success: false, channelUsed: 'push', error: 'Not read within 30s', escalationPath };

  } catch (error) {
    console.error('[Push] Error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await updateDeliveryStatus(context.messageId, 'push', 'failed', errorMsg);
    return { success: false, channelUsed: 'push', error: errorMsg, escalationPath };
  }
}

/**
 * Attempt SMS notification with automatic escalation
 */
async function attemptSMSNotification(
  context: NotificationContext,
  escalationPath: string[]
): Promise<NotificationResult> {
  escalationPath.push('sms');

  try {
    console.log(`[SMS] Sending notification for message ${context.messageId}`);

    const payload: SMSNotificationPayload = {
      userId: context.recipientUserId,
      messageId: context.messageId,
      conversationId: context.conversationId,
      senderName: context.senderName,
      messagePreview: context.messagePreview
    };

    // Send SMS
    const result = await sendSMSNotification(payload);

    // Track send
    await trackNotificationSend(
      context.messageId,
      context.recipientUserId,
      'sms',
      result.sid
    );

    if (!result.delivered) {
      console.log(`[SMS] Failed: ${result.error}`);
      await updateDeliveryStatus(context.messageId, 'sms', 'failed', result.error);
      return { success: false, channelUsed: 'sms', error: result.error, escalationPath };
    }

    console.log(`[SMS] Sent successfully, waiting 2min for delivery confirmation...`);

    // Wait 2 minutes to check if message was read
    await sleep(120000);

    // Check if message was read (user opened app via SMS link)
    const isRead = await checkIfRead(context.messageId);
    if (isRead) {
      console.log(`[SMS] Message read - notification successful`);
      await updateDeliveryStatus(context.messageId, 'sms', 'read');
      return {
        success: true,
        channelUsed: 'sms',
        deliveredAt: new Date(),
        escalationPath
      };
    }

    // If still not read after 2 minutes, escalate to email
    console.log(`[SMS] Not read after 2min - escalating to email`);
    return { success: false, channelUsed: 'sms', error: 'Not read within 2min', escalationPath };

  } catch (error) {
    console.error('[SMS] Error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await updateDeliveryStatus(context.messageId, 'sms', 'failed', errorMsg);
    return { success: false, channelUsed: 'sms', error: errorMsg, escalationPath };
  }
}

/**
 * Attempt email notification (final fallback)
 */
async function attemptEmailNotification(
  context: NotificationContext,
  escalationPath: string[]
): Promise<NotificationResult> {
  escalationPath.push('email');

  try {
    console.log(`[Email] Sending notification for message ${context.messageId}`);

    const payload: EmailNotificationPayload = {
      userId: context.recipientUserId,
      messageId: context.messageId,
      conversationId: context.conversationId,
      senderName: context.senderName,
      messagePreview: context.messagePreview,
      biffScore: context.biffScore
    };

    // Send email
    const result = await sendEmailNotification(payload);

    // Track send
    await trackNotificationSend(
      context.messageId,
      context.recipientUserId,
      'email',
      result.emailId
    );

    if (!result.delivered) {
      console.log(`[Email] Failed: ${result.error}`);
      await updateDeliveryStatus(context.messageId, 'email', 'failed', result.error);
      return { success: false, channelUsed: 'email', error: result.error, escalationPath };
    }

    console.log(`[Email] Sent successfully`);
    await updateDeliveryStatus(context.messageId, 'email', 'delivered');

    return {
      success: true,
      channelUsed: 'email',
      deliveredAt: new Date(),
      escalationPath
    };

  } catch (error) {
    console.error('[Email] Error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await updateDeliveryStatus(context.messageId, 'email', 'failed', errorMsg);
    return { success: false, channelUsed: 'email', error: errorMsg, escalationPath };
  }
}

/**
 * Get user notification preferences
 */
async function getUserPreferences(userId: string): Promise<UserPreferences> {
  try {
    // TODO: Implement database query
    // SELECT * FROM user_preferences WHERE user_id = userId

    // Default preferences (all channels enabled)
    return {
      userId,
      notificationChannels: {
        push: true,
        sms: true,
        email: true
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
        timezone: 'America/Los_Angeles'
      },
      notificationPriority: 'all'
    };
  } catch (error) {
    console.error('Error getting user preferences:', error);

    // Return safe defaults on error
    return {
      userId,
      notificationChannels: {
        push: true,
        sms: true,
        email: true
      },
      notificationPriority: 'all'
    };
  }
}

/**
 * Check if current time is within user's quiet hours
 */
function isInQuietHours(preferences: UserPreferences): boolean {
  if (!preferences.quietHours?.enabled) {
    return false;
  }

  try {
    const now = new Date();
    const userTime = new Date(now.toLocaleString('en-US', {
      timeZone: preferences.quietHours.timezone
    }));

    const currentHour = userTime.getHours();
    const currentMinute = userTime.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMinute] = preferences.quietHours.end.split(':').map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    } else {
      return currentTime >= startTime && currentTime < endTime;
    }
  } catch (error) {
    console.error('Error checking quiet hours:', error);
    return false; // Default to allowing notifications on error
  }
}

/**
 * Determine message priority based on content and context
 */
export function determineMessagePriority(
  messageContent: string,
  conversationContext?: {
    hasCourtDeadline?: boolean;
    hasCustodySwap?: boolean;
    custodySwapTime?: Date;
  }
): 'normal' | 'high' | 'urgent' {
  // Urgent: court deadlines, custody swaps within 2 hours
  if (conversationContext?.hasCourtDeadline) {
    return 'urgent';
  }

  if (conversationContext?.hasCustodySwap && conversationContext.custodySwapTime) {
    const hoursUntilSwap = (conversationContext.custodySwapTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilSwap <= 2) {
      return 'urgent';
    }
  }

  // High: contains urgent keywords
  const urgentKeywords = [
    'emergency',
    'urgent',
    'asap',
    'immediately',
    'hospital',
    'injury',
    'police',
    'court'
  ];

  const lowerContent = messageContent.toLowerCase();
  if (urgentKeywords.some(keyword => lowerContent.includes(keyword))) {
    return 'high';
  }

  // Normal: everything else
  return 'normal';
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// Database schema for user_preferences (for reference)
// =============================================================================

/*
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  notification_channels JSONB NOT NULL DEFAULT '{"push": true, "sms": true, "email": true}',
  quiet_hours JSONB DEFAULT '{"enabled": false, "start": "22:00", "end": "07:00", "timezone": "America/Los_Angeles"}',
  notification_priority VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (notification_priority IN ('all', 'urgent_only', 'none')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
*/
