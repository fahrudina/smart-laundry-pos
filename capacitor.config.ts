import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartlaundry.pos',
  appName: 'Smart Laundry POS',
  webDir: 'dist',
  server: {
    // Allow the Android app to make requests to any HTTPS domain
    androidScheme: 'https',
    // Allow mixed content and external requests
    allowNavigation: ['*']
  },
  android: {
    // Allow cleartext (HTTP) traffic if needed - but we use HTTPS
    allowMixedContent: true
  }
};

export default config;
