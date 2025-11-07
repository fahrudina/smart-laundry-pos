import { LaundryPOS } from '@/components/pos/LaundryPOS';
import { EnhancedLaundryPOS } from '@/components/pos/EnhancedLaundryPOS';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  usePageTitle('Pesanan Baru');
  const [useEnhancedPOS, setUseEnhancedPOS] = useState(true);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pesanan Baru</h1>
          <p className="text-muted-foreground">Buat pesanan laundry baru</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {useEnhancedPOS ? 'POS Enhanced' : 'POS Klasik'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseEnhancedPOS(!useEnhancedPOS)}
          >
            Ganti ke {useEnhancedPOS ? 'Klasik' : 'Enhanced'}
          </Button>
        </div>
      </div>

      {/* POS Content */}
      {useEnhancedPOS ? <EnhancedLaundryPOS /> : <LaundryPOS />}
    </div>
  );
};

export default Index;
