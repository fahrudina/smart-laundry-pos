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
}

export interface OrderCreatedData {
  orderId: string;
  customerName: string;
  totalAmount: number;
  estimatedCompletion: string;
  services: string[];
}

export interface OrderCompletedData {
  orderId: string;
  customerName: string;
  totalAmount: number;
  completedAt: string;
  services: string[];
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
