import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Store as StoreIcon, Users, Settings, MessageCircle } from 'lucide-react';
import { StoreDetailsCard } from './StoreDetailsCard';
import { StoreStaffManagement } from './StoreStaffManagement';
import { StoreSettingsCard } from './StoreSettingsCard';
import { WhatsAppSenderCard } from './WhatsAppSenderCard';
import { useStore } from '@/contexts/StoreContext';
import { StoreWithOwnershipInfo } from '@/types/multi-tenant';

interface MobileStoreDetailProps {
  store: StoreWithOwnershipInfo;
  onBack: () => void;
}

export const MobileStoreDetail: React.FC<MobileStoreDetailProps> = ({ store, onBack }) => {
  const { currentStore } = useStore();

  // Prefer the live currentStore when it's the same store: selectedStore
  // (the `store` prop) only re-syncs from currentStore on first selection,
  // so a stale snapshot could show a stale WhatsApp sender dot right after
  // a pairing completes and calls refreshStores().
  const liveStore = currentStore?.store_id === store.store_id ? currentStore : store;
  const waSenderMissing = liveStore.wa_use_store_number && !liveStore.wa_sender_id;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Kembali">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold truncate">{store.store_name}</h1>
      </div>

      <Tabs defaultValue="detail" className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-auto">
          <TabsTrigger value="detail" className="flex flex-col items-center gap-1 py-2">
            <StoreIcon className="h-4 w-4" />
            <span className="text-xs">Detail</span>
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex flex-col items-center gap-1 py-2">
            <Users className="h-4 w-4" />
            <span className="text-xs">Staf</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex flex-col items-center gap-1 py-2">
            <Settings className="h-4 w-4" />
            <span className="text-xs">Setelan</span>
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="relative flex flex-col items-center gap-1 py-2">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">WhatsApp</span>
            {waSenderMissing && (
              <span className="absolute top-1 right-3 h-2 w-2 rounded-full bg-destructive" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="detail" forceMount className="data-[state=inactive]:hidden">
          <StoreDetailsCard />
        </TabsContent>
        <TabsContent value="staff" forceMount className="data-[state=inactive]:hidden">
          <StoreStaffManagement store={store} />
        </TabsContent>
        <TabsContent value="settings" forceMount className="data-[state=inactive]:hidden">
          <StoreSettingsCard />
        </TabsContent>
        <TabsContent value="whatsapp" forceMount className="data-[state=inactive]:hidden">
          <WhatsAppSenderCard />
        </TabsContent>
      </Tabs>
    </div>
  );
};
