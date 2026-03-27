# ClearTalk AI Server - Quick Start Guide

Get up and running with ClearTalk AI server in 5 minutes.

## Prerequisites

- Node.js 20+ installed
- Claude API key ([get one here](https://console.anthropic.com/))
- Supabase project ([create one here](https://supabase.com/))

## Step 1: Install Dependencies

```bash
cd server
npm install
```

## Step 2: Set Up Environment

```bash
# Copy template
cp .env.example .env

# Edit with your credentials
nano .env
```

Required variables:
```env
CLAUDE_API_KEY=sk-ant-...  # Get from Anthropic Console
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...  # Get from Supabase Dashboard
```

## Step 3: Set Up Database

Run these SQL commands in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
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

CREATE TABLE pattern_detections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  pattern_type TEXT NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  evidence TEXT NOT NULL,
  detected_in_messages TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_shield_logs_message ON message_shield_logs(message_id);
CREATE INDEX idx_pattern_detections_conversation ON pattern_detections(conversation_id);
```

## Step 4: Start Server

```bash
# Development mode (hot reload)
npm run dev

# Production mode
npm run build
npm start
```

Server will start on `http://localhost:3000`

## Step 5: Test the API

### Health Check
```bash
curl http://localhost:3000/health
```

### Score a Message
```bash
curl -X POST http://localhost:3000/api/messages/score \
  -H "Content-Type: application/json" \
  -d '{"content": "Can you pick up the kids at 3pm Friday?"}'
```

Expected response:
```json
{
  "success": true,
  "scores": {
    "brief": 90,
    "informative": 85,
    "friendly": 90,
    "firm": 85,
    "overall": 87,
    "suggestions": ["Consider adding specific location"]
  }
}
```

### Rewrite a Message
```bash
curl -X POST http://localhost:3000/api/messages/rewrite \
  -H "Content-Type: application/json" \
  -d '{"content": "You never tell me anything about the kids!"}'
```

### Test Message Shield
```bash
curl -X POST http://localhost:3000/api/messages/shield \
  -H "Content-Type: application/json" \
  -d '{"content": "You are terrible at this. But can you pick them up at 3pm?"}'
```

## Common Issues

### "Missing Supabase environment variables"
- Make sure `.env` file exists and has correct values
- Check that you're in the `server/` directory
- Restart server after editing `.env`

### "Failed to score BIFF message"
- Verify Claude API key is valid
- Check API key has credits available
- Check network connectivity

### Database connection errors
- Verify Supabase URL and service role key
- Check Supabase project is active
- Ensure database tables are created

## Next Steps

1. **Connect to Mobile App**: Update app to point to your server URL
2. **Add Authentication**: Implement user auth with Supabase
3. **Deploy to Production**: See `README.md` for deployment guides
4. **Monitor Usage**: Track API costs and performance

## API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/messages/score` | POST | Score message for BIFF |
| `/api/messages/rewrite` | POST | Improve message |
| `/api/messages/suggestions` | POST | Get suggestions |
| `/api/messages/send` | POST | Send message |
| `/api/messages/shield` | POST | Filter hostile content |
| `/api/analysis/patterns` | POST | Detect manipulation |
| `/api/analysis/dashboard/:id` | GET | Analytics dashboard |

## Cost Estimates

Per message costs:
- **Scoring**: ~$0.002 (Haiku 4.5)
- **Rewriting**: ~$0.003 (Sonnet 4.6)
- **Shield**: ~$0.003 (Sonnet 4.6)
- **Pattern Detection**: ~$0.005 (Sonnet 4.6)

Typical user (30 messages/day): **~$4.65/month**

## Support

- Full docs: See `README.md`
- Issues: [GitHub Issues]
- Email: support@cleartalk.app

---

**You're ready to go!** 🚀

The server is now running and ready to process messages with AI-powered BIFF scoring, rewriting, and message shield features.
