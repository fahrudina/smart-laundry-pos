import { useHideNativeSplashScreen } from '@/hooks/useHideNativeSplashScreen';

/**
 * Renders nothing - just hides the native splash screen once the app has actually
 * committed its first render, instead of racing it from main.tsx.
 */
export const NativeSplashScreenHider = (): null => {
  useHideNativeSplashScreen();
  return null;
};
