import React, { useState, useEffect } from 'react';
import { Search, Plus, Clock, CreditCard, User, ShoppingCart, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCustomers } from '@/hooks/useCustomers';
import { AddCustomerDialog } from './AddCustomerDialog';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  category: 'wash' | 'dry' | 'special';
}

interface OrderItem {
  service: Service;
  quantity: number;
}

const services: Service[] = [
  { id: '1', name: 'Regular Wash', price: 12.99, duration: '2-3 days', category: 'wash' },
  { id: '2', name: 'Express Wash', price: 19.99, duration: '24 hours', category: 'wash' },
  { id: '3', name: 'Dry Clean', price: 24.99, duration: '3-4 days', category: 'dry' },
  { id: '4', name: 'Express Dry Clean', price: 34.99, duration: '48 hours', category: 'dry' },
  { id: '5', name: 'Ironing Service', price: 8.99, duration: '1-2 days', category: 'special' },
  { id: '6', name: 'Stain Removal', price: 15.99, duration: '2-3 days', category: 'special' },
];

export const LaundryPOS = () => {
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  const { customers, searchCustomers, getCustomerByPhone, loading } = useCustomers();

  // Search for customers when phone number changes
  useEffect(() => {
    const searchCustomer = async () => {
      if (customerPhone.length >= 3) {
        await searchCustomers(customerPhone);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    };

    const debounceTimer = setTimeout(searchCustomer, 300);
    return () => clearTimeout(debounceTimer);
  }, [customerPhone, searchCustomers]);

  // Update search results when customers data changes
  useEffect(() => {
    setSearchResults(customers);
  }, [customers]);

  // Handle customer selection from search
  const handleCustomerSelect = (customer: any) => {
    setCustomerPhone(customer.phone);
    setCustomerName(customer.name);
    setSearchResults([]);
    setShowResults(false);
  };

  // Handle new customer added
  const handleCustomerAdded = (customer: any) => {
    setCustomerPhone(customer.phone);
    setCustomerName(customer.name);
  };

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

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card shadow-soft border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-foreground">LaundryPOS Pro</h1>
            <Badge variant="outline" className="bg-pos-highlight">
              Station 1
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Clock className="h-4 w-4 mr-2" />
              Order History
            </Button>
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Customer Information */}
            <Card className="lg:col-span-2 shadow-medium animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        placeholder="Search by phone..."
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="pl-10"
                      />
                      {showResults && searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {searchResults.map((customer) => (
                            <div
                              key={customer.id}
                              className="p-3 hover:bg-secondary cursor-pointer border-b last:border-b-0"
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
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-medium animate-fade-in">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <AddCustomerDialog onCustomerAdded={handleCustomerAdded} />
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  Check Order Status
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Recent Orders
                </Button>
              </CardContent>
            </Card>

            {/* Services Grid */}
            <Card className="lg:col-span-3 shadow-medium animate-scale-in">
              <CardHeader>
                <CardTitle>Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="p-4 border rounded-lg hover:shadow-soft transition-smooth cursor-pointer bg-card"
                      onClick={() => addToOrder(service)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-foreground">{service.name}</h3>
                        <Badge className={getCategoryColor(service.category)}>
                          {service.category}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold text-primary mb-1">
                        ${service.price}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {service.duration}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="w-96 bg-card border-l shadow-strong">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Current Order
            </h2>

            {currentOrder.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No items in order</p>
                <p className="text-sm">Add services to get started</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {currentOrder.map((item) => (
                    <div key={item.service.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{item.service.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          ${item.service.price} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.service.id, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.service.id, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="mb-4" />

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-lg">
                    <span>Subtotal:</span>
                    <span>${getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tax (8.25%):</span>
                    <span>${(getTotalPrice() * 0.0825).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span>${(getTotalPrice() * 1.0825).toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button className="w-full bg-gradient-accent hover:opacity-90 text-accent-foreground font-semibold py-3">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Process Payment
                  </Button>
                  <Button variant="outline" className="w-full">
                    Save for Later
                  </Button>
                  <Button variant="ghost" className="w-full text-destructive" onClick={() => setCurrentOrder([])}>
                    Clear Order
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};