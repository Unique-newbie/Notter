/**
 * Notter 2.0 Native IndexedDB Storage Adapter
 * High-performance, 100% offline-first local persistence engine.
 */

const DB_NAME = 'notter_offline_db';
const DB_VERSION = 1;

export class IndexedDBAdapter {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('IndexedDB unavailable in SSR context'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create Object Stores if they do not exist
        const stores = [
          'books',
          'chapters',
          'characters',
          'abilities',
          'items',
          'locations',
          'organizations',
          'relationships',
          'dialogue_facts',
          'timeline_events',
          'blobs',
          'settings',
          'ai_extractions'
        ];

        stores.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            if (storeName === 'blobs' || storeName === 'settings') {
              db.createObjectStore(storeName, { keyPath: 'id' });
            } else {
              const store = db.createObjectStore(storeName, { keyPath: 'id' });
              if (storeName !== 'books' && storeName !== 'settings') {
                store.createIndex('bookId', 'bookId', { unique: false });
              }
            }
          }
        });
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // Generic Get All Records
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic Get By BookId Index
  async getAllByBookId<T>(storeName: string, bookId: string): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      if (!store.indexNames.contains('bookId')) {
        const request = store.getAll();
        request.onsuccess = () => {
          const list = (request.result || []).filter((item: any) => item.bookId === bookId);
          resolve(list);
        };
        request.onerror = () => reject(request.error);
        return;
      }
      const index = store.index('bookId');
      const request = index.getAll(bookId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Delete All Records matching a Book ID
  async deleteAllByBookId(storeName: string, bookId: string): Promise<number> {
    const items = await this.getAllByBookId<{ id: string }>(storeName, bookId);
    let count = 0;
    for (const item of items) {
      if (item.id) {
        await this.delete(storeName, item.id);
        count++;
      }
    }
    return count;
  }

  // Generic Get Single Item by Primary Key
  async getById<T>(storeName: string, id: string): Promise<T | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || undefined);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic Save / Upsert
  async save<T extends { id: string }>(storeName: string, data: T): Promise<T> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic Delete
  async delete(storeName: string, id: string): Promise<boolean> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // Blob Binary Storage (Covers & Avatars)
  async saveBlob(id: string, blob: Blob): Promise<string> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('blobs', 'readwrite');
      const store = tx.objectStore('blobs');
      const request = store.put({ id, blob, createdAt: new Date().toISOString() });
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getBlob(id: string): Promise<Blob | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('blobs', 'readonly');
      const store = tx.objectStore('blobs');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result?.blob);
      request.onerror = () => reject(request.error);
    });
  }

  // Export Single Book & All Associated Entities JSON
  async exportSingleBookJSON(bookId: string): Promise<string> {
    const book = await this.getById('books', bookId);
    if (!book) throw new Error('Book not found');

    const entityStores = [
      'chapters', 'characters', 'abilities', 'items',
      'locations', 'organizations', 'relationships',
      'dialogue_facts', 'timeline_events', 'ai_extractions'
    ];

    const bookData: Record<string, any[]> = {};
    for (const storeName of entityStores) {
      bookData[storeName] = await this.getAllByBookId(storeName, bookId);
    }

    return JSON.stringify({
      version: '2.0-single-book',
      exportedAt: new Date().toISOString(),
      book,
      data: bookData
    }, null, 2);
  }

  // Import Single Book JSON
  async importSingleBookJSON(jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.book || !parsed.book.id) return false;

      await this.save('books', parsed.book);

      if (parsed.data) {
        for (const [storeName, items] of Object.entries(parsed.data)) {
          if (Array.isArray(items)) {
            for (const item of items) {
              await this.save(storeName, item);
            }
          }
        }
      }
      return true;
    } catch (e) {
      console.error('[IndexedDB] Single book import failed:', e);
      return false;
    }
  }

  // Export Complete Workspace JSON
  async exportFullWorkspaceJSON(): Promise<string> {
    const stores = [
      'books', 'chapters', 'characters', 'abilities',
      'items', 'locations', 'organizations', 'relationships',
      'dialogue_facts', 'timeline_events', 'settings'
    ];

    const exportData: Record<string, any[]> = {};
    for (const storeName of stores) {
      exportData[storeName] = await this.getAll(storeName);
    }

    return JSON.stringify({
      version: '2.0-offline',
      exportedAt: new Date().toISOString(),
      data: exportData
    }, null, 2);
  }

  // Import Complete Workspace JSON
  async importFullWorkspaceJSON(jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data) return false;

      const db = await this.getDB();
      for (const [storeName, items] of Object.entries(parsed.data)) {
        if (Array.isArray(items) && db.objectStoreNames.contains(storeName)) {
          for (const item of items) {
            await this.save(storeName, item);
          }
        }
      }
      return true;
    } catch (e) {
      console.error('[IndexedDB] Import failed:', e);
      return false;
    }
  }
}

export const indexedDBAdapter = new IndexedDBAdapter();
