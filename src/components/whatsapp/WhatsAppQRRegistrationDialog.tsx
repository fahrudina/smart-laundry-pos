import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { whatsAppService } from '@/integrations/whatsapp/service';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { AlertCircle, CheckCircle2, RefreshCw, Smartphone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface WhatsAppQRRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const WhatsAppQRRegistrationDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: WhatsAppQRRegistrationDialogProps) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredPhone, setRegisteredPhone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollAttempts, setPollAttempts] = useState(0);
  const { toast } = useToast();
  const { currentStore } = useStore();

  const MAX_POLL_ATTEMPTS = 200; // 200 attempts * 3 seconds = 10 minutes
  const POLL_INTERVAL = 3000; // 3 seconds

  // Initialize QR code registration when dialog opens
  useEffect(() => {
    if (open && !sessionId && !isInitializing && !registrationComplete) {
      initializeRegistration();
    }
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSessionId(null);
      setQrCode(null);
      setIsInitializing(false);
      setRegistrationComplete(false);
      setRegisteredPhone(null);
      setError(null);
      setPollAttempts(0);
    }
  }, [open]);

  const initializeRegistration = async () => {
    setIsInitializing(true);
    setError(null);
    
    try {
      const result = await whatsAppService.getQRCode();
      setSessionId(result.sessionId);
      setQrCode(result.qrCodeBase64);
      setPollAttempts(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate QR code';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  // Poll for registration status
  const { data: statusData } = useQuery({
    queryKey: ['whatsapp-registration-status', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      
      setPollAttempts((prev) => prev + 1);
      
      try {
        const result = await whatsAppService.checkRegistrationStatus(sessionId);
        return result;
      } catch (err) {
        console.error('Status check error:', err);
        return null;
      }
    },
    enabled: !!sessionId && !registrationComplete && pollAttempts < MAX_POLL_ATTEMPTS,
    refetchInterval: POLL_INTERVAL,
    refetchIntervalInBackground: true,
  });

  // Handle status updates
  useEffect(() => {
    if (!statusData) return;

    if (statusData.status === 'connected' && statusData.senderId) {
      handleRegistrationSuccess(statusData.senderId);
    } else if (statusData.status === 'failed') {
      setError('Registration failed. Please try again.');
      setSessionId(null);
    } else if (statusData.status === 'not_found') {
      setError('Session expired. Please try again.');
      setSessionId(null);
    } else if (statusData.status === 'pending' && statusData.qrCode) {
      // QR code refreshed
      setQrCode(statusData.qrCode);
    }
  }, [statusData]);

  // Handle timeout
  useEffect(() => {
    if (pollAttempts >= MAX_POLL_ATTEMPTS && !registrationComplete) {
      setError('Registration timeout. QR code may have expired.');
      setSessionId(null);
    }
  }, [pollAttempts]);

  const handleRegistrationSuccess = async (senderId: string) => {
    if (!currentStore?.store_id) {
      toast({
        title: 'Error',
        description: 'Store information not available',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Update stores table with registration data
      const { error: updateError } = await supabase
        .from('stores')
        .update({
          whatsapp_sender_id: senderId,
          whatsapp_sender_registered: true,
          whatsapp_sender_phone: senderId, // The sender_id is the phone number
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentStore.store_id);

      if (updateError) throw updateError;

      setRegistrationComplete(true);
      setRegisteredPhone(senderId);
      
      toast({
        title: 'Berhasil!',
        description: 'WhatsApp berhasil didaftarkan. Anda sekarang dapat menggunakan nomor toko untuk notifikasi.',
      });

      // Call success callback and close dialog after a brief delay
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save registration';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan pendaftaran: ' + errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleTryAgain = () => {
    setError(null);
    setSessionId(null);
    setQrCode(null);
    setPollAttempts(0);
    initializeRegistration();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            Daftarkan Nomor WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {registrationComplete ? (
            // Success state
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-green-900">
                  Pendaftaran Berhasil!
                </h3>
                <p className="text-sm text-gray-600">
                  Nomor WhatsApp <span className="font-mono font-medium">{registeredPhone}</span> berhasil didaftarkan.
                </p>
              </div>
            </div>
          ) : error ? (
            // Error state
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-red-900">
                  Pendaftaran Gagal
                </h3>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
              <Button onClick={handleTryAgain} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Coba Lagi
              </Button>
            </div>
          ) : isInitializing || !qrCode ? (
            // Loading state
            <div className="flex flex-col items-center justify-center py-8">
              <LoadingSpinner size="lg" variant="primary" centered />
              <p className="text-sm text-gray-600 mt-4">Membuat QR code...</p>
            </div>
          ) : (
            // QR code display
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-blue-900">
                      Cara Mendaftar:
                    </p>
                    <ol className="text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Buka WhatsApp di ponsel Anda</li>
                      <li>Tap Menu (⋮) atau Pengaturan</li>
                      <li>Pilih "Perangkat Tertaut" atau "Linked Devices"</li>
                      <li>Tap "Tautkan Perangkat" atau "Link a Device"</li>
                      <li>Scan QR code di bawah ini</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center space-y-3 p-6 bg-white border-2 border-gray-200 rounded-lg">
                <img
                  src={`data:image/png;base64,${qrCode}`}
                  alt="WhatsApp QR Code"
                  className="w-64 h-64 object-contain"
                />
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <LoadingSpinner size="sm" variant="primary" />
                  <span>Menunggu scan... ({Math.floor((MAX_POLL_ATTEMPTS - pollAttempts) * POLL_INTERVAL / 60000)} menit tersisa)</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Catatan:</strong> QR code akan kadaluarsa dalam 10 menit. Pastikan Anda memiliki akses ke WhatsApp untuk melakukan scan.
                </p>
              </div>
            </div>
          )}
        </div>

        {!registrationComplete && !error && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isInitializing}
            >
              Batal
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
