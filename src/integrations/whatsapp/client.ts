import { WhatsAppConfig, WhatsAppMessage, WhatsAppResponse } from './types';

/**
 * WhatsApp API Client
 * Handles communication with the WhatsApp messaging service
 */
export class WhatsAppClient {
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = {
      timeout: 10000, // Default 10 seconds timeout
      ...config,
    };
  }

  /**
   * Send a WhatsApp message
   * @param message The message to send
   * @returns Promise with the response
   */
  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      // Validate input
      if (!message.to || !message.message) {
        throw new Error('Both "to" and "message" fields are required');
      }

      // Validate phone number format (basic validation)
      if (!this.isValidPhoneNumber(message.to)) {
        throw new Error('Invalid phone number format. Use international format like +1234567890');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      // Determine if we're using local proxy, Vercel serverless function, or direct API
      const isUsingLocalProxy = this.config.baseUrl.includes('localhost') && this.config.baseUrl.includes('/api/whatsapp');
      const isUsingVercelFunction = this.config.baseUrl.startsWith('/api/');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Only add authorization header if not using proxy or Vercel function (they handle auth)
      if (!isUsingLocalProxy && !isUsingVercelFunction) {
        headers['Authorization'] = `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`;
      }

      // Determine the correct endpoint
      let endpoint = `${this.config.baseUrl}/send-message`;
      if (isUsingVercelFunction) {
        endpoint = this.config.baseUrl; // Vercel function URL is complete
      }

      // Create request exactly like Postman example
      const requestBody: { to: string; message: string; from?: string } = {
        to: message.to,
        message: message.message,
      };

      // Include from field if provided (multi-sender support)
      if (message.from) {
        requestBody.from = message.from;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const responseText = await response.text();
      
      // Try to parse as JSON, if it fails, return a generic success response
      let result: WhatsAppResponse;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        // If response is not JSON, assume success based on HTTP status
        result = {
          success: true,
          message: 'Message sent successfully',
          id: 'unknown',
        };
      }
      
      return result;
    } catch (error) {
      console.error('WhatsApp API Error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            message: 'Request timed out',
            error: 'TIMEOUT',
          };
        }
        
        return {
          success: false,
          message: 'Failed to send message',
          error: error.message,
        };
      }

      return {
        success: false,
        message: 'Unknown error occurred',
        error: 'UNKNOWN_ERROR',
      };
    }
  }

  /**
   * Test the connection to WhatsApp API
   * @returns Promise indicating if the connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      const testMessage: WhatsAppMessage = {
        to: '+1234567890', // Test number that won't actually receive a message
        message: 'Connection test - this message should not be sent',
      };

      // Don't actually send the test message, just test the API endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Determine if we're using local proxy, Vercel serverless function, or direct API
      const isUsingLocalProxy = this.config.baseUrl.includes('localhost') && this.config.baseUrl.includes('/api/whatsapp');
      const isUsingVercelFunction = this.config.baseUrl.startsWith('/api/');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Only add authorization header if not using proxy or Vercel function
      if (!isUsingLocalProxy && !isUsingVercelFunction) {
        headers['Authorization'] = `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`;
      }

      // Determine the correct endpoint
      let endpoint = `${this.config.baseUrl}/api/send-message`;
      if (isUsingVercelFunction) {
        endpoint = this.config.baseUrl; // Vercel function URL is complete
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...testMessage, message: '' }), // Empty message to test auth
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      // Even if it returns an error for empty message, 401 means auth failed
      return response.status !== 401;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Validate phone number format
   * @param phoneNumber The phone number to validate
   * @returns true if valid, false otherwise
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // More permissive validation to handle various international formats
    // Examples: +62812345678, +6281280272326, +1234567890
    const phoneRegex = /^\+[1-9]\d{7,15}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number to international format
   * @param phoneNumber The phone number to format
   * @param defaultCountryCode Default country code if not provided (e.g., '62' for Indonesia)
   * @returns Formatted phone number
   */
  static formatPhoneNumber(phoneNumber: string, defaultCountryCode: string = '62'): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If already starts with country code
    if (cleaned.startsWith(defaultCountryCode)) {
      return `+${cleaned}`;
    }
    
    // If starts with 0, replace with country code
    if (cleaned.startsWith('0')) {
      return `+${defaultCountryCode}${cleaned.substring(1)}`;
    }
    
    // If doesn't start with + or country code, add default country code
    return `+${defaultCountryCode}${cleaned}`;
  }
}
