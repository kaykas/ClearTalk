/**
 * ClearTalk Notification System
 *
 * Triple-redundant notification delivery:
 * Push → SMS → Email
 *
 * Overall SLA: 99.95% delivery within 5 minutes
 */

// Main orchestrator
export {
  sendNotification,
  determineMessagePriority,
  type NotificationContext,
  type NotificationResult,
  type UserPreferences
} from './orchestrator';

// Individual channels
export {
  sendPushNotification,
  registerPushToken,
  checkPushReceipts,
  type PushNotificationPayload,
  type PushNotificationResult
} from './push';

export {
  sendSMSNotification,
  handleTwilioWebhook,
  handleSMSOptOut,
  isValidPhoneNumber,
  type SMSNotificationPayload,
  type SMSNotificationResult
} from './sms';

export {
  sendEmailNotification,
  handleSendGridWebhook,
  type EmailNotificationPayload,
  type EmailNotificationResult
} from './email';

// Delivery tracking
export {
  trackNotificationSend,
  updateDeliveryStatus,
  checkIfRead,
  getDeliveryMetrics,
  getNotificationHistory,
  getUserNotificationHistory,
  detectDeliveryIssues,
  cleanupOldNotifications,
  type NotificationRecord,
  type DeliveryMetrics,
  type ChannelMetrics
} from './tracker';
