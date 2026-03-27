# ClearTalk - AI-Powered Co-Parenting Communication Platform

**Status:** In Development
**Timeline:** 2-3 weeks (aggressive AI-parallel execution)
**Architecture:** Turborepo monorepo, React Native + Next.js + Supabase

## 🎯 Product Vision

ClearTalk is a messaging-first co-parenting platform that uses AI to coach parents toward constructive communication **in real time**. It doesn't just document conflict after the fact - it actively prevents it.

## 📁 Project Structure

```
cleartalk/
├── apps/
│   ├── mockup/           Design prototype (Next.js) - FOR VARIANT.COM REVIEW
│   ├── mobile/           React Native (Expo) app
│   └── portal/           Professional portal (Next.js)
├── packages/
│   ├── shared/           TypeScript types, validation
│   └── ai/               AI prompts, Claude API clients
├── server/               Node.js workers (BullMQ)
└── supabase/             Migrations, Edge Functions
```

## 🎨 Design Mockup

**Location:** `apps/mockup/`

Interactive prototype showcasing:
- Chat interface with BIFF score visualization
- Real-time BIFF coaching (Brief, Informative, Friendly, Firm)
- Message shield (incoming hostile message neutralization)
- Gray rock mode
- Professional portal

**To run:**
```bash
cd ~/Documents/Work/Projects/ClearTalk
pnpm install
pnpm mockup
```

**To deploy to Vercel:**
```bash
cd apps/mockup
vercel
```

Share the Vercel URL with Variant.com for professional design feedback.

## 🚀 Core Features

### 1. AI BIFF Coaching (Outgoing Messages)
- 4-dimension real-time scoring: Brief, Informative, Friendly, Firm
- One-tap BIFF rewrites (Claude Sonnet 4.6)
- Contextual coaching tips
- Score history and trends

### 2. Message Shield (Incoming Messages)
- AI neutralizes hostile messages (preserves facts, removes manipulation)
- Three modes: Full Shield, Annotated, Off
- Pattern recognition (DARVO, gaslighting, manufactured urgency)
- Original always accessible ("View original" tap)

### 3. Gray Rock Mode
- AI-generated minimal, emotionally flat responses
- Pre-built templates for common scenarios
- One-tap activation during high-conflict periods

### 4. Solo Mode
- Works when only one parent uses ClearTalk
- SMS/email bridging via Twilio
- All bridged communication logged in unalterable record

### 5. Court-Ready
- Unalterable messaging (SHA-256 hash chain)
- Verified timestamps
- Certified PDF exports
- Free professional portal for attorneys

## 🏗️ Tech Stack

**Mobile:** React Native (Expo) + Expo Router + NativeWind
**Web:** Next.js 14 + shadcn/ui + Tailwind CSS
**Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage)
**AI:** Claude Haiku 4.5 (scoring) + Sonnet 4.6 (rewrites/shield)
**SMS:** Twilio Programmable Messaging + SendGrid
**Push:** Expo Push Notifications (APNs/FCM)
**Queue:** Upstash Redis + BullMQ
**Hosting:** Vercel (web) + Expo EAS (mobile)

## 📊 Success Criteria

- App launch: < 1.5s on iPhone 12
- BIFF scoring: < 2s (p95)
- Message rewrites: < 3s (p95)
- Notification delivery: 99.95% within 60s
- Hash chain integrity: verifiable (SHA-256)

## 🎯 Current Tasks

See `/tasks` for live progress tracking.

1. ✅ Project structure created
2. 🏗️ Design mockup (IN PROGRESS) - for Variant feedback
3. ⏳ Supabase schema (14 migrations)
4. ⏳ Mobile app foundation
5. ⏳ AI integration (Claude API)
6. ⏳ Professional portal
7. ⏳ Notification infrastructure
8. ⏳ Solo Mode (Twilio)
9. ⏳ Deploy mockup to Vercel
10. ⏳ Test suite

## 📝 Next Steps

1. **Review mockup** - Share Vercel URL with Variant.com
2. **Integrate design feedback** - Update components based on Variant's recommendations
3. **Build in parallel** - 5 specialized agents working simultaneously
4. **Deploy to production** - App Store + Vercel

---

**Built with Claude Code Agent Teams** - Parallel AI execution for 10x faster development
