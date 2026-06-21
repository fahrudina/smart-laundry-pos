/**
 * WhatsPoints API Client
 * Integrates with WhatsPoints service for WhatsApp sender registration and management
 * Repository: https://github.com/fahrudina/whatspoints
 */

export interface WhatsPointsSender {
  id: string;
  phone_number: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
}

export interface WhatsPointsListResponse {
  count: number;
  senders: WhatsPointsSender[];
}

export interface SenderCheckResult {
  registered: boolean;
  senderId: string | null;
  isActive: boolean;
}

export interface SenderVerifyResult {
  registered: boolean;
  isActive: boolean;
}

export class WhatsPointsClient {
  private baseUrl: string;
  private username: string;
  private password: string;
  private timeout: number;

  constructor(baseUrl: string, username: string, password: string, timeout: number = 30000) {
    this.baseUrl = baseUrl;
    this.username = username;
    this.password = password;
    this.timeout = timeout;
  }

  /**
   * Create Basic Auth header
   */
  private getAuthHeader(): string {
    const credentials = btoa(`${this.username}:${this.password}`);
    return `Basic ${credentials}`;
  }

  /**
   * Make authenticated request to WhatsPoints API
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`WhatsPoints API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('WhatsPoints API request timeout');
      }
      throw error;
    }
  }

  /**
   * List all registered WhatsApp senders
   */
  async listSenders(): Promise<WhatsPointsSender[]> {
    const response = await this.request<WhatsPointsListResponse>('/api/senders');
    return response.senders || [];
  }

  /**
   * Check if a phone number is registered as sender
   * @param phoneNumber Phone number to check (with country code, e.g., +1234567890)
   */
  async isSenderRegistered(phoneNumber: string): Promise<boolean> {
    const senders = await this.listSenders();
    // Normalize phone number for comparison (remove +, spaces, dashes)
    const normalizedPhone = phoneNumber.replace(/[\s\-+]/g, '');
    return senders.some(s => {
      const senderPhone = s.phone_number.replace(/[\s\-+]/g, '');
      return senderPhone === normalizedPhone && s.is_active;
    });
  }

  /**
   * Get sender ID for a phone number
   * @param phoneNumber Phone number to lookup
   * @returns Sender ID or null if not found
   */
  async getSenderId(phoneNumber: string): Promise<string | null> {
    const senders = await this.listSenders();
    const normalizedPhone = phoneNumber.replace(/[\s\-+]/g, '');
    const sender = senders.find(s => {
      const senderPhone = s.phone_number.replace(/[\s\-+]/g, '');
      return senderPhone === normalizedPhone;
    });
    return sender?.id || null;
  }

  /**
   * Get sender details by phone number
   */
  async getSenderByPhone(phoneNumber: string): Promise<WhatsPointsSender | null> {
    const senders = await this.listSenders();
    const normalizedPhone = phoneNumber.replace(/[\s\-+]/g, '');
    return senders.find(s => {
      const senderPhone = s.phone_number.replace(/[\s\-+]/g, '');
      return senderPhone === normalizedPhone;
    }) || null;
  }

  /**
   * Verify sender connection status by sender ID
   * @param senderId WhatsApp sender ID
   */
  async verifySenderStatus(senderId: string): Promise<boolean> {
    const senders = await this.listSenders();
    const sender = senders.find(s => s.id === senderId);
    return sender?.is_active || false;
  }

  /**
   * Get all active senders
   */
  async getActiveSenders(): Promise<WhatsPointsSender[]> {
    const senders = await this.listSenders();
    return senders.filter(s => s.is_active);
  }

  /**
   * Check sender status and get details
   * @param phoneNumber Phone number to check
   */
  async checkSender(phoneNumber: string): Promise<SenderCheckResult> {
    const sender = await this.getSenderByPhone(phoneNumber);
    return {
      registered: !!sender,
      senderId: sender?.id || null,
      isActive: sender?.is_active || false,
    };
  }
}

/**
 * Factory function to create WhatsPoints client from environment variables
 * Note: This should only be used in development. In production, use serverless function.
 */
export const createWhatsPointsClient = (): WhatsPointsClient => {
  const baseUrl = import.meta.env.VITE_WHATSPOINTS_API_URL || 'http://localhost:8080';
  const username = import.meta.env.VITE_WHATSPOINTS_API_USERNAME || 'admin';
  const password = import.meta.env.VITE_WHATSPOINTS_API_PASSWORD || '';
  const timeout = parseInt(import.meta.env.VITE_WHATSPOINTS_API_TIMEOUT || '30000');

  if (!password && import.meta.env.PROD) {
    console.warn('WhatsPoints credentials not configured for production. Use serverless function instead.');
  }

  return new WhatsPointsClient(baseUrl, username, password, timeout);
};
