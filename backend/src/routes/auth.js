const express = require('express');
const router = express.Router();
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { logError } = require('../utils/errorLogger');

// In-memory store for one-time tokens (use Redis in production)
const usedTokens = new Set();

// Clean up expired tokens every hour
setInterval(() => {
  usedTokens.clear();
  logger.info('Cleared used tokens cache');
}, 60 * 60 * 1000);

/**
 * Decrypt user data from GHL (Official Method)
 * Reference: https://marketplace.gohighlevel.com/docs/other/user-context-marketplace-apps
 */
router.post('/decrypt-user-data', async (req, res) => {
  try {
    const { encryptedData } = req.body;

    if (!encryptedData) {
      return res.status(400).json({
        success: false,
        error: 'No encrypted data provided'
      });
    }

    // Decrypt using Shared Secret
    const sharedSecret = process.env.GHL_APP_SHARED_SECRET;
    
    if (!sharedSecret) {
      logger.error('Shared Secret not configured');
      return res.status(500).json({
        success: false,
        error: 'Shared Secret not configured'
      });
    }

    // Decrypt using CryptoJS
    const decrypted = CryptoJS.AES.decrypt(encryptedData, sharedSecret).toString(CryptoJS.enc.Utf8);
    const userData = JSON.parse(decrypted);

    // Log to check userId presence
    if (!userData.userId) {
      logger.warn('⚠️ userId not found in decrypted data from GHL!', {
        hasUserId: !!userData.userId,
        fields: Object.keys(userData)
      });
    }

    // Don't log sensitive user data in production
    if (process.env.NODE_ENV !== 'production') {
      logger.info('User data decrypted', {
        userId: userData.userId ? 'present' : 'MISSING',
        locationId: userData.locationId || userData.activeLocation ? 'present' : 'MISSING'
      });
    }

    // Return decrypted user data
    res.json({
      success: true,
      userId: userData.userId || null,
      companyId: userData.companyId || null,
      locationId: userData.activeLocation || userData.locationId || null,
      email: userData.email || null,
      userName: userData.userName || null,
      role: userData.role || null,
      type: userData.type || (userData.activeLocation ? 'Location' : 'Agency')
    });

  } catch (error) {
    logError('Failed to decrypt user data', error);
    res.status(400).json({
      success: false,
      error: 'Failed to decrypt user data',
      message: error.message
    });
  }
});

/**
 * Generate secure token for settings access
 * This creates a JWT token with user context that expires in 15 minutes
 */
router.post('/generate-token', async (req, res) => {
  try {
    const { locationId, userId, companyId, email, userName, type } = req.body;

    // Log received data for debugging
    logger.info('Generate token request:', {
      hasLocationId: !!locationId,
      hasUserId: !!userId,
      userId: userId,
      type: type
    });

    // Validate required fields
    if (!locationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: locationId'
      });
    }

    if (!userId) {
      logger.warn('⚠️ Token generation without userId - using default');
    }

    // Check JWT secret
    const jwtSecret = process.env.JWT_SECRET || process.env.GHL_APP_SHARED_SECRET;
    if (!jwtSecret) {
      logger.error('JWT Secret not configured');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    // Create JWT token with 15 minute expiry
    const token = jwt.sign(
      {
        locationId,
        userId: userId || 'default', // Fallback to 'default' if not provided
        companyId: companyId || '',
        email: email || '',
        userName: userName || '',
        type: type || 'Location',
        timestamp: Date.now()
      },
      jwtSecret,
      { 
        expiresIn: '15m',
        issuer: 'notifypro',
        subject: userId || 'default'
      }
    );

    logger.info(`Token generated for user ${userId || 'default'} (location: ${locationId})`);

    logger.info(`Token generated for user ${userId} (location: ${locationId})`);

    res.json({
      success: true,
      token,
      expiresIn: 900 // 15 minutes in seconds
    });

  } catch (error) {
    logError('Failed to generate token', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate token',
      message: error.message
    });
  }
});

/**
 * Validate token and return user context
 * This validates the JWT and ensures it's only used once
 */
router.post('/validate-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Check if token was already used
    if (usedTokens.has(token)) {
      logger.warn('Attempted reuse of token');
      return res.status(401).json({
        success: false,
        error: 'Token has already been used'
      });
    }

    // Verify JWT
    const jwtSecret = process.env.JWT_SECRET || process.env.GHL_APP_SHARED_SECRET;
    if (!jwtSecret) {
      logger.error('JWT Secret not configured');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret, {
        issuer: 'notifypro'
      });
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token has expired. Please generate a new one.'
        });
      }
      throw jwtError;
    }

    // Mark token as used (one-time use)
    usedTokens.add(token);

    logger.info(`Token validated for user ${decoded.userId} (location: ${decoded.locationId})`);

    // Return user context
    res.json({
      success: true,
      context: {
        locationId: decoded.locationId,
        userId: decoded.userId,
        companyId: decoded.companyId,
        email: decoded.email,
        userName: decoded.userName,
        type: decoded.type
      }
    });

  } catch (error) {
    logError('Failed to validate token', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: error.message
    });
  }
});

/**
 * Get location details from OAuth token (faster than calling GHL API)
 */
router.get('/location/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;

    if (!locationId) {
      return res.status(400).json({
        success: false,
        error: 'Location ID is required'
      });
    }

    const OAuthToken = require('../models/OAuthToken');
    
    // Get location data from OAuth token (already stored during OAuth)
    const token = await OAuthToken.findActiveToken(locationId);

    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Location not found or app not installed'
      });
    }

    res.json({
      success: true,
      location: {
        locationName: token.locationName,
        locationEmail: token.locationEmail,
        locationPhone: token.locationPhone,
        locationTimezone: token.locationTimezone
      }
    });

  } catch (error) {
    logError('Failed to get location details', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch location details',
      message: error.message
    });
  }
});

module.exports = router;

