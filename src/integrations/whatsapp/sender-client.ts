import {
  StartQRRegistrationResponse,
  StartCodeRegistrationResponse,
  RegistrationStatusResponse,
  CheckSenderResponse,
} from './types';

const ENDPOINT = '/api/wa-sender-register';

async function post<T extends { success: boolean }>(body: Record<string, unknown>): Promise<T> {
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return data as T;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    } as T;
  }
}

/**
 * Client for api/wa-sender-register.js (the WhatsPoints sender
 * registration proxy). One POST body per action, matching the proxy's
 * dispatch - see that file for why (keeps this off the service worker's
 * cache-first GET handling).
 */
export const WhatsAppSenderClient = {
  startQRRegistration(): Promise<StartQRRegistrationResponse> {
    return post<StartQRRegistrationResponse>({ action: 'qr' });
  },

  startCodeRegistration(phoneNumber: string): Promise<StartCodeRegistrationResponse> {
    return post<StartCodeRegistrationResponse>({ action: 'code', phone_number: phoneNumber });
  },

  getRegistrationStatus(sessionId: string): Promise<RegistrationStatusResponse> {
    return post<RegistrationStatusResponse>({ action: 'status', session_id: sessionId });
  },

  /**
   * Checks whether a phone number is already a registered WhatsPoints
   * sender. The proxy filters server-side - the full sender list (every
   * store's numbers) never reaches this client.
   */
  checkSender(phoneNumber: string): Promise<CheckSenderResponse> {
    return post<CheckSenderResponse>({ action: 'check', phone_number: phoneNumber });
  },
};
