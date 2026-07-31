import { useAndroidBackButton } from '@/hooks/useAndroidBackButton';

/**
 * Renders nothing - just activates the Android hardware Back button wiring
 * for the whole app. Needs to live inside <BrowserRouter>.
 */
export const AndroidBackButtonHandler = (): null => {
  useAndroidBackButton();
  return null;
};
