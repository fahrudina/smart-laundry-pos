import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  headers: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// WhatsApp API proxy endpoint
app.post('/api/whatsapp/send-message', async (req, res) => {
  try {
    console.log('📱 WhatsApp Proxy Request:', {
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

    // Forward the request to the actual WhatsApp API
    const response = await fetch('http://34.229.217.97/api/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from('admin:secretPaassword').toString('base64'),
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

    res.json(result);
  } catch (error) {
    console.error('❌ Proxy Error:', error);
    res.status(500).json({
      success: false,
      error: 'Proxy server error',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'WhatsApp proxy server is running'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 WhatsApp Proxy Server running on http://localhost:${PORT}`);
  console.log(`📱 WhatsApp endpoint: http://localhost:${PORT}/api/whatsapp/send-message`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});

export default app;
