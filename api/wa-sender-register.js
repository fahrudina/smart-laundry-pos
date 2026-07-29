// Vercel serverless function for WhatsApp sender registration.
// Proxies to the same WhatsPoints instance used by whatsapp-send.js.
//
// Named outside the "whatsapp-*" prefix so it isn't swallowed by the
// vite.config.ts dev proxy rule for '/api/whatsapp' (which rewrites to
// '/api' on the WhatsPoints host); this function is developed against via
// `vercel dev` instead, exercising the same code path as production.
//
// A single POST endpoint with an `action` field (rather than separate GET
// routes) so it stays outside the service worker's cache-first GET handling
// (public/sw.js), which would otherwise serve a stale "pending" status
// forever once cached.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. Only POST requests are supported.',
    });
  }

  const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
  const WHATSAPP_USERNAME = process.env.WHATSAPP_USERNAME || 'admin';
  const WHATSAPP_PASSWORD = process.env.WHATSAPP_PASSWORD;

  if (!WHATSAPP_API_URL || !WHATSAPP_PASSWORD) {
    return res.status(500).json({
      success: false,
      error: 'WhatsApp API configuration incomplete',
    });
  }

  const authHeader = `Basic ${Buffer.from(`${WHATSAPP_USERNAME}:${WHATSAPP_PASSWORD}`).toString('base64')}`;

  const callWhatsPoints = async (path, options = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(`${WHATSAPP_API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
          ...options.headers,
        },
        signal: controller.signal,
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
      return { ok: response.ok, status: response.status, data, raw: text };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Mirrors WhatsAppClient.formatPhoneNumber (src/integrations/whatsapp/client.ts)
  // so "check" comparisons line up regardless of how the client formatted input.
  const normalizePhone = (phoneNumber, defaultCountryCode = '62') => {
    const cleaned = String(phoneNumber || '').replace(/\D/g, '');
    if (cleaned.startsWith(defaultCountryCode)) return cleaned;
    if (cleaned.startsWith('0')) return `${defaultCountryCode}${cleaned.substring(1)}`;
    return `${defaultCountryCode}${cleaned}`;
  };

  try {
    const { action } = req.body || {};

    switch (action) {
      case 'qr': {
        const result = await callWhatsPoints('/api/register-sender-qr', {
          method: 'POST',
          body: JSON.stringify({}),
        });
        if (!result.ok || !result.data) {
          return res.status(result.status || 500).json({
            success: false,
            error: 'Failed to start QR registration',
            details: result.raw,
          });
        }
        return res.status(200).json({
          success: !!result.data.success,
          session_id: result.data.session_id,
          qr_code: result.data.qr_code,
          message: result.data.message,
        });
      }

      case 'code': {
        const { phone_number: phoneNumber } = req.body || {};
        if (!phoneNumber) {
          return res.status(400).json({ success: false, error: 'phone_number is required' });
        }
        const normalized = normalizePhone(phoneNumber);
        const result = await callWhatsPoints('/api/register-sender-code', {
          method: 'POST',
          body: JSON.stringify({ phone_number: normalized }),
        });
        if (!result.data) {
          return res.status(result.status || 500).json({
            success: false,
            error: 'Failed to start pairing code registration',
            details: result.raw,
          });
        }
        return res.status(result.ok ? 200 : result.status).json({
          success: !!result.data.success,
          session_id: result.data.session_id,
          pairing_code: result.data.pairing_code,
          phone_number: result.data.phone_number,
          message: result.data.message,
        });
      }

      case 'status': {
        const { session_id: sessionId } = req.body || {};
        if (!sessionId) {
          return res.status(400).json({ success: false, error: 'session_id is required' });
        }
        const result = await callWhatsPoints(`/api/register-sender-status/${encodeURIComponent(sessionId)}`, {
          method: 'GET',
        });
        if (!result.data) {
          return res.status(result.status || 500).json({
            success: false,
            error: 'Failed to fetch registration status',
            details: result.raw,
          });
        }
        return res.status(200).json({
          success: !!result.data.success,
          status: result.data.status,
          sender_id: result.data.sender_id,
          qr_code: result.data.qr_code,
          message: result.data.message,
        });
      }

      case 'check': {
        const { phone_number: phoneNumber } = req.body || {};
        if (!phoneNumber) {
          return res.status(400).json({ success: false, error: 'phone_number is required' });
        }
        const normalized = normalizePhone(phoneNumber);
        const result = await callWhatsPoints('/api/senders', { method: 'GET' });
        if (!result.ok || !result.data) {
          return res.status(result.status || 500).json({
            success: false,
            error: 'Failed to check sender status',
            details: result.raw,
          });
        }
        // Only the match is returned - the full sender list (every tenant's
        // numbers) never leaves this function.
        const senders = Array.isArray(result.data.senders) ? result.data.senders : [];
        const match = senders.find((s) => normalizePhone(s.phone_number) === normalized);
        return res.status(200).json({
          success: true,
          registered: !!match,
          sender_id: match ? match.id : null,
        });
      }

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Supported: qr, code, status, check',
        });
    }
  } catch (error) {
    console.error('WhatsApp sender registration error:', error);
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    return res.status(isTimeout ? 504 : 500).json({
      success: false,
      error: isTimeout ? 'Request to WhatsApp API timed out' : 'Internal server error',
      details: error instanceof Error ? error.message : undefined,
    });
  }
}
