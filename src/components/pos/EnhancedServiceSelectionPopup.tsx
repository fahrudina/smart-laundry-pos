import React, { useState } from 'react';
import { Plus, X, Minus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServices } from '@/hooks/useServices';

// Service interface for compatibility with existing Enhanced POS
interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  durationValue: number;
  durationUnit: 'hours' | 'days';
  category: string;
  supportsUnit?: boolean;
  supportsKilo?: boolean;
  kiloPrice?: number;
}

interface SelectedService {
  service: Service;
  quantity: number;
  type: 'unit' | 'kilo';
  price: number;
  weight?: number;
}

interface DynamicItem {
  id: string;
  itemName: string;
  durationValue: number;
  durationUnit: 'hours' | 'days';
  price: number;
  quantity: number;
  unitType: 'unit' | 'kilo';
}

interface EnhancedServiceSelectionPopupProps {
  onServicesSelected: (services: SelectedService[], dynamicItems: DynamicItem[]) => void;
  disabled?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  dropOffDate?: Date;
}

export const EnhancedServiceSelectionPopup: React.FC<EnhancedServiceSelectionPopupProps> = ({
  onServicesSelected,
  disabled = false,
  isOpen: externalIsOpen,
  onOpenChange: externalOnOpenChange,
  dropOffDate = new Date(),
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [dynamicItems, setDynamicItems] = useState<DynamicItem[]>([]);
  const [animatingButton, setAnimatingButton] = useState<string | null>(null);
  const { data: servicesData = [], isLoading } = useServices();

  // Convert ServiceData to Service format for compatibility
  const services: Service[] = React.useMemo(() => {
    if (!servicesData) return [];
    
    return servicesData.map(serviceData => ({
      id: serviceData.id,
      name: serviceData.name,
      price: serviceData.unit_price || 0,
      duration: `${serviceData.duration_value} ${serviceData.duration_unit}`,
      durationValue: serviceData.duration_value,
      durationUnit: serviceData.duration_unit,
      category: serviceData.category,
      supportsUnit: serviceData.supports_unit,
      supportsKilo: serviceData.supports_kilo,
      kiloPrice: serviceData.kilo_price,
    }));
  }, [servicesData]);

  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnOpenChange || setInternalIsOpen;

  // Helper function to calculate finish date
  const calculateFinishDate = (durationValue: number, durationUnit: 'hours' | 'days', startDate: Date = dropOffDate) => {
    const finishDate = new Date(startDate);
    
    if (durationUnit === 'hours') {
      finishDate.setHours(finishDate.getHours() + durationValue);
    } else if (durationUnit === 'days') {
      finishDate.setDate(finishDate.getDate() + durationValue);
    }
    
    return finishDate;
  };

  // Helper function to format date for display
  const formatDate = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

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

  const addService = (service: Service, type: 'unit' | 'kilo') => {
    const price = type === 'unit' ? service.price : (service.kiloPrice || 0);
    const existingIndex = selectedServices.findIndex(
      s => s.service.id === service.id && s.type === type
    );

    // Trigger animation
    const buttonKey = `${service.id}-${type}`;
    setAnimatingButton(buttonKey);
    setTimeout(() => setAnimatingButton(null), 300);

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

  const updateServiceQuantity = (serviceId: string, type: 'unit' | 'kilo', change: number) => {
    setSelectedServices(prev => {
      const updated = prev.map(item => {
        if (item.service.id === serviceId && item.type === type) {
          const increment = type === 'kilo' ? (change > 0 ? 0.1 : -0.1) : change;
          const newQuantity = item.quantity + increment;
          // Round to 1 decimal place to avoid floating point precision issues
          const roundedQuantity = Math.round(newQuantity * 10) / 10;
          return { ...item, quantity: roundedQuantity };
        }
        return item;
      }).filter(item => {
        // Remove items with 0 or negative quantity, respecting type-specific minimums
        if (item.type === 'kilo') {
          return item.quantity >= 0.1;
        } else {
          return item.quantity >= 1;
        }
      });
      
      return updated;
    });
  };

  const addDynamicItem = () => {
    const newItem: DynamicItem = {
      id: `dynamic-${Date.now()}`,
      itemName: '',
      durationValue: 1,
      durationUnit: 'hours',
      price: 0,
      quantity: 1,
      unitType: 'unit',
    };
    setDynamicItems([...dynamicItems, newItem]);
  };

  const updateDynamicItem = (id: string, field: keyof DynamicItem, value: any) => {
    setDynamicItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeDynamicItem = (id: string) => {
    setDynamicItems(prev => prev.filter(item => item.id !== id));
  };

  const getTotalPrice = () => {
    const servicesTotal = selectedServices.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    const dynamicTotal = dynamicItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    return servicesTotal + dynamicTotal;
  };

  const handleConfirm = () => {
    onServicesSelected(selectedServices, dynamicItems);
    setSelectedServices([]);
    setDynamicItems([]);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setSelectedServices([]);
    setDynamicItems([]);
    setIsOpen(false);
  };

  const isDynamicItemValid = (item: DynamicItem) => {
    return item.itemName.trim() !== '' && item.price > 0 && item.quantity > 0;
  };

  const isFormValid = () => {
    return selectedServices.length > 0 || dynamicItems.some(isDynamicItemValid);
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
          Tambah Layanan & Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Layanan & Item Kustom</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Tabs defaultValue="services" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="services">Layanan Tersedia</TabsTrigger>
              <TabsTrigger value="custom">Item Kustom</TabsTrigger>
            </TabsList>
            
            <TabsContent value="services" className="mt-4">
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-4">Memuat layanan...</div>
                ) : services.length > 0 ? (
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
                          <p className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Durasi: {service.duration}
                          </p>
                          <p className="text-xs text-green-600 font-medium">
                            Siap: {formatDate(calculateFinishDate(service.durationValue, service.durationUnit))}
                          </p>
                        </div>
                        <div className="text-right">
                          {service.supportsUnit && service.price && (
                            <div className="text-blue-600 font-semibold">
                              Rp{service.price.toLocaleString('id-ID')}
                            </div>
                          )}
                          {service.supportsKilo && service.kiloPrice && (
                            <div className="text-sm text-gray-600">
                              Rp{service.kiloPrice.toLocaleString('id-ID')}/kg
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        {service.supportsUnit && service.price && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addService(service, 'unit')}
                            className={`flex-1 transition-all ${animatingButton === `${service.id}-unit` ? 'animate-button-success bg-green-50 border-green-300' : ''}`}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Tambah Satuan
                          </Button>
                        )}
                        {service.supportsKilo && service.kiloPrice && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addService(service, 'kilo')}
                            className={`flex-1 transition-all ${animatingButton === `${service.id}-kilo` ? 'animate-button-success bg-green-50 border-green-300' : ''}`}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Tambah Kilo
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Tidak ada layanan tersedia.</p>
                    <p className="text-sm">Anda dapat membuat item kustom sebagai gantinya.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="custom" className="mt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Item Kustom</h4>
                  <Button
                    variant="outline"
                    onClick={addDynamicItem}
                    className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Item Kustom
                  </Button>
                </div>
                
                {dynamicItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Belum ada item kustom yang ditambahkan.</p>
                    <p className="text-sm">Klik "Tambah Item Kustom" untuk membuat layanan baru.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dynamicItems.map((item) => (
                      <Card key={item.id} className="p-4 border-orange-200 bg-orange-50/50">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 space-y-3">
                              <div>
                                <label className="text-sm font-medium mb-1 block">Nama Item *</label>
                                <Input
                                  placeholder="Contoh: Cuci Kering Khusus, Cuci Express"
                                  value={item.itemName}
                                  onChange={(e) => updateDynamicItem(item.id, 'itemName', e.target.value)}
                                  className={item.itemName.trim() === '' ? 'border-red-300' : ''}
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-sm font-medium mb-1 block">Durasi Layanan *</label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={item.durationValue}
                                      onChange={(e) => updateDynamicItem(item.id, 'durationValue', parseInt(e.target.value) || 1)}
                                      className="flex-1"
                                    />
                                    <Select 
                                      value={item.durationUnit} 
                                      onValueChange={(value: 'hours' | 'days') => updateDynamicItem(item.id, 'durationUnit', value)}
                                    >
                                      <SelectTrigger className="w-20">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="hours">Jam</SelectItem>
                                        <SelectItem value="days">Hari</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium mb-1 block">Jenis Unit *</label>
                                  <Select 
                                    value={item.unitType} 
                                    onValueChange={(value: 'unit' | 'kilo') => updateDynamicItem(item.id, 'unitType', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="unit">Satuan</SelectItem>
                                      <SelectItem value="kilo">Kilogram</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium mb-1 block">
                                  Harga per {item.unitType === 'kilo' ? 'Kg' : 'Satuan'} *
                                </label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="15000"
                                  value={item.price || ''}
                                  onChange={(e) => updateDynamicItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                  className={item.price <= 0 ? 'border-red-300' : ''}
                                />
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium mb-1 block">
                                  Jumlah ({item.unitType === 'kilo' ? 'kg' : 'satuan'}) *
                                </label>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const minValue = item.unitType === 'kilo' ? 0.1 : 1;
                                      const decrement = item.unitType === 'kilo' ? 0.1 : 1;
                                      const newValue = Math.max(minValue, item.quantity - decrement);
                                      const roundedValue = item.unitType === 'kilo' ? Math.round(newValue * 10) / 10 : newValue;
                                      updateDynamicItem(item.id, 'quantity', roundedValue);
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <Input
                                    type="number"
                                    min={item.unitType === 'kilo' ? "0.1" : "1"}
                                    step={item.unitType === 'kilo' ? "0.1" : "1"}
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const inputValue = parseFloat(e.target.value);
                                      if (!isNaN(inputValue)) {
                                        const minValue = item.unitType === 'kilo' ? 0.1 : 1;
                                        const value = Math.max(minValue, inputValue);
                                        const roundedValue = item.unitType === 'kilo' ? Math.round(value * 10) / 10 : Math.round(value);
                                        updateDynamicItem(item.id, 'quantity', roundedValue);
                                      }
                                    }}
                                    className="w-20 text-center"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const increment = item.unitType === 'kilo' ? 0.1 : 1;
                                      const newValue = item.quantity + increment;
                                      const roundedValue = item.unitType === 'kilo' ? Math.round(newValue * 10) / 10 : newValue;
                                      updateDynamicItem(item.id, 'quantity', roundedValue);
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              {isDynamicItemValid(item) && (
                                <div className="bg-white p-2 rounded border">
                                  <div className="text-sm">
                                    <div className="font-medium">Total Harga: Rp{(item.price * item.quantity).toLocaleString('id-ID')}</div>
                                    <div className="text-green-600 text-xs">
                                      Siap: {formatDate(calculateFinishDate(item.durationValue, item.durationUnit))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDynamicItem(item.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Selected Items Summary */}
          {(selectedServices.length > 0 || dynamicItems.some(isDynamicItemValid)) && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Item Terpilih</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {/* Regular Services */}
                {selectedServices.map((item, index) => (
                  <div key={`${item.service.id}-${item.type}-${index}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.service.name}</div>
                      <div className="text-sm text-gray-600">
                        {item.type === 'unit' ? 'Per Satuan' : 'Per Kg'} - Rp{item.price.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateServiceQuantity(item.service.id, item.type, -1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      {item.type === 'kilo' ? (
                        <Input
                          type="number"
                          step="0.1"
                          value={item.quantity}
                          onChange={(e) => {
                            const inputValue = parseFloat(e.target.value);
                            if (!isNaN(inputValue)) {
                              const value = Math.max(0.1, Math.round(inputValue * 10) / 10);
                              setSelectedServices(prev => 
                                prev.map(s => 
                                  s.service.id === item.service.id && s.type === item.type
                                    ? { ...s, quantity: value }
                                    : s
                                )
                              );
                            }
                          }}
                          className="w-20 text-center"
                          min="0.1"
                        />
                      ) : (
                        <span className="w-8 text-center">{item.quantity}</span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateServiceQuantity(item.service.id, item.type, 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateServiceQuantity(item.service.id, item.type, -item.quantity)}
                        className="h-8 w-8 p-0 text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* Dynamic Items */}
                {dynamicItems.filter(isDynamicItemValid).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {item.itemName}
                        <Badge variant="outline" className="text-orange-700 border-orange-200">
                          Kustom
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Per {item.unitType === 'kilo' ? 'Kg' : 'Satuan'} - Rp{item.price.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-center">
                        {item.unitType === 'kilo' ? `${item.quantity}kg` : `${item.quantity}`}
                      </span>
                      <div className="text-sm font-medium">
                        Rp{(item.price * item.quantity).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-3 border-t">
                <div className="font-semibold">
                  Total: Rp{getTotalPrice().toLocaleString('id-ID')}
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <Button variant="outline" onClick={handleCancel}>
                    Batal
                  </Button>
                  <Button onClick={handleConfirm} disabled={!isFormValid()}>
                    Tambah ke Pesanan
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