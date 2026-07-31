import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BottomNavItem {
  id: string;
  title: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}

interface MobileBottomNavProps {
  items: BottomNavItem[];
}

/**
 * Persistent bottom tab bar for the app's highest-frequency destinations.
 * Mobile-only (hidden at the md breakpoint, matching useIsMobile's 768px cutoff);
 * the full menu (owner-only pages, settings, sign out) stays in the sidebar drawer.
 */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ items }) => {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card shadow-medium md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md justify-center gap-4 px-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={cn(
              'flex max-w-[120px] flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-colors',
              item.active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full',
                item.active && 'bg-pos-highlight/50'
              )}
            >
              <item.icon className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-medium">{item.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
