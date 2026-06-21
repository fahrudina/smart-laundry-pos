/**
 * Vercel Serverless Function for WhatsApp Sender Registration
 * Handles communication with WhatsPoints API securely from backend
 * 
 * Actions:
 * - list: Get all registered senders
 * - check: Verify if phone number is registered
 * - verify: Check sender status by ID
 */

const WHATSPOINTS_API_URL = process.env.WHATSPOINTS_API_URL;
const WHATSPOINTS_USERNAME = process.env.WHATSPOINTS_API_USERNAME;
const WHATSPOINTS_PASSWORD = process.env.WHATSPOINTS_API_PASSWORD;

/**
 * Set CORS headers
 */
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

/**
 * Normalize phone number for comparison
 */
const normalizePhone = (phone) => {
  return phone.replace(/[\s\-+]/g, '');
};

/**
 * Make request to WhatsPoints API
 */
const whatsPointsRequest = async (endpoint, options = {}) => {
  const url = `${WHATSPOINTS_API_URL}${endpoint}`;
  const credentials = Buffer.from(`${WHATSPOINTS_USERNAME}:${WHATSPOINTS_PASSWORD}`).toString('base64');

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`WhatsPoints API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Main handler
 */
module.exports = async (req, res) => {
  setCorsHeaders(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check environment variables
  if (!WHATSPOINTS_API_URL || !WHATSPOINTS_USERNAME || !WHATSPOINTS_PASSWORD) {
    console.error('Missing WhatsPoints configuration');
    return res.status(500).json({
      error: 'WhatsPoints service not configured',
      details: 'Missing required environment variables',
    });
  }

  try {
    const { action, phoneNumber, senderId } = req.body || {};

    if (!action) {
      return res.status(400).json({
        error: 'Missing required field: action',
        validActions: ['list', 'check', 'verify'],
      });
    }

    switch (action) {
      case 'list': {
        // List all registered senders
        const data = await whatsPointsRequest('/api/senders');
        return res.status(200).json(data);
      }

      case 'check': {
        // Check if phone number is registered
        if (!phoneNumber) {
          return res.status(400).json({ error: 'Missing required field: phoneNumber' });
        }

        const data = await whatsPointsRequest('/api/senders');
        const senders = data.senders || [];
        const normalizedPhone = normalizePhone(phoneNumber);
        
        const sender = senders.find(s => {
          const senderPhone = normalizePhone(s.phone_number);
          return senderPhone === normalizedPhone;
        });

        return res.status(200).json({
          registered: !!sender,
          senderId: sender?.id || null,
          isActive: sender?.is_active || false,
          sender: sender || null,
        });
      }

      case 'verify': {
        // Verify sender status by ID
        if (!senderId) {
          return res.status(400).json({ error: 'Missing required field: senderId' });
        }

        const data = await whatsPointsRequest('/api/senders');
        const senders = data.senders || [];
        const sender = senders.find(s => s.id === senderId);

        return res.status(200).json({
          registered: !!sender,
          isActive: sender?.is_active || false,
          sender: sender || null,
        });
      }

      default:
        return res.status(400).json({
          error: `Invalid action: ${action}`,
          validActions: ['list', 'check', 'verify'],
        });
    }
  } catch (error) {
    console.error('WhatsApp sender registration error:', error);
    
    // Handle timeout errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return res.status(504).json({
        error: 'WhatsPoints API request timeout',
        details: 'The request took too long to complete',
      });
    }

    // Handle connection errors
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      return res.status(503).json({
        error: 'Cannot connect to WhatsPoints service',
        details: 'The WhatsPoints API is not reachable',
      });
    }

    return res.status(500).json({
      error: error.message || 'Internal server error',
      details: 'Failed to communicate with WhatsPoints API',
    });
  }
};
