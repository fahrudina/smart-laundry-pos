import { WhatsAppConfig } from '../integrations/whatsapp/types';

/**
 * WhatsApp Configuration
 * Configure these settings according to your WhatsApp API setup
 */
export const whatsAppConfig: WhatsAppConfig = {
  // Use proxy in development and Vercel serverless function in production
  baseUrl: import.meta.env.DEV && import.meta.env.VITE_WHATSAPP_USE_PROXY === 'true' 
    ? 'http://localhost:8080/api/whatsapp'  // Vite proxy endpoint
    : '/api/whatsapp-send',  // Vercel serverless function
  username: import.meta.env.VITE_WHATSAPP_API_USERNAME || 'admin',
  password: import.meta.env.VITE_WHATSAPP_API_PASSWORD || 'your_secure_password',
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
  
  // Development mode (set to true to only log messages, false to send real messages)
  developmentMode: import.meta.env.VITE_WHATSAPP_DEVELOPMENT_MODE === 'true',
};

/**
 * Validate WhatsApp configuration
 */
export const validateWhatsAppConfig = (config: WhatsAppConfig): boolean => {
  if (!config.baseUrl || !config.username || !config.password) {
    console.warn('WhatsApp configuration incomplete');
    return false;
  }
  
  try {
    new URL(config.baseUrl);
  } catch {
    console.warn('Invalid WhatsApp API base URL');
    return false;
  }
  
  return true;
};
