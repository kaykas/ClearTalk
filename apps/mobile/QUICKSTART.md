# ClearTalk Mobile - Quick Start Guide

Get the mobile app running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Expo CLI installed globally: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator running

## Step 1: Install Dependencies

```bash
cd /Users/jkw/Documents/Work/Projects/ClearTalk/apps/mobile
npm install
```

## Step 2: Set Up Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

Required values:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_CLAUDE_API_KEY=sk-ant-...
```

## Step 3: Run the App

```bash
# Start development server
npm start

# Then press:
# - 'i' for iOS simulator
# - 'a' for Android emulator
# - 'w' for web browser
```

## Step 4: Test Core Features

### Authentication
1. Tap "Sign Up" on login screen
2. Enter email and password
3. Check email for verification link

### BIFF Coach
1. Navigate to "BIFF Coach" tab
2. Type a message in the text area
3. Tap "Analyze Message"
4. View AI coaching and suggestions

### Chat
1. Navigate to "Chats" tab
2. Tap the + button to start a conversation
3. Type a message
4. See real-time BIFF scoring as you type

### Message Shield
1. Navigate to "Shield" tab
2. Select shield level (Open, Moderate, Strict)
3. Tap "Save Settings"

## Common Issues

### "Cannot connect to Supabase"
- Verify `.env` file exists and has correct values
- Check Supabase project is active
- Ensure you're using the anon/public key (not service role)

### "Expo CLI not found"
```bash
npm install -g expo-cli
```

### "No iOS simulator found"
1. Open Xcode
2. Go to Xcode → Preferences → Components
3. Download iOS simulator

### "Claude API error"
- Verify API key is correct and active
- Check you have credits in Anthropic console
- Ensure key has proper permissions

## Next Steps

- [ ] Set up Supabase database schema (see `../../supabase/schema.sql`)
- [ ] Create app assets (see `ASSETS.md`)
- [ ] Configure push notifications
- [ ] Set up biometric authentication on physical device
- [ ] Test real-time message synchronization
- [ ] Deploy to Expo Application Services (EAS)

## File Structure Overview

```
apps/mobile/
├── app/                  # Screens (Expo Router)
│   ├── (tabs)/          # Bottom navigation tabs
│   │   ├── chat.tsx     # Conversations list
│   │   ├── biff.tsx     # BIFF coaching tool
│   │   ├── shield.tsx   # Message shield settings
│   │   └── settings.tsx # User settings
│   ├── conversation/[id].tsx  # Chat view
│   ├── login.tsx        # Authentication
│   └── index.tsx        # App entry point
├── components/          # Reusable UI components
├── lib/                 # Utilities and API clients
└── assets/             # Images and icons
```

## Development Tips

1. **Hot Reload**: Edit files and see changes instantly
2. **Console Logs**: View in terminal where `npm start` is running
3. **React DevTools**: Press 'j' to open debugger
4. **Error Overlay**: Tap error banner to see full stack trace
5. **Network Inspector**: Press 'd' to open dev menu → "Debug Remote JS"

## Testing Checklist

- [ ] Sign up creates new account
- [ ] Login works with correct credentials
- [ ] BIFF scoring updates in real-time
- [ ] Messages send and receive
- [ ] Conversations list updates
- [ ] Shield settings save
- [ ] Push notifications work (physical device only)
- [ ] Biometric login works (physical device only)

## Ready to Build for Production?

See the main README.md for instructions on:
- Building iOS app with EAS
- Building Android app with EAS
- Submitting to App Store / Play Store
- Configuring production environment

## Questions?

See the full README.md or contact: jascha@kaykas.com
