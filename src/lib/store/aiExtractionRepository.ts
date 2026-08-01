/**
 * @module AIExtractionRepository
 * @description Handles AI draft saving, approval, and rejection.
 */

import { AIExtraction, StructuredExtractionJSON } from '@/types';
import { indexedDBAdapter } from '@/lib/storage/indexedDBAdapter';
import { generateUUID } from './utils';
import { ChapterRepository } from './chapterRepository';

export class AIExtractionRepository {
  private notifyDataChanged: () => void;
  private chapterRepo: ChapterRepository;

  /**
   * @param notifyFn - Function to trigger a UI update when data changes.
   * @param chapterRepo - Reference to chapter repository for status updates.
   */
  constructor(notifyFn: () => void, chapterRepo: ChapterRepository) {
    this.notifyDataChanged = notifyFn;
    this.chapterRepo = chapterRepo;
  }

  /**
   * Saves a draft extraction.
   * @param {string} bookId - The book ID.
   * @param {string} chapterId - The chapter ID.
   * @param {StructuredExtractionJSON} extractionData - The extraction data.
   * @returns {Promise<AIExtraction>} The saved extraction.
   */
  async saveDraftExtraction(bookId: string, chapterId: string, extractionData: StructuredExtractionJSON): Promise<AIExtraction> {
    return this.saveAIExtractionDraft(bookId, chapterId, extractionData);
  }

  /**
   * Saves an AI extraction draft and updates chapter status.
   * @param {string} bookId - The book ID.
   * @param {string} chapterId - The chapter ID.
   * @param {StructuredExtractionJSON} extractionData - The extraction data.
   * @returns {Promise<AIExtraction>} The saved extraction.
   */
  async saveAIExtractionDraft(bookId: string, chapterId: string, extractionData: StructuredExtractionJSON): Promise<AIExtraction> {
    const draftId = generateUUID();
    const draft: AIExtraction = {
      id: draftId,
      bookId,
      chapterId,
      extraction: extractionData,
      status: 'Pending',
      warnings: extractionData.warnings || [],
      createdAt: new Date().toISOString()
    };

    await indexedDBAdapter.save('ai_extractions', draft);
    if (chapterId) {
      await this.chapterRepo.updateChapter(chapterId, { status: 'Pending Review' });
    }
    this.notifyDataChanged();
    return draft;
  }

  /**
   * Gets an extraction for a specific chapter.
   * @param {string} chapterId - The chapter ID.
   * @returns {Promise<AIExtraction | null>} The extraction or null.
   */
  async getExtractionForChapter(chapterId: string): Promise<AIExtraction | null> {
    try {
      const all = await indexedDBAdapter.getAll<AIExtraction>('ai_extractions');
      return all.find(e => e.chapterId === chapterId) || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Gets a specific extraction by ID.
   * @param {string} id - The extraction ID.
   * @returns {Promise<AIExtraction | null>} The extraction or null.
   */
  async getExtraction(id: string): Promise<AIExtraction | null> {
    try {
      return (await indexedDBAdapter.getById<AIExtraction>('ai_extractions', id)) || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Rejects an extraction, resetting chapter status and deleting the draft.
   * @param {string} extractionId - The extraction ID.
   * @returns {Promise<boolean>} True if successful.
   */
  async rejectExtraction(extractionId: string): Promise<boolean> {
    const draft = await indexedDBAdapter.getById<AIExtraction>('ai_extractions', extractionId);
    if (draft && draft.chapterId) {
      await this.chapterRepo.updateChapter(draft.chapterId, { status: 'Unprocessed' });
    }
    await indexedDBAdapter.delete('ai_extractions', extractionId);
    this.notifyDataChanged();
    return true;
  }
}
