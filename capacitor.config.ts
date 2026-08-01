import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartlaundry.pos',
  appName: 'Smart Laundry POS',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      // Keep the native splash up until the app explicitly hides it (see main.tsx),
      // instead of racing a fixed timeout against React's first paint.
      launchAutoHide: false,
      backgroundColor: '#2563eb',
      androidScaleType: 'CENTER_CROP',
    },
    // Only Google sign-in is used natively - excludes the other providers'
    // native SDKs from the APK (see @capgo/capacitor-social-login's
    // capacitor:sync:before script, which reads this on every `cap sync`).
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false,
      },
    },
  },
};

export default config;
