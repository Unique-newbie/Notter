import { repository } from '@/lib/store/repository';
import { Character } from '@/types';

export class CharacterService {
  static async getCharacters(bookId: string): Promise<Character[]> {
    return repository.getCharacters(bookId);
  }

  static async getCharacter(id: string): Promise<Character | undefined> {
    return repository.getCharacter(id);
  }

  static async createCharacter(
    bookId: string,
    character: Omit<Character, 'id' | 'bookId' | 'createdAt' | 'appearedInChapterIds'>
  ): Promise<Character | null> {
    return repository.createCharacter(bookId, character);
  }

  static async updateCharacter(id: string, updates: Partial<Character>): Promise<boolean> {
    return repository.updateCharacter(id, updates);
  }

  static async deleteCharacter(id: string): Promise<boolean> {
    return repository.deleteCharacter(id);
  }

  static async toggleCanonLock(characterId: string): Promise<boolean> {
    const char = await repository.getCharacter(characterId);
    if (!char) return false;
    const isLocked = !char.isLocked;
    await repository.updateCharacter(characterId, { isLocked });
    return isLocked;
  }
}
