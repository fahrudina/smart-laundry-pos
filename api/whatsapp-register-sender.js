// Vercel serverless function for WhatsApp Sender Registration via QR Code
// Proxies requests to whatspoints service for registering new WhatsApp senders

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get WhatsApp API configuration from environment variables
  const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
  const WHATSAPP_USERNAME = process.env.WHATSAPP_USERNAME || 'admin';
  const WHATSAPP_PASSWORD = process.env.WHATSAPP_PASSWORD;

  if (!WHATSAPP_API_URL || !WHATSAPP_PASSWORD) {
    return res.status(500).json({
      success: false,
      error: 'WhatsApp API configuration incomplete'
    });
  }

  const credentials = Buffer.from(`${WHATSAPP_USERNAME}:${WHATSAPP_PASSWORD}`).toString('base64');

  try {
    if (req.method === 'POST') {
      // Initiate QR code registration
      console.log('📱 Initiating WhatsApp QR Registration:', {
        timestamp: new Date().toISOString()
      });

      // Build the API endpoint URL
      const baseUrl = WHATSAPP_API_URL.replace(/\/+$/, ''); // Remove trailing slashes
      const qrEndpoint = `${baseUrl}/api/register-sender-qr`;

      console.log('🔗 Forwarding to:', qrEndpoint);

      // Call whatspoints API to get QR code
      const response = await fetch(qrEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({}), // Empty body as per whatspoints API spec
      });

      const responseText = await response.text();
      console.log('📥 WhatsApp QR API Response:', {
        status: response.status,
        bodyLength: responseText.length
      });

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: `WhatsApp API error: ${response.status}`,
          details: responseText
        });
      }

      // Parse and return the response
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError);
        return res.status(500).json({
          success: false,
          error: 'Failed to parse WhatsApp API response'
        });
      }

      // Return the QR code data
      // Expected format: { success: true, session_id: "...", qr_code: "base64...", message: "..." }
      return res.status(200).json(result);

    } else if (req.method === 'GET') {
      // Check registration status
      const { sessionId } = req.query;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'sessionId query parameter is required'
        });
      }

      console.log('🔍 Checking WhatsApp Registration Status:', {
        sessionId,
        timestamp: new Date().toISOString()
      });

      // Build the status check endpoint URL
      const baseUrl = WHATSAPP_API_URL.replace(/\/+$/, '');
      const statusEndpoint = `${baseUrl}/api/register-sender-status/${sessionId}`;

      console.log('🔗 Forwarding to:', statusEndpoint);

      // Call whatspoints API to check status
      const response = await fetch(statusEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
        },
      });

      const responseText = await response.text();
      console.log('📥 WhatsApp Status API Response:', {
        status: response.status,
        bodyLength: responseText.length
      });

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: `WhatsApp API error: ${response.status}`,
          details: responseText
        });
      }

      // Parse and return the response
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError);
        return res.status(500).json({
          success: false,
          error: 'Failed to parse WhatsApp API response'
        });
      }

      // Return the status data
      // Expected format: { success: true, status: "pending|connected|failed", sender_id: "...", qr_code: "...", message: "..." }
      return res.status(200).json(result);

    } else {
      return res.status(405).json({
        success: false,
        error: 'Method Not Allowed. Only POST and GET requests are supported.'
      });
    }

  } catch (error) {
    console.error('❌ WhatsApp Registration API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}
