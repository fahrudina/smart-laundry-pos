import { describe, it, expect, vi } from 'vitest';
import { runSenderPairing, verifyExistingSender, SenderFlowClient, SenderFlowState } from './useWhatsAppSenderRegistration';

const makeClient = (overrides: Partial<SenderFlowClient> = {}): SenderFlowClient => ({
  checkSender: vi.fn().mockResolvedValue({ success: true, registered: false, sender_id: null }),
  startQRRegistration: vi.fn().mockResolvedValue({ success: true, session_id: 'sess-1', qr_code: 'qr-base64' }),
  startCodeRegistration: vi.fn().mockResolvedValue({ success: true, session_id: 'sess-1', pairing_code: '1234-5678' }),
  getRegistrationStatus: vi.fn().mockResolvedValue({ success: true, status: 'connected', sender_id: '6281111111111' }),
  ...overrides,
});

// No real delay in tests - keeps the timeout-based test fast without
// needing to mock Date.now(), which the runtime doesn't allow globally
// mocking safely across the suite.
const instantSleep = () => Promise.resolve();

describe('runSenderPairing', () => {
  it('links directly when the phone is already a registered sender, without starting pairing', async () => {
    const client = makeClient({
      checkSender: vi.fn().mockResolvedValue({ success: true, registered: true, sender_id: '6282125458657' }),
    });
    const persistSender = vi.fn().mockResolvedValue(undefined);
    const states: SenderFlowState[] = [];

    const result = await runSenderPairing('081234567890', 'qr', { client, persistSender }, (s) => states.push(s));

    expect(result).toEqual({ phase: 'linked', senderId: '6282125458657' });
    expect(persistSender).toHaveBeenCalledWith('6282125458657');
    expect(client.startQRRegistration).not.toHaveBeenCalled();
    // Normalizes 081... to 62... before checking.
    expect(client.checkSender).toHaveBeenCalledWith('6281234567890');
  });

  it('runs the QR flow through pending -> connected and persists the sender', async () => {
    const client = makeClient({
      getRegistrationStatus: vi
        .fn()
        .mockResolvedValueOnce({ success: true, status: 'pending', qr_code: 'qr-refreshed' })
        .mockResolvedValueOnce({ success: true, status: 'connected', sender_id: '6283333333333' }),
    });
    const persistSender = vi.fn().mockResolvedValue(undefined);
    const states: SenderFlowState[] = [];

    const result = await runSenderPairing(
      '6281234567890',
      'qr',
      { client, persistSender, sleep: instantSleep },
      (s) => states.push(s),
    );

    expect(result).toEqual({ phase: 'connected', senderId: '6283333333333' });
    expect(persistSender).toHaveBeenCalledWith('6283333333333');
    expect(states.some((s) => s.phase === 'awaiting_qr' && s.qrCode === 'qr-base64')).toBe(true);
    expect(states.some((s) => s.phase === 'awaiting_qr' && s.qrCode === 'qr-refreshed')).toBe(true);
  });

  it('runs the pairing-code flow and reports the pairing code', async () => {
    const client = makeClient();
    const persistSender = vi.fn().mockResolvedValue(undefined);
    const states: SenderFlowState[] = [];

    await runSenderPairing('6281234567890', 'code', { client, persistSender }, (s) => states.push(s));

    expect(client.startCodeRegistration).toHaveBeenCalledWith('6281234567890');
    expect(states.some((s) => s.phase === 'awaiting_code' && s.pairingCode === '1234-5678')).toBe(true);
  });

  it('fails without polling when the start call itself fails', async () => {
    const client = makeClient({
      startQRRegistration: vi.fn().mockResolvedValue({ success: false, message: 'upstream unavailable' }),
    });
    const persistSender = vi.fn();

    const result = await runSenderPairing('6281234567890', 'qr', { client, persistSender }, () => {});

    expect(result).toEqual({ phase: 'failed', error: 'upstream unavailable' });
    expect(client.getRegistrationStatus).not.toHaveBeenCalled();
    expect(persistSender).not.toHaveBeenCalled();
  });

  it('recovers a lost terminal response by checking the phone directly', async () => {
    // WhatsPoints deletes the session the moment a terminal status is
    // read, so a lost 'connected' response looks identical to 'not_found'
    // on any subsequent read. Recovery must re-check by phone number.
    const client = makeClient({
      getRegistrationStatus: vi.fn().mockResolvedValue({ success: false, status: 'not_found' }),
      checkSender: vi
        .fn()
        .mockResolvedValueOnce({ success: true, registered: false, sender_id: null }) // pre-flight check
        .mockResolvedValueOnce({ success: true, registered: true, sender_id: '6284444444444' }), // recovery
    });
    const persistSender = vi.fn().mockResolvedValue(undefined);

    const result = await runSenderPairing('6281234567890', 'qr', { client, persistSender }, () => {});

    expect(result).toEqual({ phase: 'connected', senderId: '6284444444444' });
    expect(persistSender).toHaveBeenCalledWith('6284444444444');
  });

  it('fails when the terminal response is lost and recovery finds nothing', async () => {
    const client = makeClient({
      getRegistrationStatus: vi.fn().mockResolvedValue({ success: false, status: 'failed', message: 'pairing rejected' }),
      checkSender: vi.fn().mockResolvedValue({ success: true, registered: false, sender_id: null }),
    });
    const persistSender = vi.fn();

    const result = await runSenderPairing('6281234567890', 'qr', { client, persistSender }, () => {});

    expect(result).toEqual({ phase: 'failed', error: 'pairing rejected' });
    expect(persistSender).not.toHaveBeenCalled();
  });

  it('stops polling once isCancelled reports true, without persisting', async () => {
    const client = makeClient({
      getRegistrationStatus: vi.fn().mockResolvedValue({ success: true, status: 'pending', qr_code: 'qr-base64' }),
    });
    const persistSender = vi.fn();

    const result = await runSenderPairing(
      '6281234567890',
      'qr',
      { client, persistSender, sleep: instantSleep, isCancelled: () => true },
      () => {},
    );

    expect(result).toEqual({ phase: 'idle' });
    expect(client.getRegistrationStatus).not.toHaveBeenCalled();
    expect(persistSender).not.toHaveBeenCalled();
  });

  it('gives up after the timeout if status never leaves pending', async () => {
    const client = makeClient({
      getRegistrationStatus: vi.fn().mockResolvedValue({ success: true, status: 'pending', qr_code: 'qr-base64' }),
    });
    const persistSender = vi.fn();

    const result = await runSenderPairing(
      '6281234567890',
      'qr',
      { client, persistSender, sleep: instantSleep, timeoutMs: 5, pollIntervalMs: 0 },
      () => {},
    );

    expect(result.phase).toBe('failed');
    expect(persistSender).not.toHaveBeenCalled();
  });
});

describe('verifyExistingSender', () => {
  it('persists the sender id and reports registered when found', async () => {
    const client = makeClient({
      checkSender: vi.fn().mockResolvedValue({ success: true, registered: true, sender_id: '6285555555555' }),
    });
    const persistSender = vi.fn().mockResolvedValue(undefined);

    const result = await verifyExistingSender('6281234567890', { client, persistSender });

    expect(result).toEqual({ registered: true, senderId: '6285555555555' });
    expect(persistSender).toHaveBeenCalledWith('6285555555555');
  });

  it('persists null and reports unregistered when the sender is gone', async () => {
    const client = makeClient({
      checkSender: vi.fn().mockResolvedValue({ success: true, registered: false, sender_id: null }),
    });
    const persistSender = vi.fn().mockResolvedValue(undefined);

    const result = await verifyExistingSender('6281234567890', { client, persistSender });

    expect(result).toEqual({ registered: false, senderId: null });
    expect(persistSender).toHaveBeenCalledWith(null);
  });
});
