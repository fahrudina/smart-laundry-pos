// Re-export all WhatsApp integration components for easy importing
export { WhatsAppClient } from './client';
export { WhatsAppNotificationService, whatsAppService } from './service';
export { messageTemplates, MessageBuilder } from './templates';
export type {
  WhatsAppConfig,
  WhatsAppMessage,
  WhatsAppResponse,
  MessageTemplate,
  OrderCreatedData,
  OrderCompletedData,
  PaymentConfirmationData,
  NotificationResult,
} from './types';
