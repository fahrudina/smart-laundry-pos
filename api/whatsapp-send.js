// Vercel serverless function for WhatsApp API proxy
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method Not Allowed. Only POST requests are supported.' 
    });
  }

  try {
    console.log('📱 WhatsApp API Request:', {
      body: req.body,
      timestamp: new Date().toISOString()
    });

    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Both "to" and "message" fields are required'
      });
    }

    // Get WhatsApp API configuration from environment variables
    const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL ;
    const WHATSAPP_USERNAME = process.env.WHATSAPP_USERNAME || 'admin';
    const WHATSAPP_PASSWORD = process.env.WHATSAPP_PASSWORD;

    if (!WHATSAPP_API_URL || !WHATSAPP_PASSWORD) {
      return res.status(500).json({
        success: false,
        error: 'WhatsApp API configuration incomplete'
      });
    }

    // Create the API endpoint URL - ensure it has the correct path
    const whatsappApiEndpoint = WHATSAPP_API_URL.endsWith('/api/send-message') 
      ? WHATSAPP_API_URL 
      : `${WHATSAPP_API_URL}/api/send-message`;
    const credentials = Buffer.from(`${WHATSAPP_USERNAME}:${WHATSAPP_PASSWORD}`).toString('base64');
    
    console.log('🔗 Forwarding to:', whatsappApiEndpoint);

    // Forward the request to the actual WhatsApp API
    const response = await fetch(whatsappApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify({ to, message }),
    });

    const responseText = await response.text();
    console.log('📥 WhatsApp API Response:', {
      status: response.status,
      body: responseText
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `WhatsApp API error: ${response.status}`,
        details: responseText
      });
    }

    // Parse and forward the response
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      result = {
        success: true,
        message: 'Message sent successfully',
        id: 'unknown',
        raw: responseText
      };
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ WhatsApp API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}
