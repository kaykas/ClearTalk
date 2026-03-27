-- Migration 006: Gray Rock Sessions Table
-- Tracks when users enable gray rock mode

CREATE TABLE gray_rock_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Session timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Configuration
  intensity_level INTEGER NOT NULL DEFAULT 5 CHECK (intensity_level >= 1 AND intensity_level <= 10),
  auto_disable_after_hours INTEGER,

  -- Usage metrics
  messages_processed INTEGER NOT NULL DEFAULT 0,
  total_transformations INTEGER NOT NULL DEFAULT 0,

  -- User satisfaction
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_session_duration CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- Indexes
CREATE INDEX idx_gray_rock_sessions_user_id ON gray_rock_sessions(user_id);
CREATE INDEX idx_gray_rock_sessions_conversation_id ON gray_rock_sessions(conversation_id);
CREATE INDEX idx_gray_rock_sessions_is_active ON gray_rock_sessions(is_active);
CREATE INDEX idx_gray_rock_sessions_started_at ON gray_rock_sessions(started_at);

-- Updated at trigger
CREATE TRIGGER update_gray_rock_sessions_updated_at
  BEFORE UPDATE ON gray_rock_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to end active sessions
CREATE OR REPLACE FUNCTION end_gray_rock_session()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = false AND OLD.is_active = true THEN
    NEW.ended_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER end_gray_rock_session_trigger
  BEFORE UPDATE ON gray_rock_sessions
  FOR EACH ROW
  EXECUTE FUNCTION end_gray_rock_session();

-- Comments
COMMENT ON TABLE gray_rock_sessions IS 'Gray rock mode sessions - AI transforms responses to be emotionally neutral';
COMMENT ON COLUMN gray_rock_sessions.intensity_level IS 'How neutral to make responses (1=subtle, 10=maximum gray rock)';
COMMENT ON COLUMN gray_rock_sessions.messages_processed IS 'Count of messages sent during this session';
COMMENT ON COLUMN gray_rock_sessions.total_transformations IS 'Count of AI transformations applied';
