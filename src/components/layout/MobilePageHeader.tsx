import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobilePageHeaderProps {
  title: string;
  onBack: () => void;
  trailing?: React.ReactNode;
  className?: string;
}

export const MobilePageHeader: React.FC<MobilePageHeaderProps> = ({
  title,
  onBack,
  trailing,
  className,
}) => {
  return (
    <div className={cn('-mx-4 mb-4 flex items-center gap-2 border-b bg-background px-4 py-3', className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        aria-label="Kembali"
        className="h-9 w-9 flex-shrink-0"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{title}</h1>
      {trailing && <div className="flex-shrink-0">{trailing}</div>}
    </div>
  );
};
