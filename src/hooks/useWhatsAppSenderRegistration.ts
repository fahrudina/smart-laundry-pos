/**
 * React Hook for WhatsApp Sender Registration Management
 * Handles sender status checking, verification, and database updates
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface SenderStatus {
  registered: boolean;
  senderId: string | null;
  isActive: boolean;
  lastVerified: Date | null;
}

export interface SenderDetails {
  id: string;
  phone_number: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
}

export const useWhatsAppSenderRegistration = (storeId: string) => {
  const [loading, setLoading] = useState(false);
  const [senderStatus, setSenderStatus] = useState<SenderStatus | null>(null);
  const [senderDetails, setSenderDetails] = useState<SenderDetails | null>(null);
  const { toast } = useToast();

  /**
   * Check if store phone number is registered as WhatsApp sender
   */
  const checkSenderStatus = useCallback(async (phoneNumber: string): Promise<SenderStatus | null> => {
    if (!phoneNumber || phoneNumber === 'Nomor telepon belum diset') {
      toast({
        title: 'No Phone Number',
        description: 'Please set your store phone number first',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp-sender-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check',
          phoneNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      const data = await response.json();
      
      const status: SenderStatus = {
        registered: data.registered,
        senderId: data.senderId,
        isActive: data.isActive,
        lastVerified: new Date(),
      };

      setSenderStatus(status);
      setSenderDetails(data.sender);

      // Update database with current status
      if (data.registered) {
        const { error } = await supabase
          .from('stores')
          .update({
            wa_sender_registered: true,
            wa_sender_id: data.senderId,
            wa_sender_last_verified: new Date().toISOString(),
            wa_sender_registered_at: data.sender?.created_at || new Date().toISOString(),
          })
          .eq('id', storeId);

        if (error) {
          console.error('Error updating store sender status:', error);
        }
      } else {
        // Update to not registered
        const { error } = await supabase
          .from('stores')
          .update({
            wa_sender_registered: false,
            wa_sender_last_verified: new Date().toISOString(),
          })
          .eq('id', storeId);

        if (error) {
          console.error('Error updating store sender status:', error);
        }
      }

      return status;
    } catch (error) {
      console.error('Error checking sender status:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to check WhatsApp sender status';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [storeId, toast]);

  /**
   * Verify existing sender is still active
   */
  const verifySender = useCallback(async (senderId: string): Promise<boolean> => {
    if (!senderId) {
      toast({
        title: 'No Sender ID',
        description: 'Sender ID is required for verification',
        variant: 'destructive',
      });
      return false;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp-sender-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          senderId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      const data = await response.json();

      // Update local state
      if (senderStatus) {
        setSenderStatus({
          ...senderStatus,
          registered: data.registered,
          isActive: data.isActive,
          lastVerified: new Date(),
        });
      }
      setSenderDetails(data.sender);

      // Update database
      const { error } = await supabase
        .from('stores')
        .update({
          wa_sender_registered: data.registered,
          wa_sender_last_verified: new Date().toISOString(),
        })
        .eq('id', storeId);

      if (error) {
        console.error('Error updating store sender verification:', error);
      }

      if (!data.isActive && data.registered) {
        toast({
          title: 'Sender Inactive',
          description: 'Your WhatsApp sender is registered but not active. Please check your connection.',
          variant: 'destructive',
        });
      }

      return data.isActive;
    } catch (error) {
      console.error('Error verifying sender:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to verify WhatsApp sender';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [storeId, senderStatus, toast]);

  /**
   * List all registered senders
   */
  const listAllSenders = useCallback(async (): Promise<SenderDetails[]> => {
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp-sender-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.senders || [];
    } catch (error) {
      console.error('Error listing senders:', error);
      toast({
        title: 'Error',
        description: 'Failed to list WhatsApp senders',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    senderStatus,
    senderDetails,
    checkSenderStatus,
    verifySender,
    listAllSenders,
  };
};
