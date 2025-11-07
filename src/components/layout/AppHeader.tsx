import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, History, Home, Settings, UserPlus, Building2, Wrench, Plus, Menu, Smartphone, Users, Check, MessageSquare } from 'lucide-react';
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
  const { currentStore, isOwner, userStores, switchStore } = useStore();
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

  const handleWhatsAppBroadcastNavigation = () => {
    if (location.pathname !== '/whatsapp-broadcast') {
      navigate('/whatsapp-broadcast');
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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm backdrop-blur-sm">
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
                    Beranda
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePOSNavigation}>
                    <Plus className="h-4 w-4 mr-2" />
                    Order Baru
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleHistoryNavigation}>
                    <History className="h-4 w-4 mr-2" />
                    Riwayat Order
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCustomersNavigation}>
                    <Users className="h-4 w-4 mr-2" />
                    Pelanggan
                  </DropdownMenuItem>
                  {isOwner && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleServicesNavigation}>
                        <Wrench className="h-4 w-4 mr-2" />
                        Layanan
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleStoresNavigation}>
                        <Building2 className="h-4 w-4 mr-2" />
                        Manajemen Toko
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleWhatsAppBroadcastNavigation}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Broadcast WhatsApp
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
              className={`flex items-center gap-1.5 px-3 ${
                isOnHome
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Beranda</span>
            </Button>

            <Button
              variant={isOnPOS ? "default" : "ghost"}
              size="sm"
              onClick={handlePOSNavigation}
              className={`flex items-center gap-1.5 px-3 ${
                isOnPOS
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Order Baru</span>
            </Button>

            <Button
              variant={isOnHistory ? "default" : "ghost"}
              size="sm"
              onClick={handleHistoryNavigation}
              className={`flex items-center gap-1.5 px-3 ${
                isOnHistory
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <History className="h-4 w-4" />
              <span>Riwayat</span>
            </Button>

            <Button
              variant={isOnCustomers ? "default" : "ghost"}
              size="sm"
              onClick={handleCustomersNavigation}
              className={`flex items-center gap-1.5 px-3 ${
                isOnCustomers
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Pelanggan</span>
            </Button>

            {/* Owner-only Navigation - Consolidated Dropdown */}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={['/services', '/stores', '/whatsapp-broadcast'].includes(location.pathname) ? "default" : "ghost"}
                    size="sm"
                    className={`flex items-center gap-1.5 px-3 ${
                      ['/services', '/stores', '/whatsapp-broadcast'].includes(location.pathname)
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Kelola</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Manajemen</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleServicesNavigation}>
                    <Wrench className="h-4 w-4 mr-2" />
                    Layanan
                    {location.pathname === '/services' && (
                      <Check className="h-4 w-4 ml-auto text-blue-600" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleStoresNavigation}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Manajemen Toko
                    {location.pathname === '/stores' && (
                      <Check className="h-4 w-4 ml-auto text-blue-600" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleWhatsAppBroadcastNavigation}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Broadcast WhatsApp
                    {location.pathname === '/whatsapp-broadcast' && (
                      <Check className="h-4 w-4 ml-auto text-blue-600" />
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Store Selector for Owners */}
            {isOwner && (
              <div className="hidden lg:block">
                <StoreSelector />
              </div>
            )}

            {/* Quick Actions */}
            <div className="hidden sm:flex">
              <AddCustomerDialog
                trigger={
                  <Button variant="default" size="sm" className="h-9 px-3 bg-blue-600 text-white hover:bg-blue-700">
                    <UserPlus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Tambah Pelanggan</span>
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
              <DropdownMenuContent className="w-72" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.full_name || user.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {user.role === 'laundry_owner' ? 'Pemilik' : 'Karyawan'}
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
                    <DropdownMenuLabel>Ganti Toko</DropdownMenuLabel>
                    {userStores.map((store) => (
                      <DropdownMenuItem
                        key={store.store_id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          switchStore(store.store_id);
                        }}
                        className="flex items-start gap-3 cursor-pointer p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate pr-2">{store.store_name}</div>
                          {store.store_description && (
                            <div className="text-xs text-muted-foreground truncate pr-2 mt-1">
                              {store.store_description}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {store.is_owner && (
                            <Badge variant="secondary" className="text-xs">Pemilik</Badge>
                          )}
                          {currentStore?.store_id === store.store_id && (
                            <Check className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
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
                        Tambah Pelanggan
                      </DropdownMenuItem>
                    }
                  />
                  <DropdownMenuSeparator />
                </div>
                <DropdownMenuItem onClick={() => navigate('/install')}>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Install Aplikasi
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Pengaturan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
