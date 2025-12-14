# Android Build - Quick Reference

## Environment Check

Run the automated environment validation:
```bash
./check-android-env.sh
```

## Prerequisites Check
```bash
# Verify all requirements manually
node --version          # Should be 16+
java -version          # Should be JDK 17
echo $ANDROID_HOME     # Should point to Android SDK
```

## ⚠️ WhatsApp Integration for Android

**IMPORTANT**: Before building Android APK, configure WhatsApp API URL!

Create `.env.production` file:
```bash
VITE_WHATSAPP_API_URL=https://your-app-name.vercel.app/api/whatsapp-send
VITE_WHATSAPP_ENABLED=true
```

Without this, WhatsApp notifications will fail on Android! See [ANDROID_WHATSAPP_CONFIGURATION.md](./research/ANDROID_WHATSAPP_CONFIGURATION.md) for details.

## Common Commands

### Build & Sync
```bash
# Build web assets and sync to Android
npm run android:sync

# Build debug APK (for testing)
npm run android:build:debug

# Build release APK (for production)
npm run android:build:release
```

### Development
```bash
# Open project in Android Studio
npm run android:open

# Build and install on connected device
npm run android:install

# Build, install, and run
npm run android:run
```

### Direct Gradle Commands
```bash
cd android

# Build debug
./gradlew assembleDebug

# Build release
./gradlew assembleRelease

# Clean build
./gradlew clean

# Install on device
./gradlew installDebug
```

## Output Locations

```
Debug APK:
android/app/build/outputs/apk/debug/app-debug.apk

Release APK:
android/app/build/outputs/apk/release/app-release.apk

AAB (Play Store):
android/app/build/outputs/bundle/release/app-release.aab
```

## Workflow

1. **Make changes to web code** → Edit files in `src/`
2. **Build web assets** → `npm run build`
3. **Sync to Android** → `npx cap sync android`
4. **Build APK** → `npm run android:build:debug`
5. **Test APK** → Install on device or emulator

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| SDK not found | Set `ANDROID_HOME` environment variable |
| Build failed | Run `cd android && ./gradlew clean` |
| Web assets missing | Run `npm run build` first |
| Java version error | Use JDK 17 |
| Dependency error | Check internet connection |

## First Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Build web app
npm run build

# 3. Add Android platform (if not already added)
npx cap add android

# 4. Sync to Android
npx cap sync android

# 5. Build APK
npm run android:build:debug
```

## Release Build Setup

```bash
# 1. Generate keystore
keytool -genkey -v -keystore release.keystore \
  -alias myapp -keyalg RSA -keysize 2048 -validity 10000

# 2. Create android/keystore.properties
storePassword=your_password
keyPassword=your_password
keyAlias=myapp
storeFile=../release.keystore

# 3. Build signed release
npm run android:build:release
```

## Testing on Device

```bash
# 1. Enable USB debugging on Android device
# 2. Connect via USB
# 3. Verify connection
adb devices

# 4. Install and run
npm run android:install
```

For more details, see [ANDROID_BUILD.md](./ANDROID_BUILD.md)
