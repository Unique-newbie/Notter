import { repository } from '@/lib/store/repository';
import { Book, Chapter } from '@/types';

export class BookService {
  static async getBooks(): Promise<Book[]> {
    return repository.getBooks();
  }

  static async getBook(id: string): Promise<Book | undefined> {
    return repository.getBook(id);
  }

  static async createBook(book: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'chapterCount' | 'totalWordCount'>): Promise<Book | null> {
    return repository.createBook(book);
  }

  static async updateBook(id: string, updates: Partial<Book>): Promise<boolean> {
    return repository.updateBook(id, updates);
  }

  static async deleteBook(id: string): Promise<boolean> {
    return repository.deleteBook(id);
  }

  static async getChapters(bookId: string): Promise<Chapter[]> {
    return repository.getChapters(bookId);
  }

  static async createChapter(bookId: string, title: string = 'New Chapter', content: string = ''): Promise<Chapter | null> {
    return repository.createChapter(bookId, title, content);
  }

  static async updateChapter(id: string, updates: Partial<Chapter>): Promise<boolean> {
    return repository.updateChapter(id, updates);
  }

  static async deleteChapter(id: string): Promise<boolean> {
    return repository.deleteChapter(id);
  }
}
