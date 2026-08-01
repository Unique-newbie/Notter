import { repository } from '@/lib/store/repository';

export class MergeService {
  static async mergeCharacters(primaryId: string, secondaryId: string, overrides?: any): Promise<boolean> {
    return repository.intelligentMergeCharacters(primaryId, secondaryId, overrides);
  }

  static async mergeAbilities(primaryId: string, secondaryId: string, overrides?: any): Promise<boolean> {
    return repository.intelligentMergeAbilities(primaryId, secondaryId, overrides);
  }

  static async mergeItems(primaryId: string, secondaryId: string, overrides?: any): Promise<boolean> {
    return repository.intelligentMergeItems(primaryId, secondaryId, overrides);
  }

  static async mergeLocations(primaryId: string, secondaryId: string, overrides?: any): Promise<boolean> {
    return repository.intelligentMergeLocations(primaryId, secondaryId, overrides);
  }

  static async getMergeHistory(): Promise<any[]> {
    return repository.getMergeHistory();
  }
}
