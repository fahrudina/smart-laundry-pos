import React from 'react';
import { Building2, Check, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StoreWithOwnershipInfo } from '@/types/multi-tenant';
import { cn } from '@/lib/utils';
import { CreateStoreDialog } from './CreateStoreDialog';

interface MobileStoreListProps {
  stores: StoreWithOwnershipInfo[];
  currentStoreId?: string;
  onSelectStore: (store: StoreWithOwnershipInfo) => void;
  onStoreCreated: () => void;
}

export const MobileStoreList: React.FC<MobileStoreListProps> = ({
  stores,
  currentStoreId,
  onSelectStore,
  onStoreCreated,
}) => {
  if (stores.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Belum ada toko</h3>
          <p className="text-muted-foreground text-center mb-4">
            Buat toko pertama Anda untuk mulai mengelola bisnis laundry.
          </p>
          <CreateStoreDialog onStoreCreated={onStoreCreated} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {stores.map((store) => {
        const isSelected = store.store_id === currentStoreId;
        const subtitle = store.store_address || store.store_description;

        return (
          <button
            key={store.store_id}
            type="button"
            onClick={() => onSelectStore(store)}
            className={cn(
              'flex w-full items-center gap-3 min-h-[60px] px-4 rounded-lg border text-left transition-colors',
              isSelected ? 'bg-muted border-primary/30' : 'bg-card border-border hover:bg-muted/50'
            )}
          >
            <Building2 className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{store.store_name}</p>
              {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
            </div>
            {!store.is_active && (
              <span className="text-xs text-muted-foreground flex-shrink-0">Nonaktif</span>
            )}
            {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </button>
        );
      })}
    </div>
  );
};
