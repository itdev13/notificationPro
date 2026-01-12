# RabbitMQ Migration & Push Notification Updates

## ✅ Changes Made

### 1. Migrated from Redis/BullMQ to RabbitMQ

**Why RabbitMQ?**
- Better control and visibility
- More reliable message delivery
- Better for production environments
- Advanced features (dead letter queues, exchanges, etc.)

**Files Changed:**
- `backend/package.json` - Replaced `bullmq` and `ioredis` with `amqplib`
- `backend/src/queues/notificationQueue.js` - Complete rewrite for RabbitMQ
- `backend/src/workers/notificationWorker.js` - Updated to consume from RabbitMQ
- `backend/src/routes/webhooks.js` - Already compatible (uses `addJob` function)

### 2. Added Notification Position Configuration

**New Feature:**
- Users can now configure where browser push notifications appear
- Options: Top Right, Top Left, Bottom Right, Bottom Left
- Stored in user preferences

**Files Changed:**
- `backend/src/models/NotificationPreference.js` - Added `position` field
- `backend/src/services/pushService.js` - Includes position in payload
- `frontend/public/service-worker.js` - Stores position in notification data
- `frontend/src/App.jsx` - Added position selector UI

### 3. Push Notification Clarification

**Important:** Push notifications are **NOT iframe-based**!

**How They Work:**
1. **Service Worker** - Runs in browser background (separate from iframe)
2. **Browser-level** - Works even when tab is closed
3. **OS-level** - Shows system notifications
4. **Independent** - Doesn't depend on GHL tab being open

**The iframe is ONLY for:**
- Settings UI (configuration panel)
- One-time setup (requesting push permission)

**After setup:**
- Service worker runs independently
- Notifications work from any tab/browser
- Works even when browser is minimized

---

## 🚀 Setup Instructions

### Install RabbitMQ

**Windows:**
```bash
# Using Chocolatey
choco install rabbitmq

# Or download from: https://www.rabbitmq.com/download.html
```

**Linux/Mac:**
```bash
# Using Homebrew (Mac)
brew install rabbitmq

# Or using apt (Linux)
sudo apt-get install rabbitmq-server
```

**Start RabbitMQ:**
```bash
# Windows (as service)
rabbitmq-service start

# Linux/Mac
rabbitmq-server
```

**Or use Docker:**
```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
# Management UI: http://localhost:15672 (guest/guest)
```

### Environment Variables

Update `backend/.env`:
```env
# Replace REDIS_URL with RABBITMQ_URL
RABBITMQ_URL=amqp://localhost:5672
# Or with credentials:
# RABBITMQ_URL=amqp://username:password@localhost:5672
```

### Run the System

**Terminal 1: Backend**
```bash
cd backend
npm install  # Install amqplib
npm run dev
```

**Terminal 2: Worker**
```bash
cd backend
npm run worker
```

**Terminal 3: Frontend (optional)**
```bash
cd frontend
npm run dev
```

---

## 📊 RabbitMQ vs Redis/BullMQ

| Feature | Redis/BullMQ | RabbitMQ |
|---------|--------------|----------|
| **Setup** | Simple | More complex |
| **Control** | Basic | Advanced |
| **Management UI** | No | Yes (15672) |
| **Dead Letter Queue** | Manual | Built-in |
| **Exchanges/Routing** | No | Yes |
| **Message Persistence** | Yes | Yes |
| **Priority** | Yes | Yes |

**RabbitMQ Benefits:**
- ✅ Web UI for monitoring
- ✅ Better error handling
- ✅ More control over message routing
- ✅ Dead letter queues built-in
- ✅ Better for production

---

## 🔔 Push Notification Position

**Note:** Browser notification position is **controlled by the OS/browser**, not JavaScript.

**What we do:**
- Store user preference in database
- Include position in notification payload
- Ready for future custom notification UI

**Current behavior:**
- Position preference is stored
- Actual position depends on browser/OS settings
- Can be used for custom notification UI in future

**Future enhancement:**
- Build custom notification UI (not using browser API)
- Use stored position preference
- Full control over appearance and position

---

## 🧪 Testing

### Test RabbitMQ Connection
```bash
# Check if RabbitMQ is running
rabbitmqctl status

# Or check management UI
# http://localhost:15672 (guest/guest)
```

### Test Worker
```bash
# Start worker
cd backend
npm run worker

# You should see:
# ✅ RabbitMQ connected
# 🔄 Notification worker started
```

### Test Push Notifications
1. Open NotifyPro settings in GHL
2. Enable browser push notifications
3. Select notification position
4. Click "Send Test Notification"
5. Check browser notifications

---

## 📝 Migration Checklist

- [x] Replace BullMQ/Redis with RabbitMQ
- [x] Update queue setup
- [x] Update worker to consume from RabbitMQ
- [x] Add notification position config
- [x] Update frontend UI
- [x] Update service worker
- [ ] Install RabbitMQ on server
- [ ] Update environment variables
- [ ] Test end-to-end flow
- [ ] Update documentation

---

## 🐛 Troubleshooting

**"RabbitMQ connection failed"**
- Check if RabbitMQ is running: `rabbitmqctl status`
- Verify RABBITMQ_URL in .env
- Check firewall/port 5672

**"Worker not processing jobs"**
- Check worker logs
- Verify queue exists in RabbitMQ
- Check management UI: http://localhost:15672

**"Push notifications not working"**
- Check browser permissions
- Verify service worker is registered
- Check browser console for errors
- Test with "Send Test Notification"

---

## 📚 Additional Resources

- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

