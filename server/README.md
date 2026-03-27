# ClearTalk AI Server

AI-powered co-parenting communication platform with BIFF scoring, message rewriting, and message shield features powered by Claude API.

## Features

- **BIFF Scoring** - Analyze messages for Brief, Informative, Friendly, Firm compliance
- **Message Rewriting** - AI-powered message improvement while preserving facts
- **Message Shield** - Filter hostile/manipulative content from incoming messages
- **Pattern Detection** - Identify manipulation patterns (DARVO, gaslighting, etc.)
- **Hash Chain Verification** - Tamper-proof message integrity with SHA-256
- **Analytics Dashboard** - Comprehensive conversation analytics and trends

## Tech Stack

- **API**: Express + TypeScript
- **AI**: Claude API (Haiku 4.5 for scoring, Sonnet 4.6 for rewriting/shield)
- **Database**: Supabase (PostgreSQL)
- **Security**: SHA-256 hash chain, helmet, CORS

## Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

## Environment Variables

```env
# Claude API
CLAUDE_API_KEY=sk-ant-...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

# Server
PORT=3000
NODE_ENV=development

# CORS (comma-separated origins)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-26T12:00:00Z",
  "uptime": 3600,
  "environment": "development"
}
```

---

## Message Endpoints

### Score Message

Analyze a draft message for BIFF compliance.

```http
POST /api/messages/score
Content-Type: application/json

{
  "content": "Can you pick up the kids at 3pm on Friday?"
}
```

**Response:**
```json
{
  "success": true,
  "scores": {
    "brief": 95,
    "informative": 90,
    "friendly": 85,
    "firm": 80,
    "overall": 87,
    "suggestions": [
      "Consider adding specific location",
      "Specify which kids (names)"
    ]
  }
}
```

**Performance:** <500ms | **Cost:** ~$0.002/message

---

### Rewrite Message

Improve a draft message for better BIFF scores.

```http
POST /api/messages/rewrite
Content-Type: application/json

{
  "content": "I can't believe you forgot again! This is ridiculous.",
  "scores": {
    "brief": 60,
    "informative": 40,
    "friendly": 20,
    "firm": 50,
    "overall": 42
  }
}
```

**Response:**
```json
{
  "success": true,
  "original": "I can't believe you forgot again! This is ridiculous.",
  "rewritten": "Reminder: pickup is at 3pm today. Please confirm receipt.",
  "improvements": [
    "Removed emotional language",
    "Made request clear and direct",
    "Added specific details"
  ],
  "originalScores": { ... },
  "newScores": {
    "brief": 95,
    "informative": 90,
    "friendly": 85,
    "firm": 90,
    "overall": 90
  }
}
```

**Performance:** <2s | **Cost:** ~$0.003/message

---

### Get Suggestions

Get improvement suggestions without full rewrite (faster/cheaper).

```http
POST /api/messages/suggestions
Content-Type: application/json

{
  "content": "You never tell me what's going on with the kids!"
}
```

**Response:**
```json
{
  "success": true,
  "suggestions": [
    "Replace 'You never' with specific request",
    "Remove accusatory tone",
    "Be specific about what information you need"
  ],
  "scores": { ... }
}
```

---

### Send Message

Send a message with automatic BIFF scoring and hash chain.

```http
POST /api/messages/send
Content-Type: application/json

{
  "conversation_id": "uuid",
  "sender_id": "uuid",
  "recipient_id": "uuid",
  "content": "Pickup at 3pm Friday at school."
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "uuid",
    "conversation_id": "uuid",
    "sender_id": "uuid",
    "recipient_id": "uuid",
    "content": "Pickup at 3pm Friday at school.",
    "biff_score": 92,
    "biff_brief": 95,
    "biff_informative": 90,
    "biff_friendly": 90,
    "biff_firm": 93,
    "hash": "abc123...",
    "previous_hash": "def456...",
    "created_at": "2026-03-26T12:00:00Z"
  },
  "scores": { ... }
}
```

---

### Message Shield

Filter hostile/manipulative content from incoming messages.

```http
POST /api/messages/shield
Content-Type: application/json

{
  "content": "You're a terrible parent and the kids hate you. But can you pick them up at 3pm?",
  "message_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "original": "You're a terrible parent and the kids hate you. But can you pick them up at 3pm?",
  "filtered": "Pickup request: 3pm.",
  "manipulation_types": [
    "Personal attack",
    "Triangulation (weaponizing children)"
  ],
  "severity": "high",
  "facts_preserved": [
    "Pickup time: 3pm"
  ],
  "originalKept": false
}
```

**Performance:** <2s | **Cost:** ~$0.003/message

**Note:** Original and filtered versions are logged to `message_shield_logs` table.

---

### Verify Hash Chain

Verify message integrity for a conversation.

```http
GET /api/messages/verify/:conversation_id
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "total_messages": 42
}
```

Or if tampering detected:
```json
{
  "success": true,
  "valid": false,
  "brokenAt": 15,
  "error": "Hash verification failed at message abc-123",
  "total_messages": 42
}
```

---

### Get Conversation Messages

Retrieve all messages in a conversation.

```http
GET /api/messages/conversation/:conversation_id?limit=50&offset=0
```

**Response:**
```json
{
  "success": true,
  "messages": [ ... ],
  "count": 50
}
```

---

## Analysis Endpoints

### Detect Patterns

Detect manipulation patterns in conversation history.

```http
POST /api/analysis/patterns
Content-Type: application/json

{
  "conversation_id": "uuid",
  "message_limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "conversation_id": "uuid",
  "patterns": [
    {
      "type": "DARVO",
      "confidence": 85,
      "evidence": "Consistent pattern of denying issues, attacking messenger, claiming victimhood",
      "detected_in_messages": ["1", "3", "7"]
    },
    {
      "type": "Manufactured Urgency",
      "confidence": 72,
      "evidence": "Multiple 'URGENT' requests for non-emergency matters",
      "detected_in_messages": ["2", "5", "9"]
    }
  ],
  "summary": "High confidence detection of DARVO and manufactured urgency patterns.",
  "risk_level": "high"
}
```

**Patterns Detected:**
- DARVO (Deny, Attack, Reverse Victim/Offender)
- Gaslighting
- Manufactured Urgency
- Boundary Testing
- Information Control
- Triangulation
- Guilt-Tripping
- Passive-Aggressive Communication

**Performance:** <3s | **Cost:** ~$0.005/analysis

---

### Get Pattern History

```http
GET /api/analysis/patterns/:conversation_id?limit=20
```

**Response:**
```json
{
  "success": true,
  "conversation_id": "uuid",
  "patterns": [ ... ]
}
```

---

### Get Pattern Statistics

```http
GET /api/analysis/patterns/stats/:conversation_id
```

**Response:**
```json
{
  "success": true,
  "conversation_id": "uuid",
  "stats": {
    "total_detections": 15,
    "by_type": [
      { "type": "DARVO", "count": 6, "avg_confidence": 82 },
      { "type": "Gaslighting", "count": 4, "avg_confidence": 75 }
    ],
    "risk_trend": "increasing"
  }
}
```

---

### Get Shield Statistics

```http
GET /api/analysis/shield/stats/:conversation_id
```

**Response:**
```json
{
  "success": true,
  "conversation_id": "uuid",
  "stats": {
    "total_filtered": 28,
    "by_severity": {
      "low": 8,
      "medium": 12,
      "high": 8
    },
    "common_patterns": [
      { "type": "Personal attack", "count": 15 },
      { "type": "Guilt-tripping", "count": 9 }
    ]
  }
}
```

---

### Get BIFF History

Track BIFF score trends over time.

```http
GET /api/analysis/biff-history/:conversation_id?limit=30
```

**Response:**
```json
{
  "success": true,
  "conversation_id": "uuid",
  "history": [
    {
      "id": "uuid",
      "created_at": "2026-03-01T12:00:00Z",
      "biff_score": 75,
      "biff_brief": 80,
      "biff_informative": 70,
      "biff_friendly": 75,
      "biff_firm": 75,
      "sender_id": "uuid"
    }
  ],
  "trends": {
    "overall": { "first": 65, "last": 82, "change": 17 },
    "brief": { "first": 70, "last": 85, "change": 15 },
    "informative": { "first": 60, "last": 80, "change": 20 },
    "friendly": { "first": 65, "last": 80, "change": 15 },
    "firm": { "first": 65, "last": 85, "change": 20 }
  }
}
```

---

### Get Analytics Dashboard

Comprehensive analytics for a conversation.

```http
GET /api/analysis/dashboard/:conversation_id
```

**Response:**
```json
{
  "success": true,
  "conversation_id": "uuid",
  "dashboard": {
    "biff": {
      "average": 78,
      "recent_messages": 30,
      "trend": 12
    },
    "patterns": {
      "total_detections": 15,
      "by_type": [ ... ],
      "risk_trend": "stable"
    },
    "shield": {
      "total_filtered": 28,
      "by_severity": { ... },
      "common_patterns": [ ... ]
    }
  }
}
```

---

### Batch Score Messages

Score multiple messages at once (max 20).

```http
POST /api/analysis/batch-score
Content-Type: application/json

{
  "messages": [
    "Can you pick up kids at 3pm?",
    "You never tell me anything!",
    "Reminder: doctor appointment Tuesday at 2pm."
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "content": "Can you pick up kids at 3pm?",
      "scores": { "brief": 90, "informative": 85, ... }
    },
    {
      "content": "You never tell me anything!",
      "scores": { "brief": 80, "informative": 20, ... }
    },
    {
      "content": "Reminder: doctor appointment Tuesday at 2pm.",
      "scores": { "brief": 95, "informative": 95, ... }
    }
  ]
}
```

---

## Hash Chain Verification

ClearTalk uses SHA-256 hash chains to ensure message integrity and prevent tampering.

### How It Works

1. **Message Creation**: Hash = SHA256(message_id + content + timestamp + previous_hash)
2. **Chain Linking**: Each message references the previous message's hash
3. **Verification**: Recalculate hashes and verify chain integrity

### Example

```
Message 1: hash = SHA256(id1 + content1 + time1 + null)
Message 2: hash = SHA256(id2 + content2 + time2 + hash1)
Message 3: hash = SHA256(id3 + content3 + time3 + hash2)
```

If Message 2's content is altered, its hash changes, breaking the chain at Message 3.

### Verification

```typescript
import { verifyHashChain } from './utils/hash-chain';

const result = verifyHashChain(messages);

if (!result.valid) {
  console.error(`Chain broken at message ${result.brokenAt}: ${result.error}`);
}
```

---

## Database Schema

### messages

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  biff_score INTEGER NOT NULL,
  biff_brief INTEGER NOT NULL,
  biff_informative INTEGER NOT NULL,
  biff_friendly INTEGER NOT NULL,
  biff_firm INTEGER NOT NULL,
  hash TEXT NOT NULL,
  previous_hash TEXT,
  is_filtered BOOLEAN DEFAULT FALSE,
  original_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

### message_shield_logs

```sql
CREATE TABLE message_shield_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id),
  original_content TEXT NOT NULL,
  filtered_content TEXT NOT NULL,
  manipulation_types TEXT[] NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  facts_preserved TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shield_logs_message ON message_shield_logs(message_id);
CREATE INDEX idx_shield_logs_severity ON message_shield_logs(severity);
```

### pattern_detections

```sql
CREATE TABLE pattern_detections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  pattern_type TEXT NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  evidence TEXT NOT NULL,
  detected_in_messages TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pattern_detections_conversation ON pattern_detections(conversation_id);
CREATE INDEX idx_pattern_detections_type ON pattern_detections(pattern_type);
CREATE INDEX idx_pattern_detections_created_at ON pattern_detections(created_at);
```

---

## Cost Optimization

### Model Selection

- **BIFF Scoring**: Claude Haiku 4.5 (~$0.002/message) - Fast, cheap, accurate
- **Rewriting**: Claude Sonnet 4.6 (~$0.003/message) - Higher quality reasoning
- **Message Shield**: Claude Sonnet 4.6 (~$0.003/message) - Complex pattern detection
- **Pattern Detection**: Claude Sonnet 4.6 (~$0.005/analysis) - Deep conversation analysis

### Cost Estimates

**Per User (30 messages/day):**
- BIFF Scoring: $0.06/day = $1.80/month
- Rewriting (50% of messages): $0.045/day = $1.35/month
- Message Shield (incoming): $0.045/day = $1.35/month
- Pattern Detection (1x/day): $0.005/day = $0.15/month

**Total per user:** ~$4.65/month at Claude API costs

### Optimization Tips

1. **Cache BIFF prompts** - Reuse system prompts across requests
2. **Batch operations** - Use `batch-score` endpoint when possible
3. **Selective rewriting** - Only rewrite messages with low BIFF scores
4. **Pattern detection throttling** - Run every 5-10 messages, not every message

---

## Deployment

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set CLAUDE_API_KEY=sk-ant-...
railway variables set SUPABASE_URL=https://...
railway variables set SUPABASE_SERVICE_ROLE_KEY=...

# Deploy
railway up
```

### Render

1. Create new Web Service
2. Connect GitHub repo
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables in dashboard

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
docker build -t cleartalk-server .
docker run -p 3000:3000 --env-file .env cleartalk-server
```

---

## Testing

```bash
# Test BIFF scoring
curl -X POST http://localhost:3000/api/messages/score \
  -H "Content-Type: application/json" \
  -d '{"content": "Can you pick up the kids at 3pm Friday?"}'

# Test message rewriting
curl -X POST http://localhost:3000/api/messages/rewrite \
  -H "Content-Type: application/json" \
  -d '{"content": "You never tell me anything!"}'

# Test message shield
curl -X POST http://localhost:3000/api/messages/shield \
  -H "Content-Type: application/json" \
  -d '{"content": "You are a terrible parent!"}'

# Test health check
curl http://localhost:3000/health
```

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad request (invalid parameters)
- `404` - Not found
- `500` - Server error

---

## Rate Limiting

Consider implementing rate limiting for production:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Monitoring

### Recommended Metrics

- API response times
- Claude API latency
- Error rates by endpoint
- BIFF score distributions
- Pattern detection frequency
- Message shield activation rate

### Logging

All AI operations are logged with:
- Request content (sanitized)
- Response metadata
- Latency
- Error details

---

## Security Considerations

1. **API Keys**: Never commit `.env` to version control
2. **CORS**: Configure `ALLOWED_ORIGINS` for production
3. **Rate Limiting**: Implement per-user limits
4. **Input Validation**: All message content is validated
5. **Hash Chain**: Tamper-proof message integrity
6. **Content Filtering**: Message shield prevents harmful content

---

## Support

For questions or issues:
- GitHub Issues: [link]
- Email: support@cleartalk.app
- Documentation: https://docs.cleartalk.app

---

## License

MIT License - see LICENSE file for details.

---

## Changelog

### v1.0.0 (2026-03-26)
- Initial release
- BIFF scoring with Claude Haiku 4.5
- Message rewriting with Claude Sonnet 4.6
- Message shield with manipulation detection
- Pattern detection (DARVO, gaslighting, etc.)
- Hash chain message integrity
- Analytics dashboard
- Batch operations
