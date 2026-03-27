-- ClearTalk Schema Verification Script
-- Run this after deployment to verify everything is set up correctly

\echo '========================================='
\echo 'ClearTalk Schema Verification'
\echo '========================================='

-- 1. Check all tables exist
\echo ''
\echo '1. Checking tables...'
SELECT
  table_name,
  CASE
    WHEN table_name = ANY(ARRAY[
      'users', 'conversations', 'messages', 'biff_scores',
      'message_shield_logs', 'gray_rock_sessions', 'solo_mode_config',
      'professional_access', 'pattern_detections', 'notifications',
      'message_attachments', 'user_preferences', 'audit_log'
    ]) THEN '✓'
    ELSE '✗'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Check RLS is enabled
\echo ''
\echo '2. Checking Row-Level Security...'
SELECT
  tablename,
  CASE
    WHEN rowsecurity THEN '✓ Enabled'
    ELSE '✗ DISABLED (SECURITY RISK!)'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Check RLS policies
\echo ''
\echo '3. Checking RLS policies...'
SELECT
  schemaname,
  tablename,
  policyname,
  CASE
    WHEN permissive = 'PERMISSIVE' THEN '✓'
    ELSE '✗'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Check indexes
\echo ''
\echo '4. Checking indexes...'
SELECT
  tablename,
  COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 5. Check triggers
\echo ''
\echo '5. Checking triggers...'
SELECT
  event_object_table as table_name,
  trigger_name,
  '✓' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 6. Check functions
\echo ''
\echo '6. Checking functions...'
SELECT
  routine_name,
  routine_type,
  '✓' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_updated_at_column',
    'compute_message_hash',
    'set_message_hash',
    'prevent_message_tampering',
    'end_gray_rock_session',
    'track_solo_mode_enablement',
    'track_professional_access',
    'is_professional_access_valid',
    'track_recurring_patterns',
    'mark_notification_sent',
    'verify_attachment_hash',
    'create_default_preferences',
    'prevent_audit_log_modification',
    'log_user_action',
    'audit_message_sent',
    'audit_professional_access'
  )
ORDER BY routine_name;

-- 7. Check views
\echo ''
\echo '7. Checking views...'
SELECT
  table_name as view_name,
  '✓' as status
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'notifications_ready_to_send',
    'unscanned_attachments',
    'recent_audit_activity'
  )
ORDER BY table_name;

-- 8. Check enums
\echo ''
\echo '8. Checking enum types...'
SELECT
  typname as enum_name,
  '✓' as status
FROM pg_type
WHERE typtype = 'e'
  AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY typname;

-- 9. Check foreign keys
\echo ''
\echo '9. Checking foreign key constraints...'
SELECT
  tc.table_name,
  tc.constraint_name,
  '✓' as status
FROM information_schema.table_constraints tc
WHERE tc.constraint_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;

-- 10. Verify hash chain integrity (if messages exist)
\echo ''
\echo '10. Verifying message hash chain integrity...'
DO $$
DECLARE
  msg RECORD;
  prev_record RECORD;
  integrity_ok BOOLEAN := true;
  message_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO message_count FROM messages;

  IF message_count = 0 THEN
    RAISE NOTICE '  ℹ No messages found (empty database)';
  ELSE
    FOR msg IN
      SELECT id, message_hash, previous_hash, conversation_id, created_at
      FROM messages
      ORDER BY conversation_id, created_at
    LOOP
      IF msg.previous_hash IS NOT NULL THEN
        SELECT * INTO prev_record
        FROM messages
        WHERE message_hash = msg.previous_hash
          AND conversation_id = msg.conversation_id
          AND created_at < msg.created_at;

        IF NOT FOUND THEN
          RAISE NOTICE '  ✗ Hash chain broken at message %', msg.id;
          integrity_ok := false;
        END IF;
      END IF;
    END LOOP;

    IF integrity_ok THEN
      RAISE NOTICE '  ✓ Hash chain integrity verified (% messages checked)', message_count;
    ELSE
      RAISE NOTICE '  ✗ Hash chain integrity FAILED';
    END IF;
  END IF;
END $$;

-- 11. Check database size
\echo ''
\echo '11. Database size...'
SELECT
  pg_size_pretty(pg_database_size(current_database())) as database_size;

-- 12. Check table sizes
\echo ''
\echo '12. Table sizes...'
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 13. Check row counts
\echo ''
\echo '13. Table row counts...'
SELECT
  'users' as table_name,
  COUNT(*) as row_count
FROM users
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'biff_scores', COUNT(*) FROM biff_scores
UNION ALL
SELECT 'message_shield_logs', COUNT(*) FROM message_shield_logs
UNION ALL
SELECT 'gray_rock_sessions', COUNT(*) FROM gray_rock_sessions
UNION ALL
SELECT 'solo_mode_config', COUNT(*) FROM solo_mode_config
UNION ALL
SELECT 'professional_access', COUNT(*) FROM professional_access
UNION ALL
SELECT 'pattern_detections', COUNT(*) FROM pattern_detections
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'message_attachments', COUNT(*) FROM message_attachments
UNION ALL
SELECT 'user_preferences', COUNT(*) FROM user_preferences
UNION ALL
SELECT 'audit_log', COUNT(*) FROM audit_log
ORDER BY table_name;

-- 14. Test RLS policies (basic test)
\echo ''
\echo '14. Testing RLS enforcement...'
DO $$
DECLARE
  test_passed BOOLEAN := true;
BEGIN
  -- Test that anon role cannot access users
  BEGIN
    SET LOCAL ROLE anon;
    PERFORM COUNT(*) FROM users;
    SET LOCAL ROLE postgres;
    RAISE NOTICE '  ✗ SECURITY ISSUE: Anon role can access users table';
    test_passed := false;
  EXCEPTION
    WHEN insufficient_privilege THEN
      SET LOCAL ROLE postgres;
      RAISE NOTICE '  ✓ Anon role correctly blocked from users table';
  END;

  IF test_passed THEN
    RAISE NOTICE '  ✓ RLS enforcement test passed';
  ELSE
    RAISE NOTICE '  ✗ RLS enforcement test FAILED';
  END IF;
END $$;

-- Summary
\echo ''
\echo '========================================='
\echo 'Verification Complete'
\echo '========================================='
\echo ''
\echo 'Review the output above for any ✗ marks.'
\echo 'All items should show ✓ for a healthy database.'
\echo ''
\echo 'Common issues:'
\echo '  - RLS disabled: Run migration 014 again'
\echo '  - Missing indexes: Run migration containing that table again'
\echo '  - Broken hash chain: Investigate message data integrity'
\echo ''
\echo 'For support, see /supabase/README.md'
\echo '========================================='
