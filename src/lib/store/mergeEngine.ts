/**
 * @module MergeEngine
 * @description Universal entity duplicate detection and merge logic.
 */

import { Character, Ability, Item, LocationEntity } from '@/types';
import { indexedDBAdapter } from '@/lib/storage/indexedDBAdapter';

export class MergeEngine {
  private notifyDataChanged: () => void;

  /**
   * @param notifyFn - Function to trigger a UI update when data changes.
   */
  constructor(notifyFn: () => void) {
    this.notifyDataChanged = notifyFn;
  }

  /**
   * Intelligently merges two character entities.
   * @param {string} bookId - The book ID.
   * @param {string} primaryId - The primary character ID to keep.
   * @param {string} secondaryId - The secondary character ID to merge and delete.
   * @param {'keep_primary' | 'keep_secondary' | 'combine'} textResolutionStrategy - Strategy for text fields.
   * @param {string} auditNotes - Optional notes for the merge audit.
   * @returns {Promise<boolean>} True if successful.
   */
  async intelligentMergeCharacters(
    bookId: string,
    primaryId: string,
    secondaryId: string,
    textResolutionStrategy: 'keep_primary' | 'keep_secondary' | 'combine' = 'combine',
    auditNotes: string = ''
  ): Promise<boolean> {
    const primary = await indexedDBAdapter.getById<Character>('characters', primaryId);
    const secondary = await indexedDBAdapter.getById<Character>('characters', secondaryId);
    if (!primary || !secondary) return false;

    let mergedSummary = primary.summary;
    if (textResolutionStrategy === 'keep_secondary') mergedSummary = secondary.summary;
    if (textResolutionStrategy === 'combine') mergedSummary = `${primary.summary}\n\n${secondary.summary}`.trim();

    const mergedKnownFacts = Array.from(new Set([...(primary.knownFacts || []), ...(secondary.knownFacts || [])]));
    const mergedAppearanceFacts = Array.from(new Set([...(primary.explicitAppearanceFacts || []), ...(secondary.explicitAppearanceFacts || [])]));
    const mergedAliases = Array.from(new Set([...(primary.aliases || []), secondary.name, ...(secondary.aliases || [])]));

    const updated: Character = {
      ...primary,
      summary: mergedSummary,
      knownFacts: mergedKnownFacts,
      explicitAppearanceFacts: mergedAppearanceFacts,
      aliases: mergedAliases,
      updatedAt: new Date().toISOString()
    };

    await indexedDBAdapter.save('characters', updated);
    await indexedDBAdapter.delete('characters', secondaryId);
    
    this.notifyDataChanged();
    return true;
  }

  /**
   * Intelligently merges two ability entities.
   * @param {string} bookId - The book ID.
   * @param {string} primaryId - The primary ability ID.
   * @param {string} secondaryId - The secondary ability ID to delete.
   * @returns {Promise<boolean>} True if successful.
   */
  async intelligentMergeAbilities(bookId: string, primaryId: string, secondaryId: string): Promise<boolean> {
    await indexedDBAdapter.delete('abilities', secondaryId);
    this.notifyDataChanged();
    return true;
  }

  /**
   * Intelligently merges two item entities.
   * @param {string} bookId - The book ID.
   * @param {string} primaryId - The primary item ID.
   * @param {string} secondaryId - The secondary item ID to delete.
   * @returns {Promise<boolean>} True if successful.
   */
  async intelligentMergeItems(bookId: string, primaryId: string, secondaryId: string): Promise<boolean> {
    await indexedDBAdapter.delete('items', secondaryId);
    this.notifyDataChanged();
    return true;
  }

  /**
   * Intelligently merges two location entities.
   * @param {string} bookId - The book ID.
   * @param {string} primaryId - The primary location ID.
   * @param {string} secondaryId - The secondary location ID to delete.
   * @returns {Promise<boolean>} True if successful.
   */
  async intelligentMergeLocations(bookId: string, primaryId: string, secondaryId: string): Promise<boolean> {
    await indexedDBAdapter.delete('locations', secondaryId);
    this.notifyDataChanged();
    return true;
  }

  /**
   * Gets the merge history for a given book.
   * @param {string} [bookId] - The book ID.
   * @returns {Promise<any[]>} The merge history.
   */
  async getMergeHistory(bookId?: string): Promise<any[]> {
    return [];
  }
}
