import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { QrCode, Settings, Save, Star, MessageSquare, CheckCircle2, XCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { WhatsAppQRRegistrationDialog } from '@/components/whatsapp/WhatsAppQRRegistrationDialog';

interface StoreSettings {
  enable_qr: boolean;
  enable_points: boolean;
  whatsapp_sender_registered: boolean;
  whatsapp_sender_phone: string | null;
  wa_use_store_number: boolean;
}

export const StoreSettingsCard: React.FC = () => {
  const { currentStore, isOwner } = useStore();
    whatsapp_sender_registered: false,
    whatsapp_sender_phone: null,
    wa_use_store_number: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showQRDialog, setShowQRDialo
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentStore?.store_id) {
      fetchStoreSettings();
    }
  }, [currentStore?.store_id]);

  const fetchStoreSettings = async () => , whatsapp_sender_registered, whatsapp_sender_phone, wa_use_store_number')
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
          whatsapp_sender_registered: data.whatsapp_sender_registered || false,
          whatsapp_sender_phone: data.whatsapp_sender_phone || null,
          wa_use_store_number: data.wa_use_store_number
        return;
      }

      if (data) {
        setSettings({
          enable_qr: data.enable_qr || false,
          enable_points: data.enable_points || false,
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

  const sawa_use_store_number: settings.wa_use_store_number,
          veSettings = async () => {
    if (!currentStore?.store_id || !isOwner) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('stores')
        .update({
          enable_qr: settings.enable_qr,
          enable_points: settings.enable_points,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentStore.store_id);

      if (error) {
        console.error('Error saving store settings:', error);
        toast({
          title: "Error",
          description: "Gagal menyimpan pengaturan toko",
          variant: "destructive",
        });
        return;
      }

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
    

  const handleWhatsAppStoreNumberToggle = (checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      wa_use_store_number: checked,
    }));
  };

  const handleRegistrationSuccess = () => {
    // Refresh settings to get updated registration status
    fetchStoreSettings();
  };}));
  };

  const handlePointsToggle = (checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      enable_points: checked,
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
              </WhatsApp Sender Registration */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <Label className="text-base font-medium">
                  Konfigurasi WhatsApp
                </Label>
              </div>

              <div className="p-4 border rounded-lg space-y-3">
                {/* Registration Status */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <Label className="font-normal">Status Pendaftaran</Label>
                    <div className="flex items-center gap-2">
                      {settings.whatsapp_sender_registered ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-700">
                            Terdaftar: {settings.whatsapp_sender_phone}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-muted-foreground">
                            Belum terdaftar
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowQRDialog(true)}
                    variant={settings.whatsapp_sender_registered ? "outline" : "default"}
                    size="sm"
                    className="gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {settings.whatsapp_sender_registered ? "Ubah Nomor WhatsApp" : "Daftarkan WhatsApp"}
                  </Button>
                </div>

                {/* Use Store Number Toggle */}
                {settings.whatsapp_sender_registered && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="space-y-1 flex-1">
                      <Label htmlFor="wa-use-store-number" className="font-normal">
                        Gunakan Nomor Toko
                      </Label>
                      <p className="text-sm text-green-700">
                        Kirim notifikasi WhatsApp dari nomor toko yang terdaftar
                      </p>
                    </div>
                    <Switch
                      id="wa-use-store-number"
                      checked={settings.wa_use_store_number}
                      onCheckedChange={handleWhatsAppStoreNumberToggle}
                      disabled={saving || !settings.whatsapp_sender_registered}
                      className="self-start sm:self-center"
                    />
                  </div>
                )}

                {/* Info Card */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-900">
                        Tentang Notifikasi WhatsApp
                      </p>
                      <p className="text-sm text-blue-700">

        {/* WhatsApp QR Registration Dialog */}
        <WhatsAppQRRegistrationDialog
          open={showQRDialog}
          onOpenChange={setShowQRDialog}
          onSuccess={handleRegistrationSuccess}
        />
                        Daftarkan nomor WhatsApp toko Anda untuk mengirim notifikasi pesanan otomatis kepada pelanggan.
                        Scan QR code dengan WhatsApp untuk menghubungkan nomor Anda.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* div>

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
