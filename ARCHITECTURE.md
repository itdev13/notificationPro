# NotifyPro - Architecture Documentation

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  GoHighLevel Platform                       │
│  User sends message → GHL fires InboundMessage webhook      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ POST /api/webhooks/inbound-message
                   ↓
┌───────────────────────────────────────────────────────────────┐
│              NotifyPro Backend (Express.js)                   │
│              Domain: api.notifypro.yourdomain.com             │
│                                                               │
│  1. Webhook Handler                                           │
│     ├─ Validates webhook                                      │
│     ├─ Extracts message data                                  │
│     └─ Adds job to queue                                      │
│                                                               │
│  2. BullMQ Queue (Redis)                                      │
│     ├─ Stores notification jobs                               │
│     ├─ Handles retries                                        │
│     └─ Rate limiting                                          │
│                                                               │
│  3. Worker Process                                            │
│     ├─ Loads user preferences                                 │
│     ├─ Applies filters                                        │
│     └─ Sends notifications                                    │
│                                                               │
│  4. Notification Services                                     │
│     ├─ Push Service (web-push)                                │
│     ├─ Email Service (AWS SES)                                │
│     └─ Slack Service (webhooks)                               │
│                                                               │
│  5. MongoDB Database                                          │
│     ├─ OAuthTokens                                            │
│     ├─ NotificationPreferences                                │
│     ├─ PushSubscriptions                                      │
│     └─ NotificationLogs                                       │
└───────────────────────────────────────────────────────────────┘
                   │
                   ↓
         ┌─────────────────────┐
         │  User Receives:     │
         │  🔔 Browser Push    │
         │  📧 Email           │
         │  💬 Slack Message   │
         └─────────────────────┘
```

## 📊 Data Flow

### Flow 1: Installation (OAuth)
```
User clicks Install
    ↓
GHL redirects to /oauth/callback?code=xxx
    ↓
Backend exchanges code for tokens
    ↓
Store in MongoDB (OAuthToken collection)
    ↓
Show success page
```

### Flow 2: Configuration (Settings)
```
User opens NotifyPro in GHL
    ↓
GHL loads iframe with encrypted context
    ↓
Frontend decrypts context via backend API
    ↓
Load preferences from MongoDB
    ↓
User changes settings
    ↓
Save to MongoDB (NotificationPreferences collection)
```

### Flow 3: Notification (Real-time)
```
Contact sends message
    ↓
GHL fires InboundMessage webhook
    ↓
Backend receives webhook (200 OK immediately)
    ↓
Add job to BullMQ queue
    ↓
Worker picks up job
    ↓
Load preferences from MongoDB
    ↓
Apply filters (business hours, keywords)
    ↓
If should notify:
    ├─ Send browser push (if enabled)
    ├─ Send email (if enabled)
    └─ Send Slack (if enabled)
    ↓
Log result to MongoDB (NotificationLog collection)
```

---

## 🗄️ Database Schema

### Collections

#### 1. oauthtokens
```javascript
{
  _id: ObjectId,
  locationId: String,
  companyId: String,
  tokenType: "location" | "company",
  accessToken: String,
  refreshToken: String,
  expiresAt: Date,
  isActive: Boolean,
  locationName: String,
  // ... other location metadata
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. notificationpreferences
```javascript
{
  _id: ObjectId,
  locationId: String (indexed),
  userId: String (optional),
  channels: {
    push: { enabled: Boolean, sound: Boolean },
    email: { enabled: Boolean, address: String },
    slack: { enabled: Boolean, webhookUrl: String }
  },
  filters: {
    businessHoursOnly: Boolean,
    businessHours: {
      start: "09:00",
      end: "17:00",
      timezone: "America/New_York",
      days: ["monday", "tuesday", ...]
    },
    priorityKeywords: ["urgent", "asap", ...]
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. pushsubscriptions
```javascript
{
  _id: ObjectId,
  locationId: String (indexed),
  userId: String (optional),
  subscription: {
    endpoint: String (unique),
    keys: {
      p256dh: String,
      auth: String
    }
  },
  isActive: Boolean,
  lastUsedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. notificationlogs
```javascript
{
  _id: ObjectId,
  locationId: String (indexed),
  contactId: String,
  conversationId: String,
  messageId: String,
  channel: "push" | "email" | "slack",
  status: "sent" | "failed" | "clicked",
  error: String,
  isPriority: Boolean,
  wasFiltered: Boolean,
  filterReason: String,
  messagePreview: String,
  createdAt: Date (TTL: 90 days)
}
```

---

## 🔌 API Endpoints

### OAuth
- `GET /oauth/authorize` - Start OAuth flow
- `GET /oauth/callback` - OAuth callback
- `GET /oauth/status` - Check connection status

### Webhooks (from GHL)
- `POST /api/webhooks/inbound-message` - Receive new messages
- `POST /api/webhooks/conversation-unread` - Unread status changes

### Settings
- `GET /api/settings?locationId=xxx` - Get preferences
- `POST /api/settings` - Update preferences
- `DELETE /api/settings?locationId=xxx` - Reset to defaults

### Subscriptions
- `GET /api/subscriptions/vapid-public-key` - Get VAPID public key
- `POST /api/subscriptions/subscribe` - Save push subscription
- `POST /api/subscriptions/unsubscribe` - Remove push subscription
- `POST /api/subscriptions/test` - Send test notification

---

## 🔧 Technology Stack

**Backend:**
- Runtime: Node.js 18+
- Framework: Express.js
- Database: MongoDB (Mongoose ODM)
- Queue: Redis + BullMQ
- Push: web-push (npm package)
- Email: AWS SES
- Logging: Winston

**Frontend:**
- Framework: React 18
- Build Tool: Vite
- UI Library: Ant Design
- Styling: TailwindCSS
- HTTP Client: Axios

**Infrastructure:**
- Hosting: Your servers
- MongoDB: Your MongoDB or Atlas
- Redis: Your Redis or ElastiCache
- Email: AWS SES

---

## 🔐 Security

**OAuth Tokens:**
- Stored encrypted in MongoDB
- Refreshed automatically before expiry
- Separate tokens for location vs company level

**API Security:**
- Rate limiting on all endpoints
- CORS restricted to GHL domains
- Helmet security headers
- iframe embedding only from GHL domains

**Push Subscriptions:**
- VAPID signed (prevents spoofing)
- Endpoint validation
- Auto-cleanup of expired subscriptions

---

## 🚀 Deployment Process

### Development
```bash
1. Start MongoDB (local or Atlas)
2. Start Redis (local or ElastiCache)
3. npm run dev (backend)
4. npm run dev (frontend)
5. npm run worker (worker)
```

### Production
```bash
1. Build frontend: npm run build
2. Copy dist to backend/public
3. Start backend: pm2 start src/server.js
4. Start worker: pm2 start src/workers/notificationWorker.js
5. Configure nginx reverse proxy
```

---

## 📈 Scalability

**Current Design Handles:**
- 1,000+ customers
- 100,000+ notifications/day
- Sub-second notification delivery

**To Scale Beyond:**
- Add more worker instances (horizontal scaling)
- Use Redis Cluster for queue
- Add MongoDB replica set
- Use load balancer for backend

---

## 🧪 Testing

### Manual Testing Checklist:
- ✅ OAuth installation (location + company level)
- ✅ Settings panel loads in GHL iframe
- ✅ Save preferences
- ✅ Enable browser push (request permission)
- ✅ Send test push notification
- ✅ Configure email, send test email
- ✅ Configure Slack, send test Slack message
- ✅ Set business hours, verify filtering
- ✅ Add priority keywords, verify detection
- ✅ Send real message in GHL, verify notification

### Automated Testing (Future):
- Unit tests for services
- Integration tests for webhook flow
- End-to-end tests

---

## 🐛 Known Limitations & Future Improvements

**v1.0 Limitations:**
- No SMS notifications (AWS costs)
- No email digests (coming in v1.1)
- No analytics dashboard (coming in v2.0)
- No team-specific settings (coming in v2.0)

**Roadmap:**
- v1.1: Email digests, analytics
- v1.2: SMS notifications, Discord support
- v2.0: AI priority scoring, team features
- v3.0: WhatsApp/Telegram integration

---

## 📞 Support & Maintenance

**Monitoring:**
- Backend logs via Winston
- Queue monitoring via BullMQ Dashboard
- Error tracking (add Sentry in future)

**Backups:**
- MongoDB: Daily backups
- Redis: Not critical (queue can rebuild)

**Updates:**
- Monitor GHL API changes
- Update dependencies monthly
- Add new features based on user feedback

