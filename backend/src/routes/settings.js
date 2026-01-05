const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const NotificationPreference = require('../models/NotificationPreference');
const logger = require('../utils/logger');

/**
 * Settings Routes
 * Manage notification preferences
 */

/**
 * Get preferences for a location
 */
router.get('/', async (req, res) => {
  try {
    const { locationId } = req.query;

    if (!locationId) {
      return res.status(400).json({
        success: false,
        error: 'locationId is required'
      });
    }

    // Get or create preferences
    let preferences = await NotificationPreference.findByLocation(locationId);
    
    if (!preferences) {
      preferences = await NotificationPreference.create({ locationId });
    }

    res.json({
      success: true,
      preferences
    });
    
  } catch (error) {
    logger.error('Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update preferences
 */
router.post('/', [
  body('locationId').notEmpty().withMessage('locationId is required'),
  body('channels').optional().isObject(),
  body('filters').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { locationId, channels, filters } = req.body;

    // Update or create preferences
    const preferences = await NotificationPreference.findOneAndUpdate(
      { locationId, userId: null },
      {
        $set: {
          ...(channels && { channels }),
          ...(filters && { filters }),
          updatedAt: new Date()
        }
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    logger.info(`✅ Preferences updated for location: ${locationId}`);

    res.json({
      success: true,
      preferences
    });
    
  } catch (error) {
    logger.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Reset preferences to defaults
 */
router.delete('/', async (req, res) => {
  try {
    const { locationId } = req.query;

    if (!locationId) {
      return res.status(400).json({
        success: false,
        error: 'locationId is required'
      });
    }

    await NotificationPreference.findOneAndDelete({ locationId, userId: null });
    
    // Create new with defaults
    const preferences = await NotificationPreference.create({ locationId });

    res.json({
      success: true,
      message: 'Preferences reset to defaults',
      preferences
    });
    
  } catch (error) {
    logger.error('Error resetting preferences:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

