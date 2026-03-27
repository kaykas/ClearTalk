import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushSuccessTicket } from 'expo-server-sdk';

const expo = new Expo();

export interface PushNotificationPayload {
  userId: string;
  messageId: string;
  conversationId: string;
  senderName: string;
  messagePreview: string;
  priority: 'normal' | 'high';
}

export interface PushNotificationResult {
  delivered: boolean;
  ticketId?: string;
  error?: string;
  timestamp: Date;
}

/**
 * Send push notification via Expo Push Service (APNs + FCM)
 * Target: 95% delivery within 5 seconds
 */
export async function sendPushNotification(
  payload: PushNotificationPayload
): Promise<PushNotificationResult> {
  try {
    // Get user's push token from database
    const pushToken = await getUserPushToken(payload.userId);

    if (!pushToken) {
      return {
        delivered: false,
        error: 'No push token registered for user',
        timestamp: new Date()
      };
    }

    // Validate push token
    if (!Expo.isExpoPushToken(pushToken)) {
      return {
        delivered: false,
        error: `Invalid Expo push token: ${pushToken}`,
        timestamp: new Date()
      };
    }

    // Construct push message
    const message: ExpoPushMessage = {
      to: pushToken,
      sound: 'default',
      title: `New message from ${payload.senderName}`,
      body: payload.messagePreview,
      data: {
        conversationId: payload.conversationId,
        messageId: payload.messageId,
        deepLink: `cleartalk://conversation/${payload.conversationId}`
      },
      priority: payload.priority,
      channelId: 'messages' // Android notification channel
    };

    // Send push notification
    const tickets = await expo.sendPushNotificationsAsync([message]);
    const ticket = tickets[0];

    // Check if ticket was accepted
    if (ticket.status === 'error') {
      const errorTicket = ticket as { status: 'error'; message: string; details?: any };
      return {
        delivered: false,
        error: errorTicket.message,
        timestamp: new Date()
      };
    }

    const successTicket = ticket as ExpoPushSuccessTicket;

    // Schedule receipt check (Expo processes push notifications asynchronously)
    schedulePushReceiptCheck(successTicket.id, payload.messageId);

    return {
      delivered: true,
      ticketId: successTicket.id,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('Push notification error:', error);
    return {
      delivered: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    };
  }
}

/**
 * Check push notification delivery receipts
 * Called 30 seconds after sending to verify delivery
 */
export async function checkPushReceipts(ticketIds: string[]): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();

  try {
    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(ticketIds);

    for (const chunk of receiptIdChunks) {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

      for (const receiptId in receipts) {
        const receipt = receipts[receiptId];

        if (receipt.status === 'ok') {
          results.set(receiptId, true);
        } else if (receipt.status === 'error') {
          console.error(`Push receipt error for ${receiptId}:`, receipt.message);
          results.set(receiptId, false);

          // Handle specific errors
          if (receipt.details?.error === 'DeviceNotRegistered') {
            // Remove invalid push token from database
            await handleInvalidPushToken(receiptId);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking push receipts:', error);
  }

  return results;
}

/**
 * Schedule push receipt check after 30 seconds
 */
function schedulePushReceiptCheck(ticketId: string, messageId: string): void {
  setTimeout(async () => {
    const results = await checkPushReceipts([ticketId]);
    const delivered = results.get(ticketId) || false;

    // Update delivery tracking
    await updateDeliveryStatus(messageId, 'push', delivered ? 'delivered' : 'failed');
  }, 30000); // 30 seconds
}

/**
 * Get user's push token from database
 */
async function getUserPushToken(userId: string): Promise<string | null> {
  // TODO: Implement database query
  // SELECT push_token FROM users WHERE id = userId
  throw new Error('Not implemented - connect to database');
}

/**
 * Update delivery status in tracking table
 */
async function updateDeliveryStatus(
  messageId: string,
  channel: 'push' | 'sms' | 'email',
  status: 'sent' | 'delivered' | 'failed' | 'read'
): Promise<void> {
  // TODO: Implement database update
  // UPDATE notifications SET status = status, delivered_at = NOW()
  // WHERE message_id = messageId AND channel = channel
  throw new Error('Not implemented - connect to database');
}

/**
 * Handle invalid push token (device unregistered)
 */
async function handleInvalidPushToken(ticketId: string): Promise<void> {
  // TODO: Remove push token from database
  // UPDATE users SET push_token = NULL WHERE push_token = token
  console.log(`Removing invalid push token for ticket ${ticketId}`);
}

/**
 * Register user's push token
 */
export async function registerPushToken(userId: string, pushToken: string): Promise<boolean> {
  try {
    if (!Expo.isExpoPushToken(pushToken)) {
      throw new Error('Invalid Expo push token format');
    }

    // TODO: Store push token in database
    // UPDATE users SET push_token = pushToken WHERE id = userId
    console.log(`Registering push token for user ${userId}`);

    return true;
  } catch (error) {
    console.error('Error registering push token:', error);
    return false;
  }
}
