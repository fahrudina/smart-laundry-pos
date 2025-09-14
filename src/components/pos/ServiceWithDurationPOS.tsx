import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useServices, ServiceData } from '@/hooks/useServices';
import { useDurationTypes as useDurationTypesHook, DurationType, useServicePricing } from '@/hooks/useDurationTypes';
import { useFeatureFlags } from '@/lib/featureFlags';
import { useStore } from '@/contexts/StoreContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, Zap, Calendar } from 'lucide-react';

interface ServiceWithDuration {
  service: ServiceData;
  durationType?: DurationType;
  serviceType: 'unit' | 'kilo' | 'combined';
  quantity: number;
  weight?: number;
  finalPrice: number;
  estimatedCompletion: Date;
}

export const ServiceWithDurationPOS: React.FC = () => {
  const { currentStore } = useStore();
  const { shouldUseDurationTypes, shouldUseDurationSelection } = useFeatureFlags();
  
  // Check if duration types should be used for this store
  const useDurationTypes = shouldUseDurationTypes(currentStore?.store_id);
  const useDurationSelection = shouldUseDurationSelection(currentStore?.store_id);
  const [currentOrder, setCurrentOrder] = useState<ServiceWithDuration[]>([]);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [showDurationDialog, setShowDurationDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);
  const [selectedDurationType, setSelectedDurationType] = useState<DurationType | null>(null);
  const [dropOffDate, setDropOffDate] = useState(new Date());

  // Load services and duration types
  const { data: services = [], isLoading: servicesLoading } = useServices();
  
  // Only load duration types if the feature is enabled
  const durationTypesQuery = useDurationTypesHook();
  const durationTypes = useDurationTypes ? (durationTypesQuery.data || []) : [];
  const durationTypesLoading = useDurationTypes ? durationTypesQuery.isLoading : false;
  
  const { calculatePrice, calculateEstimatedCompletion } = useServicePricing();

  // Service selection handler
  const handleServiceSelect = (service: ServiceData) => {
    setSelectedService(service);
    setShowServiceDialog(false);
    
    if (useDurationTypes && durationTypes.length > 0) {
      // New flow: Show duration type selection
      setShowDurationDialog(true);
    } else {
      // Legacy flow: Use service's built-in duration
      handleLegacyServiceAdd(service);
    }
  };

  // Duration type selection handler
  const handleDurationSelect = (durationType: DurationType) => {
    if (!selectedService) return;
    
    setSelectedDurationType(durationType);
    setShowDurationDialog(false);
    
    // Proceed to service type selection (unit/kilo/combined)
    handleServiceWithDurationAdd(selectedService, durationType);
  };

  // Legacy service addition (current system)
  const handleLegacyServiceAdd = (service: ServiceData) => {
    const basePrice = service.unit_price || 0;
    const quantity = 1;
    
    // Calculate completion using service's built-in duration
    const completionDate = new Date(dropOffDate);
    if (service.duration_unit === 'hours') {
      completionDate.setHours(completionDate.getHours() + service.duration_value);
    } else {
      completionDate.setDate(completionDate.getDate() + service.duration_value);
    }

    const orderItem: ServiceWithDuration = {
      service,
      serviceType: 'unit',
      quantity,
      finalPrice: basePrice * quantity,
      estimatedCompletion: completionDate,
    };

    setCurrentOrder(prev => [...prev, orderItem]);
  };

  // New service addition with duration type
  const handleServiceWithDurationAdd = (service: ServiceData, durationType: DurationType) => {
    const basePrice = service.base_unit_price || service.unit_price || 0;
    const quantity = 1;
    
    const finalPrice = calculatePrice(basePrice, durationType, 'unit', quantity);
    const estimatedCompletion = calculateEstimatedCompletion(durationType, dropOffDate);

    const orderItem: ServiceWithDuration = {
      service,
      durationType,
      serviceType: 'unit',
      quantity,
      finalPrice,
      estimatedCompletion,
    };

    setCurrentOrder(prev => [...prev, orderItem]);
  };

  // Calculate total
  const orderTotal = useMemo(() => {
    return currentOrder.reduce((sum, item) => sum + item.finalPrice, 0);
  }, [currentOrder]);

  // Get duration type icon
  const getDurationIcon = (durationType?: DurationType) => {
    if (!durationType) return <Clock className="h-4 w-4" />;
    
    if (durationType.name === 'Express') return <Zap className="h-4 w-4" />;
    return <Calendar className="h-4 w-4" />;
  };

  // Format duration display
  const formatDuration = (item: ServiceWithDuration) => {
    if (item.durationType) {
      return `${item.durationType.duration_value} ${item.durationType.duration_unit}`;
    }
    return `${item.service.duration_value} ${item.service.duration_unit}`;
  };

  if (servicesLoading || (useDurationTypes && durationTypesLoading)) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            New Order
            <Badge variant={useDurationTypes ? "default" : "secondary"}>
              {useDurationTypes ? "Enhanced Mode" : "Legacy Mode"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dropoff-date">Drop-off Date & Time</Label>
              <Input
                id="dropoff-date"
                type="datetime-local"
                value={dropOffDate.toISOString().slice(0, 16)}
                onChange={(e) => setDropOffDate(new Date(e.target.value))}
              />
            </div>
            {useDurationTypes && (
              <div className="text-sm text-muted-foreground">
                <p>✨ Enhanced duration selection enabled</p>
                <p>Choose service first, then select completion time preference</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Available Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <Card
                key={service.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleServiceSelect(service)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                    
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-blue-600">
                        Rp{(service.base_unit_price || service.unit_price || 0).toLocaleString('id-ID')}
                      </span>
                      <Badge variant="outline">
                        {service.duration_value} {service.duration_unit}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Duration Type Selection Dialog */}
      {useDurationTypes && (
        <Dialog open={showDurationDialog} onOpenChange={setShowDurationDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Choose Service Duration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select how quickly you need "{selectedService?.name}" completed:
              </p>
              
              {durationTypes.map((durationType) => (
                <Card
                  key={durationType.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleDurationSelect(durationType)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        {getDurationIcon(durationType)}
                        <div>
                          <h4 className="font-semibold">{durationType.name}</h4>
                          <p className="text-sm text-muted-foreground">{durationType.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          Rp{calculatePrice(
                            selectedService?.base_unit_price || selectedService?.unit_price || 0,
                            durationType
                          ).toLocaleString('id-ID')}
                        </p>
                        {durationType.price_multiplier !== 1.0 && (
                          <p className="text-xs text-blue-600">
                            {durationType.price_multiplier > 1 ? '+' : ''}
                            {((durationType.price_multiplier - 1) * 100).toFixed(0)}%
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Current Order */}
      {currentOrder.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentOrder.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-semibold">{item.service.name}</h4>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      {getDurationIcon(item.durationType)}
                      <span>{formatDuration(item)}</span>
                      {item.durationType && (
                        <Badge variant="secondary" className="text-xs">
                          {item.durationType.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ready: {item.estimatedCompletion.toLocaleDateString('id-ID')} at {item.estimatedCompletion.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Rp{item.finalPrice.toLocaleString('id-ID')}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span>Rp{orderTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
              
              <Button className="w-full mt-4">
                Process Order (Rp{orderTotal.toLocaleString('id-ID')})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
