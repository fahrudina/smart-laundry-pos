import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';

export const StoreSelector: React.FC = () => {
  const { currentStore, userStores, switchStore } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleStoreSwitch = useCallback((storeId: string, storeName: string) => {
    
    // Close the dropdown first
    setIsOpen(false);
    
    // Use requestAnimationFrame to ensure the dropdown close animation completes
    requestAnimationFrame(() => {
      switchStore(storeId);
    });
  }, [switchStore]);

  if (userStores.length === 0) {
    return null;
  }

  if (userStores.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
        <Building2 className="h-4 w-4" />
        <span className="text-sm font-medium">{currentStore?.store_name || 'No Store'}</span>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentStore?.store_name || 'Select Store'}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Switch Store</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userStores.map((store) => (
          <DropdownMenuItem
            key={store.store_id}
            onSelect={() => {
              handleStoreSwitch(store.store_id, store.store_name);
            }}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex-1">
              <div className="font-medium">{store.store_name}</div>
              {store.store_description && (
                <div className="text-xs text-muted-foreground truncate">
                  {store.store_description}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {store.is_owner && (
                <Badge variant="secondary" className="text-xs">Owner</Badge>
              )}
              {currentStore?.store_id === store.store_id && (
                <Check className="h-3 w-3 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
