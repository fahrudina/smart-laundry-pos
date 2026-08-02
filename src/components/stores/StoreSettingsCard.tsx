import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { authService } from '@/services/authService';
import { QrCode, Settings, Save, Star, WifiOff } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface StoreSettings {
  enable_qr: boolean;
  enable_points: boolean;
  enable_offline_mode: boolean;
}

export const StoreSettingsCard: React.FC = () => {
  const { currentStore, isOwner } = useStore();
  const [settings, setSettings] = useState<StoreSettings>({
    enable_qr: false,
    enable_points: false,
    enable_offline_mode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentStore?.store_id) {
      fetchStoreSettings();
    }
  }, [currentStore?.store_id]);

  const fetchStoreSettings = async () => {
    if (!currentStore?.store_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('enable_qr, enable_points, enable_offline_mode')
        .eq('id', currentStore.store_id)
        .single();

      if (error) {
        console.error('Error fetching store settings:', error);
        toast({
          title: "Error",
          description: "Gagal memuat pengaturan toko",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setSettings({
          enable_qr: data.enable_qr || false,
          enable_points: data.enable_points || false,
          enable_offline_mode: data.enable_offline_mode || false,
        });
      }
    } catch (error) {
      console.error('Error fetching store settings:', error);
      toast({
        title: "Error",
        description: "Gagal memuat pengaturan toko",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!currentStore?.store_id || !isOwner) return;

    try {
      setSaving(true);
      // Uses a SECURITY DEFINER RPC because RLS blocks direct stores
      // updates under the app's custom auth (auth.uid() is null) - a
      // direct .update() here previously reported success while silently
      // persisting nothing (same cause as update_store, fixed in 64cf15d).
      await authService.setStoreFeatureFlags(currentStore.store_id, {
        enableQr: settings.enable_qr,
        enablePoints: settings.enable_points,
        enableOfflineMode: settings.enable_offline_mode,
      });

      toast({
        title: "Pengaturan Tersimpan",
        description: "Pengaturan toko berhasil diperbarui",
      });
    } catch (error) {
      console.error('Error saving store settings:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan toko",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleQrToggle = (checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      enable_qr: checked,
    }));
  };

  const handlePointsToggle = (checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      enable_points: checked,
    }));
  };

  const handleOfflineModeToggle = (checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      enable_offline_mode: checked,
    }));
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
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Hanya pemilik toko yang dapat mengubah pengaturan</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Pengaturan Toko
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" variant="primary" />
          </div>
        ) : (
          <>
            {/* QR Code Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <QrCode className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="enable-qr" className="text-base font-medium">
                  QR Code Struk
                </Label>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="enable-qr" className="font-normal">
                    Tampilkan QR Code pada Struk
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Tampilkan QR code untuk pembayaran digital pada struk pelanggan
                  </p>
                </div>
                <Switch
                  id="enable-qr"
                  checked={settings.enable_qr}
                  onCheckedChange={handleQrToggle}
                  disabled={saving}
                  className="self-start sm:self-center"
                />
              </div>

              {settings.enable_qr && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <QrCode className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-900">
                        Konfigurasi QR Code
                      </p>
                      <p className="text-sm text-blue-700">
                        Pastikan untuk mengunggah gambar QR code pembayaran Anda sebagai <code>/qrcode.png</code> di folder public.
                        QR code akan ditampilkan pada semua struk digital saat diaktifkan.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Points Rewards Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-amber-500" />
                <Label htmlFor="enable-points" className="text-base font-medium">
                  Sistem Poin Loyalitas
                </Label>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="enable-points" className="font-normal">
                    Aktifkan Reward Poin
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Berikan poin kepada pelanggan untuk setiap pesanan yang dibayar (1 poin per kg/unit)
                  </p>
                </div>
                <Switch
                  id="enable-points"
                  checked={settings.enable_points}
                  onCheckedChange={handlePointsToggle}
                  disabled={saving}
                  className="self-start sm:self-center"
                />
              </div>

              {settings.enable_points && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Star className="h-5 w-5 text-amber-600 mt-0.5 fill-amber-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-900">
                        Sistem Poin Aktif
                      </p>
                      <ul className="text-sm text-amber-700 space-y-1">
                        <li>• Pelanggan mendapat 1 poin per kilogram untuk layanan berbasis berat</li>
                        <li>• Pelanggan mendapat 1 poin per unit untuk layanan berbasis jumlah</li>
                        <li>• Poin secara otomatis diberikan saat pembayaran selesai</li>
                        <li>• Saldo poin terlihat pada struk dan profil pelanggan</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Offline Mode Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <WifiOff className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="enable-offline-mode" className="text-base font-medium">
                  Mode Offline
                </Label>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="enable-offline-mode" className="font-normal">
                    Izinkan Buat Pesanan Saat Offline
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Staf tetap bisa membuat pesanan baru saat internet toko putus - pesanan tersimpan di perangkat dan otomatis sinkron saat koneksi kembali
                  </p>
                </div>
                <Switch
                  id="enable-offline-mode"
                  checked={settings.enable_offline_mode}
                  onCheckedChange={handleOfflineModeToggle}
                  disabled={saving}
                  className="self-start sm:self-center"
                />
              </div>

              {settings.enable_offline_mode && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <WifiOff className="h-5 w-5 text-slate-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">
                        Mode Offline Aktif
                      </p>
                      <ul className="text-sm text-slate-700 space-y-1">
                        <li>• Hanya berlaku untuk pembuatan pesanan baru - status/pembayaran pesanan tetap butuh koneksi internet</li>
                        <li>• Penukaran poin tidak tersedia untuk pesanan yang dibuat offline</li>
                        <li>• Staf harus login ulang jika sesi mereka habis saat offline sebelum bisa membuat pesanan baru</li>
                        <li>• Harga layanan yang dipakai offline mengikuti data terakhir saat perangkat masih online</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" variant="white" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Simpan Pengaturan
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
