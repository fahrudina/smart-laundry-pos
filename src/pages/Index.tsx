import { LaundryPOS } from '@/components/pos/LaundryPOS';
import { usePageTitle } from '@/hooks/usePageTitle';

const Index = () => {
  usePageTitle('New Order');

  return (
    <div className="space-y-8">
      {/* Page Header */}
     

      {/* POS Content */}
      <LaundryPOS />
    </div>
  );
};

export default Index;
