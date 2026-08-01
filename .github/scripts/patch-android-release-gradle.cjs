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

const appGradlePath = path.join(__dirname, '..', '..', 'android', 'app', 'build.gradle');
const rootGradlePath = path.join(__dirname, '..', '..', 'android', 'build.gradle');
const versionCode = process.env.RELEASE_VERSION_CODE;
const versionName = process.env.RELEASE_VERSION_NAME;

if (!versionCode || !versionName) {
  console.error('RELEASE_VERSION_CODE and RELEASE_VERSION_NAME must be set');
  process.exit(1);
}

const patchFile = (filePath, replacements) => {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [from, to] of replacements) {
    if (!content.includes(from)) {
      console.error(`Expected to find in ${filePath}, template may have changed:\n${from}`);
      process.exit(1);
    }
    content = content.replace(from, to);
  }
  fs.writeFileSync(filePath, content);
};

patchFile(appGradlePath, [
  ['versionCode 1', `versionCode ${versionCode}`],
  ['versionName "1.0"', `versionName "${versionName}"`],
  [
    'buildTypes {',
    `signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_RELEASE_STORE_FILE"))
            storePassword System.getenv("ANDROID_RELEASE_STORE_PASSWORD")
            keyAlias System.getenv("ANDROID_RELEASE_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_RELEASE_KEY_PASSWORD")
        }
    }
    buildTypes {`,
  ],
  [
    'release {\n            minifyEnabled false',
    'release {\n            signingConfig signingConfigs.release\n            minifyEnabled false',
  ],
]);
console.log(`Patched android/app/build.gradle: versionCode=${versionCode} versionName=${versionName}`);

// @capgo/capacitor-social-login's Apple provider always declares a compileOnly
// androidx.browser:browser:1.9.0 dependency even when disabled via capacitor.config.ts
// (compileOnly just means "not bundled", not "removed") - that conflicts with the
// androidx.browser:browser:1.4.0 pulled in transitively by the (enabled) Google provider's
// androidbrowserhelper dependency, since AGP enforces the compile and runtime classpaths
// resolve to the same version. 1.9.0 also requires compileSdk 36 (this project targets 35),
// so bumping instead of forcing down would mean bumping AGP/compileSdk for every plugin.
// Forcing the whole build to the already-transitively-used 1.4.0 resolves the conflict
// without touching compileSdk/AGP.
patchFile(rootGradlePath, [
  [
    'allprojects {\n    repositories {\n        google()\n        mavenCentral()\n    }\n}',
    'allprojects {\n    repositories {\n        google()\n        mavenCentral()\n    }\n    configurations.all {\n        resolutionStrategy.force \'androidx.browser:browser:1.4.0\'\n    }\n}',
  ],
]);
console.log('Patched android/build.gradle: forced androidx.browser:browser to 1.4.0');
