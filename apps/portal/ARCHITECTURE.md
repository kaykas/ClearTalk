# ClearTalk Professional Portal - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Attorney)                      │
├─────────────────────────────────────────────────────────────┤
│  Next.js App Router (React Server Components + Client)      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Login      │  │   Clients    │  │ Conversation │      │
│  │   Page       │→ │   Dashboard  │→ │    View      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                              ↓               │
│                                      ┌──────────────┐        │
│                                      │  PDF Export  │        │
│                                      └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                     Supabase Backend                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Supabase     │  │  PostgreSQL  │  │     RLS      │      │
│  │   Auth       │→ │   Database   │→ │   Policies   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Authentication Flow
1. Attorney enters email/password on `/login`
2. Supabase Auth validates credentials
3. Check `users.role = 'attorney'` in database
4. Create session and redirect to `/clients`

### Conversation Access Flow
1. Attorney views `/clients` dashboard
2. Query `professional_access` table with `professional_id = auth.uid()`
3. RLS policy enforces: only return conversations where access granted
4. Display client cards with metadata

### Message Timeline Flow
1. Attorney clicks conversation → navigate to `/clients/[id]`
2. Query `messages` table with `conversation_id = [id]`
3. RLS policy enforces: only return if attorney has access via `professional_access`
4. Render MessageTimeline component with messages
5. Trigger hash chain verification in browser
6. Display BIFF analytics chart

### PDF Export Flow
1. Attorney clicks "Export to PDF"
2. Navigate to `/clients/[id]/export`
3. Client-side: Fetch conversation + messages + attorney info
4. Run hash chain verification (SHA-256 in browser)
5. Generate PDF with jsPDF:
   - Cover page with case info
   - Message timeline table
   - Hash verification report
   - Certification page with document hash
6. Download PDF to attorney's device

## Component Architecture

### Server Components (RSC)
- **app/clients/page.tsx** - Fetches client list server-side
- **app/clients/[id]/page.tsx** - Fetches conversation + messages server-side
- Pros: Fast initial render, SEO-friendly, secure data fetching

### Client Components
- **components/MessageTimeline.tsx** - Interactive message list
- **components/HashVerification.tsx** - Real-time hash verification
- **components/BIFFAnalytics.tsx** - Recharts visualization
- **app/clients/[id]/export/page.tsx** - PDF generation (browser-side)
- Pros: Interactivity, client-side crypto, dynamic charts

## Security Architecture

### Authentication
- Supabase Auth with email/password
- JWT tokens stored in HTTP-only cookies
- Automatic token refresh

### Authorization
- **Database-level**: RLS policies on all tables
- **Application-level**: Role verification in middleware
- **Access-level**: `view_only` vs `export` permissions

### Cryptographic Verification
```
Message Chain:
Message 1: hash = SHA256("" + content1)
Message 2: hash = SHA256(hash1 + content2)
Message 3: hash = SHA256(hash2 + content3)
...

Each message stores:
- message_hash: SHA256(previous_hash + content)
- previous_hash: hash of previous message

Verification:
For each message:
  computed_hash = SHA256(previous_hash + content)
  if computed_hash != stored_hash:
    TAMPERING DETECTED
```

### PDF Integrity
```
Document Hash = SHA256(JSON.stringify({
  messages,
  case_number,
  export_date,
  attorney_id
}))

Printed on certification page
→ Anyone can recompute hash and verify PDF hasn't been altered
```

## Database Schema

### Core Tables

**users** (Supabase Auth integration)
```sql
id            uuid PRIMARY KEY
email         text UNIQUE
full_name     text
role          enum ('parent', 'attorney', 'admin')
created_at    timestamp
```

**conversations**
```sql
id                uuid PRIMARY KEY
participant_a_id  uuid → users(id)
participant_b_id  uuid → users(id)
case_number       text NULL
jurisdiction      text NULL
status            enum ('active', 'archived', 'suspended')
created_at        timestamp
```

**messages**
```sql
id                     uuid PRIMARY KEY
conversation_id        uuid → conversations(id)
sender_id              uuid → users(id)
recipient_id           uuid → users(id)
original_content       text
filtered_content       text
was_filtered           boolean
biff_score             integer (0-100)
hostile_language_count integer
pattern_flags          text[]
message_hash           text  -- SHA-256 hash
previous_hash          text NULL
created_at             timestamp
```

**professional_access** (Access control)
```sql
id               uuid PRIMARY KEY
conversation_id  uuid → conversations(id)
professional_id  uuid → users(id)  -- Attorney
granted_by       uuid → users(id)  -- Parent who granted access
granted_at       timestamp
access_level     enum ('view_only', 'export')
```

### RLS Policies

**professional_access**
```sql
CREATE POLICY "view_own_access"
ON professional_access FOR SELECT
USING (professional_id = auth.uid());
```

**conversations**
```sql
CREATE POLICY "view_granted_conversations"
ON conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM professional_access
    WHERE conversation_id = conversations.id
      AND professional_id = auth.uid()
  )
);
```

**messages**
```sql
CREATE POLICY "view_messages_in_granted_conversations"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM professional_access
    WHERE conversation_id = messages.conversation_id
      AND professional_id = auth.uid()
  )
);
```

## File Structure

```
apps/portal/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (dark theme)
│   ├── page.tsx                  # Redirect to /login
│   ├── globals.css               # Tailwind styles
│   │
│   ├── login/                    # Authentication
│   │   └── page.tsx              # Login form
│   │
│   ├── clients/                  # Client management
│   │   ├── page.tsx              # Client list (RSC)
│   │   └── [id]/                 # Dynamic conversation routes
│   │       ├── page.tsx          # Conversation view (RSC)
│   │       └── export/
│   │           └── page.tsx      # PDF export (Client)
│   │
│   └── api/                      # API routes
│       └── auth/
│           └── signout/
│               └── route.ts      # Sign out endpoint
│
├── components/                   # React components
│   ├── MessageTimeline.tsx       # Message list with BIFF scores
│   ├── HashVerification.tsx      # Real-time hash verification
│   └── BIFFAnalytics.tsx         # Charts and insights
│
├── lib/                          # Utilities and services
│   ├── supabase.ts               # Supabase clients + TypeScript types
│   ├── utils.ts                  # Helper functions (date format, colors)
│   ├── hash-verifier.ts          # SHA-256 verification logic
│   └── pdf-generator.ts          # Court-ready PDF generation
│
├── public/                       # Static assets
├── .env.local.example            # Environment template
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind CSS config
├── next.config.js                # Next.js config
├── postcss.config.js             # PostCSS config
├── .eslintrc.json                # ESLint config
├── .gitignore                    # Git ignore rules
│
├── README.md                     # Full documentation
├── QUICKSTART.md                 # 5-minute setup guide
└── ARCHITECTURE.md               # This file
```

## Key Design Decisions

### Why Next.js App Router?
- **RSC**: Server-side data fetching for security (Supabase queries never exposed to client)
- **Performance**: Fast initial page loads
- **SEO**: Better for legal discovery/indexing
- **Streaming**: Progressive rendering of large message lists

### Why Supabase?
- **Built-in Auth**: No need to implement JWT handling
- **RLS**: Database-level security (defense in depth)
- **Real-time**: Future feature for live message updates
- **PostgreSQL**: Reliable, ACID-compliant for legal records

### Why Client-Side Hash Verification?
- **Transparency**: Attorney can verify integrity in their own browser
- **Auditability**: Verification logic is open and inspectable
- **Performance**: SHA-256 is fast in Web Crypto API
- **Security**: No server can tamper with verification process

### Why jsPDF for PDF Generation?
- **Client-side**: No server processing = more secure
- **Court-ready**: Full control over formatting, watermarks, certification
- **Instant**: No API calls, no waiting
- **Portable**: PDF generated in browser works everywhere

## Performance Optimizations

### Server-Side Rendering
- Initial HTML rendered on server
- Faster Time to First Byte (TTFB)
- Better SEO for legal discoverability

### Static Asset Optimization
- Tailwind CSS purging (only used classes included)
- Tree-shaking removes unused code
- Minification in production build

### Database Query Optimization
- Indexes on foreign keys
- SELECT only required fields
- Batch queries where possible
- RLS policies use indexed columns

### Client-Side Caching
- React Server Components cache
- Browser HTTP cache for static assets
- Supabase client caches queries

## Deployment

### Vercel (Recommended)
- Automatic HTTPS
- Edge network (fast worldwide)
- Zero-config Next.js deployment
- Environment variable management
- Preview deployments for testing

### Docker (Self-hosted)
- Full control over infrastructure
- Can run on-premises for compliance
- Kubernetes-compatible
- See Dockerfile in README

## Monitoring & Observability

### Logging
- Server-side logs in Vercel dashboard
- Client-side errors captured in browser console
- Supabase logs in Supabase dashboard

### Metrics
- Web Vitals (LCP, FID, CLS)
- API response times
- Database query performance
- Authentication success/failure rates

### Alerts
- Failed logins (security)
- Hash verification failures (tampering)
- Database connection errors
- High latency warnings

## Future Enhancements

### Phase 2 Features
- **Real-time updates**: Live message notifications using Supabase Realtime
- **Advanced filtering**: Date range, BIFF score threshold, pattern type
- **Bulk export**: Export multiple conversations at once
- **Email notifications**: Alert attorneys when new messages arrive
- **Audit log**: Track attorney access for compliance

### Phase 3 Features
- **Mobile app**: React Native attorney portal
- **2FA**: Two-factor authentication for extra security
- **E-signature**: Digital signature on PDF exports
- **Subpoena automation**: Generate subpoena requests from portal
- **Analytics dashboard**: Aggregate statistics across all clients

## Security Considerations

### OWASP Top 10 Mitigations

1. **Broken Access Control** → RLS policies + role verification
2. **Cryptographic Failures** → HTTPS + SHA-256 hashing + secure cookies
3. **Injection** → Parameterized queries (Supabase handles this)
4. **Insecure Design** → Principle of least privilege (RLS)
5. **Security Misconfiguration** → Environment variables, no secrets in code
6. **Vulnerable Components** → Regular dependency updates
7. **Auth Failures** → Supabase Auth + JWT tokens + HTTP-only cookies
8. **Data Integrity Failures** → Hash chain verification
9. **Logging Failures** → Server and client-side logging
10. **SSRF** → No user-controlled URLs

### Compliance Considerations

- **HIPAA**: Encrypted at rest (Supabase) and in transit (HTTPS)
- **GDPR**: User data deletion support (future feature)
- **Legal admissibility**: Hash chain + PDF certification meets evidence standards
- **Audit trail**: professional_access table tracks all grants

## Testing Strategy

### Unit Tests
- Hash verification functions
- PDF generation logic
- Utility functions (date formatting, score calculations)

### Integration Tests
- Authentication flow
- RLS policy enforcement
- Message retrieval with access control

### E2E Tests
- Complete attorney workflow (login → view → export)
- PDF generation and download
- Hash verification UI

### Security Tests
- Attempt to access unauthorized conversations
- SQL injection testing (Supabase client handles this)
- XSS testing (React escapes by default)

## Conclusion

The ClearTalk Professional Portal is a secure, high-performance Next.js application designed specifically for legal professionals to access court-admissible communication records. The architecture prioritizes security (RLS, hash chains), performance (RSC, Vercel Edge), and legal compliance (PDF certification, audit trails).

All code is production-ready and follows Next.js 14 best practices. The system is fully typed with TypeScript and styled with Tailwind CSS for consistency and maintainability.
