/**
 * @module BookRepository
 * @description Handles CRUD operations for books, including cascading deletions across stores.
 */

import { Book } from '@/types';
import { indexedDBAdapter } from '@/lib/storage/indexedDBAdapter';
import { generateUUID } from './utils';

export class BookRepository {
  private notifyDataChanged: () => void;

  /**
   * @param notifyFn - Function to trigger a UI update when data changes.
   */
  constructor(notifyFn: () => void) {
    this.notifyDataChanged = notifyFn;
  }

  /**
   * Gets all books, including favorite status from localStorage.
   * @returns {Promise<Book[]>} Array of books.
   */
  async getBooks(): Promise<Book[]> {
    try {
      const books = await indexedDBAdapter.getAll<Book>('books');
      let favIds: string[] = [];
      if (typeof window !== 'undefined') {
        try { favIds = JSON.parse(localStorage.getItem('notter_fav_books') || '[]'); } catch (e) {}
      }

      return books.map(b => ({
        ...b,
        isFavorite: favIds.includes(b.id)
      }));
    } catch (e) {
      return [];
    }
  }

  /**
   * Gets a specific book by ID.
   * @param {string} id - The book ID.
   * @returns {Promise<Book | undefined>} The book or undefined.
   */
  async getBook(id: string): Promise<Book | undefined> {
    try {
      return await indexedDBAdapter.getById<Book>('books', id);
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Creates a new book.
   * @param {Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'chapterCount' | 'totalWordCount'>} book - The book data.
   * @returns {Promise<Book | null>} The created book.
   */
  async createBook(book: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'chapterCount' | 'totalWordCount'>): Promise<Book | null> {
    const newBook: Book = {
      id: generateUUID(),
      title: book.title,
      description: book.description || '',
      coverColor: book.coverColor || '#7C3AED',
      coverUrl: book.coverUrl,
      genre: book.genre || 'Fantasy',
      status: book.status || 'Drafting',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await indexedDBAdapter.save('books', newBook);
    this.notifyDataChanged();
    return newBook;
  }

  /**
   * Updates an existing book.
   * @param {string} id - The book ID.
   * @param {Partial<Book>} updates - The data to update.
   * @returns {Promise<boolean>} True if successful.
   */
  async updateBook(id: string, updates: Partial<Book>): Promise<boolean> {
    const existing = await this.getBook(id);
    if (!existing) return false;

    const updated: Book = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await indexedDBAdapter.save('books', updated);
    this.notifyDataChanged();
    return true;
  }

  /**
   * Toggles the favorite status of a book.
   * @param {string} id - The book ID.
   * @param {boolean} currentFav - The current favorite status.
   * @returns {Promise<boolean>} True if successful.
   */
  async toggleFavoriteBook(id: string, currentFav: boolean): Promise<boolean> {
    if (typeof window !== 'undefined') {
      const favs = JSON.parse(localStorage.getItem('notter_fav_books') || '[]');
      let nextFavs = [];
      if (currentFav) {
        nextFavs = favs.filter((fId: string) => fId !== id);
      } else {
        nextFavs = [...favs, id];
      }
      localStorage.setItem('notter_fav_books', JSON.stringify(nextFavs));
    }
    this.notifyDataChanged();
    return true;
  }

  /**
   * Archives a book.
   * @param {string} id - The book ID.
   * @returns {Promise<boolean>} True if successful.
   */
  async archiveBook(id: string): Promise<boolean> {
    return this.updateBook(id, { status: 'Archived' });
  }

  /**
   * Restores a book from archive.
   * @param {string} id - The book ID.
   * @returns {Promise<boolean>} True if successful.
   */
  async restoreBook(id: string): Promise<boolean> {
    return this.updateBook(id, { status: 'Drafting' });
  }

  /**
   * Deletes a book and all associated entities (cascade delete).
   * @param {string} id - The book ID.
   * @returns {Promise<boolean>} True if successful.
   */
  async deleteBook(id: string): Promise<boolean> {
    const storesToCascade = [
      'chapters', 'characters', 'abilities', 'items',
      'locations', 'organizations', 'relationships',
      'dialogue_facts', 'timeline_events', 'ai_extractions'
    ];

    for (const storeName of storesToCascade) {
      await indexedDBAdapter.deleteAllByBookId(storeName as any, id);
    }

    await indexedDBAdapter.delete('books', id);

    if (typeof window !== 'undefined') {
      try {
        const favs = JSON.parse(localStorage.getItem('notter_fav_books') || '[]');
        const updatedFavs = favs.filter((fId: string) => fId !== id);
        localStorage.setItem('notter_fav_books', JSON.stringify(updatedFavs));
      } catch (e) {}
    }

    this.notifyDataChanged();
    return true;
  }
}
