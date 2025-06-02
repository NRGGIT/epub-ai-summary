import express from 'express';
import { ConfigService } from '../services/configService';

const router = express.Router();
const configService = new ConfigService();

// Get configuration
router.get('/', async (req, res) => {
  try {
    const config = await configService.getConfig();
    res.json(config);
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
});

// Update configuration
router.put('/', async (req, res) => {
  try {
    const updates = req.body;
    const config = await configService.updateConfig(updates);
    res.json(config);
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

export { router as configRouter };
