import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useDashboard } from '@/hooks/useDashboard';
import { useTodayExpenses } from '@/hooks/useRevenue';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { Card, CardContent } from '@/components/ui/card';
import { Coachmark, useCoachmark } from '@/components/ui/coachmark';
import { 
  Building2, 
  Plus, 
  Users, 
  Wrench,
  CreditCard,
  QrCode,
  Package,
  XCircle,
  TrendingUp,
  TrendingDown,
  Home as HomeIcon,
  ShoppingCart,
  BarChart3,
  Settings
} from 'lucide-react';

export const HomePage: React.FC = () => {
  usePageTitle('Beranda - Smart Laundry POS');
  const { currentStore, isOwner } = useStore();
  const { metrics, loading } = useDashboard();
  const { data: todayExpensesData, isLoading: loadingExpenses } = useTodayExpenses();
  const navigate = useNavigate();
  const { shouldShowCoachmark, hideCoachmark } = useCoachmark();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Show store selection message if no store is selected
  if (!currentStore) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="text-center py-12 max-w-md">
          <CardContent>
            <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Tidak Ada Toko Dipilih
            </h2>
            <p className="text-gray-600 mb-4">
              Silakan pilih toko untuk melihat data dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userInitials = currentStore.store_name 
    ? currentStore.store_name.charAt(0).toUpperCase()
    : 'K';

  const todayIncome = metrics?.todayRevenue?.amount || 0;
  const todayExpenses = todayExpensesData || 0;
  const todayIncomeChange = metrics?.todayRevenue?.changeFromYesterday || 0;
  const isLoadingData = loading || loadingExpenses;

  const quickActions = [
    {
      id: 'new-order',
      title: 'Buat Pesanan',
      icon: Plus,
      color: 'text-rose-400',
      bgColor: 'bg-rose-50',
      onClick: () => navigate('/pos')
    },
    {
      id: 'customers',
      title: 'Pelanggan',
      icon: Users,
      color: 'text-rose-400',
      bgColor: 'bg-rose-50',
      onClick: () => navigate('/customers')
    },
    {
      id: 'services',
      title: 'Layanan',
      icon: Wrench,
      color: 'text-rose-400',
      bgColor: 'bg-rose-50',
      onClick: () => navigate('/services'),
      hidden: !isOwner
    },
    {
      id: 'expenses',
      title: 'Pengeluaran',
      icon: Package,
      color: 'text-rose-400',
      bgColor: 'bg-rose-50',
      onClick: () => navigate('/expenses'),
      disabled: false
    },
    {
      id: 'scan-qr',
      title: 'Scan Kode QR',
      icon: QrCode,
      color: 'text-rose-400',
      bgColor: 'bg-rose-50',
      onClick: () => navigate('/order-history'), // Navigate to order history for now
      disabled: true // Mark as coming soon
    },
    {
      id: 'payment-methods',
      title: 'Metode Pembayaran',
      icon: CreditCard,
      color: 'text-rose-400',
      bgColor: 'bg-rose-50',
      onClick: () => navigate('/order-history'), // Navigate to order history for now
      disabled: true // Mark as coming soon
    },
    {
      id: 'cancelled-orders',
      title: 'Pesanan Batal',
      icon: XCircle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-50',
      onClick: () => navigate('/order-history')
    }
  ].filter(action => !action.hidden);

  const bottomNavItems = [
    {
      id: 'home',
      title: 'Beranda',
      icon: HomeIcon,
      active: true,
      onClick: () => navigate('/home')
    },
    {
      id: 'orders',
      title: 'Buat Pesanan',
      icon: Plus,
      active: false,
      onClick: () => navigate('/pos')
    },
    {
      id: 'reports',
      title: 'Laporan',
      icon: BarChart3,
      active: false,
      onClick: () => navigate('/order-history')
    },
    {
      id: 'settings',
      title: 'Pengaturan',
      icon: Settings,
      active: false,
      onClick: () => navigate('/stores'),
      hidden: !isOwner
    }
  ].filter(item => !item.hidden);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      {/* Coachmark */}
      <Coachmark open={shouldShowCoachmark} onClose={hideCoachmark} />
      
      {/* Header with Y2K style - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-40 y2k-header text-white px-4 pt-8 pb-12 rounded-b-3xl">
        <h1 className="y2k-header-text text-2xl text-center">Beranda</h1>
      </div>

      {/* Scrollable content area with padding for fixed header and footer */}
      <div className="pt-24 pb-24 px-4 space-y-4 overflow-y-auto" style={{ minHeight: 'calc(100vh - 80px)', marginTop: '80px' }}>
        <div className="-mt-10 space-y-4 pb-6">
        {/* Store Info Card */}
        <div className="y2k-card p-4">
          <div className="flex items-start gap-4">
            <div className="y2k-avatar w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-2xl drop-shadow-lg">{userInitials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 mb-1 y2k-text-label">{currentStore.store_name}</h2>
              <p className="text-sm text-gray-700 line-clamp-2 mb-1">
                {currentStore.store_address || 'Alamat tidak tersedia'}
              </p>
              <p className="text-sm text-gray-700">{currentStore.store_phone || 'Telepon tidak tersedia'}</p>
            </div>
          </div>
        </div>

        {/* Revenue Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="y2k-card y2k-card-income p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs y2k-text-label text-gray-700">Pendapatan Hari Ini</p>
              <TrendingUp className="h-5 w-5 text-green-600 drop-shadow-lg" />
            </div>
            <p className="text-lg y2k-text-amount">
              {isLoadingData ? '...' : formatCurrency(todayIncome)}
            </p>
            {todayIncomeChange !== 0 && (
              <p className={`text-xs mt-1 font-semibold ${todayIncomeChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {todayIncomeChange >= 0 ? '↑' : '↓'} {Math.abs(todayIncomeChange)}% dari kemarin
              </p>
            )}
          </div>

          <div className="y2k-card y2k-card-expense p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs y2k-text-label text-gray-700">Pengeluaran Hari Ini</p>
              <TrendingDown className="h-5 w-5 text-orange-600 drop-shadow-lg" />
            </div>
            <p className="text-lg y2k-text-amount">
              {isLoadingData ? '...' : formatCurrency(todayExpenses)}
            </p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              className="y2k-action-btn flex flex-col items-center justify-center p-4"
            >
              <div className="y2k-action-icon w-12 h-12 flex items-center justify-center mb-2">
                <action.icon className="h-6 w-6 text-pink-600" />
              </div>
              <p className="text-xs text-gray-800 text-center font-bold leading-tight y2k-text-label">
                {action.title}
              </p>
            </button>
          ))}
        </div>
        </div>
      </div>

      {/* Bottom Navigation Bar - Y2K Style - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 y2k-bottom-nav">
        <div className="flex justify-center gap-2 max-w-md mx-auto px-2 py-3">
          {bottomNavItems.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`y2k-nav-button ${item.active ? 'active' : 'inactive'} flex flex-col items-center justify-center flex-1 min-w-[75px] max-w-[110px]`}
            >
              <item.icon className="y2k-nav-icon h-7 w-7 mb-1.5 text-white" />
              <span className="y2k-nav-text text-[10px] text-white leading-tight">{item.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
