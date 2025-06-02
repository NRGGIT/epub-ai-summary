import express from 'express';
import { AIService } from '../services/aiService';
import { ConfigService } from '../services/configService';

const router = express.Router();
const configService = new ConfigService();

// Summarize content
router.post('/', async (req, res) => {
  try {
    const { content, images, ratio, customPrompt, language } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    if (!ratio || ratio <= 0 || ratio > 1) {
      return res.status(400).json({ error: 'Ratio must be between 0 and 1' });
    }
    
    const config = await configService.getConfig();
    const aiService = new AIService(config);
    
    const result = await aiService.summarizeContent({
      content,
      images: images || [],
      ratio,
      customPrompt,
      language
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error summarizing content:', error);
    res.status(500).json({ 
      error: 'Failed to summarize content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as summarizeRouter };
