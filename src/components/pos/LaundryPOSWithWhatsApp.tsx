import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Clock, CreditCard, User, ShoppingCart, CheckCircle, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '@/hooks/useCustomers';
import { useCreateOrderWithNotifications, UnitItem } from '@/hooks/useOrdersWithNotifications';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { useToast } from '@/hooks/use-toast';
import { useServices } from '@/hooks/useServices';
import { EnhancedServiceSelector, Service, EnhancedOrderItem } from './EnhancedServiceSelector';
import { FloatingOrderSummary } from './FloatingOrderSummary';

/**
 * Enhanced LaundryPOS with WhatsApp integration
 * 
 * Key changes:
 * 1. Import useCreateOrderWithNotifications instead of useCreateOrder
 * 2. Import useWhatsApp hook for manual notifications
 * 3. Add WhatsApp status indicator in UI
 */
const EnhancedLaundryPOS = () => {
  // State variables
  const [currentOrder, setCurrentOrder] = useState<EnhancedOrderItem[]>([]);
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
  const [isServicePopupOpen, setIsServicePopupOpen] = useState(false);
  
  const navigate = useNavigate();
  const { customers, searchCustomers, getCustomerByPhone, loading: customersLoading } = useCustomers();
  
  // Enhanced order creation with automatic WhatsApp notifications
  const createOrderMutation = useCreateOrderWithNotifications();
  
  // WhatsApp integration hook for manual notifications and status
  const { isConfigured: whatsappConfigured, sendCustomMessage } = useWhatsApp();
  
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

  // Get total price
  const getTotalPrice = () => {
    return currentOrder.reduce((sum, item) => sum + item.totalPrice, 0);
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

  // Update quantity for order item (compatible with FloatingOrderSummary)
  const updateQuantity = (serviceId: string, newQuantity: number, serviceType: 'unit' | 'kilo' | 'combined') => {
    if (newQuantity <= 0) {
      removeFromOrder(serviceId, serviceType);
      return;
    }

    setCurrentOrder(prev => prev.map((item) => {
      if (item.service.id === serviceId && item.serviceType === serviceType) {
        const updatedItem = { ...item, quantity: newQuantity };
        // Recalculate total price
        if (item.serviceType === 'kilo') {
          updatedItem.totalPrice = (item.service.kiloPrice || 0) * item.weight * newQuantity;
        } else {
          updatedItem.totalPrice = item.service.price * newQuantity;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  // Remove item from order (compatible with FloatingOrderSummary)
  const removeFromOrder = (serviceId: string, serviceType: 'unit' | 'kilo' | 'combined') => {
    setCurrentOrder(prev => prev.filter(item => 
      !(item.service.id === serviceId && item.serviceType === serviceType)
    ));
  };

  // Create draft order
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
          service_type: item.serviceType,
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
        description: "Please enter customer information",
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
          service_type: item.serviceType,
          weight_kg: item.weight,
          unit_items: item.unitItems,
        })),
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        execution_status: 'in_queue',
        payment_status: 'completed',
        payment_method: 'cash',
        payment_amount: totalAmount,
        order_date: dropOffDate.toISOString(),
        estimated_completion: completionDate?.toISOString(),
      };

      // This will automatically send WhatsApp notification for order creation
      await createOrderMutation.mutateAsync(orderData);

      // Clear the current order after successful payment
      setCurrentOrder([]);
      setCustomerName('');
      setCustomerPhone('');
      
      // Enhanced success message with WhatsApp status
      const whatsappStatus = whatsappConfigured 
        ? "WhatsApp notification sent to customer." 
        : "WhatsApp not configured - customer was not notified.";
      
      toast({
        title: "Success",
        description: `Payment processed successfully! ${whatsappStatus} Order will be ready ${completionDate ? formatDate(completionDate) : 'soon'}.`,
      });
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  // Enhanced function to send custom notification
  const sendCustomNotification = async () => {
    if (!customerPhone) {
      toast({
        title: "Error",
        description: "Please enter customer phone number",
        variant: "destructive",
      });
      return;
    }

    const customMessage = `Halo ${customerName || 'Customer'}! Ini adalah pesan khusus dari Smart Laundry POS. Terima kasih telah menggunakan layanan kami! 🧺✨`;
    
    await sendCustomMessage(customerPhone, customMessage);
  };

  // ... existing helper functions remain the same ...

  return (
    <div className="space-y-6">
      {/* Enhanced header with WhatsApp status */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Point of Sale</h1>
        <div className="flex items-center space-x-2">
          {/* WhatsApp Status Indicator */}
          <Badge 
            variant={whatsappConfigured ? "default" : "secondary"} 
            className="flex items-center space-x-1"
          >
            <MessageSquare className="h-3 w-3" />
            <span>WhatsApp {whatsappConfigured ? "ON" : "OFF"}</span>
          </Badge>
          
          <Button 
            onClick={() => navigate('/order-history')} 
            variant="outline"
          >
            Order History
          </Button>
        </div>
      </div>

      {/* Customer Information Card - Enhanced with WhatsApp controls */}
      <Card className="shadow-medium animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <User className="h-5 w-5 mr-2 text-primary" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Existing customer form fields remain the same */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                {whatsappConfigured && customerPhone && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={sendCustomNotification}
                    className="h-6 px-2 text-xs"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Send Message
                  </Button>
                )}
              </div>
              <Input
                placeholder="Enter phone number (e.g., 08123456789)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            {/* Customer name field remains the same */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* WhatsApp notification info */}
          {whatsappConfigured && (customerName || customerPhone) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-green-800">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Customer will receive WhatsApp notifications automatically
                </span>
              </div>
            </div>
          )}

          {/* Customer search results */}
          {showResults && searchResults.length > 0 && (
            <div 
              ref={dropdownRef}
              className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto"
            >
              {searchResults.map((customer) => (
                <div
                  key={customer.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <div className="font-medium text-gray-900">{customer.name}</div>
                  <div className="text-sm text-gray-600">{customer.phone}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Selection Section */}
      <Card className="shadow-medium animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <ShoppingCart className="h-5 w-5 mr-2 text-primary" />
            Available Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => handleServiceSelect(service)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                    {service.name}
                  </h3>
                  <Badge 
                    className={`text-xs ${getCategoryColor(service.category)}`}
                  >
                    {service.category}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-primary">
                    Rp {service.price.toLocaleString()}
                    {service.supportsKilo && service.kiloPrice && (
                      <span className="text-sm text-gray-600 ml-1">
                        / item (Rp {service.kiloPrice.toLocaleString()}/kg)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-3 w-3 mr-1" />
                    {service.duration}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Selection Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure Service: {selectedService?.name}</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <EnhancedServiceSelector
              service={selectedService}
              onItemChange={handleOrderItemAdd}
              disabled={false}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Floating Order Summary remains the same but will automatically 
          trigger WhatsApp notifications when orders are processed */}
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

export default EnhancedLaundryPOS;
