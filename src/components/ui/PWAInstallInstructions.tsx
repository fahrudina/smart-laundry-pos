import React from 'react';
import { Chrome, AlertCircle, CheckCircle2, Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { getInstallationSteps, getRecommendedBrowser, detectBrowser } from '@/lib/browserDetection';

interface PWAInstallInstructionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PWAInstallInstructions: React.FC<PWAInstallInstructionsProps> = ({
  open,
  onOpenChange,
}) => {
  const browserInfo = detectBrowser();
  const recommendedBrowser = getRecommendedBrowser();
  const { title, steps } = getInstallationSteps();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Ikuti langkah-langkah di bawah untuk menginstall Smart Laundry POS sebagai aplikasi di HP Anda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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

          {/* Recommendation Alert for MIUI users */}
          {recommendedBrowser && (
            <Alert className="border-blue-200 bg-blue-50">
              <Chrome className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">Gunakan Chrome Browser</AlertTitle>
              <AlertDescription className="text-blue-800">
                Untuk pengalaman terbaik di HP {browserInfo.isPoco ? 'Poco' : 'Xiaomi'}, sebaiknya install aplikasi menggunakan <strong>Chrome Browser</strong>.
                MIUI Browser memiliki keterbatasan dukungan PWA.
              </AlertDescription>
            </Alert>
          )}

          {/* Special warning for MIUI browser */}
          {browserInfo.isMIUI && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-900">Anda Menggunakan MIUI Browser</AlertTitle>
              <AlertDescription className="text-orange-800">
                MIUI Browser tidak mendukung instalasi PWA dengan baik. Silakan buka website ini di <strong>Chrome Browser</strong> untuk install aplikasi.
                <div className="mt-2 text-sm">
                  <strong>Cara berpindah ke Chrome:</strong>
                  <ol className="list-decimal ml-4 mt-1 space-y-1">
                    <li>Buka aplikasi Chrome (download dari Play Store jika belum ada)</li>
                    <li>Ketik atau paste alamat website ini</li>
                    <li>Ikuti langkah instalasi</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Installation Steps */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Langkah-langkah Instalasi:</h4>
            <ol className="space-y-3">
              {steps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700 pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Success indicator */}
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">Setelah Berhasil Install</AlertTitle>
            <AlertDescription className="text-green-800">
              Aplikasi akan muncul di layar utama HP Anda dan dapat digunakan seperti aplikasi native lainnya, termasuk:
              <ul className="list-disc ml-4 mt-2 space-y-1 text-sm">
                <li>Bisa dibuka tanpa browser (fullscreen)</li>
                <li>Muncul di daftar aplikasi</li>
                <li>Notifikasi push (jika diaktifkan)</li>
                <li>Bekerja offline untuk fitur tertentu</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Chrome Download Shortcut for Xiaomi/Poco users */}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
