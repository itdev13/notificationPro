const express = require('express');
const router = express.Router();
const ghlService = require('../services/ghlService');
const OAuthToken = require('../models/OAuthToken');
const logger = require('../utils/logger');
const { logError } = require('../utils/errorLogger');

/**
 * OAuth Routes for NotifyPro
 */

/**
 * Start OAuth flow
 */
router.get('/authorize', (req, res) => {
  const scopes = [
    'conversations.readonly',
    'conversations/message.readonly',
    'contacts.readonly'
  ].join(' ');

  const authUrl = `${process.env.GHL_OAUTH_URL}/authorize?` + 
    `response_type=code&` +
    `client_id=${process.env.GHL_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.GHL_REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(scopes)}`;

  res.redirect(authUrl);
});

/**
 * OAuth callback
 */
router.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Authorization code not provided');
  }

  try {
    logger.info('Exchanging code for token...');
    
    const tokenData = await ghlService.getAccessToken(code);

    // Check if this is Sub-Account-level or Company-level installation
    const isLocationLevel = !!tokenData.locationId;
    
    if (isLocationLevel) {
      // ===== SUB-ACCOUNT-LEVEL INSTALLATION =====
      logger.info('📍 Sub-Account installation for:', tokenData.locationId);
      
      // Save sub-account token
      let savedToken = await OAuthToken.findOneAndUpdate(
        { locationId: tokenData.locationId },
        {
          locationId: tokenData.locationId,
          companyId: tokenData.companyId,
          tokenType: 'location',
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          expiresAt: new Date(Date.now() + tokenData.expiresIn * 1000),
          isActive: true
        },
        { upsert: true, new: true }
      );

      // Fetch sub-account details
      logger.info('Fetching sub-account details...');
      const locationDetails = await ghlService.getLocationDetails(tokenData.locationId);

      // Update with sub-account details
      savedToken = await OAuthToken.findOneAndUpdate(
        { locationId: tokenData.locationId },
        { ...locationDetails },
        { new: true }
      );

      logger.info('✅ OAuth successful for sub-account:', savedToken.locationName || tokenData.locationId);
      
      var displayName = savedToken.locationName 
        ? `${savedToken.locationName}` 
        : `Sub-Account ID: ${savedToken.locationId}`;
      var successMessage = `Connected to: ${displayName}`;
      
    } else {
      // ===== COMPANY-LEVEL INSTALLATION =====
      logger.info('🏢 Company-level installation for:', tokenData.companyId);
      
      // Save company-level token
      await OAuthToken.findOneAndUpdate(
        { companyId: tokenData.companyId, tokenType: 'company' },
        {
          companyId: tokenData.companyId,
          tokenType: 'company',
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          expiresAt: new Date(Date.now() + tokenData.expiresIn * 1000),
          isActive: true
        },
        { upsert: true, new: true }
      );

      // Fetch all sub-accounts for this company
      logger.info('Fetching all sub-accounts for company...');
      const locations = await ghlService.getCompanyLocations(tokenData.companyId, tokenData.accessToken);

      // Create tokens for each sub-account
      logger.info(`Creating tokens for ${locations.length} sub-accounts...`);
      for (const location of locations) {
        await OAuthToken.findOneAndUpdate(
          { locationId: location.locationId },
          {
            locationId: location.locationId,
            companyId: tokenData.companyId,
            tokenType: 'company',
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken,
            expiresAt: new Date(Date.now() + tokenData.expiresIn * 1000),
            locationName: location.locationName,
            locationEmail: location.locationEmail,
            locationPhone: location.locationPhone,
            locationAddress: location.locationAddress,
            locationWebsite: location.locationWebsite,
            locationTimezone: location.locationTimezone,
            isActive: true
          },
          { upsert: true, new: true }
        );
      }

      logger.info('✅ OAuth successful for company:', tokenData.companyId);
      var displayName = `${locations.length} sub-account(s)`;
      var successMessage = `Company installed with ${displayName}`;
    }

    // Success page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Success - NotifyPro</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            text-align: center;
            background: white;
            padding: 50px;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            max-width: 500px;
          }
          .icon {
            font-size: 80px;
            margin-bottom: 20px;
          }
          h1 {
            color: #10B981;
            margin: 0 0 15px 0;
            font-size: 32px;
          }
          p {
            color: #6B7280;
            margin: 12px 0;
            font-size: 16px;
            line-height: 1.6;
          }
          .display-name {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-family: monospace;
          }
          .features {
            background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
            padding: 25px;
            border-radius: 12px;
            margin: 25px 0;
            border: 2px solid #2563EB;
            text-align: left;
          }
          .features h3 {
            color: #1E40AF;
            margin: 0 0 15px 0;
          }
          .feature-item {
            margin: 8px 0;
            color: #374151;
          }
          .tip {
            background: #FEF3C7;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            border-left: 4px solid #F59E0B;
          }
          .tip p {
            color: #92400E;
            font-size: 14px;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🔔</div>
          <h1>Connected Successfully!</h1>
          <p>${successMessage}</p>
          
          <div class="display-name">
            ${displayName}
          </div>
          
          <div class="features">
            <h3>🎯 What's Next:</h3>
            <div class="feature-item">✅ NotifyPro is now active</div>
            <div class="feature-item">✅ Open NotifyPro from your GHL menu to configure settings</div>
            <div class="feature-item">✅ Enable channels: Browser, Email, or Slack</div>
            <div class="feature-item">✅ Set business hours and priority keywords</div>
          </div>
          
          <div class="tip">
            <p>💡 Find NotifyPro in your sub-account's left navigation menu</p>
          </div>
          
          <p style="font-size: 13px; color: #9CA3AF; margin-top: 25px;">
            You can safely close this window
          </p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    logError('OAuth callback error', error, { code: req.query?.code });
    
    // Check if authorization code already used
    const isCodeReused = error.response?.data?.error === 'invalid_grant' && 
                         error.response?.data?.error_description?.includes('authorization code');
    
    if (isCodeReused) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Already Connected - NotifyPro</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              text-align: center;
              background: white;
              padding: 50px;
              border-radius: 16px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              max-width: 500px;
            }
            .icon { font-size: 80px; margin-bottom: 20px; }
            h1 { color: #10B981; margin: 0 0 15px 0; }
            p { color: #6B7280; margin: 12px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✅</div>
            <h1>Already Connected!</h1>
            <p>NotifyPro is already active for this account</p>
            <p style="font-size: 13px; color: #9CA3AF; margin-top: 25px;">
              You can close this window
            </p>
          </div>
        </body>
        </html>
      `);
    }
    
    // Other errors
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error - NotifyPro</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            max-width: 500px;
          }
          .icon { font-size: 64px; margin-bottom: 20px; }
          h1 { color: #EF4444; margin: 0 0 15px 0; }
          p { color: #6B7280; margin: 10px 0; }
          .error-detail {
            background: #FEE2E2;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            color: #991B1B;
            font-size: 14px;
          }
          a {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background: #2563EB;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">⚠️</div>
          <h1>Connection Failed</h1>
          <p>We encountered an error while connecting NotifyPro</p>
          <div class="error-detail">
            ${error.message}
          </div>
          <a href="/oauth/authorize">Try Again</a>
        </div>
      </body>
      </html>
    `);
  }
});

/**
 * Check OAuth status
 */
router.get('/status', async (req, res) => {
  const { locationId } = req.query;

  if (!locationId) {
    return res.status(400).json({
      success: false,
      error: 'locationId required'
    });
  }

  try {
    const token = await OAuthToken.findActiveToken(locationId);
    
    res.json({
      success: true,
      connected: !!token,
      locationId,
      locationName: token?.locationName || null,
      expiresAt: token?.expiresAt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

