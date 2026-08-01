/**
 * @module StoryRepository
 * @description Facade for the NotterPad data store. Delegates calls to modular repositories.
 */

import {
  Book, Chapter, Character, Ability, Item, LocationEntity,
  Organization, Relationship, TimelineEvent, PlotThread,
  Foreshadowing, AIExtraction, StructuredExtractionJSON,
  DialogueFactEntity, EntityHistoryEvent
} from '@/types';
import { indexedDBAdapter } from '@/lib/storage/indexedDBAdapter';
import { isHighlySimilar } from '@/lib/ai/validator';
import { generateUUID } from './utils';

import { BookRepository } from './bookRepository';
import { ChapterRepository } from './chapterRepository';
import { CharacterRepository } from './characterRepository';
import { MergeEngine } from './mergeEngine';
import { AIExtractionRepository } from './aiExtractionRepository';

class StoryRepository {
  private notificationTimer: NodeJS.Timeout | null = null;

  private bookRepo: BookRepository;
  private chapterRepo: ChapterRepository;
  private charRepo: CharacterRepository;
  private mergeEngine: MergeEngine;
  private aiRepo: AIExtractionRepository;

  constructor() {
    const notifyFn = this.notifyDataChanged.bind(this);
    this.bookRepo = new BookRepository(notifyFn);
    this.chapterRepo = new ChapterRepository(notifyFn);
    this.charRepo = new CharacterRepository(notifyFn);
    this.mergeEngine = new MergeEngine(notifyFn);
    this.aiRepo = new AIExtractionRepository(notifyFn, this.chapterRepo);
  }

  private notifyDataChanged() {
    if (typeof window !== 'undefined') {
      if (this.notificationTimer) clearTimeout(this.notificationTimer);
      this.notificationTimer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('storybible_data_changed'));
      }, 150);
    }
  }

  // ==================== BOOK METHODS ====================
  async getBooks(): Promise<Book[]> { return this.bookRepo.getBooks(); }
  async getBook(id: string): Promise<Book | undefined> { return this.bookRepo.getBook(id); }
  async createBook(book: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'chapterCount' | 'totalWordCount'>): Promise<Book | null> { return this.bookRepo.createBook(book); }
  async updateBook(id: string, updates: Partial<Book>): Promise<boolean> { return this.bookRepo.updateBook(id, updates); }
  async toggleFavoriteBook(id: string, currentFav: boolean): Promise<boolean> { return this.bookRepo.toggleFavoriteBook(id, currentFav); }
  async archiveBook(id: string): Promise<boolean> { return this.bookRepo.archiveBook(id); }
  async restoreBook(id: string): Promise<boolean> { return this.bookRepo.restoreBook(id); }
  async deleteBook(id: string): Promise<boolean> { return this.bookRepo.deleteBook(id); }

  // ==================== CHAPTER METHODS ====================
  async getChapters(bookId: string): Promise<Chapter[]> { return this.chapterRepo.getChapters(bookId); }
  async getChapter(id: string): Promise<Chapter | undefined> { return this.chapterRepo.getChapter(id); }
  async createChapter(bookId: string, title: string, content: string, chapterNumber?: number): Promise<Chapter | null> { return this.chapterRepo.createChapter(bookId, title, content, chapterNumber); }
  async updateChapter(id: string, updates: Partial<Chapter>): Promise<boolean> { return this.chapterRepo.updateChapter(id, updates); }
  async deleteChapter(id: string): Promise<boolean> { return this.chapterRepo.deleteChapter(id); }

  // ==================== CHARACTER METHODS ====================
  async getCharacters(bookId: string): Promise<Character[]> { return this.charRepo.getCharacters(bookId); }
  async getCharacter(id: string): Promise<Character | undefined> { return this.charRepo.getCharacter(id); }
  async createCharacter(bookId: string, char: Partial<Character> & { name: string }): Promise<Character | null> { return this.charRepo.createCharacter(bookId, char); }
  async updateCharacter(id: string, updates: Partial<Character>): Promise<boolean> { return this.charRepo.updateCharacter(id, updates); }
  async deleteCharacter(id: string): Promise<boolean> { return this.charRepo.deleteCharacter(id); }
  async cleanExistingDuplicates(bookId: string): Promise<void> { return this.charRepo.cleanExistingDuplicates(bookId); }

  // ==================== ABILITY METHODS ====================
  async getAbilities(bookId: string): Promise<Ability[]> {
    return indexedDBAdapter.getAllByBookId<Ability>('abilities', bookId);
  }
  async createAbility(bookId: string, ability: Partial<Ability> & { name: string }): Promise<Ability | null> {
    const newAbility: Ability = {
      name: ability.name,
      description: ability.description || '',
      category: ability.category || 'Magic',
      userCharacterNames: ability.userCharacterNames || [],
      id: generateUUID(),
      bookId,
      createdAt: new Date().toISOString()
    };
    await indexedDBAdapter.save('abilities', newAbility);
    this.notifyDataChanged();
    return newAbility;
  }
  async updateAbility(id: string, updates: Partial<Ability>): Promise<boolean> {
    const existing = await indexedDBAdapter.getById<Ability>('abilities', id);
    if (!existing) return false;
    await indexedDBAdapter.save('abilities', { ...existing, ...updates });
    this.notifyDataChanged();
    return true;
  }
  async deleteAbility(id: string): Promise<boolean> {
    await indexedDBAdapter.delete('abilities', id);
    this.notifyDataChanged();
    return true;
  }

  // ==================== ITEM METHODS ====================
  async getItems(bookId: string): Promise<Item[]> {
    return indexedDBAdapter.getAllByBookId<Item>('items', bookId);
  }
  async createItem(bookId: string, item: Partial<Item> & { name: string }): Promise<Item | null> {
    const newItem: Item = {
      name: item.name,
      description: item.description || '',
      type: item.type || 'Artifact',
      ownerCharacterName: item.ownerCharacterName || '',
      currentLocationName: item.currentLocationName || '',
      status: item.status || 'Active',
      id: generateUUID(),
      bookId,
      appearedInChapterIds: item.appearedInChapterIds || [],
      createdAt: new Date().toISOString()
    };
    await indexedDBAdapter.save('items', newItem);
    this.notifyDataChanged();
    return newItem;
  }
  async updateItem(id: string, updates: Partial<Item>): Promise<boolean> {
    const existing = await indexedDBAdapter.getById<Item>('items', id);
    if (!existing) return false;
    await indexedDBAdapter.save('items', { ...existing, ...updates });
    this.notifyDataChanged();
    return true;
  }
  async deleteItem(id: string): Promise<boolean> {
    await indexedDBAdapter.delete('items', id);
    this.notifyDataChanged();
    return true;
  }

  // ==================== LOCATION METHODS ====================
  async getLocations(bookId: string): Promise<LocationEntity[]> {
    return indexedDBAdapter.getAllByBookId<LocationEntity>('locations', bookId);
  }
  async createLocation(bookId: string, loc: Partial<LocationEntity> & { name: string }): Promise<LocationEntity | null> {
    const newLoc: LocationEntity = {
      name: loc.name,
      summary: loc.summary || '',
      type: loc.type || 'City',
      id: generateUUID(),
      bookId,
      appearedInChapterIds: loc.appearedInChapterIds || [],
      eventsOccurred: loc.eventsOccurred || [],
      charactersPresentNames: loc.charactersPresentNames || [],
      createdAt: new Date().toISOString()
    };
    await indexedDBAdapter.save('locations', newLoc);
    this.notifyDataChanged();
    return newLoc;
  }
  async updateLocation(id: string, updates: Partial<LocationEntity>): Promise<boolean> {
    const existing = await indexedDBAdapter.getById<LocationEntity>('locations', id);
    if (!existing) return false;
    await indexedDBAdapter.save('locations', { ...existing, ...updates });
    this.notifyDataChanged();
    return true;
  }
  async deleteLocation(id: string): Promise<boolean> {
    await indexedDBAdapter.delete('locations', id);
    this.notifyDataChanged();
    return true;
  }

  // ==================== ORGANIZATION & RELATIONSHIP METHODS ====================
  async getOrganizations(bookId: string): Promise<Organization[]> {
    return indexedDBAdapter.getAllByBookId<Organization>('organizations', bookId);
  }
  async getRelationships(bookId: string): Promise<Relationship[]> {
    return indexedDBAdapter.getAllByBookId<Relationship>('relationships', bookId);
  }
  async addRelationship(bookId: string, char1: string, char2: string, type: string, description: string = ''): Promise<Relationship | null> {
    const newRel: Relationship = {
      id: generateUUID(),
      bookId,
      character1Name: char1,
      character2Name: char2,
      relationType: type,
      status: 'Active',
      description,
      createdAt: new Date().toISOString()
    };
    await indexedDBAdapter.save('relationships', newRel);
    this.notifyDataChanged();
    return newRel;
  }
  async deleteRelationship(id: string): Promise<boolean> {
    await indexedDBAdapter.delete('relationships', id);
    this.notifyDataChanged();
    return true;
  }

  // ==================== DIALOGUE FACTS & TIMELINE ====================
  async getDialogueFacts(bookId: string): Promise<DialogueFactEntity[]> {
    return indexedDBAdapter.getAllByBookId<DialogueFactEntity>('dialogue_facts', bookId);
  }
  async addDialogueFact(bookId: string, speaker: string, recipient: string, fact: string, factType: string): Promise<DialogueFactEntity | null> {
    const newDf: DialogueFactEntity = {
      id: generateUUID(),
      bookId,
      chapterId: '',
      chapterNumber: 1,
      speaker,
      recipient,
      fact,
      type: (factType as any) || 'Revelation',
      createdAt: new Date().toISOString()
    };
    await indexedDBAdapter.save('dialogue_facts', newDf);
    this.notifyDataChanged();
    return newDf;
  }
  async getTimelineEvents(bookId: string): Promise<TimelineEvent[]> {
    const events = await indexedDBAdapter.getAllByBookId<TimelineEvent>('timeline_events', bookId);
    return events.sort((a, b) => a.chapterNumber - b.chapterNumber);
  }
  async createTimelineEvent(bookId: string, event: Omit<TimelineEvent, 'id' | 'bookId' | 'createdAt'>): Promise<TimelineEvent | null> {
    const newEv: TimelineEvent = {
      ...event,
      id: generateUUID(),
      bookId,
      createdAt: new Date().toISOString()
    };
    await indexedDBAdapter.save('timeline_events', newEv);
    this.notifyDataChanged();
    return newEv;
  }
  async deleteTimelineEvent(id: string): Promise<boolean> {
    await indexedDBAdapter.delete('timeline_events', id);
    this.notifyDataChanged();
    return true;
  }

  // ==================== DUPLICATE DETECTION ====================
  async findDuplicateSuggestions(bookId: string): Promise<{ char1: Character; char2: Character; confidence: number; reason?: string }[]> {
    const chars = await this.getCharacters(bookId);
    const res: { char1: Character; char2: Character; confidence: number; reason?: string }[] = [];
    for (let i = 0; i < chars.length; i++) {
      for (let j = i + 1; j < chars.length; j++) {
        if (isHighlySimilar(chars[i].name, chars[j].name)) {
          res.push({ char1: chars[i], char2: chars[j], confidence: 0.92, reason: 'Name similarity' });
        }
      }
    }
    return res;
  }
  async findDuplicateAbilitySuggestions(bookId: string): Promise<{ item1: Ability; item2: Ability; confidence: number; reason?: string }[]> {
    const items = await this.getAbilities(bookId);
    const res: { item1: Ability; item2: Ability; confidence: number; reason?: string }[] = [];
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (isHighlySimilar(items[i].name, items[j].name)) {
          res.push({ item1: items[i], item2: items[j], confidence: 0.90, reason: 'Ability name similarity' });
        }
      }
    }
    return res;
  }
  async findDuplicateItemSuggestions(bookId: string): Promise<{ item1: Item; item2: Item; confidence: number; reason?: string }[]> {
    const items = await this.getItems(bookId);
    const res: { item1: Item; item2: Item; confidence: number; reason?: string }[] = [];
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (isHighlySimilar(items[i].name, items[j].name)) {
          res.push({ item1: items[i], item2: items[j], confidence: 0.90, reason: 'Item name similarity' });
        }
      }
    }
    return res;
  }
  async findDuplicateLocationSuggestions(bookId: string): Promise<{ item1: LocationEntity; item2: LocationEntity; confidence: number; reason?: string }[]> {
    const items = await this.getLocations(bookId);
    const res: { item1: LocationEntity; item2: LocationEntity; confidence: number; reason?: string }[] = [];
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (isHighlySimilar(items[i].name, items[j].name)) {
          res.push({ item1: items[i], item2: items[j], confidence: 0.90, reason: 'Location name similarity' });
        }
      }
    }
    return res;
  }

  // ==================== UNIVERSAL MERGE SYSTEM ====================
  async intelligentMergeCharacters(bookId: string, primaryId: string, secondaryId: string, textResolutionStrategy: 'keep_primary' | 'keep_secondary' | 'combine' = 'combine', auditNotes: string = ''): Promise<boolean> {
    return this.mergeEngine.intelligentMergeCharacters(bookId, primaryId, secondaryId, textResolutionStrategy, auditNotes);
  }
  async intelligentMergeAbilities(bookId: string, primaryId: string, secondaryId: string): Promise<boolean> {
    return this.mergeEngine.intelligentMergeAbilities(bookId, primaryId, secondaryId);
  }
  async intelligentMergeItems(bookId: string, primaryId: string, secondaryId: string): Promise<boolean> {
    return this.mergeEngine.intelligentMergeItems(bookId, primaryId, secondaryId);
  }
  async intelligentMergeLocations(bookId: string, primaryId: string, secondaryId: string): Promise<boolean> {
    return this.mergeEngine.intelligentMergeLocations(bookId, primaryId, secondaryId);
  }
  async getMergeHistory(bookId?: string): Promise<any[]> {
    return this.mergeEngine.getMergeHistory(bookId);
  }

  // ==================== LIVING STORY STATE RECONSTRUCTION ====================
  async getHistoricalStoryState(bookId: string, maxChapterNumber: number): Promise<{ characters: Character[]; abilities: Ability[]; items: Item[]; }> {
    const allChars = await this.getCharacters(bookId);
    const allAbilities = await this.getAbilities(bookId);
    const allItems = await this.getItems(bookId);

    const historicalChars = allChars.map(char => {
      const validApps = (char.chapterAppearances || []).filter(a => a.chapterNumber <= maxChapterNumber);
      const validProgression = (char.progressionHistory || []).filter(p => p.chapterNumber <= maxChapterNumber);
      const remappedAttrs: Record<string, string | number> = { ...(char.dynamicAttributes || {}) };

      validProgression.forEach(p => { remappedAttrs[p.attribute] = p.newValue; });
      const lastApp = validApps.length > 0 ? validApps[validApps.length - 1] : null;

      return {
        ...char,
        currentLocation: lastApp?.location || char.currentLocation,
        status: (lastApp?.statusInChapter as any) || char.status,
        goals: lastApp?.goals || char.goals,
        dynamicAttributes: remappedAttrs,
        chapterAppearances: validApps
      };
    });

    return { characters: historicalChars, abilities: allAbilities, items: allItems };
  }

  // ==================== AI EXTRACTION DRAFTS ====================
  async saveDraftExtraction(bookId: string, chapterId: string, extractionData: StructuredExtractionJSON): Promise<AIExtraction> {
    return this.aiRepo.saveDraftExtraction(bookId, chapterId, extractionData);
  }
  async saveAIExtractionDraft(bookId: string, chapterId: string, extractionData: StructuredExtractionJSON): Promise<AIExtraction> {
    return this.aiRepo.saveAIExtractionDraft(bookId, chapterId, extractionData);
  }
  async getExtractionForChapter(chapterId: string): Promise<AIExtraction | null> {
    return this.aiRepo.getExtractionForChapter(chapterId);
  }
  async getExtraction(id: string): Promise<AIExtraction | null> {
    return this.aiRepo.getExtraction(id);
  }
  async approveExtraction(extractionId: string): Promise<boolean> {
    return this.approveAndApplyExtraction(extractionId);
  }
  async approveExtractionGranular(extractionId: string, selections?: any, overrides?: any): Promise<boolean> {
    return this.approveAndApplyExtraction(extractionId);
  }
  async rejectExtraction(extractionId: string): Promise<boolean> {
    return this.aiRepo.rejectExtraction(extractionId);
  }

  async approveAndApplyExtraction(extractionId: string): Promise<boolean> {
    const draft = await indexedDBAdapter.getById<AIExtraction>('ai_extractions', extractionId);
    if (!draft || !draft.extraction) return false;

    await this.applyExtractionData(draft.bookId, draft.extraction);

    if (draft.chapterId) {
      await this.chapterRepo.updateChapter(draft.chapterId, { status: 'Analyzed' });
    }

    draft.status = 'Approved';
    await indexedDBAdapter.save('ai_extractions', draft);
    this.notifyDataChanged();
    return true;
  }

  /**
   * Applies structured extraction JSON data directly into the Story Bible database.
   * Handles both camelCase and snake_case formats.
   */
  async applyExtractionData(bookId: string, rawData: any): Promise<boolean> {
    if (!rawData) return false;
    const data = rawData;

    // 1. Characters
    const chars = data.characters || data.new_characters || [];
    for (const c of chars) {
      const knownFacts = c.knownFacts || c.known_facts || c.facts || [];
      const explicitAppearanceFacts = c.explicitAppearanceFacts || c.explicit_appearance_facts || c.appearance || [];
      const dynamicAttributes = c.dynamicAttributes || c.dynamic_attributes || c.attributes || {};
      const progressionChanges = c.progressionHistory || c.progression_changes || c.progressionChanges || [];

      await this.createCharacter(bookId, {
        name: c.name,
        aliases: c.aliases || c.alternateNames || c.alternate_names || [],
        summary: c.summary || c.description || '',
        status: c.status || 'Active',
        occupation: c.occupation || c.job || undefined,
        currentLocation: c.location || c.currentLocation || c.current_location || undefined,
        emotionalState: c.emotional_state || c.emotionalState || undefined,
        clothing: c.clothing || undefined,
        goals: c.goals || undefined,
        knownFacts,
        explicitAppearanceFacts,
        dynamicAttributes,
        progressionHistory: progressionChanges.map((p: any) => ({
          id: generateUUID(),
          chapterNumber: p.chapterNumber || p.chapter_number || 1,
          attribute: p.attribute,
          oldValue: p.oldValue || p.old_value || '',
          newValue: p.newValue || p.new_value || '',
          reason: p.reason || ''
        }))
      });
    }

    // 2. Abilities
    const abilities = data.abilities || [];
    for (const a of abilities) {
      await this.createAbility(bookId, {
        name: a.name,
        description: a.description || '',
        category: (a.category as any) || 'Active',
        userCharacterNames: a.userCharacterNames || a.users || []
      });
    }

    // 3. Items
    const items = data.items || [];
    for (const i of items) {
      await this.createItem(bookId, {
        name: i.name,
        description: i.description || '',
        type: (i.type as any) || 'Artifact',
        ownerCharacterName: i.ownerCharacterName || i.owner || '',
        previousOwnerName: i.previousOwnerName || i.previous_owner || undefined,
        status: i.status || 'Active'
      });
    }

    // 4. Locations
    const locations = data.locations || [];
    for (const l of locations) {
      await this.createLocation(bookId, {
        name: l.name,
        summary: l.summary || l.description || '',
        type: l.type || 'Residence'
      });
    }

    // 5. Relationships
    const relationships = data.relationships || data.relationship_changes || [];
    for (const r of relationships) {
      const char1 = r.character1Name || r.character1 || r.char1 || '';
      const char2 = r.character2Name || r.character2 || r.char2 || '';
      const relType = r.relationType || r.relation_type || r.type || 'Friends';
      const desc = r.description || '';
      if (char1 && char2) {
        await this.addRelationship(bookId, char1, char2, relType, desc);
      }
    }

    // 6. Dialogue Facts
    const dialogueFacts = data.dialogueFacts || data.dialogue_facts || [];
    for (const df of dialogueFacts) {
      const speaker = df.speaker || '';
      const recipient = df.recipient || '';
      const fact = df.fact || '';
      const factType = df.factType || df.fact_type || df.type || 'Revelation';
      if (speaker && fact) {
        await this.addDialogueFact(bookId, speaker, recipient, fact, factType);
      }
    }

    this.notifyDataChanged();
    return true;
  }
}

export const repository = new StoryRepository();
