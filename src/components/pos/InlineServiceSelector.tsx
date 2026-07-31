import React, { useState } from 'react';
import { Plus, X, Minus, Clock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServices } from '@/hooks/useServices';

// Service interface for compatibility with existing Enhanced POS
export interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  durationValue: number;
  durationUnit: 'hours' | 'days';
  category: string;
  itemType?: 'service' | 'product';
  supportsUnit?: boolean;
  supportsKilo?: boolean;
  kiloPrice?: number;
}

export interface DynamicItem {
  id: string;
  itemName: string;
  durationValue: number;
  durationUnit: 'hours' | 'days';
  price: number;
  quantity: number;
  unitType: 'unit' | 'kilo';
}

interface InlineServiceSelectorProps {
  onAddService: (service: Service, type: 'unit' | 'kilo') => void;
  onAddCustomItem: (item: DynamicItem) => void;
  disabled?: boolean;
  dropOffDate?: Date;
}

export const InlineServiceSelector: React.FC<InlineServiceSelectorProps> = ({
  onAddService,
  onAddCustomItem,
  disabled = false,
  dropOffDate = new Date(),
}) => {
  // Draft custom items being composed - cleared per-item once added to the order,
  // never a staging area for the real cart (services add straight to the order).
  const [dynamicItems, setDynamicItems] = useState<DynamicItem[]>([]);
  const [animatingButton, setAnimatingButton] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
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
      itemType: serviceData.item_type || 'service',
      supportsUnit: serviceData.supports_unit,
      supportsKilo: serviceData.supports_kilo,
      kiloPrice: serviceData.kilo_price,
    }));
  }, [servicesData]);

  // Separate services and products, then narrow by the name search
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const serviceItems = React.useMemo(() =>
    services.filter(s => s.itemType === 'service' || !s.itemType),
    [services]
  );

  const productItems = React.useMemo(() =>
    services.filter(s => s.itemType === 'product'),
    [services]
  );

  const filteredServiceItems = React.useMemo(() =>
    normalizedSearch ? serviceItems.filter(s => s.name.toLowerCase().includes(normalizedSearch)) : serviceItems,
    [serviceItems, normalizedSearch]
  );

  const filteredProductItems = React.useMemo(() =>
    normalizedSearch ? productItems.filter(s => s.name.toLowerCase().includes(normalizedSearch)) : productItems,
    [productItems, normalizedSearch]
  );

  const hasSearchResults = filteredServiceItems.length > 0 || filteredProductItems.length > 0;

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
      return `Hari ini pukul ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Besok pukul ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('id-ID', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      // Service categories
      case 'wash': return 'bg-blue-100 text-blue-800';
      case 'dry': return 'bg-green-100 text-green-800';
      case 'special': return 'bg-purple-100 text-purple-800';
      case 'ironing': return 'bg-orange-100 text-orange-800';
      case 'folding': return 'bg-yellow-100 text-yellow-800';
      // Product categories
      case 'detergent': return 'bg-cyan-100 text-cyan-800';
      case 'perfume': return 'bg-pink-100 text-pink-800';
      case 'softener': return 'bg-indigo-100 text-indigo-800';
      case 'other_goods': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'wash': return 'Cuci';
      case 'dry': return 'Kering';
      case 'special': return 'Khusus';
      case 'ironing': return 'Setrika';
      case 'folding': return 'Lipat';
      case 'detergent': return 'Deterjen';
      case 'perfume': return 'Parfum';
      case 'softener': return 'Pelembut';
      case 'other_goods': return 'Produk Lainnya';
      default: return category;
    }
  };

  const addService = (service: Service, type: 'unit' | 'kilo') => {
    // Trigger animation
    const buttonKey = `${service.id}-${type}`;
    setAnimatingButton(buttonKey);
    setTimeout(() => setAnimatingButton(null), 300);

    onAddService(service, type);
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

  const isDynamicItemValid = (item: DynamicItem) => {
    return item.itemName.trim() !== '' && item.price > 0 && item.quantity > 0;
  };

  const confirmDynamicItem = (id: string) => {
    const item = dynamicItems.find(i => i.id === id);
    if (!item || !isDynamicItemValid(item)) return;
    onAddCustomItem(item);
    setDynamicItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold sm:gap-2 sm:text-base">
        <Plus className="h-4 w-4 flex-shrink-0" />
        Tambah Layanan & Item
      </h3>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="services" className="text-xs sm:text-sm">Layanan Tersedia</TabsTrigger>
          <TabsTrigger value="custom" className="text-xs sm:text-sm">Item Kustom</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="mt-3 sm:mt-4">
          <div className="space-y-3">
            {services.length > 3 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari layanan atau produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}

            <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1 sm:max-h-[420px]">
              {isLoading ? (
                <div className="text-center py-4">Memuat layanan...</div>
              ) : services.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Tidak ada layanan tersedia.</p>
                  <p className="text-sm">Anda dapat membuat item kustom sebagai gantinya.</p>
                </div>
              ) : !hasSearchResults ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Tidak ada layanan yang cocok dengan pencarian.</p>
                </div>
              ) : (
                <>
                  {/* Services Section */}
                  {filteredServiceItems.length > 0 && (
                    <div className="space-y-2 sm:space-y-3">
                      <span className="inline-block rounded-full bg-pos-highlight/30 px-2.5 py-1 text-xs font-semibold text-primary">
                        Layanan Laundry
                      </span>
                      {filteredServiceItems.map((service) => (
                        <Card key={service.id} className="p-2.5 sm:p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h3 className="truncate text-sm font-semibold sm:text-base">{service.name}</h3>
                                <Badge className={`${getCategoryColor(service.category)} px-1.5 py-0 text-[10px] sm:text-xs`}>
                                  {getCategoryLabel(service.category)}
                                </Badge>
                              </div>
                              {service.durationValue > 0 && (
                                <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-gray-500 sm:text-xs">
                                  <Clock className="h-3 w-3 flex-shrink-0" />
                                  {service.duration}
                                  <span className="text-pos-success">
                                    · Siap {formatDate(calculateFinishDate(service.durationValue, service.durationUnit))}
                                  </span>
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0 text-right">
                              {service.supportsUnit && service.price && (
                                <div className="text-sm font-semibold text-blue-600 sm:text-base">
                                  Rp{service.price.toLocaleString('id-ID')}
                                </div>
                              )}
                              {service.supportsKilo && service.kiloPrice && (
                                <div className="text-[11px] text-gray-600 sm:text-sm">
                                  Rp{service.kiloPrice.toLocaleString('id-ID')}/kg
                                </div>
                              )}
                            </div>
                          </div>

                          {disabled && (
                            <p className="mt-1.5 text-[11px] text-pos-warning sm:text-xs">
                              Lengkapi informasi pelanggan terlebih dahulu.
                            </p>
                          )}

                          <div className="mt-2 flex gap-1.5 sm:mt-3 sm:gap-2">
                            {service.supportsUnit && service.price && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addService(service, 'unit')}
                                disabled={disabled}
                                className={`h-8 flex-1 text-xs transition-all sm:h-9 sm:text-sm ${animatingButton === `${service.id}-unit` ? 'animate-button-success bg-pos-success/10 border-pos-success/40' : ''}`}
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
                                disabled={disabled}
                                className={`h-8 flex-1 text-xs transition-all sm:h-9 sm:text-sm ${animatingButton === `${service.id}-kilo` ? 'animate-button-success bg-pos-success/10 border-pos-success/40' : ''}`}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Tambah Kilo
                              </Button>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Products Section */}
                  {filteredProductItems.length > 0 && (
                    <div className="space-y-2 sm:space-y-3">
                      <span className="inline-block rounded-full bg-pos-highlight/30 px-2.5 py-1 text-xs font-semibold text-primary">
                        Produk & Barang
                      </span>
                      {filteredProductItems.map((product) => (
                        <Card key={product.id} className="p-2.5 sm:p-4 border-cyan-200 bg-cyan-50/30">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h3 className="truncate text-sm font-semibold sm:text-base">{product.name}</h3>
                                <Badge className={`${getCategoryColor(product.category)} px-1.5 py-0 text-[10px] sm:text-xs`}>
                                  {getCategoryLabel(product.category)}
                                </Badge>
                              </div>
                              {product.description && (
                                <p className="text-[11px] text-gray-600 sm:text-xs">{product.description}</p>
                              )}
                            </div>
                            <div className="flex-shrink-0 text-right">
                              {product.supportsUnit && product.price && (
                                <div className="text-sm font-semibold text-cyan-700 sm:text-base">
                                  Rp{product.price.toLocaleString('id-ID')}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-2 flex gap-1.5 sm:mt-3 sm:gap-2">
                            {product.supportsUnit && product.price && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addService(product, 'unit')}
                                disabled={disabled}
                                className={`h-8 flex-1 text-xs transition-all border-cyan-300 hover:bg-cyan-100 sm:h-9 sm:text-sm ${animatingButton === `${product.id}-unit` ? 'animate-button-success bg-pos-success/10 border-pos-success/40' : ''}`}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Tambah Produk
                              </Button>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="custom" className="mt-3 sm:mt-4">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
              <h4 className="text-sm font-semibold sm:text-base">Item Kustom</h4>
              <Button
                variant="outline"
                onClick={addDynamicItem}
                disabled={disabled}
                className="bg-accent/10 border-accent/40 text-accent-foreground hover:bg-accent/20 w-full sm:w-auto"
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
                  <Card key={item.id} className="p-4 border-accent/30 bg-accent/5">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-3">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Nama Item *</label>
                            <Input
                              placeholder="Contoh: Cuci Kering Khusus, Cuci Express"
                              value={item.itemName}
                              onChange={(e) => updateDynamicItem(item.id, 'itemName', e.target.value)}
                              className={item.itemName.trim() === '' ? 'border-destructive' : ''}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                              className={item.price <= 0 ? 'border-destructive' : ''}
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
                                <div className="text-pos-success text-xs">
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
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        onClick={() => confirmDynamicItem(item.id)}
                        disabled={disabled || !isDynamicItemValid(item)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah ke Pesanan
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
