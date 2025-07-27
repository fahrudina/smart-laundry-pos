import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Clock, CreditCard, User, ShoppingCart, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '@/hooks/useCustomers';
import { useOrders } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  durationValue: number; // in hours
  durationUnit: 'hours' | 'days';
  category: 'wash' | 'dry' | 'special';
}

interface OrderItem {
  service: Service;
  quantity: number;
}

const services: Service[] = [
  { 
    id: '1', 
    name: 'Regular Wash', 
    price: 12.99, 
    duration: '2 days', 
    durationValue: 2, 
    durationUnit: 'days', 
    category: 'wash' 
  },
  { 
    id: '2', 
    name: 'Express Wash', 
    price: 19.99, 
    duration: '1 day', 
    durationValue: 1, 
    durationUnit: 'days', 
    category: 'wash' 
  },
  { 
    id: '3', 
    name: 'Dry Clean', 
    price: 24.99, 
    duration: '2 days', 
    durationValue: 2, 
    durationUnit: 'days', 
    category: 'dry' 
  },
  { 
    id: '4', 
    name: 'Express Dry Clean', 
    price: 34.99, 
    duration: '6 hours', 
    durationValue: 6, 
    durationUnit: 'hours', 
    category: 'dry' 
  },
  { 
    id: '5', 
    name: 'Ironing Service', 
    price: 8.99, 
    duration: '2 hours', 
    durationValue: 2, 
    durationUnit: 'hours', 
    category: 'special' 
  },
  { 
    id: '6', 
    name: 'Stain Removal', 
    price: 15.99, 
    duration: '1 day', 
    durationValue: 1, 
    durationUnit: 'days', 
    category: 'special' 
  },
];

export const LaundryPOS = () => {
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSelectingCustomer, setIsSelectingCustomer] = useState(false);
  const [dropOffDate, setDropOffDate] = useState(new Date());
  
  const navigate = useNavigate();
  const { customers, searchCustomers, getCustomerByPhone, loading } = useCustomers();
  const { createOrder, loading: orderLoading } = useOrders();
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
    setDropOffDate(new Date());
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
      const existing = prev.find(item => item.service.id === service.id);
      if (existing) {
        return prev.map(item =>
          item.service.id === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { service, quantity: 1 }];
    });
  };

  const removeFromOrder = (serviceId: string) => {
    setCurrentOrder(prev => prev.filter(item => item.service.id !== serviceId));
  };

  const updateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromOrder(serviceId);
      return;
    }
    setCurrentOrder(prev =>
      prev.map(item =>
        item.service.id === serviceId ? { ...item, quantity } : item
      )
    );
  };

  const getTotalPrice = () => {
    return currentOrder.reduce((total, item) => total + (item.service.price * item.quantity), 0);
  };

  const getCategoryColor = (category: Service['category']) => {
    switch (category) {
      case 'wash': return 'bg-blue-100 text-blue-800';
      case 'dry': return 'bg-purple-100 text-purple-800';
      case 'special': return 'bg-green-100 text-green-800';
    }
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
      const taxAmount = subtotal * 0.0825;
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

      await createOrder(orderData);

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
      const taxAmount = subtotal * 0.0825;
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
        })),
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        execution_status: 'in_queue',
        payment_status: 'pending',
        order_date: dropOffDate.toISOString(),
        estimated_completion: completionDate?.toISOString(),
      };

      await createOrder(orderData);

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

      {/* Services Grid */}
      <Card className="shadow-medium animate-scale-in">
        <CardHeader>
          <CardTitle className="text-lg">Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="p-3 sm:p-4 border rounded-lg hover:shadow-soft transition-smooth cursor-pointer bg-card"
                onClick={() => addToOrder(service)}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">{service.name}</h3>
                  <Badge className={`${getCategoryColor(service.category)} mt-1 sm:mt-0 w-fit`}>
                    {service.category}
                  </Badge>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-primary mb-1">
                  ${service.price}
                </p>
                <div className="space-y-1">
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
        </CardContent>
      </Card>

      {/* Current Order */}
      <Card className="bg-card shadow-strong">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Current Order
            {currentOrder.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {currentOrder.reduce((sum, item) => sum + item.quantity, 0)} items
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 lg:p-6">
          {currentOrder.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <ShoppingCart className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-50" />
              <p className="text-sm sm:text-base">No items in order</p>
              <p className="text-xs sm:text-sm">Add services to get started</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                {currentOrder.map((item) => (
                  <div key={item.service.id} className="flex items-center justify-between p-2 sm:p-3 bg-secondary rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm sm:text-base truncate">{item.service.name}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        ${item.service.price} × {item.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                        Ready: {formatDate(calculateFinishDate(item.service))}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.service.id, item.quantity - 1)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        -
                      </Button>
                      <span className="w-6 sm:w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.service.id, item.quantity + 1)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        +
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
                    <Clock className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="font-medium text-blue-900">Estimated Completion</span>
                  </div>
                  <p className="text-blue-800 font-semibold">
                    {formatDate(getOrderCompletionTime()!)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Drop-off: {formatDate(dropOffDate)}
                  </p>
                </div>
              )}

              <div className="space-y-2 mb-4 sm:mb-6">
                <div className="flex justify-between text-sm sm:text-lg">
                  <span>Subtotal:</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                  <span>Tax (8.25%):</span>
                  <span>${(getTotalPrice() * 0.0825).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg sm:text-xl font-bold">
                  <span>Total:</span>
                  <span>${(getTotalPrice() * 1.0825).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Button 
                  className="w-full bg-gradient-accent hover:opacity-90 text-accent-foreground font-semibold py-2 sm:py-3 text-sm sm:text-base" 
                  onClick={processPayment}
                  disabled={orderLoading || currentOrder.length === 0 || !customerName || !customerPhone}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {orderLoading ? "Processing..." : "Process Payment"}
                </Button>
                
                <Button 
                  variant="default" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3 text-sm sm:text-base"
                  onClick={createDraftOrder}
                  disabled={orderLoading || currentOrder.length === 0 || !customerName || !customerPhone}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {orderLoading ? "Creating..." : "Create Order (Draft)"}
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="text-xs sm:text-sm py-2" 
                    onClick={createDraftOrder}
                    disabled={orderLoading || currentOrder.length === 0 || !customerName || !customerPhone}
                  >
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Save Draft
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="text-destructive text-xs sm:text-sm py-2" 
                    onClick={() => {
                      setCurrentOrder([]);
                      clearCustomerForm();
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};