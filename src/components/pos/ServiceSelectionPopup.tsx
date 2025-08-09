import React, { useState } from 'react';
import { Plus, X, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useServices } from '@/hooks/useServices';

interface ServiceItem {
  id: string;
  name: string;
  category: 'wash' | 'dry' | 'special' | 'ironing' | 'folding';
  unit_price?: number;
  kilo_price?: number;
  supports_unit: boolean;
  supports_kilo: boolean;
  duration_value: number;
  duration_unit: 'hours' | 'days';
}

interface SelectedService {
  service: ServiceItem;
  quantity: number;
  type: 'unit' | 'kilo';
  price: number;
}

interface ServiceSelectionPopupProps {
  onServicesSelected: (services: SelectedService[]) => void;
  disabled?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ServiceSelectionPopup: React.FC<ServiceSelectionPopupProps> = ({
  onServicesSelected,
  disabled = false,
  isOpen: externalIsOpen,
  onOpenChange: externalOnOpenChange,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const { data: services = [], isLoading } = useServices();

  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnOpenChange || setInternalIsOpen;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'wash': return 'bg-blue-100 text-blue-800';
      case 'dry': return 'bg-green-100 text-green-800';
      case 'special': return 'bg-purple-100 text-purple-800';
      case 'ironing': return 'bg-orange-100 text-orange-800';
      case 'folding': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const addService = (service: ServiceItem, type: 'unit' | 'kilo') => {
    const price = type === 'unit' ? (service.unit_price || 0) : (service.kilo_price || 0);
    const existingIndex = selectedServices.findIndex(
      s => s.service.id === service.id && s.type === type
    );

    if (existingIndex >= 0) {
      // Update existing service quantity
      const updated = [...selectedServices];
      updated[existingIndex].quantity += 1;
      setSelectedServices(updated);
    } else {
      // Add new service
      const newService: SelectedService = {
        service,
        quantity: 1,
        type,
        price,
      };
      setSelectedServices([...selectedServices, newService]);
    }
  };

  const updateQuantity = (serviceId: string, type: 'unit' | 'kilo', change: number) => {
    setSelectedServices(prev => {
      const updated = prev.map(item => {
        if (item.service.id === serviceId && item.type === type) {
          const newQuantity = Math.max(0, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0); // Remove items with 0 quantity
      
      return updated;
    });
  };

  const getTotalPrice = () => {
    return selectedServices.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const handleConfirm = () => {
    onServicesSelected(selectedServices);
    setSelectedServices([]);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setSelectedServices([]);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          className="w-full bg-blue-600 text-white hover:bg-blue-700" 
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Layanan Laundry</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Service List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-4">Loading services...</div>
            ) : (
              services.map((service) => (
                <Card key={service.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{service.name}</h3>
                        <Badge className={getCategoryColor(service.category)}>
                          {service.category}
                        </Badge>
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Pengerjaan {service.duration_value} {service.duration_unit === 'hours' ? 'Jam' : 'Hari'}
                      </p>
                    </div>
                    <div className="text-right">
                      {service.supports_unit && service.unit_price && (
                        <div className="text-blue-600 font-semibold">
                          Rp{service.unit_price.toLocaleString('id-ID')}
                        </div>
                      )}
                      {service.supports_kilo && service.kilo_price && (
                        <div className="text-sm text-gray-600">
                          Rp{service.kilo_price.toLocaleString('id-ID')}/kg
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    {service.supports_unit && service.unit_price && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addService(service, 'unit')}
                        className="flex-1"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Unit
                      </Button>
                    )}
                    {service.supports_kilo && service.kilo_price && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addService(service, 'kilo')}
                        className="flex-1"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Kilo
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Selected Services */}
          {selectedServices.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Selected Services</h4>
              <div className="space-y-2">
                {selectedServices.map((item, index) => (
                  <div key={`${item.service.id}-${item.type}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.service.name}</div>
                      <div className="text-sm text-gray-600">
                        {item.type === 'unit' ? 'Per Unit' : 'Per Kg'} - Rp{item.price.toLocaleString('id-ID')}
                      </div>
                      {item.type === 'kilo' && (
                        <div className="text-xs text-gray-500">Min. 3 kg</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.service.id, item.type, -1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      {item.type === 'kilo' ? (
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const value = Math.max(3, parseInt(e.target.value) || 3);
                            setSelectedServices(prev => 
                              prev.map(s => 
                                s.service.id === item.service.id && s.type === item.type
                                  ? { ...s, quantity: value }
                                  : s
                              )
                            );
                          }}
                          className="w-16 text-center"
                          min="3"
                        />
                      ) : (
                        <span className="w-8 text-center">{item.quantity}</span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.service.id, item.type, 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(item.service.id, item.type, -item.quantity)}
                        className="h-8 w-8 p-0 text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-3 border-t">
                <div className="font-semibold">
                  Total: Rp{getTotalPrice().toLocaleString('id-ID')}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleConfirm} disabled={selectedServices.length === 0}>
                    Add to Order
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
