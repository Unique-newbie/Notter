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
   * Creates a new character.
   * @param {string} bookId - The book ID.
   * @param {Partial<Character> & { name: string }} char - The character data.
   * @returns {Promise<Character | null>} The created character.
   */
  async createCharacter(
    bookId: string,
    char: Partial<Character> & { name: string }
  ): Promise<Character | null> {
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
