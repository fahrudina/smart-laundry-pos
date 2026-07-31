import { UnitItem } from '@/hooks/useOrdersOptimized';

export type ServiceType = 'unit' | 'kilo' | 'combined';

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  durationValue: number;
  durationUnit: 'hours' | 'days';
  category: string;
  supportsKilo?: boolean; // Whether this service supports kilo pricing
  kiloPrice?: number; // Price per kg if supports kilo
}

export interface EnhancedOrderItem {
  service: Service;
  serviceType: ServiceType;
  quantity: number;
  weight?: number;
  unitItems?: UnitItem[];
  totalPrice: number;
}

export interface DynamicOrderItemData {
  id: string;
  itemName: string;
  duration: string;
  durationValue: number;
  durationUnit: 'hours' | 'days';
  price: number;
  quantity: number;
  totalPrice: number;
  unitType: 'unit' | 'kilo';
}
