/**
 * @module CharacterRepository
 * @description Handles CRUD operations for characters, aliases, and appearance facts.
 */

import { Character } from '@/types';
import { indexedDBAdapter } from '@/lib/storage/indexedDBAdapter';
import { generateUUID } from './utils';

export class CharacterRepository {
  private notifyDataChanged: () => void;

  /**
   * @param notifyFn - Function to trigger a UI update when data changes.
   */
  constructor(notifyFn: () => void) {
    this.notifyDataChanged = notifyFn;
  }

  /**
   * Gets all characters for a given book.
   * @param {string} bookId - The book ID.
   * @returns {Promise<Character[]>} Array of characters.
   */
  async getCharacters(bookId: string): Promise<Character[]> {
    return indexedDBAdapter.getAllByBookId<Character>('characters', bookId);
  }

  /**
   * Gets a specific character by ID.
   * @param {string} id - The character ID.
   * @returns {Promise<Character | undefined>} The character or undefined.
   */
  async getCharacter(id: string): Promise<Character | undefined> {
    return indexedDBAdapter.getById<Character>('characters', id);
  }

  /**
   * Creates a new character or merges into an existing character if one with the same name already exists.
   * @param {string} bookId - The book ID.
   * @param {Partial<Character> & { name: string }} char - The character data.
   * @returns {Promise<Character | null>} The created or updated character.
   */
  async createCharacter(
    bookId: string,
    char: Partial<Character> & { name: string }
  ): Promise<Character | null> {
    const existingList = await this.getCharacters(bookId);
    const trimmedName = char.name.trim().toLowerCase();
    const existing = existingList.find(c => c.name.trim().toLowerCase() === trimmedName);

    if (existing) {
      const mergedSummary = char.summary
        ? (existing.summary && !existing.summary.includes(char.summary) ? `${existing.summary}\n\n${char.summary}` : existing.summary || char.summary)
        : existing.summary;

      const mergedFacts = Array.from(new Set([...(existing.knownFacts || []), ...(char.knownFacts || [])]));
      const mergedAppearance = Array.from(new Set([...(existing.explicitAppearanceFacts || []), ...(char.explicitAppearanceFacts || [])]));
      const mergedAliases = Array.from(new Set([...(existing.aliases || []), ...(char.aliases || [])]));
      const mergedAttrs = { ...(existing.dynamicAttributes || {}), ...(char.dynamicAttributes || {}) };

      const updated: Character = {
        ...existing,
        summary: mergedSummary,
        knownFacts: mergedFacts,
        explicitAppearanceFacts: mergedAppearance,
        aliases: mergedAliases,
        dynamicAttributes: mergedAttrs,
        status: char.status || existing.status,
        occupation: char.occupation || existing.occupation,
        currentLocation: char.currentLocation || existing.currentLocation,
        species: char.species || existing.species,
        level: char.level || existing.level,
        className: char.className || existing.className,
        updatedAt: new Date().toISOString()
      };

      await indexedDBAdapter.save('characters', updated);
      this.notifyDataChanged();
      return updated;
    }

    const newChar: Character = {
      name: char.name,
      aliases: char.aliases || [],
      summary: char.summary || '',
      status: char.status || 'Active',
      knownFacts: char.knownFacts || [],
      explicitAppearanceFacts: char.explicitAppearanceFacts || [],
      dynamicAttributes: char.dynamicAttributes || {},
      id: generateUUID(),
      bookId,
      appearedInChapterIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await indexedDBAdapter.save('characters', newChar);
    this.notifyDataChanged();
    return newChar;
  }

  /**
   * Cleans existing duplicate characters, abilities, items, and locations in a book by merging identical names.
   * @param {string} bookId - The book ID.
   */
  async cleanExistingDuplicates(bookId: string): Promise<void> {
    // Clean Duplicate Characters
    const list = await this.getCharacters(bookId);
    const nameMap = new Map<string, Character[]>();

    for (const c of list) {
      const key = c.name.trim().toLowerCase();
      if (!nameMap.has(key)) nameMap.set(key, []);
      nameMap.get(key)!.push(c);
    }

    for (const [, group] of nameMap.entries()) {
      if (group.length > 1) {
        const primary = group[0];
        for (let i = 1; i < group.length; i++) {
          const secondary = group[i];
          primary.summary = primary.summary && secondary.summary && !primary.summary.includes(secondary.summary)
            ? `${primary.summary}\n\n${secondary.summary}`
            : primary.summary || secondary.summary;
          primary.knownFacts = Array.from(new Set([...(primary.knownFacts || []), ...(secondary.knownFacts || [])]));
          primary.explicitAppearanceFacts = Array.from(new Set([...(primary.explicitAppearanceFacts || []), ...(secondary.explicitAppearanceFacts || [])]));
          primary.aliases = Array.from(new Set([...(primary.aliases || []), secondary.name, ...(secondary.aliases || [])]));
          primary.dynamicAttributes = { ...(primary.dynamicAttributes || {}), ...(secondary.dynamicAttributes || {}) };

          // Re-link items, abilities, relationships, and dialogue facts from secondary name to primary name
          try {
            const allItems = await indexedDBAdapter.getAllByBookId<any>('items', bookId);
            for (const item of allItems) {
              if (item.ownerCharacterName === secondary.name) {
                await indexedDBAdapter.save('items', { ...item, ownerCharacterName: primary.name });
              }
            }
            const allAbilities = await indexedDBAdapter.getAllByBookId<any>('abilities', bookId);
            for (const ab of allAbilities) {
              if (ab.userCharacterNames?.includes(secondary.name)) {
                const updatedUsers = Array.from(new Set(ab.userCharacterNames.map((u: string) => u === secondary.name ? primary.name : u)));
                await indexedDBAdapter.save('abilities', { ...ab, userCharacterNames: updatedUsers });
              }
            }
            const allRels = await indexedDBAdapter.getAllByBookId<any>('relationships', bookId);
            for (const rel of allRels) {
              let updated = false;
              let c1 = rel.character1Name;
              let c2 = rel.character2Name;
              if (c1 === secondary.name) { c1 = primary.name; updated = true; }
              if (c2 === secondary.name) { c2 = primary.name; updated = true; }
              if (updated) {
                await indexedDBAdapter.save('relationships', { ...rel, character1Name: c1, character2Name: c2 });
              }
            }
            const allDfs = await indexedDBAdapter.getAllByBookId<any>('dialogue_facts', bookId);
            for (const df of allDfs) {
              let updated = false;
              let spk = df.speaker;
              let rec = df.recipient;
              if (spk === secondary.name) { spk = primary.name; updated = true; }
              if (rec === secondary.name) { rec = primary.name; updated = true; }
              if (updated) {
                await indexedDBAdapter.save('dialogue_facts', { ...df, speaker: spk, recipient: rec });
              }
            }
          } catch (e) { /* ignore */ }

          await indexedDBAdapter.delete('characters', secondary.id);
        }
        await indexedDBAdapter.save('characters', primary);
      }
    }

    // Clean Duplicate Abilities
    try {
      const abilities = await indexedDBAdapter.getAllByBookId<any>('abilities', bookId);
      const abiMap = new Map<string, any[]>();
      for (const a of abilities) {
        const key = a.name.trim().toLowerCase();
        if (!abiMap.has(key)) abiMap.set(key, []);
        abiMap.get(key)!.push(a);
      }
      for (const [, group] of abiMap.entries()) {
        if (group.length > 1) {
          const primary = group[0];
          for (let i = 1; i < group.length; i++) {
            const secondary = group[i];
            primary.description = primary.description && secondary.description && !primary.description.includes(secondary.description)
              ? `${primary.description}\n\n${secondary.description}`
              : primary.description || secondary.description;
            primary.userCharacterNames = Array.from(new Set([...(primary.userCharacterNames || []), ...(secondary.userCharacterNames || [])]));
            await indexedDBAdapter.delete('abilities', secondary.id);
          }
          await indexedDBAdapter.save('abilities', primary);
        }
      }
    } catch (e) { /* ignore */ }

    // Clean Duplicate Items
    try {
      const items = await indexedDBAdapter.getAllByBookId<any>('items', bookId);
      const itemMap = new Map<string, any[]>();
      for (const item of items) {
        const key = item.name.trim().toLowerCase();
        if (!itemMap.has(key)) itemMap.set(key, []);
        itemMap.get(key)!.push(item);
      }
      for (const [, group] of itemMap.entries()) {
        if (group.length > 1) {
          const primary = group[0];
          for (let i = 1; i < group.length; i++) {
            const secondary = group[i];
            primary.description = primary.description && secondary.description && !primary.description.includes(secondary.description)
              ? `${primary.description}\n\n${secondary.description}`
              : primary.description || secondary.description;
            primary.ownerCharacterName = primary.ownerCharacterName || secondary.ownerCharacterName;
            await indexedDBAdapter.delete('items', secondary.id);
          }
          await indexedDBAdapter.save('items', primary);
        }
      }
    } catch (e) { /* ignore */ }

    // Clean Duplicate Locations
    try {
      const locations = await indexedDBAdapter.getAllByBookId<any>('locations', bookId);
      const locMap = new Map<string, any[]>();
      for (const loc of locations) {
        const key = loc.name.trim().toLowerCase();
        if (!locMap.has(key)) locMap.set(key, []);
        locMap.get(key)!.push(loc);
      }
      for (const [, group] of locMap.entries()) {
        if (group.length > 1) {
          const primary = group[0];
          for (let i = 1; i < group.length; i++) {
            const secondary = group[i];
            primary.summary = primary.summary && secondary.summary && !primary.summary.includes(secondary.summary)
              ? `${primary.summary}\n\n${secondary.summary}`
              : primary.summary || secondary.summary;
            await indexedDBAdapter.delete('locations', secondary.id);
          }
          await indexedDBAdapter.save('locations', primary);
        }
      }
    } catch (e) { /* ignore */ }

    this.notifyDataChanged();
  }

  /**
   * Updates an existing character.
   * @param {string} id - The character ID.
   * @param {Partial<Character>} updates - The data to update.
   * @returns {Promise<boolean>} True if successful.
   */
  async updateCharacter(id: string, updates: Partial<Character>): Promise<boolean> {
    const existing = await indexedDBAdapter.getById<Character>('characters', id);
    if (!existing) return false;

    const updated: Character = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await indexedDBAdapter.save('characters', updated);
    this.notifyDataChanged();
    return true;
  }

  /**
   * Deletes a character by ID.
   * @param {string} id - The character ID.
   * @returns {Promise<boolean>} True if successful.
   */
  async deleteCharacter(id: string): Promise<boolean> {
    await indexedDBAdapter.delete('characters', id);
    this.notifyDataChanged();
    return true;
  }
}
