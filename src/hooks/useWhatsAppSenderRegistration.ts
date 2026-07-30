import { useCallback, useRef, useState } from 'react';
import { WhatsAppSenderClient } from '@/integrations/whatsapp/sender-client';
import { WhatsAppClient } from '@/integrations/whatsapp/client';
import { authService } from '@/services/authService';

const DEFAULT_POLL_INTERVAL_MS = 2500;
const DEFAULT_TIMEOUT_MS = 3 * 60 * 1000;

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export type SenderFlowPhase =
  | 'idle'
  | 'checking'
  | 'awaiting_qr'
  | 'awaiting_code'
  | 'linked'
  | 'connected'
  | 'failed';

export interface SenderFlowState {
  phase: SenderFlowPhase;
  qrCode?: string;
  pairingCode?: string;
  senderId?: string;
  error?: string;
}

export interface SenderFlowClient {
  checkSender: typeof WhatsAppSenderClient.checkSender;
  startQRRegistration: typeof WhatsAppSenderClient.startQRRegistration;
  startCodeRegistration: typeof WhatsAppSenderClient.startCodeRegistration;
  getRegistrationStatus: typeof WhatsAppSenderClient.getRegistrationStatus;
}

export interface SenderFlowDeps {
  client: SenderFlowClient;
  persistSender: (senderId: string | null) => Promise<void>;
  sleep?: (ms: number) => Promise<void>;
  pollIntervalMs?: number;
  timeoutMs?: number;
  // Checked before each poll so a cancelled run (see useWhatsAppSenderRegistration's
  // reset()) stops polling instead of running to completion in the background.
  isCancelled?: () => boolean;
}

/**
 * Pairs a store with a WhatsPoints sender, either via QR code or SMS
 * pairing code, and persists the result. Exported as a plain function
 * (rather than living inside the hook) so its state transitions -
 * already-registered short-circuit, pending/connected/failed polling,
 * and lost-terminal-response recovery - are unit-testable by mocking
 * `deps.client`, without rendering a component.
 *
 * WhatsPoints deletes a registration session the first time its terminal
 * status is read (see RegistrationStatusResponse in types.ts), so if that
 * one response is lost, re-polling the same session returns 'not_found'
 * forever even though pairing may have actually succeeded. The recovery
 * check below re-queries by phone number instead of trusting the session.
 */
export async function runSenderPairing(
  phoneNumber: string,
  method: 'qr' | 'code',
  deps: SenderFlowDeps,
  onStateChange: (state: SenderFlowState) => void,
): Promise<SenderFlowState> {
  const sleep = deps.sleep ?? defaultSleep;
  const pollIntervalMs = deps.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  onStateChange({ phase: 'checking' });
  const normalized = WhatsAppClient.formatPhoneNumber(phoneNumber);

  // Skip pairing entirely if this number is already a registered sender
  // (e.g. shared across stores, per production data) - re-pairing risks
  // unlinking the device for whoever else already depends on it.
  const existing = await deps.client.checkSender(normalized);
  if (existing.success && existing.registered && existing.sender_id) {
    await deps.persistSender(existing.sender_id);
    const state: SenderFlowState = { phase: 'linked', senderId: existing.sender_id };
    onStateChange(state);
    return state;
  }

  let sessionId: string | undefined;
  let qrCode: string | undefined;
  let pairingCode: string | undefined;
  let startOk = false;
  let startMessage: string | undefined;

  if (method === 'qr') {
    const start = await deps.client.startQRRegistration();
    startOk = !!start.success && !!start.session_id;
    sessionId = start.session_id;
    qrCode = start.qr_code;
    startMessage = start.message || start.error;
  } else {
    const start = await deps.client.startCodeRegistration(normalized);
    startOk = !!start.success && !!start.session_id;
    sessionId = start.session_id;
    pairingCode = start.pairing_code;
    startMessage = start.message || start.error;
  }

  if (!startOk || !sessionId) {
    const state: SenderFlowState = { phase: 'failed', error: startMessage || 'Failed to start registration' };
    onStateChange(state);
    return state;
  }

  let state: SenderFlowState = {
    phase: method === 'qr' ? 'awaiting_qr' : 'awaiting_code',
    qrCode,
    pairingCode,
  };
  onStateChange(state);

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (deps.isCancelled?.()) {
      return { phase: 'idle' };
    }

    const status = await deps.client.getRegistrationStatus(sessionId);

    if (status.status === 'pending') {
      state = { ...state, qrCode: status.qr_code ?? state.qrCode };
      onStateChange(state);
      await sleep(pollIntervalMs);
      continue;
    }

    if (status.status === 'connected' && status.sender_id) {
      await deps.persistSender(status.sender_id);
      state = { phase: 'connected', senderId: status.sender_id };
      onStateChange(state);
      return state;
    }

    // status is 'failed' or 'not_found': the session is gone either way.
    // Recover by checking the phone directly, in case pairing actually
    // succeeded but this terminal response never reached us.
    const recovered = await deps.client.checkSender(normalized);
    if (recovered.success && recovered.registered && recovered.sender_id) {
      await deps.persistSender(recovered.sender_id);
      state = { phase: 'connected', senderId: recovered.sender_id };
      onStateChange(state);
      return state;
    }

    state = { phase: 'failed', error: status.message || 'Registration failed. Please try again.' };
    onStateChange(state);
    return state;
  }

  state = { phase: 'failed', error: 'Timed out waiting for pairing. Please try again.' };
  onStateChange(state);
  return state;
}

/**
 * Re-checks an already-linked sender against WhatsPoints and persists the
 * result either way (registered -> sender_id, not registered -> null).
 * Used both for the settings card's on-mount/manual verification (a
 * healthy sender can silently die if the device gets unlinked) and to
 * recover from a lost registration response.
 */
export async function verifyExistingSender(
  phoneNumber: string,
  deps: Pick<SenderFlowDeps, 'client' | 'persistSender'>,
): Promise<{ registered: boolean; senderId: string | null }> {
  const normalized = WhatsAppClient.formatPhoneNumber(phoneNumber);
  const result = await deps.client.checkSender(normalized);
  const senderId = result.success && result.registered ? result.sender_id : null;
  await deps.persistSender(senderId);
  return { registered: !!senderId, senderId };
}

export const useWhatsAppSenderRegistration = (storeId: string) => {
  const [state, setState] = useState<SenderFlowState>({ phase: 'idle' });
  const [verifying, setVerifying] = useState(false);
  const busyRef = useRef(false);
  // Bumped on every reset() so an in-flight runFlow's state updates and
  // persistSender writes become no-ops instead of clobbering whatever the
  // user cancelled to (e.g. restarting pairing with a different number).
  const runTokenRef = useRef(0);

  const persistSender = useCallback(
    (senderId: string | null) => authService.setStoreWaSender(storeId, senderId),
    [storeId],
  );

  const runFlow = useCallback(async (phoneNumber: string, method: 'qr' | 'code') => {
    if (busyRef.current) return;
    busyRef.current = true;
    const token = ++runTokenRef.current;
    const isCancelled = () => token !== runTokenRef.current;
    try {
      await runSenderPairing(
        phoneNumber,
        method,
        {
          client: WhatsAppSenderClient,
          persistSender: (senderId) => (isCancelled() ? Promise.resolve() : persistSender(senderId)),
          isCancelled,
        },
        (nextState) => {
          if (!isCancelled()) setState(nextState);
        },
      );
    } catch (error) {
      if (!isCancelled()) {
        setState({ phase: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    } finally {
      busyRef.current = false;
    }
  }, [persistSender]);

  const startQR = useCallback((phoneNumber: string) => runFlow(phoneNumber, 'qr'), [runFlow]);
  const startCode = useCallback((phoneNumber: string) => runFlow(phoneNumber, 'code'), [runFlow]);

  const verifySender = useCallback(async (phoneNumber: string) => {
    setVerifying(true);
    try {
      return await verifyExistingSender(phoneNumber, { client: WhatsAppSenderClient, persistSender });
    } finally {
      setVerifying(false);
    }
  }, [persistSender]);

  const reset = useCallback(() => {
    runTokenRef.current += 1;
    setState({ phase: 'idle' });
  }, []);

  return {
    ...state,
    verifying,
    startQR,
    startCode,
    verifySender,
    reset,
  };
};
