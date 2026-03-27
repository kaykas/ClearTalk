# ClearTalk Environment Setup

## ✅ Configured

### Anthropic Claude API
- **Status:** ✅ Configured
- **Key:** `sk-ant-...xQ-cS1a4gAA` (ends in)
- **Location:**
  - `server/.env`
  - `apps/mobile/.env`

## ⏳ Pending Configuration

### 1. Supabase Credentials

You need to add your Supabase credentials to 3 files:

**Files to update:**
- `server/.env`
- `apps/mobile/.env`
- `apps/portal/.env.local`

**Credentials needed:**
- **SUPABASE_URL** - Your project URL (format: `https://xxxxx.supabase.co`)
- **SUPABASE_ANON_KEY** - Public anonymous key (safe for client-side)
- **SUPABASE_SERVICE_ROLE_KEY** - Admin key (server-side only)

**Where to find them:**
1. Go to your Supabase project dashboard
2. Click "Settings" → "API"
3. Copy the values

---

### 2. Twilio (SMS Notifications)

**Sign up:** https://www.twilio.com/try-twilio

**What you'll get:**
- **Account SID** (starts with `AC...`)
- **Auth Token**
- **Phone Number** (buy one: ~$1/month)

**After signup:**
1. Go to Console Dashboard
2. Copy Account SID and Auth Token
3. Go to Phone Numbers → Buy a Number
4. Add all 3 values to `server/.env`

**Pricing:** $0.0075 per SMS

---

### 3. SendGrid (Email Notifications)

**Sign up:** https://sendgrid.com

**What you'll get:**
- **API Key** (starts with `SG.`)
- **Verified Sender Email**

**After signup:**
1. Settings → API Keys → Create API Key (Full Access)
2. Copy the key (shows only once!)
3. Settings → Sender Authentication → Verify Single Sender
4. Verify your email address
5. Add both values to `server/.env`

**Pricing:** Free for 100 emails/day

---

## 🔧 Quick Commands

**After you have all keys, update the files:**

```bash
# Server
nano /Users/jkw/Documents/Work/Projects/ClearTalk/server/.env

# Mobile
nano /Users/jkw/Documents/Work/Projects/ClearTalk/apps/mobile/.env

# Portal
nano /Users/jkw/Documents/Work/Projects/ClearTalk/apps/portal/.env.local
```

**Test the setup:**

```bash
# Test server
cd /Users/jkw/Documents/Work/Projects/ClearTalk/server
npm run dev

# Test mobile
cd /Users/jkw/Documents/Work/Projects/ClearTalk/apps/mobile
npm start

# Test portal
cd /Users/jkw/Documents/Work/Projects/ClearTalk/apps/portal
npm run dev
```

---

## 📋 Checklist

- [x] Anthropic Claude API Key configured
- [ ] Supabase credentials added (URL, anon key, service role key)
- [ ] Twilio credentials added (Account SID, Auth Token, Phone Number)
- [ ] SendGrid credentials added (API Key, From Email)
- [ ] Database migrations run (`supabase db push`)
- [ ] Test data seeded
- [ ] All apps tested locally

---

## 🆘 Need Help?

Once you have the Twilio and SendGrid keys, give them to me and I'll update all the files automatically.
