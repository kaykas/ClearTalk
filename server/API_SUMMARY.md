# ClearTalk AI Server - API Summary

Quick reference for all API endpoints with examples.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently no authentication required (add JWT/API keys in production).

---

## Message Endpoints

### 1. Score Message
```bash
POST /api/messages/score
```

**Request:**
```json
{
  "content": "Can you pick up the kids at 3pm Friday?"
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
    "suggestions": ["Consider adding specific location"]
  }
}
```

---

### 2. Rewrite Message
```bash
POST /api/messages/rewrite
```

**Request:**
```json
{
  "content": "You never tell me anything about the kids!",
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
  "original": "You never tell me anything about the kids!",
  "rewritten": "Please share updates about the children's activities and school.",
  "improvements": [
    "Removed accusatory language",
    "Made request specific and clear"
  ],
  "newScores": {
    "brief": 90,
    "informative": 85,
    "friendly": 90,
    "firm": 85,
    "overall": 87
  }
}
```

---

### 3. Get Suggestions
```bash
POST /api/messages/suggestions
```

**Request:**
```json
{
  "content": "This is ridiculous! You always do this!"
}
```

**Response:**
```json
{
  "success": true,
  "suggestions": [
    "Remove emotional language",
    "Be specific about the issue",
    "State what you need clearly"
  ],
  "scores": { ... }
}
```

---

### 4. Send Message
```bash
POST /api/messages/send
```

**Request:**
```json
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
    "content": "Pickup at 3pm Friday at school.",
    "biff_score": 92,
    "hash": "abc123...",
    "previous_hash": "def456...",
    "created_at": "2026-03-26T12:00:00Z"
  },
  "scores": { ... }
}
```

---

### 5. Message Shield
```bash
POST /api/messages/shield
```

**Request:**
```json
{
  "content": "You're terrible at this! But can you pick them up at 3pm?",
  "message_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "original": "You're terrible at this! But can you pick them up at 3pm?",
  "filtered": "Pickup request: 3pm.",
  "manipulation_types": ["Personal attack"],
  "severity": "medium",
  "facts_preserved": ["Pickup time: 3pm"],
  "originalKept": false
}
```

---

### 6. Verify Hash Chain
```bash
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

---

### 7. Get Conversation
```bash
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

### 8. Detect Patterns
```bash
POST /api/analysis/patterns
```

**Request:**
```json
{
  "conversation_id": "uuid",
  "message_limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "patterns": [
    {
      "type": "DARVO",
      "confidence": 85,
      "evidence": "Pattern of deny-attack-reverse",
      "detected_in_messages": ["1", "3", "7"]
    }
  ],
  "summary": "High confidence DARVO detection.",
  "risk_level": "high"
}
```

---

### 9. Pattern History
```bash
GET /api/analysis/patterns/:conversation_id?limit=20
```

**Response:**
```json
{
  "success": true,
  "patterns": [ ... ]
}
```

---

### 10. Pattern Statistics
```bash
GET /api/analysis/patterns/stats/:conversation_id
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_detections": 15,
    "by_type": [
      { "type": "DARVO", "count": 6, "avg_confidence": 82 }
    ],
    "risk_trend": "increasing"
  }
}
```

---

### 11. Shield Statistics
```bash
GET /api/analysis/shield/stats/:conversation_id
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_filtered": 28,
    "by_severity": { "low": 8, "medium": 12, "high": 8 },
    "common_patterns": [
      { "type": "Personal attack", "count": 15 }
    ]
  }
}
```

---

### 12. BIFF History
```bash
GET /api/analysis/biff-history/:conversation_id?limit=30
```

**Response:**
```json
{
  "success": true,
  "history": [ ... ],
  "trends": {
    "overall": { "first": 65, "last": 82, "change": 17 }
  }
}
```

---

### 13. Analytics Dashboard
```bash
GET /api/analysis/dashboard/:conversation_id
```

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "biff": { "average": 78, "trend": 12 },
    "patterns": { ... },
    "shield": { ... }
  }
}
```

---

### 14. Batch Score
```bash
POST /api/analysis/batch-score
```

**Request:**
```json
{
  "messages": [
    "Can you pick up kids at 3pm?",
    "You never tell me anything!"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    { "content": "...", "scores": { ... } },
    { "content": "...", "scores": { ... } }
  ]
}
```

---

## Health Check

```bash
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

## Error Responses

All errors return:
```json
{
  "error": "Error type",
  "message": "Detailed message"
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad request
- `404` - Not found
- `500` - Server error

---

## cURL Examples

### Score Message
```bash
curl -X POST http://localhost:3000/api/messages/score \
  -H "Content-Type: application/json" \
  -d '{"content": "Can you pick up the kids at 3pm?"}'
```

### Rewrite Message
```bash
curl -X POST http://localhost:3000/api/messages/rewrite \
  -H "Content-Type: application/json" \
  -d '{"content": "You never tell me anything!"}'
```

### Message Shield
```bash
curl -X POST http://localhost:3000/api/messages/shield \
  -H "Content-Type: application/json" \
  -d '{"content": "You are terrible at this!"}'
```

### Detect Patterns
```bash
curl -X POST http://localhost:3000/api/analysis/patterns \
  -H "Content-Type: application/json" \
  -d '{"conversation_id": "uuid", "message_limit": 10}'
```

---

## JavaScript/TypeScript Examples

### Using Fetch

```typescript
// Score message
const scoreResponse = await fetch('http://localhost:3000/api/messages/score', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Can you pick up the kids at 3pm?'
  })
});
const scores = await scoreResponse.json();

// Rewrite message
const rewriteResponse = await fetch('http://localhost:3000/api/messages/rewrite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'You never tell me anything!',
    scores: scores.scores // Optional, will calculate if not provided
  })
});
const rewritten = await rewriteResponse.json();

// Apply shield
const shieldResponse = await fetch('http://localhost:3000/api/messages/shield', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Incoming hostile message...',
    message_id: 'uuid'
  })
});
const shielded = await shieldResponse.json();
```

---

## React Native Example

```typescript
import { useState } from 'react';

const API_URL = 'http://localhost:3000/api';

export function useMessageScoring() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scoreMessage = async (content: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/messages/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const data = await response.json();
      return data.scores;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rewriteMessage = async (content: string, scores?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/messages/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, scores })
      });
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { scoreMessage, rewriteMessage, loading, error };
}
```

---

## Cost Per Request

| Endpoint | Model | Cost |
|----------|-------|------|
| Score | Haiku 4.5 | $0.002 |
| Rewrite | Sonnet 4.6 | $0.003 |
| Suggestions | Haiku 4.5 | $0.002 |
| Shield | Sonnet 4.6 | $0.003 |
| Patterns | Sonnet 4.6 | $0.005 |
| Send | Haiku 4.5 | $0.002 |
| Batch Score | Haiku 4.5 | $0.002/msg |

**Typical user (30 messages/day): ~$4.65/month**

---

## Response Times

| Endpoint | Target | Typical |
|----------|--------|---------|
| Score | <500ms | 300-400ms |
| Rewrite | <2s | 1-1.5s |
| Suggestions | <500ms | 300-400ms |
| Shield | <2s | 1-1.5s |
| Patterns | <3s | 2-2.5s |
| Send | <700ms | 500-600ms |

---

## Documentation Links

- **Complete API Docs**: See `README.md`
- **Quick Start**: See `QUICKSTART.md`
- **Deployment**: See `DEPLOYMENT.md`
- **Architecture**: See `STRUCTURE.md`

---

**Version**: 1.0.0
**Last Updated**: 2026-03-26
