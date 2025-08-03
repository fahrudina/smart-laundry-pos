import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, History, Home, Settings, Bell, UserPlus, Building2, Wrench } from 'lucide-react';
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

export const AppHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const { currentStore, isOwner } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) return null;

  const userInitials = user.full_name 
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : user.email?.substring(0, 2).toUpperCase() || 'U';

  const isOnPOS = location.pathname === '/';
  const isOnHistory = location.pathname === '/order-history';

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">SL</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Smart Laundry POS</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-1">
            <Button
              variant={isOnPOS ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate('/')}
              className={`flex items-center gap-2 h-9 px-4 ${
                isOnPOS 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Home className="h-4 w-4" />
              Point of Sale
            </Button>
            <Button
              variant={isOnHistory ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate('/order-history')}
              className={`flex items-center gap-2 h-9 px-4 ${
                isOnHistory 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <History className="h-4 w-4" />
              Order History
            </Button>
            {isOwner && (
              <>
                <Button
                  variant={location.pathname === '/services' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate('/services')}
                  className={`flex items-center gap-2 h-9 px-4 ${
                    location.pathname === '/services'
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Wrench className="h-4 w-4" />
                  Services
                </Button>
                <Button
                  variant={location.pathname === '/stores' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate('/stores')}
                  className={`flex items-center gap-2 h-9 px-4 ${
                    location.pathname === '/stores'
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  Store Management
                </Button>
              </>
            )}
            <AddCustomerDialog 
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 h-9 px-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Customer
                </Button>
              }
            />
          </nav>

          {/* Right Side - Store Selector and User Menu */}
          <div className="flex items-center space-x-3">
            {/* Store Selector */}
            <StoreSelector />

            {/* User Info - Hidden on mobile */}
            <div className="hidden lg:flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {user.full_name || 'User'}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500 capitalize">
                    {user.role === 'laundry_owner' ? 'Owner' : 'Staff'}
                  </div>
                  {currentStore && (
                    <Badge variant="outline" className="text-xs">
                      {currentStore.store_name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-blue-600 text-white font-medium text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 p-0" align="end" forceMount>
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-600 text-white font-medium">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.full_name || 'User'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                      <div className="mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="py-1">
                  <DropdownMenuItem className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                    <Settings className="mr-3 h-4 w-4" />
                    Account Settings
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 bg-gray-50">
        <div className="px-4 py-2">
          <nav className="flex space-x-1">
            <Button
              variant={isOnPOS ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate('/')}
              className={`flex items-center gap-2 flex-1 justify-center h-8 ${
                isOnPOS 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Home className="h-4 w-4" />
              POS
            </Button>
            <Button
              variant={isOnHistory ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate('/order-history')}
              className={`flex items-center gap-2 flex-1 justify-center h-8 ${
                isOnHistory 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <History className="h-4 w-4" />
              History
            </Button>
            <AddCustomerDialog 
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 flex-1 justify-center h-8 text-gray-600 hover:text-gray-900"
                >
                  <UserPlus className="h-4 w-4" />
                  Add
                </Button>
              }
            />
          </nav>
        </div>
      </div>
    </header>
  );
};
