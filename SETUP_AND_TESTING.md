# NotifyPro - Step-by-Step Setup & Testing Guide

## 📋 Prerequisites Checklist

Before starting, ensure you have:
- [ ] Node.js 18+ installed
- [ ] MongoDB running (local or Atlas)
- [ ] RabbitMQ installed and running
- [ ] AWS account (for email notifications - optional)
- [ ] GHL Marketplace app created
- [ ] Git repository cloned

---

## 🚀 Step 1: Install Dependencies

### 1.1 Backend Dependencies

```bash
cd notificationPro/backend
npm install
```

**Expected output:**
```
added 150+ packages
```

### 1.2 Frontend Dependencies

```bash
cd ../frontend
npm install
```

**Expected output:**
```
added 100+ packages
```

**✅ Checkpoint:** Both `node_modules` folders should exist.

---

## 🔑 Step 2: Generate VAPID Keys

### 2.1 Generate Keys

```bash
cd notificationPro/backend
npx web-push generate-vapid-keys
```

**Expected output:**
```
=======================================

Public Key:
BMsGqdiMt518X6Eev8ITxJkWJ3l_9ZS8jcktZSfg8nW5NbwgqI79d_McHQasUXYtfzCz07yBtXm4_LtZ9kXh4MI

Private Key:
sKEcjL6EwgufxZYnXOe4PSu2s3zoZ8DPzGfhY06bb_o

=======================================
```

**⚠️ Important:** Copy both keys - you'll need them in Step 3.

---

## ⚙️ Step 3: Configure Environment Variables

### 3.1 Create .env File

```bash
cd notificationPro/backend
# Create .env file (copy from ENV_TEMPLATE.txt if exists)
```

### 3.2 Add Configuration

Create/edit `backend/.env` with:

```env
# App Configuration
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# MongoDB
MONGODB_URI=mongodb://localhost:27017/notifypro
# OR MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notifypro

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
# OR with credentials:
# RABBITMQ_URL=amqp://username:password@localhost:5672

# GHL OAuth (Get from https://marketplace.gohighlevel.com)
GHL_CLIENT_ID=your_client_id_here
GHL_CLIENT_SECRET=your_client_secret_here
GHL_REDIRECT_URI=http://localhost:3000/oauth/callback
GHL_OAUTH_URL=https://services.leadconnectorhq.com/oauth

# VAPID Keys (from Step 2)
VAPID_PUBLIC_KEY=paste_public_key_here
VAPID_PRIVATE_KEY=paste_private_key_here
VAPID_SUBJECT=mailto:your-email@domain.com

# AWS SES (Optional - for email notifications)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
SES_FROM_EMAIL=notifications@yourdomain.com
SES_FROM_NAME=NotifyPro

# Logging
LOG_LEVEL=info
```

**✅ Checkpoint:** `.env` file exists with all required variables.

---

## 🐰 Step 4: Install and Start RabbitMQ

### 4.1 Install RabbitMQ

**Windows (Chocolatey):**
```bash
choco install rabbitmq
```

**Windows (Manual):**
1. Download from: https://www.rabbitmq.com/download.html
2. Install Erlang first (required)
3. Install RabbitMQ

**Mac (Homebrew):**
```bash
brew install rabbitmq
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install rabbitmq-server
```

**Docker (All platforms):**
```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

### 4.2 Start RabbitMQ

**Windows:**
```bash
rabbitmq-service start
```

**Mac/Linux:**
```bash
rabbitmq-server
# OR as service:
sudo systemctl start rabbitmq-server
```

**Docker:**
```bash
docker start rabbitmq
```

### 4.3 Verify RabbitMQ is Running

```bash
# Check status
rabbitmqctl status

# OR check management UI
# Open browser: http://localhost:15672
# Default credentials: guest / guest
```

**Expected output:**
```
Status of node rabbit@hostname ...
```

**✅ Checkpoint:** RabbitMQ is running and accessible at `http://localhost:15672`

---

## 🗄️ Step 5: Setup MongoDB

### 5.1 Local MongoDB

**Start MongoDB:**
```bash
# Windows
mongod

# Mac/Linux
sudo systemctl start mongod
# OR
mongod
```

**Verify:**
```bash
mongosh
# Should connect successfully
```

### 5.2 MongoDB Atlas (Cloud)

1. Go to: https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

**✅ Checkpoint:** MongoDB is accessible (local or Atlas).

---

## 🏃 Step 6: Start the Application

### 6.1 Terminal 1: Backend Server

```bash
cd notificationPro/backend
npm run dev
```

**Expected output:**
```
==================================================
🔔 NotifyPro Started
==================================================
📡 Port: 3000
🌍 Environment: development
🔗 URL: http://localhost:3000
==================================================
```

**✅ Checkpoint:** Backend server running on port 3000.

### 6.2 Terminal 2: Worker Process

```bash
cd notificationPro/backend
npm run worker
```

**Expected output:**
```
Connecting to RabbitMQ: amqp://localhost:5672
✅ RabbitMQ connected - Queue features enabled
🔄 Notification worker started
   Queue: notifications
   Prefetch: 5 jobs
   Dead Letter Queue: notifications-failed
```

**✅ Checkpoint:** Worker is running and connected to RabbitMQ.

### 6.3 Terminal 3: Frontend (Optional for Development)

```bash
cd notificationPro/frontend
npm run dev
```

**Expected output:**
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**✅ Checkpoint:** Frontend running on port 5173 (optional).

---

## 🧪 Step 7: Test Each Component

### 7.1 Test Backend Health

```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "app": "NotifyPro",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**✅ Checkpoint:** Backend is healthy.

### 7.2 Test RabbitMQ Connection

**Via Management UI:**
1. Open: http://localhost:15672
2. Login: guest / guest
3. Go to "Queues" tab
4. Should see `notifications` queue

**Via Command:**
```bash
rabbitmqctl list_queues
```

**Expected output:**
```
notifications    0
```

**✅ Checkpoint:** RabbitMQ queue exists.

### 7.3 Test MongoDB Connection

```bash
# Check if backend connected to MongoDB
# Look in backend logs for:
# "MongoDB connected successfully"
```

**✅ Checkpoint:** MongoDB connection successful.

---

## 🔐 Step 8: Configure GHL Marketplace

### 8.1 Create Marketplace App

1. Go to: https://marketplace.gohighlevel.com
2. Click "Create App"
3. Name: "NotifyPro"
4. Description: "Real-time notifications for conversations"

### 8.2 Configure OAuth

1. **Scopes:** Add these scopes:
   - `conversations.readonly`
   - `conversations/message.readonly`
   - `contacts.readonly`

2. **Redirect URL:**
   ```
   http://localhost:3000/oauth/callback
   ```
   (For production, use your domain)

3. **Copy Credentials:**
   - Client ID
   - Client Secret
   - Add to `.env` file

### 8.3 Configure Webhooks

1. **Webhook URL:**
   ```
   http://localhost:3000/api/webhooks/inbound-message
   ```
   (For local testing, use ngrok: `ngrok http 3000`)

2. **Subscribe to:**
   - `InboundMessage`

**✅ Checkpoint:** GHL app configured with OAuth and webhooks.

---

## 🧪 Step 9: Test OAuth Installation

### 9.1 Get Install Link

1. Go to GHL Marketplace
2. Open your NotifyPro app
3. Copy "Install Link"

### 9.2 Install to Test Account

1. Open install link in browser
2. Select a test sub-account
3. Authorize the app
4. Should redirect to success page

**Expected:** "Installation Successful" page

**✅ Checkpoint:** OAuth installation works.

### 9.3 Verify in MongoDB

```bash
mongosh
use notifypro
db.oauthtokens.find()
```

**Expected:** Should see token document with locationId

**✅ Checkpoint:** OAuth tokens stored in MongoDB.

---

## 🧪 Step 10: Test Settings UI

### 10.1 Open Settings in GHL

1. Go to GHL sub-account
2. Find "NotifyPro" in left menu
3. Click to open settings

**Expected:** Settings UI loads in iframe

**✅ Checkpoint:** Settings UI accessible.

### 10.2 Test Push Notification Setup

1. Toggle "Browser Push Notifications" ON
2. Browser should ask for permission
3. Click "Allow"
4. Should see "Push notifications enabled!"

**✅ Checkpoint:** Push subscription created.

### 10.3 Verify Push Subscription

```bash
mongosh
use notifypro
db.pushsubscriptions.find()
```

**Expected:** Should see subscription document

**✅ Checkpoint:** Push subscription stored.

---

## 🧪 Step 11: Test Notifications

### 11.1 Send Test Push Notification

1. In settings UI, click "Send Test Notification"
2. Should see browser notification

**Expected:** Browser shows notification

**✅ Checkpoint:** Push notifications work.

### 11.2 Test Email Notification (if configured)

1. Enable email notifications
2. Enter email address
3. Click "Send Test Email"
4. Check email inbox

**Expected:** Email received

**✅ Checkpoint:** Email notifications work.

### 11.3 Test Slack Notification (if configured)

1. Enable Slack notifications
2. Enter Slack webhook URL
3. Click "Send Test to Slack"
4. Check Slack channel

**Expected:** Message in Slack

**✅ Checkpoint:** Slack notifications work.

---

## 🧪 Step 12: Test Real Webhook

### 12.1 Setup ngrok (for local testing)

```bash
# Install ngrok (if not installed)
# Then run:
ngrok http 3000
```

**Copy the ngrok URL:**
```
https://abc123.ngrok.io
```

### 12.2 Update GHL Webhook URL

1. Go to GHL Marketplace
2. Update webhook URL to:
   ```
   https://abc123.ngrok.io/api/webhooks/inbound-message
   ```

### 12.3 Send Test Message

1. In GHL, send a message to a contact
2. Check backend logs for webhook received
3. Check worker logs for job processed
4. Check for notification (push/email/slack)

**Expected flow:**
```
Webhook received → Job queued → Worker processes → Notification sent
```

**✅ Checkpoint:** End-to-end flow works.

---

## 🐛 Step 13: Troubleshooting

### 13.1 Backend Won't Start

**Check:**
- [ ] MongoDB is running
- [ ] Port 3000 is not in use
- [ ] `.env` file exists and has all variables
- [ ] Dependencies installed (`npm install`)

**Common errors:**
```
Error: Cannot connect to MongoDB
→ Check MONGODB_URI in .env

Error: Port 3000 already in use
→ Change PORT in .env or kill process on port 3000
```

### 13.2 Worker Won't Start

**Check:**
- [ ] RabbitMQ is running
- [ ] RABBITMQ_URL is correct in .env
- [ ] Port 5672 is accessible

**Common errors:**
```
Error: connect ECONNREFUSED 127.0.0.1:5672
→ Start RabbitMQ: rabbitmq-server

Error: Channel closed
→ Check RabbitMQ logs
```

### 13.3 Push Notifications Not Working

**Check:**
- [ ] VAPID keys are set in .env
- [ ] Browser permission granted
- [ ] Service worker registered
- [ ] Push subscription exists in MongoDB

**Debug:**
```bash
# Check browser console for errors
# Check service worker: DevTools > Application > Service Workers
# Check push subscriptions in MongoDB
```

### 13.4 Webhooks Not Received

**Check:**
- [ ] ngrok is running (for local)
- [ ] Webhook URL is correct in GHL
- [ ] Webhook is subscribed to `InboundMessage`
- [ ] Backend is accessible from internet

**Debug:**
```bash
# Check backend logs for incoming requests
# Test webhook manually:
curl -X POST http://localhost:3000/api/webhooks/inbound-message \
  -H "Content-Type: application/json" \
  -d '{"locationId":"test","contactId":"test","message":"test"}'
```

### 13.5 Jobs Not Processing

**Check:**
- [ ] Worker is running
- [ ] RabbitMQ is running
- [ ] Queue exists: `rabbitmqctl list_queues`
- [ ] Jobs are being added: Check RabbitMQ management UI

**Debug:**
```bash
# Check worker logs
# Check RabbitMQ management UI: http://localhost:15672
# Check queue messages
```

---

## ✅ Step 14: Verification Checklist

Before considering setup complete, verify:

- [ ] Backend server starts without errors
- [ ] Worker starts and connects to RabbitMQ
- [ ] MongoDB connection successful
- [ ] OAuth installation works
- [ ] Settings UI loads in GHL
- [ ] Push notification subscription created
- [ ] Test push notification received
- [ ] Webhook received when message sent
- [ ] Notification sent after webhook
- [ ] All logs show success messages

---

## 📊 Step 15: Monitor and Verify

### 15.1 Check Logs

**Backend logs:**
- Webhook received
- Job queued
- API requests

**Worker logs:**
- Job processed
- Notification sent
- Errors (if any)

### 15.2 Check RabbitMQ Management UI

1. Open: http://localhost:15672
2. Go to "Queues" tab
3. Check:
   - Messages ready: Should be 0 (processed)
   - Messages unacknowledged: Should be 0
   - Message rate: Should show activity

### 15.3 Check MongoDB Collections

```bash
mongosh
use notifypro

# Check collections
show collections

# Check data
db.oauthtokens.countDocuments()
db.notificationpreferences.countDocuments()
db.pushsubscriptions.countDocuments()
db.notificationlogs.countDocuments()
```

---

## 🎉 Success!

If all checkpoints pass, your NotifyPro setup is complete!

**Next steps:**
- Deploy to production
- Configure production URLs
- Submit to GHL marketplace for approval

---

## 📝 Quick Reference Commands

```bash
# Start all services
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd backend && npm run worker

# Terminal 3 (optional):
cd frontend && npm run dev

# Check RabbitMQ
rabbitmqctl status
rabbitmqctl list_queues

# Check MongoDB
mongosh
use notifypro
show collections

# Test endpoints
curl http://localhost:3000/health
curl http://localhost:3000/

# View logs
# Backend and worker logs appear in terminal
```

---

## 🆘 Need Help?

**Common Issues:**
- See Step 13: Troubleshooting
- Check logs in terminal
- Verify all services are running
- Check environment variables

**Resources:**
- RabbitMQ Docs: https://www.rabbitmq.com/documentation.html
- MongoDB Docs: https://docs.mongodb.com/
- GHL API Docs: https://highlevel.stoplight.io/

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0

