import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { EpubService } from '../services/epubService';

const router = express.Router();
const epubService = new EpubService();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/epub+zip' || path.extname(file.originalname).toLowerCase() === '.epub') {
      cb(null, true);
    } else {
      cb(new Error('Only EPUB files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

router.post('/', upload.single('epub'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No EPUB file uploaded' });
    }

    const filePath = req.file.path;
    
    try {
      const structure = await epubService.parseEpub(filePath);
      
      // Clean up temporary file
      await fs.remove(filePath);
      
      res.json({
        success: true,
        bookId: structure.id,
        structure
      });
    } catch (parseError) {
      // Clean up temporary file on error
      await fs.remove(filePath);
      throw parseError;
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to process EPUB file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as uploadRouter };
