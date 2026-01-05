# NotifyPro - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Prerequisites
- ✅ Node.js 18+ installed
- ✅ MongoDB running (local or Atlas)
- ✅ Redis running (local or cloud)
- ✅ AWS account (for SES email notifications)

### Step 1: Install Dependencies (2 minutes)

```bash
cd notificationPro

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2: Generate VAPID Keys (30 seconds)

```bash
cd backend
npx web-push generate-vapid-keys
```

Copy the output - you'll need it for .env

### Step 3: Configure Environment (1 minute)

```bash
cd backend

# Copy template
cp ../ENV_TEMPLATE.txt .env

# Edit .env and add:
# - Your MongoDB URI
# - Your Redis URL
# - GHL Client ID & Secret (from marketplace)
# - VAPID keys (from step 2)
# - AWS SES credentials
```

### Step 4: Start Everything (1 minute)

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Worker
cd backend
npm run worker
```

### Step 5: Configure GHL Webhook (1 minute)

1. Go to https://marketplace.gohighlevel.com
2. Open your NotifyPro app
3. Go to Webhooks section
4. Set webhook URL: `http://localhost:3000/api/webhooks`
5. Enable `InboundMessage` webhook

### Step 6: Test It! 🎉

1. Install app to a test sub-account
2. Open NotifyPro from GHL menu
3. Enable browser notifications
4. Click "Send Test Notification"
5. You should see a browser notification!

---

## 📝 What Each Component Does

```
Backend (Port 3000):
├─ Handles OAuth installation
├─ Receives webhooks from GHL
├─ Queues notification jobs
├─ Serves settings API
└─ Serves built frontend

Worker:
├─ Processes notification queue
├─ Sends push/email/slack notifications
├─ Logs results
└─ Retries failed jobs

Frontend (Port 5173 in dev):
├─ Settings UI (embedded in GHL iframe)
├─ Channel toggles
├─ Business hours config
└─ Keyword management
```

---

## 🐛 Common Issues

**"Cannot connect to MongoDB"**
- Make sure MongoDB is running: `mongod` or check Atlas connection string
- Check MONGODB_URI in .env

**"Cannot connect to Redis"**
- Make sure Redis is running: `redis-server`
- Check REDIS_URL in .env

**"Push notifications not working"**
- Make sure service-worker.js is in frontend/public/
- Check browser console for errors
- Verify VAPID keys are correct

**"Webhooks not received"**
- Use ngrok/cloudflare tunnel for local testing
- Check GHL marketplace webhook configuration
- Check backend logs for incoming requests

---

## 📦 Production Build

```bash
# Build frontend
cd frontend
npm run build

# Copy to backend
cp -r dist/* ../backend/public/

# Deploy backend
cd ../backend
npm start
```

---

## Next Steps

1. ✅ Test all notification channels
2. ✅ Configure business hours
3. ✅ Add priority keywords
4. ✅ Test with real GHL messages
5. ✅ Deploy to production
6. ✅ Submit to GHL marketplace for approval

**You're ready to go! 🚀**

