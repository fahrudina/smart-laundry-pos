import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * Hides the native splash screen after the app's first commit. capacitor.config.ts sets
 * launchAutoHide: false so this is the only thing that hides it - calling SplashScreen.hide()
 * from main.tsx synchronously after root.render() would race React's actual paint, since
 * render() doesn't flush the DOM (or reflect on screen) synchronously.
 */
export const useHideNativeSplashScreen = (): void => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    SplashScreen.hide().catch((error) => {
      console.error('Failed to hide native splash screen:', error);
    });
  }, []);
};
