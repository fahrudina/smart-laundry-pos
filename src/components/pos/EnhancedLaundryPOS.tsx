import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Clock, CreditCard, User, ShoppingCart, CheckCircle, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '@/hooks/useCustomers';
import { useCreateOrderWithNotifications as useCreateOrder, UnitItem } from '@/hooks/useOrdersWithNotifications';
import { toast } from 'sonner';
import { useServices } from '@/hooks/useServices';
import { EnhancedOrderItem } from './EnhancedServiceSelector';
import { DynamicOrderItemData } from './DynamicOrderItem';
import { EnhancedServiceSelectionPopup } from './EnhancedServiceSelectionPopup';
import { FloatingOrderSummary } from './FloatingOrderSummary';
import { CashPaymentDialog } from './CashPaymentDialog';
import { OrderSuccessDialog } from './OrderSuccessDialog';
import { ThermalPrintDialog } from '@/components/thermal/ThermalPrintDialog';

export const EnhancedLaundryPOS = () => {
  const [currentOrder, setCurrentOrder] = useState<EnhancedOrderItem[]>([]);
  const [dynamicItems, setDynamicItems] = useState<DynamicOrderItemData[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSelectingCustomer, setIsSelectingCustomer] = useState(false);
  const [isServicePopupOpen, setIsServicePopupOpen] = useState(false);
  const [showCashPaymentDialog, setShowCashPaymentDialog] = useState(false);
  const [showOrderSuccessDialog, setShowOrderSuccessDialog] = useState(false);
  const [showThermalPrintDialog, setShowThermalPrintDialog] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<{
    id: string;
    orderNumber: string;
    totalAmount: number;
    paymentMethod: string;
    customerName: string;
    whatsAppSent: boolean;
    pointsEarned?: number;
  } | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [pointsRedeemed, setPointsRedeemed] = useState(0);
  const [dropOffDate, setDropOffDate] = useState(() => {
    // Set to current date/time in Asia/Jakarta timezone
    const now = new Date();
    // Create a new date that represents the current time in Jakarta
    const jakartaOffset = 7 * 60; // Jakarta is UTC+7
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const jakartaTime = new Date(utc + (jakartaOffset * 60000));
    return jakartaTime;
  });
  
  const navigate = useNavigate();
  const { customers, searchCustomers, getCustomerByPhone, loading: customersLoading } = useCustomers();
  const createOrderMutation = useCreateOrder();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load services from our service management system
  const { data: servicesData, isLoading: servicesLoading, error: servicesError } = useServices();

  // Helper function to calculate finish date based on service duration
  const calculateFinishDate = (service: any, startDate: Date = dropOffDate) => {
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
    const jakartaOffset = 7 * 60; // Jakarta is UTC+7
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const jakartaTime = new Date(utc + (jakartaOffset * 60000));
    setDropOffDate(jakartaTime);
  };

  // Handle phone input blur
  const handlePhoneInputBlur = () => {
    setTimeout(() => {
      setShowResults(false);
      setSearchResults([]);
    }, 200);
  };

  // Handle services and dynamic items selected from popup
  const handleServicesAndItemsSelected = (selectedServices: any[], selectedDynamicItems: any[]) => {
    // Process regular services
    selectedServices.forEach(selectedService => {
      const service = {
        id: selectedService.service.id,
        name: selectedService.service.name,
        price: selectedService.price,
        duration: selectedService.service.duration,
        durationValue: selectedService.service.durationValue,
        durationUnit: selectedService.service.durationUnit,
        category: selectedService.service.category,
        supportsKilo: selectedService.service.supportsKilo,
        kiloPrice: selectedService.service.kiloPrice,
      };

      // Add to regular order with the specified quantity
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
                  weight: selectedService.type === 'kilo' ? selectedService.quantity : item.weight
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

    // Process dynamic items
    selectedDynamicItems.forEach(dynamicItem => {
      const newDynamicItem: DynamicOrderItemData = {
        id: dynamicItem.id,
        itemName: dynamicItem.itemName,
        duration: `${dynamicItem.durationValue} ${dynamicItem.durationUnit}`,
        durationValue: dynamicItem.durationValue,
        durationUnit: dynamicItem.durationUnit,
        price: dynamicItem.price,
        quantity: dynamicItem.quantity,
        totalPrice: dynamicItem.price * dynamicItem.quantity,
      };

      setDynamicItems(prev => {
        const existingIndex = prev.findIndex(item => item.id === dynamicItem.id);
        if (existingIndex >= 0) {
          // Update existing item
          const updated = [...prev];
          updated[existingIndex] = newDynamicItem;
          return updated;
        } else {
          // Add new item
          return [...prev, newDynamicItem];
        }
      });
    });
  };

  // Remove item from order
  const removeFromOrder = (index: number) => {
    setCurrentOrder(prev => prev.filter((_, i) => i !== index));
  };

  // Remove dynamic item
  const removeDynamicItem = (index: number) => {
    setDynamicItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update quantity for service item
  const updateQuantity = (serviceId: string, quantity: number, serviceType: 'unit' | 'kilo' | 'combined') => {
    setCurrentOrder(prev => prev.map(item => {
      if (item.service.id === serviceId && item.serviceType === serviceType) {
        const updatedItem = { ...item, quantity };
        updatedItem.totalPrice = item.service.price * quantity;
        return updatedItem;
      }
      return item;
    }));
  };

  // Remove service item from order
  const removeServiceFromOrder = (serviceId: string, serviceType: 'unit' | 'kilo' | 'combined') => {
    setCurrentOrder(prev => prev.filter(item => 
      !(item.service.id === serviceId && item.serviceType === serviceType)
    ));
  };

  // Process payment
  const processPayment = async (paymentMethod: string = 'cash') => {
    if (currentOrder.length === 0 && dynamicItems.length === 0) {
      toast.error("❌ Tidak ada item dalam pesanan", {
        style: {
          minWidth: '320px',
          maxWidth: '500px',
          width: '90vw',
          padding: '16px',
          fontSize: '16px',
          borderRadius: '12px',
          border: '2px solid #ef4444',
        }
      });
      return;
    }

    if (!customerName || !customerPhone) {
      toast.error("❌ Mohon lengkapi informasi pelanggan", {
        style: {
          minWidth: '320px',
          maxWidth: '500px',
          width: '90vw',
          padding: '16px',
          fontSize: '16px',
          borderRadius: '12px',
          border: '2px solid #ef4444',
        }
      });
      return;
    }

    // Show cash payment dialog for cash payments, otherwise process directly
    if (paymentMethod === 'cash') {
      setShowCashPaymentDialog(true);
    } else {
      // For other payment methods, process directly without cash dialog
      await processNonCashPayment(paymentMethod);
    }
  };

  const processCashPayment = async (cashReceived: number) => {
    try {
      const subtotal = getTotalPrice();
      const totalAmount = subtotal - discountAmount;
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
        category: item.service.category,
        item_type: ['detergent', 'perfume', 'softener', 'other_goods'].includes(item.service.category) ? 'product' : 'service',
      }));

      const dynamicOrderItems = dynamicItems.map(item => ({
        service_name: item.itemName,
        service_price: item.price,
        quantity: item.quantity,
        estimated_completion: calculateDynamicItemFinishDate(item, dropOffDate).toISOString(),
        service_type: 'unit' as const,
        weight_kg: undefined,
        unit_items: undefined,
        category: 'other_goods',
        item_type: 'product' as const,
      }));

      // Check if all items are products (no services)
      const allItems = [...regularItems, ...dynamicOrderItems];
      const allItemsAreProducts = allItems.every(item => item.item_type === 'product');

      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        items: allItems,
        subtotal,
        tax_amount: 0,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        points_redeemed: pointsRedeemed,
        execution_status: allItemsAreProducts ? 'completed' : 'in_queue',
        payment_status: 'completed',
        payment_method: 'cash',
        payment_amount: totalAmount,
        cash_received: cashReceived, // Add the cash received amount
        order_date: dropOffDate.toISOString(),
        estimated_completion: completionDate?.toISOString(),
      };

      const createdOrder = await createOrderMutation.mutateAsync(orderData);

      // Close cash payment dialog
      setShowCashPaymentDialog(false);
      
      // Show order success dialog
      showOrderSuccess(createdOrder, totalAmount, 'cash');
    } catch (error) {
      // Error is already handled in the hook
      setShowCashPaymentDialog(false);
    }
  };

  const processNonCashPayment = async (paymentMethod: string) => {
    try {
      const subtotal = getTotalPrice();
      const totalAmount = subtotal - discountAmount;
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
        category: item.service.category,
        item_type: ['detergent', 'perfume', 'softener', 'other_goods'].includes(item.service.category) ? 'product' : 'service',
      }));

      const dynamicOrderItems = dynamicItems.map(item => ({
        service_name: item.itemName,
        service_price: item.price,
        quantity: item.quantity,
        estimated_completion: calculateDynamicItemFinishDate(item, dropOffDate).toISOString(),
        service_type: 'unit' as const,
        weight_kg: undefined,
        unit_items: undefined,
        category: 'other_goods',
        item_type: 'product' as const,
      }));

      // Check if all items are products (no services)
      const allItems = [...regularItems, ...dynamicOrderItems];
      const allItemsAreProducts = allItems.every(item => item.item_type === 'product');

      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        items: allItems,
        subtotal,
        tax_amount: 0,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        points_redeemed: pointsRedeemed,
        execution_status: allItemsAreProducts ? 'completed' : 'in_queue',
        payment_status: 'completed',
        payment_method: paymentMethod,
        payment_amount: totalAmount,
        order_date: dropOffDate.toISOString(),
        estimated_completion: completionDate?.toISOString(),
      };

      const createdOrder = await createOrderMutation.mutateAsync(orderData);

      // Show order success dialog
      showOrderSuccess(createdOrder, totalAmount, paymentMethod);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  // Create draft order
  const createDraftOrder = async () => {
    if (currentOrder.length === 0 && dynamicItems.length === 0) {
      toast.error("❌ Tidak ada item dalam pesanan", {
        style: {
          minWidth: '320px',
          maxWidth: '500px',
          width: '90vw',
          padding: '16px',
          fontSize: '16px',
          borderRadius: '12px',
          border: '2px solid #ef4444',
        }
      });
      return;
    }

    if (!customerName || !customerPhone) {
      toast.error("❌ Mohon lengkapi informasi pelanggan", {
        style: {
          minWidth: '320px',
          maxWidth: '500px',
          width: '90vw',
          padding: '16px',
          fontSize: '16px',
          borderRadius: '12px',
          border: '2px solid #ef4444',
        }
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
        category: item.service.category,
        item_type: ['detergent', 'perfume', 'softener', 'other_goods'].includes(item.service.category) ? 'product' : 'service',
      }));

      const dynamicOrderItems = dynamicItems.map(item => ({
        service_name: item.itemName,
        service_price: item.price,
        quantity: item.quantity,
        estimated_completion: calculateDynamicItemFinishDate(item, dropOffDate).toISOString(),
        service_type: 'unit' as const,
        weight_kg: undefined,
        unit_items: undefined,
        category: 'other_goods',
        item_type: 'product' as const,
      }));

      // Check if all items are products (no services)
      const allItems = [...regularItems, ...dynamicOrderItems];
      const allItemsAreProducts = allItems.every(item => item.item_type === 'product');

      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        items: allItems,
        subtotal,
        tax_amount: 0,
        total_amount: totalAmount,
        execution_status: allItemsAreProducts ? 'completed' : 'in_queue',
        payment_status: 'pending',
        order_date: dropOffDate.toISOString(),
        estimated_completion: completionDate?.toISOString(),
      };

      const createdOrder = await createOrderMutation.mutateAsync(orderData);

      // Show order success dialog for draft order (same as paid orders)
      showOrderSuccess(createdOrder, totalAmount, 'pending');
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  // Helper function to store order info and show success dialog
  const showOrderSuccess = (createdOrder: any, totalAmount: number, paymentMethod: string) => {
    // Store order info for success dialog
    setLastCreatedOrder({
      id: createdOrder.id,
      orderNumber: createdOrder.id,
      totalAmount: totalAmount,
      paymentMethod: paymentMethod,
      customerName: customerName,
      whatsAppSent: true, // WhatsApp notification is sent asynchronously
      pointsEarned: createdOrder.points_earned || 0,
    });

    // Show toast notification for points earned if applicable
    if (createdOrder.points_earned && createdOrder.points_earned > 0) {
      toast.success(`🎉 Pelanggan mendapat +${createdOrder.points_earned} poin!`, {
        style: {
          minWidth: '320px',
          maxWidth: '500px',
          width: '90vw',
          padding: '16px',
          fontSize: '16px',
          borderRadius: '12px',
          border: '2px solid #f59e0b',
          backgroundColor: '#fffbeb',
          color: '#92400e',
        },
        duration: 5000,
      });
    }

    // Clear the current order and discount
    setCurrentOrder([]);
    setDynamicItems([]);
    setDiscountAmount(0);
    setPointsRedeemed(0);

    // Show success dialog
    setShowOrderSuccessDialog(true);
  };

  // Handle print receipt from success dialog
  const handlePrintReceipt = () => {
    if (lastCreatedOrder) {
      setShowThermalPrintDialog(true);
    }
  };

  // Handle new transaction from success dialog
  const handleNewTransaction = () => {
    // Close success dialog
    setShowOrderSuccessDialog(false);
    
    // Clear customer information for new transaction
    setCustomerName('');
    setCustomerPhone('');
    
    // Reset last created order
    setLastCreatedOrder(null);
    
    // Reset drop off date to current time
    const now = new Date();
    const jakartaOffset = 7 * 60;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const jakartaTime = new Date(utc + (jakartaOffset * 60000));
    setDropOffDate(jakartaTime);
  };

  // Handle dialog close - clear customer info
  const handleDialogClose = () => {
    setShowOrderSuccessDialog(false);
    // Clear customer info when closing dialog
    setCustomerName('');
    setCustomerPhone('');
    setLastCreatedOrder(null);
  };

  if (servicesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat layanan...</p>
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
              <h3 className="font-medium text-red-800">Gagal memuat layanan</h3>
              <p className="text-sm text-red-600">
                Silakan coba refresh halaman atau hubungi dukungan.
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
      {servicesData && servicesData.length === 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-orange-800">Belum ada layanan yang dikonfigurasi</h3>
                <p className="text-sm text-orange-600">
                  Anda perlu membuat layanan terlebih dahulu sebelum menerima pesanan.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/services')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Kelola Layanan
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
            Informasi Pelanggan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Nomor Telepon
                </label>
                {customerPhone && customerName && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCustomerForm}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Bersihkan
                  </Button>
                )}
              </div>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                {customerPhone && customerName && (
                  <CheckCircle className="h-4 w-4 absolute right-3 top-3 text-green-500" />
                )}
                <Input
                  placeholder="Cari berdasarkan telepon/nama pelanggan..."
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
                Nama Pelanggan
              </label>
              <Input
                placeholder="Masukkan nama pelanggan..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Tanggal & Waktu Terima
              </label>
              <Input
                type="datetime-local"
                value={(() => {
                  // Format the date for datetime-local input (should be in local timezone)
                  const year = dropOffDate.getFullYear();
                  const month = String(dropOffDate.getMonth() + 1).padStart(2, '0');
                  const day = String(dropOffDate.getDate()).padStart(2, '0');
                  const hours = String(dropOffDate.getHours()).padStart(2, '0');
                  const minutes = String(dropOffDate.getMinutes()).padStart(2, '0');
                  return `${year}-${month}-${day}T${hours}:${minutes}`;
                })()}
                onChange={(e) => {
                  // Parse the datetime-local value as Jakarta time
                  const inputValue = e.target.value;
                  if (inputValue) {
                    const localDate = new Date(inputValue);
                    // Treat this as Jakarta time
                    setDropOffDate(localDate);
                  }
                }}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ini mempengaruhi estimasi waktu selesai untuk semua layanan
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Service Section */}
      <Card className="shadow-medium animate-scale-in">
        <CardContent className="pt-6">
          <EnhancedServiceSelectionPopup
            onServicesSelected={handleServicesAndItemsSelected}
            disabled={!customerName || !customerPhone}
            dropOffDate={dropOffDate}
            isOpen={isServicePopupOpen}
            onOpenChange={setIsServicePopupOpen}
          />
        </CardContent>
      </Card>

      {/* FloatingOrderSummary instead of fixed Current Order card */}
      <FloatingOrderSummary
        currentOrder={currentOrder.map(item => ({
          service: item.service,
          quantity: item.quantity,
          serviceType: item.serviceType,
          weight: item.weight,
          totalPrice: item.totalPrice,
        }))}
        dynamicItems={dynamicItems}
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
        calculateDynamicItemFinishDate={calculateDynamicItemFinishDate}
        updateQuantity={updateQuantity}
        removeFromOrder={removeServiceFromOrder}
        removeDynamicItem={removeDynamicItem}
        discountAmount={discountAmount}
        pointsRedeemed={pointsRedeemed}
        onDiscountChange={setDiscountAmount}
        onPointsRedeemedChange={setPointsRedeemed}
      />

      {/* Cash Payment Dialog */}
      <CashPaymentDialog
        isOpen={showCashPaymentDialog}
        onClose={() => setShowCashPaymentDialog(false)}
        totalAmount={getTotalPrice() - discountAmount}
        onSubmit={processCashPayment}
      />

      {/* Order Success Dialog */}
      {lastCreatedOrder && (
        <OrderSuccessDialog
          isOpen={showOrderSuccessDialog}
          onClose={handleDialogClose}
          orderId={lastCreatedOrder.id}
          orderNumber={lastCreatedOrder.orderNumber}
          totalAmount={lastCreatedOrder.totalAmount}
          paymentMethod={lastCreatedOrder.paymentMethod}
          customerName={lastCreatedOrder.customerName}
          whatsAppSent={lastCreatedOrder.whatsAppSent}
          pointsEarned={lastCreatedOrder.pointsEarned}
          onPrintReceipt={handlePrintReceipt}
          onNewTransaction={handleNewTransaction}
        />
      )}

      {/* Thermal Print Dialog */}
      {lastCreatedOrder && (
        <ThermalPrintDialog
          isOpen={showThermalPrintDialog}
          onClose={() => setShowThermalPrintDialog(false)}
          orderId={lastCreatedOrder.id}
          customerName={lastCreatedOrder.customerName}
        />
      )}
    </div>
  );
};
