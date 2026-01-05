# NotifyPro - Setup Guide

## Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install
```

### Step 2: Configure Environment Variables

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

**Required variables:**
- `MONGODB_URI` - Your MongoDB connection string
- `REDIS_URL` - Your Redis connection string
- `GHL_CLIENT_ID` - From GHL marketplace app
- `GHL_CLIENT_SECRET` - From GHL marketplace app
- `GHL_REDIRECT_URI` - Your OAuth callback URL

**Generate VAPID keys for push notifications:**
```bash
npx web-push generate-vapid-keys
```
Add the output to your .env file.

### Step 3: Start in Development

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Start worker
cd backend
npm run worker
```

### Step 4: Configure GHL Marketplace

1. Go to https://marketplace.gohighlevel.com
2. Create new app "NotifyPro"
3. Add scopes:
   - conversations.readonly
   - conversations/message.readonly
   - contacts.readonly
4. Set redirect URL: `http://localhost:3000/oauth/callback`
5. Set webhook URL: `http://localhost:3000/api/webhooks`
6. Subscribe to webhook: `InboundMessage`
7. Copy Client ID and Secret to .env

### Step 5: Test Installation

1. Open install link from GHL marketplace
2. Install to a test sub-account
3. Check backend logs for successful OAuth
4. Open NotifyPro from GHL menu
5. Configure notification settings
6. Send yourself a test message

---

## Production Deployment

### Step 1: Build Frontend

```bash
cd frontend
npm run build
cp -r dist/* ../backend/public/
```

### Step 2: Deploy Backend

```bash
cd backend

# Using PM2
pm2 start src/server.js --name notifypro-api
pm2 start src/workers/notificationWorker.js --name notifypro-worker

# Or with systemd/supervisor on your server
npm start
```

### Step 3: Update GHL Marketplace

1. Change redirect URL to production: `https://api.notifypro.yourdomain.com/oauth/callback`
2. Change webhook URL to production: `https://api.notifypro.yourdomain.com/api/webhooks`
3. Update .env with production URLs

---

## Environment Variables Reference

```env
# App Config
NODE_ENV=production
PORT=3000
BASE_URL=https://api.notifypro.yourdomain.com

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/notifypro

# Redis
REDIS_URL=redis://localhost:6379

# GHL OAuth
GHL_CLIENT_ID=your_client_id
GHL_CLIENT_SECRET=your_client_secret
GHL_REDIRECT_URI=https://api.notifypro.yourdomain.com/oauth/callback
GHL_OAUTH_URL=https://marketplace.gohighlevel.com/oauth

# Web Push (generate with: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=BMxxxxxxx...
VAPID_PRIVATE_KEY=xxxxxxx...
VAPID_SUBJECT=mailto:you@yourdomain.com

# AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxx
SES_FROM_EMAIL=notifications@yourdomain.com
SES_FROM_NAME=NotifyPro

# Frontend
FRONTEND_URL=https://app.notifypro.yourdomain.com
```

---

## Testing

### Test Webhook Locally (with ngrok/cloudflare tunnel)

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Create tunnel
npx cloudflared tunnel --url http://localhost:3000

# Use the cloudflare URL as your webhook URL in GHL marketplace
```

### Send Test Notification

```bash
curl -X POST http://localhost:3000/api/subscriptions/test \
  -H "Content-Type: application/json" \
  -d '{"locationId":"your_location_id","channel":"push"}'
```

---

## Troubleshooting

### Push notifications not working:
- Check if service worker is registered: Open DevTools > Application > Service Workers
- Check browser permissions: DevTools > Application > Permissions
- Verify VAPID keys are correct in .env

### Email notifications not working:
- Verify AWS SES credentials
- Check if sender email is verified in AWS SES
- Check AWS SES sending limits (sandbox mode = verified emails only)

### Slack notifications not working:
- Verify webhook URL is correct
- Test webhook with: `curl -X POST <webhook_url> -d '{"text":"test"}'`

---

## Support

For issues, check the logs:
```bash
# Backend logs
tail -f backend/logs/app.log

# Worker logs
pm2 logs notifypro-worker
```

