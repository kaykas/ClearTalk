-- Migration 002: Conversations Table
-- Creates conversation threads between two parents

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT different_parents CHECK (parent_a_id != parent_b_id),
  CONSTRAINT one_conversation_per_pair UNIQUE (parent_a_id, parent_b_id)
);

-- Indexes
CREATE INDEX idx_conversations_parent_a ON conversations(parent_a_id);
CREATE INDEX idx_conversations_parent_b ON conversations(parent_b_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_conversations_is_archived ON conversations(is_archived);

-- Updated at trigger
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE conversations IS 'Conversation threads between two co-parents';
COMMENT ON COLUMN conversations.parent_a_id IS 'First parent in the conversation';
COMMENT ON COLUMN conversations.parent_b_id IS 'Second parent in the conversation';
COMMENT ON COLUMN conversations.is_archived IS 'Archived conversations are hidden from main view but remain accessible';
