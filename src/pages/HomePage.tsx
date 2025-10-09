import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useDashboard } from '@/hooks/useDashboard';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { 
  Building2,
  Plus,
  Users,
  ClipboardList,
  UserPlus,
  Settings,
  Wrench,
  CreditCard,
  X,
  TrendingUp,
  TrendingDown,
  QrCode,
  Wallet
} from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const HomePage: React.FC = () => {
  usePageTitle('Home - Smart Laundry POS');
  const navigate = useNavigate();
  const { currentStore } = useStore();
  const { user } = useAuth();
  const { metrics, loading } = useDashboard();

  // Show store selection message if no store is selected
  if (!currentStore) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
        <Card className="text-center py-12 m-4">
          <CardContent>
            <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Store Selected
            </h2>
            <p className="text-gray-600 mb-4">
              Please select a store to view the dashboard data.
            </p>
          </CardContent>
        </Card>
        <BottomNavigation />
      </div>
    );
  }

  const userInitials = user?.full_name 
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : user?.email?.substring(0, 2).toUpperCase() || 'SL';

  const quickActions = [
    {
      id: 'new-order',
      title: 'Buat Pesanan',
      icon: Plus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      onClick: () => navigate('/pos')
    },
    {
      id: 'customers',
      title: 'Pelanggan',
      icon: Users,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      onClick: () => navigate('/customers')
    },
    {
      id: 'services',
      title: 'Layanan',
      icon: Wrench,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      onClick: () => navigate('/services')
    },
    {
      id: 'expenses',
      title: 'Pengeluaran',
      icon: CreditCard,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
      onClick: () => navigate('/order-history')
    },
    {
      id: 'qr-code',
      title: 'Scan Kode QR',
      icon: QrCode,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      onClick: () => navigate('/pos')
    },
    {
      id: 'payment',
      title: 'Metode Pembayaran',
      icon: Wallet,
      color: 'text-teal-500',
      bgColor: 'bg-teal-50',
      onClick: () => navigate('/services')
    },
    {
      id: 'cancel',
      title: 'Pesanan Batal',
      icon: X,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      onClick: () => navigate('/order-history')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
      {/* Header Card with Store Info */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-400 px-4 pt-4 pb-6 shadow-md">
        <div className="max-w-lg mx-auto">
          <h1 className="text-center text-xl font-semibold text-white mb-4">
            Beranda
          </h1>
          
          {/* Store Info Card */}
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Avatar Circle */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
                    <span className="text-2xl font-bold text-blue-600">{userInitials}</span>
                  </div>
                </div>
                
                {/* Store Details */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 truncate">
                    {currentStore.name}
                  </h2>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {currentStore.address || 'Alamat tidak tersedia'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentStore.phone || '0812345678'}
                  </p>
                </div>
                
                {/* Refresh Icon */}
                <button 
                  className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCcw className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-lg mx-auto px-4 -mt-2">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Daily Income Card */}
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Pendapatan Hari Ini</span>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-lg font-bold text-gray-900">
                {loading ? '...' : formatCurrency(metrics?.todayRevenue?.amount || 0).replace('Rp', 'Rp ')}
              </p>
            </CardContent>
          </Card>

          {/* Daily Expense Card */}
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Pengeluaran Hari Ini</span>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-lg font-bold text-gray-900">
                Rp 0
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-full ${action.bgColor} flex items-center justify-center mb-2`}>
                  <Icon className={`h-6 w-6 ${action.color}`} />
                </div>
                <span className="text-xs text-center text-gray-700 font-medium leading-tight">
                  {action.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};
