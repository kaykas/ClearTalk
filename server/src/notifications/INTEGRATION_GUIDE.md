# ClearTalk Notification Integration Guide

Quick start guide for integrating the notification system into your ClearTalk application.

## Step 1: Install Dependencies

```bash
cd /Users/jkw/Documents/Work/Projects/ClearTalk/server
npm install expo-server-sdk twilio @sendgrid/mail
```

## Step 2: Set Up Environment Variables

Copy the example environment file:

```bash
cp src/notifications/.env.example .env
```

Then fill in your API credentials:

```bash
# Edit .env with your actual credentials
nano .env
```

### Getting API Credentials

**Twilio (SMS):**
1. Sign up at https://www.twilio.com/try-twilio
2. Get Account SID and Auth Token from console dashboard
3. Purchase a phone number (Phone Numbers → Buy a Number)
4. Copy credentials to `.env`

**SendGrid (Email):**
1. Sign up at https://signup.sendgrid.com/
2. Create API key (Settings → API Keys → Create API Key)
3. Set up sender authentication (Settings → Sender Authentication)
4. Copy API key to `.env`

## Step 3: Set Up Database

Run the schema migration:

```bash
# Using psql
psql -U postgres -d cleartalk -f src/notifications/schema.sql

# Or using Supabase SQL Editor
# Copy contents of schema.sql into Supabase SQL Editor and run
```

This creates:
- `user_preferences` table
- `notifications` table
- `push_tokens` table
- `sms_rate_limits` table
- Analytics views
- Cleanup functions

## Step 4: Configure Webhooks

### Twilio SMS Status Webhook

1. Go to Twilio Console → Phone Numbers → Manage → Active Numbers
2. Click on your phone number
3. Scroll to "Messaging Configuration"
4. Set "A Message Comes In" to:
   - **Webhook:** `https://api.cleartalk.com/webhooks/twilio/reply`
   - **HTTP POST**
5. Set "Status Callback URL" to:
   - `https://api.cleartalk.com/webhooks/twilio/status`

### SendGrid Event Webhook

1. Go to SendGrid → Settings → Mail Settings → Event Webhook
2. Set "HTTP POST URL" to:
   - `https://api.cleartalk.com/webhooks/sendgrid/events`
3. Select events to track:
   - ✅ Delivered
   - ✅ Opened
   - ✅ Clicked
   - ✅ Bounced
   - ✅ Unsubscribed
4. Click "Save"

## Step 5: Add Webhook Routes to Express Server

In your main Express app (e.g., `server/src/index.ts`):

```typescript
import express from 'express';
import webhookRoutes from './notifications/webhooks.example';
import { scheduleMonitoringTasks } from './notifications/monitoring';

const app = express();

// Body parser for webhooks
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add webhook routes
app.use('/webhooks', webhookRoutes);

// Start monitoring tasks
scheduleMonitoringTasks();

// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Step 6: Send Your First Notification

### When a new message is created:

```typescript
import { sendNotification, determineMessagePriority } from './notifications';

// In your message creation handler
async function handleNewMessage(message: Message) {
  // Determine priority based on content
  const priority = determineMessagePriority(
    message.content,
    {
      hasCourtDeadline: message.hasCourtDeadline,
      hasCustodySwap: message.hasCustodySwap,
      custodySwapTime: message.custodySwapTime
    }
  );

  // Send notification to recipient
  const result = await sendNotification({
    messageId: message.id,
    conversationId: message.conversationId,
    recipientUserId: message.recipientId,
    senderName: message.sender.name,
    messagePreview: message.content.substring(0, 100),
    biffScore: message.biffScore,
    priority
  });

  console.log(`Notification sent via ${result.channelUsed}`);
}
```

## Step 7: Register Push Tokens (Mobile App)

In your React Native mobile app:

```typescript
// App.tsx or login flow
import * as Notifications from 'expo-notifications';
import axios from 'axios';

async function registerForPushNotifications(userId: string) {
  // Request permission
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('Push notification permission denied');
    return;
  }

  // Get Expo push token
  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Register with backend
  await axios.post('/api/users/push-token', {
    userId,
    pushToken: token
  });

  console.log('Push token registered:', token);
}
```

Backend route to save push token:

```typescript
import { registerPushToken } from './notifications/push';

app.post('/api/users/push-token', async (req, res) => {
  const { userId, pushToken } = req.body;

  const success = await registerPushToken(userId, pushToken);

  if (success) {
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid push token' });
  }
});
```

## Step 8: User Notification Preferences UI

Create a settings page where users can configure their preferences:

```typescript
// Frontend component
function NotificationSettings({ userId }: { userId: string }) {
  const [preferences, setPreferences] = useState({
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
  });

  const handleSave = async () => {
    await axios.put(`/api/users/${userId}/preferences`, preferences);
  };

  return (
    <div>
      <h2>Notification Preferences</h2>

      <label>
        <input
          type="checkbox"
          checked={preferences.notificationChannels.push}
          onChange={(e) => setPreferences({
            ...preferences,
            notificationChannels: {
              ...preferences.notificationChannels,
              push: e.target.checked
            }
          })}
        />
        Push Notifications
      </label>

      <label>
        <input
          type="checkbox"
          checked={preferences.notificationChannels.sms}
          onChange={(e) => setPreferences({
            ...preferences,
            notificationChannels: {
              ...preferences.notificationChannels,
              sms: e.target.checked
            }
          })}
        />
        SMS Notifications
      </label>

      <label>
        <input
          type="checkbox"
          checked={preferences.notificationChannels.email}
          onChange={(e) => setPreferences({
            ...preferences,
            notificationChannels: {
              ...preferences.notificationChannels,
              email: e.target.checked
            }
          })}
        />
        Email Notifications
      </label>

      <button onClick={handleSave}>Save Preferences</button>
    </div>
  );
}
```

Backend route to save preferences:

```typescript
app.put('/api/users/:userId/preferences', async (req, res) => {
  const { userId } = req.params;
  const preferences = req.body;

  // TODO: Save to database
  // await db.query(
  //   'UPDATE user_preferences SET notification_channels = $1, quiet_hours = $2, notification_priority = $3 WHERE user_id = $4',
  //   [preferences.notificationChannels, preferences.quietHours, preferences.notificationPriority, userId]
  // );

  res.json({ success: true });
});
```

## Step 9: Monitoring Dashboard (Optional)

Add a monitoring endpoint for ops team:

```typescript
import { performHealthCheck, getDashboardMetrics } from './notifications/monitoring';

// Health check endpoint
app.get('/api/notifications/health', async (req, res) => {
  const health = await performHealthCheck();
  res.json(health);
});

// Metrics dashboard
app.get('/api/notifications/metrics', async (req, res) => {
  const metrics = await getDashboardMetrics();
  res.json(metrics);
});
```

## Step 10: Testing

### Test Push Notification

```bash
# Send test notification
curl -X POST http://localhost:3000/api/test/notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "message": "Test notification"
  }'
```

### Test SMS (use your own phone number)

Update user record with your phone number:

```sql
UPDATE users SET phone_number = '+1234567890' WHERE id = 'user-123';
```

Disable push to force SMS:

```sql
UPDATE user_preferences
SET notification_channels = '{"push": false, "sms": true, "email": true}'
WHERE user_id = 'user-123';
```

Send notification - should receive SMS.

### Test Email

Update user record with your email:

```sql
UPDATE users SET email = 'your-email@example.com' WHERE id = 'user-123';
```

Disable push and SMS to force email:

```sql
UPDATE user_preferences
SET notification_channels = '{"push": false, "sms": false, "email": true}'
WHERE user_id = 'user-123';
```

Send notification - should receive email.

## Common Issues

### Push Notifications Not Working

1. **Check push token is registered:**
   ```sql
   SELECT * FROM push_tokens WHERE user_id = 'user-123';
   ```

2. **Check Expo Push Service status:**
   - Visit https://status.expo.dev/

3. **Verify token format:**
   - Must start with `ExponentPushToken[...]`

### SMS Not Sending

1. **Check Twilio credentials:**
   ```bash
   echo $TWILIO_ACCOUNT_SID
   echo $TWILIO_AUTH_TOKEN
   ```

2. **Check phone number format:**
   - Must be E.164: `+1234567890`

3. **Check rate limit:**
   ```sql
   SELECT * FROM sms_rate_limits WHERE user_id = 'user-123';
   ```

### Email Bouncing

1. **Verify sender domain is authenticated:**
   - SendGrid → Settings → Sender Authentication

2. **Check email address:**
   ```sql
   SELECT email FROM users WHERE id = 'user-123';
   ```

3. **Review bounce logs:**
   - SendGrid → Activity → Bounces

## Production Checklist

Before deploying to production:

- [ ] All environment variables set in production
- [ ] Database schema migrated
- [ ] Webhooks configured with production URLs
- [ ] Webhook signature verification enabled
- [ ] Monitoring tasks scheduled
- [ ] Alert notifications configured (Slack, PagerDuty)
- [ ] Test all three channels (push, SMS, email)
- [ ] Test escalation flow
- [ ] Test user preferences
- [ ] Test quiet hours
- [ ] Load test with realistic traffic
- [ ] Review cost estimates (SMS is $0.0075/msg)
- [ ] Set up error tracking (Sentry)
- [ ] Document on-call procedures

## Cost Management

Monitor SMS usage to avoid surprises:

```sql
-- SMS sent in last 30 days
SELECT COUNT(*) FROM notifications
WHERE channel = 'sms'
AND sent_at > NOW() - INTERVAL '30 days';

-- Cost estimate (at $0.0075/SMS)
SELECT COUNT(*) * 0.0075 AS estimated_cost_usd
FROM notifications
WHERE channel = 'sms'
AND sent_at > NOW() - INTERVAL '30 days';
```

Set up usage alerts in Twilio Console to prevent overage.

---

**Questions?** Check the main README.md or open an issue.
