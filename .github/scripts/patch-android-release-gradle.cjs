#!/usr/bin/env node
// Patches the Capacitor-generated android/app/build.gradle with a real version and a
// release signingConfig. android/ isn't committed to this repo (see capacitor.config.ts
// and .gitignore) - CI regenerates it fresh from Capacitor's template on every run, which
// always hardcodes versionCode 1 / versionName "1.0" and has no release signing wired up.
//
// Expects RELEASE_VERSION_CODE and RELEASE_VERSION_NAME env vars. The signing config
// references ANDROID_RELEASE_STORE_FILE/STORE_PASSWORD/KEY_ALIAS/KEY_PASSWORD via
// System.getenv(...) directly in the generated Gradle file, so those secrets never need
// to be written to disk as plaintext - they're read from the environment at build time.
const fs = require('fs');
const path = require('path');

const gradlePath = path.join(__dirname, '..', '..', 'android', 'app', 'build.gradle');
const versionCode = process.env.RELEASE_VERSION_CODE;
const versionName = process.env.RELEASE_VERSION_NAME;

if (!versionCode || !versionName) {
  console.error('RELEASE_VERSION_CODE and RELEASE_VERSION_NAME must be set');
  process.exit(1);
}

let content = fs.readFileSync(gradlePath, 'utf8');

const replace = (from, to) => {
  if (!content.includes(from)) {
    console.error(`Expected to find in build.gradle, template may have changed:\n${from}`);
    process.exit(1);
  }
  content = content.replace(from, to);
};

replace('versionCode 1', `versionCode ${versionCode}`);
replace('versionName "1.0"', `versionName "${versionName}"`);

replace(
  'buildTypes {',
  `signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_RELEASE_STORE_FILE"))
            storePassword System.getenv("ANDROID_RELEASE_STORE_PASSWORD")
            keyAlias System.getenv("ANDROID_RELEASE_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_RELEASE_KEY_PASSWORD")
        }
    }
    buildTypes {`
);

replace(
  'release {\n            minifyEnabled false',
  'release {\n            signingConfig signingConfigs.release\n            minifyEnabled false'
);

fs.writeFileSync(gradlePath, content);
console.log(`Patched android/app/build.gradle: versionCode=${versionCode} versionName=${versionName}`);
