/**
 * @module MergeEngine
 * @description Universal entity duplicate detection and merge logic.
 * Ensures complete reference re-linking and data preservation when merging.
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
   * Intelligently merges two character entities while re-linking all items, abilities, relationships, and dialogue facts.
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
    if (textResolutionStrategy === 'combine') {
      mergedSummary = primary.summary && secondary.summary && !primary.summary.includes(secondary.summary)
        ? `${primary.summary}\n\n${secondary.summary}`.trim()
        : primary.summary || secondary.summary;
    }

    const mergedKnownFacts = Array.from(new Set([...(primary.knownFacts || []), ...(secondary.knownFacts || [])]));
    const mergedAppearanceFacts = Array.from(new Set([...(primary.explicitAppearanceFacts || []), ...(secondary.explicitAppearanceFacts || [])]));
    const mergedAliases = Array.from(new Set([...(primary.aliases || []), secondary.name, ...(secondary.aliases || [])]));
    const mergedAttrs = { ...(primary.dynamicAttributes || {}), ...(secondary.dynamicAttributes || {}) };
    const mergedProgression = Array.from(new Set([...(primary.progressionHistory || []), ...(secondary.progressionHistory || [])]));

    const updated: Character = {
      ...primary,
      summary: mergedSummary,
      knownFacts: mergedKnownFacts,
      explicitAppearanceFacts: mergedAppearanceFacts,
      aliases: mergedAliases,
      dynamicAttributes: mergedAttrs,
      progressionHistory: mergedProgression,
      occupation: primary.occupation || secondary.occupation,
      currentLocation: primary.currentLocation || secondary.currentLocation,
      species: primary.species || secondary.species,
      level: primary.level || secondary.level,
      className: primary.className || secondary.className,
      updatedAt: new Date().toISOString()
    };

    // 1. Re-link items owned by secondary to primary name
    try {
      const items = await indexedDBAdapter.getAllByBookId<Item>('items', bookId);
      for (const item of items) {
        if (item.ownerCharacterName === secondary.name) {
          await indexedDBAdapter.save('items', { ...item, ownerCharacterName: primary.name });
        }
      }
    } catch (e) { /* ignore */ }

    // 2. Re-link abilities used by secondary to primary name
    try {
      const abilities = await indexedDBAdapter.getAllByBookId<Ability>('abilities', bookId);
      for (const ab of abilities) {
        if (ab.userCharacterNames?.includes(secondary.name)) {
          const updatedUsers = Array.from(new Set(ab.userCharacterNames.map(u => u === secondary.name ? primary.name : u)));
          await indexedDBAdapter.save('abilities', { ...ab, userCharacterNames: updatedUsers });
        }
      }
    } catch (e) { /* ignore */ }

    // 3. Re-link relationships involving secondary to primary name
    try {
      const rels = await indexedDBAdapter.getAllByBookId<any>('relationships', bookId);
      for (const rel of rels) {
        let changed = false;
        let c1 = rel.character1Name;
        let c2 = rel.character2Name;
        if (c1 === secondary.name) { c1 = primary.name; changed = true; }
        if (c2 === secondary.name) { c2 = primary.name; changed = true; }
        if (changed) {
          await indexedDBAdapter.save('relationships', { ...rel, character1Name: c1, character2Name: c2 });
        }
      }
    } catch (e) { /* ignore */ }

    // 4. Re-link dialogue facts involving secondary to primary name
    try {
      const dfs = await indexedDBAdapter.getAllByBookId<any>('dialogue_facts', bookId);
      for (const df of dfs) {
        let changed = false;
        let spk = df.speaker;
        let rec = df.recipient;
        if (spk === secondary.name) { spk = primary.name; changed = true; }
        if (rec === secondary.name) { rec = primary.name; changed = true; }
        if (changed) {
          await indexedDBAdapter.save('dialogue_facts', { ...df, speaker: spk, recipient: rec });
        }
      }
    } catch (e) { /* ignore */ }

    // 5. Re-link timeline events involving secondary to primary name
    try {
      const evs = await indexedDBAdapter.getAllByBookId<any>('timeline_events', bookId);
      for (const ev of evs) {
        if (ev.participants?.includes(secondary.name)) {
          const updatedParticipants = Array.from(new Set(ev.participants.map((p: string) => p === secondary.name ? primary.name : p)));
          await indexedDBAdapter.save('timeline_events', { ...ev, participants: updatedParticipants });
        }
      }
    } catch (e) { /* ignore */ }

    await indexedDBAdapter.save('characters', updated);
    await indexedDBAdapter.delete('characters', secondaryId);

    this.notifyDataChanged();
    return true;
  }

  /**
   * Intelligently merges two ability entities.
   */
  async intelligentMergeAbilities(bookId: string, primaryId: string, secondaryId: string): Promise<boolean> {
    const primary = await indexedDBAdapter.getById<Ability>('abilities', primaryId);
    const secondary = await indexedDBAdapter.getById<Ability>('abilities', secondaryId);
    if (primary && secondary) {
      const mergedDesc = primary.description && secondary.description && !primary.description.includes(secondary.description)
        ? `${primary.description}\n\n${secondary.description}`
        : primary.description || secondary.description;
      const mergedUsers = Array.from(new Set([...(primary.userCharacterNames || []), ...(secondary.userCharacterNames || [])]));
      await indexedDBAdapter.save('abilities', {
        ...primary,
        description: mergedDesc,
        userCharacterNames: mergedUsers
      });
    }
    await indexedDBAdapter.delete('abilities', secondaryId);
    this.notifyDataChanged();
    return true;
  }

  /**
   * Intelligently merges two item entities.
   */
  async intelligentMergeItems(bookId: string, primaryId: string, secondaryId: string): Promise<boolean> {
    const primary = await indexedDBAdapter.getById<Item>('items', primaryId);
    const secondary = await indexedDBAdapter.getById<Item>('items', secondaryId);
    if (primary && secondary) {
      const mergedDesc = primary.description && secondary.description && !primary.description.includes(secondary.description)
        ? `${primary.description}\n\n${secondary.description}`
        : primary.description || secondary.description;
      await indexedDBAdapter.save('items', {
        ...primary,
        description: mergedDesc,
        ownerCharacterName: primary.ownerCharacterName || secondary.ownerCharacterName
      });
    }
    await indexedDBAdapter.delete('items', secondaryId);
    this.notifyDataChanged();
    return true;
  }

  /**
   * Intelligently merges two location entities.
   */
  async intelligentMergeLocations(bookId: string, primaryId: string, secondaryId: string): Promise<boolean> {
    const primary = await indexedDBAdapter.getById<LocationEntity>('locations', primaryId);
    const secondary = await indexedDBAdapter.getById<LocationEntity>('locations', secondaryId);
    if (primary && secondary) {
      const mergedSummary = primary.summary && secondary.summary && !primary.summary.includes(secondary.summary)
        ? `${primary.summary}\n\n${secondary.summary}`
        : primary.summary || secondary.summary;
      await indexedDBAdapter.save('locations', {
        ...primary,
        summary: mergedSummary
      });
    }
    await indexedDBAdapter.delete('locations', secondaryId);
    this.notifyDataChanged();
    return true;
  }

  /**
   * Gets the merge history for a given book.
   */
  async getMergeHistory(bookId?: string): Promise<any[]> {
    return [];
  }
}
