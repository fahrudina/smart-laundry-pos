import { WhatsAppConfig } from '../integrations/whatsapp/types';

/**
 * WhatsApp Configuration
 * Configure these settings according to your WhatsApp API setup
 * 
 * SECURITY NOTE: Only non-sensitive configuration should be here.
 * Credentials are handled server-side in the Vercel serverless function.
 */
export const whatsAppConfig: WhatsAppConfig = {
  // Use proxy in development and Vercel serverless function in production
  baseUrl: import.meta.env.DEV && import.meta.env.VITE_WHATSAPP_USE_PROXY === 'true' 
    ? 'http://localhost:8080/api/whatsapp'  // Vite proxy endpoint
    : '/api/whatsapp-send',  // Vercel serverless function
  // NOTE: In production, credentials are NOT exposed to client
  // They are handled securely in the serverless function
  username: import.meta.env.DEV ? (import.meta.env.VITE_WHATSAPP_API_USERNAME || 'admin') : '',
  password: import.meta.env.DEV ? (import.meta.env.VITE_WHATSAPP_API_PASSWORD || 'your_secure_password') : '',
  timeout: parseInt(import.meta.env.VITE_WHATSAPP_API_TIMEOUT || '10000'),
};

/**
 * Feature flags for WhatsApp integration
 */
export const whatsAppFeatures = {
  // Enable/disable WhatsApp notifications globally
  enabled: import.meta.env.VITE_WHATSAPP_ENABLED === 'true',
  
  // Enable/disable specific notification types
  notifyOnOrderCreated: import.meta.env.VITE_WHATSAPP_NOTIFY_ORDER_CREATED !== 'false',
  notifyOnOrderCompleted: import.meta.env.VITE_WHATSAPP_NOTIFY_ORDER_COMPLETED !== 'false',
  notifyOnOrderReadyForPickup: import.meta.env.VITE_WHATSAPP_NOTIFY_ORDER_READY_FOR_PICKUP !== 'false',
  notifyOnPaymentConfirmation: import.meta.env.VITE_WHATSAPP_NOTIFY_PAYMENT_CONFIRMATION !== 'false',
  
  // Development mode (set to true to only log messages, false to send real messages)
  developmentMode: import.meta.env.VITE_WHATSAPP_DEVELOPMENT_MODE === 'true',
};

/**
 * Validate WhatsApp configuration
 * In production, credentials are handled server-side, so we only validate baseUrl
 */
export const validateWhatsAppConfig = (config: WhatsAppConfig): boolean => {
  if (!config.baseUrl) {
    console.warn('WhatsApp configuration incomplete: missing baseUrl');
    return false;
  }
  
  // In development mode, check credentials too
  if (import.meta.env.DEV) {
    if (!config.username || !config.password) {
      console.warn('WhatsApp configuration incomplete (dev mode):', {
        hasBaseUrl: !!config.baseUrl,
        hasUsername: !!config.username,
        hasPassword: !!config.password
      });
      return false;
    }
  }
  
  // Allow relative URLs for Vercel serverless functions (e.g., '/api/whatsapp-send')
  // and absolute URLs for direct API calls
  if (config.baseUrl.startsWith('/')) {
    // Relative URL - valid for serverless functions
    return true;
  }
  
  try {
    new URL(config.baseUrl);
    return true;
  } catch {
    console.warn('Invalid WhatsApp API base URL:', config.baseUrl);
    return false;
  }
};
