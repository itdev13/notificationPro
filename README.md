# NotifyPro

Real-time notifications for GoHighLevel conversations.

## Features

- 🔔 Browser push notifications
- 📧 Email notifications
- 💬 Slack webhook notifications
- ⏰ Business hours filtering
- 🎯 Priority keyword detection
- 🎨 Easy-to-use settings panel

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Production Build

```bash
cd frontend
npm run build
cp -r dist/* ../backend/public/

cd ../backend
npm start
```

## Environment Variables

See `.env.example` for required environment variables.

### Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

## Deployment

1. Build frontend
2. Deploy backend to your server
3. Configure GHL marketplace webhook to point to your server
4. Subscribe to `InboundMessage` webhook

## Architecture

- Backend: Express + MongoDB + BullMQ
- Frontend: React + Vite + TailwindCSS
- Queue: Redis + BullMQ
- Notifications: Web Push API, AWS SES, Slack Webhooks

## License

MIT

