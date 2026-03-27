# ClearTalk Database Quick Reference

Fast reference for common database operations.

## Table Overview

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User profiles | Parent relationship (parent_a/parent_b) |
| `conversations` | Conversation threads | One-to-one between parents |
| `messages` | Messages | Hash chain, immutable |
| `biff_scores` | BIFF analysis | 4 component scores + overall |
| `message_shield_logs` | Filtering logs | Original + filtered content |
| `gray_rock_sessions` | Gray rock mode | Intensity, usage metrics |
| `solo_mode_config` | Solo mode | AI response config |
| `professional_access` | Attorney access | Time-limited, revocable |
| `pattern_detections` | Pattern tracking | DARVO, gaslighting, etc. |
| `notifications` | Notifications | Multi-channel delivery |
| `message_attachments` | File uploads | Malware scanning |
| `user_preferences` | User settings | All preferences |
| `audit_log` | Audit trail | Append-only, immutable |

## Common Queries

### User Management

```sql
-- Get user by email
SELECT * FROM users WHERE email = 'user@example.com';

-- Get user's conversations
SELECT c.*
FROM conversations c
WHERE c.parent_a_id = 'user-id' OR c.parent_b_id = 'user-id';

-- Get user preferences
SELECT * FROM user_preferences WHERE user_id = 'user-id';
```

### Conversations

```sql
-- Get conversation between two parents
SELECT * FROM conversations
WHERE (parent_a_id = 'user1-id' AND parent_b_id = 'user2-id')
   OR (parent_a_id = 'user2-id' AND parent_b_id = 'user1-id');

-- Get conversation with message count
SELECT
  c.*,
  COUNT(m.id) as message_count,
  MAX(m.sent_at) as last_message_at
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE c.parent_a_id = 'user-id' OR c.parent_b_id = 'user-id'
GROUP BY c.id
ORDER BY last_message_at DESC NULLS LAST;

-- Get unread message count
SELECT
  c.id,
  COUNT(m.id) as unread_count
FROM conversations c
JOIN messages m ON m.conversation_id = c.id
WHERE (c.parent_a_id = 'user-id' OR c.parent_b_id = 'user-id')
  AND m.sender_id != 'user-id'
  AND m.read_at IS NULL
GROUP BY c.id;
```

### Messages

```sql
-- Get messages in conversation
SELECT * FROM messages
WHERE conversation_id = 'conversation-id'
ORDER BY created_at DESC
LIMIT 50;

-- Get messages with BIFF scores
SELECT
  m.*,
  b.overall_score,
  b.brief_score,
  b.informative_score,
  b.friendly_score,
  b.firm_score
FROM messages m
LEFT JOIN biff_scores b ON b.message_id = m.id
WHERE m.conversation_id = 'conversation-id'
ORDER BY m.created_at DESC;

-- Get filtered messages
SELECT
  m.*,
  msl.severity,
  msl.manipulation_types
FROM messages m
JOIN message_shield_logs msl ON msl.message_id = m.id
WHERE m.conversation_id = 'conversation-id'
  AND m.is_shielded = true
ORDER BY m.created_at DESC;

-- Verify hash chain
SELECT
  m.id,
  m.message_hash,
  m.previous_hash,
  m.created_at,
  compute_message_hash(
    m.id,
    m.conversation_id,
    m.sender_id,
    m.content,
    m.previous_hash,
    m.created_at
  ) = m.message_hash as is_valid
FROM messages m
WHERE m.conversation_id = 'conversation-id'
ORDER BY m.created_at;
```

### BIFF Analysis

```sql
-- Get average BIFF score for user
SELECT
  AVG(b.overall_score) as avg_biff_score,
  AVG(b.brief_score) as avg_brief,
  AVG(b.informative_score) as avg_informative,
  AVG(b.friendly_score) as avg_friendly,
  AVG(b.firm_score) as avg_firm
FROM messages m
JOIN biff_scores b ON b.message_id = m.id
WHERE m.sender_id = 'user-id';

-- Get messages with low BIFF scores
SELECT
  m.*,
  b.overall_score,
  b.suggestions
FROM messages m
JOIN biff_scores b ON b.message_id = m.id
WHERE m.sender_id = 'user-id'
  AND b.overall_score < 60
ORDER BY b.overall_score ASC;
```

### Pattern Detection

```sql
-- Get detected patterns in conversation
SELECT
  pd.*,
  COUNT(*) OVER (PARTITION BY pd.pattern_type) as pattern_count
FROM pattern_detections pd
WHERE pd.conversation_id = 'conversation-id'
ORDER BY pd.detected_at DESC;

-- Get recurring patterns
SELECT
  pattern_type,
  COUNT(*) as occurrence_count,
  MAX(severity) as max_severity,
  MIN(detected_at) as first_detected,
  MAX(detected_at) as last_detected
FROM pattern_detections
WHERE conversation_id = 'conversation-id'
GROUP BY pattern_type
HAVING COUNT(*) >= 3
ORDER BY occurrence_count DESC;

-- Get pattern detection timeline
SELECT
  DATE(detected_at) as date,
  pattern_type,
  severity,
  COUNT(*) as count
FROM pattern_detections
WHERE conversation_id = 'conversation-id'
GROUP BY DATE(detected_at), pattern_type, severity
ORDER BY date DESC;
```

### Professional Access

```sql
-- Grant professional access
INSERT INTO professional_access (
  professional_email,
  professional_name,
  professional_role,
  conversation_id,
  granted_by,
  access_level,
  expires_at
) VALUES (
  'attorney@lawfirm.com',
  'Jane Attorney',
  'attorney',
  'conversation-id',
  'granting-user-id',
  'read_only',
  now() + INTERVAL '90 days'
);

-- Get active professional access
SELECT * FROM professional_access
WHERE conversation_id = 'conversation-id'
  AND is_active = true
  AND revoked_at IS NULL
  AND (expires_at IS NULL OR expires_at > now());

-- Revoke professional access
UPDATE professional_access
SET
  is_active = false,
  revoked_at = now(),
  revoked_by = 'revoking-user-id',
  revocation_reason = 'Case concluded'
WHERE id = 'access-id';
```

### Notifications

```sql
-- Get unread notifications
SELECT * FROM notifications
WHERE user_id = 'user-id'
  AND is_read = false
ORDER BY created_at DESC;

-- Mark notification as read
UPDATE notifications
SET is_read = true, read_at = now()
WHERE id = 'notification-id';

-- Get notifications ready to send
SELECT * FROM notifications_ready_to_send;
```

### Audit Log

```sql
-- Get recent audit activity for user
SELECT
  al.*,
  u.full_name as actor_name
FROM audit_log al
LEFT JOIN users u ON u.id = al.actor_id
WHERE al.actor_id = 'user-id'
ORDER BY al.created_at DESC
LIMIT 50;

-- Get audit trail for conversation
SELECT
  al.*,
  u.full_name as actor_name,
  u.email as actor_email
FROM audit_log al
LEFT JOIN users u ON u.id = al.actor_id
WHERE al.conversation_id = 'conversation-id'
ORDER BY al.created_at DESC;

-- Get all message sends in conversation
SELECT * FROM audit_log
WHERE action = 'message_sent'
  AND conversation_id = 'conversation-id'
ORDER BY created_at DESC;
```

## TypeScript Types

### User

```typescript
interface User {
  id: string;
  email: string;
  full_name: string;
  parent_relationship: 'parent_a' | 'parent_b';
  phone_number?: string;
  profile_photo_url?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}
```

### Conversation

```typescript
interface Conversation {
  id: string;
  parent_a_id: string;
  parent_b_id: string;
  title?: string;
  is_archived: boolean;
  archived_at?: string;
  archived_by?: string;
  created_at: string;
  updated_at: string;
}
```

### Message

```typescript
interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  original_content?: string;
  message_type: 'regular' | 'system' | 'gray_rock' | 'solo_bridged';
  message_hash: string;
  previous_hash?: string;
  biff_score_id?: string;
  is_shielded: boolean;
  shield_reason?: string;
  status: 'draft' | 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  is_edited: boolean;
  edit_count: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}
```

### BIFF Score

```typescript
interface BIFFScore {
  id: string;
  message_id: string;
  brief_score: number; // 0-100
  informative_score: number; // 0-100
  friendly_score: number; // 0-100
  firm_score: number; // 0-100
  overall_score: number; // 0-100
  suggestions?: {
    suggestions: string[];
  };
  analysis_details?: Record<string, any>;
  model_version: string;
  analysis_duration_ms?: number;
  created_at: string;
}
```

## Supabase Client Usage

### Initialize Client

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Authentication

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Sign out
await supabase.auth.signOut();
```

### Query Data

```typescript
// Get conversations
const { data: conversations, error } = await supabase
  .from('conversations')
  .select('*')
  .or(`parent_a_id.eq.${userId},parent_b_id.eq.${userId}`)
  .order('updated_at', { ascending: false });

// Get messages with BIFF scores
const { data: messages, error } = await supabase
  .from('messages')
  .select(`
    *,
    biff_score:biff_scores(*)
  `)
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: false })
  .limit(50);

// Get user with preferences
const { data: user, error } = await supabase
  .from('users')
  .select(`
    *,
    preferences:user_preferences(*)
  `)
  .eq('id', userId)
  .single();
```

### Insert Data

```typescript
// Create conversation
const { data, error } = await supabase
  .from('conversations')
  .insert({
    parent_a_id: user1Id,
    parent_b_id: user2Id
  })
  .select()
  .single();

// Send message
const { data, error } = await supabase
  .from('messages')
  .insert({
    conversation_id: conversationId,
    sender_id: userId,
    content: 'Message content',
    message_type: 'regular'
  })
  .select()
  .single();
```

### Realtime Subscriptions

```typescript
// Subscribe to new messages
const subscription = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    },
    (payload) => {
      console.log('New message:', payload.new);
    }
  )
  .subscribe();

// Unsubscribe
subscription.unsubscribe();
```

## Common Functions

### Hash Verification

```sql
-- Function is already created in migration 003
SELECT compute_message_hash(
  message_id,
  conversation_id,
  sender_id,
  content,
  previous_hash,
  created_at
) FROM messages WHERE id = 'message-id';
```

### Log User Action

```sql
-- Function is already created in migration 013
SELECT log_user_action(
  'message_sent'::audit_action_enum,
  'user-id'::uuid,
  'message-id'::uuid,
  'message',
  'User sent a message',
  NULL,
  '{"content": "Message text"}'::jsonb
);
```

### Check Professional Access

```sql
-- Function is already created in migration 008
SELECT is_professional_access_valid('access-id'::uuid);
```

## Performance Tips

1. **Use indexes** - All critical paths are indexed
2. **Limit results** - Always use `.limit()` on large tables
3. **Select specific columns** - Don't use `SELECT *` in production
4. **Use pagination** - For messages, use cursor-based pagination
5. **Batch operations** - Use `.insert([...])` for multiple rows
6. **Cache frequently accessed data** - User preferences, etc.

## Security Best Practices

1. **Never expose service_role key** - Only in backend
2. **Always use RLS** - Enabled on all tables
3. **Validate input** - Check data before insert/update
4. **Use prepared statements** - Prevent SQL injection
5. **Audit sensitive operations** - All logged in audit_log
6. **Rotate keys regularly** - Update API keys periodically

## Support

- **Schema README**: `/supabase/README.md`
- **Deployment Guide**: `/supabase/DEPLOYMENT.md`
- **Supabase Docs**: https://supabase.com/docs

## License

Proprietary - ClearTalk Inc. 2026
