import { useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Plus, TrendingUp, History, Building2 } from 'lucide-react';
import { BottomNavItem } from '@/components/layout/MobileBottomNav';
import { useStore } from '@/contexts/StoreContext';

/**
 * Builds the shared bottom-nav item set used across every screen: Beranda, Buat Pesanan,
 * Laporan (owner) / Riwayat (staff), and Toko (owner-only).
 */
export const useMobileBottomNavItems = (): BottomNavItem[] => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOwner } = useStore();

  const items: Array<BottomNavItem | null> = [
    {
      id: 'home',
      title: 'Beranda',
      icon: HomeIcon,
      active: location.pathname === '/home',
      onClick: () => navigate('/home'),
    },
    {
      id: 'orders',
      title: 'Buat Pesanan',
      icon: Plus,
      active: location.pathname === '/pos',
      onClick: () => navigate('/pos'),
      primary: true,
    },
    isOwner
      ? {
          id: 'reports',
          title: 'Laporan',
          icon: TrendingUp,
          active: location.pathname === '/revenue-report',
          onClick: () => navigate('/revenue-report'),
        }
      : {
          id: 'reports',
          title: 'Riwayat',
          icon: History,
          active: location.pathname === '/order-history',
          onClick: () => navigate('/order-history'),
        },
    isOwner
      ? {
          id: 'stores',
          title: 'Toko',
          icon: Building2,
          active: location.pathname === '/stores',
          onClick: () => navigate('/stores'),
        }
      : null,
  ];

  return items.filter((item): item is BottomNavItem => item !== null);
};
