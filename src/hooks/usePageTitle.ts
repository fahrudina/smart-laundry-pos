import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/': 'New Order - Smart Laundry POS',
  '/order-history': 'Order History - Smart Laundry POS',
  '/login': 'Login - Smart Laundry POS',
  '/404': 'Page Not Found - Smart Laundry POS',
};

export const usePageTitle = (customTitle?: string, suffix?: string) => {
  const location = useLocation();

  useEffect(() => {
    let title = 'Smart Laundry POS';
    
    if (customTitle) {
      title = `${customTitle} - Smart Laundry POS`;
    } else {
      title = PAGE_TITLES[location.pathname] || 'Smart Laundry POS';
    }
    
    if (suffix) {
      title = title.replace(' - Smart Laundry POS', ` ${suffix} - Smart Laundry POS`);
    }
    
    document.title = title;
  }, [location.pathname, customTitle, suffix]);
};

export const setPageTitle = (title: string) => {
  document.title = `${title} - Smart Laundry POS`;
};

export const updatePageTitleWithCount = (basePage: string, count?: number) => {
  const countSuffix = count !== undefined ? ` (${count})` : '';
  document.title = `${basePage}${countSuffix} - Smart Laundry POS`;
};
