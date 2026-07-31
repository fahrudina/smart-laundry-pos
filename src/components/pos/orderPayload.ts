import { CreateOrderData } from '@/hooks/useOrdersWithNotifications';
import { EnhancedOrderItem, DynamicOrderItemData } from './orderTypes';

const PRODUCT_CATEGORIES = ['detergent', 'perfume', 'softener', 'other_goods'];

// Jakarta is UTC+7 and has no DST, so a fixed offset is safe.
export const getJakartaNow = (): Date => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 7 * 60 * 60000);
};

interface BuildOrderItemsParams {
  currentOrder: EnhancedOrderItem[];
  dynamicItems: DynamicOrderItemData[];
  dropOffDate: Date;
  calculateFinishDate: (service: EnhancedOrderItem['service'], startDate?: Date) => Date;
  calculateDynamicItemFinishDate: (item: DynamicOrderItemData, startDate?: Date) => Date;
}

export const buildOrderItems = ({
  currentOrder,
  dynamicItems,
  dropOffDate,
  calculateFinishDate,
  calculateDynamicItemFinishDate,
}: BuildOrderItemsParams): { items: CreateOrderData['items']; allItemsAreProducts: boolean } => {
  const regularItems: CreateOrderData['items'] = currentOrder.map(item => ({
    service_name: item.service.name,
    service_price: item.service.price,
    quantity: item.quantity,
    estimated_completion: calculateFinishDate(item.service, dropOffDate).toISOString(),
    service_type: item.serviceType,
    weight_kg: item.weight,
    unit_items: item.unitItems,
    category: item.service.category,
    item_type: PRODUCT_CATEGORIES.includes(item.service.category) ? 'product' : 'service',
  }));

  const dynamicOrderItems: CreateOrderData['items'] = dynamicItems.map(item => ({
    service_name: item.itemName,
    service_price: item.price,
    quantity: item.quantity,
    estimated_completion: calculateDynamicItemFinishDate(item, dropOffDate).toISOString(),
    service_type: item.unitType,
    weight_kg: item.unitType === 'kilo' ? item.quantity : undefined,
    unit_items: undefined,
    category: 'other_goods',
    item_type: 'service',
  }));

  const items = [...regularItems, ...dynamicOrderItems];
  const allItemsAreProducts = items.every(item => item.item_type === 'product');

  return { items, allItemsAreProducts };
};

interface ValidateOrderReadinessParams {
  currentOrder: EnhancedOrderItem[];
  dynamicItems: DynamicOrderItemData[];
  customerName: string;
  customerPhone: string;
}

// Returns the Indonesian error message to toast, or null if the order is ready to submit.
export const validateOrderReadiness = ({
  currentOrder,
  dynamicItems,
  customerName,
  customerPhone,
}: ValidateOrderReadinessParams): string | null => {
  if (currentOrder.length === 0 && dynamicItems.length === 0) {
    return 'Tidak ada item dalam pesanan';
  }
  if (!customerName || !customerPhone) {
    return 'Mohon lengkapi informasi pelanggan';
  }
  return null;
};

export const ORDER_ERROR_TOAST_STYLE = {
  minWidth: '320px',
  maxWidth: '500px',
  width: '90vw',
  padding: '16px',
  fontSize: '16px',
  borderRadius: '12px',
  border: '2px solid #ef4444',
};
