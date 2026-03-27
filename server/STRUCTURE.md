# ClearTalk Server - Project Structure

Complete overview of the ClearTalk AI server architecture.

## Directory Tree

```
server/
├── src/
│   ├── ai/                          # Claude API integrations
│   │   ├── biff-scorer.ts           # BIFF compliance scoring (Haiku 4.5)
│   │   ├── message-rewriter.ts      # Message improvement (Sonnet 4.6)
│   │   ├── message-shield.ts        # Hostile content filtering (Sonnet 4.6)
│   │   └── pattern-detector.ts      # Manipulation pattern detection (Sonnet 4.6)
│   │
│   ├── api/                         # REST API endpoints
│   │   ├── messages.ts              # Message operations (score, rewrite, send, shield)
│   │   └── analysis.ts              # Analytics (patterns, trends, dashboard)
│   │
│   ├── utils/                       # Utility modules
│   │   ├── supabase.ts              # Supabase client & type definitions
│   │   └── hash-chain.ts            # SHA-256 message integrity verification
│   │
│   └── index.ts                     # Express server entry point
│
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript configuration
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore rules
├── .dockerignore                    # Docker ignore rules
│
├── Dockerfile                       # Multi-stage production Docker image
├── docker-compose.yml               # Docker Compose orchestration
│
├── test-api.sh                      # API test script (bash)
│
├── README.md                        # Complete API documentation
├── QUICKSTART.md                    # 5-minute setup guide
├── DEPLOYMENT.md                    # Production deployment guide
└── STRUCTURE.md                     # This file
```

## Core Components

### AI Modules (`src/ai/`)

#### biff-scorer.ts
- **Model**: Claude Haiku 4.5 (fast, cheap)
- **Function**: Scores messages 0-100 on Brief, Informative, Friendly, Firm
- **Input**: Message text
- **Output**: Scores + improvement suggestions
- **Performance**: <500ms
- **Cost**: ~$0.002/message

#### message-rewriter.ts
- **Model**: Claude Sonnet 4.6 (high quality)
- **Function**: Rewrites messages to improve BIFF scores
- **Input**: Message text + current scores
- **Output**: Rewritten message + new scores + improvements
- **Performance**: <2s
- **Cost**: ~$0.003/message

#### message-shield.ts
- **Model**: Claude Sonnet 4.6
- **Function**: Filters hostile/manipulative content
- **Detects**: Personal attacks, guilt-tripping, gaslighting, DARVO, etc.
- **Input**: Incoming message
- **Output**: Filtered message + manipulation types + severity
- **Performance**: <2s
- **Cost**: ~$0.003/message

#### pattern-detector.ts
- **Model**: Claude Sonnet 4.6
- **Function**: Detects manipulation patterns in conversation history
- **Patterns**: DARVO, gaslighting, manufactured urgency, boundary testing, etc.
- **Input**: Last 10 messages in conversation
- **Output**: Pattern detections with confidence scores
- **Performance**: <3s
- **Cost**: ~$0.005/analysis

### API Routes (`src/api/`)

#### messages.ts
- `POST /api/messages/score` - Score message for BIFF
- `POST /api/messages/rewrite` - Improve message
- `POST /api/messages/suggestions` - Get suggestions
- `POST /api/messages/send` - Send message (with scoring + hash chain)
- `POST /api/messages/shield` - Apply message shield
- `GET /api/messages/verify/:conversation_id` - Verify hash chain
- `GET /api/messages/conversation/:conversation_id` - Get messages

#### analysis.ts
- `POST /api/analysis/patterns` - Detect manipulation patterns
- `GET /api/analysis/patterns/:conversation_id` - Get pattern history
- `GET /api/analysis/patterns/stats/:conversation_id` - Pattern statistics
- `GET /api/analysis/shield/stats/:conversation_id` - Shield statistics
- `GET /api/analysis/biff-history/:conversation_id` - BIFF score trends
- `GET /api/analysis/dashboard/:conversation_id` - Complete analytics
- `POST /api/analysis/batch-score` - Score multiple messages

### Utilities (`src/utils/`)

#### supabase.ts
- Supabase client initialization
- TypeScript type definitions for database tables
- Database interfaces: Message, MessageShieldLog, PatternDetection, Conversation

#### hash-chain.ts
- SHA-256 hash generation for message integrity
- Hash chain verification (tamper detection)
- Functions: `createMessageHash()`, `verifyMessageHash()`, `verifyHashChain()`

### Entry Point (`src/index.ts`)

Express server with:
- Security middleware (helmet, CORS)
- Request logging (morgan)
- Health check endpoint
- API route mounting
- Error handling

## Database Schema

### messages
- Message content + metadata
- BIFF scores (overall, brief, informative, friendly, firm)
- Hash chain (hash, previous_hash)
- Filtering status (is_filtered, original_content)

### message_shield_logs
- Original and filtered content
- Detected manipulation types
- Severity level (low, medium, high)
- Preserved facts

### pattern_detections
- Pattern type (DARVO, gaslighting, etc.)
- Confidence score (0-100)
- Evidence description
- Detected message IDs

### conversations
- User relationships
- Created timestamp

## Configuration Files

### package.json
- Dependencies: @anthropic-ai/sdk, @supabase/supabase-js, express
- Scripts: dev (hot reload), build, start
- DevDependencies: TypeScript, ts-node-dev

### tsconfig.json
- Target: ES2022
- Strict mode enabled
- Output: dist/
- Source maps enabled

### .env.example
- CLAUDE_API_KEY (required)
- SUPABASE_URL (required)
- SUPABASE_SERVICE_ROLE_KEY (required)
- PORT (optional, default 3000)
- NODE_ENV (optional, default development)
- ALLOWED_ORIGINS (optional, CORS config)

## Docker Setup

### Dockerfile
- Multi-stage build (builder + production)
- Node 20 Alpine (minimal image)
- Non-root user for security
- Health check included
- Production-optimized

### docker-compose.yml
- Single service configuration
- Environment variable passthrough
- Port mapping (3000)
- Auto-restart policy
- Health checks

## Testing

### test-api.sh
Bash script that tests:
- Health check
- BIFF scoring (good & bad examples)
- Message rewriting
- Message shield (hostile & clean)
- Batch operations
- Reports pass/fail with color-coded output

Usage:
```bash
./test-api.sh
```

## Documentation

### README.md (4,500 lines)
- Complete API reference
- All endpoints with examples
- Response formats
- Error handling
- Hash chain explanation
- Database schema
- Cost optimization
- Deployment guides (Railway, Render, Docker, VPS)
- Security best practices
- Troubleshooting

### QUICKSTART.md
- 5-minute setup guide
- Prerequisites
- Step-by-step installation
- Database setup SQL
- First API tests
- Common issues

### DEPLOYMENT.md (1,100 lines)
- Docker deployment
- Railway deployment (easiest)
- Render deployment
- Vercel deployment (serverless)
- VPS deployment (full control)
- Environment variables
- Production checklist
- Monitoring setup
- Scaling considerations
- Rollback procedures
- Troubleshooting

### STRUCTURE.md
- This file
- Complete project overview
- File purposes
- Component relationships

## Technology Stack

### Backend
- **Runtime**: Node.js 20
- **Language**: TypeScript 5.3
- **Framework**: Express 4.18
- **Process Manager**: PM2 (production)

### AI
- **Provider**: Anthropic Claude API
- **Models**: Haiku 4.5 (scoring), Sonnet 4.6 (rewriting/shield/patterns)
- **SDK**: @anthropic-ai/sdk 0.29

### Database
- **Platform**: Supabase (PostgreSQL)
- **SDK**: @supabase/supabase-js 2.39
- **Auth**: Service role key

### Security
- **Integrity**: SHA-256 hash chain
- **Headers**: helmet
- **CORS**: configurable origins
- **SSL**: Required for production

### DevOps
- **Containerization**: Docker
- **Orchestration**: docker-compose
- **CI/CD**: GitHub Actions ready
- **Monitoring**: Health checks, logging

## API Response Times

| Endpoint | Model | Time | Cost |
|----------|-------|------|------|
| Score message | Haiku 4.5 | <500ms | $0.002 |
| Rewrite message | Sonnet 4.6 | <2s | $0.003 |
| Message shield | Sonnet 4.6 | <2s | $0.003 |
| Pattern detection | Sonnet 4.6 | <3s | $0.005 |
| Send message | Haiku 4.5 | <700ms | $0.002 |

## Scaling Architecture

### Current (Single Server)
- Supports: 100-500 concurrent users
- Instance: 1GB RAM
- Cost: $7-25/month + API costs

### Scaled (Load Balanced)
- Supports: 1000+ concurrent users
- Instances: 2-4 servers behind load balancer
- Database: Supabase auto-scales
- Cache: Redis for BIFF scores
- Cost: $50-100/month + API costs

## Development Workflow

```bash
# Install dependencies
npm install

# Development (hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Test API
./test-api.sh

# Docker development
docker-compose up --build

# Deploy to Railway
railway up

# Deploy to Render
git push (auto-deploys)
```

## Security Features

1. **Hash Chain**: SHA-256 tamper-proof message integrity
2. **CORS**: Whitelist allowed origins
3. **Helmet**: Security headers
4. **Input Validation**: All user inputs validated
5. **Service Role Key**: Bypass RLS for admin operations
6. **Non-Root User**: Docker runs as nodejs user
7. **Environment Variables**: Secrets never committed

## Performance Optimizations

1. **Model Selection**: Haiku for scoring (3x faster than Sonnet)
2. **Prompt Caching**: System prompts cached across requests
3. **Batch Operations**: Score multiple messages simultaneously
4. **Selective Rewriting**: Only rewrite low-scoring messages
5. **Pattern Throttling**: Run detection every 5-10 messages
6. **Database Indexing**: Optimized queries with indexes

## Monitoring Points

- Health check: `GET /health`
- API response times
- Claude API latency
- Error rates by endpoint
- Memory/CPU usage
- Database query performance
- BIFF score distributions
- Pattern detection frequency

## Future Enhancements

- [ ] Redis caching for duplicate message scores
- [ ] Rate limiting per user (not just IP)
- [ ] WebSocket support for real-time updates
- [ ] Background job queue (Bull/BullMQ)
- [ ] Prometheus metrics export
- [ ] GraphQL API option
- [ ] OpenAPI/Swagger documentation
- [ ] Unit tests (Jest)
- [ ] Integration tests (Supertest)

## Related Repositories

- **Mobile App**: `/apps/mobile` (React Native)
- **Professional Portal**: `/apps/professional` (Next.js)
- **Design Mockup**: `/apps/mockup` (Next.js)
- **Database**: `/supabase` (Migrations & types)

## License

MIT License

## Support

- **Issues**: [GitHub Issues]
- **Email**: support@cleartalk.app
- **Docs**: See README.md

---

**Last Updated**: 2026-03-26
**Version**: 1.0.0
