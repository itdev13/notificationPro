require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const logger = require('./utils/logger');
const database = require('./config/database');

/**
 * NotifyPro - Real-time Notifications for GHL
 * Features: Browser Push, Email, Slack notifications
 */
class NotifyProApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Trust proxy - Required for ALB/Load Balancer
    this.app.set('trust proxy', 1);
    
    // Configure Helmet to allow GHL iframe embedding
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "script-src": ["'self'", "'unsafe-inline'"],
          "script-src-attr": ["'unsafe-inline'"],
          "frame-ancestors": [
            "'self'",
            "https://*.gohighlevel.com",
            "https://*.leadconnectorhq.com",
            "https://app.gohighlevel.com",
            "https://app.leadconnectorhq.com"
          ]
        }
      }
    }));
    
    // CORS - Allow GHL domains and your frontend
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL,
      process.env.BASE_URL
    ].filter(Boolean);
    
    this.app.use(cors({
      origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, webhooks, etc.)
        if (!origin) return callback(null, true);
        
        // Check if origin is in whitelist
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        // Allow GHL domains
        const isGHLDomain = origin.includes('gohighlevel.com') ||
                           origin.includes('leadconnectorhq.com');
        
        // In development, allow localhost and cloudflare
        const isDevOrigin = process.env.NODE_ENV !== 'production' && (
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          origin.includes('trycloudflare.com')
        );
        
        if (isGHLDomain || isDevOrigin) {
          return callback(null, true);
        }
        
        logger.warn('❌ CORS blocked origin:', origin);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Disposition']
    }));
    
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Serve static files (built React app)
    this.app.use(express.static(path.join(__dirname, '../public')));

    // Request logging
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        const statusEmoji = statusCode >= 500 ? '🔴' : 
                           statusCode >= 400 ? '🟡' : 
                           statusCode >= 300 ? '🔵' : '🟢';
        
        logger.info(`${statusEmoji} ${req.method} ${req.path} → ${statusCode} (${duration}ms)`);
      });
      
      next();
    });
  }

  setupRoutes() {
    // Import rate limiters
    const { apiLimiter, authLimiter, webhookLimiter } = require('./middleware/rateLimiter');
    
    // Health check (no rate limit)
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy',
        app: 'NotifyPro',
        timestamp: new Date().toISOString()
      });
    });

    // OAuth routes (no rate limit - GHL handles this)
    const oauthRoutes = require('./routes/oauth');
    this.app.use('/oauth', oauthRoutes);

    // Auth routes (strict rate limiting)
    const authRoutes = require('./routes/auth');
    this.app.use('/api/auth', authLimiter, authRoutes);

    // Webhook routes (lenient rate limiting)
    const webhookRoutes = require('./routes/webhooks');
    this.app.use('/api/webhooks', webhookLimiter, webhookRoutes);

    // Settings routes
    const settingsRoutes = require('./routes/settings');
    this.app.use('/api/settings', apiLimiter, settingsRoutes);

    // Push subscription routes
    const subscriptionsRoutes = require('./routes/subscriptions');
    this.app.use('/api/subscriptions', apiLimiter, subscriptionsRoutes);

    // Root - API info
    this.app.get('/', (req, res) => {
      res.json({
        app: 'NotifyPro',
        version: '1.0.0',
        description: 'Real-time notifications for GoHighLevel conversations',
        features: [
          '🔔 Browser push notifications',
          '📧 Email notifications',
          '💬 Slack notifications',
          '⏰ Business hours filtering',
          '🎯 Priority keywords'
        ]
      });
    });

    // Serve React app for any unknown routes (SPA)
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not Found'
      });
    });

    // Global error handler
    this.app.use((err, req, res, next) => {
      logger.error('Server Error:', err);
      res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error'
      });
    });
  }

  async start() {
    try {
      // Connect to MongoDB
      await database.connect();
      
      this.app.listen(this.port, () => {
        logger.info('='.repeat(50));
        logger.info('🔔 NotifyPro Started');
        logger.info('='.repeat(50));
        logger.info(`📡 Port: ${this.port}`);
        logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🔗 URL: ${process.env.BASE_URL}`);
        logger.info('='.repeat(50));
        logger.info('');
        logger.info('💡 Features:');
        logger.info('   - Browser Push Notifications');
        logger.info('   - Email Notifications (AWS SES)');
        logger.info('   - Slack Notifications');
        logger.info('   - Business Hours Filtering');
        logger.info('   - Priority Keywords');
        logger.info('='.repeat(50));
      });

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

const app = new NotifyProApp();
app.start();

module.exports = app;

