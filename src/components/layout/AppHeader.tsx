import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, History, Home, Settings, UserPlus, Building2, Wrench, Plus, Menu, Smartphone, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AddCustomerDialog } from '@/components/pos/AddCustomerDialog';
import { StoreSelector } from '@/components/stores/StoreSelector';
import { PWAInstallButton } from '@/components/ui/PWAInstallButton';

export const AppHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const { currentStore, isOwner } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  // Smart navigation handlers
  const handleHomeNavigation = () => {
    if (location.pathname !== '/home') {
      navigate('/home');
    }
  };

  const handlePOSNavigation = () => {
    if (location.pathname !== '/pos') {
      navigate('/pos');
    }
  };

  const handleHistoryNavigation = () => {
    if (location.pathname !== '/order-history') {
      navigate('/order-history');
    }
  };

  const handleServicesNavigation = () => {
    if (location.pathname !== '/services') {
      navigate('/services');
    }
  };

  const handleStoresNavigation = () => {
    if (location.pathname !== '/stores') {
      navigate('/stores');
    }
  };

  const handleCustomersNavigation = () => {
    if (location.pathname !== '/customers') {
      navigate('/customers');
    }
  };

  if (!user) return null;

  const userInitials = user.full_name 
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : user.email?.substring(0, 2).toUpperCase() || 'U';

  const isOnHome = location.pathname === '/home';
  const isOnPOS = location.pathname === '/pos';
  const isOnHistory = location.pathname === '/order-history';
  const isOnCustomers = location.pathname === '/customers';

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section - Mobile Menu + Logo */}
          <div className="flex items-center space-x-3">
            {/* Mobile Navigation Menu */}
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={handleHomeNavigation}>
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePOSNavigation}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Order
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleHistoryNavigation}>
                    <History className="h-4 w-4 mr-2" />
                    Order History
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCustomersNavigation}>
                    <Users className="h-4 w-4 mr-2" />
                    Customers
                  </DropdownMenuItem>
                  {isOwner && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleServicesNavigation}>
                        <Wrench className="h-4 w-4 mr-2" />
                        Services
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleStoresNavigation}>
                        <Building2 className="h-4 w-4 mr-2" />
                        Store Management
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Logo Section */}
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">SL</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-gray-900">Smart Laundry POS</h1>
              </div>
            </div>
          </div>

          {/* Primary Navigation - Desktop */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Button
              variant={isOnHome ? "default" : "ghost"}
              size="sm"
              onClick={handleHomeNavigation}
              className={`flex items-center gap-2 ${
                isOnHome 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Home className="h-4 w-4" />
              <span className="hidden xl:inline">Home</span>
            </Button>
            
            <Button
              variant={isOnPOS ? "default" : "ghost"}
              size="sm"
              onClick={handlePOSNavigation}
              className={`flex items-center gap-2 ${
                isOnPOS 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden xl:inline">New Order</span>
            </Button>
            
            <Button
              variant={isOnHistory ? "default" : "ghost"}
              size="sm"
              onClick={handleHistoryNavigation}
              className={`flex items-center gap-2 ${
                isOnHistory 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <History className="h-4 w-4" />
              <span className="hidden xl:inline">History</span>
            </Button>

            <Button
              variant={isOnCustomers ? "default" : "ghost"}
              size="sm"
              onClick={handleCustomersNavigation}
              className={`flex items-center gap-2 ${
                isOnCustomers 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="hidden xl:inline">Customers</span>
            </Button>

            {/* Owner-only Navigation */}
            {isOwner && (
              <>
                <Button
                  variant={location.pathname === '/services' ? "default" : "ghost"}
                  size="sm"
                  onClick={handleServicesNavigation}
                  className={`flex items-center gap-2 ${
                    location.pathname === '/services'
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Wrench className="h-4 w-4" />
                  <span className="hidden xl:inline">Services</span>
                </Button>
                
                <Button
                  variant={location.pathname === '/stores' ? "default" : "ghost"}
                  size="sm"
                  onClick={handleStoresNavigation}
                  className={`flex items-center gap-2 ${
                    location.pathname === '/stores'
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span className="hidden xl:inline">Stores</span>
                </Button>
              </>
            )}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Store Selector for Owners */}
            {isOwner && (
              <div className="hidden md:block">
                <StoreSelector />
              </div>
            )}

            {/* Quick Actions */}
            <div className="hidden sm:flex items-center">
              <AddCustomerDialog
                trigger={
                  <Button variant="default" size="sm" className="h-9 px-2 sm:px-3 bg-blue-600 text-white hover:bg-blue-700">
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden lg:ml-2 lg:inline">Add Customer</span>
                  </Button>
                }
              />
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.full_name || user.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {user.role === 'laundry_owner' ? 'Owner' : 'Staff'}
                    </p>
                    {currentStore && (
                      <Badge variant="secondary" className="w-fit text-xs">
                        {currentStore.store_name}
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isOwner && (
                  <div className="md:hidden">
                    <DropdownMenuItem>
                      <div className="w-full">
                        <StoreSelector />
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </div>
                )}
                <div className="sm:hidden">
                  <AddCustomerDialog
                    trigger={
                      <DropdownMenuItem 
                        className="text-blue-600"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Customer
                      </DropdownMenuItem>
                    }
                  />
                  <DropdownMenuSeparator />
                </div>
                <DropdownMenuItem onClick={() => navigate('/install')}>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Install App
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
