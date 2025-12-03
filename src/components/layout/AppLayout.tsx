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
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        {/* Top Header Bar with trigger */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-6" />
          <div className="flex-1">
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
              Smart Laundry POS
            </span>
          </div>
          {/* Store Selector for Owners */}
          {isOwner && (
            <div className="ml-auto">
              <StoreSelector />
            </div>
          )}
        </header>
        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};
