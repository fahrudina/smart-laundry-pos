import React, { useState } from 'react';
import { Download, Smartphone, Info, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface PWAManualInstallProps {
  onClose?: () => void;
}

export const PWAManualInstall: React.FC<PWAManualInstallProps> = ({ onClose }) => {
  const { isInstallable, isInstalled, installPWA, canInstall } = usePWAInstall();
  const [showInstructions, setShowInstructions] = useState(false);

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
        {/* Auto Install Button (for supported browsers) */}
        {canInstall && (
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
          Petunjuk Install Manual
        </Button>

        {/* Manual Installation Instructions */}
        {showInstructions && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            {isIOS && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center">
                  <Smartphone className="h-4 w-4 mr-1" />
                  iPhone/iPad (Safari):
                </h4>
                <ol className="text-sm space-y-1 ml-4">
                  <li>1. Buka halaman ini di Safari</li>
                  <li>2. Tap ikon <strong>Share</strong> (kotak dengan panah ke atas)</li>
                  <li>3. Scroll ke bawah dan pilih <strong>"Add to Home Screen"</strong></li>
                  <li>4. Tap <strong>"Add"</strong> untuk konfirmasi</li>
                </ol>
              </div>
            )}

            {isAndroid && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center">
                  <Smartphone className="h-4 w-4 mr-1" />
                  Android:
                </h4>
                <ol className="text-sm space-y-1 ml-4">
                  <li>1. Buka di Chrome atau browser yang mendukung PWA</li>
                  <li>2. Tap menu <strong>⋮</strong> (tiga titik)</li>
                  <li>3. Pilih <strong>"Add to Home screen"</strong> atau <strong>"Install app"</strong></li>
                  <li>4. Tap <strong>"Add"</strong> atau <strong>"Install"</strong></li>
                </ol>
              </div>
            )}

            {!isIOS && !isAndroid && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center">
                  <Download className="h-4 w-4 mr-1" />
                  Desktop (Chrome/Edge):
                </h4>
                <ol className="text-sm space-y-1 ml-4">
                  <li>1. Buka di Chrome atau Microsoft Edge</li>
                  <li>2. Cari ikon <strong>Install</strong> di address bar</li>
                  <li>3. Klik ikon tersebut atau menu ⋮ → "Install Smart Laundry POS"</li>
                  <li>4. Klik <strong>"Install"</strong> untuk konfirmasi</li>
                </ol>
              </div>
            )}

            <div className="border-t pt-3">
              <h4 className="font-semibold text-sm mb-2">Keuntungan Install App:</h4>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Akses lebih cepat dari home screen</li>
                <li>• Bisa berfungsi offline</li>
                <li>• Pengalaman seperti aplikasi native</li>
                <li>• Notifikasi push (jika didukung)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Browser Compatibility Notice */}
        <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded">
          <strong>Catatan:</strong> Fitur install otomatis tersedia di Chrome, Edge, dan browser modern lainnya. 
          Untuk Safari iOS, gunakan petunjuk manual di atas.
        </div>
      </CardContent>
    </Card>
  );
};
