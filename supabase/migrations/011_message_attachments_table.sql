-- Migration 011: Message Attachments Table
-- Handles file attachments to messages (photos, PDFs, etc.)

CREATE TYPE attachment_type_enum AS ENUM (
  'image',
  'pdf',
  'document',
  'video',
  'audio',
  'other'
);

CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,

  -- File information
  file_name TEXT NOT NULL,
  file_type attachment_type_enum NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  file_hash TEXT NOT NULL, -- SHA-256 hash for integrity

  -- Storage
  storage_url TEXT NOT NULL, -- Supabase Storage URL
  storage_bucket TEXT NOT NULL DEFAULT 'message-attachments',
  storage_path TEXT NOT NULL,

  -- Thumbnail (for images/videos)
  thumbnail_url TEXT,
  thumbnail_width INTEGER,
  thumbnail_height INTEGER,

  -- Original dimensions (for images/videos)
  original_width INTEGER,
  original_height INTEGER,
  duration_seconds INTEGER, -- For audio/video

  -- Security
  is_scanned BOOLEAN NOT NULL DEFAULT false,
  scan_result TEXT, -- 'clean', 'malware', 'suspicious'
  scanned_at TIMESTAMPTZ,

  -- Access control
  is_encrypted BOOLEAN NOT NULL DEFAULT false,
  encryption_key_id TEXT,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_file_hash CHECK (length(file_hash) = 64), -- SHA-256
  CONSTRAINT valid_scan_result CHECK (scan_result IS NULL OR scan_result IN ('clean', 'malware', 'suspicious'))
);

-- Indexes
CREATE INDEX idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX idx_message_attachments_file_type ON message_attachments(file_type);
CREATE INDEX idx_message_attachments_file_hash ON message_attachments(file_hash);
CREATE INDEX idx_message_attachments_is_scanned ON message_attachments(is_scanned);
CREATE INDEX idx_message_attachments_created_at ON message_attachments(created_at);

-- Function to compute file hash (to be called by application)
CREATE OR REPLACE FUNCTION verify_attachment_hash(
  p_attachment_id UUID,
  p_computed_hash TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT file_hash INTO stored_hash
  FROM message_attachments
  WHERE id = p_attachment_id;

  RETURN stored_hash = p_computed_hash;
END;
$$ LANGUAGE plpgsql;

-- View for unscanned attachments
CREATE VIEW unscanned_attachments AS
SELECT *
FROM message_attachments
WHERE is_scanned = false
  AND created_at > now() - INTERVAL '7 days';

-- Comments
COMMENT ON TABLE message_attachments IS 'File attachments for messages (images, PDFs, videos, etc.)';
COMMENT ON COLUMN message_attachments.file_hash IS 'SHA-256 hash for integrity verification';
COMMENT ON COLUMN message_attachments.storage_url IS 'Public URL to access file (time-limited signed URL)';
COMMENT ON COLUMN message_attachments.is_scanned IS 'True if file has been scanned for malware';
COMMENT ON COLUMN message_attachments.is_encrypted IS 'True if file is encrypted at rest';
