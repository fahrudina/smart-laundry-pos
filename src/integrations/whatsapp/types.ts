// WhatsApp Integration Types
export interface WhatsAppConfig {
  baseUrl: string;
  username: string;
  password: string;
  timeout?: number;
}

export interface WhatsAppMessage {
  to: string;
  message: string;
  from?: string; // Optional sender phone number (multi-sender support)
}

export interface WhatsAppResponse {
  success: boolean;
  message: string;
  id?: string;
  error?: string;
}

export interface MessageTemplate {
  orderCreated: (data: OrderCreatedData) => string;
  orderCompleted: (data: OrderCompletedData) => string;
  orderReadyForPickup: (data: OrderReadyForPickupData) => string;
}

export interface StoreInfo {
  name: string;
  address: string;
  phone: string;
  enable_qr?: boolean;
  enable_points?: boolean;
  wa_use_store_number?: boolean;
}

export interface OrderItem {
  service_name: string;
  service_type: string;
  weight_kg?: number;
  quantity: number;
  service_price: number;
  line_total: number;
}

export interface OrderCreatedData {
  orderId: string;
  customerName: string;
  totalAmount: number;
  subtotal: number;
  estimatedCompletion: string;
  paymentStatus: string;
  orderItems: OrderItem[];
  storeInfo: StoreInfo;
  pointsEarned?: number;
}

export interface OrderCompletedData {
  orderId: string;
  customerName: string;
  totalAmount: number;
  completedAt: string;
  orderItems: OrderItem[];
  storeInfo: StoreInfo;
}

export interface OrderReadyForPickupData {
  orderId: string;
  customerName: string;
  totalAmount: number;
  readyAt: string;
  orderItems: OrderItem[];
  storeInfo: StoreInfo;
  paymentStatus: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
