import EPub from 'epub2';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { EpubStructure, Chapter, ImageAsset, EpubMetadata } from '../types';

export class EpubService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads');
  }

  async parseEpub(filePath: string): Promise<EpubStructure> {
    return new Promise((resolve, reject) => {
      const epub = new EPub(filePath);
      
      epub.on('error', (err: Error) => {
        reject(err);
      });

      epub.on('end', async () => {
        try {
          const bookId = uuidv4();
          const bookDir = path.join(this.uploadsDir, bookId);
          await fs.ensureDir(bookDir);

          // Extract metadata
          const title = epub.metadata.title || 'Unknown Title';
          const creator = epub.metadata.creator || epub.metadata.creatorFileAs || 'Unknown Author';
          
          const metadata: EpubMetadata = {
            title,
            creator,
            language: epub.metadata.language,
            identifier: epub.metadata.identifier,
            publisher: epub.metadata.publisher,
            date: epub.metadata.date,
            description: epub.metadata.description
          };

          // Extract chapters
          const chapters: Chapter[] = [];
          const toc = epub.toc || [];
          
          for (let i = 0; i < toc.length; i++) {
            const tocItem = toc[i];
            const chapterTitle = tocItem.title || `Chapter ${i + 1}`;
            
            const chapter: Chapter = {
              id: uuidv4(),
              title: chapterTitle,
              content: '', // Will be extracted on-demand
              order: i,
              href: tocItem.href || '',
              children: []
            };

            chapters.push(chapter);
          }

          // Extract images
          const images: ImageAsset[] = [];
          const manifest = epub.manifest || {};
          
          for (const [id, item] of Object.entries(manifest)) {
            if (item['media-type']?.startsWith('image/')) {
              try {
                const imageBuffer = await this.getImageBuffer(epub, item.href || '');
                const imagePath = path.join(bookDir, `${id}.${this.getImageExtension(item['media-type'] || 'image/jpeg')}`);
                
                await fs.writeFile(imagePath, imageBuffer);
                
                images.push({
                  id,
                  href: item.href || '',
                  mediaType: item['media-type'] || 'image/jpeg',
                  localPath: imagePath
                });
              } catch (error) {
                console.warn(`Failed to extract image ${item.href}:`, error instanceof Error ? error.message : 'Unknown error');
                // Continue processing other images
              }
            }
          }

          const structure: EpubStructure = {
            id: bookId,
            title,
            author: creator,
            chapters,
            images,
            metadata
          };

          // Copy the EPUB file to the book directory for later content extraction
          await fs.copy(filePath, path.join(bookDir, 'book.epub'));
          
          // Save structure to file
          await fs.writeJSON(path.join(bookDir, 'structure.json'), structure, { spaces: 2 });

          resolve(structure);
        } catch (error) {
          reject(error);
        }
      });

      epub.parse();
    });
  }

  private async getChapterContent(epub: any, href: string): Promise<string> {
    return new Promise((resolve, reject) => {
      epub.getChapter(href, (error: Error, text: string) => {
        if (error) {
          console.warn(`Failed to get chapter content for ${href}:`, error.message);
          reject(new Error(`Failed to extract content from ${href}: ${error.message}`));
        } else {
          // Clean up HTML and extract text content
          const cleanText = this.cleanHtmlContent(text || '');
          if (!cleanText || cleanText.trim().length === 0) {
            reject(new Error(`No content found in ${href}`));
          } else {
            resolve(cleanText);
          }
        }
      });
    });
  }

  private async getImageBuffer(epub: any, href: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      epub.getImage(href, (error: Error, data: Buffer) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }

  private cleanHtmlContent(html: string): string {
    // Remove HTML tags and clean up content
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getImageExtension(mediaType: string): string {
    const extensions: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'image/webp': 'webp'
    };
    return extensions[mediaType] || 'jpg';
  }

  async getBookStructure(bookId: string): Promise<EpubStructure | null> {
    try {
      const structurePath = path.join(this.uploadsDir, bookId, 'structure.json');
      const structure = await fs.readJSON(structurePath);
      return structure;
    } catch (error) {
      return null;
    }
  }

  async updateBookStructure(bookId: string, structure: EpubStructure): Promise<void> {
    const structurePath = path.join(this.uploadsDir, bookId, 'structure.json');
    await fs.writeJSON(structurePath, structure, { spaces: 2 });
  }

  async getChapterById(bookId: string, chapterId: string): Promise<Chapter | null> {
    const structure = await this.getBookStructure(bookId);
    if (!structure) return null;

    const chapter = structure.chapters.find(chapter => chapter.id === chapterId);
    if (!chapter) return null;

    // Extract actual content if not already present
    if (!chapter.content || chapter.content.trim() === '') {
      try {
        // Re-open the EPUB file to extract content
        const epubPath = path.join(this.uploadsDir, bookId, 'book.epub');
        if (await fs.pathExists(epubPath)) {
          const epub = new EPub(epubPath);
          await new Promise<void>((resolve, reject) => {
            epub.on('error', reject);
            epub.on('end', () => resolve());
            epub.parse();
          });
          
          // Find the manifest ID that corresponds to this chapter's href
          // The epub.getChapter() method expects manifest IDs, not file paths
          let manifestId = null;
          for (const [id, item] of Object.entries(epub.manifest || {})) {
            if (item.href === chapter.href) {
              manifestId = id;
              break;
            }
          }
          
          if (!manifestId) {
            throw new Error(`No manifest entry found for ${chapter.href}`);
          }
          
          chapter.content = await this.getChapterContent(epub, manifestId);
          
          // Update the structure with the extracted content
          await this.updateBookStructure(bookId, structure);
        } else {
          throw new Error('EPUB file not found');
        }
      } catch (error) {
        throw new Error(`Failed to extract chapter content: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return chapter;
  }
}
