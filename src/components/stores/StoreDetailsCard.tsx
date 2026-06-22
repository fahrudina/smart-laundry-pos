import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { Store, Save } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface StoreDetailsForm {
  name: string;
  address: string;
  phone: string;
}

/**
 * Lets a store owner edit the current store's name, address and phone number.
 * Writes to the `stores` table and refreshes StoreContext so the change is
 * reflected across the app (header, home, receipts).
 */
export const StoreDetailsCard: React.FC = () => {
  const { currentStore, isOwner, refreshStores } = useStore();
  const [form, setForm] = useState<StoreDetailsForm>({ name: '', address: '', phone: '' });
  const [saving, setSaving] = useState(false);

  // Sync the form whenever the selected/current store changes.
  useEffect(() => {
    if (currentStore) {
      setForm({
        name: currentStore.store_name || '',
        address: currentStore.store_address || '',
        phone: currentStore.store_phone || '',
      });
    }
  }, [currentStore?.store_id, currentStore?.store_name, currentStore?.store_address, currentStore?.store_phone]);

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
          <p className="text-muted-foreground">Hanya pemilik toko yang dapat mengubah detail toko</p>
        </CardContent>
      </Card>
    );
  }

  const isDirty =
    form.name.trim() !== (currentStore.store_name || '') ||
    form.address.trim() !== (currentStore.store_address || '') ||
    form.phone.trim() !== (currentStore.store_phone || '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore.store_id || !isOwner) return;

    if (!form.name.trim()) {
      toast({
        title: 'Error',
        description: 'Nama toko wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('stores')
        .update({
          name: form.name.trim(),
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentStore.store_id);

      if (error) {
        console.error('Error updating store details:', error);
        toast({
          title: 'Error',
          description: 'Gagal menyimpan detail toko',
          variant: 'destructive',
        });
        return;
      }

      await refreshStores();
      toast({
        title: 'Tersimpan',
        description: 'Detail toko berhasil diperbarui',
      });
    } catch (error) {
      console.error('Error updating store details:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan detail toko',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-2xl">
          <Store className="h-5 w-5 flex-shrink-0" />
          Detail Toko
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-name">Nama Toko</Label>
            <Input
              id="store-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Masukkan nama toko"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-address">Alamat</Label>
            <Input
              id="store-address"
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Masukkan alamat toko"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-phone">Nomor Telepon</Label>
            <Input
              id="store-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Masukkan nomor telepon toko"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={saving || !isDirty}
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
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
