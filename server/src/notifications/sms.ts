import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export interface SMSNotificationPayload {
  userId: string;
  messageId: string;
  conversationId: string;
  senderName: string;
  messagePreview: string;
}

export interface SMSNotificationResult {
  delivered: boolean;
  sid?: string;
  error?: string;
  timestamp: Date;
}

/**
 * Send SMS notification via Twilio
 * Target: 99% delivery within 30 seconds
 */
export async function sendSMSNotification(
  payload: SMSNotificationPayload
): Promise<SMSNotificationResult> {
  try {
    // Get user's phone number from database
    const phoneNumber = await getUserPhoneNumber(payload.userId);

    if (!phoneNumber) {
      return {
        delivered: false,
        error: 'No phone number registered for user',
        timestamp: new Date()
      };
    }

    // Check SMS rate limit (max 10 SMS/hour per user)
    const canSendSMS = await checkSMSRateLimit(payload.userId);
    if (!canSendSMS) {
      return {
        delivered: false,
        error: 'SMS rate limit exceeded (10/hour)',
        timestamp: new Date()
      };
    }

    // Truncate message preview to 100 characters
    const preview = payload.messagePreview.length > 100
      ? payload.messagePreview.substring(0, 97) + '...'
      : payload.messagePreview;

    // Construct SMS message with deep link
    const deepLink = `https://app.cleartalk.com/c/${payload.conversationId}`;
    const messageBody = `New ClearTalk message from ${payload.senderName}: "${preview}". View: ${deepLink}. Reply STOP to disable SMS notifications.`;

    // Send SMS via Twilio
    const message = await client.messages.create({
      body: messageBody,
      from: fromPhone,
      to: phoneNumber,
      statusCallback: `${process.env.SERVER_BASE_URL}/webhooks/twilio/status` // Delivery status webhook
    });

    // Track SMS send
    await trackSMSSend(payload.userId);

    return {
      delivered: true,
      sid: message.sid,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('SMS notification error:', error);
    return {
      delivered: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    };
  }
}

/**
 * Handle Twilio delivery status webhook
 * Called when SMS delivery status changes (queued → sent → delivered/failed)
 */
export async function handleTwilioWebhook(webhookData: {
  MessageSid: string;
  MessageStatus: string;
  ErrorCode?: string;
  ErrorMessage?: string;
}): Promise<void> {
  try {
    const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = webhookData;

    // Map Twilio status to our tracking status
    let status: 'sent' | 'delivered' | 'failed' | 'read';
    switch (MessageStatus) {
      case 'sent':
      case 'queued':
        status = 'sent';
        break;
      case 'delivered':
        status = 'delivered';
        break;
      case 'failed':
      case 'undelivered':
        status = 'failed';
        break;
      default:
        status = 'sent';
    }

    // Update delivery tracking
    await updateSMSDeliveryStatus(MessageSid, status, ErrorMessage);

    // Log errors
    if (ErrorCode) {
      console.error(`Twilio SMS error (${MessageSid}):`, ErrorCode, ErrorMessage);
    }

  } catch (error) {
    console.error('Error handling Twilio webhook:', error);
  }
}

/**
 * Handle SMS opt-out (STOP replies)
 */
export async function handleSMSOptOut(phoneNumber: string): Promise<void> {
  try {
    // Find user by phone number
    const userId = await getUserIdByPhoneNumber(phoneNumber);

    if (userId) {
      // Disable SMS notifications for this user
      await updateUserNotificationPreferences(userId, {
        sms: false
      });

      console.log(`User ${userId} opted out of SMS notifications`);
    }
  } catch (error) {
    console.error('Error handling SMS opt-out:', error);
  }
}

/**
 * Check SMS rate limit (max 10 SMS/hour per user)
 */
async function checkSMSRateLimit(userId: string): Promise<boolean> {
  // TODO: Implement rate limit check
  // Query: SELECT COUNT(*) FROM notifications
  // WHERE user_id = userId AND channel = 'sms'
  // AND sent_at > NOW() - INTERVAL '1 hour'
  // Return: count < 10

  // For now, return true (no rate limit)
  return true;
}

/**
 * Track SMS send for rate limiting
 */
async function trackSMSSend(userId: string): Promise<void> {
  // TODO: Insert into notifications table
  console.log(`Tracking SMS send for user ${userId}`);
}

/**
 * Get user's phone number from database
 */
async function getUserPhoneNumber(userId: string): Promise<string | null> {
  // TODO: Implement database query
  // SELECT phone_number FROM users WHERE id = userId
  throw new Error('Not implemented - connect to database');
}

/**
 * Get user ID by phone number
 */
async function getUserIdByPhoneNumber(phoneNumber: string): Promise<string | null> {
  // TODO: Implement database query
  // SELECT id FROM users WHERE phone_number = phoneNumber
  throw new Error('Not implemented - connect to database');
}

/**
 * Update SMS delivery status in tracking table
 */
async function updateSMSDeliveryStatus(
  messageSid: string,
  status: 'sent' | 'delivered' | 'failed' | 'read',
  errorMessage?: string
): Promise<void> {
  // TODO: Implement database update
  // UPDATE notifications SET status = status, delivered_at = NOW(), error_message = errorMessage
  // WHERE sms_sid = messageSid
  console.log(`Updating SMS status for ${messageSid}: ${status}`);
}

/**
 * Update user notification preferences
 */
async function updateUserNotificationPreferences(
  userId: string,
  preferences: { sms?: boolean; email?: boolean; push?: boolean }
): Promise<void> {
  // TODO: Implement database update
  // UPDATE user_preferences SET notification_channels = jsonb_set(...)
  // WHERE user_id = userId
  console.log(`Updating notification preferences for user ${userId}:`, preferences);
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // E.164 format: +[country code][number]
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}
