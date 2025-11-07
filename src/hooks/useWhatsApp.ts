import { useState, useEffect } from 'react';
import { whatsAppService } from '@/integrations/whatsapp';
import { whatsAppConfig, whatsAppFeatures, validateWhatsAppConfig } from '@/lib/whatsapp-config';
import { useToast } from '@/hooks/use-toast';
import type { NotificationResult, OrderCreatedData, OrderCompletedData, OrderReadyForPickupData } from '@/integrations/whatsapp/types';

/**
 * Custom hook for WhatsApp integration
 * Provides easy-to-use methods for sending notifications
 */
export const useWhatsApp = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { toast } = useToast();

  // Initialize WhatsApp service on hook mount
  useEffect(() => {
    if (whatsAppFeatures.enabled && validateWhatsAppConfig(whatsAppConfig)) {
      whatsAppService.initialize(whatsAppConfig);
      setIsConfigured(true);
    } else {
      setIsConfigured(false);
      if (whatsAppFeatures.enabled) {
        console.warn('WhatsApp service enabled but configuration is invalid');
      }
    }
  }, []);

  /**
   * Test WhatsApp connection
   */
  const testConnection = async (): Promise<boolean> => {
    if (!isConfigured) {
      toast({
        title: "WhatsApp Not Configured",
        description: "WhatsApp service is not properly configured",
        variant: "destructive",
      });
      return false;
    }

    setIsTestingConnection(true);
    try {
      const result = await whatsAppService.testConnection();
      
      if (result) {
        toast({
          title: "Connection Successful",
          description: "WhatsApp API connection is working",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Unable to connect to WhatsApp API",
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Error testing WhatsApp connection",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsTestingConnection(false);
    }
  };

  /**
   * Send order created notification
   */
  const notifyOrderCreated = async (
    phoneNumber: string,
    orderData: OrderCreatedData
  ): Promise<NotificationResult> => {
    if (!whatsAppFeatures.notifyOnOrderCreated) {
      return { success: false, error: 'Feature disabled' };
    }

    if (whatsAppFeatures.developmentMode) {
      return { success: true, messageId: 'dev-mode-id' };
    }

    if (!isConfigured) {
      console.warn('WhatsApp not configured, skipping order created notification');
      return { success: false, error: 'Service not configured' };
    }

    try {
      const result = await whatsAppService.notifyOrderCreated(phoneNumber, orderData);
      
      if (result.success) {
        toast({
          title: "WhatsApp Sent",
          description: `Order notification sent to ${phoneNumber}`,
        });
      } else {
        toast({
          title: "WhatsApp Failed",
          description: `Failed to send notification: ${result.error}`,
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error sending order created notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  /**
   * Send order completed notification
   */
  // const notifyOrderCompleted = async (
  //   phoneNumber: string,
  //   orderData: OrderCompletedData
  // ): Promise<NotificationResult> => {
  //   if (!whatsAppFeatures.notifyOnOrderCompleted) {
  //     return { success: false, error: 'Feature disabled' };
  //   }

  //   if (whatsAppFeatures.developmentMode) {
  //     return { success: true, messageId: 'dev-mode-id' };
  //   }

  //   if (!isConfigured) {
  //     console.warn('WhatsApp not configured, skipping order completed notification');
  //     return { success: false, error: 'Service not configured' };
  //   }

  //   try {
  //     const result = await whatsAppService.notifyOrderCompleted(phoneNumber, orderData);
      
  //     if (result.success) {
  //     } else {
  //       console.error('Failed to send order completed notification:', result.error);
  //     }
      
  //     return result;
  //   } catch (error) {
  //     console.error('Error sending order completed notification:', error);
  //     return {
  //       success: false,
  //       error: error instanceof Error ? error.message : 'Unknown error'
  //     };
  //   }
  // };

  /**
   * Send order ready for pickup notification
   */
  const notifyOrderReadyForPickup = async (
    phoneNumber: string,
    orderData: OrderReadyForPickupData
  ): Promise<NotificationResult> => {
    if (!whatsAppFeatures.notifyOnOrderReadyForPickup) {
      return { success: true, messageId: 'feature-disabled' };
    }

    if (whatsAppFeatures.developmentMode) {
      return { success: true, messageId: 'dev-mode-id' };
    }

    if (!isConfigured) {
      console.warn('WhatsApp not configured, skipping order ready for pickup notification');
      return { success: false, error: 'Service not configured' };
    }

    try {
      const result = await whatsAppService.notifyOrderReadyForPickup(phoneNumber, orderData);
      
      if (result.success) {
      } else {
        console.error('Failed to send order ready for pickup notification:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Error sending order ready for pickup notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  /**
   * Send custom WhatsApp message
   */
  const sendCustomMessage = async (
    phoneNumber: string,
    message: string
  ): Promise<NotificationResult> => {
    if (whatsAppFeatures.developmentMode) {
      return { success: true, messageId: 'dev-mode-id' };
    }

    if (!isConfigured) {
      toast({
        title: "WhatsApp Not Available",
        description: "WhatsApp service is not configured",
        variant: "destructive",
      });
      return { success: false, error: 'Service not configured' };
    }

    try {
      const result = await whatsAppService.sendCustomMessage(phoneNumber, message);
      
      if (result.success) {
        toast({
          title: "Message Sent",
          description: "WhatsApp message sent successfully",
        });
      } else {
        toast({
          title: "Failed to Send",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send WhatsApp message",
        variant: "destructive",
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  return {
    isConfigured,
    isTestingConnection,
    testConnection,
    notifyOrderCreated,
   // notifyOrderCompleted,
    notifyOrderReadyForPickup,
    sendCustomMessage,
    features: whatsAppFeatures,
  };
};
