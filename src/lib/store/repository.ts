import {
  Book, Chapter, Character, Ability, Item, LocationEntity,
  Organization, Relationship, TimelineEvent, PlotThread,
  Foreshadowing, AIExtraction, StructuredExtractionJSON,
  DialogueFactEntity, EntityHistoryEvent
} from '@/types';
import { indexedDBAdapter } from '@/lib/storage/indexedDBAdapter';
import { isHighlySimilar } from '@/lib/ai/validator';

function isValidUUID(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

class StoryRepository {
  private notificationTimer: NodeJS.Timeout | null = null;

  private notifyDataChanged() {
    if (typeof window !== 'undefined') {
      if (this.notificationTimer) clearTimeout(this.notificationTimer);
      this.notificationTimer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('storybible_data_changed'));
      }, 150);
    }
  }

  // ==================== BOOK METHODS ====================

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

  async getBook(id: string): Promise<Book | undefined> {
    try {
      return await indexedDBAdapter.getById<Book>('books', id);
    } catch (e) {
      return undefined;
    }
  }

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

  async archiveBook(id: string): Promise<boolean> {
    return this.updateBook(id, { status: 'Archived' });
  }

  async restoreBook(id: string): Promise<boolean> {
    return this.updateBook(id, { status: 'Drafting' });
  }

  async deleteBook(id: string): Promise<boolean> {
    const storesToCascade = [
      'chapters', 'characters', 'abilities', 'items',
      'locations', 'organizations', 'relationships',
      'dialogue_facts', 'timeline_events', 'ai_extractions'
    ];

    for (const storeName of storesToCascade) {
      await indexedDBAdapter.deleteAllByBookId(storeName, id);
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

  // ==================== CHAPTER METHODS ====================

  async getChapters(bookId: string): Promise<Chapter[]> {
    try {
      const chapters = await indexedDBAdapter.getAllByBookId<Chapter>('chapters', bookId);
      return chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
    } catch (e) {
      return [];
    }
  }

  async getChapter(id: string): Promise<Chapter | undefined> {
    return indexedDBAdapter.getById<Chapter>('chapters', id);
  }

  async createChapter(bookId: string, title: string, content: string, chapterNumber?: number): Promise<Chapter | null> {
    const existingChaps = await this.getChapters(bookId);
    const nextNum = chapterNumber || (existingChaps.length > 0 ? Math.max(...existingChaps.map(c => c.chapterNumber)) + 1 : 1);
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

    const newChap: Chapter = {
      id: generateUUID(),
      bookId,
      title: title || `Chapter ${nextNum}`,
      chapterNumber: nextNum,
      content: content || '',
      wordCount,
      readingTimeMinutes: Math.max(1, Math.ceil(wordCount / 225)),
      status: 'Unprocessed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await indexedDBAdapter.save('chapters', newChap);
    this.notifyDataChanged();
    return newChap;
  }

  async updateChapter(id: string, updates: Partial<Chapter>): Promise<boolean> {
    const existing = await indexedDBAdapter.getById<Chapter>('chapters', id);
    if (!existing) return false;

    const wordCount = updates.content !== undefined 
      ? (updates.content.trim() ? updates.content.trim().split(/\s+/).length : 0)
      : existing.wordCount;

    const updated: Chapter = {
      ...existing,
      ...updates,
      wordCount,
      readingTimeMinutes: Math.max(1, Math.ceil(wordCount / 225)),
      updatedAt: new Date().toISOString()
    };

    await indexedDBAdapter.save('chapters', updated);
    this.notifyDataChanged();
    return true;
  }

  async deleteChapter(id: string): Promise<boolean> {
    await indexedDBAdapter.delete('chapters', id);
    this.notifyDataChanged();
    return true;
  }

  // ==================== ENTITY GETTERS & CREATORS ====================

  async getCharacters(bookId: string): Promise<Character[]> {
    return indexedDBAdapter.getAllByBookId<Character>('characters', bookId);
  }

  async getCharacter(id: string): Promise<Character | undefined> {
    return indexedDBAdapter.getById<Character>('chapters', id);
  }

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

  async deleteCharacter(id: string): Promise<boolean> {
    await indexedDBAdapter.delete('characters', id);
    this.notifyDataChanged();
    return true;
  }

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
    const updated = { ...existing, ...updates };
    await indexedDBAdapter.save('abilities', updated);
    this.notifyDataChanged();
    return true;
  }

  async deleteAbility(id: string): Promise<boolean> {
    await indexedDBAdapter.delete('abilities', id);
    this.notifyDataChanged();
    return true;
  }

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
    const updated = { ...existing, ...updates };
    await indexedDBAdapter.save('items', updated);
    this.notifyDataChanged();
    return true;
  }

  async deleteItem(id: string): Promise<boolean> {
    await indexedDBAdapter.delete('items', id);
    this.notifyDataChanged();
    return true;
  }

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
    const updated = { ...existing, ...updates };
    await indexedDBAdapter.save('locations', updated);
    this.notifyDataChanged();
    return true;
  }

  async deleteLocation(id: string): Promise<boolean> {
    await indexedDBAdapter.delete('locations', id);
    this.notifyDataChanged();
    return true;
  }

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

  async getDialogueFacts(bookId: string): Promise<DialogueFactEntity[]> {
    return indexedDBAdapter.getAllByBookId<DialogueFactEntity>('dialogue_facts', bookId);
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

  async intelligentMergeCharacters(
    bookId: string,
    primaryId: string,
    secondaryId: string,
    textResolutionStrategy: 'keep_primary' | 'keep_secondary' | 'combine' = 'combine',
    auditNotes: string = ''
  ): Promise<boolean> {
    const primary = await this.getCharacter(primaryId);
    const secondary = await this.getCharacter(secondaryId);
    if (!primary || !secondary) return false;

    let mergedSummary = primary.summary;
    if (textResolutionStrategy === 'keep_secondary') mergedSummary = secondary.summary;
    if (textResolutionStrategy === 'combine') mergedSummary = `${primary.summary}\n\n${secondary.summary}`.trim();

    const mergedKnownFacts = Array.from(new Set([...(primary.knownFacts || []), ...(secondary.knownFacts || [])]));
    const mergedAppearanceFacts = Array.from(new Set([...(primary.explicitAppearanceFacts || []), ...(secondary.explicitAppearanceFacts || [])]));
    const mergedAliases = Array.from(new Set([...(primary.aliases || []), secondary.name, ...(secondary.aliases || [])]));

    await this.updateCharacter(primaryId, {
      summary: mergedSummary,
      knownFacts: mergedKnownFacts,
      explicitAppearanceFacts: mergedAppearanceFacts,
      aliases: mergedAliases
    });

    await this.deleteCharacter(secondaryId);
    this.notifyDataChanged();
    return true;
  }

  async intelligentMergeAbilities(bookId: string, primaryId: string, secondaryId: string): Promise<boolean> {
    await indexedDBAdapter.delete('abilities', secondaryId);
    this.notifyDataChanged();
    return true;
  }

  async intelligentMergeItems(bookId: string, primaryId: string, secondaryId: string): Promise<boolean> {
    await indexedDBAdapter.delete('items', secondaryId);
    this.notifyDataChanged();
    return true;
  }

  async intelligentMergeLocations(bookId: string, primaryId: string, secondaryId: string): Promise<boolean> {
    await indexedDBAdapter.delete('locations', secondaryId);
    this.notifyDataChanged();
    return true;
  }

  async getMergeHistory(bookId?: string): Promise<any[]> {
    return [];
  }

  // ==================== LIVING STORY STATE RECONSTRUCTION ====================

  async getHistoricalStoryState(bookId: string, maxChapterNumber: number): Promise<{
    characters: Character[];
    abilities: Ability[];
    items: Item[];
  }> {
    const allChars = await this.getCharacters(bookId);
    const allAbilities = await this.getAbilities(bookId);
    const allItems = await this.getItems(bookId);

    const historicalChars = allChars.map(char => {
      const validApps = (char.chapterAppearances || []).filter(a => a.chapterNumber <= maxChapterNumber);
      const validProgression = (char.progressionHistory || []).filter(p => p.chapterNumber <= maxChapterNumber);
      const remappedAttrs: Record<string, string | number> = { ...(char.dynamicAttributes || {}) };

      validProgression.forEach(p => {
        remappedAttrs[p.attribute] = p.newValue;
      });

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

    return {
      characters: historicalChars,
      abilities: allAbilities,
      items: allItems
    };
  }

  // ==================== AI EXTRACTION DRAFTS ====================

  async saveDraftExtraction(bookId: string, chapterId: string, extractionData: StructuredExtractionJSON): Promise<AIExtraction> {
    return this.saveAIExtractionDraft(bookId, chapterId, extractionData);
  }

  async saveAIExtractionDraft(bookId: string, chapterId: string, extractionData: StructuredExtractionJSON): Promise<AIExtraction> {
    const draftId = generateUUID();
    const draft: AIExtraction = {
      id: draftId,
      bookId,
      chapterId,
      extraction: extractionData,
      status: 'Pending',
      warnings: extractionData.warnings || [],
      createdAt: new Date().toISOString()
    };

    await indexedDBAdapter.save('ai_extractions', draft);
    return draft;
  }

  async getExtractionForChapter(chapterId: string): Promise<AIExtraction | null> {
    try {
      const all = await indexedDBAdapter.getAll<AIExtraction>('ai_extractions');
      return all.find(e => e.chapterId === chapterId) || null;
    } catch (e) {
      return null;
    }
  }

  async getExtraction(id: string): Promise<AIExtraction | null> {
    try {
      return (await indexedDBAdapter.getById<AIExtraction>('ai_extractions', id)) || null;
    } catch (e) {
      return null;
    }
  }

  async approveExtraction(extractionId: string): Promise<boolean> {
    return this.approveAndApplyExtraction(extractionId);
  }

  async approveExtractionGranular(extractionId: string, selections?: any, overrides?: any): Promise<boolean> {
    return this.approveAndApplyExtraction(extractionId);
  }

  async rejectExtraction(extractionId: string): Promise<boolean> {
    await indexedDBAdapter.delete('ai_extractions', extractionId);
    this.notifyDataChanged();
    return true;
  }

  async approveAndApplyExtraction(extractionId: string): Promise<boolean> {
    const draft = await indexedDBAdapter.getById<AIExtraction>('ai_extractions', extractionId);
    if (!draft || !draft.extraction) return false;

    const data: any = draft.extraction;
    const bookId = draft.bookId;

    if (data.characters) {
      for (const c of data.characters) {
        await this.createCharacter(bookId, {
          name: c.name,
          aliases: c.aliases || c.alternateNames || [],
          summary: c.summary || c.description || '',
          status: 'Active',
          knownFacts: c.knownFacts || c.facts || [],
          explicitAppearanceFacts: c.explicitAppearanceFacts || c.appearance || [],
          dynamicAttributes: c.dynamicAttributes || c.attributes || {}
        });
      }
    }

    if (data.abilities) {
      for (const a of data.abilities) {
        await this.createAbility(bookId, {
          name: a.name,
          description: a.description || '',
          category: (a.category as any) || 'Magic',
          userCharacterNames: a.userCharacterNames || a.users || []
        });
      }
    }

    if (data.items) {
      for (const i of data.items) {
        await this.createItem(bookId, {
          name: i.name,
          description: i.description || '',
          type: (i.type as any) || 'Artifact',
          ownerCharacterName: i.ownerCharacterName || i.owner || '',
          status: 'Active'
        });
      }
    }

    if (data.locations) {
      for (const l of data.locations) {
        await this.createLocation(bookId, {
          name: l.name,
          summary: l.summary || l.description || '',
          type: 'City'
        });
      }
    }

    await indexedDBAdapter.delete('ai_extractions', extractionId);
    this.notifyDataChanged();
    return true;
  }
}

export const repository = new StoryRepository();
