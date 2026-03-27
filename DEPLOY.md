# ClearTalk - Deployment Instructions

## 🎨 Design Mockup - Deploy to Vercel NOW

### Quick Deploy (Recommended)

```bash
cd ~/Documents/Work/Projects/ClearTalk/apps/mockup
npx vercel
```

Follow the prompts:
1. "Set up and deploy?" → Yes
2. "Which scope?" → Your Vercel account
3. "Link to existing project?" → No
4. "What's your project's name?" → cleartalk-mockup
5. "In which directory is your code located?" → ./
6. Deploy!

Vercel will give you a URL like: `https://cleartalk-mockup.vercel.app`

### Share with Variant.com

Once deployed, share the Vercel URL with Variant for professional design feedback.

The mockup demonstrates:
- ✅ Chat interface with BIFF score visualization
- ✅ Compose screen with real-time BIFF coaching
- ✅ Message shield (neutralization demo)
- ✅ Professional portal preview
- ✅ Feature explanations
- ✅ Interactive tabs for exploring features

## 🏗️ Production Deployment (After Variant Feedback)

### Mobile App (React Native/Expo)

```bash
# Install Expo EAS CLI
npm install -g eas-cli

# Configure EAS
cd apps/mobile
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to App Stores
eas submit --platform ios
eas submit --platform android
```

### Web Portal (Next.js)

```bash
cd apps/portal
npx vercel --prod
```

### Supabase Backend

```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
cd supabase
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy
```

## 🔑 Environment Variables Needed

Create `.env.local` files in each app:

**apps/mockup/.env.local:**
```
# None needed for mockup
```

**apps/mobile/.env.local:**
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_CLAUDE_API_KEY=your_claude_key
EXPO_PUBLIC_TWILIO_ACCOUNT_SID=your_twilio_sid
```

**apps/portal/.env.local:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

**server/.env:**
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
CLAUDE_API_KEY=your_claude_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
SENDGRID_API_KEY=your_sendgrid_key
REDIS_URL=your_redis_url
```

## 📊 Current Status

- ✅ **Mockup** - Ready to deploy
- ⏳ **Database** - Schema designed, migrations to be created
- ⏳ **Mobile App** - Foundation to be built
- ⏳ **AI Integration** - Claude API clients to be implemented
- ⏳ **Professional Portal** - To be built after mockup feedback
- ⏳ **Infrastructure** - Twilio, notifications, Solo Mode to be implemented

## 🚀 Next Steps

1. **Deploy mockup to Vercel** (run command above)
2. **Share with Variant.com** for design feedback
3. **Integrate design improvements**
4. **Start parallel build** of remaining features (database, mobile app, AI, portal, infrastructure)

Estimated timeline: **2-3 weeks** with parallel AI execution
