import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Wires the Android hardware Back button into the app.
 * If a Radix dialog/sheet/popover is open, Back closes it first (Radix already
 * closes on Escape, so we just replay that key instead of tracking every dialog's
 * open state ourselves). Otherwise it goes back in-app, or exits on the root screen.
 */
export const useAndroidBackButton = (): void => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const listenerPromise = App.addListener('backButton', ({ canGoBack }) => {
      const openDialog = document.querySelector('[role="dialog"], [role="alertdialog"]');
      if (openDialog) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        return;
      }

      if (canGoBack) {
        navigate(-1);
      } else {
        App.exitApp();
      }
    });

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, [navigate]);
};
