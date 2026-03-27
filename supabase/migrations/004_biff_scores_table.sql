-- Migration 004: BIFF Scores Table
-- Stores BIFF analysis results for messages

CREATE TABLE biff_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,

  -- BIFF component scores (0-100)
  brief_score INTEGER NOT NULL CHECK (brief_score >= 0 AND brief_score <= 100),
  informative_score INTEGER NOT NULL CHECK (informative_score >= 0 AND informative_score <= 100),
  friendly_score INTEGER NOT NULL CHECK (friendly_score >= 0 AND friendly_score <= 100),
  firm_score INTEGER NOT NULL CHECK (firm_score >= 0 AND firm_score <= 100),

  -- Overall BIFF score (0-100)
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),

  -- AI suggestions for improvement
  suggestions JSONB,

  -- Detailed analysis
  analysis_details JSONB,

  -- Model metadata
  model_version TEXT NOT NULL,
  analysis_duration_ms INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT one_score_per_message UNIQUE (message_id)
);

-- Add foreign key to messages table
ALTER TABLE messages
  ADD CONSTRAINT fk_messages_biff_score
  FOREIGN KEY (biff_score_id)
  REFERENCES biff_scores(id)
  ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_biff_scores_message_id ON biff_scores(message_id);
CREATE INDEX idx_biff_scores_overall_score ON biff_scores(overall_score);
CREATE INDEX idx_biff_scores_created_at ON biff_scores(created_at);

-- Comments
COMMENT ON TABLE biff_scores IS 'BIFF (Brief, Informative, Friendly, Firm) analysis results';
COMMENT ON COLUMN biff_scores.overall_score IS 'Weighted average of BIFF components';
COMMENT ON COLUMN biff_scores.suggestions IS 'AI-generated suggestions to improve BIFF score';
COMMENT ON COLUMN biff_scores.analysis_details IS 'Detailed breakdown of what affected each score';
