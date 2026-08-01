/**
 * @module StorageConstants
 * @description Constants for storage keys, including IndexedDB stores and LocalStorage keys.
 */

/**
 * The name of the IndexedDB database.
 */
export const NotterDB = 'notter_pad_db';

/**
 * IndexedDB store names used in the application.
 */
export const STORES = {
  BOOKS: 'books',
  CHAPTERS: 'chapters',
  CHARACTERS: 'characters',
  ABILITIES: 'abilities',
  ITEMS: 'items',
  LOCATIONS: 'locations',
  ORGANIZATIONS: 'organizations',
  RELATIONSHIPS: 'relationships',
  DIALOGUE_FACTS: 'dialogue_facts',
  TIMELINE_EVENTS: 'timeline_events',
  AI_EXTRACTIONS: 'ai_extractions',
  BLOBS: 'blobs',
} as const;

/**
 * Keys used for persisting data in LocalStorage.
 */
export const LOCAL_STORAGE_KEYS = {
  THEME: 'notter_theme',
  EDITOR_PREFS: 'notter_editor_prefs',
  BYOK_KEYS: 'notter_byok_keys',
  SPRINT_SESSIONS: 'notter_sprint_sessions',
} as const;
