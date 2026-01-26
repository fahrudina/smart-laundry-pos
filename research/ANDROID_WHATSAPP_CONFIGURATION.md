# Android WhatsApp Integration - Configuration Guide

## Problem
When sending WhatsApp notifications from the Android app, the notifications fail because the app uses a relative URL (`/api/whatsapp-send`) which doesn't work on native platforms.

**Why it fails on Android:**
- ✅ **Web Browser**: Relative URL `/api/whatsapp-send` → Resolves to `https://your-app.vercel.app/api/whatsapp-send`
- ❌ **Android App**: Relative URL `/api/whatsapp-send` → No domain to resolve to → **FAILS**

## Solution

### Step 1: Create Production Environment File

Create a file named `.env.production` or `.env.android.production` with your production Vercel URL:

```bash
# WhatsApp API Configuration for Android/Production
VITE_WHATSAPP_API_URL=https://your-app-name.vercel.app/api/whatsapp-send

# Enable WhatsApp integration
VITE_WHATSAPP_ENABLED=true

# Notification settings
VITE_WHATSAPP_NOTIFY_ORDER_CREATED=true
VITE_WHATSAPP_NOTIFY_ORDER_COMPLETED=true
VITE_WHATSAPP_NOTIFY_ORDER_READY_FOR_PICKUP=true
VITE_WHATSAPP_NOTIFY_PAYMENT_CONFIRMATION=true

# Development mode (false for production)
VITE_WHATSAPP_DEVELOPMENT_MODE=false
```

**Replace `your-app-name` with your actual Vercel domain!**

### Step 2: Build Android APK with Production Variables

```bash
# Build with production environment
npm run build

# Sync with Capacitor
npx cap sync android

# Build APK
cd android
./gradlew assembleDebug
```

### Step 3: Verify Configuration

After building, verify the app is using the correct URL:

1. Install the APK on your device
2. Open the app
3. Try creating an order
4. Check the WhatsApp notification

If it still fails, check the console logs for the actual URL being used.

## How It Works Now

The configuration in `src/lib/whatsapp-config.ts` now uses this logic:

```typescript
baseUrl: import.meta.env.DEV && import.meta.env.VITE_WHATSAPP_USE_PROXY === 'true' 
  ? 'http://localhost:8080/api/whatsapp'  // Local development with proxy
  : import.meta.env.VITE_WHATSAPP_API_URL || '/api/whatsapp-send'  // Production (full URL for Android, relative for web)
```

**Environment Detection:**
- **Development Mode** (`npm run dev`): Uses local proxy
- **Production with `VITE_WHATSAPP_API_URL`**: Uses full URL (Android apps)
- **Production without `VITE_WHATSAPP_API_URL`**: Uses relative URL (web browsers)

## Testing

### Test on Android Device

1. **Build and Install APK**:
```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
# Install the APK from android/app/build/outputs/apk/debug/app-debug.apk
```

2. **Create Test Order**:
   - Open the app
   - Create a new order
   - Check if WhatsApp notification is sent

3. **Check Logs** (if available):
   - Connect device via USB
   - Run: `adb logcat | grep WhatsApp`

### Test on Web Browser

The web version should continue to work as before using the relative URL.

## Troubleshooting

### Issue: Still getting "Network request failed"

**Cause**: The `VITE_WHATSAPP_API_URL` environment variable is not being included in the build.

**Solution**:
1. Verify `.env.production` file exists in project root
2. Make sure the variable starts with `VITE_` prefix
3. Rebuild the app completely:
   ```bash
   rm -rf dist android/app/build
   npm run build
   npx cap sync android
   cd android
   ./gradlew assembleDebug
   ```

### Issue: "CORS error" in Android

**Cause**: Your Vercel API endpoint doesn't allow requests from native apps.

**Solution**: Update your Vercel serverless function to allow requests from all origins:

```javascript
// api/whatsapp-send.js
export default async function handler(req, res) {
  // Enable CORS for native apps
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // ... rest of your code
}
```

### Issue: Environment variable not found

**Check Build Process**:
```bash
# Verify environment variables are loaded
npm run build -- --mode production

# Check if VITE_WHATSAPP_API_URL is in the build output
grep -r "VITE_WHATSAPP_API_URL" dist/
```

## Production Deployment Checklist

- [ ] Create `.env.production` with `VITE_WHATSAPP_API_URL`
- [ ] Set to your Vercel production URL: `https://your-app.vercel.app/api/whatsapp-send`
- [ ] Build Android app: `npm run build && npx cap sync android`
- [ ] Test WhatsApp notifications on Android device
- [ ] Verify web version still works
- [ ] Test with real customer phone number
- [ ] Monitor Vercel function logs for errors

## Alternative: Platform Detection (Not Recommended)

You could also detect the platform and set the URL dynamically, but using environment variables is cleaner:

```typescript
// Not recommended - better to use environment variables
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
const baseUrl = isNative 
  ? 'https://your-app.vercel.app/api/whatsapp-send'
  : '/api/whatsapp-send';
```

**Why environment variables are better:**
- Easier to change without code modifications
- Supports different deployment environments
- No runtime platform detection needed
- Works consistently across builds

## Files Modified

- ✅ `src/lib/whatsapp-config.ts` - Updated to support `VITE_WHATSAPP_API_URL`
- ✅ `.env.android.production` - Created template for Android production builds

## Related Documentation

- [WHATSAPP_SENDER_QUICKSTART.md](./WHATSAPP_SENDER_QUICKSTART.md)
- [ANDROID_BUILD.md](../ANDROID_BUILD.md)
- [THERMAL_PRINTER_ANDROID.md](../THERMAL_PRINTER_ANDROID.md)
