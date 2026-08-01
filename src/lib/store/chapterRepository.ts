/**
 * @module ChapterRepository
 * @description Handles CRUD operations for chapters and their status.
 */

import { Chapter } from '@/types';
import { indexedDBAdapter } from '@/lib/storage/indexedDBAdapter';
import { generateUUID } from './utils';

export class ChapterRepository {
  private notifyDataChanged: () => void;

  /**
   * @param notifyFn - Function to trigger a UI update when data changes.
   */
  constructor(notifyFn: () => void) {
    this.notifyDataChanged = notifyFn;
  }

  /**
   * Gets all chapters for a given book.
   * @param {string} bookId - The book ID.
   * @returns {Promise<Chapter[]>} Array of chapters.
   */
  async getChapters(bookId: string): Promise<Chapter[]> {
    try {
      const chapters = await indexedDBAdapter.getAllByBookId<Chapter>('chapters', bookId);
      return chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
    } catch (e) {
      return [];
    }
  }

  /**
   * Gets a chapter by ID.
   * @param {string} id - The chapter ID.
   * @returns {Promise<Chapter | undefined>} The chapter or undefined.
   */
  async getChapter(id: string): Promise<Chapter | undefined> {
    return indexedDBAdapter.getById<Chapter>('chapters', id);
  }

  /**
   * Creates a new chapter.
   * @param {string} bookId - The book ID.
   * @param {string} title - Chapter title.
   * @param {string} content - Chapter content.
   * @param {number} [chapterNumber] - Optional chapter number.
   * @returns {Promise<Chapter | null>} The created chapter.
   */
  async createChapter(bookId: string, title: string, content: string, chapterNumber?: number): Promise<Chapter | null> {
    const existingChaps = await this.getChapters(bookId);
    const nextNum = chapterNumber || (existingChaps.length > 0 ? Math.max(...existingChaps.map(c => c.chapterNumber)) + 1 : 1);
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

    const newChap: Chapter = {
      id: generateUUID(),
      bookId,
      title: title || `Chapter ${nextNum}`,
      chapterNumber: nextNum,
      content: content || '',
      wordCount,
      readingTimeMinutes: Math.max(1, Math.ceil(wordCount / 225)),
      status: 'Unprocessed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await indexedDBAdapter.save('chapters', newChap);
    this.notifyDataChanged();
    return newChap;
  }

  /**
   * Updates an existing chapter.
   * @param {string} id - The chapter ID.
   * @param {Partial<Chapter>} updates - The data to update.
   * @returns {Promise<boolean>} True if successful.
   */
  async updateChapter(id: string, updates: Partial<Chapter>): Promise<boolean> {
    const existing = await indexedDBAdapter.getById<Chapter>('chapters', id);
    if (!existing) return false;

    const wordCount = updates.content !== undefined 
      ? (updates.content.trim() ? updates.content.trim().split(/\s+/).length : 0)
      : existing.wordCount;

    const updated: Chapter = {
      ...existing,
      ...updates,
      wordCount,
      readingTimeMinutes: Math.max(1, Math.ceil(wordCount / 225)),
      updatedAt: new Date().toISOString()
    };

    await indexedDBAdapter.save('chapters', updated);
    this.notifyDataChanged();
    return true;
  }

  /**
   * Purges analysis receipt and resets a single chapter's status back to Unprocessed.
   * @param {string} id - The chapter ID.
   * @returns {Promise<boolean>} True if successful.
   */
  async purgeChapterAnalysisData(id: string): Promise<boolean> {
    const existing = await indexedDBAdapter.getById<Chapter>('chapters', id);
    if (!existing) return false;

    // Delete extraction receipts for this chapter
    const extractions = await indexedDBAdapter.getAll<any>('ai_extractions');
    for (const ext of extractions) {
      if (ext.chapterId === id) {
        await indexedDBAdapter.delete('ai_extractions', ext.id);
      }
    }

    // Reset status to Unprocessed
    await indexedDBAdapter.save('chapters', {
      ...existing,
      status: 'Unprocessed',
      updatedAt: new Date().toISOString()
    });

    this.notifyDataChanged();
    return true;
  }

  /**
   * Deletes a chapter by ID.
   * @param {string} id - The chapter ID.
   * @returns {Promise<boolean>} True if successful.
   */
  async deleteChapter(id: string): Promise<boolean> {
    await indexedDBAdapter.delete('chapters', id);
    this.notifyDataChanged();
    return true;
  }
}
