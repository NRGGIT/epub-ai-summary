import express from 'express';
import { EpubService } from '../services/epubService';
import fs from 'fs-extra';
import path from 'path';

const router = express.Router();
const epubService = new EpubService();

// Get book structure
router.get('/:bookId/structure', async (req, res) => {
  try {
    const { bookId } = req.params;
    const structure = await epubService.getBookStructure(bookId);
    
    if (!structure) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json(structure);
  } catch (error) {
    console.error('Error getting book structure:', error);
    res.status(500).json({ error: 'Failed to get book structure' });
  }
  });

// Get nested table of contents (alternative endpoint)
router.get('/:bookId/structure-nested', async (req, res) => {
  try {
    const { bookId } = req.params;
    const structure = await epubService.getBookStructure(bookId);

    if (!structure) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(structure);
  } catch (error) {
    console.error('Error getting book structure:', error);
    res.status(500).json({ error: 'Failed to get book structure' });
  }
});

// Update book structure
router.put('/:bookId/structure', async (req, res) => {
  try {
    const { bookId } = req.params;
    const structure = req.body;
    
    await epubService.updateBookStructure(bookId, structure);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating book structure:', error);
    res.status(500).json({ error: 'Failed to update book structure' });
  }
});

// Get chapter content
router.get('/:bookId/content/:chapterId', async (req, res) => {
  try {
    const { bookId, chapterId } = req.params;
    const chapter = await epubService.getChapterById(bookId, chapterId);
    
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    
    res.json(chapter);
  } catch (error) {
    console.error('Error getting chapter content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get chapter content';
    res.status(500).json({ error: errorMessage });
  }
});

// Get chapter content with subchapters combined
router.get('/:bookId/full-content/:chapterId', async (req, res) => {
  try {
    const { bookId, chapterId } = req.params;
    const chapter = await epubService.getFullChapter(bookId, chapterId);

    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    res.json(chapter);
  } catch (error) {
    console.error('Error getting full chapter content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get chapter content';
    res.status(500).json({ error: errorMessage });
  }
});

// Get all books
router.get('/', async (req, res) => {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const books = [];
    
    if (await fs.pathExists(uploadsDir)) {
      const entries = await fs.readdir(uploadsDir);
      
      for (const entry of entries) {
        const bookDir = path.join(uploadsDir, entry);
        const structureFile = path.join(bookDir, 'structure.json');
        
        if (await fs.pathExists(structureFile)) {
          try {
            const structure = await fs.readJson(structureFile);
            books.push({
              id: structure.id,
              title: structure.title,
              author: structure.author,
              metadata: structure.metadata,
              chapterCount: structure.chapters?.length || 0,
              uploadDate: (await fs.stat(structureFile)).birthtime
            });
          } catch (error) {
            console.error(`Error reading structure for book ${entry}:`, error);
          }
        }
      }
    }
    
    // Sort by upload date, newest first
    books.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    
    res.json(books);
  } catch (error) {
    console.error('Error getting books list:', error);
    res.status(500).json({ error: 'Failed to get books list' });
  }
});

// Delete book
router.delete('/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    const bookDir = path.join(process.cwd(), 'uploads', bookId);
    
    if (await fs.pathExists(bookDir)) {
      await fs.remove(bookDir);
      res.json({ success: true, message: 'Book deleted successfully' });
    } else {
      res.status(404).json({ error: 'Book not found' });
    }
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

export { router as booksRouter };
