-- Migration 008: Professional Access Table
-- Grants attorneys/mediators read-only access to conversations

CREATE TYPE professional_role_enum AS ENUM ('attorney', 'mediator', 'therapist', 'guardian_ad_litem', 'other');
CREATE TYPE access_level_enum AS ENUM ('read_only', 'full_history', 'metadata_only');

CREATE TABLE professional_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Professional information
  professional_email TEXT NOT NULL,
  professional_name TEXT NOT NULL,
  professional_role professional_role_enum NOT NULL,
  bar_number TEXT, -- For attorneys
  license_number TEXT, -- For therapists/mediators

  -- Access grant
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_level access_level_enum NOT NULL DEFAULT 'read_only',

  -- Access control
  is_active BOOLEAN NOT NULL DEFAULT true,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES users(id),
  revocation_reason TEXT,

  -- Usage tracking
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER NOT NULL DEFAULT 0,

  -- Legal documentation
  authorization_document_url TEXT, -- Link to signed authorization form
  consent_recorded BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_expiration CHECK (expires_at IS NULL OR expires_at > granted_at),
  CONSTRAINT valid_revocation CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);

-- Indexes
CREATE INDEX idx_professional_access_conversation_id ON professional_access(conversation_id);
CREATE INDEX idx_professional_access_professional_email ON professional_access(professional_email);
CREATE INDEX idx_professional_access_granted_by ON professional_access(granted_by);
CREATE INDEX idx_professional_access_is_active ON professional_access(is_active);
CREATE INDEX idx_professional_access_expires_at ON professional_access(expires_at);

-- Updated at trigger
CREATE TRIGGER update_professional_access_updated_at
  BEFORE UPDATE ON professional_access
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to track access
CREATE OR REPLACE FUNCTION track_professional_access()
RETURNS void AS $$
BEGIN
  -- This would be called by the application when a professional views a conversation
  -- Update last_accessed_at and increment access_count
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to check if access is valid
CREATE OR REPLACE FUNCTION is_professional_access_valid(p_access_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  access_record professional_access%ROWTYPE;
BEGIN
  SELECT * INTO access_record
  FROM professional_access
  WHERE id = p_access_id;

  RETURN access_record.is_active = true
    AND access_record.revoked_at IS NULL
    AND (access_record.expires_at IS NULL OR access_record.expires_at > now());
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE professional_access IS 'Grants legal professionals read-only access to conversations';
COMMENT ON COLUMN professional_access.access_level IS 'read_only=messages only, full_history=includes deleted, metadata_only=timestamps/participants';
COMMENT ON COLUMN professional_access.authorization_document_url IS 'Link to signed consent form (required for legal compliance)';
COMMENT ON COLUMN professional_access.consent_recorded IS 'Both parents must consent before access is granted';
