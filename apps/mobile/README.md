# ClearTalk Mobile App

React Native mobile application for ClearTalk - high-conflict communication platform with AI-powered BIFF coaching.

## Features

- **Authentication**: Email/password with Supabase Auth
- **Biometric Login**: Face ID / Touch ID support
- **Real-time Chat**: Live message updates with Supabase Realtime
- **BIFF Scoring**: AI-powered message analysis using Claude API
- **Message Shield**: Configurable filtering levels (Open, Moderate, Strict)
- **Hash Chain Verification**: Cryptographic proof of message integrity
- **Push Notifications**: Real-time alerts for new messages
- **AI Coaching**: Real-time suggestions for improving message quality

## Tech Stack

- **Framework**: React Native with Expo SDK 51
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **UI Components**: React Native Paper
- **Backend**: Supabase (Auth, Database, Realtime)
- **AI**: Claude API (Anthropic)
- **Security**: Expo Secure Store, Expo Local Authentication
- **Notifications**: Expo Notifications

## Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator
- Supabase account with project set up
- Claude API key (Anthropic)

## Setup Instructions

### 1. Install Dependencies

```bash
cd apps/mobile
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `apps/mobile` directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Claude API Configuration
EXPO_PUBLIC_CLAUDE_API_KEY=your-claude-api-key-here

# Environment
EXPO_PUBLIC_ENVIRONMENT=development
```

**Getting Supabase Credentials:**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project or select existing project
3. Navigate to Settings → API
4. Copy the Project URL and anon/public key

**Getting Claude API Key:**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Navigate to API Keys
3. Create a new API key

### 3. Set Up Supabase Database

Ensure your Supabase database has the required tables. See `apps/supabase/schema.sql` for the complete schema, or key tables:

```sql
-- profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  shield_level TEXT DEFAULT 'moderate' CHECK (shield_level IN ('open', 'moderate', 'strict')),
  biometric_enabled BOOLEAN DEFAULT false,
  push_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES profiles(id) NOT NULL,
  user2_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  biff_score JSONB,
  hash_chain TEXT NOT NULL,
  previous_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
);
```

### 4. Run the App

**Development Server:**
```bash
npm start
```

**iOS Simulator:**
```bash
npm run ios
```

**Android Emulator:**
```bash
npm run android
```

**Web (for testing):**
```bash
npm run web
```

### 5. Testing on Physical Device

1. Install Expo Go app on your iOS/Android device
2. Run `npm start`
3. Scan the QR code with your device camera (iOS) or Expo Go app (Android)

## Project Structure

```
apps/mobile/
├── app/                          # Expo Router pages
│   ├── (tabs)/                   # Bottom tab navigation
│   │   ├── chat.tsx             # Conversations list
│   │   ├── biff.tsx             # BIFF coaching screen
│   │   ├── shield.tsx           # Message shield settings
│   │   └── settings.tsx         # User settings
│   ├── conversation/
│   │   └── [id].tsx             # Single conversation view
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # Entry point / splash
│   └── login.tsx                # Authentication screen
├── components/
│   ├── BIFFScoreBar.tsx         # BIFF score visualization
│   ├── ComposeMessage.tsx       # Message composer with AI
│   ├── MessageBubble.tsx        # Chat message component
│   └── ShieldIndicator.tsx      # Shield status indicator
├── lib/
│   ├── biometric.ts             # Biometric auth utilities
│   ├── claude.ts                # Claude API client
│   ├── notifications.ts         # Push notification setup
│   └── supabase.ts              # Supabase client & types
├── app.json                     # Expo configuration
├── package.json                 # Dependencies
└── tsconfig.json                # TypeScript config
```

## Key Features Explained

### Authentication

The app uses Supabase Auth with email/password. On signup, users can optionally enable biometric login:

- **Face ID** (iOS) - Requires `NSFaceIDUsageDescription` in `app.json`
- **Touch ID** (iOS)
- **Fingerprint** (Android) - Requires permissions in `app.json`

Credentials are stored securely using Expo Secure Store.

### BIFF Scoring

Messages are analyzed in real-time using Claude API:

```typescript
{
  "biff_score": {
    "brief": 85,        // 0-100 score
    "informative": 70,
    "friendly": 90,
    "firm": 75,
    "overall": 80       // Average
  },
  "coaching_message": "Your message is well-structured...",
  "suggestions": ["Consider removing emotional language..."]
}
```

### Message Shield Levels

1. **Open** - All messages delivered immediately (BIFF scores shown)
2. **Moderate** - Messages below 50 BIFF score held for review
3. **Strict** - All messages must meet 60+ BIFF score threshold

### Hash Chain Verification

Each message includes a SHA-256 hash chain linking to the previous message:

```typescript
hash_chain = SHA256(content + previous_hash + timestamp)
```

This creates an immutable, verifiable record of the conversation.

### Push Notifications

The app uses Expo Notifications for push alerts:

- Foreground notifications display in-app
- Background notifications trigger badge updates
- Deep linking navigates to specific conversations

## Environment-Specific Configuration

### Development

```env
EXPO_PUBLIC_ENVIRONMENT=development
```

- Uses local Expo dev server
- Hot reloading enabled
- Detailed error messages

### Production

```env
EXPO_PUBLIC_ENVIRONMENT=production
```

- Optimized bundle
- Error tracking enabled
- Production API endpoints

## Troubleshooting

### Supabase Connection Issues

**Problem:** "Failed to connect to Supabase"

**Solution:**
1. Verify `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are correct
2. Check Supabase project is active
3. Ensure Row Level Security (RLS) policies allow access

### Biometric Authentication Not Working

**Problem:** Biometric prompt doesn't appear

**Solution (iOS):**
1. Ensure `NSFaceIDUsageDescription` is in `app.json`
2. Run `npx expo prebuild` to regenerate native projects
3. Test on physical device (simulator may not support Face ID)

**Solution (Android):**
1. Check permissions in `app.json`
2. Ensure device has fingerprint/biometric hardware enrolled

### Claude API Rate Limits

**Problem:** "Rate limit exceeded"

**Solution:**
1. Implement debouncing (already included in `getBIFFCoachingDebounced`)
2. Reduce real-time analysis frequency
3. Cache recent analyses

### Push Notifications Not Received

**Problem:** Notifications don't appear

**Solution:**
1. Verify push token is saved to user profile
2. Check device notification permissions
3. Test on physical device (simulators have limited push support)
4. Ensure Expo push notification service is configured

## Building for Production

### iOS

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build iOS app
eas build --platform ios
```

### Android

```bash
# Build Android app
eas build --platform android
```

## Testing

Run tests with:

```bash
npm test
```

(Note: Test suite to be implemented - see task #10)

## Contributing

1. Follow TypeScript best practices
2. Use React Native Paper components for UI consistency
3. Implement error handling for all API calls
4. Test biometric features on physical devices
5. Document any new environment variables

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact: jascha@kaykas.com
