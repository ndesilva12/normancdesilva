const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Clawdbot API configuration
const CLAWDBOT_API_URL = process.env.CLAWDBOT_API_URL || 'http://localhost:3032/api/sessions/send';
const CLAWDBOT_TOKEN = process.env.CLAWDBOT_TOKEN || '01c11d12ea993efba6e4796e8e914db50bbab121913da457';
const PORT = process.env.PORT || 8080;

// Helper to call Clawdbot API
async function callClawdbot(message, sessionKey = 'relationship-intel', timeoutSeconds = 120) {
  console.log('[Proxy] Calling Clawdbot API:', CLAWDBOT_API_URL);

  const response = await fetch(CLAWDBOT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CLAWDBOT_TOKEN}`,
    },
    body: JSON.stringify({
      sessionKey,
      message,
      timeoutSeconds,
    }),
  });

  if (!response.ok) {
    throw new Error(`Clawdbot API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Clawdbot error: ${data.error}`);
  }

  return data.response || data;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    clawdbot_api: CLAWDBOT_API_URL,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to verify Clawdbot connection
app.get('/test', async (req, res) => {
  try {
    const response = await callClawdbot('Hello, are you there?', 'test', 10);
    res.json({
      success: true,
      response,
      message: 'Clawdbot connection successful!'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: error.message,
      message: 'Failed to connect to Clawdbot'
    });
  }
});

// Main proxy endpoint
app.post('/api/clawdbot', async (req, res) => {
  try {
    const { message, sessionKey = 'relationship-intel', timeout = 120 } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    console.log(`[Proxy] Processing request with sessionKey: ${sessionKey}, timeout: ${timeout}s`);

    const response = await callClawdbot(message, sessionKey, timeout);

    res.json({
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Proxy] Error:', error.message);
    res.status(503).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Clawdbot HTTP Proxy Server`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Port: ${PORT}`);
  console.log(`Clawdbot API: ${CLAWDBOT_API_URL}`);
  console.log(`\n📡 Endpoints:`);
  console.log(`  GET  /health - Health check`);
  console.log(`  GET  /test - Test Clawdbot connection`);
  console.log(`  POST /api/clawdbot - Send message to Clawdbot`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
