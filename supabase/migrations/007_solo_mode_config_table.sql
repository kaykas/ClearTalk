-- Migration 007: Solo Mode Configuration Table
-- Stores solo mode settings for users who don't have a responsive co-parent

CREATE TABLE solo_mode_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Solo mode status
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  enabled_at TIMESTAMPTZ,
  enabled_reason TEXT,

  -- AI agent configuration
  simulated_response_enabled BOOLEAN NOT NULL DEFAULT true,
  response_style TEXT NOT NULL DEFAULT 'neutral', -- neutral, cooperative, minimal
  response_delay_minutes INTEGER NOT NULL DEFAULT 30 CHECK (response_delay_minutes >= 0),

  -- Auto-send to other parent
  auto_forward_enabled BOOLEAN NOT NULL DEFAULT true,
  forward_delay_hours INTEGER NOT NULL DEFAULT 24 CHECK (forward_delay_hours >= 0),

  -- Documentation generation
  generate_conversation_log BOOLEAN NOT NULL DEFAULT true,
  log_format TEXT NOT NULL DEFAULT 'pdf', -- pdf, docx, html

  -- Notification settings
  notify_on_ai_response BOOLEAN NOT NULL DEFAULT true,
  notify_on_actual_response BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT one_config_per_conversation UNIQUE (user_id, conversation_id)
);

-- Indexes
CREATE INDEX idx_solo_mode_user_id ON solo_mode_config(user_id);
CREATE INDEX idx_solo_mode_conversation_id ON solo_mode_config(conversation_id);
CREATE INDEX idx_solo_mode_is_enabled ON solo_mode_config(is_enabled);

-- Updated at trigger
CREATE TRIGGER update_solo_mode_config_updated_at
  BEFORE UPDATE ON solo_mode_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to track when solo mode is enabled
CREATE OR REPLACE FUNCTION track_solo_mode_enablement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_enabled = true AND OLD.is_enabled = false THEN
    NEW.enabled_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_solo_mode_enablement_trigger
  BEFORE UPDATE ON solo_mode_config
  FOR EACH ROW
  EXECUTE FUNCTION track_solo_mode_enablement();

-- Comments
COMMENT ON TABLE solo_mode_config IS 'Solo mode configuration - allows single parent to continue documenting communication';
COMMENT ON COLUMN solo_mode_config.simulated_response_enabled IS 'If true, AI generates reasonable responses for the other parent';
COMMENT ON COLUMN solo_mode_config.response_style IS 'Tone of AI-generated responses (neutral, cooperative, minimal)';
COMMENT ON COLUMN solo_mode_config.auto_forward_enabled IS 'If true, messages are automatically sent to other parent after delay';
COMMENT ON COLUMN solo_mode_config.generate_conversation_log IS 'If true, creates timestamped PDF/DOCX logs for court';
