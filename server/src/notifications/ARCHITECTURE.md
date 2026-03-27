# Notification System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ClearTalk App                                │
│                                                                       │
│  User A sends message to User B                                     │
│           │                                                          │
│           ▼                                                          │
│  ┌────────────────┐                                                 │
│  │ Message Created│                                                 │
│  └────────┬───────┘                                                 │
└───────────┼─────────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────────────┐
│                    Notification Orchestrator                       │
└───────────────────────────────────────────────────────────────────┘
            │
            ├─► Get User B preferences from database
            ├─► Check quiet hours (22:00-07:00)
            ├─► Determine message priority (normal/high/urgent)
            └─► Start triple-redundant delivery
                        │
                        ▼
        ┌───────────────────────────┐
        │  Attempt #1: Push (Expo)  │
        └───────────┬───────────────┘
                    │
        ┌───────────▼───────────┐
        │  Sent to Expo Push    │
        │  Service (APNs/FCM)   │
        └───────────┬───────────┘
                    │
        ┌───────────▼────────────────┐
        │ Wait 30s for delivery/read │
        └───────────┬────────────────┘
                    │
        ┌───────────▼────────────┐
        │  Delivered & Read?     │
        └───────────┬────────────┘
                    │
            ┌───────┴───────┐
            │               │
          YES             NO
            │               │
            ▼               ▼
     ┌──────────┐   ┌──────────────────┐
     │ SUCCESS  │   │ Escalate to SMS  │
     │  (Exit)  │   └────────┬─────────┘
     └──────────┘            │
                             ▼
                 ┌──────────────────────┐
                 │ Attempt #2: SMS      │
                 │ (Twilio)             │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │ Check rate limit     │
                 │ (10 SMS/hour)        │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │ Send SMS with        │
                 │ deep link            │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼──────────────┐
                 │ Wait 2min for read      │
                 └──────────┬──────────────┘
                            │
                 ┌──────────▼──────────┐
                 │ Delivered & Read?   │
                 └──────────┬──────────┘
                            │
                    ┌───────┴────────┐
                    │                │
                  YES              NO
                    │                │
                    ▼                ▼
             ┌──────────┐   ┌─────────────────┐
             │ SUCCESS  │   │ Escalate to     │
             │  (Exit)  │   │ Email           │
             └──────────┘   └────────┬────────┘
                                     │
                                     ▼
                         ┌──────────────────────┐
                         │ Attempt #3: Email    │
                         │ (SendGrid)           │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │ Send HTML email      │
                         │ with BIFF score      │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │ Track delivery via   │
                         │ webhook              │
                         └──────────┬───────────┘
                                    │
                                    ▼
                             ┌──────────┐
                             │ SUCCESS  │
                             │ (Final)  │
                             └──────────┘
```

## Component Responsibilities

### Orchestrator (`orchestrator.ts`)
- Main entry point for all notifications
- Checks user preferences
- Manages quiet hours
- Determines message priority
- Coordinates escalation between channels
- Tracks overall delivery

### Push Handler (`push.ts`)
- Sends via Expo Push Service
- Validates push tokens
- Checks delivery receipts
- Handles device unregistration
- Fast (1-5 seconds)

### SMS Handler (`sms.ts`)
- Sends via Twilio API
- Rate limiting (10/hour)
- Includes deep link
- Handles STOP opt-outs
- Delivery webhooks
- Medium speed (10-30 seconds)

### Email Handler (`email.ts`)
- Sends via SendGrid API
- HTML + plain text templates
- BIFF score indicator
- Unsubscribe link
- Open/click tracking
- Slower but most reliable (1-5 minutes)

### Tracker (`tracker.ts`)
- Records all delivery attempts
- Calculates metrics
- Detects SLA violations
- Provides analytics
- 90-day retention

### Monitoring (`monitoring.ts`)
- Health checks every 5 minutes
- Alert evaluation every 1 minute
- Daily cleanup at 2am
- Dashboard API
- Issue detection

## Data Flow

```
┌──────────────┐
│ New Message  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────┐
│ notifications.orchestrator       │
│ sendNotification()               │
└──────────┬───────────────────────┘
           │
           ├─► Read: user_preferences table
           │   (channels, quiet_hours, priority)
           │
           ├─► Write: notifications table
           │   (message_id, user_id, channel='push', status='sent')
           │
           ▼
┌──────────────────────────────────┐
│ notifications.push               │
│ sendPushNotification()           │
└──────────┬───────────────────────┘
           │
           ├─► Read: push_tokens table
           │   (get user's Expo token)
           │
           ├─► Call: Expo Push API
           │   (send notification)
           │
           └─► Update: notifications table
               (status='delivered' or 'failed')
               │
               ▼ (if failed)
┌──────────────────────────────────┐
│ notifications.sms                │
│ sendSMSNotification()            │
└──────────┬───────────────────────┘
           │
           ├─► Read: sms_rate_limits table
           │   (check 10/hour limit)
           │
           ├─► Write: sms_rate_limits table
           │   (increment counter)
           │
           ├─► Call: Twilio SMS API
           │   (send SMS)
           │
           └─► Update: notifications table
               (status='delivered' or 'failed')
               │
               ▼ (if failed)
┌──────────────────────────────────┐
│ notifications.email              │
│ sendEmailNotification()          │
└──────────┬───────────────────────┘
           │
           ├─► Call: SendGrid API
           │   (send email)
           │
           └─► Update: notifications table
               (status='delivered')
```

## Webhook Processing

```
┌─────────────────┐
│ Twilio Webhook  │
│ (SMS Status)    │
└────────┬────────┘
         │
         ▼
┌────────────────────────────┐
│ webhooks.handleTwilio()    │
└────────┬───────────────────┘
         │
         ├─► Update: notifications table
         │   (status='delivered' if delivered)
         │   (status='failed' if failed)
         │
         └─► If opt-out (STOP):
             Update: user_preferences
             (notification_channels.sms = false)

┌─────────────────┐
│ SendGrid Hook   │
│ (Email Events)  │
└────────┬────────┘
         │
         ▼
┌────────────────────────────┐
│ webhooks.handleSendGrid()  │
└────────┬───────────────────┘
         │
         ├─► Event: delivered
         │   Update: notifications (status='delivered')
         │
         ├─► Event: opened
         │   Update: notifications (status='read')
         │
         ├─► Event: bounced
         │   Update: notifications (status='failed')
         │
         └─► Event: unsubscribed
             Update: user_preferences
             (notification_channels.email = false)
```

## Priority Determination

```
┌──────────────────┐
│ Message Content  │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────┐
│ determineMessagePriority()      │
└────────┬────────────────────────┘
         │
         ├─► Has court deadline? ────────► URGENT
         │
         ├─► Custody swap < 2 hours? ────► URGENT
         │
         ├─► Contains: emergency, ───────► HIGH
         │   hospital, police, urgent
         │
         └─► Everything else ────────────► NORMAL

Priority Effects:
┌──────────┬─────────────────┬──────────────┐
│ Priority │ Quiet Hours     │ Urgent-Only  │
├──────────┼─────────────────┼──────────────┤
│ URGENT   │ BYPASSES        │ DELIVERS     │
│ HIGH     │ RESPECTS        │ BLOCKS       │
│ NORMAL   │ RESPECTS        │ BLOCKS       │
└──────────┴─────────────────┴──────────────┘
```

## Monitoring Dashboard

```
┌───────────────────────────────────────────┐
│         Notification Health Check         │
└───────────────────────────────────────────┘
            │
            ├─► Query: v_notification_metrics_24h
            │   (delivery rates by channel)
            │
            ├─► Query: v_sla_compliance
            │   (% delivered within 5min)
            │
            ├─► Query: v_notification_escalations
            │   (escalation path analysis)
            │
            └─► Evaluate alert rules:
                ├─ Push delivery < 95%? → WARNING
                ├─ SMS delivery < 99%? → ERROR
                ├─ Email delivery < 99.9%? → CRITICAL
                ├─ SLA compliance < 99.95%? → CRITICAL
                └─ High escalation rate? → WARNING

Result:
┌──────────┬─────────────────────────────────┐
│ Status   │ Healthy, Degraded, or Critical  │
├──────────┼─────────────────────────────────┤
│ Metrics  │ Delivery rates, avg latency     │
├──────────┼─────────────────────────────────┤
│ Alerts   │ List of triggered alert rules   │
└──────────┴─────────────────────────────────┘
```

## Database Schema Relationships

```
┌─────────────────┐
│     users       │
│                 │
│ - id (PK)       │
│ - email         │
│ - phone_number  │
│ - name          │
└────────┬────────┘
         │
         │ 1:1
         ▼
┌──────────────────────┐
│ user_preferences     │
│                      │
│ - user_id (FK)       │
│ - channels (JSONB)   │
│ - quiet_hours        │
│ - priority           │
└──────────────────────┘

┌─────────────────┐
│    messages     │
│                 │
│ - id (PK)       │
│ - content       │
│ - sender_id     │
│ - recipient_id  │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌──────────────────────┐
│  notifications       │
│                      │
│ - message_id (FK)    │
│ - user_id (FK)       │
│ - channel            │
│ - status             │
│ - sent_at            │
│ - delivered_at       │
│ - read_at            │
└──────────────────────┘

┌─────────────────┐
│     users       │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌──────────────────────┐
│   push_tokens        │
│                      │
│ - user_id (FK)       │
│ - push_token         │
│ - device_type        │
│ - is_valid           │
└──────────────────────┘

┌─────────────────┐
│     users       │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌──────────────────────┐
│ sms_rate_limits      │
│                      │
│ - user_id (FK)       │
│ - window_start       │
│ - window_end         │
│ - sms_count          │
└──────────────────────┘
```

## Scalability Considerations

### Current Design (Good for 0-100k users)
- Synchronous escalation (wait 30s, wait 2min)
- Single-threaded orchestration
- Simple database queries

### Future Optimizations (>100k users)
- Background job queue (Bull/BullMQ)
- Parallel notification attempts
- Redis for rate limiting
- Batch push notifications
- Database read replicas
- CDN for email images

### Cost at Scale

| Users | Notifications/day | SMS (2.5%) | Cost/month |
|-------|-------------------|------------|------------|
| 1k    | 5,000            | 125        | $9         |
| 10k   | 50,000           | 1,250      | $94        |
| 100k  | 500,000          | 12,500     | $938       |
| 1M    | 5,000,000        | 125,000    | $9,375     |

Push and email remain essentially free at all scales.

---

**Architecture Version**: 1.0
**Last Updated**: March 26, 2026
