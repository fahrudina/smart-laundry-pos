import React from 'react';
import { StoreManagement } from '@/components/stores/StoreManagement';
import { usePageTitle } from '@/hooks/usePageTitle';

export const StoreManagementPage: React.FC = () => {
  usePageTitle('Manajemen Toko');

  return <StoreManagement />;
};
