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
  },
};

export default config;
