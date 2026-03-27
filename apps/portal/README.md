# ClearTalk Professional Portal

Secure attorney portal for accessing ClearTalk conversations with certified PDF exports and cryptographic verification.

## Features

### Authentication & Access Control
- **Attorney-only access** - Email/password authentication with role verification
- **RLS-protected data** - Attorneys can only access conversations they've been granted permission to view
- **Access levels** - `view_only` or `export` permissions per conversation

### Conversation Management
- **Client list** - Browse all conversations with access granted
- **Search & filter** - Find clients by name, case number, or jurisdiction
- **Status indicators** - Active, archived, or suspended conversation states
- **Message counts** - Quick overview of conversation activity

### Message Timeline
- **Chronological view** - All messages displayed in time order
- **BIFF scoring** - Each message rated for Brief, Informative, Friendly, Firm communication
- **Content filtering** - Side-by-side comparison of filtered vs. original content
- **Pattern detection** - Hostile language, manipulative tactics, and other patterns flagged
- **Message metadata** - Timestamps, senders, recipients, and verification hashes

### Hash Chain Verification
- **Cryptographic integrity** - SHA-256 hash chain ensures messages haven't been tampered with
- **Real-time verification** - Automatic verification on page load
- **Tampering detection** - Visual alerts if hash chain is compromised
- **Detailed reports** - Per-message verification status with error messages

### BIFF Analytics
- **Trend analysis** - Line chart showing communication quality over time
- **Score distribution** - Breakdown of excellent, good, and poor BIFF scores
- **Insights** - AI-generated recommendations based on communication patterns

### Court-Ready PDF Export
- **Professional formatting** - Multi-page PDF with headers, footers, and page numbers
- **Cover page** - Case information, export metadata, attorney details
- **Message timeline table** - All messages with BIFF scores, patterns, and filtering status
- **Hash verification report** - Complete cryptographic audit trail
- **Certification page** - Attorney signature line and document hash for court submission
- **Watermarks** - "CERTIFIED COURT RECORD" on every page

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **PDF Generation**: jsPDF with autoTable
- **Charts**: Recharts
- **Icons**: Lucide React
- **Cryptography**: Web Crypto API (SHA-256)

## Setup

### Prerequisites

- Node.js 18+ installed
- Supabase project created with database schema deployed
- Attorney accounts created in users table with `role = 'attorney'`

### Installation

```bash
# Navigate to portal directory
cd apps/portal

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your Supabase credentials
nano .env.local
```

### Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Development

```bash
# Run development server (port 3001 to avoid conflicts)
npm run dev

# Open in browser
open http://localhost:3001
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start

# Or deploy to Vercel
vercel deploy
```

## Database Schema

### Tables Required

**users**
- `id` (uuid, primary key)
- `email` (text, unique)
- `full_name` (text)
- `role` (enum: 'parent' | 'attorney' | 'admin')

**conversations**
- `id` (uuid, primary key)
- `participant_a_id` (uuid, foreign key → users)
- `participant_b_id` (uuid, foreign key → users)
- `case_number` (text, nullable)
- `jurisdiction` (text, nullable)
- `status` (enum: 'active' | 'archived' | 'suspended')

**messages**
- `id` (uuid, primary key)
- `conversation_id` (uuid, foreign key → conversations)
- `sender_id` (uuid, foreign key → users)
- `recipient_id` (uuid, foreign key → users)
- `original_content` (text)
- `filtered_content` (text)
- `was_filtered` (boolean)
- `biff_score` (integer, 0-100)
- `hostile_language_count` (integer)
- `pattern_flags` (text array)
- `message_hash` (text) - SHA-256 hash of message content
- `previous_hash` (text, nullable) - Hash of previous message in chain
- `created_at` (timestamp)

**professional_access**
- `id` (uuid, primary key)
- `conversation_id` (uuid, foreign key → conversations)
- `professional_id` (uuid, foreign key → users)
- `granted_by` (uuid, foreign key → users)
- `granted_at` (timestamp)
- `access_level` (enum: 'view_only' | 'export')

### Row Level Security (RLS) Policies

**professional_access table:**
```sql
-- Attorneys can only see their own access grants
CREATE POLICY "Attorneys can view own access"
ON professional_access
FOR SELECT
TO authenticated
USING (professional_id = auth.uid());
```

**conversations table:**
```sql
-- Attorneys can view conversations they have access to
CREATE POLICY "Attorneys can view granted conversations"
ON conversations
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT conversation_id
    FROM professional_access
    WHERE professional_id = auth.uid()
  )
);
```

**messages table:**
```sql
-- Attorneys can view messages in conversations they have access to
CREATE POLICY "Attorneys can view messages in granted conversations"
ON messages
FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT conversation_id
    FROM professional_access
    WHERE professional_id = auth.uid()
  )
);
```

## Usage

### Granting Attorney Access

To grant an attorney access to a conversation, insert a row into `professional_access`:

```sql
INSERT INTO professional_access (
  conversation_id,
  professional_id,
  granted_by,
  granted_at,
  access_level
) VALUES (
  '<conversation_id>',
  '<attorney_user_id>',
  '<parent_user_id>',
  NOW(),
  'export' -- or 'view_only'
);
```

### Attorney Login

1. Navigate to `/login`
2. Enter attorney email and password
3. System verifies `role = 'attorney'` in users table
4. Redirects to `/clients` dashboard

### Viewing Conversations

1. Click on a client conversation card
2. View message timeline with BIFF scores
3. Check hash chain verification status
4. Analyze BIFF score trends over time

### Exporting to PDF

1. Open a conversation
2. Click "Export to PDF" (requires `access_level = 'export'`)
3. Review export details and included features
4. Click "Generate Court-Ready PDF"
5. PDF downloads with certified court record format

## Security Features

### Hash Chain Integrity

Each message contains:
- **message_hash**: SHA-256(previous_hash + message_content)
- **previous_hash**: Hash of the previous message in the chain

This creates an immutable chain where:
- Any tampering with message content invalidates the hash
- Any deletion of messages breaks the chain
- Verification happens in browser using Web Crypto API

### Access Control

- **Authentication required** - All routes protected by Supabase Auth
- **Role verification** - Only users with `role = 'attorney'` can access portal
- **RLS enforcement** - Database-level access control ensures attorneys only see granted conversations
- **Access level checks** - Export functionality requires explicit `export` permission

### PDF Certification

- **Document hash** - SHA-256 hash of entire PDF content included on certification page
- **Watermarks** - "CERTIFIED COURT RECORD" on every page to prevent unauthorized reproduction
- **Attorney signature** - Signature line and professional credentials
- **Hash verification report** - Complete audit trail of cryptographic verification

## File Structure

```
apps/portal/
├── app/
│   ├── layout.tsx              # Root layout with dark theme
│   ├── page.tsx                # Redirects to /login
│   ├── globals.css             # Tailwind styles
│   ├── login/
│   │   └── page.tsx            # Attorney authentication
│   ├── clients/
│   │   ├── page.tsx            # Client list dashboard
│   │   └── [id]/
│   │       ├── page.tsx        # Conversation view
│   │       └── export/page.tsx # PDF export
│   └── api/
│       └── auth/
│           └── signout/route.ts # Sign out endpoint
├── components/
│   ├── MessageTimeline.tsx     # Chronological message list
│   ├── HashVerification.tsx    # Hash chain verification
│   └── BIFFAnalytics.tsx       # BIFF score charts
├── lib/
│   ├── supabase.ts             # Supabase clients & types
│   ├── utils.ts                # Utility functions
│   ├── hash-verifier.ts        # SHA-256 verification
│   └── pdf-generator.ts        # Court-ready PDF creation
├── public/                     # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel deploy

# Set environment variables in Vercel dashboard
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - NEXT_PUBLIC_APP_URL
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## Troubleshooting

### "Access denied" on login
- Verify user has `role = 'attorney'` in users table
- Check Supabase Auth is configured correctly
- Ensure RLS policies are enabled

### Can't see any conversations
- Verify professional_access rows exist for the attorney
- Check conversation_id and professional_id are correct UUIDs
- Confirm RLS policies allow SELECT access

### Hash verification fails
- Check message_hash and previous_hash are correctly stored
- Verify messages are sorted by created_at
- Ensure Web Crypto API is available (HTTPS required in production)

### PDF export fails
- Check browser console for errors
- Verify jsPDF and autoTable are installed
- Ensure messages array is not empty

## Performance

- **Server-side rendering** - Initial page loads fast with RSC
- **Client-side verification** - Hash chain verification runs in browser
- **Optimistic UI** - React components render immediately
- **Lazy loading** - Components load on demand

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires:
- Web Crypto API for hash verification
- ES2020+ for modern JavaScript features

## License

Proprietary - ClearTalk Communication Platform

## Support

For issues, contact the ClearTalk development team.
