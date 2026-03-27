-- Migration 005: Message Shield Logs Table
-- Logs all MessageShield filtering actions

CREATE TYPE manipulation_type_enum AS ENUM (
  'gaslighting',
  'guilt_trip',
  'passive_aggressive',
  'blame_shifting',
  'DARVO',
  'urgency_manipulation',
  'boundary_testing',
  'triangulation',
  'love_bombing',
  'silent_treatment',
  'emotional_blackmail',
  'playing_victim'
);

CREATE TYPE severity_enum AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE message_shield_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,

  -- Content comparison
  original_content TEXT NOT NULL,
  filtered_content TEXT NOT NULL,
  content_was_modified BOOLEAN NOT NULL DEFAULT false,

  -- Detection results
  manipulation_types manipulation_type_enum[] NOT NULL DEFAULT '{}',
  severity severity_enum NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Detailed analysis
  detected_patterns JSONB, -- Specific patterns/phrases that triggered filtering
  filter_actions JSONB, -- What actions were taken (redaction, softening, blocking, etc.)

  -- User interaction
  user_override BOOLEAN NOT NULL DEFAULT false,
  user_override_reason TEXT,
  user_viewed_original BOOLEAN NOT NULL DEFAULT false,

  -- Model metadata
  model_version TEXT NOT NULL,
  processing_duration_ms INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT one_log_per_message UNIQUE (message_id)
);

-- Indexes
CREATE INDEX idx_shield_logs_message_id ON message_shield_logs(message_id);
CREATE INDEX idx_shield_logs_severity ON message_shield_logs(severity);
CREATE INDEX idx_shield_logs_manipulation_types ON message_shield_logs USING GIN (manipulation_types);
CREATE INDEX idx_shield_logs_created_at ON message_shield_logs(created_at);

-- Comments
COMMENT ON TABLE message_shield_logs IS 'MessageShield filtering logs for transparency and appeals';
COMMENT ON COLUMN message_shield_logs.manipulation_types IS 'Array of detected manipulation patterns';
COMMENT ON COLUMN message_shield_logs.severity IS 'Overall severity of manipulation detected';
COMMENT ON COLUMN message_shield_logs.confidence_score IS 'AI confidence in detection (0.0-1.0)';
COMMENT ON COLUMN message_shield_logs.user_override IS 'True if user chose to send original message anyway';
