# ⚡ Quick Start - Push Notifications

## 🚀 Run These Commands:

```bash
# Step 1: Install frontend dependency
cd notificationPro/frontend
npm install react-router-dom

# Step 2: Start backend
cd ../backend
npm run dev

# Step 3: Start frontend (in new terminal)
cd notificationPro/frontend
npm run dev
```

## 🧪 Test It:

1. Open `http://localhost:5173`
2. Click "Open Notification Settings"
3. Toggle "Browser Push Notifications" ON
4. Click "Allow" in browser
5. Click "Send Test Notification"
6. See notification! ✅

## 📖 Full Documentation:

See `PUSH_NOTIFICATIONS_SETUP.md` for complete details.

---

## ✅ What's New:

- **Landing Page** (`/`) - Shows in GHL iframe
- **Settings Page** (`/settings`) - Opens in new window with secure token
- **Token API** - `/api/auth/generate-token` & `/api/auth/validate-token`
- **15-minute expiry** - Secure, one-time use tokens
- **No iframe issues** - Settings open in popup window

## 🎯 How It Works:

1. User in GHL iframe sees landing page
2. Clicks "Open Settings" → Token generated
3. New window opens with settings
4. User enables notifications
5. Notifications work forever! 🎉

---

**That's it! Ready to test!** 🚀

