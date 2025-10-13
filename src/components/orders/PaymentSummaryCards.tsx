import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Banknote, Clock, QrCode, Wallet } from 'lucide-react';
import { Order } from '@/hooks/useOrdersOptimized';

interface PaymentSummaryCardsProps {
  orders: Order[];
}

export const PaymentSummaryCards: React.FC<PaymentSummaryCardsProps> = ({ orders }) => {
  // Calculate payment metrics from filtered orders
  // These metrics update automatically when filters change
  const metrics = useMemo(() => {
    let totalPaid = 0;
    let totalPending = 0;
    let totalQris = 0;
    let totalCash = 0;

    orders.forEach(order => {
      const amount = order.payment_amount || order.total_amount || 0;

      // Total paid: sum of all completed payments
      if (order.payment_status === 'completed') {
        totalPaid += amount;

        // Break down by payment method for completed payments
        if (order.payment_method === 'qris') {
          totalQris += amount;
        } else if (order.payment_method === 'cash') {
          totalCash += amount;
        }
        // Note: Transfer payments are included in totalPaid but not shown separately
      }

      // Total pending: includes fully pending orders + remaining balance for down_payment orders
      if (order.payment_status === 'pending' || order.payment_status === 'down_payment') {
        if (order.payment_status === 'down_payment') {
          // For down_payment, only count the remaining unpaid amount
          // Ensure no negative values if payment exceeds total
          const remaining = Math.max(0, order.total_amount - (order.payment_amount || 0));
          totalPending += remaining;
        } else {
          // For fully pending orders, count the entire amount
          totalPending += order.total_amount;
        }
      }
    });

    return { totalPaid, totalPending, totalQris, totalCash };
  }, [orders]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const summaryCards = [
    {
      title: 'Total Dibayar',
      value: metrics.totalPaid,
      icon: Wallet,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      textColor: 'text-green-700',
    },
    {
      title: 'Total Pending',
      value: metrics.totalPending,
      icon: Clock,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-700',
    },
    {
      title: 'Dibayar QRIS',
      value: metrics.totalQris,
      icon: QrCode,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-700',
    },
    {
      title: 'Dibayar Tunai',
      value: metrics.totalCash,
      icon: Banknote,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-700',
    },
  ];

  return (
    <div className="mb-4 sm:mb-6">
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full relative"
      >
        <CarouselContent className="-ml-2 sm:-ml-4">
          {summaryCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <CarouselItem key={index} className="pl-2 sm:pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/4">
                <Card className={`${card.bgColor} border-0 shadow-md hover:shadow-lg transition-shadow`}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">{card.title}</p>
                        <p className={`text-base sm:text-xl lg:text-2xl font-bold ${card.textColor} truncate`}>
                          {formatCurrency(card.value)}
                        </p>
                      </div>
                      <div className={`p-2 sm:p-3 rounded-full bg-white ring-2 ring-offset-2 ${card.bgColor.replace('bg-', 'ring-')} flex-shrink-0 ml-2`}>
                        <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${card.iconColor}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {/* Navigation buttons - visible on desktop */}
        <div className="hidden lg:flex">
          <CarouselPrevious className="-left-4 lg:-left-12" />
          <CarouselNext className="-right-4 lg:-right-12" />
        </div>
      </Carousel>
    </div>
  );
};
