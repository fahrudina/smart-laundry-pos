import { EnhancedLaundryPOS } from '@/components/pos/EnhancedLaundryPOS';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';

const Index = () => {
  usePageTitle('Order Baru');
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order Baru</h1>
          <p className="text-muted-foreground">Buat order laundry baru</p>
        </div>
        <Button
          variant="default"
          onClick={() => navigate('/order-history')}
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
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
