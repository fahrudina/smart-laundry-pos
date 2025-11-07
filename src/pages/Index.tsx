import { EnhancedLaundryPOS } from '@/components/pos/EnhancedLaundryPOS';
import { usePageTitle } from '@/hooks/usePageTitle';

const Index = () => {
  usePageTitle('New Order');

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">New Order</h1>
          <p className="text-muted-foreground">Create a new laundry order</p>
        </div>
      </div>

      {/* POS Content */}
      <EnhancedLaundryPOS />
    </div>
  );
};

export default Index;
