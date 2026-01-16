const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const logger = require('../utils/logger');

/**
 * Analytics Routes - Lightweight usage tracking
 */

/**
 * Track an event
 */
router.post('/track', async (req, res) => {
  try {
    const { locationId, userId, eventType, metadata } = req.body;

    if (!locationId || !userId || !eventType) {
      return res.status(400).json({
        success: false,
        error: 'locationId, userId, and eventType are required'
      });
    }

    await Analytics.track(locationId, userId, eventType, metadata);

    res.json({ success: true });
  } catch (error) {
    logger.error('Analytics tracking error:', error);
    res.json({ success: false, error: error.message });
  }
});

/**
 * Get usage stats
 */
router.get('/stats', async (req, res) => {
  try {
    const { locationId, days } = req.query;

    if (!locationId) {
      return res.status(400).json({
        success: false,
        error: 'locationId is required'
      });
    }

    const stats = await Analytics.getStats(locationId, parseInt(days) || 30);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Error getting analytics stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

