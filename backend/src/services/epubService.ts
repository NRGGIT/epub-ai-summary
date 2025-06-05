import { EPub } from 'epub2';
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

          // Extract chapters (support nested TOC)
          const chapters: Chapter[] = [];
          const tocTree = (epub as any).ncx && Array.isArray((epub as any).ncx)
            ? (epub as any).ncx
            : epub.toc || [];

          let orderCounter = 0;
          const buildChapters = (items: any[]): Chapter[] => {
            return items.map(item => {
              const chapter: Chapter = {
                id: uuidv4(),
                title: item.title || `Chapter ${orderCounter + 1}`,
                content: '', // Extract on demand
                order: orderCounter++,
                href: item.href || '',
                manifestId: item.id || undefined,
                children: []
              };

              if (item.sub && Array.isArray(item.sub) && item.sub.length > 0) {
                chapter.children = buildChapters(item.sub);
              }
              return chapter;
            });
          };

          chapters.push(...buildChapters(tocTree));

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

  private findChapterById(chapters: Chapter[], id: string): Chapter | null {
    for (const ch of chapters) {
      if (ch.id === id) return ch;
      if (ch.children && ch.children.length) {
        const found = this.findChapterById(ch.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  private collectChapterContent(chapter: Chapter): string {
    let text = chapter.content || '';
    if (chapter.children && chapter.children.length) {
      for (const child of chapter.children) {
        text += '\n' + this.collectChapterContent(child);
      }
    }
    return text.trim();
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

    const chapter = this.findChapterById(structure.chapters, chapterId);
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
          
          // Prefer manifestId stored in structure, fallback to search by href
          let manifestId = chapter.manifestId || null;
          if (!manifestId) {
            for (const [id, item] of Object.entries(epub.manifest || {})) {
              if (item.href === chapter.href) {
                manifestId = id as string;
                break;
              }
            }
          }

          if (!manifestId) {
            throw new Error(`No manifest entry found for ${chapter.href}`);
          }

          chapter.manifestId = manifestId;
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

  async getFullChapter(bookId: string, chapterId: string): Promise<Chapter | null> {
    const structure = await this.getBookStructure(bookId);
    if (!structure) return null;

    const target = this.findChapterById(structure.chapters, chapterId);
    if (!target) return null;

    const epubPath = path.join(this.uploadsDir, bookId, 'book.epub');
    if (!(await fs.pathExists(epubPath))) {
      throw new Error('EPUB file not found');
    }

    const epub = await new Promise<EPub>((resolve, reject) => {
      const e = new EPub(epubPath);
      e.on('error', reject);
      e.on('end', () => resolve(e));
      e.parse();
    });

    const loadContent = async (ch: Chapter) => {
      if (!ch.content || ch.content.trim() === '') {
        let manifestId: string | null = ch.manifestId || null;
        if (!manifestId) {
          for (const [id, item] of Object.entries(epub.manifest || {})) {
            if (item.href === ch.href) {
              manifestId = id as string;
              break;
            }
          }
        }

        if (!manifestId) {
          throw new Error(`No manifest entry found for ${ch.href}`);
        }

        ch.manifestId = manifestId;
        ch.content = await this.getChapterContent(epub, manifestId);
      }

      if (ch.children && ch.children.length) {
        for (const child of ch.children) {
          await loadContent(child);
        }
      }
    };

    await loadContent(target);
    await this.updateBookStructure(bookId, structure);

    return { ...target, content: this.collectChapterContent(target) };
  }
}
