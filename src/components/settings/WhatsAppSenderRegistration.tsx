/**
 * WhatsApp Sender Registration Component
 * Allows store owners to register and verify their WhatsApp sender status
 */

import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, RefreshCw, ExternalLink, AlertCircle, Phone } from 'lucide-react';
import { useWhatsAppSenderRegistration } from '@/hooks/useWhatsAppSenderRegistration';

interface WhatsAppSenderRegistrationProps {
  storeId: string;
  storePhone: string;
  waUseStoreNumber?: boolean;
  waSenderRegistered?: boolean;
  waSenderId?: string;
}

export const WhatsAppSenderRegistration: React.FC<WhatsAppSenderRegistrationProps> = ({
  storeId,
  storePhone,
  waUseStoreNumber = false,
  waSenderRegistered = false,
  waSenderId,
}) => {
  const { loading, senderStatus, senderDetails, checkSenderStatus, verifySender } = 
    useWhatsAppSenderRegistration(storeId);

  // Auto-check on mount if enabled and phone is set
  useEffect(() => {
    if (storePhone && waUseStoreNumber && storePhone !== 'Nomor telepon belum diset') {
      checkSenderStatus(storePhone);
    }
  }, [storePhone, waUseStoreNumber]); // Only run on mount or when these change

  const handleVerify = async () => {
    if (senderStatus?.senderId || waSenderId) {
      await verifySender(senderStatus?.senderId || waSenderId!);
    } else if (storePhone) {
      await checkSenderStatus(storePhone);
    }
  };

  const handleRegister = () => {
    const registrationUrl = import.meta.env.VITE_WHATSPOINTS_REGISTRATION_URL || 
      `${import.meta.env.VITE_WHATSPOINTS_API_URL || 'http://localhost:8080'}`;
    window.open(registrationUrl, '_blank');
  };

  // If feature is not enabled
  if (!waUseStoreNumber) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            WhatsApp Sender Registration
          </CardTitle>
          <CardDescription>
            Enable "Use Store Number for WhatsApp" to register your sender
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To use your store's phone number for WhatsApp notifications, first enable the feature in your store settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // If no phone number is set
  if (!storePhone || storePhone === 'Nomor telepon belum diset') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            WhatsApp Sender Registration
          </CardTitle>
          <CardDescription>
            Set your store phone number to register as WhatsApp sender
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please set your store phone number first before registering as WhatsApp sender.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const isRegistered = senderStatus?.registered ?? waSenderRegistered;
  const isActive = senderStatus?.isActive ?? false;
  const currentSenderId = senderStatus?.senderId ?? waSenderId;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              WhatsApp Sender Registration
            </CardTitle>
            <CardDescription className="mt-1">
              Register {storePhone} to send WhatsApp notifications
            </CardDescription>
          </div>
          <Badge variant={isRegistered && isActive ? 'default' : isRegistered ? 'secondary' : 'outline'}>
            {isRegistered && isActive ? 'Active' : isRegistered ? 'Registered' : 'Not Registered'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {isRegistered ? (
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

          {isRegistered && !isActive && (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Sender is registered but not active</span>
            </div>
          )}

          {currentSenderId && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <strong>Sender ID:</strong> {currentSenderId}
              </p>
              {senderDetails && (
                <>
                  <p>
                    <strong>Name:</strong> {senderDetails.name}
                  </p>
                  <p>
                    <strong>Phone:</strong> {senderDetails.phone_number}
                  </p>
                </>
              )}
            </div>
          )}

          {senderStatus?.lastVerified && (
            <p className="text-xs text-muted-foreground">
              Last verified: {new Date(senderStatus.lastVerified).toLocaleString()}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleVerify}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Checking...' : 'Verify Status'}
          </Button>

          {!isRegistered && (
            <Button
              onClick={handleRegister}
              variant="default"
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Register Sender
            </Button>
          )}
        </div>

        {/* Instructions */}
        {!isRegistered && (
          <Alert>
            <AlertDescription className="text-sm">
              <strong>How to register your WhatsApp sender:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1.5">
                <li>Click "Register Sender" to open WhatsPoints registration</li>
                <li>Follow the instructions to scan QR code with WhatsApp</li>
                <li>Return here and click "Verify Status" to confirm registration</li>
                <li>Once verified, your messages will be sent from {storePhone}</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {isRegistered && isActive && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-800">
              <strong>Your WhatsApp sender is active!</strong>
              <p className="mt-1">
                All WhatsApp notifications will be sent from your store number: {storePhone}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {isRegistered && !isActive && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Sender is registered but not active</strong>
              <p className="mt-1">
                Your WhatsApp connection may have been disconnected. Please check your WhatsApp status in WhatsPoints or re-register.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
