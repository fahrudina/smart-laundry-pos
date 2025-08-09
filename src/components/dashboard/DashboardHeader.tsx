import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { format } from 'date-fns';
import { Bell, Calendar, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StoreSelector } from '@/components/stores/StoreSelector';

export const DashboardHeader: React.FC = () => {
  const { user } = useAuth();
  const { currentStore, isOwner } = useStore();
  const [currentTime, setCurrentTime] = React.useState(new Date());

  // Update time every minute
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  if (!user) return null;

  const userInitials = user.full_name 
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : user.email?.substring(0, 2).toUpperCase() || 'U';

  const today = new Date();
  const dayName = format(today, 'EEEE');
  const formattedDate = format(today, 'MMMM d, yyyy');
  const formattedTime = format(currentTime, 'HH:mm');

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Left Section - Welcome & Store */}
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold">Smart Laundry</h1>
              <p className="text-blue-100">
                Welcome back, {user.full_name || user.email?.split('@')[0] || 'User'}
              </p>
            </div>
          </div>
          
          {/* Store Selector for Owners */}
          {isOwner && (
            <div className="mt-4">
              <StoreSelector />
            </div>
          )}
          
          {/* Current Store Display for Staff */}
          {!isOwner && currentStore && (
            <div className="mt-4">
              <Badge variant="secondary" className="bg-blue-800 text-blue-100">
                {currentStore.store_name}
              </Badge>
            </div>
          )}
        </div>

        {/* Right Section - Date, Time, Notifications */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          {/* Date & Time */}
          <div className="text-right">
            <div className="flex items-center space-x-2 text-blue-100">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Today</span>
            </div>
            <div className="text-lg font-semibold">{dayName}, {formattedDate}</div>
            <div className="flex items-center space-x-2 text-blue-100">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Current Time</span>
            </div>
            <div className="text-lg font-semibold">{formattedTime}</div>
          </div>

          {/* Notifications & Avatar */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="h-6 w-6 text-blue-100 hover:text-white cursor-pointer transition-colors" />
              {/* Notification badge - could be dynamic */}
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </div>
            </div>
            
            <Avatar className="h-10 w-10 border-2 border-blue-300">
              <AvatarFallback className="bg-blue-800 text-blue-100 font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </div>
  );
};
