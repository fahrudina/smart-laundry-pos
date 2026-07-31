import { EnhancedLaundryPOS } from '@/components/pos/EnhancedLaundryPOS';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';

const Index = () => {
  usePageTitle('Order Baru');
  const navigate = useNavigate();

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold sm:text-2xl">Order Baru</h1>
          <p className="hidden text-muted-foreground sm:block">Buat order laundry baru</p>
        </div>
        <Button
          variant="default"
          onClick={() => navigate('/order-history')}
          className="flex-shrink-0 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          size="sm"
        >
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">Riwayat Order</span>
        </Button>
      </div>

      {/* POS Content */}
      <EnhancedLaundryPOS />
    </div>
  );
};

export default Index;
