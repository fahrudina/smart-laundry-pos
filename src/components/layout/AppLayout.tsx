import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useStore } from '@/contexts/StoreContext';
import { StoreSelector } from '@/components/stores/StoreSelector';
import { Separator } from '@/components/ui/separator';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isOwner } = useStore();
  
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="w-full overflow-x-hidden">
        {/* Top Header Bar with trigger */}
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-6" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
              Smart Laundry POS
            </span>
          </div>
          {/* Store Selector for Owners */}
          {isOwner && (
            <div className="ml-auto shrink-0">
              <StoreSelector />
            </div>
          )}
        </header>
        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};
