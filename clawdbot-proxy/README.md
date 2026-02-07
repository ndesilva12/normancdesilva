# Clawdbot HTTP Proxy

HTTP proxy server that bridges public Vercel deployments to the Clawdbot API running on localhost.

## Architecture

```
Dashboard (Vercel)
    ↓ HTTPS
Proxy Server (Ubuntu :8080, public URL)
    ↓ HTTP (localhost)
Clawdbot API (:3032)
    ↓ WebSocket (internal)
Gateway (:18789)
    ↓
Jimmy processes request
```

## Setup

### 1. Install Dependencies

```bash
cd clawdbot-proxy
npm install
```

### 2. Test Clawdbot Connection

Verify Clawdbot is accessible on localhost:

```bash
curl -X POST http://localhost:3032/api/sessions/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 01c11d12ea993efba6e4796e8e914db50bbab121913da457" \
  -d '{
    "sessionKey": "test",
    "message": "Hello, are you there?",
    "timeoutSeconds": 10
  }'
```

### 3. Run the Proxy

```bash
npm start
```

The proxy will start on port 8080 (configurable via `PORT` env var).

### 4. Test the Proxy Locally

```bash
# Health check
curl http://localhost:8080/health

# Connection test
curl http://localhost:8080/test

# Send a message
curl -X POST http://localhost:8080/api/clawdbot \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the weather today?",
    "sessionKey": "test",
    "timeout": 30
  }'
```

### 5. Expose Publicly

**Option A: ngrok (quick setup)**

```bash
ngrok http 8080
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

**Option B: Cloudflare Tunnel (recommended for production)**

```bash
cloudflared tunnel --url http://localhost:8080
```

### 6. Configure Vercel

Add the public URL as an environment variable in Vercel:

```
CLAWDBOT_PROXY_URL=https://your-public-url
```

For example:
- ngrok: `https://abc123.ngrok.io`
- Cloudflare: `https://your-tunnel.trycloudflare.com`

## API Endpoints

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "clawdbot_api": "http://localhost:3032/api/sessions/send",
  "timestamp": "2025-02-07T12:00:00.000Z"
}
```

### GET /test

Test Clawdbot connection with a simple message.

**Response (success):**
```json
{
  "success": true,
  "response": "Clawdbot's response",
  "message": "Clawdbot connection successful!"
}
```

### POST /api/clawdbot

Send message to Clawdbot.

**Request:**
```json
{
  "message": "Your message to Clawdbot",
  "sessionKey": "relationship-intel",
  "timeout": 120
}
```

**Response:**
```json
{
  "success": true,
  "response": "Clawdbot's response",
  "timestamp": "2025-02-07T12:00:00.000Z"
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "timestamp": "2025-02-07T12:00:00.000Z"
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Port for the proxy server |
| `CLAWDBOT_API_URL` | `http://localhost:3032/api/sessions/send` | Clawdbot API endpoint |
| `CLAWDBOT_TOKEN` | `01c11d12ea993efba6e4796e8e914db50bbab121913da457` | Auth token for Clawdbot |

## Production Deployment

### Using systemd (runs on boot)

Create `/etc/systemd/system/clawdbot-proxy.service`:

```ini
[Unit]
Description=Clawdbot HTTP Proxy
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/path/to/clawdbot-proxy
ExecStart=/usr/bin/node server.js
Restart=always
Environment=PORT=8080
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable clawdbot-proxy
sudo systemctl start clawdbot-proxy
```

### Using PM2 (process manager)

```bash
npm install -g pm2
pm2 start server.js --name clawdbot-proxy
pm2 save
pm2 startup
```

## Troubleshooting

**Proxy can't connect to Clawdbot:**
- Verify Clawdbot is running: `curl http://localhost:3032/health`
- Check the auth token is correct
- Check firewall settings

**Vercel can't reach the proxy:**
- Ensure ngrok/Cloudflare tunnel is running
- Verify the public URL is correct in Vercel env vars
- Check proxy logs for incoming requests
