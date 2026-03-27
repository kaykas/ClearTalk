-- Migration 001: Users Table
-- Creates the users table with parent relationship tracking

CREATE TYPE parent_relationship_enum AS ENUM ('parent_a', 'parent_b');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  parent_relationship parent_relationship_enum NOT NULL,
  phone_number TEXT,
  profile_photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_parent_relationship ON users(parent_relationship);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE users IS 'ClearTalk users - co-parents using the platform';
COMMENT ON COLUMN users.parent_relationship IS 'Identifies user as parent_a or parent_b in conversations';
COMMENT ON COLUMN users.is_active IS 'Soft delete flag - inactive users cannot send messages';
