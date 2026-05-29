# WhatsApp Sender Registration Integration Plan

## Overview
Integrate the WhatsPoints API (https://github.com/fahrudina/whatspoints) to allow stores to register their own WhatsApp sender numbers directly from the Smart Laundry POS system.

## Current State Analysis

### Existing Implementation
- ✅ WhatsApp notification system is implemented
- ✅ Multi-sender support exists (using `from` field in API payload)
- ✅ Store phone numbers are stored in `stores.phone` field
- ✅ Toggle to use store number (`wa_use_store_number`) exists
- ❌ **Gap**: Stores cannot register their WhatsApp numbers with the WhatsPoints service
- ❌ **Gap**: No UI to manage sender registration status
- ❌ **Gap**: No validation if store number is registered as sender

### WhatsPoints API Capabilities
Based on the GitHub repository, WhatsPoints provides:
- **Register Sender (QR Code)**: `/api/register-sender` with QR code generation
- **Register Sender (Pairing Code)**: CLI command `-add-sender-code=+1234567890`
- **List Senders**: `GET /api/senders` - lists all registered sender phone numbers
- **Send Message**: `POST /api/send-message` with optional `from` field
- **Check Status**: `GET /api/status` - verify connection status

## Integration Architecture

### Phase 1: Database Schema Updates (Migration)
Create new migration to track sender registration status.

**New Migration**: `20260126000000_add_whatsapp_sender_registration.sql`

```sql
-- Add columns to track WhatsApp sender registration status
ALTER TABLE public.stores ADD COLUMN wa_sender_registered BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.stores ADD COLUMN wa_sender_id VARCHAR(50);
ALTER TABLE public.stores ADD COLUMN wa_sender_registered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.stores ADD COLUMN wa_sender_last_verified TIMESTAMP WITH TIME ZONE;

-- Add indexes
CREATE INDEX idx_stores_wa_sender_registered ON public.stores(wa_sender_registered);
CREATE INDEX idx_stores_wa_sender_id ON public.stores(wa_sender_id);

-- Add comment for documentation
COMMENT ON COLUMN public.stores.wa_sender_registered IS 'Whether this store phone number is registered as WhatsApp sender';
COMMENT ON COLUMN public.stores.wa_sender_id IS 'WhatsApp sender ID from WhatsPoints service';
COMMENT ON COLUMN public.stores.wa_sender_registered_at IS 'Timestamp when sender was first registered';
COMMENT ON COLUMN public.stores.wa_sender_last_verified IS 'Last time sender status was verified';
```

**Update existing function**: `get_user_stores` to include new fields

```sql
-- Update get_user_stores function to return sender status
CREATE OR REPLACE FUNCTION get_user_stores(p_user_id UUID)
RETURNS TABLE (
  store_id UUID,
  store_name TEXT,
  store_address TEXT,
  store_phone TEXT,
  store_email TEXT,
  user_role TEXT,
  enable_qr BOOLEAN,
  enable_points BOOLEAN,
  wa_use_store_number BOOLEAN,
  wa_sender_registered BOOLEAN,
  wa_sender_id VARCHAR(50),
  wa_sender_registered_at TIMESTAMP WITH TIME ZONE,
  wa_sender_last_verified TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- ... existing logic ...
  -- Add new fields to SELECT
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Phase 2: Backend API Integration

#### 2.1 Create WhatsPoints Service Client
**File**: `src/integrations/whatsapp/whatspoints-client.ts`

```typescript
import axios, { AxiosInstance } from 'axios';

export interface WhatsPointsSender {
  id: string;
  phone_number: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
}

export interface RegisterSenderRequest {
  phone_number: string;
  pairing_code?: string; // For SMS-based registration
}

export interface RegisterSenderResponse {
  success: boolean;
  sender_id: string;
  qr_code?: string; // Base64 QR code for scanning
  pairing_code?: string;
  message: string;
}

export class WhatsPointsClient {
  private client: AxiosInstance;

  constructor(
    baseUrl: string,
    username: string,
    password: string
  ) {
    this.client = axios.create({
      baseURL: baseUrl,
      auth: { username, password },
      timeout: 30000,
    });
  }

  /**
   * List all registered WhatsApp senders
   */
  async listSenders(): Promise<WhatsPointsSender[]> {
    const response = await this.client.get('/api/senders');
    return response.data.senders || [];
  }

  /**
   * Check if a phone number is registered as sender
   */
  async isSenderRegistered(phoneNumber: string): Promise<boolean> {
    const senders = await this.listSenders();
    return senders.some(s => s.phone_number === phoneNumber && s.is_active);
  }

  /**
   * Get sender ID for a phone number
   */
  async getSenderId(phoneNumber: string): Promise<string | null> {
    const senders = await this.listSenders();
    const sender = senders.find(s => s.phone_number === phoneNumber);
    return sender?.id || null;
  }

  /**
   * Initiate sender registration via QR code
   * Note: This needs to be called from backend/serverless function
   */
  async initiateQRRegistration(phoneNumber: string): Promise<RegisterSenderResponse> {
    // This would typically call WhatsPoints CLI or API
    // May need custom endpoint in WhatsPoints to support web-based registration
    throw new Error('QR registration needs to be implemented via backend');
  }

  /**
   * Verify sender connection status
   */
  async verifySenderStatus(senderId: string): Promise<boolean> {
    const senders = await this.listSenders();
    const sender = senders.find(s => s.id === senderId);
    return sender?.is_active || false;
  }
}

// Factory function
export const createWhatsPointsClient = (): WhatsPointsClient => {
  const baseUrl = import.meta.env.VITE_WHATSPOINTS_API_URL || 'http://localhost:8080';
  const username = import.meta.env.VITE_WHATSPOINTS_API_USERNAME || 'admin';
  const password = import.meta.env.VITE_WHATSPOINTS_API_PASSWORD || '';
  
  return new WhatsPointsClient(baseUrl, username, password);
};
```

#### 2.2 Create Serverless Function for Sender Management
**File**: `api/whatsapp-sender-register.js`

```javascript
/**
 * Vercel Serverless Function for WhatsApp Sender Registration
 * Handles communication with WhatsPoints API
 */

const axios = require('axios');

const WHATSPOINTS_API_URL = process.env.WHATSPOINTS_API_URL;
const WHATSPOINTS_USERNAME = process.env.WHATSPOINTS_API_USERNAME;
const WHATSPOINTS_PASSWORD = process.env.WHATSPOINTS_API_PASSWORD;

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, phoneNumber, senderId } = req.body || {};

    const client = axios.create({
      baseURL: WHATSPOINTS_API_URL,
      auth: {
        username: WHATSPOINTS_USERNAME,
        password: WHATSPOINTS_PASSWORD,
      },
      timeout: 30000,
    });

    switch (action) {
      case 'list': {
        // List all senders
        const response = await client.get('/api/senders');
        return res.status(200).json(response.data);
      }

      case 'check': {
        // Check if phone number is registered
        const response = await client.get('/api/senders');
        const senders = response.data.senders || [];
        const sender = senders.find(s => s.phone_number === phoneNumber);
        
        return res.status(200).json({
          registered: !!sender,
          senderId: sender?.id || null,
          isActive: sender?.is_active || false,
        });
      }

      case 'verify': {
        // Verify sender status by ID
        const response = await client.get('/api/senders');
        const senders = response.data.senders || [];
        const sender = senders.find(s => s.id === senderId);
        
        return res.status(200).json({
          registered: !!sender,
          isActive: sender?.is_active || false,
        });
      }

      default:
        return res.status(400).json({
          error: 'Invalid action. Supported: list, check, verify',
        });
    }
  } catch (error) {
    console.error('WhatsApp sender registration error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to communicate with WhatsPoints API',
    });
  }
};
```

#### 2.3 Create React Hook for Sender Management
**File**: `src/hooks/useWhatsAppSenderRegistration.ts`

```typescript
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface SenderStatus {
  registered: boolean;
  senderId: string | null;
  isActive: boolean;
  lastVerified: Date | null;
}

export const useWhatsAppSenderRegistration = (storeId: string) => {
  const [loading, setLoading] = useState(false);
  const [senderStatus, setSenderStatus] = useState<SenderStatus | null>(null);
  const { toast } = useToast();

  /**
   * Check if store phone number is registered as WhatsApp sender
   */
  const checkSenderStatus = useCallback(async (phoneNumber: string) => {
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
        throw new Error('Failed to check sender status');
      }

      const data = await response.json();
      
      const status: SenderStatus = {
        registered: data.registered,
        senderId: data.senderId,
        isActive: data.isActive,
        lastVerified: new Date(),
      };

      setSenderStatus(status);

      // Update database with current status
      if (data.registered) {
        await supabase
          .from('stores')
          .update({
            wa_sender_registered: true,
            wa_sender_id: data.senderId,
            wa_sender_last_verified: new Date().toISOString(),
          })
          .eq('id', storeId);
      }

      return status;
    } catch (error) {
      console.error('Error checking sender status:', error);
      toast({
        title: 'Error',
        description: 'Failed to check WhatsApp sender status',
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
  const verifySender = useCallback(async (senderId: string) => {
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
        throw new Error('Failed to verify sender');
      }

      const data = await response.json();

      // Update database
      await supabase
        .from('stores')
        .update({
          wa_sender_registered: data.registered,
          wa_sender_last_verified: new Date().toISOString(),
        })
        .eq('id', storeId);

      return data.isActive;
    } catch (error) {
      console.error('Error verifying sender:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify WhatsApp sender',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [storeId, toast]);

  return {
    loading,
    senderStatus,
    checkSenderStatus,
    verifySender,
  };
};
```

### Phase 3: UI Components

#### 3.1 WhatsApp Sender Registration Card
**File**: `src/components/settings/WhatsAppSenderRegistration.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { useWhatsAppSenderRegistration } from '@/hooks/useWhatsAppSenderRegistration';

interface Props {
  storeId: string;
  storePhone: string;
  waUseStoreNumber: boolean;
}

export const WhatsAppSenderRegistration: React.FC<Props> = ({
  storeId,
  storePhone,
  waUseStoreNumber,
}) => {
  const { loading, senderStatus, checkSenderStatus, verifySender } = 
    useWhatsAppSenderRegistration(storeId);

  useEffect(() => {
    if (storePhone && waUseStoreNumber) {
      checkSenderStatus(storePhone);
    }
  }, [storePhone, waUseStoreNumber, checkSenderStatus]);

  const handleVerify = async () => {
    if (senderStatus?.senderId) {
      await verifySender(senderStatus.senderId);
    } else if (storePhone) {
      await checkSenderStatus(storePhone);
    }
  };

  if (!waUseStoreNumber) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Sender Registration</CardTitle>
          <CardDescription>
            Enable "Use Store Number" to register your WhatsApp sender
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!storePhone || storePhone === 'Nomor telepon belum diset') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Sender Registration</CardTitle>
          <CardDescription>
            Please set your store phone number first
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          WhatsApp Sender Registration
          <Badge variant={senderStatus?.registered ? 'default' : 'secondary'}>
            {senderStatus?.registered ? 'Registered' : 'Not Registered'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Register your store phone number ({storePhone}) to send WhatsApp notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {senderStatus?.registered ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Phone Number Registered</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium">Phone Number Not Registered</span>
              </>
            )}
          </div>

          {senderStatus?.senderId && (
            <p className="text-sm text-muted-foreground">
              Sender ID: {senderStatus.senderId}
            </p>
          )}

          {senderStatus?.lastVerified && (
            <p className="text-xs text-muted-foreground">
              Last verified: {new Date(senderStatus.lastVerified).toLocaleString()}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleVerify}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Verify Status
          </Button>

          {!senderStatus?.registered && (
            <Button
              onClick={() => window.open(import.meta.env.VITE_WHATSPOINTS_REGISTRATION_URL, '_blank')}
              variant="default"
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Register Sender
            </Button>
          )}
        </div>

        {/* Instructions */}
        {!senderStatus?.registered && (
          <Alert>
            <AlertDescription className="text-sm">
              <strong>How to register:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Click "Register Sender" to open WhatsPoints registration</li>
                <li>Scan the QR code with WhatsApp on your phone</li>
                <li>Return here and click "Verify Status" to confirm</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
```

#### 3.2 Integrate into Store Settings Page
**File**: `src/pages/StoreManagementPage.tsx` (update existing)

```typescript
// Add import
import { WhatsAppSenderRegistration } from '@/components/settings/WhatsAppSenderRegistration';

// In the render section, after WhatsApp settings:
{store.wa_use_store_number && (
  <WhatsAppSenderRegistration
    storeId={store.id}
    storePhone={store.phone}
    waUseStoreNumber={store.wa_use_store_number}
  />
)}
```

### Phase 4: Environment Variables

Add to `.env.example` and production environment:

```env
# WhatsPoints API Configuration
VITE_WHATSPOINTS_API_URL=https://your-whatspoints-instance.com
VITE_WHATSPOINTS_API_USERNAME=admin
VITE_WHATSPOINTS_API_PASSWORD=your_secure_password
VITE_WHATSPOINTS_REGISTRATION_URL=https://your-whatspoints-instance.com/register

# Backend environment (for serverless functions)
WHATSPOINTS_API_URL=https://your-whatspoints-instance.com
WHATSPOINTS_API_USERNAME=admin
WHATSPOINTS_API_PASSWORD=your_secure_password
```

### Phase 5: Type Definitions Updates

**Update**: `src/types/multi-tenant.ts`

```typescript
export interface Store {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  owner_id: string;
  is_active: boolean;
  enable_qr?: boolean;
  enable_points?: boolean;
  wa_use_store_number?: boolean;
  wa_sender_registered?: boolean;  // NEW
  wa_sender_id?: string;            // NEW
  wa_sender_registered_at?: string; // NEW
  wa_sender_last_verified?: string; // NEW
  created_at: string;
  updated_at: string;
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create database migration for sender tracking fields
- [ ] Update `get_user_stores` function
- [ ] Update TypeScript types
- [ ] Test database changes locally

### Phase 2: Backend Integration (Week 1)
- [ ] Create WhatsPoints client service
- [ ] Create serverless function for sender management
- [ ] Create React hook for sender registration
- [ ] Write unit tests for client and hook
- [ ] Test API integration with WhatsPoints

### Phase 3: UI Implementation (Week 2)
- [ ] Create WhatsApp Sender Registration component
- [ ] Integrate into Store Settings page
- [ ] Add status indicators and badges
- [ ] Implement verification flow
- [ ] Add error handling and user feedback

### Phase 4: Testing & Documentation (Week 2)
- [ ] End-to-end testing of registration flow
- [ ] Test sender verification
- [ ] Update user documentation
- [ ] Create admin guide for WhatsPoints setup
- [ ] Performance testing

### Phase 5: Deployment (Week 3)
- [ ] Add environment variables to production
- [ ] Deploy database migrations
- [ ] Deploy serverless functions
- [ ] Deploy UI updates
- [ ] Monitor and validate in production

## Alternative: Manual Registration Flow

If WhatsPoints doesn't support web-based registration API, implement a manual flow:

1. **Admin registers sender via WhatsPoints CLI/dashboard**
   - Use CLI: `./whatspoints -add-sender-code=+1234567890`
   - Or WhatsPoints web interface (if available)

2. **Store owner verifies registration in POS**
   - Click "Check Registration Status"
   - System calls `/api/senders` to verify
   - Updates database automatically

3. **Benefits**:
   - No need to expose QR registration to web
   - Maintains security of WhatsApp pairing
   - Still provides automatic verification

## Security Considerations

1. **API Credentials**: Never expose WhatsPoints credentials to client
   - Use serverless functions as proxy
   - Store credentials in environment variables

2. **Phone Number Validation**: 
   - Validate phone format before registration
   - Prevent duplicate registrations

3. **Rate Limiting**:
   - Implement rate limits on verification endpoint
   - Prevent abuse of registration checks

4. **Access Control**:
   - Only store owners can register senders
   - Staff can only view registration status

## Success Metrics

- ✅ Store owners can verify their WhatsApp sender status
- ✅ Database accurately tracks registration state
- ✅ Automatic verification keeps status up-to-date
- ✅ Clear UI feedback on registration status
- ✅ Seamless integration with existing notification system

## Future Enhancements

1. **Automated Re-registration**: Detect when sender becomes inactive and notify owner
2. **Multiple Senders per Store**: Support backup sender numbers
3. **Registration Wizard**: Step-by-step guide for new stores
4. **Sender Analytics**: Track message delivery rates per sender
5. **Bulk Registration**: Register multiple stores at once (for admins)

## Dependencies

- WhatsPoints API running and accessible
- Supabase database access
- Vercel serverless functions
- Environment variables configured

## Rollback Plan

If integration fails:
1. Remove UI components (feature flag disable)
2. Keep database fields (no data loss)
3. System continues using existing sender configuration
4. Can re-enable when issues resolved

## Questions to Resolve

1. **Does WhatsPoints support web-based QR registration API?**
   - If yes: Implement full automated flow
   - If no: Use manual registration + verification flow

2. **What is the WhatsPoints instance URL?**
   - Self-hosted or managed service?
   - Production URL for API calls

3. **Authentication method for WhatsPoints?**
   - HTTP Basic Auth confirmed
   - Any API key alternative?

4. **Rate limits on WhatsPoints API?**
   - How many requests per minute allowed?
   - Need to implement client-side throttling?

---

**Next Steps**: 
1. Confirm WhatsPoints API capabilities for web registration
2. Set up test WhatsPoints instance
3. Begin Phase 1 database migration
4. Test integration with staging environment
