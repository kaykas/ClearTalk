# ClearTalk Supabase Database Schema

Complete database schema for ClearTalk - the AI-powered co-parenting communication platform.

## Overview

This database schema implements a secure, auditable, and integrity-verified messaging system with:

- **Hash chain integrity** - Unalterable message history using SHA-256 hash chains
- **Multi-tenant RLS** - Row-level security ensuring users only see their own data
- **Professional access** - Controlled read-only access for attorneys/mediators
- **AI integration** - BIFF scoring, MessageShield filtering, pattern detection
- **Complete audit trail** - Append-only audit log for legal compliance
- **Solo mode support** - AI-powered communication for non-responsive co-parents

## Schema Architecture

### Core Tables

1. **users** - User profiles with parent relationship (parent_a/parent_b)
2. **conversations** - One-to-one conversation threads between co-parents
3. **messages** - Immutable messages with hash chain integrity
4. **biff_scores** - BIFF (Brief, Informative, Friendly, Firm) analysis
5. **message_shield_logs** - MessageShield filtering and manipulation detection

### AI & Safety Features

6. **pattern_detections** - Detected manipulation patterns (DARVO, gaslighting, etc.)
7. **gray_rock_sessions** - Gray rock mode session tracking
8. **solo_mode_config** - Solo mode settings and AI response configuration

### Access & Professional Features

9. **professional_access** - Attorney/mediator read-only access grants
10. **message_attachments** - File attachments with malware scanning
11. **notifications** - Multi-channel notification delivery tracking

### Settings & Audit

12. **user_preferences** - User settings and preferences
13. **audit_log** - Append-only audit trail for all system actions

## Key Features

### 1. Hash Chain Integrity

Each message contains:
- `message_hash` - SHA-256 hash of message data
- `previous_hash` - Hash of previous message in conversation

This creates an unbreakable chain that proves:
- Messages were not tampered with
- Messages were sent in a specific order
- No messages were deleted or inserted

```sql
-- Verify hash chain integrity
SELECT
  id,
  message_hash,
  previous_hash,
  compute_message_hash(id, conversation_id, sender_id, content, previous_hash, created_at) = message_hash as is_valid
FROM messages
WHERE conversation_id = 'conversation-uuid'
ORDER BY created_at;
```

### 2. Immutable Messages

Messages cannot be edited once sent. Triggers prevent modification of:
- Content
- Sender
- Timestamps
- Hash values

Only status fields (sent_at, read_at, delivered_at) can be updated.

### 3. Multi-Tenant RLS

Row-level security ensures:
- Users can only see conversations they're part of
- Users can only send messages as themselves
- Professionals can only access conversations they're granted access to
- Audit logs are filtered by user access

### 4. Professional Access

Attorneys/mediators can be granted read-only access:
- Must be granted by a parent
- Can have expiration dates
- Can be revoked at any time
- All access is logged in audit trail

```sql
-- Grant professional access
INSERT INTO professional_access (
  professional_email,
  professional_name,
  professional_role,
  conversation_id,
  granted_by,
  access_level
) VALUES (
  'attorney@lawfirm.com',
  'Jane Attorney',
  'attorney',
  'conversation-uuid',
  'parent-user-uuid',
  'read_only'
);
```

### 5. BIFF Analysis

Every message is scored on four dimensions:
- **Brief** (0-100) - Concise and to the point
- **Informative** (0-100) - Provides necessary information
- **Friendly** (0-100) - Maintains positive tone
- **Firm** (0-100) - Clear boundaries and expectations

Overall BIFF score is calculated and AI provides improvement suggestions.

### 6. MessageShield

AI-powered filtering detects and neutralizes:
- Gaslighting
- Guilt trips
- Passive-aggressive language
- Blame shifting
- DARVO (Deny, Attack, Reverse Victim and Offender)
- Urgency manipulation
- Boundary testing

Filtered content is logged with:
- Original content (visible only to sender)
- Filtered content (what recipient sees)
- Detected manipulation types
- Severity level
- Confidence score

### 7. Pattern Detection

Long-term pattern tracking across conversations:
- Identifies recurring manipulation patterns
- Tracks frequency and severity over time
- Provides educational resources
- Notifies users of escalating patterns

### 8. Gray Rock Mode

Users can enable "gray rock" technique:
- AI transforms responses to be emotionally neutral
- Removes emotional hooks
- Maintains necessary information
- Configurable intensity (1-10)
- Original content preserved

### 9. Solo Mode

For non-responsive co-parents:
- AI generates reasonable responses
- Auto-forwards messages after delay
- Creates timestamped conversation logs
- Documents attempts to communicate
- Court-ready PDF/DOCX exports

## Migrations

Migrations are numbered and must be run in order:

| Migration | Description |
|-----------|-------------|
| 001 | Users table with parent relationships |
| 002 | Conversations table |
| 003 | Messages table with hash chain |
| 004 | BIFF scores table |
| 005 | Message shield logs table |
| 006 | Gray rock sessions table |
| 007 | Solo mode configuration table |
| 008 | Professional access table |
| 009 | Pattern detections table |
| 010 | Notifications table |
| 011 | Message attachments table |
| 012 | User preferences table |
| 013 | Audit log table |
| 014 | Row-level security policies |

## Setup Instructions

### Local Development

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Initialize Supabase**
   ```bash
   cd /Users/jkw/Documents/Work/Projects/ClearTalk
   supabase init
   ```

3. **Start local Supabase**
   ```bash
   supabase start
   ```

4. **Run migrations**
   ```bash
   supabase db reset
   ```

   This will:
   - Run all 14 migrations in order
   - Apply seed data
   - Verify hash chain integrity

5. **Access local services**
   - Studio: http://localhost:54323
   - API: http://localhost:54321
   - Database: postgresql://postgres:postgres@localhost:54322/postgres

### Production Deployment

1. **Link to Supabase project**
   ```bash
   supabase link --project-ref your-project-ref
   ```

2. **Push migrations**
   ```bash
   supabase db push
   ```

3. **Verify deployment**
   ```bash
   supabase db diff
   ```

### Manual Migration

If you need to run migrations manually:

```bash
# Run each migration in order
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/migrations/001_users_table.sql
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/migrations/002_conversations_table.sql
# ... continue for all 14 migrations

# Run seed data (development only)
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seed.sql
```

## Verification

### Verify Hash Chain Integrity

```sql
DO $$
DECLARE
  msg RECORD;
  prev_record RECORD;
  integrity_ok BOOLEAN := true;
BEGIN
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
```

### Verify RLS Policies

```sql
-- Test as user A (should only see their conversations)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "00000000-0000-0000-0000-000000000001"}';

SELECT COUNT(*) FROM conversations; -- Should see only conversations involving this user
SELECT COUNT(*) FROM messages; -- Should see only messages in those conversations

-- Reset
RESET ROLE;
```

### Verify Immutability

```sql
-- This should FAIL (cannot modify message content)
UPDATE messages
SET content = 'Modified content'
WHERE id = 'message-uuid';
-- ERROR: Cannot modify immutable message fields

-- This should SUCCEED (can update status)
UPDATE messages
SET read_at = now()
WHERE id = 'message-uuid';
```

## Security Considerations

### Data Protection

1. **Encryption at rest** - Supabase encrypts all data
2. **Encryption in transit** - All connections use TLS
3. **File attachments** - Malware scanning required before access
4. **API authentication** - JWT tokens with RLS enforcement

### Legal Compliance

1. **Audit trail** - All actions logged (append-only)
2. **Message integrity** - Hash chain proves authenticity
3. **Professional access** - Tracked and revocable
4. **Data retention** - Configurable (default 7 years)
5. **Export capability** - Court-ready PDF/DOCX generation

### Privacy

1. **Multi-tenant isolation** - RLS prevents cross-user access
2. **Professional access** - Requires consent from both parents
3. **Selective visibility** - Users can control what professionals see
4. **Data deletion** - Users can request account deletion (soft delete)

## Performance Optimization

### Indexes

All critical paths are indexed:
- User lookups by email
- Conversation lookups by parent
- Message lookups by conversation
- Hash chain verification
- Audit trail queries

### Query Optimization

```sql
-- Efficient conversation query
EXPLAIN ANALYZE
SELECT c.*,
  (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count,
  (SELECT MAX(sent_at) FROM messages WHERE conversation_id = c.id) as last_message_at
FROM conversations c
WHERE c.parent_a_id = 'user-uuid' OR c.parent_b_id = 'user-uuid'
ORDER BY last_message_at DESC;
```

### Partitioning

For high-volume deployments, consider partitioning:
- `messages` by month
- `audit_log` by month
- `notifications` by status

## Backup & Recovery

### Automated Backups

Supabase provides automated daily backups.

### Manual Backup

```bash
# Backup entire database
pg_dump -h localhost -p 54322 -U postgres -d postgres > backup.sql

# Backup specific table
pg_dump -h localhost -p 54322 -U postgres -d postgres -t messages > messages_backup.sql

# Restore
psql -h localhost -p 54322 -U postgres -d postgres < backup.sql
```

### Point-in-Time Recovery

Supabase Pro plans support PITR (Point-in-Time Recovery).

## Testing

### Test Data

Seed file includes:
- 2 test users (Parent A and Parent B)
- 1 conversation
- 5 messages with hash chain
- 3 BIFF scores
- 1 notification
- 1 pattern detection
- 1 gray rock session

### Test Credentials

```
Parent A: parent.a@example.com
Parent B: parent.b@example.com
```

### Integration Tests

See `/apps/mobile/tests/database.test.ts` for integration tests.

## Monitoring

### Key Metrics

1. **Message integrity** - Run hash chain verification daily
2. **RLS enforcement** - Monitor for policy violations
3. **Performance** - Query response times
4. **Storage** - Database and file storage growth

### Health Checks

```sql
-- Check for broken hash chains
SELECT COUNT(*) as broken_chains
FROM messages m
WHERE m.previous_hash IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM messages prev
    WHERE prev.message_hash = m.previous_hash
      AND prev.conversation_id = m.conversation_id
      AND prev.created_at < m.created_at
  );

-- Check for undelivered notifications
SELECT COUNT(*) as undelivered
FROM notifications
WHERE is_sent = false
  AND (scheduled_for IS NULL OR scheduled_for <= now())
  AND delivery_attempts < 5;

-- Check for unscanned attachments
SELECT COUNT(*) as unscanned
FROM message_attachments
WHERE is_scanned = false
  AND created_at > now() - INTERVAL '7 days';
```

## Support

For questions or issues:
- Schema documentation: This README
- Supabase docs: https://supabase.com/docs
- Project repository: /Users/jkw/Documents/Work/Projects/ClearTalk

## License

Proprietary - ClearTalk Inc. 2026
