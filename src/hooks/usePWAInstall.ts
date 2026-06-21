import { useState, useEffect } from 'react';
import { detectBrowser, needsSpecialInstructions } from '@/lib/browserDetection';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAInstallInfo {
  isInstallable: boolean;
  isInstalled: boolean;
  installPWA: () => Promise<void>;
  canInstall: boolean;
  needsSpecialInstructions: boolean;
  browserInfo: ReturnType<typeof detectBrowser>;
  showInstructionsDialog: () => void;
}

export const usePWAInstall = (): PWAInstallInfo => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const browserInfo = detectBrowser();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if app is already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }

    // Check for iOS Safari "Add to Home Screen" prompt
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = (window.navigator as any).standalone;

    if (isIOS && !isInStandaloneMode) {
      setIsInstallable(true);
    }

    // For MIUI/Xiaomi/Poco devices, always show as installable even if prompt doesn't fire
    // Users can manually install via browser menu
    if (browserInfo.isMIUI || browserInfo.isXiaomi || browserInfo.isPoco) {
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [browserInfo.isMIUI, browserInfo.isXiaomi, browserInfo.isPoco]);

  const installPWA = async () => {
    // If on MIUI or needs special instructions, show instructions instead
    if (needsSpecialInstructions() || browserInfo.isMIUI) {
      setShowInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      // For iOS Safari, show instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        setShowInstructions(true);
        return;
      }
      // For other browsers without prompt, show manual instructions
      setShowInstructions(true);
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;


    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    } else {
    }
  };

  const showInstructionsDialog = () => {
    setShowInstructions(true);
  };

  return {
    isInstallable,
    isInstalled,
    installPWA,
    canInstall: isInstallable && !isInstalled,
    needsSpecialInstructions: needsSpecialInstructions(),
    browserInfo,
    showInstructionsDialog
  };
};
