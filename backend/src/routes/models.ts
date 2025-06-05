import express from 'express';
import { AIService } from '../services/aiService';
import { ConfigService } from '../services/configService';

const router = express.Router();
const configService = new ConfigService();

router.get('/', async (_req, res) => {
  try {
    const config = await configService.getConfig();
    const aiService = new AIService(config);
    const models = await aiService.listModels();
    res.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

export { router as modelsRouter };
