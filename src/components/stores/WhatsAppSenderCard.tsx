import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageCircle, CheckCircle2, XCircle, RefreshCw, QrCode, KeyRound, AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from '@/hooks/use-toast';
import { useStore } from '@/contexts/StoreContext';
import { authService } from '@/services/authService';
import { useWhatsAppSenderRegistration } from '@/hooks/useWhatsAppSenderRegistration';

// Re-verify an already-linked sender at most this often on mount, so
// reopening Store Settings repeatedly doesn't spam WhatsPoints.
const VERIFY_STALE_MS = 5 * 60 * 1000;

export const WhatsAppSenderCard: React.FC = () => {
  const { currentStore, isOwner, refreshStores } = useStore();
  const storeId = currentStore?.store_id ?? '';

  const {
    phase,
    qrCode,
    pairingCode,
    error,
    verifying,
    startQR,
    startCode,
    verifySender,
    reset,
  } = useWhatsAppSenderRegistration(storeId);

  const [phoneInput, setPhoneInput] = useState(currentStore?.store_phone ?? '');
  const [method, setMethod] = useState<'code' | 'qr'>('code');
  const [togglingUseStoreNumber, setTogglingUseStoreNumber] = useState(false);
  const [editingSender, setEditingSender] = useState(false);
  const autoVerifiedRef = useRef(false);

  const waUseStoreNumber = !!currentStore?.wa_use_store_number;
  const waSenderId = currentStore?.wa_sender_id ?? null;
  const waLastVerified = currentStore?.wa_sender_last_verified ?? null;

  // Re-verify a linked sender once per mount if it's stale (or has never
  // been verified) - a sender can silently die (device unlinked in
  // WhatsApp) with nothing else in this app noticing.
  useEffect(() => {
    if (!waUseStoreNumber || !waSenderId || autoVerifiedRef.current) return;

    const isStale =
      !waLastVerified || Date.now() - new Date(waLastVerified).getTime() > VERIFY_STALE_MS;
    if (!isStale) return;

    autoVerifiedRef.current = true;
    verifySender(waSenderId).then(() => refreshStores());
    // Only re-run if the store or sender identity actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, waSenderId]);

  useEffect(() => {
    if (phase === 'connected' || phase === 'linked') {
      setEditingSender(false);
      refreshStores();
      toast({
        title: 'Nomor Pengirim Terdaftar',
        description: 'Notifikasi WhatsApp akan dikirim dari nomor ini.',
      });
    }
    if (phase === 'failed' && error) {
      toast({ title: 'Pendaftaran Gagal', description: error, variant: 'destructive' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleStartChangeNumber = () => {
    if (verifying) return;
    reset();
    setPhoneInput(waSenderId ?? currentStore?.store_phone ?? '');
    setMethod('code');
    setEditingSender(true);
  };

  const handleCancelChangeNumber = () => {
    reset();
    setEditingSender(false);
  };

  const handleToggleUseStoreNumber = async (checked: boolean) => {
    if (!storeId) return;
    setTogglingUseStoreNumber(true);
    try {
      await authService.setStoreWaUseStoreNumber(storeId, checked);
      await refreshStores();
    } catch (err) {
      toast({
        title: 'Gagal Menyimpan',
        description: err instanceof Error ? err.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setTogglingUseStoreNumber(false);
    }
  };

  const handleRegister = () => {
    if (!phoneInput.trim()) {
      toast({
        title: 'Nomor Telepon Wajib Diisi',
        description: 'Masukkan nomor WhatsApp yang ingin didaftarkan.',
        variant: 'destructive',
      });
      return;
    }
    if (method === 'qr') {
      startQR(phoneInput);
    } else {
      startCode(phoneInput);
    }
  };

  const handleVerifyNow = async () => {
    if (!waSenderId) return;
    const result = await verifySender(waSenderId);
    await refreshStores();
    if (result.registered) {
      toast({ title: 'Terverifikasi', description: 'Nomor pengirim masih aktif di WhatsPoints.' });
    } else {
      toast({
        title: 'Tidak Terdaftar',
        description: 'Nomor pengirim sudah tidak aktif. Silakan daftarkan ulang.',
        variant: 'destructive',
      });
    }
  };

  if (!currentStore) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Tidak ada toko yang dipilih</p>
        </CardContent>
      </Card>
    );
  }

  if (!isOwner) {
    return null;
  }

  const isBusy = phase === 'checking' || togglingUseStoreNumber;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Nomor Pengirim WhatsApp
        </CardTitle>
        <CardDescription>
          Kirim notifikasi WhatsApp ke pelanggan menggunakan nomor toko Anda sendiri, bukan nomor default.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg">
          <div className="space-y-1 flex-1">
            <Label htmlFor="wa-use-store-number" className="font-normal">
              Gunakan Nomor Toko Sendiri
            </Label>
            <p className="text-sm text-muted-foreground">
              Jika nonaktif, notifikasi dikirim dari nomor default WhatsPoints.
            </p>
          </div>
          <Switch
            id="wa-use-store-number"
            checked={waUseStoreNumber}
            onCheckedChange={handleToggleUseStoreNumber}
            disabled={togglingUseStoreNumber}
            className="self-start sm:self-center"
          />
        </div>

        {waUseStoreNumber && waSenderId && !editingSender && (
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium">Terdaftar</span>
                <Badge variant="outline">{waSenderId}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleVerifyNow} disabled={verifying}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${verifying ? 'animate-spin' : ''}`} />
                  Verifikasi Sekarang
                </Button>
                <Button variant="outline" size="sm" onClick={handleStartChangeNumber} disabled={verifying}>
                  Ganti Nomor
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {waLastVerified
                ? `Terakhir diverifikasi: ${new Date(waLastVerified).toLocaleString('id-ID')}`
                : 'Belum pernah diverifikasi'}
            </p>
          </div>
        )}

        {waUseStoreNumber && !waSenderId && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Nomor toko Anda belum terdaftar. Notifikasi untuk sementara masih dikirim dari nomor
              default WhatsPoints, bukan nomor toko Anda. Daftarkan nomor Anda di bawah ini agar
              pelanggan menerima pesan dari nomor toko Anda.
            </AlertDescription>
          </Alert>
        )}

        {waUseStoreNumber && (!waSenderId || phase !== 'idle' || editingSender) && phase !== 'connected' && phase !== 'linked' && (
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="wa-sender-phone">Nomor WhatsApp</Label>
              <Input
                id="wa-sender-phone"
                placeholder="081234567890"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                disabled={isBusy || phase === 'awaiting_qr' || phase === 'awaiting_code'}
              />
            </div>

            {phase === 'idle' && (
              <div className="flex gap-2">
                <Button
                  variant={method === 'code' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMethod('code')}
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Kode Pairing
                </Button>
                <Button
                  variant={method === 'qr' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMethod('qr')}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Kode QR
                </Button>
              </div>
            )}

            {phase === 'idle' && (
              <div className="flex gap-2">
                <Button onClick={handleRegister} className="w-full sm:w-auto">
                  Daftarkan Nomor Ini
                </Button>
                {editingSender && waSenderId && (
                  <Button variant="ghost" onClick={handleCancelChangeNumber}>
                    Batal
                  </Button>
                )}
              </div>
            )}

            {phase === 'checking' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoadingSpinner size="sm" variant="primary" />
                Memeriksa status nomor...
              </div>
            )}

            {phase === 'awaiting_code' && pairingCode && (
              <div className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">
                  Buka WhatsApp di ponsel dengan nomor ini &gt; Perangkat Tertaut &gt; Tautkan
                  Perangkat &gt; Tautkan dengan nomor telepon, lalu masukkan kode berikut:
                </p>
                <p className="text-2xl font-mono font-bold tracking-widest">{pairingCode}</p>
                <Button variant="ghost" size="sm" onClick={handleCancelChangeNumber}>
                  Batalkan
                </Button>
              </div>
            )}

            {phase === 'awaiting_qr' && qrCode && (
              <div className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">
                  Buka WhatsApp di ponsel dengan nomor ini &gt; Perangkat Tertaut &gt; Tautkan
                  Perangkat, lalu pindai kode QR berikut:
                </p>
                <img
                  src={`data:image/png;base64,${qrCode}`}
                  alt="QR Code pendaftaran WhatsApp"
                  className="mx-auto w-48 h-48"
                />
                <Button variant="ghost" size="sm" onClick={handleCancelChangeNumber}>
                  Batalkan
                </Button>
              </div>
            )}

            {phase === 'failed' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <XCircle className="h-4 w-4" />
                  {error || 'Pendaftaran gagal. Silakan coba lagi.'}
                </div>
                <Button variant="outline" size="sm" onClick={reset}>
                  Coba Lagi
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
