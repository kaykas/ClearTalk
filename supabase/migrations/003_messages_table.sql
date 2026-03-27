-- Migration 003: Messages Table
-- Creates messages with hash chain integrity and immutability

CREATE TYPE message_type_enum AS ENUM ('regular', 'system', 'gray_rock', 'solo_bridged');
CREATE TYPE message_status_enum AS ENUM ('draft', 'pending', 'sent', 'delivered', 'read', 'failed');

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Message content
  content TEXT NOT NULL,
  original_content TEXT, -- Content before any AI modifications (gray rock, etc.)
  message_type message_type_enum NOT NULL DEFAULT 'regular',

  -- Hash chain for integrity
  message_hash TEXT NOT NULL,
  previous_hash TEXT,

  -- BIFF analysis
  biff_score_id UUID, -- Foreign key added after biff_scores table is created

  -- Message shield
  is_shielded BOOLEAN NOT NULL DEFAULT false,
  shield_reason TEXT,

  -- Status tracking
  status message_status_enum NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  -- Metadata
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edit_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0),
  CONSTRAINT sent_after_created CHECK (sent_at IS NULL OR sent_at >= created_at),
  CONSTRAINT delivered_after_sent CHECK (delivered_at IS NULL OR delivered_at >= sent_at),
  CONSTRAINT read_after_delivered CHECK (read_at IS NULL OR read_at >= delivered_at),
  CONSTRAINT valid_message_hash CHECK (length(message_hash) = 64) -- SHA-256 produces 64 hex characters
);

-- Function to compute message hash (SHA-256)
CREATE OR REPLACE FUNCTION compute_message_hash(
  p_message_id UUID,
  p_conversation_id UUID,
  p_sender_id UUID,
  p_content TEXT,
  p_previous_hash TEXT,
  p_created_at TIMESTAMPTZ
)
RETURNS TEXT AS $$
DECLARE
  hash_input TEXT;
BEGIN
  hash_input := p_message_id::TEXT || '|' ||
                p_conversation_id::TEXT || '|' ||
                p_sender_id::TEXT || '|' ||
                p_content || '|' ||
                COALESCE(p_previous_hash, '') || '|' ||
                p_created_at::TEXT;

  RETURN encode(digest(hash_input, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to compute hash on insert
CREATE OR REPLACE FUNCTION set_message_hash()
RETURNS TRIGGER AS $$
DECLARE
  prev_hash TEXT;
BEGIN
  -- Get the hash of the most recent message in this conversation
  SELECT message_hash INTO prev_hash
  FROM messages
  WHERE conversation_id = NEW.conversation_id
    AND created_at < NEW.created_at
  ORDER BY created_at DESC
  LIMIT 1;

  -- Set previous_hash
  NEW.previous_hash := prev_hash;

  -- Compute and set message_hash
  NEW.message_hash := compute_message_hash(
    NEW.id,
    NEW.conversation_id,
    NEW.sender_id,
    NEW.content,
    NEW.previous_hash,
    NEW.created_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compute_message_hash_trigger
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION set_message_hash();

-- Prevent updates to immutable fields
CREATE OR REPLACE FUNCTION prevent_message_tampering()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow only specific fields to be updated
  IF OLD.id != NEW.id OR
     OLD.conversation_id != NEW.conversation_id OR
     OLD.sender_id != NEW.sender_id OR
     OLD.content != NEW.content OR
     OLD.message_hash != NEW.message_hash OR
     OLD.previous_hash IS DISTINCT FROM NEW.previous_hash OR
     OLD.created_at != NEW.created_at THEN
    RAISE EXCEPTION 'Cannot modify immutable message fields';
  END IF;

  -- Track edits
  IF OLD.status != NEW.status OR
     OLD.sent_at IS DISTINCT FROM NEW.sent_at OR
     OLD.delivered_at IS DISTINCT FROM NEW.delivered_at OR
     OLD.read_at IS DISTINCT FROM NEW.read_at THEN
    NEW.is_edited := true;
    NEW.edit_count := OLD.edit_count + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_message_tampering_trigger
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION prevent_message_tampering();

-- Indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_message_hash ON messages(message_hash);
CREATE INDEX idx_messages_previous_hash ON messages(previous_hash);

-- Updated at trigger
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE messages IS 'Messages with hash chain integrity - immutable once sent';
COMMENT ON COLUMN messages.message_hash IS 'SHA-256 hash of message data for integrity verification';
COMMENT ON COLUMN messages.previous_hash IS 'Hash of previous message in conversation (creates chain)';
COMMENT ON COLUMN messages.is_shielded IS 'True if MessageShield filtered this message';
COMMENT ON COLUMN messages.original_content IS 'Original content before AI modifications (gray rock mode, etc.)';
