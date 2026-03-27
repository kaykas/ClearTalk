-- Migration 010: Notifications Table
-- Tracks all notifications sent to users

CREATE TYPE notification_type_enum AS ENUM (
  'new_message',
  'message_shielded',
  'pattern_detected',
  'biff_score_low',
  'professional_access_granted',
  'professional_access_revoked',
  'solo_mode_response',
  'gray_rock_enabled',
  'system_alert'
);

CREATE TYPE notification_channel_enum AS ENUM ('push', 'email', 'sms', 'in_app');
CREATE TYPE notification_priority_enum AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Notification content
  notification_type notification_type_enum NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT, -- Deep link into the app

  -- Related entities
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  pattern_detection_id UUID REFERENCES pattern_detections(id) ON DELETE CASCADE,

  -- Delivery configuration
  channels notification_channel_enum[] NOT NULL DEFAULT '{}',
  priority notification_priority_enum NOT NULL DEFAULT 'normal',

  -- Delivery status
  is_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ,
  delivery_attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  delivery_error TEXT,

  -- User interaction
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  action_taken BOOLEAN NOT NULL DEFAULT false,
  action_taken_at TIMESTAMPTZ,

  -- Scheduling
  scheduled_for TIMESTAMPTZ, -- For delayed notifications
  expires_at TIMESTAMPTZ, -- Notification becomes irrelevant after this time

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_send_timing CHECK (sent_at IS NULL OR sent_at >= created_at),
  CONSTRAINT valid_read_timing CHECK (read_at IS NULL OR read_at >= sent_at),
  CONSTRAINT valid_scheduling CHECK (scheduled_for IS NULL OR scheduled_for >= created_at)
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_conversation_id ON notifications(conversation_id);
CREATE INDEX idx_notifications_message_id ON notifications(message_id);
CREATE INDEX idx_notifications_notification_type ON notifications(notification_type);
CREATE INDEX idx_notifications_is_sent ON notifications(is_sent);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Updated at trigger
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to mark notification as sent
CREATE OR REPLACE FUNCTION mark_notification_sent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_sent = true AND OLD.is_sent = false THEN
    NEW.sent_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mark_notification_sent_trigger
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION mark_notification_sent();

-- View for unsent notifications ready to send
CREATE VIEW notifications_ready_to_send AS
SELECT *
FROM notifications
WHERE is_sent = false
  AND (scheduled_for IS NULL OR scheduled_for <= now())
  AND (expires_at IS NULL OR expires_at > now())
  AND delivery_attempts < 5;

-- Comments
COMMENT ON TABLE notifications IS 'User notifications across all channels (push, email, SMS, in-app)';
COMMENT ON COLUMN notifications.channels IS 'Array of channels to send notification through';
COMMENT ON COLUMN notifications.action_url IS 'Deep link to relevant content in the app';
COMMENT ON COLUMN notifications.scheduled_for IS 'Delay notification until this time (for digest/batching)';
COMMENT ON COLUMN notifications.expires_at IS 'Don''t send if current time exceeds this (time-sensitive notifications)';
