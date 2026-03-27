# ClearTalk Database Deployment Guide

Step-by-step guide to deploying the ClearTalk database schema to Supabase.

## Prerequisites

1. **Supabase CLI installed**
   ```bash
   npm install -g supabase
   ```

2. **Supabase account** at https://supabase.com
3. **Project created** in Supabase dashboard

## Local Development Setup

### Step 1: Start Local Supabase

```bash
cd /Users/jkw/Documents/Work/Projects/ClearTalk

# Start local Supabase (first time)
supabase start

# Output will show:
# - API URL: http://localhost:54321
# - DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# - Studio URL: http://localhost:54323
# - anon key: eyJhbGc...
# - service_role key: eyJhbGc...
```

**Save the keys** - you'll need them for your .env files.

### Step 2: Run Migrations

```bash
# Reset database (drops all data and runs migrations)
supabase db reset

# Or run migrations without seed data
supabase db push
```

### Step 3: Verify Setup

```bash
# Check migration status
supabase migration list

# Open Studio to view tables
open http://localhost:54323
```

### Step 4: Test Connection

Create `.env.local` in `/apps/mobile/`:

```env
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-step-1
```

## Production Deployment

### Step 1: Link to Supabase Project

```bash
cd /Users/jkw/Documents/Work/Projects/ClearTalk

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Find your project ref at:
# https://app.supabase.com/project/[project-ref]/settings/general
```

### Step 2: Push Migrations

```bash
# Push all migrations to production
supabase db push

# Confirm when prompted
```

### Step 3: Configure Storage

```bash
# Create storage bucket for attachments
supabase storage create message-attachments --public=false

# Set storage policies (done automatically by RLS migration)
```

### Step 4: Configure Auth

In Supabase Dashboard:

1. **Go to Authentication > Providers**
2. **Enable Email provider**
   - Enable "Confirm email"
   - Enable "Secure email change"
3. **Enable Apple provider**
   - Client ID: (from Apple Developer)
   - Secret: (from Apple Developer)
4. **Enable Google provider**
   - Client ID: (from Google Cloud Console)
   - Secret: (from Google Cloud Console)

### Step 5: Get Production Keys

In Supabase Dashboard > Settings > API:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (backend only, never expose)
```

### Step 6: Configure Environment Variables

Create `.env.production` in `/apps/mobile/`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
EXPO_PUBLIC_CLAUDE_API_KEY=your-claude-api-key
EXPO_PUBLIC_ENVIRONMENT=production
```

## Verification Checklist

### Database Verification

Run these queries in Supabase Studio SQL Editor:

```sql
-- 1. Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected: 13 tables

-- 2. Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Expected: All tables should have rowsecurity = true

-- 3. Verify hash chain integrity
DO $$
DECLARE
  msg RECORD;
  integrity_ok BOOLEAN := true;
BEGIN
  FOR msg IN
    SELECT id, message_hash, previous_hash, created_at
    FROM messages
    ORDER BY created_at
  LOOP
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
    RAISE NOTICE 'Hash chain integrity: OK';
  ELSE
    RAISE EXCEPTION 'Hash chain integrity: FAILED';
  END IF;
END $$;

-- 4. Verify indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Expected: 50+ indexes

-- 5. Verify triggers
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Expected: 15+ triggers
```

### RLS Policy Testing

```sql
-- Test as anonymous user (should fail)
SET LOCAL ROLE anon;
SELECT COUNT(*) FROM users; -- Should return 0 or error

-- Test as authenticated user
RESET ROLE;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "test-user-id"}';

SELECT COUNT(*) FROM users WHERE id = 'test-user-id'; -- Should work
SELECT COUNT(*) FROM users WHERE id != 'test-user-id'; -- Should return 0

-- Reset
RESET ROLE;
```

### Application Testing

1. **Authentication**
   ```typescript
   const { data, error } = await supabase.auth.signUp({
     email: 'test@example.com',
     password: 'password123'
   });
   ```

2. **Create conversation**
   ```typescript
   const { data, error } = await supabase
     .from('conversations')
     .insert({
       parent_a_id: user1.id,
       parent_b_id: user2.id
     });
   ```

3. **Send message**
   ```typescript
   const { data, error } = await supabase
     .from('messages')
     .insert({
       conversation_id: conversation.id,
       sender_id: user.id,
       content: 'Test message'
     });
   ```

4. **Verify hash chain**
   ```typescript
   const { data: messages } = await supabase
     .from('messages')
     .select('id, message_hash, previous_hash')
     .eq('conversation_id', conversation.id)
     .order('created_at');

   // Verify each message.previous_hash matches previous message.message_hash
   ```

## Migration Management

### Create New Migration

```bash
# Create new migration file
supabase migration new add_feature_name

# Edit the file in supabase/migrations/
# Then push to production
supabase db push
```

### Rollback Migration

```bash
# List migrations
supabase migration list

# Revert to specific migration
supabase db reset --version 20240101000000

# Or manually:
# Delete the migration file and run:
supabase db reset
```

### Migration Best Practices

1. **Always test locally first**
   ```bash
   supabase db reset
   # Test your app
   # Then push to production
   ```

2. **Use transactions**
   ```sql
   BEGIN;
   -- Your migration SQL
   COMMIT;
   ```

3. **Add rollback instructions**
   ```sql
   -- Migration: Add new column
   ALTER TABLE users ADD COLUMN new_field TEXT;

   -- Rollback:
   -- ALTER TABLE users DROP COLUMN new_field;
   ```

4. **Never modify existing migrations**
   - Once pushed to production, migrations are immutable
   - Create a new migration to fix issues

## Monitoring Setup

### Enable Monitoring

In Supabase Dashboard:

1. **Go to Settings > Database**
2. **Enable Query Performance Insights**
3. **Set up alerts for**:
   - Database size (> 80% of limit)
   - Connection pool (> 80% utilized)
   - Long-running queries (> 5 seconds)

### Custom Monitoring Queries

Create a monitoring view:

```sql
CREATE VIEW monitoring_stats AS
SELECT
  'users' as table_name,
  COUNT(*) as row_count,
  pg_size_pretty(pg_total_relation_size('users')) as total_size
FROM users
UNION ALL
SELECT
  'conversations',
  COUNT(*),
  pg_size_pretty(pg_total_relation_size('conversations'))
FROM conversations
UNION ALL
SELECT
  'messages',
  COUNT(*),
  pg_size_pretty(pg_total_relation_size('messages'))
FROM messages
UNION ALL
SELECT
  'audit_log',
  COUNT(*),
  pg_size_pretty(pg_total_relation_size('audit_log'))
FROM audit_log;
```

## Backup Strategy

### Automated Backups

Supabase automatically backs up:
- **Free tier**: Daily backups (7 days retention)
- **Pro tier**: Daily backups (90 days retention)
- **Team tier**: Daily backups + PITR (Point-in-Time Recovery)

### Manual Backup

```bash
# Export entire database
supabase db dump -f backup.sql

# Export specific schema
supabase db dump -f backup.sql --schema public

# Restore from backup
psql -h db.your-project-ref.supabase.co -U postgres -d postgres < backup.sql
```

### Critical Data Export

Export hash chain data for legal compliance:

```sql
COPY (
  SELECT
    m.id,
    m.conversation_id,
    m.sender_id,
    m.content,
    m.message_hash,
    m.previous_hash,
    m.sent_at,
    m.created_at
  FROM messages m
  ORDER BY m.conversation_id, m.created_at
) TO '/tmp/messages_export.csv' WITH CSV HEADER;
```

## Troubleshooting

### Issue: Migrations fail to apply

**Solution:**
```bash
# Check current migration status
supabase migration list

# Reset to clean state
supabase db reset

# If that fails, manually drop database
psql -h localhost -p 54322 -U postgres -c "DROP DATABASE IF EXISTS postgres;"
supabase start
```

### Issue: RLS policies blocking queries

**Solution:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Temporarily disable RLS for debugging (NEVER in production)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### Issue: Hash chain broken

**Solution:**
```sql
-- Find broken messages
SELECT m1.id, m1.previous_hash
FROM messages m1
WHERE m1.previous_hash IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM messages m2
    WHERE m2.message_hash = m1.previous_hash
      AND m2.conversation_id = m1.conversation_id
  );

-- These messages need to be investigated
-- DO NOT modify message_hash or previous_hash manually
```

### Issue: Performance degradation

**Solution:**
```sql
-- Analyze slow queries
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Rebuild indexes
REINDEX DATABASE postgres;

-- Update statistics
ANALYZE;
```

## Security Hardening

### Production Checklist

- [ ] RLS enabled on all tables
- [ ] Service role key kept secret (never in client)
- [ ] Auth providers configured (Apple, Google)
- [ ] Email confirmation enabled
- [ ] CORS configured for your domains
- [ ] Storage policies configured
- [ ] Database backups verified
- [ ] Monitoring alerts set up
- [ ] SSL/TLS enforced
- [ ] API rate limiting configured

### Environment Variables

**Never commit to git:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLAUDE_API_KEY`
- Database passwords

**Safe to commit:**
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (scoped by RLS)

## Support

- **Supabase Status**: https://status.supabase.com
- **Supabase Docs**: https://supabase.com/docs
- **Community Discord**: https://discord.supabase.com
- **Schema Documentation**: /supabase/README.md

## License

Proprietary - ClearTalk Inc. 2026
