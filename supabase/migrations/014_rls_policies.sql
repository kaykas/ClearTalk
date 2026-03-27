-- Migration 014: Row-Level Security Policies
-- Implements multi-tenant RLS for all tables

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE biff_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_shield_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gray_rock_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE solo_mode_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY users_select_own
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY users_update_own
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- System can create users (handled by auth triggers)
CREATE POLICY users_insert_system
  ON users FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- CONVERSATIONS TABLE POLICIES
-- ============================================================================

-- Users can view conversations they're part of
CREATE POLICY conversations_select_participants
  ON conversations FOR SELECT
  USING (
    auth.uid() = parent_a_id OR
    auth.uid() = parent_b_id OR
    -- Professional access
    EXISTS (
      SELECT 1 FROM professional_access pa
      WHERE pa.conversation_id = conversations.id
        AND pa.professional_email = (SELECT email FROM users WHERE id = auth.uid())
        AND pa.is_active = true
        AND pa.revoked_at IS NULL
        AND (pa.expires_at IS NULL OR pa.expires_at > now())
    )
  );

-- Users can create conversations (with themselves as a participant)
CREATE POLICY conversations_insert_participant
  ON conversations FOR INSERT
  WITH CHECK (
    auth.uid() = parent_a_id OR
    auth.uid() = parent_b_id
  );

-- Users can update conversations they're part of
CREATE POLICY conversations_update_participants
  ON conversations FOR UPDATE
  USING (
    auth.uid() = parent_a_id OR
    auth.uid() = parent_b_id
  )
  WITH CHECK (
    auth.uid() = parent_a_id OR
    auth.uid() = parent_b_id
  );

-- ============================================================================
-- MESSAGES TABLE POLICIES
-- ============================================================================

-- Users can view messages in their conversations
CREATE POLICY messages_select_conversation_participants
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.parent_a_id = auth.uid() OR
          c.parent_b_id = auth.uid() OR
          -- Professional access
          EXISTS (
            SELECT 1 FROM professional_access pa
            WHERE pa.conversation_id = c.id
              AND pa.professional_email = (SELECT email FROM users WHERE id = auth.uid())
              AND pa.is_active = true
              AND pa.revoked_at IS NULL
              AND (pa.expires_at IS NULL OR pa.expires_at > now())
          )
        )
    )
  );

-- Users can insert messages in their conversations (as themselves)
CREATE POLICY messages_insert_own
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.parent_a_id = auth.uid() OR c.parent_b_id = auth.uid())
    )
  );

-- Users can update their own messages (status updates only, enforced by trigger)
CREATE POLICY messages_update_own
  ON messages FOR UPDATE
  USING (
    auth.uid() = sender_id OR
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.parent_a_id = auth.uid() OR c.parent_b_id = auth.uid())
    )
  )
  WITH CHECK (
    auth.uid() = sender_id OR
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.parent_a_id = auth.uid() OR c.parent_b_id = auth.uid())
    )
  );

-- ============================================================================
-- BIFF_SCORES TABLE POLICIES
-- ============================================================================

-- Users can view BIFF scores for messages they can see
CREATE POLICY biff_scores_select_message_access
  ON biff_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE m.id = biff_scores.message_id
        AND (c.parent_a_id = auth.uid() OR c.parent_b_id = auth.uid())
    )
  );

-- System can insert BIFF scores
CREATE POLICY biff_scores_insert_system
  ON biff_scores FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- MESSAGE_SHIELD_LOGS TABLE POLICIES
-- ============================================================================

-- Users can view shield logs for their messages
CREATE POLICY shield_logs_select_own_messages
  ON message_shield_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE m.id = message_shield_logs.message_id
        AND (c.parent_a_id = auth.uid() OR c.parent_b_id = auth.uid())
    )
  );

-- System can insert shield logs
CREATE POLICY shield_logs_insert_system
  ON message_shield_logs FOR INSERT
  WITH CHECK (true);

-- Users can update their own shield logs (for overrides)
CREATE POLICY shield_logs_update_own
  ON message_shield_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_shield_logs.message_id
        AND m.sender_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_shield_logs.message_id
        AND m.sender_id = auth.uid()
    )
  );

-- ============================================================================
-- GRAY_ROCK_SESSIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own gray rock sessions
CREATE POLICY gray_rock_select_own
  ON gray_rock_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own gray rock sessions
CREATE POLICY gray_rock_insert_own
  ON gray_rock_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own gray rock sessions
CREATE POLICY gray_rock_update_own
  ON gray_rock_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SOLO_MODE_CONFIG TABLE POLICIES
-- ============================================================================

-- Users can view their own solo mode config
CREATE POLICY solo_mode_select_own
  ON solo_mode_config FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own solo mode config
CREATE POLICY solo_mode_insert_own
  ON solo_mode_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own solo mode config
CREATE POLICY solo_mode_update_own
  ON solo_mode_config FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PROFESSIONAL_ACCESS TABLE POLICIES
-- ============================================================================

-- Users can view professional access grants for their conversations
CREATE POLICY professional_access_select_conversation_participants
  ON professional_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = professional_access.conversation_id
        AND (c.parent_a_id = auth.uid() OR c.parent_b_id = auth.uid())
    )
  );

-- Professionals can view their own access grants
CREATE POLICY professional_access_select_professional
  ON professional_access FOR SELECT
  USING (
    professional_email = (SELECT email FROM users WHERE id = auth.uid())
  );

-- Users can grant professional access to their conversations
CREATE POLICY professional_access_insert_own_conversation
  ON professional_access FOR INSERT
  WITH CHECK (
    auth.uid() = granted_by AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = professional_access.conversation_id
        AND (c.parent_a_id = auth.uid() OR c.parent_b_id = auth.uid())
    )
  );

-- Users can revoke professional access they granted
CREATE POLICY professional_access_update_own_grants
  ON professional_access FOR UPDATE
  USING (auth.uid() = granted_by)
  WITH CHECK (auth.uid() = granted_by OR auth.uid() = revoked_by);

-- ============================================================================
-- PATTERN_DETECTIONS TABLE POLICIES
-- ============================================================================

-- Users can view pattern detections in their conversations
CREATE POLICY pattern_detections_select_conversation_participants
  ON pattern_detections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = pattern_detections.conversation_id
        AND (c.parent_a_id = auth.uid() OR c.parent_b_id = auth.uid())
    )
  );

-- System can insert pattern detections
CREATE POLICY pattern_detections_insert_system
  ON pattern_detections FOR INSERT
  WITH CHECK (true);

-- Users can update notification status
CREATE POLICY pattern_detections_update_notification_status
  ON pattern_detections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = pattern_detections.conversation_id
        AND (c.parent_a_id = auth.uid() OR c.parent_b_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = pattern_detections.conversation_id
        AND (c.parent_a_id = auth.uid() OR c.parent_b_id = auth.uid())
    )
  );

-- ============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own notifications
CREATE POLICY notifications_select_own
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY notifications_insert_system
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read, etc.)
CREATE POLICY notifications_update_own
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- MESSAGE_ATTACHMENTS TABLE POLICIES
-- ============================================================================

-- Users can view attachments for messages they can see
CREATE POLICY attachments_select_message_access
  ON message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE m.id = message_attachments.message_id
        AND (
          c.parent_a_id = auth.uid() OR
          c.parent_b_id = auth.uid() OR
          -- Professional access
          EXISTS (
            SELECT 1 FROM professional_access pa
            WHERE pa.conversation_id = c.id
              AND pa.professional_email = (SELECT email FROM users WHERE id = auth.uid())
              AND pa.is_active = true
              AND pa.revoked_at IS NULL
              AND (pa.expires_at IS NULL OR pa.expires_at > now())
          )
        )
    )
  );

-- Users can insert attachments for their messages
CREATE POLICY attachments_insert_own_messages
  ON message_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_attachments.message_id
        AND m.sender_id = auth.uid()
    )
  );

-- ============================================================================
-- USER_PREFERENCES TABLE POLICIES
-- ============================================================================

-- Users can view their own preferences
CREATE POLICY preferences_select_own
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert preferences (on user creation)
CREATE POLICY preferences_insert_system
  ON user_preferences FOR INSERT
  WITH CHECK (true);

-- Users can update their own preferences
CREATE POLICY preferences_update_own
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- AUDIT_LOG TABLE POLICIES
-- ============================================================================

-- Users can view audit logs for their own actions
CREATE POLICY audit_log_select_own_actions
  ON audit_log FOR SELECT
  USING (auth.uid() = actor_id);

-- Users can view audit logs for conversations they're part of
CREATE POLICY audit_log_select_conversation_participants
  ON audit_log FOR SELECT
  USING (
    conversation_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = audit_log.conversation_id
        AND (c.parent_a_id = auth.uid() OR c.parent_b_id = auth.uid())
    )
  );

-- Professionals can view audit logs for conversations they have access to
CREATE POLICY audit_log_select_professional_access
  ON audit_log FOR SELECT
  USING (
    conversation_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM professional_access pa
      WHERE pa.conversation_id = audit_log.conversation_id
        AND pa.professional_email = (SELECT email FROM users WHERE id = auth.uid())
        AND pa.is_active = true
        AND pa.revoked_at IS NULL
        AND (pa.expires_at IS NULL OR pa.expires_at > now())
    )
  );

-- System can insert audit logs
CREATE POLICY audit_log_insert_system
  ON audit_log FOR INSERT
  WITH CHECK (true);

-- Only legal_hold and retention_override_until can be updated (enforced by trigger)
CREATE POLICY audit_log_update_legal_hold
  ON audit_log FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- No deletions allowed (enforced by trigger)

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY users_select_own ON users IS 'Users can view their own profile';
COMMENT ON POLICY conversations_select_participants ON conversations IS 'Users can view conversations they are part of or professionals with access can view';
COMMENT ON POLICY messages_select_conversation_participants ON messages IS 'Users can view messages in their conversations';
COMMENT ON POLICY audit_log_insert_system ON audit_log IS 'System can append to audit log (no deletions allowed)';
