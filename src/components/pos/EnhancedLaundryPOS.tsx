import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Clock, CreditCard, User, ShoppingCart, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '@/hooks/useCustomers';
import { useCreateOrderWithNotifications as useCreateOrder, UnitItem } from '@/hooks/useOrdersWithNotifications';
import { useToast } from '@/hooks/use-toast';
import { useServices } from '@/hooks/useServices';
import { EnhancedServiceSelector, Service, EnhancedOrderItem } from './EnhancedServiceSelector';
import { DynamicOrderItemsManager, DynamicOrderItemData } from './DynamicOrderItem';

export const EnhancedLaundryPOS = () => {
  const [currentOrder, setCurrentOrder] = useState<EnhancedOrderItem[]>([]);
  const [dynamicItems, setDynamicItems] = useState<DynamicOrderItemData[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSelectingCustomer, setIsSelectingCustomer] = useState(false);
  const [dropOffDate, setDropOffDate] = useState(() => {
    // Set to current date/time in Asia/Jakarta timezone
    const now = new Date();
    const jakartaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
    return jakartaTime;
  });
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  
  const navigate = useNavigate();
  const { customers, searchCustomers, getCustomerByPhone, loading: customersLoading } = useCustomers();
  const createOrderMutation = useCreateOrder();
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load services from our service management system
  const { data: servicesData, isLoading: servicesLoading, error: servicesError } = useServices();

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
      supportsKilo: serviceData.supports_kilo,
      kiloPrice: serviceData.kilo_price,
    }));
  }, [servicesData]);

  // Helper function to calculate finish date based on service duration
  const calculateFinishDate = (service: Service, startDate: Date = dropOffDate) => {
    const finishDate = new Date(startDate);
    
    if (service.durationUnit === 'hours') {
      finishDate.setHours(finishDate.getHours() + service.durationValue);
    } else if (service.durationUnit === 'days') {
      finishDate.setDate(finishDate.getDate() + service.durationValue);
    }
    
    return finishDate;
  };

  // Calculate finish date for dynamic items
  const calculateDynamicItemFinishDate = (item: DynamicOrderItemData, startDate: Date = dropOffDate) => {
    const finishDate = new Date(startDate);
    
    if (item.durationUnit === 'hours') {
      finishDate.setHours(finishDate.getHours() + item.durationValue);
    } else if (item.durationUnit === 'days') {
      finishDate.setDate(finishDate.getDate() + item.durationValue);
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

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'wash': return 'bg-blue-100 text-blue-800';
      case 'dry': return 'bg-green-100 text-green-800';
      case 'ironing': return 'bg-orange-100 text-orange-800';
      case 'folding': return 'bg-yellow-100 text-yellow-800';
      case 'special': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get total price including both regular and dynamic items
  const getTotalPrice = () => {
    const regularItemsTotal = currentOrder.reduce((sum, item) => sum + item.totalPrice, 0);
    const dynamicItemsTotal = dynamicItems.reduce((sum, item) => sum + item.totalPrice, 0);
    return regularItemsTotal + dynamicItemsTotal;
  };

  // Get the estimated completion time for the entire order
  const getOrderCompletionTime = () => {
    if (currentOrder.length === 0 && dynamicItems.length === 0) return null;
    
    let longestDate = new Date();

    // Check regular service items
    if (currentOrder.length > 0) {
      const longestService = currentOrder.reduce((longest, item) => {
        const currentFinish = calculateFinishDate(item.service);
        const longestFinish = longest ? calculateFinishDate(longest.service) : new Date();
        return currentFinish > longestFinish ? item : longest;
      }, currentOrder[0]);
      longestDate = calculateFinishDate(longestService.service);
    }

    // Check dynamic items
    if (dynamicItems.length > 0) {
      const longestDynamicDate = dynamicItems.reduce((longest, item) => {
        const currentFinish = calculateDynamicItemFinishDate(item);
        return currentFinish > longest ? currentFinish : longest;
      }, longestDate);
      
      if (longestDynamicDate > longestDate) {
        longestDate = longestDynamicDate;
      }
    }
    
    return longestDate;
  };

  // Search for customers when phone number changes
  useEffect(() => {
    const searchCustomer = async () => {
      const isFormFilled = customerPhone.length >= 3 && customerName.trim().length > 0;
      
      if (customerPhone.length >= 3 && !isSelectingCustomer && !isFormFilled) {
        await searchCustomers(customerPhone);
        setShowResults(true);
      } else if (!isSelectingCustomer) {
        setSearchResults([]);
        setShowResults(false);
      }
    };

    const debounceTimer = setTimeout(searchCustomer, 300);
    return () => clearTimeout(debounceTimer);
  }, [customerPhone, customerName, searchCustomers, isSelectingCustomer]);

  // Update search results when customers data changes
  useEffect(() => {
    const isFormFilled = customerPhone.length >= 3 && customerName.trim().length > 0;
    
    if (showResults && customerPhone.length >= 3 && !isSelectingCustomer && !isFormFilled && customers.length > 0) {
      setSearchResults(customers);
    } else if (isSelectingCustomer || isFormFilled) {
      setSearchResults([]);
    }
  }, [customers, showResults, customerPhone, customerName, isSelectingCustomer]);

  // Handle customer selection from search
  const handleCustomerSelect = (customer: any) => {
    setIsSelectingCustomer(true);
    setShowResults(false);
    setSearchResults([]);
    setCustomerPhone(customer.phone);
    setCustomerName(customer.name);
    
    setTimeout(() => {
      setIsSelectingCustomer(false);
    }, 500);
  };

  // Clear customer form
  const clearCustomerForm = () => {
    setCustomerPhone('');
    setCustomerName('');
    setSearchResults([]);
    setShowResults(false);
    // Reset to current Jakarta time
    const now = new Date();
    const jakartaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
    setDropOffDate(jakartaTime);
  };

  // Handle phone input blur
  const handlePhoneInputBlur = () => {
    setTimeout(() => {
      setShowResults(false);
      setSearchResults([]);
    }, 200);
  };

  // Handle service selection
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setShowServiceDialog(true);
  };

  // Handle enhanced order item addition
  const handleOrderItemAdd = (item: EnhancedOrderItem | null) => {
    if (item) {
      // Check if this service already exists in the order
      const existingIndex = currentOrder.findIndex(orderItem => 
        orderItem.service.id === item.service.id &&
        orderItem.serviceType === item.serviceType
      );

      if (existingIndex >= 0) {
        // Update existing item
        const updatedOrder = [...currentOrder];
        updatedOrder[existingIndex] = item;
        setCurrentOrder(updatedOrder);
      } else {
        // Add new item
        setCurrentOrder(prev => [...prev, item]);
      }
      
      setShowServiceDialog(false);
      setSelectedService(null);
    }
  };

  // Remove item from order
  const removeFromOrder = (index: number) => {
    setCurrentOrder(prev => prev.filter((_, i) => i !== index));
  };

  // Process payment
  const processPayment = async () => {
    if (currentOrder.length === 0 && dynamicItems.length === 0) {
      toast({
        title: "Error",
        description: "No items in order",
        variant: "destructive",
      });
      return;
    }

    if (!customerName || !customerPhone) {
      toast({
        title: "Error", 
        description: "Please provide customer information",
        variant: "destructive",
      });
      return;
    }

    try {
      const subtotal = getTotalPrice();
      const totalAmount = subtotal;
      const completionDate = getOrderCompletionTime();

      // Combine regular order items and dynamic items
      const regularItems = currentOrder.map(item => ({
        service_name: item.service.name,
        service_price: item.service.price,
        quantity: item.quantity,
        estimated_completion: calculateFinishDate(item.service, dropOffDate).toISOString(),
        service_type: item.serviceType,
        weight_kg: item.weight,
        unit_items: item.unitItems,
      }));

      const dynamicOrderItems = dynamicItems.map(item => ({
        service_name: item.itemName,
        service_price: item.price,
        quantity: item.quantity,
        estimated_completion: calculateDynamicItemFinishDate(item, dropOffDate).toISOString(),
        service_type: 'unit' as const,
        weight_kg: undefined,
        unit_items: undefined,
      }));

      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        items: [...regularItems, ...dynamicOrderItems],
        subtotal,
        tax_amount: 0,
        total_amount: totalAmount,
        execution_status: 'in_queue',
        payment_status: 'completed',
        payment_method: 'cash',
        payment_amount: totalAmount,
        order_date: dropOffDate.toISOString(),
        estimated_completion: completionDate?.toISOString(),
      };

      await createOrderMutation.mutateAsync(orderData);

      setCurrentOrder([]);
      setDynamicItems([]);
      setCustomerName('');
      setCustomerPhone('');
      
      toast({
        title: "Success",
        description: `Payment processed successfully! Order will be ready ${completionDate ? formatDate(completionDate) : 'soon'}.`,
      });
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  // Create draft order
  const createDraftOrder = async () => {
    if (currentOrder.length === 0 && dynamicItems.length === 0) {
      toast({
        title: "Error",
        description: "No items in order",
        variant: "destructive",
      });
      return;
    }

    if (!customerName || !customerPhone) {
      toast({
        title: "Error", 
        description: "Please provide customer information",
        variant: "destructive",
      });
      return;
    }

    try {
      const subtotal = getTotalPrice();
      const totalAmount = subtotal;
      const completionDate = getOrderCompletionTime();

      // Combine regular order items and dynamic items
      const regularItems = currentOrder.map(item => ({
        service_name: item.service.name,
        service_price: item.service.price,
        quantity: item.quantity,
        estimated_completion: calculateFinishDate(item.service, dropOffDate).toISOString(),
        service_type: item.serviceType,
        weight_kg: item.weight,
        unit_items: item.unitItems,
      }));

      const dynamicOrderItems = dynamicItems.map(item => ({
        service_name: item.itemName,
        service_price: item.price,
        quantity: item.quantity,
        estimated_completion: calculateDynamicItemFinishDate(item, dropOffDate).toISOString(),
        service_type: 'unit' as const,
        weight_kg: undefined,
        unit_items: undefined,
      }));

      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        items: [...regularItems, ...dynamicOrderItems],
        subtotal,
        tax_amount: 0,
        total_amount: totalAmount,
        execution_status: 'in_queue',
        payment_status: 'pending',
        order_date: dropOffDate.toISOString(),
        estimated_completion: completionDate?.toISOString(),
      };

      await createOrderMutation.mutateAsync(orderData);

      setCurrentOrder([]);
      setDynamicItems([]);
      setCustomerName('');
      setCustomerPhone('');
      
      toast({
        title: "Success",
        description: `Draft order created successfully! Estimated completion: ${completionDate ? formatDate(completionDate) : 'TBD'}.`,
      });
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  if (servicesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  if (servicesError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-red-800">Error loading services</h3>
              <p className="text-sm text-red-600">
                Please try refreshing the page or contact support.
              </p>
            </div>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700"
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Management Notice */}
      {services.length === 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-orange-800">No services configured</h3>
                <p className="text-sm text-orange-600">
                  You need to create services first before accepting orders.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/services')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Manage Services
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Information */}
      <Card className="shadow-medium animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <User className="h-5 w-5 mr-2 text-primary" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Phone Number
                </label>
                {customerPhone && customerName && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCustomerForm}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                {customerPhone && customerName && (
                  <CheckCircle className="h-4 w-4 absolute right-3 top-3 text-green-500" />
                )}
                <Input
                  placeholder="Search by phone..."
                  value={customerPhone}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setCustomerPhone(newValue);
                    
                    if (customerName.trim().length > 0 && newValue !== customerPhone) {
                      setCustomerName('');
                    }
                  }}
                  onBlur={handlePhoneInputBlur}
                  onFocus={() => {
                    const isFormFilled = customerPhone.length >= 3 && customerName.trim().length > 0;
                    if (!isSelectingCustomer && customerPhone.length >= 3 && !isFormFilled && searchResults.length > 0) {
                      setShowResults(true);
                    }
                  }}
                  className="pl-10 pr-10"
                />
                {showResults && searchResults.length > 0 && (
                  <div ref={dropdownRef} className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-3 hover:bg-secondary cursor-pointer border-b last:border-b-0"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Customer Name
              </label>
              <Input
                placeholder="Enter customer name..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Drop-off Date & Time
              </label>
              <Input
                type="datetime-local"
                value={dropOffDate.toISOString().slice(0, 16)}
                onChange={(e) => setDropOffDate(new Date(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This affects the estimated completion time for all services
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Custom Items */}
      <Card className="shadow-medium animate-scale-in">
        <CardContent className="p-4 lg:p-6">
          <Tabs defaultValue="services" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="services">Available Services</TabsTrigger>
              <TabsTrigger value="custom">Custom Items</TabsTrigger>
            </TabsList>
            <TabsContent value="services" className="mt-6">
              {services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="p-3 sm:p-4 border rounded-lg hover:shadow-soft transition-smooth cursor-pointer bg-card"
                      onClick={() => handleServiceSelect(service)}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base">{service.name}</h3>
                        <div className="flex space-x-1 mt-1 sm:mt-0">
                          <Badge className={`${getCategoryColor(service.category)} w-fit`}>
                            {service.category}
                          </Badge>
                          {service.supportsKilo && (
                            <Badge variant="outline" className="w-fit">
                              Kilo
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg sm:text-xl font-bold text-primary">
                          Rp{service.price.toLocaleString('id-ID')}
                        </p>
                        {service.supportsKilo && service.kiloPrice && (
                          <p className="text-sm text-gray-600">
                            Rp{service.kiloPrice.toLocaleString('id-ID')}/kg
                          </p>
                        )}
                        <p className="text-xs sm:text-sm text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Duration: {service.duration}
                        </p>
                        <p className="text-xs text-green-600 font-medium">
                          Ready: {formatDate(calculateFinishDate(service))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No predefined services available.</p>
                  <p className="text-sm">You can create custom items or add services first.</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="custom" className="mt-6">
              <DynamicOrderItemsManager
                items={dynamicItems}
                onItemsChange={setDynamicItems}
                disabled={createOrderMutation.isPending}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Current Order */}
      <Card className="bg-card shadow-strong">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Current Order
            {(currentOrder.length > 0 || dynamicItems.length > 0) && (
              <Badge variant="secondary" className="ml-2">
                {currentOrder.length + dynamicItems.length} items
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 lg:p-6">
          {currentOrder.length === 0 && dynamicItems.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <ShoppingCart className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-50" />
              <p className="text-sm sm:text-base">No items in order</p>
              <p className="text-xs sm:text-sm">Add services or custom items to get started</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {currentOrder.map((item, index) => (
                  <div key={`${item.service.id}-${index}`} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-foreground text-sm sm:text-base">{item.service.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {item.serviceType}
                        </Badge>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {item.serviceType === 'unit' && (
                          <span>Quantity: {item.quantity}</span>
                        )}
                        {item.serviceType === 'kilo' && item.weight && (
                          <span>Weight: {item.weight} kg</span>
                        )}
                        {item.serviceType === 'combined' && (
                          <span>Weight: {item.weight} kg + {item.unitItems?.length || 0} unit items</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ready: {formatDate(calculateFinishDate(item.service))}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <span className="font-semibold text-primary">
                        Rp{item.totalPrice.toLocaleString('id-ID')}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromOrder(index)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Dynamic Items */}
                {dynamicItems.map((item, index) => (
                  <div key={`dynamic-${item.id}-${index}`} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-foreground text-sm sm:text-base">{item.itemName}</h4>
                        <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">
                          Custom
                        </Badge>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                        <span>Quantity: {item.quantity} × Rp{item.price.toLocaleString('id-ID')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Duration: {item.duration} | Ready: {formatDate(calculateDynamicItemFinishDate(item))}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <span className="font-semibold text-primary">
                        Rp{item.totalPrice.toLocaleString('id-ID')}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updatedItems = dynamicItems.filter((_, i) => i !== index);
                          setDynamicItems(updatedItems);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="mb-4" />

              {/* Order Completion Information */}
              {getOrderCompletionTime() && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Clock className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="font-semibold text-blue-800">Estimated Completion</span>
                  </div>
                  <p className="text-blue-700">
                    {formatDate(getOrderCompletionTime()!)}
                  </p>
                </div>
              )}

              {/* Order Summary */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>Rp{getTotalPrice().toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={createDraftOrder}
                  disabled={createOrderMutation.isPending}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Draft
                </Button>
                <Button
                  onClick={processPayment}
                  disabled={createOrderMutation.isPending}
                  className="flex items-center"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Process Payment
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Service Selection Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Service: {selectedService?.name}</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <EnhancedServiceSelector
              service={selectedService}
              onItemChange={handleOrderItemAdd}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
