-- =============================================================================
-- ClearTalk Notification System Database Schema
-- =============================================================================
--
-- This schema supports triple-redundant notification delivery:
-- Push → SMS → Email
--
-- Overall SLA: 99.95% delivery within 5 minutes
--

-- =============================================================================
-- 1. User Preferences Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Notification channel toggles
  notification_channels JSONB NOT NULL DEFAULT '{"push": true, "sms": true, "email": true}'::jsonb,

  -- Quiet hours configuration
  quiet_hours JSONB DEFAULT '{"enabled": false, "start": "22:00", "end": "07:00", "timezone": "America/Los_Angeles"}'::jsonb,

  -- Notification priority filter
  notification_priority VARCHAR(20) NOT NULL DEFAULT 'all'
    CHECK (notification_priority IN ('all', 'urgent_only', 'none')),

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 2. Notifications Tracking Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Channel and status
  channel VARCHAR(10) NOT NULL CHECK (channel IN ('push', 'sms', 'email')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'delivered', 'failed', 'read')),

  -- Timing
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,

  -- Error tracking
  error_message TEXT,

  -- External service IDs (for webhook correlation)
  external_id VARCHAR(255), -- Expo ticket_id, Twilio SMS SID, or SendGrid message ID

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notifications_message_id ON notifications(message_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_channel ON notifications(channel);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX idx_notifications_external_id ON notifications(external_id) WHERE external_id IS NOT NULL;

-- Composite index for common queries
CREATE INDEX idx_notifications_user_channel_sent ON notifications(user_id, channel, sent_at DESC);

-- Composite index for metrics queries
CREATE INDEX idx_notifications_channel_status_sent ON notifications(channel, status, sent_at);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 3. Push Tokens Table (stores Expo push tokens)
-- =============================================================================

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Expo push token
  push_token VARCHAR(255) NOT NULL,

  -- Device info
  device_type VARCHAR(20) CHECK (device_type IN ('ios', 'android')),
  device_id VARCHAR(255), -- Unique device identifier

  -- Token validation
  is_valid BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Prevent duplicate tokens
  UNIQUE(push_token)
);

-- Indexes
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_device_id ON push_tokens(device_id);
CREATE INDEX idx_push_tokens_is_valid ON push_tokens(is_valid) WHERE is_valid = true;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 4. SMS Rate Limiting Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS sms_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Window tracking
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,

  -- SMS count in this window
  sms_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Composite unique constraint (one window per user)
  UNIQUE(user_id, window_start)
);

-- Indexes
CREATE INDEX idx_sms_rate_limits_user_id ON sms_rate_limits(user_id);
CREATE INDEX idx_sms_rate_limits_window_end ON sms_rate_limits(window_end);

-- =============================================================================
-- 5. Useful Views for Analytics
-- =============================================================================

-- Delivery metrics view (last 24 hours)
CREATE OR REPLACE VIEW v_notification_metrics_24h AS
SELECT
  channel,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status = 'delivered' OR status = 'read') as total_delivered,
  COUNT(*) FILTER (WHERE status = 'failed') as total_failed,
  COUNT(*) FILTER (WHERE status = 'read') as total_read,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'delivered' OR status = 'read') /
    NULLIF(COUNT(*), 0),
    2
  ) as delivery_rate_pct,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (delivered_at - sent_at))) FILTER (WHERE delivered_at IS NOT NULL),
    2
  ) as avg_delivery_time_seconds
FROM notifications
WHERE sent_at >= NOW() - INTERVAL '24 hours'
GROUP BY channel;

-- Escalation analysis view (shows push→sms→email escalations)
CREATE OR REPLACE VIEW v_notification_escalations AS
SELECT
  n1.message_id,
  n1.user_id,
  COUNT(DISTINCT n1.channel) as channels_attempted,
  STRING_AGG(n1.channel::text, ' → ' ORDER BY n1.sent_at) as escalation_path,
  MIN(n1.sent_at) as first_attempt,
  MAX(n1.sent_at) as last_attempt,
  MAX(n1.delivered_at) as final_delivery,
  EXTRACT(EPOCH FROM (MAX(n1.delivered_at) - MIN(n1.sent_at))) as total_delivery_time_seconds
FROM notifications n1
GROUP BY n1.message_id, n1.user_id
HAVING COUNT(DISTINCT n1.channel) > 1;

-- SLA compliance view (% delivered within 5 minutes)
CREATE OR REPLACE VIEW v_sla_compliance AS
SELECT
  DATE(sent_at) as date,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (
    WHERE delivered_at IS NOT NULL
    AND EXTRACT(EPOCH FROM (delivered_at - sent_at)) <= 300
  ) as delivered_within_5min,
  ROUND(
    100.0 * COUNT(*) FILTER (
      WHERE delivered_at IS NOT NULL
      AND EXTRACT(EPOCH FROM (delivered_at - sent_at)) <= 300
    ) / NULLIF(COUNT(*), 0),
    2
  ) as sla_compliance_pct
FROM notifications
GROUP BY DATE(sent_at)
ORDER BY date DESC;

-- =============================================================================
-- 6. Cleanup Functions
-- =============================================================================

-- Clean up old notifications (retention: 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE sent_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Clean up invalid push tokens (not used in 30 days)
CREATE OR REPLACE FUNCTION cleanup_stale_push_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM push_tokens
  WHERE is_valid = false
  OR last_used_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Clean up old SMS rate limit windows
CREATE OR REPLACE FUNCTION cleanup_old_sms_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sms_rate_limits
  WHERE window_end < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 7. Sample Data (for testing)
-- =============================================================================

-- Insert default preferences for existing users
INSERT INTO user_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE user_preferences IS 'User notification preferences including channel toggles, quiet hours, and priority filters';
COMMENT ON TABLE notifications IS 'Notification delivery tracking across all channels (push, SMS, email)';
COMMENT ON TABLE push_tokens IS 'Expo push notification tokens for user devices';
COMMENT ON TABLE sms_rate_limits IS 'SMS rate limiting tracking (10 SMS per hour per user)';

COMMENT ON VIEW v_notification_metrics_24h IS 'Delivery metrics for the last 24 hours by channel';
COMMENT ON VIEW v_notification_escalations IS 'Analysis of notification escalation paths (push→sms→email)';
COMMENT ON VIEW v_sla_compliance IS 'Daily SLA compliance tracking (% delivered within 5 minutes)';
