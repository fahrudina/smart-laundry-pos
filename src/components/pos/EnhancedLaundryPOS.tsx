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
import { useServices, useSeedDefaultServices } from '@/hooks/useServices';
import { EnhancedOrderItem, DynamicOrderItemData } from './orderTypes';
import { getJakartaNow, buildOrderItems, validateOrderReadiness, ORDER_ERROR_TOAST_STYLE } from './orderPayload';
import { InlineServiceSelector, Service as CatalogService, DynamicItem } from './InlineServiceSelector';
import { FloatingOrderSummary } from './FloatingOrderSummary';
import { CashPaymentDialog } from './CashPaymentDialog';
import { OrderSuccessDialog } from './OrderSuccessDialog';
import { ThermalPrintDialog } from '@/components/thermal/ThermalPrintDialog';
import { SectionLoading } from '@/components/ui/loading-spinner';

export const EnhancedLaundryPOS = () => {
  const [currentOrder, setCurrentOrder] = useState<EnhancedOrderItem[]>([]);
  const [dynamicItems, setDynamicItems] = useState<DynamicOrderItemData[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSelectingCustomer, setIsSelectingCustomer] = useState(false);
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
    pointsRedeemed?: number;
    discountAmount?: number;
  } | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [pointsRedeemed, setPointsRedeemed] = useState(0);
  const [dropOffDate, setDropOffDate] = useState(getJakartaNow);
  
  const navigate = useNavigate();
  const { customers, searchCustomers, getCustomerByPhone, loading: customersLoading } = useCustomers();
  const createOrderMutation = useCreateOrder();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const serviceSectionRef = useRef<HTMLDivElement>(null);

  // Load services from our service management system
  const { data: servicesData, isLoading: servicesLoading, error: servicesError } = useServices();
  const seedDefaultServices = useSeedDefaultServices();

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

  // Clear customer form - also clears the cart, since items added so far were
  // being built up for the customer that's now being cleared.
  const clearCustomerForm = () => {
    setCustomerPhone('');
    setCustomerName('');
    setSearchResults([]);
    setShowResults(false);
    setDropOffDate(getJakartaNow());
    setCurrentOrder([]);
    setDynamicItems([]);
    setDiscountAmount(0);
    setPointsRedeemed(0);
  };

  // Handle phone input blur
  const handlePhoneInputBlur = () => {
    setTimeout(() => {
      setShowResults(false);
      setSearchResults([]);
    }, 200);
  };

  // Confirm an add-to-cart with a short toast - the cart panel itself is
  // collapsed by default, so a silent state update is easy to miss.
  const notifyItemAdded = (itemName: string) => {
    toast.success(`${itemName} ditambahkan ke pesanan`, {
      duration: 1600,
      className: 'border border-pos-success/30 bg-pos-success/10 text-foreground',
    });
  };

  // Add a service straight to the real cart - one click adds at quantity 1
  // (or 1kg for kilo), further adjustment happens in FloatingOrderSummary's
  // cart list. No staging cart in between.
  const addServiceToOrder = (rawService: CatalogService, type: 'unit' | 'kilo') => {
    const price = type === 'unit' ? rawService.price : (rawService.kiloPrice || 0);
    const service = {
      id: rawService.id,
      name: rawService.name,
      price,
      duration: rawService.duration,
      durationValue: rawService.durationValue,
      durationUnit: rawService.durationUnit,
      category: rawService.category,
      supportsKilo: rawService.supportsKilo,
      kiloPrice: rawService.kiloPrice,
    };

    setCurrentOrder(prev => {
      const existingItem = prev.find(item =>
        item.service.id === service.id &&
        item.serviceType === type
      );

      if (existingItem) {
        return prev.map(item =>
          item.service.id === service.id && item.serviceType === type
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * service.price,
                weight: type === 'kilo' ? item.quantity + 1 : item.weight
              }
            : item
        );
      } else {
        return [...prev, {
          service,
          quantity: 1,
          serviceType: type,
          weight: type === 'kilo' ? 1 : undefined,
          totalPrice: service.price
        }];
      }
    });
    notifyItemAdded(service.name);
  };

  // Add a composed custom item straight to the real cart
  const addCustomItemToOrder = (dynamicItem: DynamicItem) => {
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

    setDynamicItems(prev => [...prev, newDynamicItem]);
    notifyItemAdded(dynamicItem.itemName);
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
    const validationError = validateOrderReadiness({ currentOrder, dynamicItems, customerName, customerPhone });
    if (validationError) {
      toast.error(`❌ ${validationError}`, { style: ORDER_ERROR_TOAST_STYLE });
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

  const processCashPayment = async (cashReceived: number, isDownPayment?: boolean) => {
    try {
      const subtotal = getTotalPrice();
      const totalAmount = subtotal - discountAmount;
      const completionDate = getOrderCompletionTime();
      const { items, allItemsAreProducts } = buildOrderItems({
        currentOrder,
        dynamicItems,
        dropOffDate,
        calculateFinishDate,
        calculateDynamicItemFinishDate,
      });

      // Determine payment status based on whether it's a down payment
      const paymentStatus = isDownPayment ? 'down_payment' : 'completed';
      const paymentAmount = isDownPayment ? cashReceived : totalAmount;

      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        items,
        subtotal,
        tax_amount: 0,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        points_redeemed: pointsRedeemed,
        execution_status: allItemsAreProducts ? 'completed' : 'in_queue',
        payment_status: paymentStatus,
        payment_method: 'cash',
        payment_amount: paymentAmount,
        cash_received: cashReceived, // Add the cash received amount
        order_date: dropOffDate.toISOString(),
        estimated_completion: completionDate?.toISOString(),
      };

      const createdOrder = await createOrderMutation.mutateAsync(orderData);

      // Close cash payment dialog
      setShowCashPaymentDialog(false);
      
      // Show order success dialog
      showOrderSuccess(createdOrder, totalAmount, paymentStatus === 'down_payment' ? 'cash_dp' : 'cash');
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
      const { items, allItemsAreProducts } = buildOrderItems({
        currentOrder,
        dynamicItems,
        dropOffDate,
        calculateFinishDate,
        calculateDynamicItemFinishDate,
      });

      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        items,
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
    const validationError = validateOrderReadiness({ currentOrder, dynamicItems, customerName, customerPhone });
    if (validationError) {
      toast.error(`❌ ${validationError}`, { style: ORDER_ERROR_TOAST_STYLE });
      return;
    }

    try {
      const subtotal = getTotalPrice();
      const totalAmount = subtotal - discountAmount;
      const completionDate = getOrderCompletionTime();
      const { items, allItemsAreProducts } = buildOrderItems({
        currentOrder,
        dynamicItems,
        dropOffDate,
        calculateFinishDate,
        calculateDynamicItemFinishDate,
      });

      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        items,
        subtotal,
        tax_amount: 0,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        points_redeemed: pointsRedeemed,
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
      pointsRedeemed: pointsRedeemed > 0 ? pointsRedeemed : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
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
    setDropOffDate(getJakartaNow());
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
    return <SectionLoading text="Memuat layanan..." />;
  }

  if (servicesError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-destructive">Gagal memuat layanan</h3>
              <p className="text-sm text-destructive/80">
                Silakan coba refresh halaman atau hubungi dukungan.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Service Management Notice */}
      {servicesData && servicesData.length === 0 && (
        <Card className="border-pos-warning/40 bg-pos-warning/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-medium text-pos-warning">Belum ada layanan yang dikonfigurasi</h3>
                <p className="text-sm text-pos-warning/80">
                  Tambahkan layanan untuk mulai menerima pesanan. Muat contoh layanan untuk langsung mulai.
                </p>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <Button
                  onClick={() => seedDefaultServices.mutate()}
                  disabled={seedDefaultServices.isPending}
                  className="bg-pos-warning text-white hover:bg-pos-warning/90"
                >
                  {seedDefaultServices.isPending ? 'Memuat...' : 'Muat Contoh Layanan'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/services')}
                  className="border-pos-warning/40 text-pos-warning hover:bg-pos-warning/10"
                >
                  Kelola Layanan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Information */}
      <Card className="shadow-medium animate-fade-in">
        <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-4">
          <CardTitle className="flex items-center gap-1.5 text-base sm:gap-2 sm:text-lg">
            <User className="h-4 w-4 flex-shrink-0 text-primary sm:h-5 sm:w-5" />
            Informasi Pelanggan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-3 pt-0 sm:space-y-4 sm:p-6 sm:pt-0">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <label className="text-xs font-medium text-muted-foreground sm:text-sm">
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
                  <CheckCircle className="h-4 w-4 absolute right-3 top-3 text-pos-success" />
                )}
                <Input
                  placeholder="No. HP atau nama pelanggan"
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
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground sm:mb-2 sm:text-sm">
                Nama Pelanggan
              </label>
              <Input
                placeholder="Masukkan nama pelanggan..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground sm:mb-2 sm:text-sm">
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
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
                Ini mempengaruhi estimasi waktu selesai untuk semua layanan
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Service Section */}
      <Card ref={serviceSectionRef} className="shadow-medium animate-scale-in">
        <CardContent className="p-3 pt-4 sm:p-6 sm:pt-6">
          <InlineServiceSelector
            onAddService={addServiceToOrder}
            onAddCustomItem={addCustomItemToOrder}
            disabled={!customerName || !customerPhone}
            dropOffDate={dropOffDate}
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
        onOpenServicePopup={() => serviceSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
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
          pointsRedeemed={lastCreatedOrder.pointsRedeemed}
          discountAmount={lastCreatedOrder.discountAmount}
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
