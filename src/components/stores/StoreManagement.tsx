import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/contexts/StoreContext';
import { CreateStoreDialog } from './CreateStoreDialog';
import { StoreStaffManagement } from './StoreStaffManagement';
import { StoreSettingsCard } from './StoreSettingsCard';
import { Building2, Users, TrendingUp, Package } from 'lucide-react';
import { StoreWithOwnershipInfo } from '@/types/multi-tenant';

export const StoreManagement: React.FC = () => {
  const { userStores, currentStore, isOwner, switchStore, refreshStores } = useStore();
  const [selectedStore, setSelectedStore] = useState<StoreWithOwnershipInfo | null>(null);

  // Initialize selectedStore with currentStore when component mounts or currentStore changes
  useEffect(() => {
    if (currentStore && !selectedStore) {
      setSelectedStore(currentStore);
    }
  }, [currentStore, selectedStore]);

  const handleStoreCreated = () => {
    refreshStores();
  };

  const handleStoreSelect = (store: StoreWithOwnershipInfo) => {
    setSelectedStore(store);
    if (store.store_id !== currentStore?.store_id) {
      switchStore(store.store_id);
    }
  };

  if (!isOwner) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Current Store
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentStore ? (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{currentStore.store_name}</h3>
                {currentStore.store_description && (
                  <p className="text-muted-foreground">{currentStore.store_description}</p>
                )}
                {currentStore.store_address && (
                  <p className="text-sm text-muted-foreground">{currentStore.store_address}</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No store assigned</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Store Management</h1>
        <CreateStoreDialog onStoreCreated={handleStoreCreated} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userStores.map((store) => (
          <Card 
            key={store.store_id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedStore?.store_id === store.store_id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleStoreSelect(store)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {store.store_name}
                </div>
                <Badge variant={store.is_active ? 'default' : 'secondary'}>
                  {store.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {store.store_description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {store.store_description}
                  </p>
                )}
                {store.store_address && (
                  <p className="text-xs text-muted-foreground">{store.store_address}</p>
                )}
                
                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>Staff</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      <span>Orders</span>
                    </div>
                  </div>
                  {currentStore?.store_id === store.store_id && (
                    <Badge variant="outline">Current</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedStore && (
        <div className="space-y-6">
          <StoreStaffManagement store={selectedStore} />
          <StoreSettingsCard />
        </div>
      )}

      {userStores.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No stores yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first store to start managing your laundry business.
            </p>
            <CreateStoreDialog onStoreCreated={handleStoreCreated} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
