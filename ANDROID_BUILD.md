# Android APK Build Guide

This guide provides comprehensive instructions for building Android APK files from the Smart Laundry POS web application using Capacitor.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Build Commands](#build-commands)
- [Build Variants](#build-variants)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Advanced Topics](#advanced-topics)

## Prerequisites

### Required Software

1. **Node.js and npm**
   - Version: Node.js 16.x or higher
   - Verify: `node --version && npm --version`
   - Install: [https://nodejs.org/](https://nodejs.org/)

2. **Java Development Kit (JDK)**
   - Version: JDK 17 (recommended)
   - Verify: `java -version`
   - Install: [https://adoptium.net/](https://adoptium.net/)
   - Set `JAVA_HOME` environment variable

3. **Android SDK**
   - Required SDK Platform: Android 13 (API 35) or higher
   - Required Build Tools: 35.0.0 or higher
   - Install via [Android Studio](https://developer.android.com/studio) or [Command Line Tools](https://developer.android.com/studio#command-tools)

4. **Gradle**
   - Version: 8.11.1 (included via Gradle Wrapper)
   - No separate installation needed (uses `./gradlew`)

### Environment Variables

Set the following environment variables:

**Linux/macOS:**
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

**Windows:**
```cmd
setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"
setx ANDROID_SDK_ROOT "%LOCALAPPDATA%\Android\Sdk"
setx PATH "%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\cmdline-tools\latest\bin"
```

### Verify Installation

Run the following commands to verify your setup:

```bash
# Check Node.js and npm
node --version
npm --version

# Check Java
java -version

# Check Android SDK
echo $ANDROID_HOME
ls $ANDROID_HOME/platforms

# Check Gradle (from project root)
cd android && ./gradlew --version
```

## Quick Start

### Environment Validation

Before starting, you can validate your environment with the included script:

```bash
./check-android-env.sh
```

This script will check all prerequisites and provide guidance on any missing requirements.

### First-Time Setup

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd smart-laundry-pos
npm install
```

2. **Build Web Assets**
```bash
npm run build
```

3. **Sync with Android Platform**
```bash
npx cap sync android
```

4. **Build Debug APK**
```bash
npm run android:build:debug
```

The APK will be located at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Build Commands

### Available NPM Scripts

```bash
# Sync web assets to Android (required after web code changes)
npm run android:sync

# Open Android project in Android Studio
npm run android:open

# Build debug APK (unsigned, for testing)
npm run android:build:debug

# Build release APK (requires signing configuration)
npm run android:build:release

# Build and install debug APK on connected device
npm run android:install

# Build, install, and run on connected device/emulator
npm run android:run
```

### Manual Gradle Commands

You can also use Gradle directly from the `android` folder:

```bash
cd android

# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Install debug APK on connected device
./gradlew installDebug

# Clean build artifacts
./gradlew clean

# List all available tasks
./gradlew tasks
```

## Build Variants

### Debug Build

**Purpose:** Testing and development
**Signing:** Auto-signed with debug keystore
**Optimization:** Minimal (faster builds)

```bash
npm run android:build:debug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release Build

**Purpose:** Production deployment
**Signing:** Requires release keystore configuration
**Optimization:** Full (ProGuard/R8 minification)

```bash
npm run android:build:release
```

Output: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

⚠️ **Note:** Release builds require proper signing configuration (see [Signing Configuration](#signing-configuration))

## Configuration

### Application Settings

The app configuration is defined in:

**`capacitor.config.ts`**
```typescript
const config: CapacitorConfig = {
  appId: 'com.smartlaundry.pos',
  appName: 'Smart Laundry POS',
  webDir: 'dist'
};
```

### Android-Specific Configuration

**`android/app/build.gradle`**
```gradle
android {
    namespace "com.smartlaundry.pos"
    compileSdk 35
    defaultConfig {
        applicationId "com.smartlaundry.pos"
        minSdkVersion 23
        targetSdkVersion 35
        versionCode 1
        versionName "1.0"
    }
}
```

### Version Management

To update the app version:

1. Edit `android/app/build.gradle`
2. Update `versionCode` (integer, increment for each release)
3. Update `versionName` (string, e.g., "1.0.0" → "1.1.0")

```gradle
versionCode 2
versionName "1.1.0"
```

### Permissions

Current permissions in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

To add more permissions, edit the AndroidManifest.xml file.

### Signing Configuration

For release builds, create a keystore and configure signing:

1. **Generate Keystore**
```bash
keytool -genkey -v -keystore smart-laundry-release.keystore \
  -alias smart-laundry \
  -keyalg RSA -keysize 2048 -validity 10000
```

2. **Create `android/keystore.properties`**
```properties
storePassword=your_store_password
keyPassword=your_key_password
keyAlias=smart-laundry
storeFile=../smart-laundry-release.keystore
```

3. **Update `android/app/build.gradle`**
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...
    
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

⚠️ **Security:** Never commit `keystore.properties` or `.keystore` files to version control!

## Troubleshooting

### Common Issues

#### 1. Build Failed: SDK Not Found

**Error:**
```
SDK location not found. Define location with an ANDROID_SDK_ROOT environment variable
```

**Solution:**
```bash
export ANDROID_SDK_ROOT=/path/to/android/sdk
# Or create android/local.properties:
sdk.dir=/path/to/android/sdk
```

#### 2. Network/Dependency Issues

**Error:**
```
Could not resolve com.android.tools.build:gradle:X.X.X
```

**Solution:**
- Check internet connection
- Update `android/build.gradle` with a different Gradle plugin version
- Clear Gradle cache: `cd android && ./gradlew clean --no-daemon`

#### 3. Web Assets Not Found

**Error:**
```
Resource not found: dist/index.html
```

**Solution:**
```bash
# Rebuild web assets first
npm run build
npx cap sync android
```

#### 4. Java Version Mismatch

**Error:**
```
Unsupported class file major version XX
```

**Solution:**
- Ensure JDK 17 is installed
- Set JAVA_HOME to correct version
- Update Gradle: `cd android && ./gradlew wrapper --gradle-version 8.11.1`

#### 5. Build Tools Version Issue

**Error:**
```
Failed to find Build Tools revision XX.X.X
```

**Solution:**
```bash
# Install required build tools
sdkmanager "build-tools;35.0.0"

# Or update android/variables.gradle
compileSdkVersion = 35
```

### Debug Mode

For detailed build logs:

```bash
cd android
./gradlew assembleDebug --stacktrace --info
```

## Advanced Topics

### Android Studio Integration

1. Open the project in Android Studio:
```bash
npm run android:open
```

2. Or manually:
   - Open Android Studio
   - File → Open → Select `smart-laundry-pos/android` folder

3. Benefits:
   - Visual layout editor
   - Advanced debugging tools
   - Device emulator
   - Code completion and refactoring

### Testing on Physical Device

1. **Enable Developer Options on Android device:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect device via USB**

3. **Verify connection:**
```bash
adb devices
```

4. **Install and run:**
```bash
npm run android:install
```

### Building Android App Bundle (AAB)

For Google Play Store distribution:

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Custom App Icons

1. Generate icons for all densities (recommended: 1024x1024 source)
2. Place icons in:
   - `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` (48x48)
   - `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` (72x72)
   - `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` (96x96)
   - `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` (144x144)
   - `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192x192)

3. For adaptive icons (Android 8.0+):
   - Create foreground and background layers
   - Update `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`

### Performance Optimization

For production release builds:

1. **Enable ProGuard/R8** in `android/app/build.gradle`:
```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

2. **Enable R8 Full Mode** in `android/gradle.properties`:
```properties
android.enableR8.fullMode=true
```

3. **Optimize images** in web assets before building

### Continuous Integration (CI/CD)

Example GitHub Actions workflow for building APKs:

```yaml
name: Build Android APK

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Setup JDK
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build web assets
      run: npm run build
    
    - name: Sync Capacitor
      run: npx cap sync android
    
    - name: Build APK
      run: cd android && ./gradlew assembleRelease
    
    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: app-release
        path: android/app/build/outputs/apk/release/app-release.apk
```

## SDK and Build Tools Versions

**Current Configuration:**

| Component | Version |
|-----------|---------|
| Min SDK | 23 (Android 6.0) |
| Target SDK | 35 (Android 15) |
| Compile SDK | 35 (Android 15) |
| Build Tools | 35.0.0+ |
| Gradle Plugin | 8.7.2 |
| Gradle Wrapper | 8.11.1 |
| Capacitor | 7.4.3 |

**Supported Android Versions:**
- Minimum: Android 6.0 (Marshmallow, API 23)
- Target: Android 15 (API 35)

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Gradle User Guide](https://docs.gradle.org/current/userguide/userguide.html)
- [APK Signing](https://developer.android.com/studio/publish/app-signing)
- [ProGuard/R8 Rules](https://developer.android.com/studio/build/shrink-code)

## Support

For issues specific to this project, please open an issue on the GitHub repository.

For Capacitor-related issues, consult the [Capacitor Community Forum](https://forum.ionicframework.com/c/capacitor).
