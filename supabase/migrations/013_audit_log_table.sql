-- Migration 013: Audit Log Table
-- Comprehensive audit trail for all system actions

CREATE TYPE audit_action_enum AS ENUM (
  'user_created',
  'user_updated',
  'user_deleted',
  'conversation_created',
  'conversation_archived',
  'message_sent',
  'message_read',
  'message_shielded',
  'pattern_detected',
  'professional_access_granted',
  'professional_access_revoked',
  'gray_rock_enabled',
  'gray_rock_disabled',
  'solo_mode_enabled',
  'solo_mode_disabled',
  'preferences_updated',
  'attachment_uploaded',
  'attachment_deleted',
  'notification_sent',
  'login',
  'logout',
  'password_changed',
  'export_requested',
  'data_deleted'
);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Action information
  action audit_action_enum NOT NULL,
  action_description TEXT,

  -- Actor (who performed the action)
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email TEXT,
  actor_ip_address INET,
  actor_user_agent TEXT,

  -- Target (what was affected)
  target_id UUID,
  target_type TEXT, -- 'user', 'conversation', 'message', etc.

  -- Context
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,

  -- Changes (before/after for updates)
  old_values JSONB,
  new_values JSONB,

  -- Request metadata
  request_id UUID,
  session_id TEXT,

  -- Legal/compliance
  legal_hold BOOLEAN NOT NULL DEFAULT false,
  retention_override_until TIMESTAMPTZ, -- Keep this record longer than usual

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_target_reference CHECK (
    (target_id IS NULL) OR
    (target_type IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_target_id ON audit_log(target_id);
CREATE INDEX idx_audit_log_target_type ON audit_log(target_type);
CREATE INDEX idx_audit_log_conversation_id ON audit_log(conversation_id);
CREATE INDEX idx_audit_log_message_id ON audit_log(message_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_legal_hold ON audit_log(legal_hold);

-- Prevent deletion of audit logs (append-only table)
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Cannot delete audit log entries';
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only allow updating legal_hold and retention_override_until
    IF OLD.id != NEW.id OR
       OLD.action != NEW.action OR
       OLD.actor_id IS DISTINCT FROM NEW.actor_id OR
       OLD.target_id IS DISTINCT FROM NEW.target_id OR
       OLD.created_at != NEW.created_at THEN
      RAISE EXCEPTION 'Cannot modify audit log entries (except legal_hold and retention_override_until)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_log_modification_trigger
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();

-- Function to log user actions
CREATE OR REPLACE FUNCTION log_user_action(
  p_action audit_action_enum,
  p_actor_id UUID,
  p_target_id UUID DEFAULT NULL,
  p_target_type TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO audit_log (
    action,
    action_description,
    actor_id,
    target_id,
    target_type,
    old_values,
    new_values
  ) VALUES (
    p_action,
    p_description,
    p_actor_id,
    p_target_id,
    p_target_type,
    p_old_values,
    p_new_values
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Auto-audit triggers for critical tables

-- Audit message sends
CREATE OR REPLACE FUNCTION audit_message_sent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sent_at IS NOT NULL AND OLD.sent_at IS NULL THEN
    INSERT INTO audit_log (
      action,
      actor_id,
      target_id,
      target_type,
      conversation_id,
      message_id
    ) VALUES (
      'message_sent',
      NEW.sender_id,
      NEW.id,
      'message',
      NEW.conversation_id,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_message_sent_trigger
  AFTER UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION audit_message_sent();

-- Audit professional access grants
CREATE OR REPLACE FUNCTION audit_professional_access()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (
      action,
      actor_id,
      target_id,
      target_type,
      conversation_id,
      new_values
    ) VALUES (
      'professional_access_granted',
      NEW.granted_by,
      NEW.id,
      'professional_access',
      NEW.conversation_id,
      jsonb_build_object(
        'professional_email', NEW.professional_email,
        'access_level', NEW.access_level
      )
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.revoked_at IS NOT NULL AND OLD.revoked_at IS NULL THEN
    INSERT INTO audit_log (
      action,
      actor_id,
      target_id,
      target_type,
      conversation_id,
      new_values
    ) VALUES (
      'professional_access_revoked',
      NEW.revoked_by,
      NEW.id,
      'professional_access',
      NEW.conversation_id,
      jsonb_build_object(
        'professional_email', NEW.professional_email,
        'revocation_reason', NEW.revocation_reason
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_professional_access_trigger
  AFTER INSERT OR UPDATE ON professional_access
  FOR EACH ROW
  EXECUTE FUNCTION audit_professional_access();

-- View for recent audit activity
CREATE VIEW recent_audit_activity AS
SELECT
  al.id,
  al.action,
  al.action_description,
  u.full_name as actor_name,
  u.email as actor_email,
  al.target_type,
  al.created_at
FROM audit_log al
LEFT JOIN users u ON al.actor_id = u.id
WHERE al.created_at > now() - INTERVAL '30 days'
ORDER BY al.created_at DESC;

-- Comments
COMMENT ON TABLE audit_log IS 'Append-only audit trail for all system actions (cannot be deleted)';
COMMENT ON COLUMN audit_log.legal_hold IS 'If true, this record must be preserved indefinitely';
COMMENT ON COLUMN audit_log.retention_override_until IS 'Keep this record until this date (overrides default retention)';
COMMENT ON COLUMN audit_log.actor_ip_address IS 'IP address of actor (for security auditing)';
COMMENT ON COLUMN audit_log.request_id IS 'Unique request ID for tracing across services';
