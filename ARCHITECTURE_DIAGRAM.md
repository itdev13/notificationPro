# NotifyPro - Complete Architecture Diagram

## 🎯 Why RabbitMQ? (The Queue System)

**RabbitMQ is used as a job queue** to handle notifications **asynchronously**. Here's why:

### Without Queue (Synchronous - BAD):
```
GHL Webhook → Backend → Process Notification → Send Push/Email/Slack → Response
     ↓                                                                    ↓
   Wait...                                                          (5-10 seconds)
                                                                     GHL times out!
```

**Problems:**
- GHL webhooks timeout after 5-10 seconds
- If sending email/push takes time, GHL thinks webhook failed
- GHL will retry webhook → duplicate notifications
- Server blocks while processing → can't handle other requests

### With RabbitMQ (Asynchronous - GOOD):
```
GHL Webhook → Backend → Add Job to Queue → Response (200 OK in <1 second)
     ↓                                                      ↓
   Done! ✅                                            GHL happy!
                                                         
     ↓
RabbitMQ Queue (stores job)
     ↓
Worker Process (separate) → Process → Send Notifications
```

**Benefits:**
- ✅ Respond to GHL immediately (<1 second)
- ✅ Process notifications in background
- ✅ Automatic retries if notification fails (3 attempts with exponential backoff)
- ✅ Can handle 100s of notifications simultaneously
- ✅ No duplicate notifications
- ✅ Web management UI (port 15672)
- ✅ Dead letter queue support
- ✅ Better control and monitoring

---

## 📊 Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GoHighLevel Platform                            │
│                                                                         │
│  Contact sends message → GHL fires webhook                            │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ HTTP POST /api/webhooks/inbound-message
                             │ (with message data)
                             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    NotifyPro Backend Server                             │
│                    (Express.js - Port 3000)                             │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 1. Webhook Handler (webhooks.js)                                │  │
│  │    ├─ Receives webhook from GHL                                 │  │
│  │    ├─ Extracts: locationId, contactId, message, etc.            │  │
│  │    ├─ Creates job object                                        │  │
│  │    └─ Adds job to RabbitMQ queue                                 │  │
│  │    └─ Returns 200 OK immediately (<1 second)                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                             │                                           │
│                             ↓                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 2. RabbitMQ Queue                                                │  │
│  │    ├─ Stores notification jobs (durable queue)                  │  │
│  │    ├─ Handles job priorities (0-10)                             │  │
│  │    ├─ Automatic retries (3 attempts with exponential backoff)   │  │
│  │    ├─ Prefetch limit (5 concurrent jobs)                        │  │
│  │    ├─ Message persistence (survives broker restarts)             │  │
│  │    └─ Management UI available (port 15672)                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                             │                                           │
│                             ↓                                           │
│  ┌──────────────────────────────────────────────────────────────────┐
│  │ 3. Worker Process (notificationWorker.js)                        │  │
│  │    Runs separately: node src/workers/notificationWorker.js        │  │
│  │                                                                   │  │
│  │    For each job:                                                 │  │
│  │    ├─ Load user preferences from MongoDB                         │  │
│  │    ├─ Apply filters (business hours, keywords)                  │  │
│  │    ├─ If should notify:                                          │  │
│  │    │   ├─ Send Browser Push (if enabled)                         │  │
│  │    │   │   └─ Includes position preference (top-right, etc.)    │  │
│  │    │   ├─ Send Email (if enabled)                               │  │
│  │    │   └─ Send Slack (if enabled)                               │  │
│  │    └─ Log result to MongoDB                                      │  │
│  │    └─ Acknowledge message (remove from queue)                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 4. Other Routes                                                  │  │
│  │    ├─ /oauth/* - OAuth installation                             │  │
│  │    ├─ /api/settings - User preferences                           │  │
│  │    └─ /api/subscriptions - Push subscription management          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         MongoDB Database                                 │
│                                                                         │
│  Collections:                                                          │
│  ├─ oauthtokens - GHL OAuth tokens                                    │
│  ├─ notificationpreferences - User settings                           │
│  ├─ pushsubscriptions - Browser push subscriptions                    │
│  └─ notificationlogs - Notification history (90-day TTL)              │
└─────────────────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    Notification Services                                │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │ Push Service     │  │ Email Service    │  │ Slack Service    │     │
│  │ (web-push)       │  │ (AWS SES)        │  │ (Webhooks)       │     │
│  │                  │  │                  │  │                  │     │
│  │ Sends browser    │  │ Sends email      │  │ Sends to Slack   │     │
│  │ push             │  │ via AWS SES      │  │ channel          │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         End Users Receive                                │
│                                                                         │
│  🔔 Browser Push Notification                                          │
│  📧 Email Notification                                                  │
│  💬 Slack Message                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Data Flow

### Flow 1: User Installation (OAuth)
```
User clicks "Install" in GHL Marketplace
    ↓
GHL redirects to: /oauth/authorize
    ↓
Backend redirects to GHL OAuth page
    ↓
User authorizes → GHL redirects to: /oauth/callback?code=xxx
    ↓
Backend exchanges code for access_token
    ↓
Store tokens in MongoDB (OAuthToken collection)
    ↓
Show "Installation Successful" page
```

### Flow 2: User Configuration (Settings)
```
User opens NotifyPro in GHL (iframe)
    ↓
GHL sends encrypted context to frontend
    ↓
Frontend decrypts context (useGHLContext.js)
    ↓
Frontend calls: GET /api/settings?locationId=xxx
    ↓
Backend loads preferences from MongoDB
    ↓
User changes settings in UI
    ↓
Frontend calls: POST /api/settings
    ↓
Backend saves to MongoDB (NotificationPreferences)
```

### Flow 3: Real-time Notification (The Main Flow)
```
Contact sends message in GHL
    ↓
GHL fires webhook: POST /api/webhooks/inbound-message
    ↓
Backend webhook handler:
    ├─ Extracts message data
    ├─ Creates job: { locationId, contactId, message, etc. }
    ├─ Adds job to RabbitMQ queue
    └─ Returns 200 OK (<1 second) ✅
    ↓
RabbitMQ stores job in queue (durable)
    ↓
Worker process (separate) picks up job
    ↓
Worker:
    ├─ Loads preferences from MongoDB
    ├─ Checks business hours (if enabled)
    ├─ Checks priority keywords
    ├─ Decides: Should notify?
    │
    ├─ If YES:
    │   ├─ Send Browser Push (if enabled)
    │   │   └─ Includes position preference from user settings
    │   ├─ Send Email (if enabled)
    │   └─ Send Slack (if enabled)
    │
    └─ Log result to MongoDB (NotificationLog)
    ↓
User receives notifications! 🎉
```

---

## 🗄️ Data Storage

### MongoDB Collections:

**1. oauthtokens**
- Stores GHL OAuth access tokens
- Used to make API calls to GHL
- Auto-refreshes before expiry

**2. notificationpreferences**
- User settings per location
- Channels: push, email, slack configs
  - Push: enabled, sound, **position** (top-right, top-left, bottom-right, bottom-left)
- Filters: business hours, keywords

**3. pushsubscriptions**
- Browser push notification subscriptions
- One per browser/device
- Used to send push notifications

**4. notificationlogs**
- History of all notifications sent
- Tracks success/failure
- Auto-deletes after 90 days (TTL)

### RabbitMQ (Queue):
- Stores pending notification jobs
- Durable queue (survives broker restarts)
- Jobs deleted after acknowledgment
- Enables async processing
- Management UI: http://localhost:15672

---

## ⚙️ Why This Architecture?

### Problem Solved:
**GHL webhooks must respond in <5 seconds, but sending notifications can take 10+ seconds**

### Solution:
1. **Queue System (RabbitMQ)**: Store jobs, respond immediately
2. **Worker Process**: Process jobs in background
3. **Async Processing**: Don't block webhook response
4. **Retry Logic**: Automatic retries with exponential backoff

### Benefits:
- ✅ Fast webhook responses (GHL happy)
- ✅ Reliable delivery (retries on failure)
- ✅ Scalable (handle 100s of notifications)
- ✅ No duplicate notifications
- ✅ Can process notifications even if server restarts

---

## 🚀 Running the System

### Development (3 terminals needed):

**Terminal 1: Backend Server**
```bash
cd backend
npm run dev
# Handles: OAuth, webhooks, settings API
```

**Terminal 2: Worker Process**
```bash
cd backend
npm run worker
# Processes notification jobs from queue
```

**Terminal 3: Frontend (optional for dev)**
```bash
cd frontend
npm run dev
# Settings UI (usually embedded in GHL)
```

### Production:
```bash
# Build frontend
cd frontend && npm run build
cp -r dist/* ../backend/public/

# Start with PM2
cd backend
pm2 start src/server.js --name notifypro-api
pm2 start src/workers/notificationWorker.js --name notifypro-worker
```

---

## ❓ Can We Skip RabbitMQ?

### Without RabbitMQ:
- ✅ Server can start
- ✅ OAuth works
- ✅ Settings API works
- ❌ **Notifications won't process** (webhook adds job, but no worker to process)

### With RabbitMQ:
- ✅ Everything works
- ✅ Notifications process in background
- ✅ Reliable delivery with retries
- ✅ Web UI for monitoring (http://localhost:15672)
- ✅ Dead letter queue support

**Recommendation:** Use RabbitMQ for production. For development/testing, you can skip it if you only need OAuth/settings.

---

## 📦 What Each Component Does

| Component | Purpose | Required? |
|-----------|---------|-----------|
| **Backend Server** | Handles HTTP requests, OAuth, webhooks | ✅ Yes |
| **RabbitMQ** | Job queue for async processing | ⚠️ For notifications |
| **Worker** | Processes notification jobs | ⚠️ For notifications |
| **MongoDB** | Stores data (tokens, preferences, logs) | ✅ Yes |
| **Frontend** | Settings UI (embedded in GHL iframe) | ✅ Yes |
| **Service Worker** | Browser push notifications (runs independently) | ⚠️ For push notifications |

---

## 🎯 Summary

**RabbitMQ = Job Queue** for async notification processing

**Why?** Because GHL webhooks timeout, but notifications take time to send.

**How?** Webhook adds job to queue → responds immediately → Worker processes job in background.

**Result?** Fast responses + reliable notifications! 🎉

---

## 🔔 Push Notification Architecture

### Important: Push Notifications are NOT Iframe-Based!

**How Push Notifications Work:**

```
┌─────────────────────────────────────────────────────────────┐
│  User enables push in settings (iframe - one-time setup)   │
│  ↓                                                          │
│  Browser registers Service Worker                          │
│  ↓                                                          │
│  Service Worker runs in background (INDEPENDENT)           │
│  ↓                                                          │
│  Backend sends push via Web Push API                       │
│  ↓                                                          │
│  Browser shows notification (OS-level)                     │
└─────────────────────────────────────────────────────────────┘
```

**Key Points:**
- ✅ **Service Worker** runs independently from iframe
- ✅ Works even when **GHL tab is closed**
- ✅ Works even when **browser is minimized**
- ✅ Works even when **computer is locked**
- ✅ **OS-level notifications** (not browser tabs)
- ✅ **Position preference** stored (for future custom UI)

**The iframe is ONLY for:**
- Settings UI (configuration panel)
- One-time setup (requesting push permission)

**After setup:**
- Service worker runs in browser background
- Notifications work from anywhere
- No dependency on GHL tab being open

---

## 🎨 Notification Position Configuration

**Current Implementation:**
- Users can select position: Top Right, Top Left, Bottom Right, Bottom Left
- Preference stored in `notificationpreferences.channels.push.position`
- Position included in push notification payload

**Note:** Browser notification position is controlled by OS/browser settings. Our preference is stored for:
- Future custom notification UI
- User preference tracking
- Potential browser API support

**Future Enhancement:**
- Build custom notification UI (not using browser API)
- Use stored position preference
- Full control over appearance and position

