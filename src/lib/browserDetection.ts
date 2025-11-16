/**
 * Browser and device detection utilities
 * Helps identify specific browsers and devices that may need special PWA handling
 */

export interface BrowserInfo {
  name: string;
  isMIUI: boolean;
  isChrome: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isSamsung: boolean;
  isPoco: boolean;
  isXiaomi: boolean;
  supportsStandardPWA: boolean;
}

/**
 * Detects the current browser and device type
 */
export const detectBrowser = (): BrowserInfo => {
  const ua = navigator.userAgent;
  const vendor = navigator.vendor || '';

  // Detect MIUI (Xiaomi/Poco custom Android)
  const isMIUI = /MiuiBrowser/i.test(ua) || /XiaoMi/i.test(ua);

  // Detect Poco phones specifically
  const isPoco = /POCO/i.test(ua) || /Pocophone/i.test(ua);

  // Detect Xiaomi phones
  const isXiaomi = /XiaoMi|Mi |Redmi|POCO/i.test(ua);

  // Detect Chrome browser (but not MIUI browser)
  const isChrome = /Chrome/i.test(ua) && /Google Inc/i.test(vendor) && !/MiuiBrowser/i.test(ua);

  // Detect Samsung browser
  const isSamsung = /SamsungBrowser/i.test(ua);

  // Detect Android
  const isAndroid = /Android/i.test(ua);

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(ua);

  // Determine browser name
  let name = 'Unknown';
  if (isMIUI) {
    name = 'MIUI Browser';
  } else if (isChrome) {
    name = 'Chrome';
  } else if (isSamsung) {
    name = 'Samsung Internet';
  } else if (isIOS && /Safari/i.test(ua)) {
    name = 'Safari';
  } else if (/Firefox/i.test(ua)) {
    name = 'Firefox';
  } else if (/Edge/i.test(ua)) {
    name = 'Edge';
  }

  // Check if browser supports standard PWA installation
  // MIUI browser has limited PWA support, Chrome is recommended
  const supportsStandardPWA = isChrome || isSamsung || (isIOS && /Safari/i.test(ua));

  return {
    name,
    isMIUI,
    isChrome,
    isAndroid,
    isIOS,
    isSamsung,
    isPoco,
    isXiaomi,
    supportsStandardPWA
  };
};

/**
 * Checks if the current device needs special PWA installation instructions
 */
export const needsSpecialInstructions = (): boolean => {
  const browser = detectBrowser();

  // MIUI browser, Xiaomi/Poco phones not using Chrome, or iOS need special instructions
  return browser.isMIUI ||
         (browser.isXiaomi && !browser.isChrome) ||
         browser.isIOS;
};

/**
 * Gets the recommended browser for PWA installation
 */
export const getRecommendedBrowser = (): string | null => {
  const browser = detectBrowser();

  if (browser.isMIUI || (browser.isXiaomi && !browser.isChrome)) {
    return 'Chrome';
  }

  if (browser.isIOS && !(/Safari/i.test(navigator.userAgent))) {
    return 'Safari';
  }

  return null;
};

/**
 * Gets device-specific installation instructions
 */
export const getInstallationSteps = (): { title: string; steps: string[] } => {
  const browser = detectBrowser();

  if (browser.isMIUI || (browser.isXiaomi && !browser.isChrome)) {
    return {
      title: 'Cara Install di HP Xiaomi/Poco',
      steps: [
        'Buka aplikasi Chrome browser (bukan MIUI Browser)',
        'Jika belum punya Chrome, download dari Play Store terlebih dahulu',
        'Buka website Smart Laundry POS di Chrome',
        'Ketuk ikon titik tiga (⋮) di pojok kanan atas',
        'Pilih "Tambahkan ke layar utama" atau "Install app"',
        'Ketuk "Install" atau "Tambahkan"',
        'Aplikasi akan muncul di layar utama HP Anda'
      ]
    };
  }

  if (browser.isChrome) {
    return {
      title: 'Cara Install di Chrome',
      steps: [
        'Ketuk ikon titik tiga (⋮) di pojok kanan atas',
        'Pilih "Tambahkan ke layar utama" atau "Install app"',
        'Ketuk "Install"',
        'Aplikasi akan muncul di layar utama HP Anda'
      ]
    };
  }

  if (browser.isIOS) {
    return {
      title: 'Cara Install di iPhone/iPad',
      steps: [
        'Buka website ini di browser Safari',
        'Ketuk ikon Share (kotak dengan panah ke atas)',
        'Scroll ke bawah dan pilih "Add to Home Screen"',
        'Ketuk "Add"',
        'Aplikasi akan muncul di layar utama iPhone Anda'
      ]
    };
  }

  // Default Android instructions
  return {
    title: 'Cara Install Aplikasi',
    steps: [
      'Ketuk ikon menu browser (biasanya titik tiga)',
      'Pilih "Tambahkan ke layar utama" atau "Install app"',
      'Ketuk "Install" atau "Tambahkan"',
      'Aplikasi akan muncul di layar utama HP Anda'
    ]
  };
};
