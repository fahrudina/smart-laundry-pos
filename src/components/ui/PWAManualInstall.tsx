import React, { useState } from 'react';
import { Download, Smartphone, Info, X, Check, Chrome, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { getInstallationSteps, getRecommendedBrowser } from '@/lib/browserDetection';

interface PWAManualInstallProps {
  onClose?: () => void;
}

export const PWAManualInstall: React.FC<PWAManualInstallProps> = ({ onClose }) => {
  const { isInstallable, isInstalled, installPWA, canInstall, browserInfo, needsSpecialInstructions } = usePWAInstall();
  const [showInstructions, setShowInstructions] = useState(false);

  const recommendedBrowser = getRecommendedBrowser();
  const { title, steps } = getInstallationSteps();

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

  if (isInstalled) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Check className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-green-600">Aplikasi Sudah Terpasang</CardTitle>
          <CardDescription>
            Smart Laundry POS sudah terinstall di perangkat Anda
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-blue-600" />
            <CardTitle>Install Aplikasi</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          Install Smart Laundry POS sebagai aplikasi native untuk pengalaman yang lebih baik
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Browser Detection Info */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Browser Anda:</span>
            <Badge variant="secondary">{browserInfo.name}</Badge>
          </div>
          {browserInfo.isPoco && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Perangkat:</span>
              <Badge variant="secondary">Poco Phone</Badge>
            </div>
          )}
          {browserInfo.isXiaomi && !browserInfo.isPoco && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Perangkat:</span>
              <Badge variant="secondary">Xiaomi Phone</Badge>
            </div>
          )}
        </div>

        {/* MIUI Browser Warning */}
        {browserInfo.isMIUI && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-900">MIUI Browser Terdeteksi</AlertTitle>
            <AlertDescription className="text-orange-800">
              MIUI Browser tidak mendukung PWA dengan baik. Untuk hasil terbaik, silakan buka website ini di <strong>Chrome Browser</strong>.
            </AlertDescription>
          </Alert>
        )}

        {/* Recommendation for Xiaomi/Poco users */}
        {recommendedBrowser && !browserInfo.isMIUI && (
          <Alert className="border-blue-200 bg-blue-50">
            <Chrome className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">Rekomendasi Browser</AlertTitle>
            <AlertDescription className="text-blue-800">
              Untuk pengalaman terbaik di HP {browserInfo.isPoco ? 'Poco' : 'Xiaomi'}, sebaiknya gunakan <strong>{recommendedBrowser}</strong>.
            </AlertDescription>
          </Alert>
        )}

        {/* Auto Install Button (for supported browsers) */}
        {canInstall && !browserInfo.isMIUI && (
          <div className="space-y-2">
            <Button
              onClick={installPWA}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <Download className="h-5 w-5 mr-2" />
              Install Aplikasi Otomatis
            </Button>
            <p className="text-sm text-gray-600 text-center">
              atau ikuti petunjuk manual di bawah
            </p>
          </div>
        )}

        {/* Manual Instructions Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full"
        >
          <Info className="h-4 w-4 mr-2" />
          {showInstructions ? 'Sembunyikan' : 'Tampilkan'} Petunjuk Install
        </Button>

        {/* Device-Specific Installation Instructions */}
        {showInstructions && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center">
                <Smartphone className="h-4 w-4 mr-2" />
                {title}
              </h4>
              <ol className="text-sm space-y-2">
                {steps.map((step, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="font-semibold text-blue-600 flex-shrink-0">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="border-t pt-3">
              <h4 className="font-semibold text-sm mb-2">Keuntungan Install App:</h4>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Akses lebih cepat dari home screen</li>
                <li>• Bisa berfungsi offline</li>
                <li>• Pengalaman seperti aplikasi native</li>
                <li>• Notifikasi push (jika didukung)</li>
                <li>• Tidak ada address bar (tampilan fullscreen)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Chrome Download for MIUI users */}
        {(browserInfo.isMIUI || (browserInfo.isXiaomi && !browserInfo.isChrome)) && (
          <div className="pt-2">
            <a
              href="https://play.google.com/store/apps/details?id=com.android.chrome"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Chrome className="h-5 w-5" />
              <span className="font-medium">Download Chrome dari Play Store</span>
            </a>
          </div>
        )}

        {/* Browser Compatibility Notice */}
        <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded">
          <strong>Catatan:</strong> Fitur install otomatis tersedia di Chrome, Edge, dan browser modern lainnya.
          {browserInfo.isMIUI && ' MIUI Browser tidak mendukung PWA - gunakan Chrome.'}
          {isIOS && ' Untuk Safari iOS, gunakan petunjuk manual di atas.'}
        </div>
      </CardContent>
    </Card>
  );
};
