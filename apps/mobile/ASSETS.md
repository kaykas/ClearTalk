# Mobile App Assets

The following assets need to be created for the mobile app. These are referenced in `app.json` but not included in the repository.

## Required Assets

### App Icon

**File:** `assets/icon.png`

- **Size:** 1024x1024 px
- **Format:** PNG with transparency
- **Design:** ClearTalk logo with blue/white color scheme
- **Usage:** Main app icon for iOS and Android

### Splash Screen

**File:** `assets/splash.png`

- **Size:** 1242x2436 px (iPhone X/11/12 resolution)
- **Format:** PNG
- **Design:** ClearTalk logo centered on white background
- **Usage:** Launch screen displayed while app loads

### Adaptive Icon (Android)

**File:** `assets/adaptive-icon.png`

- **Size:** 1024x1024 px
- **Format:** PNG with transparency
- **Design:** ClearTalk logo designed for Android adaptive icons
- **Usage:** Android adaptive icon (supports different shapes per device)

### Favicon (Web)

**File:** `assets/favicon.png`

- **Size:** 48x48 px
- **Format:** PNG
- **Design:** Simplified ClearTalk logo
- **Usage:** Web version favicon

## Design Guidelines

### Color Palette

- **Primary Blue:** `#007AFF` (iOS blue)
- **Success Green:** `#4CAF50`
- **Warning Yellow:** `#FFC107`
- **Error Red:** `#F44336`
- **Text Primary:** `#333333`
- **Text Secondary:** `#666666`
- **Background:** `#FFFFFF`
- **Divider:** `#E0E0E0`

### Logo Concepts

The ClearTalk logo should convey:
- **Communication** - Speech bubbles, chat icons
- **Protection** - Shield element
- **Clarity** - Clean, simple design
- **Trust** - Professional appearance

### Recommended Design Elements

1. **Shield + Message Bubble** - Combination representing protected communication
2. **BIFF Checkmark** - Visual indicator of verified/quality messages
3. **Typography** - Modern sans-serif font (SF Pro for iOS, Roboto for Android)

## Creating Assets

### Option 1: Professional Design

Hire a designer to create high-quality assets matching your brand guidelines.

### Option 2: DIY with Figma/Sketch

1. Create 1024x1024 canvas
2. Design icon with 20% padding on all sides
3. Export as PNG with transparency
4. Use online tools to generate additional sizes

### Option 3: Temporary Placeholders

For development, create simple placeholder assets:

```bash
# Using ImageMagick (install with: brew install imagemagick)

# Create icon.png (blue square with white text)
convert -size 1024x1024 xc:'#007AFF' \
  -font Arial -pointsize 120 -fill white \
  -gravity center -annotate +0+0 'CT' \
  assets/icon.png

# Create splash.png (white background with blue text)
convert -size 1242x2436 xc:white \
  -font Arial -pointsize 180 -fill '#007AFF' \
  -gravity center -annotate +0+0 'ClearTalk' \
  assets/splash.png

# Create adaptive-icon.png (same as icon)
cp assets/icon.png assets/adaptive-icon.png

# Create favicon.png (scaled down icon)
convert assets/icon.png -resize 48x48 assets/favicon.png
```

## Asset Checklist

- [ ] `assets/icon.png` (1024x1024)
- [ ] `assets/splash.png` (1242x2436)
- [ ] `assets/adaptive-icon.png` (1024x1024)
- [ ] `assets/favicon.png` (48x48)

## After Creating Assets

1. Place all assets in the `assets/` directory
2. Verify paths in `app.json` match your file names
3. Run `npx expo prebuild --clean` to regenerate native projects
4. Test on both iOS and Android simulators
5. Verify assets appear correctly on various device sizes

## Future Assets (Optional)

- Onboarding screens
- Empty state illustrations
- Tutorial graphics
- Achievement badges
- Custom notification icons
- App Store screenshots
