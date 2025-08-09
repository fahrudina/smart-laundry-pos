import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Clock, CreditCard, User, ShoppingCart, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '@/hooks/useCustomers';
//import { useCreateOrder, UnitItem } from '@/hooks/useOrdersOptimized';
import { useCreateOrderWithNotifications as useCreateOrder, UnitItem } from '@/hooks/useOrdersWithNotifications';
import { useToast } from '@/hooks/use-toast';
import { ServiceSelectionPopup } from './ServiceSelectionPopup';
import { FloatingOrderSummary } from './FloatingOrderSummary';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  durationValue: number; // in hours
  durationUnit: 'hours' | 'days';
  category: 'wash' | 'dry' | 'special';
  supportsKilo?: boolean; // Whether this service supports kilo pricing
  kiloPrice?: number; // Price per kg if supports kilo
}

interface OrderItem {
  service: Service;
  quantity: number;
  serviceType: 'unit' | 'kilo' | 'combined';
  weight?: number;
  unitItems?: UnitItem[];
  totalPrice: number;
}

const services: Service[] = [
  { 
    id: '1', 
    name: 'Regular Wash', 
    price: 12.99, 
    duration: '2 days', 
    durationValue: 2, 
    durationUnit: 'days', 
    category: 'wash',
    supportsKilo: true,
    kiloPrice: 8.99
  },
  { 
    id: '2', 
    name: 'Express Wash', 
    price: 19.99, 
    duration: '1 day', 
    durationValue: 1, 
    durationUnit: 'days', 
    category: 'wash',
    supportsKilo: true,
    kiloPrice: 14.99
  },
  { 
    id: '3', 
    name: 'Dry Clean', 
    price: 24.99, 
    duration: '2 days', 
    durationValue: 2, 
    durationUnit: 'days', 
    category: 'dry',
    supportsKilo: false
  },
  { 
    id: '4', 
    name: 'Express Dry Clean', 
    price: 34.99, 
    duration: '6 hours', 
    durationValue: 6, 
    durationUnit: 'hours', 
    category: 'dry',
    supportsKilo: false
  },
  { 
    id: '5', 
    name: 'Ironing Service', 
    price: 8.99, 
    duration: '2 hours', 
    durationValue: 2, 
    durationUnit: 'hours', 
    category: 'special',
    supportsKilo: true,
    kiloPrice: 6.99
  },
  { 
    id: '6', 
    name: 'Stain Removal', 
    price: 15.99, 
    duration: '1 day', 
    durationValue: 1, 
    durationUnit: 'days', 
    category: 'special',
    supportsKilo: false
  },
];

export const LaundryPOS = () => {
  // Utility function to get current Jakarta time
  const getJakartaTime = () => {
    const now = new Date();
    // Create a new date that represents Jakarta time (UTC+7)
    const jakartaOffset = 7 * 60; // Jakarta is UTC+7
    const userOffset = now.getTimezoneOffset(); // User's timezone offset in minutes
    const jakartaTime = new Date(now.getTime() + ((jakartaOffset + userOffset) * 60 * 1000));
    return jakartaTime;
  };

  // Utility function to format date for datetime-local input
  const formatForDateTimeLocal = (date: Date) => {
    // Ensure we're working with the local representation
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - offset).toISOString();
    return localISOTime.slice(0, 16);
  };

  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSelectingCustomer, setIsSelectingCustomer] = useState(false);
  const [isServicePopupOpen, setIsServicePopupOpen] = useState(false);
  const [dropOffDate, setDropOffDate] = useState(() => getJakartaTime());
  
  const navigate = useNavigate();
  const { customers, searchCustomers, getCustomerByPhone, loading } = useCustomers();
  const createOrderMutation = useCreateOrder();
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Get the estimated completion time for the entire order
  const getOrderCompletionTime = () => {
    if (currentOrder.length === 0) return null;
    
    // Find the service with the longest duration
    const longestService = currentOrder.reduce((longest, item) => {
      const currentFinish = calculateFinishDate(item.service);
      const longestFinish = longest ? calculateFinishDate(longest.service) : new Date();
      return currentFinish > longestFinish ? item : longest;
    }, currentOrder[0]);
    
    return calculateFinishDate(longestService.service);
  };

  // Search for customers when phone number changes
  useEffect(() => {
    const searchCustomer = async () => {
      // Don't search if form is already filled (customer selected) or currently selecting
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

  // Update search results when customers data changes, but only if we should show results
  useEffect(() => {
    const isFormFilled = customerPhone.length >= 3 && customerName.trim().length > 0;
    
    if (showResults && customerPhone.length >= 3 && !isSelectingCustomer && !isFormFilled && customers.length > 0) {
      setSearchResults(customers);
    } else if (isSelectingCustomer || isFormFilled) {
      // Clear search results when selecting a customer or form is already filled
      setSearchResults([]);
    }
  }, [customers, showResults, customerPhone, customerName, isSelectingCustomer]);

  // Handle customer selection from search
  const handleCustomerSelect = (customer: any) => {
    // Prevent any further searching while selecting
    setIsSelectingCustomer(true);
    
    // Immediately hide the dropdown and clear results
    setShowResults(false);
    setSearchResults([]);
    
    // Update the form fields
    setCustomerPhone(customer.phone);
    setCustomerName(customer.name);
    
    // Reset the selection flag after state updates
    setTimeout(() => {
      setIsSelectingCustomer(false);
    }, 500); // Increased timeout to ensure all updates complete
  };

  // Clear customer form
  const clearCustomerForm = () => {
    setCustomerPhone('');
    setCustomerName('');
    setSearchResults([]);
    setShowResults(false);
    setIsSelectingCustomer(false);
    // Reset to current Jakarta time
    setDropOffDate(getJakartaTime());
  };

  // Handle input blur to hide results
  const handlePhoneInputBlur = () => {
    // Only hide if we haven't just selected a customer
    if (!isSelectingCustomer) {
      setTimeout(() => {
        setShowResults(false);
        setSearchResults([]);
      }, 150); // Slight delay to allow click events to fire first
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

    const addToOrder = (service: Service) => {
    setCurrentOrder(prev => {
      const existingItem = prev.find(item => item.service.id === service.id);
      if (existingItem) {
        return prev.map(item =>
          item.service.id === service.id
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * service.price
              }
            : item
        );
      } else {
        return [...prev, { 
          service, 
          quantity: 1, 
          serviceType: 'unit' as const,
          totalPrice: service.price
        }];
      }
    });
  };

  const removeFromOrder = (serviceId: string, serviceType: 'unit' | 'kilo' | 'combined' = 'unit') => {
    setCurrentOrder(prev => prev.filter(item => !(item.service.id === serviceId && item.serviceType === serviceType)));
  };

  const updateQuantity = (serviceId: string, quantity: number, serviceType: 'unit' | 'kilo' | 'combined' = 'unit') => {
    if (quantity <= 0) {
      removeFromOrder(serviceId, serviceType);
      return;
    }
    setCurrentOrder(prev =>
      prev.map(item =>
        item.service.id === serviceId && item.serviceType === serviceType
          ? { 
              ...item, 
              quantity, 
              weight: serviceType === 'kilo' ? quantity : item.weight,
              totalPrice: quantity * item.service.price 
            } 
          : item
      )
    );
  };

  const getTotalPrice = () => {
    return currentOrder.reduce((total, item) => total + item.totalPrice, 0);
  };

  const getCategoryColor = (category: Service['category']) => {
    switch (category) {
      case 'wash': return 'bg-blue-100 text-blue-800';
      case 'dry': return 'bg-purple-100 text-purple-800';
      case 'special': return 'bg-green-100 text-green-800';
    }
  };

  // Handle services selected from popup
  const handleServicesSelected = (selectedServices: any[]) => {
    selectedServices.forEach(selectedService => {
      const service: Service = {
        id: selectedService.service.id,
        name: selectedService.service.name,
        price: selectedService.price,
        duration: `${selectedService.service.duration_value} ${selectedService.service.duration_unit}`,
        durationValue: selectedService.service.duration_value,
        durationUnit: selectedService.service.duration_unit,
        category: selectedService.service.category,
        supportsKilo: selectedService.service.supports_kilo,
        kiloPrice: selectedService.service.kilo_price,
      };

      // Add to order with the specified quantity
      setCurrentOrder(prev => {
        const existingItem = prev.find(item => 
          item.service.id === service.id && 
          item.serviceType === selectedService.type
        );
        
        if (existingItem) {
          return prev.map(item =>
            item.service.id === service.id && item.serviceType === selectedService.type
              ? { 
                  ...item, 
                  quantity: item.quantity + selectedService.quantity,
                  totalPrice: (item.quantity + selectedService.quantity) * service.price,
                  weight: selectedService.type === 'kilo' ? selectedService.quantity : undefined
                }
              : item
          );
        } else {
          return [...prev, { 
            service, 
            quantity: selectedService.quantity, 
            serviceType: selectedService.type as 'unit' | 'kilo',
            weight: selectedService.type === 'kilo' ? selectedService.quantity : undefined,
            totalPrice: selectedService.quantity * service.price
          }];
        }
      });
    });
  };

  const processPayment = async () => {
    if (currentOrder.length === 0) {
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
      const taxAmount = subtotal * 0.11;
      const totalAmount = subtotal + taxAmount;
      const completionDate = getOrderCompletionTime();

      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        items: currentOrder.map(item => ({
          service_name: item.service.name,
          service_price: item.service.price,
          quantity: item.quantity,
          estimated_completion: calculateFinishDate(item.service, dropOffDate).toISOString(),
          service_type: item.serviceType || 'unit',
          weight_kg: item.weight,
          unit_items: item.unitItems,
        })),
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        execution_status: 'in_queue',
        payment_status: 'completed',
        payment_method: 'cash', // Default to cash, will be configurable later
        payment_amount: totalAmount,
        order_date: dropOffDate.toISOString(),
        estimated_completion: completionDate?.toISOString(),
      };

      await createOrderMutation.mutateAsync(orderData);

      // Clear the current order after successful payment
      setCurrentOrder([]);
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

  const createDraftOrder = async () => {
    if (currentOrder.length === 0) {
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
      const taxAmount = subtotal * 0.11;
      const totalAmount = subtotal + taxAmount;
      const completionDate = getOrderCompletionTime();

      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        items: currentOrder.map(item => ({
          service_name: item.service.name,
          service_price: item.service.price,
          quantity: item.quantity,
          estimated_completion: calculateFinishDate(item.service, dropOffDate).toISOString(),
          service_type: item.serviceType || 'unit',
          weight_kg: item.weight,
          unit_items: item.unitItems,
        })),
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        execution_status: 'in_queue',
        payment_status: 'pending',
        order_date: dropOffDate.toISOString(),
        estimated_completion: completionDate?.toISOString(),
      };

      await createOrderMutation.mutateAsync(orderData);

      // Clear the current order after successful creation
      setCurrentOrder([]);
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

  return (
    <div className="space-y-6">
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
                    
                    // If user is typing and the name field is filled, it means they want to search for a new customer
                    // Clear the name field to allow new search
                    if (customerName.trim().length > 0 && newValue !== customerPhone) {
                      setCustomerName('');
                    }
                  }}
                  onBlur={handlePhoneInputBlur}
                  onFocus={() => {
                    // Only show results if not currently selecting a customer, phone has enough characters,
                    // form is not already filled, and there are search results
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
                        onMouseDown={(e) => {
                          // Prevent blur event from firing before click
                          e.preventDefault();
                        }}
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
                value={formatForDateTimeLocal(dropOffDate)}
                onChange={(e) => {
                  // Convert the local input to a proper Date object
                  const newDate = new Date(e.target.value);
                  setDropOffDate(newDate);
                }}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This affects the estimated completion time for all services (Jakarta Time: GMT+7)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Service Section */}
      <Card className="shadow-medium animate-scale-in">
        <CardContent className="pt-6">
          <ServiceSelectionPopup
            onServicesSelected={handleServicesSelected}
            disabled={!customerName || !customerPhone}
            isOpen={isServicePopupOpen}
            onOpenChange={setIsServicePopupOpen}
          />
        </CardContent>
      </Card>

      {/* 
        Current Order Section - Replaced by FloatingOrderSummary
        This section has been commented out as the order summary is now displayed 
        in a floating overlay at the bottom of the screen for better UX
      */}

      {/* Floating Order Summary */}
      <FloatingOrderSummary
        currentOrder={currentOrder}
        getTotalPrice={getTotalPrice}
        getOrderCompletionTime={getOrderCompletionTime}
        formatDate={formatDate}
        dropOffDate={dropOffDate}
        onProcessPayment={processPayment}
        onCreateDraft={createDraftOrder}
        onOpenServicePopup={() => setIsServicePopupOpen(true)}
        isProcessing={createOrderMutation.isPending}
        customerName={customerName}
        customerPhone={customerPhone}
        calculateFinishDate={calculateFinishDate}
        updateQuantity={updateQuantity}
        removeFromOrder={removeFromOrder}
      />
    </div>
  );
};