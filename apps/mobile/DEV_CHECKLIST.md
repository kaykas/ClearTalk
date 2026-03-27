# ClearTalk Mobile - Development Checklist

Quick reference for setting up and testing the mobile app.

## Initial Setup

### Prerequisites
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Expo CLI installed (`npm install -g expo-cli`)
- [ ] iOS Simulator installed (Mac only)
- [ ] Android Studio with emulator installed
- [ ] Git installed

### Environment Setup
- [ ] Clone repository
- [ ] Navigate to `apps/mobile` directory
- [ ] Run `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Add Supabase URL to `.env`
- [ ] Add Supabase anon key to `.env`
- [ ] Add Claude API key to `.env`

### Supabase Setup
- [ ] Create Supabase project
- [ ] Run database migrations from `apps/supabase/schema.sql`
- [ ] Enable Realtime for `messages` table
- [ ] Configure RLS policies
- [ ] Test connection with Supabase Studio

### Anthropic Setup
- [ ] Create Anthropic account
- [ ] Generate Claude API key
- [ ] Verify API key works with test request
- [ ] Check API usage limits

## Development

### Running the App
- [ ] Run `npm start` successfully
- [ ] Open iOS simulator with `i`
- [ ] Open Android emulator with `a`
- [ ] View app in web browser with `w`
- [ ] Verify hot reload works

### Testing Authentication
- [ ] Sign up new account
- [ ] Receive verification email
- [ ] Verify email address
- [ ] Login with credentials
- [ ] Session persists after app restart
- [ ] Logout works correctly
- [ ] Login error handling works

### Testing Biometric Auth
- [ ] Enable biometric in settings
- [ ] Restart app
- [ ] Face ID/Touch ID prompt appears
- [ ] Successfully authenticate
- [ ] Deny authentication (shows error)
- [ ] Disable biometric in settings

### Testing Chat Features
- [ ] View conversations list
- [ ] Search conversations
- [ ] Open conversation
- [ ] Send message
- [ ] Receive message in real-time
- [ ] Message status updates (sent → delivered → read)
- [ ] Scroll to bottom on new message
- [ ] Message character count works

### Testing BIFF Coaching
- [ ] Navigate to BIFF Coach tab
- [ ] Type message
- [ ] See real-time score updates
- [ ] Scores color-coded correctly
- [ ] Suggestions appear
- [ ] Improved version appears
- [ ] Can use improved version

### Testing Compose Message
- [ ] Open conversation
- [ ] Start typing message
- [ ] BIFF score appears in real-time
- [ ] Score updates as you type
- [ ] Tap score to see coaching
- [ ] Coaching suggestions helpful
- [ ] Send button disabled if score too low
- [ ] Send button enabled when score passes threshold

### Testing Message Shield
- [ ] Navigate to Shield tab
- [ ] Change to Open level
- [ ] Save settings
- [ ] Verify saved (reload app)
- [ ] Change to Moderate level
- [ ] Change to Strict level
- [ ] Shield indicator shows correct level

### Testing Settings
- [ ] View profile information
- [ ] Toggle biometric auth
- [ ] View version number
- [ ] Sign out works

### Testing Push Notifications
- [ ] Register for push notifications
- [ ] Grant notification permissions
- [ ] Send test notification
- [ ] Receive notification in foreground
- [ ] Receive notification in background
- [ ] Tap notification opens conversation
- [ ] Push token saved to profile

### Testing Hash Chain
- [ ] Send first message
- [ ] Verify hash_chain generated
- [ ] Send second message
- [ ] Verify previous_hash matches first message
- [ ] Send third message
- [ ] Verify chain continues correctly

## Code Quality

### TypeScript
- [ ] No TypeScript errors (`npm run tsc`)
- [ ] All props typed correctly
- [ ] No `any` types used
- [ ] Imports resolve correctly

### Performance
- [ ] App loads in <3 seconds
- [ ] Conversations list scrolls smoothly
- [ ] Message composer debouncing works
- [ ] No memory leaks
- [ ] No excessive re-renders

### Error Handling
- [ ] Network errors handled gracefully
- [ ] API errors show user-friendly messages
- [ ] Loading states shown appropriately
- [ ] Empty states shown when needed

## Pre-Production

### Assets
- [ ] Create app icon (1024x1024)
- [ ] Create splash screen (1242x2436)
- [ ] Create adaptive icon (Android)
- [ ] Create favicon (48x48)
- [ ] Test assets on all device sizes

### Security
- [ ] Environment variables not committed
- [ ] API keys not exposed in client
- [ ] Supabase RLS policies configured
- [ ] Sensitive data encrypted at rest

### Testing
- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Test biometric on physical device
- [ ] Test push notifications on physical device
- [ ] Test in low network conditions
- [ ] Test with poor Claude API response time

### Documentation
- [ ] README.md updated
- [ ] Environment variables documented
- [ ] Setup instructions verified
- [ ] Troubleshooting section complete

## Production Build

### Expo Application Services (EAS)
- [ ] Install EAS CLI (`npm install -g eas-cli`)
- [ ] Login to Expo (`eas login`)
- [ ] Configure EAS (`eas build:configure`)
- [ ] Create build for iOS (`eas build --platform ios`)
- [ ] Create build for Android (`eas build --platform android`)
- [ ] Test builds on TestFlight (iOS)
- [ ] Test builds on internal testing (Android)

### App Store Submission (iOS)
- [ ] Create App Store Connect listing
- [ ] Upload screenshots
- [ ] Write app description
- [ ] Set pricing and availability
- [ ] Submit for review
- [ ] Respond to review feedback
- [ ] App approved and live

### Play Store Submission (Android)
- [ ] Create Play Console listing
- [ ] Upload screenshots
- [ ] Write app description
- [ ] Set pricing and availability
- [ ] Create release notes
- [ ] Submit for review
- [ ] App approved and live

## Post-Launch

### Monitoring
- [ ] Set up analytics
- [ ] Monitor crash reports
- [ ] Track user engagement
- [ ] Monitor API usage (Claude)
- [ ] Monitor database usage (Supabase)

### Maintenance
- [ ] Update dependencies monthly
- [ ] Fix critical bugs within 24 hours
- [ ] Release updates every 2-4 weeks
- [ ] Respond to user reviews
- [ ] Monitor app store ratings

### Feature Development
- [ ] Prioritize user feedback
- [ ] Plan feature roadmap
- [ ] Test new features thoroughly
- [ ] Release features incrementally
- [ ] Gather metrics on feature usage

---

## Quick Commands Reference

```bash
# Development
npm start              # Start dev server
npm run ios           # Run iOS simulator
npm run android       # Run Android emulator
npm run web           # Run web version

# Building
eas build --platform ios        # Build iOS
eas build --platform android    # Build Android
eas build --platform all        # Build both

# Submission
eas submit --platform ios       # Submit to App Store
eas submit --platform android   # Submit to Play Store

# Utilities
npx expo prebuild --clean       # Regenerate native projects
npx expo doctor                 # Check for issues
npx expo upgrade                # Upgrade Expo SDK
```

---

**Last Updated:** March 26, 2026
**Version:** 1.0.0
