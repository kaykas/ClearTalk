import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export interface EmailNotificationPayload {
  userId: string;
  messageId: string;
  conversationId: string;
  senderName: string;
  messagePreview: string;
  biffScore?: number;
}

export interface EmailNotificationResult {
  delivered: boolean;
  emailId?: string;
  error?: string;
  timestamp: Date;
}

/**
 * Send email notification via SendGrid
 * Target: 99.9% delivery within 5 minutes
 */
export async function sendEmailNotification(
  payload: EmailNotificationPayload
): Promise<EmailNotificationResult> {
  try {
    // Get user's email address from database
    const emailAddress = await getUserEmail(payload.userId);

    if (!emailAddress) {
      return {
        delivered: false,
        error: 'No email address registered for user',
        timestamp: new Date()
      };
    }

    // Get user's name for personalization
    const userName = await getUserName(payload.userId);

    // Construct email
    const msg = {
      to: emailAddress,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'notifications@cleartalk.com',
        name: 'ClearTalk'
      },
      subject: `New ClearTalk Message from ${payload.senderName}`,
      html: generateEmailHTML(payload, userName),
      text: generateEmailPlainText(payload, userName),
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      },
      customArgs: {
        messageId: payload.messageId,
        conversationId: payload.conversationId,
        userId: payload.userId
      }
    };

    // Send email via SendGrid
    const response = await sgMail.send(msg);

    // Extract message ID from response
    const emailId = response[0].headers['x-message-id'];

    return {
      delivered: true,
      emailId: emailId as string,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('Email notification error:', error);
    return {
      delivered: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    };
  }
}

/**
 * Generate HTML email content
 */
function generateEmailHTML(payload: EmailNotificationPayload, userName?: string): string {
  const deepLink = `https://app.cleartalk.com/c/${payload.conversationId}`;
  const unsubscribeLink = `https://app.cleartalk.com/settings/notifications?unsubscribe=email`;

  const biffScoreHTML = payload.biffScore
    ? `<div style="margin: 20px 0; padding: 12px; background: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 4px;">
         <strong>BIFF Score: ${payload.biffScore}/100</strong>
         <p style="margin: 8px 0 0 0; font-size: 14px; color: #64748b;">
           ${getBIFFScoreDescription(payload.biffScore)}
         </p>
       </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New ClearTalk Message</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; border-bottom: 1px solid #e2e8f0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #0f172a;">
                ClearTalk
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #334155;">
                ${userName ? `Hi ${userName},` : 'Hi there,'}
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; color: #334155;">
                You have a new message from <strong>${payload.senderName}</strong>:
              </p>

              <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.6;">
                  ${escapeHTML(payload.messagePreview)}
                </p>
              </div>

              ${biffScoreHTML}

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="${deepLink}" style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
                      View in ClearTalk
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                This is an automated notification from ClearTalk. You can manage your notification preferences in your account settings.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8; text-align: center;">
                ClearTalk - Clear communication for high-conflict situations
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                <a href="${unsubscribeLink}" style="color: #94a3b8; text-decoration: underline;">
                  Unsubscribe from email notifications
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email content (fallback)
 */
function generateEmailPlainText(payload: EmailNotificationPayload, userName?: string): string {
  const deepLink = `https://app.cleartalk.com/c/${payload.conversationId}`;
  const unsubscribeLink = `https://app.cleartalk.com/settings/notifications?unsubscribe=email`;

  const biffScoreText = payload.biffScore
    ? `\n\nBIFF Score: ${payload.biffScore}/100\n${getBIFFScoreDescription(payload.biffScore)}\n`
    : '';

  return `
ClearTalk - New Message

${userName ? `Hi ${userName},` : 'Hi there,'}

You have a new message from ${payload.senderName}:

"${payload.messagePreview}"
${biffScoreText}
View in ClearTalk: ${deepLink}

---

This is an automated notification from ClearTalk.
Manage notification preferences: https://app.cleartalk.com/settings/notifications
Unsubscribe from email notifications: ${unsubscribeLink}

ClearTalk - Clear communication for high-conflict situations
  `.trim();
}

/**
 * Get BIFF score description
 */
function getBIFFScoreDescription(score: number): string {
  if (score >= 90) {
    return 'Excellent - Brief, Informative, Friendly, and Firm';
  } else if (score >= 70) {
    return 'Good - Mostly follows BIFF principles';
  } else if (score >= 50) {
    return 'Fair - Could be improved';
  } else {
    return 'Needs improvement - Consider revising';
  }
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  const div = { textContent: text } as any;
  return div.innerHTML || text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Handle SendGrid webhook events (delivered, opened, clicked, bounced, etc.)
 */
export async function handleSendGridWebhook(events: Array<{
  event: string;
  email: string;
  timestamp: number;
  messageId?: string;
  conversationId?: string;
  userId?: string;
}>): Promise<void> {
  for (const event of events) {
    try {
      const { event: eventType, email, messageId, userId } = event;

      // Map SendGrid event to our tracking status
      let status: 'sent' | 'delivered' | 'failed' | 'read' | null = null;

      switch (eventType) {
        case 'delivered':
          status = 'delivered';
          break;
        case 'open':
          status = 'read';
          break;
        case 'bounce':
        case 'dropped':
        case 'deferred':
          status = 'failed';
          break;
      }

      if (status && messageId) {
        await updateEmailDeliveryStatus(messageId, status);
      }

      // Handle unsubscribes
      if (eventType === 'unsubscribe' && userId) {
        await handleEmailUnsubscribe(userId);
      }

      // Log bounces for cleanup
      if (eventType === 'bounce') {
        console.warn(`Email bounced for ${email} - consider removing from list`);
      }

    } catch (error) {
      console.error('Error handling SendGrid webhook event:', error);
    }
  }
}

/**
 * Handle email unsubscribe
 */
async function handleEmailUnsubscribe(userId: string): Promise<void> {
  try {
    // Disable email notifications for this user
    await updateUserNotificationPreferences(userId, {
      email: false
    });

    console.log(`User ${userId} unsubscribed from email notifications`);
  } catch (error) {
    console.error('Error handling email unsubscribe:', error);
  }
}

/**
 * Get user's email address from database
 */
async function getUserEmail(userId: string): Promise<string | null> {
  // TODO: Implement database query
  // SELECT email FROM users WHERE id = userId
  throw new Error('Not implemented - connect to database');
}

/**
 * Get user's name from database
 */
async function getUserName(userId: string): Promise<string | null> {
  // TODO: Implement database query
  // SELECT name FROM users WHERE id = userId
  return null;
}

/**
 * Update email delivery status in tracking table
 */
async function updateEmailDeliveryStatus(
  messageId: string,
  status: 'sent' | 'delivered' | 'failed' | 'read'
): Promise<void> {
  // TODO: Implement database update
  // UPDATE notifications SET status = status, delivered_at = NOW()
  // WHERE message_id = messageId AND channel = 'email'
  console.log(`Updating email status for ${messageId}: ${status}`);
}

/**
 * Update user notification preferences
 */
async function updateUserNotificationPreferences(
  userId: string,
  preferences: { sms?: boolean; email?: boolean; push?: boolean }
): Promise<void> {
  // TODO: Implement database update
  console.log(`Updating notification preferences for user ${userId}:`, preferences);
}
