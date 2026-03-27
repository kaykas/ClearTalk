-- Migration 012: User Preferences Table
-- Stores user settings and preferences

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Notification preferences
  push_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_notifications_enabled BOOLEAN NOT NULL DEFAULT false,
  notification_quiet_hours_start TIME,
  notification_quiet_hours_end TIME,
  digest_frequency TEXT DEFAULT 'none', -- none, daily, weekly

  -- MessageShield preferences
  message_shield_enabled BOOLEAN NOT NULL DEFAULT true,
  message_shield_sensitivity INTEGER NOT NULL DEFAULT 5 CHECK (message_shield_sensitivity >= 1 AND message_shield_sensitivity <= 10),
  auto_filter_high_severity BOOLEAN NOT NULL DEFAULT true,
  show_filtered_content BOOLEAN NOT NULL DEFAULT false,

  -- BIFF preferences
  biff_analysis_enabled BOOLEAN NOT NULL DEFAULT true,
  show_biff_suggestions BOOLEAN NOT NULL DEFAULT true,
  min_biff_score_threshold INTEGER DEFAULT 60 CHECK (min_biff_score_threshold >= 0 AND min_biff_score_threshold <= 100),

  -- Pattern detection preferences
  pattern_detection_enabled BOOLEAN NOT NULL DEFAULT true,
  notify_on_pattern_detection BOOLEAN NOT NULL DEFAULT true,
  pattern_sensitivity INTEGER NOT NULL DEFAULT 5 CHECK (pattern_sensitivity >= 1 AND pattern_sensitivity <= 10),

  -- Gray rock preferences
  default_gray_rock_intensity INTEGER NOT NULL DEFAULT 5 CHECK (default_gray_rock_intensity >= 1 AND default_gray_rock_intensity <= 10),
  gray_rock_quick_toggle BOOLEAN NOT NULL DEFAULT true,

  -- Solo mode preferences
  solo_mode_auto_enable BOOLEAN NOT NULL DEFAULT false,
  solo_mode_inactivity_days INTEGER DEFAULT 7 CHECK (solo_mode_inactivity_days > 0),

  -- Privacy preferences
  share_analytics BOOLEAN NOT NULL DEFAULT true,
  share_anonymous_data BOOLEAN NOT NULL DEFAULT true,
  data_retention_days INTEGER NOT NULL DEFAULT 2555 CHECK (data_retention_days >= 365), -- 7 years default (legal requirement)

  -- Appearance preferences
  theme TEXT NOT NULL DEFAULT 'light', -- light, dark, auto
  font_size TEXT NOT NULL DEFAULT 'medium', -- small, medium, large
  high_contrast_mode BOOLEAN NOT NULL DEFAULT false,

  -- Accessibility preferences
  screen_reader_optimized BOOLEAN NOT NULL DEFAULT false,
  reduce_animations BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT one_preference_per_user UNIQUE (user_id),
  CONSTRAINT valid_quiet_hours CHECK (
    (notification_quiet_hours_start IS NULL AND notification_quiet_hours_end IS NULL) OR
    (notification_quiet_hours_start IS NOT NULL AND notification_quiet_hours_end IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Updated at trigger
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_default_preferences_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_preferences();

-- Comments
COMMENT ON TABLE user_preferences IS 'User settings and preferences';
COMMENT ON COLUMN user_preferences.message_shield_sensitivity IS 'How aggressively to filter manipulative content (1=permissive, 10=strict)';
COMMENT ON COLUMN user_preferences.notification_quiet_hours_start IS 'No notifications during quiet hours (e.g., 22:00)';
COMMENT ON COLUMN user_preferences.data_retention_days IS 'How long to keep messages (minimum 365 days, default 2555 for 7 years)';
COMMENT ON COLUMN user_preferences.digest_frequency IS 'Batch notifications into digests (none, daily, weekly)';
