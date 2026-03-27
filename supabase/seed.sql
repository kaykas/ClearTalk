-- Seed Data for ClearTalk Development
-- Creates test users, conversations, and sample messages

-- Note: In production, users are created via Supabase Auth
-- This seed data is for development/testing only

-- Create test users
INSERT INTO users (id, email, full_name, parent_relationship, phone_number) VALUES
  ('00000000-0000-0000-0000-000000000001', 'parent.a@example.com', 'Alex Johnson', 'parent_a', '+1-555-0101'),
  ('00000000-0000-0000-0000-000000000002', 'parent.b@example.com', 'Jamie Smith', 'parent_b', '+1-555-0102');

-- Create a conversation between the two parents
INSERT INTO conversations (id, parent_a_id, parent_b_id, title) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Co-parenting Communication');

-- Create sample messages (hash chain will be computed by trigger)
INSERT INTO messages (id, conversation_id, sender_id, content, message_type, status, sent_at) VALUES
  (
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'Hi Jamie, I wanted to discuss the schedule for next week. Are you available to pick up the kids on Tuesday at 5 PM?',
    'regular',
    'sent',
    now() - INTERVAL '2 days'
  ),
  (
    '00000000-0000-0000-0000-000000000021',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000002',
    'Tuesday at 5 works for me. I''ll be there.',
    'regular',
    'sent',
    now() - INTERVAL '2 days' + INTERVAL '15 minutes'
  ),
  (
    '00000000-0000-0000-0000-000000000022',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'Great, thank you. Also, Emily has a dentist appointment on Thursday at 3:30. Can you drop her off at the office?',
    'regular',
    'sent',
    now() - INTERVAL '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000023',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000002',
    'Sure, I''ll take her. Do you have the dentist''s address handy?',
    'regular',
    'sent',
    now() - INTERVAL '1 day' + INTERVAL '30 minutes'
  ),
  (
    '00000000-0000-0000-0000-000000000024',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'It''s Dr. Martinez at 456 Oak Street. I''ll text you the exact address.',
    'regular',
    'sent',
    now() - INTERVAL '12 hours'
  );

-- Create BIFF scores for messages
INSERT INTO biff_scores (id, message_id, brief_score, informative_score, friendly_score, firm_score, overall_score, model_version, suggestions) VALUES
  (
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000020',
    85,
    90,
    88,
    80,
    86,
    'v1.0',
    '{"suggestions": ["Great job! Your message is clear and friendly.", "Consider adding a specific pickup location."]}'
  ),
  (
    '00000000-0000-0000-0000-000000000031',
    '00000000-0000-0000-0000-000000000021',
    95,
    70,
    85,
    90,
    85,
    'v1.0',
    '{"suggestions": ["Very brief and to the point!", "Could include more details about your availability."]}'
  ),
  (
    '00000000-0000-0000-0000-000000000032',
    '00000000-0000-0000-0000-000000000022',
    80,
    95,
    90,
    85,
    88,
    'v1.0',
    '{"suggestions": ["Excellent detail on the appointment!", "Very informative and friendly."]}'
  );

-- Link BIFF scores to messages
UPDATE messages SET biff_score_id = '00000000-0000-0000-0000-000000000030' WHERE id = '00000000-0000-0000-0000-000000000020';
UPDATE messages SET biff_score_id = '00000000-0000-0000-0000-000000000031' WHERE id = '00000000-0000-0000-0000-000000000021';
UPDATE messages SET biff_score_id = '00000000-0000-0000-0000-000000000032' WHERE id = '00000000-0000-0000-0000-000000000022';

-- Create user preferences
INSERT INTO user_preferences (user_id) VALUES
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002');

-- Create sample notification
INSERT INTO notifications (id, user_id, notification_type, title, body, channels, conversation_id, message_id, is_sent, sent_at) VALUES
  (
    '00000000-0000-0000-0000-000000000040',
    '00000000-0000-0000-0000-000000000002',
    'new_message',
    'New message from Alex',
    'Hi Jamie, I wanted to discuss the schedule for next week...',
    ARRAY['push', 'in_app']::notification_channel_enum[],
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000020',
    true,
    now() - INTERVAL '2 days'
  );

-- Create sample pattern detection
INSERT INTO pattern_detections (
  id,
  conversation_id,
  message_id,
  pattern_type,
  severity,
  confidence_score,
  evidence,
  user_notified,
  notified_at,
  model_version
) VALUES (
  '00000000-0000-0000-0000-000000000050',
  '00000000-0000-0000-0000-000000000010',
  NULL, -- Multi-message pattern
  'urgency_manipulation',
  'low',
  0.65,
  '{"messages": ["Need immediate response", "This can''t wait"], "frequency": 2, "time_span_hours": 48}',
  false,
  NULL,
  'v1.0'
);

-- Create sample gray rock session
INSERT INTO gray_rock_sessions (
  id,
  user_id,
  conversation_id,
  started_at,
  ended_at,
  is_active,
  intensity_level,
  messages_processed
) VALUES (
  '00000000-0000-0000-0000-000000000060',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000010',
  now() - INTERVAL '3 days',
  now() - INTERVAL '2 days',
  false,
  7,
  5
);

-- Verify hash chain integrity
DO $$
DECLARE
  msg RECORD;
  expected_hash TEXT;
  integrity_ok BOOLEAN := true;
BEGIN
  FOR msg IN
    SELECT id, message_hash, previous_hash, created_at
    FROM messages
    ORDER BY created_at
  LOOP
    -- For messages with previous_hash, verify the chain
    IF msg.previous_hash IS NOT NULL THEN
      PERFORM 1 FROM messages
      WHERE message_hash = msg.previous_hash
        AND created_at < msg.created_at;

      IF NOT FOUND THEN
        RAISE NOTICE 'Hash chain broken at message %', msg.id;
        integrity_ok := false;
      END IF;
    END IF;
  END LOOP;

  IF integrity_ok THEN
    RAISE NOTICE 'Hash chain integrity verified: OK';
  ELSE
    RAISE NOTICE 'Hash chain integrity: FAILED';
  END IF;
END $$;

-- Display seed data summary
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ClearTalk Seed Data Loaded Successfully';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users: %', (SELECT COUNT(*) FROM users);
  RAISE NOTICE 'Conversations: %', (SELECT COUNT(*) FROM conversations);
  RAISE NOTICE 'Messages: %', (SELECT COUNT(*) FROM messages);
  RAISE NOTICE 'BIFF Scores: %', (SELECT COUNT(*) FROM biff_scores);
  RAISE NOTICE 'Notifications: %', (SELECT COUNT(*) FROM notifications);
  RAISE NOTICE 'Pattern Detections: %', (SELECT COUNT(*) FROM pattern_detections);
  RAISE NOTICE 'Gray Rock Sessions: %', (SELECT COUNT(*) FROM gray_rock_sessions);
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test Credentials:';
  RAISE NOTICE '  Parent A: parent.a@example.com';
  RAISE NOTICE '  Parent B: parent.b@example.com';
  RAISE NOTICE '========================================';
END $$;
