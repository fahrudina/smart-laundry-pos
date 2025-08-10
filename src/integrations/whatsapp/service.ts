import { WhatsAppClient } from './client';
import { messageTemplates, MessageBuilder } from './templates';
import { WhatsAppConfig, NotificationResult, OrderCreatedData, OrderCompletedData } from './types';

/**
 * WhatsApp Notification Service
 * High-level service for sending notifications via WhatsApp
 */
export class WhatsAppNotificationService {
  private client: WhatsAppClient;
  private isEnabled: boolean;

  constructor(config?: WhatsAppConfig) {
    // Allow service to be created without config for testing
    if (config) {
      this.client = new WhatsAppClient(config);
      this.isEnabled = true;
    } else {
      this.isEnabled = false;
    }
  }

  /**
   * Initialize the service with configuration
   */
  initialize(config: WhatsAppConfig): void {
    this.client = new WhatsAppClient(config);
    this.isEnabled = true;
  }

  /**
   * Check if the service is properly configured and enabled
   */
  isConfigured(): boolean {
    return this.isEnabled && !!this.client;
  }

  /**
   * Test the WhatsApp connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('WhatsApp service not configured');
      return false;
    }

    return await this.client.testConnection();
  }

  /**
   * Send order creation notification
   */
  async notifyOrderCreated(
    phoneNumber: string,
    orderData: OrderCreatedData
  ): Promise<NotificationResult> {
    if (!this.isConfigured()) {
      console.warn('WhatsApp service not configured, skipping notification');
      return { success: false, error: 'Service not configured' };
    }

    try {
      const formattedPhone = WhatsAppClient.formatPhoneNumber(phoneNumber);
      const message = messageTemplates.orderCreated(orderData);

      const response = await this.client.sendMessage({
        to: formattedPhone,
        message,
      });

      return {
        success: response.success,
        messageId: response.id,
        error: response.error,
      };
    } catch (error) {
      console.error('Failed to send order created notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send order completion notification
   */
  async notifyOrderCompleted(
    phoneNumber: string,
    orderData: OrderCompletedData
  ): Promise<NotificationResult> {
    if (!this.isConfigured()) {
      console.warn('WhatsApp service not configured, skipping notification');
      return { success: false, error: 'Service not configured' };
    }

    try {
      const formattedPhone = WhatsAppClient.formatPhoneNumber(phoneNumber);
      const message = messageTemplates.orderCompleted(orderData);

      const response = await this.client.sendMessage({
        to: formattedPhone,
        message,
      });

      return {
        success: response.success,
        messageId: response.id,
        error: response.error,
      };
    } catch (error) {
      console.error('Failed to send order completed notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send custom message
   */
  async sendCustomMessage(
    phoneNumber: string,
    message: string
  ): Promise<NotificationResult> {
    if (!this.isConfigured()) {
      console.warn('WhatsApp service not configured, skipping notification');
      return { success: false, error: 'Service not configured' };
    }

    try {
      const formattedPhone = WhatsAppClient.formatPhoneNumber(phoneNumber);

      const response = await this.client.sendMessage({
        to: formattedPhone,
        message,
      });

      return {
        success: response.success,
        messageId: response.id,
        error: response.error,
      };
    } catch (error) {
      console.error('Failed to send custom message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send reminder for pickup
   */
  async sendPickupReminder(
    phoneNumber: string,
    customerName: string,
    orderId: string,
    daysOverdue: number
  ): Promise<NotificationResult> {
    const message = MessageBuilder.reminderMessage(customerName, orderId, daysOverdue);
    return this.sendCustomMessage(phoneNumber, message);
  }

  /**
   * Send promotional message
   */
  async sendPromotion(
    phoneNumber: string,
    customerName: string,
    promoDetails: string
  ): Promise<NotificationResult> {
    const message = MessageBuilder.promotionalMessage(customerName, promoDetails);
    return this.sendCustomMessage(phoneNumber, message);
  }

  /**
   * Disable the service (useful for testing or feature flags)
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * Enable the service
   */
  enable(): void {
    if (this.client) {
      this.isEnabled = true;
    }
  }
}

// Create a singleton instance that can be imported throughout the app
export const whatsAppService = new WhatsAppNotificationService();
