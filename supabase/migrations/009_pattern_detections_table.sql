-- Migration 009: Pattern Detections Table
-- Logs detected manipulation patterns across conversations

CREATE TYPE pattern_type_enum AS ENUM (
  'DARVO', -- Deny, Attack, Reverse Victim and Offender
  'gaslighting',
  'urgency_manipulation',
  'boundary_testing',
  'triangulation',
  'love_bombing',
  'silent_treatment',
  'guilt_trip',
  'playing_victim',
  'blame_shifting',
  'emotional_blackmail',
  'information_control',
  'isolation_attempts',
  'financial_manipulation'
);

CREATE TABLE pattern_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL, -- Can be null for multi-message patterns

  -- Pattern information
  pattern_type pattern_type_enum NOT NULL,
  severity severity_enum NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Detection details
  evidence JSONB NOT NULL, -- Specific messages, phrases, or behaviors that triggered detection
  context JSONB, -- Surrounding conversation context
  timeline JSONB, -- For patterns that span multiple messages

  -- Frequency tracking
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  previous_detections INTEGER NOT NULL DEFAULT 0,
  first_detected_at TIMESTAMPTZ,

  -- User notification
  user_notified BOOLEAN NOT NULL DEFAULT false,
  notified_at TIMESTAMPTZ,
  notification_acknowledged BOOLEAN NOT NULL DEFAULT false,

  -- Educational resources
  resource_links JSONB, -- Links to articles/resources about this pattern
  coping_strategies JSONB, -- Suggested strategies for responding

  -- Model metadata
  model_version TEXT NOT NULL,
  detection_duration_ms INTEGER,

  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT evidence_required CHECK (jsonb_typeof(evidence) = 'object' OR jsonb_typeof(evidence) = 'array')
);

-- Indexes
CREATE INDEX idx_pattern_detections_conversation_id ON pattern_detections(conversation_id);
CREATE INDEX idx_pattern_detections_message_id ON pattern_detections(message_id);
CREATE INDEX idx_pattern_detections_pattern_type ON pattern_detections(pattern_type);
CREATE INDEX idx_pattern_detections_severity ON pattern_detections(severity);
CREATE INDEX idx_pattern_detections_detected_at ON pattern_detections(detected_at);
CREATE INDEX idx_pattern_detections_is_recurring ON pattern_detections(is_recurring);

-- Function to track recurring patterns
CREATE OR REPLACE FUNCTION track_recurring_patterns()
RETURNS TRIGGER AS $$
DECLARE
  prev_count INTEGER;
  first_detection TIMESTAMPTZ;
BEGIN
  -- Count previous detections of this pattern type in this conversation
  SELECT COUNT(*), MIN(detected_at)
  INTO prev_count, first_detection
  FROM pattern_detections
  WHERE conversation_id = NEW.conversation_id
    AND pattern_type = NEW.pattern_type
    AND detected_at < NEW.detected_at;

  NEW.previous_detections := prev_count;
  NEW.first_detected_at := COALESCE(first_detection, NEW.detected_at);

  IF prev_count >= 2 THEN
    NEW.is_recurring := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_recurring_patterns_trigger
  BEFORE INSERT ON pattern_detections
  FOR EACH ROW
  EXECUTE FUNCTION track_recurring_patterns();

-- Comments
COMMENT ON TABLE pattern_detections IS 'AI-detected manipulation patterns in conversations';
COMMENT ON COLUMN pattern_detections.evidence IS 'JSON containing specific messages/phrases that triggered detection';
COMMENT ON COLUMN pattern_detections.timeline IS 'For multi-message patterns, shows pattern evolution over time';
COMMENT ON COLUMN pattern_detections.is_recurring IS 'True if pattern has been detected 3+ times in this conversation';
COMMENT ON COLUMN pattern_detections.resource_links IS 'Educational resources about recognizing/responding to this pattern';
