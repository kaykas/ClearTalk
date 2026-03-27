# ClearTalk Supabase Database - Complete Index

## Directory Structure

```
/Users/jkw/Documents/Work/Projects/ClearTalk/supabase/
├── migrations/           # 14 SQL migration files (run in order)
│   ├── 001_users_table.sql
│   ├── 002_conversations_table.sql
│   ├── 003_messages_table.sql
│   ├── 004_biff_scores_table.sql
│   ├── 005_message_shield_logs_table.sql
│   ├── 006_gray_rock_sessions_table.sql
│   ├── 007_solo_mode_config_table.sql
│   ├── 008_professional_access_table.sql
│   ├── 009_pattern_detections_table.sql
│   ├── 010_notifications_table.sql
│   ├── 011_message_attachments_table.sql
│   ├── 012_user_preferences_table.sql
│   ├── 013_audit_log_table.sql
│   └── 014_rls_policies.sql
├── config.toml          # Supabase configuration
├── seed.sql             # Test data for development
├── verify-schema.sql    # Schema verification script
├── README.md            # Comprehensive schema documentation
├── DEPLOYMENT.md        # Step-by-step deployment guide
├── QUICK_REFERENCE.md   # Quick reference for common queries
└── INDEX.md            # This file
```

## Documentation Files

### README.md (12 KB)
**Purpose:** Complete schema documentation
**Contains:**
- Schema architecture overview
- Key features (hash chain, RLS, professional access)
- BIFF analysis details
- MessageShield functionality
- Pattern detection system
- Gray rock & solo mode
- Setup instructions
- Verification procedures
- Security considerations
- Performance optimization
- Backup & recovery
- Testing guidelines
- Monitoring recommendations

**Use when:** You need to understand the database design

### DEPLOYMENT.md (11 KB)
**Purpose:** Step-by-step deployment guide
**Contains:**
- Local development setup
- Production deployment
- Migration management
- Verification checklists
- RLS policy testing
- Monitoring setup
- Backup strategy
- Troubleshooting guide
- Security hardening checklist

**Use when:** Setting up database for first time or deploying to production

### QUICK_REFERENCE.md (12 KB)
**Purpose:** Fast reference for daily development
**Contains:**
- Table overview chart
- Common SQL queries
- TypeScript types for all tables
- Supabase client usage examples
- Realtime subscription examples
- Performance tips
- Security best practices

**Use when:** Writing code that interacts with database

### INDEX.md (This file)
**Purpose:** Navigation guide
**Contains:**
- File structure overview
- What each document contains
- Quick links to all files

**Use when:** First time exploring database or looking for specific file

## Migration Files

### Core Tables (001-003)
- **001_users_table.sql** - User profiles with parent relationships
- **002_conversations_table.sql** - Conversation threads between parents
- **003_messages_table.sql** - Messages with SHA-256 hash chain integrity

### AI & Analysis (004-005)
- **004_biff_scores_table.sql** - BIFF (Brief, Informative, Friendly, Firm) scoring
- **005_message_shield_logs_table.sql** - Manipulation detection and filtering

### Special Modes (006-007)
- **006_gray_rock_sessions_table.sql** - Gray rock technique tracking
- **007_solo_mode_config_table.sql** - Solo mode for non-responsive co-parents

### Access & Features (008-011)
- **008_professional_access_table.sql** - Attorney/mediator read-only access
- **009_pattern_detections_table.sql** - Long-term manipulation pattern tracking
- **010_notifications_table.sql** - Multi-channel notification delivery
- **011_message_attachments_table.sql** - File uploads with malware scanning

### Settings & Audit (012-014)
- **012_user_preferences_table.sql** - User settings and preferences
- **013_audit_log_table.sql** - Append-only audit trail (immutable)
- **014_rls_policies.sql** - Row-level security for all tables

## Support Files

### config.toml
**Purpose:** Supabase local configuration
**Contains:**
- Database ports and settings
- Storage configuration
- Auth provider settings
- API configuration

**Use when:** Running Supabase locally

### seed.sql (7 KB)
**Purpose:** Test data for development
**Contains:**
- 2 test users (Parent A and Parent B)
- 1 conversation between them
- 5 sample messages with hash chain
- BIFF scores for messages
- Sample notifications and patterns
- Hash chain integrity verification

**Use when:** Setting up local development environment

### verify-schema.sql (7 KB)
**Purpose:** Database health check
**Contains:**
- Checks for all 13 tables
- RLS enablement verification
- Policy count verification
- Index existence checks
- Trigger verification
- Hash chain integrity test
- Database size metrics
- Row count summaries

**Use when:** After deployment or when troubleshooting issues

## Quick Start Guide

### 1. First Time Setup (Local)
```bash
cd /Users/jkw/Documents/Work/Projects/ClearTalk
supabase start
supabase db reset
```
**Read:** DEPLOYMENT.md → "Local Development Setup"

### 2. Understanding the Schema
**Read:** README.md → "Schema Architecture" section

### 3. Deploy to Production
```bash
supabase link --project-ref your-project-ref
supabase db push
```
**Read:** DEPLOYMENT.md → "Production Deployment"

### 4. Verify Deployment
```bash
psql -h your-db-host -U postgres -d postgres -f verify-schema.sql
```
**Read:** README.md → "Verification" section

### 5. Start Coding
**Reference:** QUICK_REFERENCE.md for all queries and types

## Key Concepts

### Hash Chain Integrity
Every message is linked to the previous message via SHA-256 hash, creating an unbreakable chain that proves message order and prevents tampering.

**Documentation:** README.md → "Hash Chain Integrity"
**Implementation:** 003_messages_table.sql

### Row-Level Security (RLS)
Users can ONLY access their own data. All database access is filtered by user ID from JWT token.

**Documentation:** README.md → "Multi-Tenant RLS"
**Implementation:** 014_rls_policies.sql

### Immutable Messages
Messages cannot be edited once sent. Content, sender, and timestamps are locked.

**Documentation:** README.md → "Immutable Messages"
**Implementation:** 003_messages_table.sql (trigger: prevent_message_tampering)

### Professional Access
Attorneys/mediators can be granted temporary, revocable, read-only access to conversations.

**Documentation:** README.md → "Professional Access"
**Implementation:** 008_professional_access_table.sql

### BIFF Scoring
AI evaluates every message on Brief, Informative, Friendly, Firm dimensions.

**Documentation:** README.md → "BIFF Analysis"
**Implementation:** 004_biff_scores_table.sql

### MessageShield
AI detects and filters manipulative communication patterns.

**Documentation:** README.md → "MessageShield"
**Implementation:** 005_message_shield_logs_table.sql

### Pattern Detection
Long-term tracking of manipulation patterns (DARVO, gaslighting, etc.)

**Documentation:** README.md → "Pattern Detection"
**Implementation:** 009_pattern_detections_table.sql

### Gray Rock Mode
AI transforms user responses to be emotionally neutral.

**Documentation:** README.md → "Gray Rock Mode"
**Implementation:** 006_gray_rock_sessions_table.sql

### Solo Mode
Continue documenting communication when co-parent is non-responsive.

**Documentation:** README.md → "Solo Mode"
**Implementation:** 007_solo_mode_config_table.sql

## Database Statistics

- **Total Tables:** 13 (plus 3 views)
- **Total Migrations:** 14 (including RLS policies)
- **Total Indexes:** 50+ (all critical paths covered)
- **Total Triggers:** 15+ (auto-updates, hash chain, audit)
- **Total Functions:** 16 (hash chain, audit, validation)
- **Total RLS Policies:** 40+ (complete multi-tenant isolation)
- **Total Enums:** 9 (type safety for all status fields)

## File Sizes

| File | Size | Lines |
|------|------|-------|
| 001_users_table.sql | 1.4 KB | ~60 |
| 002_conversations_table.sql | 1.5 KB | ~60 |
| 003_messages_table.sql | 5.2 KB | ~210 |
| 004_biff_scores_table.sql | 1.8 KB | ~70 |
| 005_message_shield_logs_table.sql | 2.3 KB | ~95 |
| 006_gray_rock_sessions_table.sql | 2.4 KB | ~100 |
| 007_solo_mode_config_table.sql | 2.8 KB | ~115 |
| 008_professional_access_table.sql | 3.4 KB | ~140 |
| 009_pattern_detections_table.sql | 3.8 KB | ~155 |
| 010_notifications_table.sql | 4.0 KB | ~165 |
| 011_message_attachments_table.sql | 3.0 KB | ~125 |
| 012_user_preferences_table.sql | 4.0 KB | ~165 |
| 013_audit_log_table.sql | 6.4 KB | ~265 |
| 014_rls_policies.sql | 15 KB | ~620 |
| **Total Migrations** | **57 KB** | **~2,345 lines** |
| seed.sql | 7.1 KB | ~290 |
| config.toml | 958 B | ~40 |
| verify-schema.sql | 7.2 KB | ~295 |
| README.md | 12 KB | ~480 |
| DEPLOYMENT.md | 11 KB | ~440 |
| QUICK_REFERENCE.md | 12 KB | ~485 |

## Related Documentation

### In This Repository
- `/apps/mobile/README.md` - Mobile app documentation
- `/apps/web/README.md` - Professional portal documentation
- `/packages/shared/README.md` - Shared types and utilities

### External
- Supabase Documentation: https://supabase.com/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Row-Level Security: https://supabase.com/docs/guides/auth/row-level-security

## Migration History

| Date | Version | Description |
|------|---------|-------------|
| 2026-03-26 | v1.0 | Initial schema with 14 migrations |

## Next Steps

### For Developers
1. Read QUICK_REFERENCE.md for common queries
2. Set up local environment using DEPLOYMENT.md
3. Run seed.sql to get test data
4. Start building against the API

### For DevOps
1. Read DEPLOYMENT.md completely
2. Set up production Supabase project
3. Configure auth providers
4. Run migrations: `supabase db push`
5. Run verify-schema.sql to confirm
6. Set up monitoring and backups

### For Security Review
1. Read README.md → "Security Considerations"
2. Review 014_rls_policies.sql
3. Test RLS enforcement
4. Review audit_log implementation
5. Verify hash chain integrity
6. Check professional access controls

## Support

- **Schema Questions:** See README.md
- **Deployment Issues:** See DEPLOYMENT.md
- **Query Help:** See QUICK_REFERENCE.md
- **Bug Reports:** Create issue in project repository
- **Security Issues:** Contact security team directly

## License

Proprietary - ClearTalk Inc. 2026

---

**Last Updated:** 2026-03-26
**Schema Version:** 1.0
**Migration Count:** 14
