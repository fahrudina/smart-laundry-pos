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
  paymentConfirmation: (data: PaymentConfirmationData) => string;
}

export interface StoreInfo {
  name: string;
  address: string;
  phone: string;
  enable_qr?: boolean;
  enable_points?: boolean;
  wa_use_store_number?: boolean;
  wa_sender_id?: string | null;
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
  pointsRedeemed?: number;
  discountAmount?: number;
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

/**
 * Payment confirmation notification data for pay-later orders
 * Used when confirming payment after order completion
 */
export interface PaymentConfirmationData {
  orderId: string;
  customerName: string;
  paymentStatus: string;
  pointsEarned?: number;
  storeInfo: StoreInfo;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// WhatsApp Sender Registration
// DTOs for api/wa-sender-register.js, which proxies to the WhatsPoints
// registration endpoints (POST /api/register-sender-qr,
// POST /api/register-sender-code, GET /api/register-sender-status/:id,
// GET /api/senders).

export interface StartQRRegistrationResponse {
  success: boolean;
  session_id?: string;
  qr_code?: string; // Base64-encoded PNG (no "data:" prefix)
  message?: string;
  error?: string;
}

export interface StartCodeRegistrationRequest {
  phone_number: string;
}

export interface StartCodeRegistrationResponse {
  success: boolean;
  session_id?: string;
  pairing_code?: string;
  phone_number?: string;
  message?: string;
  error?: string;
}

/**
 * WhatsPoints deletes a registration session the first time its terminal
 * status (connected/failed) is read, so a session_id is only ever
 * queryable once it reaches a terminal state - polling again afterwards
 * returns 'not_found', indistinguishable from an expired session.
 */
export type SenderRegistrationStatus = 'pending' | 'connected' | 'failed' | 'not_found';

export interface RegistrationStatusResponse {
  success: boolean;
  status: SenderRegistrationStatus;
  sender_id?: string;
  qr_code?: string;
  message?: string;
  error?: string;
}

export interface CheckSenderRequest {
  phone_number: string;
}

export interface CheckSenderResponse {
  success: boolean;
  registered: boolean;
  sender_id: string | null;
  error?: string;
}
