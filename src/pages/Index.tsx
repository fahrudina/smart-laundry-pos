import { EnhancedLaundryPOS } from '@/components/pos/EnhancedLaundryPOS';
import { usePageTitle } from '@/hooks/usePageTitle';

const Index = () => {
  usePageTitle('Order Baru');

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order Baru</h1>
          <p className="text-muted-foreground">Buat order laundry baru</p>
        </div>
      </div>

      {/* POS Content */}
      <EnhancedLaundryPOS />
    </div>
  );
};

export default Index;
