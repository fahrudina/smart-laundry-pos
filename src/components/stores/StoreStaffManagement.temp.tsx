import React from 'react';
import { StoreWithOwnershipInfo } from '@/types/multi-tenant';

interface StoreStaffManagementProps {
  store: StoreWithOwnershipInfo;
}

export const StoreStaffManagement: React.FC<StoreStaffManagementProps> = ({ store }) => {
  return (
    <div>
      <h3>Staff Management for {store.store_name}</h3>
      <p>This component is under development.</p>
    </div>
  );
};
