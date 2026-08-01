import {
  Book, Chapter, Character, Ability, Item, LocationEntity,
  Organization, Relationship, TimelineEvent, PlotThread,
  Foreshadowing, AIExtraction, StructuredExtractionJSON,
  DialogueFactEntity, EntityHistoryEvent
} from '@/types';
import { createClient } from '@/lib/supabase/client';
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
  private supabase = createClient();
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
    let dbBooks: Book[] = [];
    try {
      const { data, error } = await this.supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        let favIds: string[] = [];
        if (typeof window !== 'undefined') {
          try { favIds = JSON.parse(localStorage.getItem('notter_fav_books') || '[]'); } catch (e) {}
        }

        dbBooks = data.map(b => ({
          id: b.id,
          title: b.title,
          description: b.description || '',
          coverColor: b.cover_color || '#7C3AED',
          coverUrl: b.cover_url || undefined,
          genre: b.genre || 'Fantasy',
          status: b.status || 'Drafting',
          isFavorite: favIds.includes(b.id),
          createdAt: b.created_at,
          updatedAt: b.updated_at
        }));
      }
    } catch (e) {
      console.warn('[Repository] Supabase getBooks query bypass:', e);
    }

    let localBooks: Book[] = [];
    if (typeof window !== 'undefined') {
      try {
        localBooks = JSON.parse(localStorage.getItem('notter_local_books') || '[]');
      } catch (e) {}
    }

    // Merge DB books and local fallback books cleanly
    const combinedMap = new Map<string, Book>();
    dbBooks.forEach(b => combinedMap.set(b.id, b));
    localBooks.forEach(b => { if (!combinedMap.has(b.id)) combinedMap.set(b.id, b); });

    return Array.from(combinedMap.values());
  }

  async getBook(id: string): Promise<Book | undefined> {
    try {
      const { data, error } = await this.supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          title: data.title,
          description: data.description || '',
          coverColor: data.cover_color || '#7C3AED',
          coverUrl: data.cover_url || undefined,
          genre: data.genre || 'Fantasy',
          status: data.status || 'Drafting',
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      }
    } catch (e) {}

    // Check local fallback
    if (typeof window !== 'undefined') {
      const localBooks: Book[] = JSON.parse(localStorage.getItem('notter_local_books') || '[]');
      const match = localBooks.find(b => b.id === id);
      if (match) return match;
    }

    return undefined;
  }

  async createBook(book: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'chapterCount' | 'totalWordCount'>): Promise<Book | null> {
    // If coverUrl is a massive Base64 string (> 50KB), sanitize for DB payload
    let safeCoverUrl = book.coverUrl;
    if (safeCoverUrl && safeCoverUrl.startsWith('data:image/') && safeCoverUrl.length > 50000) {
      // Keep Base64 locally, but do not send huge 500KB strings to DB columns that reject payload size
      safeCoverUrl = safeCoverUrl.substring(0, 50000); 
    }

    try {
      const { data: { user } } = await this.supabase.auth.getUser();

      const insertPayload: any = {
        title: book.title,
        description: book.description || '',
        cover_color: book.coverColor || '#7C3AED',
        cover_url: book.coverUrl || null,
        genre: book.genre || 'Fantasy',
        status: book.status || 'Drafting'
      };

      if (user) {
        insertPayload.user_id = user.id;
      }

      const { data, error } = await this.supabase
        .from('books')
        .insert(insertPayload)
        .select('*')
        .single();

      if (!error && data) {
        this.notifyDataChanged();
        return {
          id: data.id,
          title: data.title,
          description: data.description,
          coverColor: data.cover_color,
          coverUrl: data.cover_url || undefined,
          genre: data.genre,
          status: data.status,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      } else {
        console.warn('[Repository] Supabase insert failed, falling back to local storage:', error?.message);
      }
    } catch (err) {
      console.warn('[Repository] createBook exception, falling back to local storage:', err);
    }

    // Resilient Local Storage Fallback (Guaranteed to NEVER crash)
    const localId = `book-local-${Date.now()}`;
    const newLocalBook: Book = {
      id: localId,
      title: book.title,
      description: book.description || '',
      coverColor: book.coverColor || '#7C3AED',
      coverUrl: book.coverUrl,
      genre: book.genre || 'Fantasy',
      status: book.status || 'Drafting',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('notter_local_books') || '[]');
        // Limit local stored cover url size to prevent QuotaExceededError
        const sanitizedLocalBook = { ...newLocalBook };
        if (sanitizedLocalBook.coverUrl && sanitizedLocalBook.coverUrl.length > 100000) {
          delete sanitizedLocalBook.coverUrl;
        }
        localStorage.setItem('notter_local_books', JSON.stringify([sanitizedLocalBook, ...stored]));
      } catch (e) {
        console.warn('[Repository] QuotaExceededError caught gracefully:', e);
      }
    }

    this.notifyDataChanged();
    return newLocalBook;
  }

  async updateBook(id: string, updates: Partial<Book>): Promise<boolean> {
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.genre !== undefined) updateData.genre = updates.genre;
    if (updates.coverColor !== undefined) updateData.cover_color = updates.coverColor;
    if (updates.coverUrl !== undefined) updateData.cover_url = updates.coverUrl;
    if (updates.status !== undefined) updateData.status = updates.status;

    updateData.updated_at = new Date().toISOString();

    const { error } = await this.supabase.from('books').update(updateData).eq('id', id);
    if (error) return false;
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
    const book = await this.getBook(id);
    if (book?.coverUrl && book.coverUrl.includes('covers/')) {
      try {
        const parts = book.coverUrl.split('covers/');
        if (parts.length > 1) {
          await this.supabase.storage.from('covers').remove([parts[1]]);
        }
      } catch (e) {
        console.warn('[Storage Cleanup Note]:', e);
      }
    }

    const { error } = await this.supabase.from('books').delete().eq('id', id);
    if (error) return false;
    this.notifyDataChanged();
    return true;
  }

  // ==================== CHAPTER METHODS ====================

  async getChapters(bookId: string): Promise<Chapter[]> {
    let dbChaps: Chapter[] = [];
    if (isValidUUID(bookId)) {
      try {
        const { data, error } = await this.supabase
          .from('chapters')
          .select('*')
          .eq('book_id', bookId)
          .order('chapter_number', { ascending: true });

        if (!error && data) {
          dbChaps = data.map(c => ({
            id: c.id,
            bookId: c.book_id,
            title: c.title,
            chapterNumber: c.chapter_number,
            content: c.content || '',
            wordCount: c.word_count || 0,
            readingTimeMinutes: c.reading_time_minutes || 1,
            status: c.status || 'Unprocessed',
            createdAt: c.created_at,
            updatedAt: c.updated_at
          }));
        }
      } catch (e) {}
    }

    let localChaps: Chapter[] = [];
    if (typeof window !== 'undefined') {
      try {
        localChaps = JSON.parse(localStorage.getItem(`notter_local_chapters_${bookId}`) || '[]');
      } catch (e) {}
    }

    const combined = new Map<string, Chapter>();
    dbChaps.forEach(c => combined.set(c.id, c));
    localChaps.forEach(c => { if (!combined.has(c.id)) combined.set(c.id, c); });

    return Array.from(combined.values()).sort((a, b) => a.chapterNumber - b.chapterNumber);
  }

  async createChapter(bookId: string, title: string, content: string, chapterNumber?: number): Promise<Chapter | null> {
    const existingChaps = await this.getChapters(bookId);
    const nextNum = chapterNumber || (existingChaps.length > 0 ? Math.max(...existingChaps.map(c => c.chapterNumber)) + 1 : 1);
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

    if (isValidUUID(bookId)) {
      try {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (user) {
          const { data, error } = await this.supabase
            .from('chapters')
            .insert({
              user_id: user.id,
              book_id: bookId,
              title: title || `Chapter ${nextNum}`,
              chapter_number: nextNum,
              content: content || '',
              word_count: wordCount,
              reading_time_minutes: Math.max(1, Math.ceil(wordCount / 225)),
              status: 'Unprocessed'
            })
            .select('*')
            .single();

          if (!error && data) {
            this.notifyDataChanged();
            return {
              id: data.id,
              bookId: data.book_id,
              title: data.title,
              chapterNumber: data.chapter_number,
              content: data.content,
              wordCount: data.word_count,
              readingTimeMinutes: data.reading_time_minutes,
              status: data.status,
              createdAt: data.created_at,
              updatedAt: data.updated_at
            };
          }
        }
      } catch (e) {}
    }

    // Local Fallback Chapter with valid UUID
    const localChapId = generateUUID();
    const newLocalChap: Chapter = {
      id: localChapId,
      bookId: bookId,
      title: title || `Chapter ${nextNum}`,
      chapterNumber: nextNum,
      content: content || '',
      wordCount: wordCount,
      readingTimeMinutes: Math.max(1, Math.ceil(wordCount / 225)),
      status: 'Unprocessed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem(`notter_local_chapters_${bookId}`) || '[]');
        localStorage.setItem(`notter_local_chapters_${bookId}`, JSON.stringify([...stored, newLocalChap]));
      } catch (e) {}
    }

    this.notifyDataChanged();
    return newLocalChap;
  }

  async updateChapter(id: string, updates: Partial<Chapter>): Promise<boolean> {
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.chapterNumber !== undefined) updateData.chapter_number = updates.chapterNumber;
    if (updates.content !== undefined) {
      updateData.content = updates.content;
      const wordCount = updates.content.trim() ? updates.content.trim().split(/\s+/).length : 0;
      updateData.word_count = wordCount;
      updateData.reading_time_minutes = Math.max(1, Math.ceil(wordCount / 225));
    }
    if (updates.status !== undefined) updateData.status = updates.status;

    updateData.updated_at = new Date().toISOString();

    if (isValidUUID(id)) {
      const { error } = await this.supabase.from('chapters').update(updateData).eq('id', id);
      if (!error) {
        this.notifyDataChanged();
        return true;
      }
    }

    this.notifyDataChanged();
    return true;
  }

  async deleteChapter(id: string): Promise<boolean> {
    if (isValidUUID(id)) {
      await this.supabase.from('chapters').delete().eq('id', id);
    }
    this.notifyDataChanged();
    return true;
  }

  // ==================== ENTITY GETTERS ====================

  async getCharacters(bookId: string): Promise<Character[]> {
    if (!isValidUUID(bookId)) return [];
    const { data, error } = await this.supabase.from('characters').select('*').eq('book_id', bookId);
    if (error || !data) return [];
    return data.map(c => ({
      id: c.id, bookId: c.book_id, name: c.name, aliases: c.aliases || [], summary: c.summary || '',
      status: c.status || 'Active', occupation: c.occupation, currentLocation: c.current_location,
      emotionalState: c.emotional_state, physicalInjuries: c.physical_injuries, physicalChanges: c.physical_changes,
      clothing: c.clothing, goals: c.goals, secretsRevealed: c.secrets_revealed || [],
      promisesMade: c.promises_made || [], promisesBroken: c.promises_broken || [],
      decisions: c.decisions || [], knowledgeGained: c.knowledge_gained || [], knowledgeLost: c.knowledge_lost || [],
      firstAppearanceChapterId: c.first_appearance_chapter_id, lastAppearanceChapterId: c.last_appearance_chapter_id,
      appearedInChapterIds: c.appeared_in_chapter_ids || [], chapterAppearances: c.chapter_appearances || [],
      history: c.history || [], tags: c.tags || [], authorNotes: c.author_notes || [],
      knownFacts: c.known_facts || [],
      explicitAppearanceFacts: c.explicit_appearance_facts || [],
      dynamicAttributes: c.dynamic_attributes || {},
      progressionHistory: c.progression_history || [],
      species: c.species, race: c.race, gender: c.gender, age: c.age, birthday: c.birthday, title: c.title,
      hairColor: c.hair_color, eyeColor: c.eye_color, skinTone: c.skin_tone, height: c.height, weight: c.weight,
      build: c.build, scars: c.scars, tattoos: c.tattoos, distinguishingFeatures: c.distinguishing_features,
      level: c.level, rank: c.rank, tier: c.tier, className: c.class_name, cultivationRealm: c.cultivation_realm,
      hp: c.hp, maxHp: c.max_hp, mana: c.mana, maxMana: c.max_mana, strength: c.strength, agility: c.agility, vitality: c.vitality,
      createdAt: c.created_at, updatedAt: c.updated_at || c.created_at
    }));
  }

  async getHistoricalStoryState(bookId: string, maxChapterNumber: number): Promise<{
    characters: Character[];
    abilities: Ability[];
    items: Item[];
  }> {
    const allChars = await this.getCharacters(bookId);
    const allAbilities = await this.getAbilities(bookId);
    const allItems = await this.getItems(bookId);

    // Reconstruct characters up to maxChapterNumber
    const historicalChars = allChars.map(char => {
      const validApps = (char.chapterAppearances || []).filter(a => a.chapterNumber <= maxChapterNumber);
      if (validApps.length === 0 && (char.history || []).length > 0) {
        const hasEarlyHistory = char.history?.some(h => h.chapterNumber <= maxChapterNumber);
        if (!hasEarlyHistory) return null;
      }

      // Reconstruct dynamic attributes up to maxChapterNumber
      const validProgression = (char.progressionHistory || []).filter(p => p.chapterNumber <= maxChapterNumber);
      const remappedAttrs: Record<string, string | number> = { ...(char.dynamicAttributes || {}) };

      // Apply progression overrides up to maxChapterNumber
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
    }).filter(Boolean) as Character[];

    return {
      characters: historicalChars,
      abilities: allAbilities,
      items: allItems
    };
  }

  async getCharacter(id: string): Promise<Character | undefined> {
    if (!isValidUUID(id)) return undefined;
    const { data, error } = await this.supabase.from('characters').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    return {
      id: data.id, bookId: data.book_id, name: data.name, aliases: data.aliases || [], summary: data.summary || '',
      status: data.status || 'Active', occupation: data.occupation, currentLocation: data.current_location,
      emotionalState: data.emotional_state, physicalInjuries: data.physical_injuries, physicalChanges: data.physical_changes,
      clothing: data.clothing, goals: data.goals, secretsRevealed: data.secrets_revealed || [],
      promisesMade: data.promises_made || [], promisesBroken: data.promises_broken || [],
      decisions: data.decisions || [], knowledgeGained: data.knowledge_gained || [], knowledgeLost: data.knowledge_lost || [],
      firstAppearanceChapterId: data.first_appearance_chapter_id, lastAppearanceChapterId: data.last_appearance_chapter_id,
      appearedInChapterIds: data.appeared_in_chapter_ids || [], chapterAppearances: data.chapter_appearances || [],
      history: data.history || [], tags: data.tags || [], authorNotes: data.author_notes || [],
      knownFacts: data.known_facts || [],
      explicitAppearanceFacts: data.explicit_appearance_facts || [],
      dynamicAttributes: data.dynamic_attributes || {},
      progressionHistory: data.progression_history || [],
      species: data.species, race: data.race, gender: data.gender, age: data.age, birthday: data.birthday, title: data.title,
      hairColor: data.hair_color, eyeColor: data.eye_color, skinTone: data.skin_tone, height: data.height, weight: data.weight,
      build: data.build, scars: data.scars, tattoos: data.tattoos, distinguishingFeatures: data.distinguishing_features,
      level: data.level, rank: data.rank, tier: data.tier, className: data.class_name, cultivationRealm: data.cultivation_realm,
      hp: data.hp, maxHp: data.max_hp, mana: data.mana, maxMana: data.max_mana, strength: data.strength, agility: data.agility, vitality: data.vitality,
      createdAt: data.created_at, updatedAt: data.updated_at || data.created_at
    };
  }

  async getAbilities(bookId: string): Promise<Ability[]> {
    if (!isValidUUID(bookId)) return [];
    const { data, error } = await this.supabase.from('abilities').select('*').eq('book_id', bookId);
    if (error || !data) return [];
    return data.map(a => ({
      id: a.id, bookId: a.book_id, name: a.name, description: a.description || '', category: a.category,
      userCharacterNames: a.user_character_names || [], firstAppearanceChapterId: a.first_appearance_chapter_id,
      lastUsedChapterId: a.last_used_chapter_id, evolutionNotes: a.evolution_notes,
      history: a.history || [], tags: a.tags || [], authorNotes: a.author_notes || [], createdAt: a.created_at
    }));
  }

  async getItems(bookId: string): Promise<Item[]> {
    if (!isValidUUID(bookId)) return [];
    const { data, error } = await this.supabase.from('items').select('*').eq('book_id', bookId);
    if (error || !data) return [];
    return data.map(i => ({
      id: i.id, bookId: i.book_id, name: i.name, description: i.description || '', type: i.type,
      ownerCharacterName: i.owner_character_name, previousOwnerName: i.previous_owner_name,
      currentLocationName: i.current_location_name, condition: i.condition, status: i.status || 'Active',
      historyNotes: i.history_notes, appearedInChapterIds: i.appeared_in_chapter_ids || [],
      history: i.history || [], tags: i.tags || [], authorNotes: i.author_notes || [], createdAt: i.created_at
    }));
  }

  async getLocations(bookId: string): Promise<LocationEntity[]> {
    if (!isValidUUID(bookId)) return [];
    const { data, error } = await this.supabase.from('locations').select('*').eq('book_id', bookId);
    if (error || !data) return [];
    return data.map(l => ({
      id: l.id, bookId: l.book_id, name: l.name, summary: l.summary || '', type: l.type,
      charactersPresentNames: l.characters_present_names || [], itemsLocatedNames: l.items_located_names || [],
      eventsOccurred: l.events_occurred || [], appearedInChapterIds: l.appeared_in_chapter_ids || [],
      history: l.history || [], tags: l.tags || [], authorNotes: l.author_notes || [], createdAt: l.created_at
    }));
  }

  async getOrganizations(bookId: string): Promise<Organization[]> {
    if (!isValidUUID(bookId)) return [];
    const { data, error } = await this.supabase.from('organizations').select('*').eq('book_id', bookId);
    if (error || !data) return [];
    return data.map(o => ({
      id: o.id, bookId: o.book_id, name: o.name, description: o.description || '', alignment: o.alignment,
      leaderName: o.leader_name, memberNames: o.member_names || [], history: o.history || [],
      tags: o.tags || [], authorNotes: o.author_notes || [], createdAt: o.created_at
    }));
  }

  async getRelationships(bookId: string): Promise<Relationship[]> {
    if (!isValidUUID(bookId)) return [];
    const { data, error } = await this.supabase.from('relationships').select('*').eq('book_id', bookId);
    if (error || !data) return [];
    return data.map(r => ({
      id: r.id, bookId: r.book_id, character1Name: r.character1_name, character2Name: r.character2_name,
      relationType: r.relation_type, status: r.status, description: r.description, createdAt: r.created_at
    }));
  }

  async getDialogueFacts(bookId: string): Promise<DialogueFactEntity[]> {
    if (!isValidUUID(bookId)) return [];
    const { data, error } = await this.supabase.from('dialogue_facts').select('*').eq('book_id', bookId);
    if (error || !data) return [];
    return data.map(d => ({
      id: d.id, bookId: d.book_id, chapterId: d.chapter_id, chapterNumber: d.chapter_number,
      speaker: d.speaker, recipient: d.recipient, type: d.type, fact: d.fact, createdAt: d.created_at
    }));
  }

  async getTimelineEvents(bookId: string): Promise<TimelineEvent[]> {
    if (!isValidUUID(bookId)) return [];
    const { data, error } = await this.supabase.from('timeline_events').select('*').eq('book_id', bookId).order('chapter_number', { ascending: true });
    if (error || !data) return [];
    return data.map(t => ({
      id: t.id, bookId: t.book_id, chapterId: t.chapter_id, chapterNumber: t.chapter_number,
      title: t.title, description: t.description || '', location: t.location, participants: t.participants || [],
      winner: t.winner, loser: t.loser, deaths: t.deaths || [], injuries: t.injuries || [],
      itemsExchanged: t.items_exchanged || [], abilitiesUsed: t.abilities_used || [], consequences: t.consequences,
      timePassedNote: t.time_passed_note, currentArc: t.current_arc, significance: t.significance || 'Major', createdAt: t.created_at
    }));
  }

  async getPlotThreads(bookId: string): Promise<PlotThread[]> {
    const { data, error } = await this.supabase.from('plot_threads').select('*').eq('book_id', bookId);
    if (error || !data) return [];
    return data.map(p => ({
      id: p.id, bookId: p.book_id, chapterId: p.chapter_id, title: p.title, description: p.description || '',
      status: p.status || 'Open', resolvedChapterId: p.resolved_chapter_id, createdAt: p.created_at
    }));
  }

  async getForeshadowing(bookId: string): Promise<Foreshadowing[]> {
    const { data, error } = await this.supabase.from('foreshadowing').select('*').eq('book_id', bookId);
    if (error || !data) return [];
    return data.map(f => ({
      id: f.id, bookId: f.book_id, chapterId: f.chapter_id, clueDescription: f.clue_description,
      payoffTarget: f.payoff_target, status: f.status || 'Unfulfilled', fulfilledChapterId: f.fulfilled_chapter_id, createdAt: f.created_at
    }));
  }

  // ==================== AUTHOR MUTATORS ====================

  async createCharacter(bookId: string, char: Omit<Character, 'id' | 'bookId' | 'appearedInChapterIds' | 'createdAt'>): Promise<Character | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase.from('characters').insert({
      user_id: user.id,
      book_id: bookId,
      name: char.name,
      aliases: char.aliases || [],
      summary: char.summary || '',
      status: char.status || 'Active',
      occupation: char.occupation || null,
      current_location: char.currentLocation || null,
      emotional_state: char.emotionalState || null,
      physical_injuries: char.physicalInjuries || null,
      clothing: char.clothing || null,
      goals: char.goals || null,
      appeared_in_chapter_ids: [],
      chapter_appearances: []
    }).select('*').single();

    if (error || !data) return null;
    this.notifyDataChanged();
    return {
      id: data.id, bookId: data.book_id, name: data.name, aliases: data.aliases || [], summary: data.summary || '',
      status: data.status || 'Active', occupation: data.occupation, currentLocation: data.current_location,
      emotionalState: data.emotional_state, physicalInjuries: data.physical_injuries, clothing: data.clothing,
      goals: data.goals, appearedInChapterIds: [], createdAt: data.created_at, updatedAt: data.updated_at || data.created_at
    };
  }

  async createItem(bookId: string, item: Omit<Item, 'id' | 'bookId' | 'appearedInChapterIds' | 'createdAt'>): Promise<Item | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase.from('items').insert({
      user_id: user.id, book_id: bookId, name: item.name, description: item.description || '', type: item.type || 'Artifact',
      owner_character_name: item.ownerCharacterName || '', current_location_name: item.currentLocationName || '',
      status: item.status || 'Active', appeared_in_chapter_ids: []
    }).select('*').single();

    if (error || !data) return null;
    this.notifyDataChanged();
    return {
      id: data.id, bookId: data.book_id, name: data.name, description: data.description, type: data.type,
      ownerCharacterName: data.owner_character_name, currentLocationName: data.current_location_name,
      status: data.status, appearedInChapterIds: [], createdAt: data.created_at
    };
  }

  async createAbility(bookId: string, ability: Omit<Ability, 'id' | 'bookId' | 'createdAt'>): Promise<Ability | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase.from('abilities').insert({
      user_id: user.id, book_id: bookId, name: ability.name, description: ability.description || '',
      category: ability.category || 'Magic', user_character_names: ability.userCharacterNames || []
    }).select('*').single();

    if (error || !data) return null;
    this.notifyDataChanged();
    return {
      id: data.id, bookId: data.book_id, name: data.name, description: data.description,
      category: data.category, userCharacterNames: data.user_character_names || [], createdAt: data.created_at
    };
  }

  async createLocation(bookId: string, location: Omit<LocationEntity, 'id' | 'bookId' | 'appearedInChapterIds' | 'eventsOccurred' | 'createdAt'>): Promise<LocationEntity | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase.from('locations').insert({
      user_id: user.id, book_id: bookId, name: location.name, summary: location.summary || '',
      type: location.type || 'City', characters_present_names: location.charactersPresentNames || [], appeared_in_chapter_ids: []
    }).select('*').single();

    if (error || !data) return null;
    this.notifyDataChanged();
    return {
      id: data.id, bookId: data.book_id, name: data.name, summary: data.summary, type: data.type,
      charactersPresentNames: data.characters_present_names || [], eventsOccurred: [], appearedInChapterIds: [], createdAt: data.created_at
    };
  }

  async createTimelineEvent(bookId: string, event: Omit<TimelineEvent, 'id' | 'bookId' | 'createdAt'>): Promise<TimelineEvent | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase.from('timeline_events').insert({
      user_id: user.id, book_id: bookId, chapter_id: event.chapterId || null, chapter_number: event.chapterNumber || 1,
      title: event.title, description: event.description || '', location: event.location || null,
      participants: event.participants || [], significance: event.significance || 'Major',
      time_passed_note: event.timePassedNote || null, current_arc: event.currentArc || 'Main Story Arc'
    }).select('*').single();

    if (error || !data) return null;
    this.notifyDataChanged();
    return {
      id: data.id, bookId: data.book_id, chapterId: data.chapter_id, chapterNumber: data.chapter_number,
      title: data.title, description: data.description, location: data.location, participants: data.participants || [],
      significance: data.significance, timePassedNote: data.time_passed_note, currentArc: data.current_arc, createdAt: data.created_at
    };
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<boolean> {
    const { error } = await this.supabase.from('characters').update({
      author_notes: updates.authorNotes,
      tags: updates.tags,
      summary: updates.summary,
      status: updates.status
    }).eq('id', id);
    if (error) return false;
    this.notifyDataChanged();
    return true;
  }

  async deleteCharacter(charId: string): Promise<boolean> {
    const { error } = await this.supabase.from('characters').delete().eq('id', charId);
    if (error) return false;
    this.notifyDataChanged();
    return true;
  }

  async addRelationship(bookId: string, char1Name: string, char2Name: string, relationType: string, description: string): Promise<Relationship | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase.from('relationships').insert({
      user_id: user.id, book_id: bookId, character1_name: char1Name, character2_name: char2Name,
      relation_type: relationType, status: 'Active', description
    }).select('*').single();

    if (error || !data) return null;
    this.notifyDataChanged();
    return {
      id: data.id, bookId: data.book_id, character1Name: data.character1_name, character2Name: data.character2_name,
      relationType: data.relation_type, status: data.status, description: data.description, createdAt: data.created_at
    };
  }

  async updateItem(id: string, updates: Partial<Item>): Promise<boolean> {
    const { error } = await this.supabase.from('items').update({
      name: updates.name, description: updates.description, type: updates.type,
      owner_character_name: updates.ownerCharacterName, current_location_name: updates.currentLocationName,
      status: updates.status
    }).eq('id', id);
    if (error) return false;
    this.notifyDataChanged();
    return true;
  }

  async deleteItem(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('items').delete().eq('id', id);
    if (error) return false;
    this.notifyDataChanged();
    return true;
  }

  async updateAbility(id: string, updates: Partial<Ability>): Promise<boolean> {
    const { error } = await this.supabase.from('abilities').update({
      name: updates.name, description: updates.description, category: updates.category,
      user_character_names: updates.userCharacterNames
    }).eq('id', id);
    if (error) return false;
    this.notifyDataChanged();
    return true;
  }

  async deleteAbility(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('abilities').delete().eq('id', id);
    if (error) return false;
    this.notifyDataChanged();
    return true;
  }

  async updateLocation(id: string, updates: Partial<LocationEntity>): Promise<boolean> {
    const { error } = await this.supabase.from('locations').update({
      name: updates.name, summary: updates.summary, type: updates.type,
      characters_present_names: updates.charactersPresentNames
    }).eq('id', id);
    if (error) return false;
    this.notifyDataChanged();
    return true;
  }

  async deleteLocation(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('locations').delete().eq('id', id);
    if (error) return false;
    this.notifyDataChanged();
    return true;
  }

  async deleteTimelineEvent(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('timeline_events').delete().eq('id', id);
    if (error) return false;
    this.notifyDataChanged();
    return true;
  }

  async deleteRelationship(relId: string): Promise<boolean> {
    const { error } = await this.supabase.from('relationships').delete().eq('id', relId);
    if (error) return false;
    this.notifyDataChanged();
    return true;
  }

  // ==================== EXTRACTION ENGINE ====================

  async saveDraftExtraction(bookId: string, chapterId: string, extraction: StructuredExtractionJSON): Promise<AIExtraction | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase.from('ai_extractions').insert({
      user_id: user.id, book_id: bookId, chapter_id: chapterId, extraction, status: 'Pending', warnings: extraction.warnings || []
    }).select('*').single();

    if (error || !data) return null;

    await this.updateChapter(chapterId, { status: 'Pending Review' });
    this.notifyDataChanged();
    return {
      id: data.id, bookId: data.book_id, chapterId: data.chapter_id, extraction: data.extraction, status: data.status, warnings: data.warnings, createdAt: data.created_at
    };
  }

  async getExtractionForChapter(chapterId: string): Promise<AIExtraction | null> {
    const { data, error } = await this.supabase
      .from('ai_extractions')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      bookId: data.book_id,
      chapterId: data.chapter_id,
      extraction: data.extraction,
      status: data.status,
      warnings: data.warnings || [],
      createdAt: data.created_at
    };
  }

  async approveExtractionGranular(extractionId: string, approvedItemKeys?: string[], editedExtraction?: StructuredExtractionJSON): Promise<boolean> {
    const { data: draft, error: draftErr } = await this.supabase.from('ai_extractions').select('*').eq('id', extractionId).single();
    if (draftErr || !draft) return false;

    const data: StructuredExtractionJSON = editedExtraction || draft.extraction;
    const { book_id: bookId, chapter_id: chapterId, user_id: userId } = draft;

    const { data: chapter } = await this.supabase.from('chapters').select('*').eq('id', chapterId).single();
    const chapterNum = chapter ? chapter.chapter_number : 1;
    const chapterTitle = chapter ? chapter.title : `Chapter ${chapterNum}`;

    const isApproved = (key: string) => !approvedItemKeys || approvedItemKeys.includes(key);

    try {
      // 1. Process Characters
      const allChars: any[] = [...(data.characters || []), ...(data.new_characters || [])];
      for (let i = 0; i < allChars.length; i++) {
        const c = allChars[i];
        if (!c.name || !isApproved(`char-${c.name}-${i}`)) continue;

        const appearance = {
          chapterId, chapterNumber: chapterNum, chapterTitle, summary: c.summary || 'Appeared in chapter.',
          statusInChapter: c.status, location: c.location, emotionalState: c.emotional_state, physicalChanges: c.physical_injuries || c.physical_changes, goals: c.goals
        };

        const { data: existingChars } = await this.supabase.from('characters').select('*').eq('book_id', bookId).ilike('name', c.name);

        if (existingChars && existingChars.length > 0) {
          const ex = existingChars[0];
          const appIds = Array.from(new Set([...(ex.appeared_in_chapter_ids || []), chapterId]));
          const appearances = [...(ex.chapter_appearances || [])];
          const existingAppIdx = appearances.findIndex((a: any) => a.chapterId === chapterId);
          if (existingAppIdx !== -1) appearances[existingAppIdx] = appearance;
          else appearances.push(appearance);

          // Dynamic Facts & Progression Merging
          const existingFacts = ex.known_facts || [];
          const newFacts = c.known_facts || [];
          const mergedFacts = Array.from(new Set([...existingFacts, ...newFacts]));

          const existingAppearances = ex.explicit_appearance_facts || [];
          const newExplicitAppearances = c.explicit_appearance_facts || [];
          const mergedExplicitAppearances = Array.from(new Set([...existingAppearances, ...newExplicitAppearances]));

          const existingDynAttrs = ex.dynamic_attributes || {};
          const newDynAttrs = c.dynamic_attributes || {};
          const mergedDynAttrs = { ...existingDynAttrs, ...newDynAttrs };

          const existingProgression = ex.progression_history || [];
          const newProgressionItems = (c.progression_changes || []).map((p: any) => ({
            id: `prog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            chapterNumber: chapterNum,
            attribute: p.attribute,
            oldValue: p.old_value,
            newValue: p.new_value,
            reason: p.reason || ''
          }));
          const mergedProgression = [...existingProgression, ...newProgressionItems];

          await this.supabase.from('characters').update({
            summary: c.summary || ex.summary, status: c.status || ex.status, occupation: c.occupation || ex.occupation,
            current_location: c.location || ex.current_location, emotional_state: c.emotional_state || ex.emotional_state,
            physical_injuries: c.physical_injuries || ex.physical_injuries, clothing: c.clothing || ex.clothing, goals: c.goals || ex.goals,
            appeared_in_chapter_ids: appIds, chapter_appearances: appearances,
            known_facts: mergedFacts,
            explicit_appearance_facts: mergedExplicitAppearances,
            dynamic_attributes: mergedDynAttrs,
            progression_history: mergedProgression
          }).eq('id', ex.id);
        } else {
          const newProgressionItems = (c.progression_changes || []).map((p: any) => ({
            id: `prog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            chapterNumber: chapterNum,
            attribute: p.attribute,
            oldValue: p.old_value,
            newValue: p.new_value,
            reason: p.reason || ''
          }));

          await this.supabase.from('characters').insert({
            user_id: userId, book_id: bookId, name: c.name, aliases: c.aliases || [], summary: c.summary || '',
            status: c.status || 'Active', occupation: c.occupation, current_location: c.location, emotional_state: c.emotional_state,
            physical_injuries: c.physical_injuries, clothing: c.clothing, goals: c.goals,
            known_facts: c.known_facts || [],
            explicit_appearance_facts: c.explicit_appearance_facts || [],
            dynamic_attributes: c.dynamic_attributes || {},
            progression_history: newProgressionItems,
            first_appearance_chapter_id: chapterId, last_appearance_chapter_id: chapterId, appeared_in_chapter_ids: [chapterId], chapter_appearances: [appearance]
          });
        }
      }

      // 2. Process Abilities
      if (data.abilities && Array.isArray(data.abilities)) {
        for (let i = 0; i < data.abilities.length; i++) {
          const ab = data.abilities[i];
          if (!ab.name || !isApproved(`ab-${ab.name}-${i}`)) continue;

          const { data: existingAbs } = await this.supabase.from('abilities').select('*').eq('book_id', bookId).ilike('name', ab.name);
          if (existingAbs && existingAbs.length > 0) {
            const ex = existingAbs[0];
            const usersList = Array.from(new Set([...(ex.user_character_names || []), ...(ab.users || [])]));
            await this.supabase.from('abilities').update({
              description: ab.description || ex.description,
              category: ab.category || ex.category,
              user_character_names: usersList,
              last_used_chapter_id: chapterId
            }).eq('id', ex.id);
          } else {
            await this.supabase.from('abilities').insert({
              user_id: userId, book_id: bookId, name: ab.name, description: ab.description || '', category: ab.category || 'Magic',
              user_character_names: ab.users || [], first_appearance_chapter_id: chapterId, last_used_chapter_id: chapterId
            });
          }
        }
      }

      // 3. Process Items
      if (data.items && Array.isArray(data.items)) {
        for (let i = 0; i < data.items.length; i++) {
          const it = data.items[i];
          if (!it.name || !isApproved(`item-${it.name}-${i}`)) continue;

          const { data: existingItems } = await this.supabase.from('items').select('*').eq('book_id', bookId).ilike('name', it.name);
          if (existingItems && existingItems.length > 0) {
            const ex = existingItems[0];
            const appIds = Array.from(new Set([...(ex.appeared_in_chapter_ids || []), chapterId]));
            await this.supabase.from('items').update({
              description: it.description || ex.description,
              owner_character_name: it.owner || ex.owner_character_name,
              current_location_name: it.location || ex.current_location_name,
              status: it.status || ex.status,
              appeared_in_chapter_ids: appIds
            }).eq('id', ex.id);
          } else {
            await this.supabase.from('items').insert({
              user_id: userId, book_id: bookId, name: it.name, description: it.description || '', type: it.type || 'Item',
              owner_character_name: it.owner || '', current_location_name: it.location || '',
              status: it.status || 'Active', appeared_in_chapter_ids: [chapterId]
            });
          }
        }
      }

      // 4. Process Locations
      if (data.locations && Array.isArray(data.locations)) {
        for (let i = 0; i < data.locations.length; i++) {
          const loc = data.locations[i];
          if (!loc.name || !isApproved(`loc-${loc.name}-${i}`)) continue;

          const { data: existingLocs } = await this.supabase.from('locations').select('*').eq('book_id', bookId).ilike('name', loc.name);
          if (existingLocs && existingLocs.length > 0) {
            const ex = existingLocs[0];
            const appIds = Array.from(new Set([...(ex.appeared_in_chapter_ids || []), chapterId]));
            const charsPresent = Array.from(new Set([...(ex.characters_present_names || []), ...(loc.characters_present || [])]));
            await this.supabase.from('locations').update({
              summary: loc.summary || ex.summary,
              type: loc.type || ex.type,
              characters_present_names: charsPresent,
              appeared_in_chapter_ids: appIds
            }).eq('id', ex.id);
          } else {
            await this.supabase.from('locations').insert({
              user_id: userId, book_id: bookId, name: loc.name, summary: loc.summary || '', type: loc.type || 'City',
              characters_present_names: loc.characters_present || [], appeared_in_chapter_ids: [chapterId]
            });
          }
        }
      }

      // 5. Process Organizations
      if (data.organizations && Array.isArray(data.organizations)) {
        for (let i = 0; i < data.organizations.length; i++) {
          const org = data.organizations[i];
          if (!org.name || !isApproved(`org-${org.name}-${i}`)) continue;

          const { data: existingOrgs } = await this.supabase.from('organizations').select('*').eq('book_id', bookId).ilike('name', org.name);
          if (existingOrgs && existingOrgs.length > 0) {
            const ex = existingOrgs[0];
            const members = Array.from(new Set([...(ex.member_names || []), ...(org.members || [])]));
            await this.supabase.from('organizations').update({
              description: org.description || ex.description,
              alignment: org.alignment || ex.alignment,
              leader_name: org.leader || ex.leader_name,
              member_names: members
            }).eq('id', ex.id);
          } else {
            await this.supabase.from('organizations').insert({
              user_id: userId, book_id: bookId, name: org.name, description: org.description || '', alignment: org.alignment || 'Neutral',
              leader_name: org.leader || '', member_names: org.members || []
            });
          }
        }
      }

      // 6. Process Relationships
      if (data.relationship_changes && Array.isArray(data.relationship_changes)) {
        for (let i = 0; i < data.relationship_changes.length; i++) {
          const rel = data.relationship_changes[i];
          if (!rel.character1 || !rel.character2 || !isApproved(`rel-${rel.character1}-${rel.character2}-${i}`)) continue;

          await this.addRelationship(bookId, rel.character1, rel.character2, rel.relationType || 'Allies', rel.description || '');
        }
      }

      // 7. Process Dialogue Facts
      if (data.dialogue_facts && Array.isArray(data.dialogue_facts)) {
        for (let i = 0; i < data.dialogue_facts.length; i++) {
          const df = data.dialogue_facts[i];
          if (!df.speaker || !df.fact || !isApproved(`df-${df.speaker}-${i}`)) continue;

          await this.supabase.from('dialogue_facts').insert({
            user_id: userId, book_id: bookId, chapter_id: chapterId, chapter_number: chapterNum,
            speaker: df.speaker, recipient: df.recipient || null, type: df.type || 'Statement', fact: df.fact
          });
        }
      }

      // 8. Process Timeline Events
      if (data.events && Array.isArray(data.events)) {
        for (let i = 0; i < data.events.length; i++) {
          const ev = data.events[i];
          if (!ev.title || (!isApproved(`ev-${ev.title}-${i}`) && !isApproved(`event-${ev.title}-${i}`))) continue;

          await this.supabase.from('timeline_events').insert({
            user_id: userId, book_id: bookId, chapter_id: chapterId, chapter_number: chapterNum,
            title: ev.title, description: ev.description || '', location: ev.location || null,
            participants: ev.participants || [], significance: ev.significance || 'Major',
            current_arc: data.timeline?.current_arc || 'Main Story Arc',
            time_passed_note: data.timeline?.time_passed || ''
          });
        }
      }

      // 9. Process Plot Threads
      if (data.plot_threads && Array.isArray(data.plot_threads)) {
        for (let i = 0; i < data.plot_threads.length; i++) {
          const pt = data.plot_threads[i];
          if (!pt.title || (!isApproved(`plot-${pt.title}-${i}`) && !isApproved(`pt-${pt.title}-${i}`))) continue;

          await this.supabase.from('plot_threads').insert({
            user_id: userId, book_id: bookId, chapter_id: chapterId, title: pt.title, description: pt.description || '', status: 'Open'
          });
        }
      }

      // 10. Process Foreshadowing
      if (data.foreshadowing && Array.isArray(data.foreshadowing)) {
        for (let i = 0; i < data.foreshadowing.length; i++) {
          const fs = data.foreshadowing[i];
          if (!fs.clueDescription || (!isApproved(`fore-${fs.clueDescription}-${i}`) && !isApproved(`fs-${fs.clueDescription}-${i}`))) continue;

          await this.supabase.from('foreshadowing').insert({
            user_id: userId, book_id: bookId, chapter_id: chapterId, clue_description: fs.clueDescription, payoff_target: fs.payoffTarget || '', status: 'Unfulfilled'
          });
        }
      }

      // Mark Draft as Approved & Chapter as Analyzed
      await this.supabase.from('ai_extractions').update({ status: 'Approved' }).eq('id', extractionId);
      await this.supabase.from('chapters').update({ status: 'Analyzed' }).eq('id', chapterId);

      this.notifyDataChanged();
      return true;
    } catch (err) {
      console.error('[approveExtractionGranular] Error:', err);
      return false;
    }
  }

  async approveExtraction(extractionId: string, editedExtraction?: StructuredExtractionJSON): Promise<boolean> {
    return this.approveExtractionGranular(extractionId, undefined, editedExtraction);
  }

  async rejectExtraction(extractionId: string): Promise<boolean> {
    const { data: draft } = await this.supabase.from('ai_extractions').select('chapter_id').eq('id', extractionId).single();
    await this.supabase.from('ai_extractions').update({ status: 'Rejected' }).eq('id', extractionId);
    if (draft) {
      await this.supabase.from('chapters').update({ status: 'Unprocessed' }).eq('id', draft.chapter_id);
    }
    this.notifyDataChanged();
    return true;
  }

  async findDuplicateSuggestions(bookId: string): Promise<{ char1: Character; char2: Character; confidence: number }[]> {
    const chars = await this.getCharacters(bookId);
    const suggestions: { char1: Character; char2: Character; confidence: number }[] = [];

    for (let i = 0; i < chars.length; i++) {
      for (let j = i + 1; j < chars.length; j++) {
        if (isHighlySimilar(chars[i].name, chars[j].name)) {
          suggestions.push({ char1: chars[i], char2: chars[j], confidence: 98 });
        }
      }
    }
    return suggestions;
  }

  async intelligentMergeCharacters(primaryId: string, secondaryId: string, overrides?: Partial<Character>): Promise<boolean> {
    const primary = await this.getCharacter(primaryId);
    const secondary = await this.getCharacter(secondaryId);
    if (!primary || !secondary) return false;

    // 1. Combine Arrays & Sets
    const combinedAliases = Array.from(new Set([
      ...primary.aliases,
      ...secondary.aliases,
      secondary.name
    ])).filter(a => a !== primary.name);

    const combinedNotes = Array.from(new Set([
      ...(primary.authorNotes || []),
      ...(secondary.authorNotes || []),
      ...(secondary.summary ? [`Historical note from ${secondary.name}: ${secondary.summary}`] : [])
    ]));

    const combinedTags = Array.from(new Set([
      ...(primary.tags || []),
      ...(secondary.tags || [])
    ]));

    const combinedAppearedIds = Array.from(new Set([
      ...(primary.appearedInChapterIds || []),
      ...(secondary.appearedInChapterIds || [])
    ]));

    const combinedAppearances = [
      ...(primary.chapterAppearances || []),
      ...(secondary.chapterAppearances || [])
    ].filter((v, i, a) => a.findIndex(t => t.chapterNumber === v.chapterNumber) === i);

    const combinedHistory = [
      ...(primary.history || []),
      ...(secondary.history || [])
    ].sort((a, b) => a.chapterNumber - b.chapterNumber);

    // 2. Intelligent Fill for Primary from Secondary
    const mergedData: Partial<Character> = {
      aliases: combinedAliases,
      summary: primary.summary.trim() ? primary.summary : secondary.summary,
      occupation: primary.occupation || secondary.occupation,
      currentLocation: primary.currentLocation || secondary.currentLocation,
      emotionalState: primary.emotionalState || secondary.emotionalState,
      physicalInjuries: primary.physicalInjuries || secondary.physicalInjuries,
      clothing: primary.clothing || secondary.clothing,
      goals: primary.goals || secondary.goals,
      species: primary.species || secondary.species,
      race: primary.race || secondary.race,
      gender: primary.gender || secondary.gender,
      age: primary.age || secondary.age,
      birthday: primary.birthday || secondary.birthday,
      title: primary.title || secondary.title,
      hairColor: primary.hairColor || secondary.hairColor,
      eyeColor: primary.eyeColor || secondary.eyeColor,
      skinTone: primary.skinTone || secondary.skinTone,
      height: primary.height || secondary.height,
      weight: primary.weight || secondary.weight,
      build: primary.build || secondary.build,
      scars: primary.scars || secondary.scars,
      tattoos: primary.tattoos || secondary.tattoos,
      distinguishingFeatures: primary.distinguishingFeatures || secondary.distinguishingFeatures,
      level: primary.level || secondary.level,
      rank: primary.rank || secondary.rank,
      tier: primary.tier || secondary.tier,
      className: primary.className || secondary.className,
      cultivationRealm: primary.cultivationRealm || secondary.cultivationRealm,
      hp: primary.hp || secondary.hp,
      maxHp: primary.maxHp || secondary.maxHp,
      mana: primary.mana || secondary.mana,
      maxMana: primary.maxMana || secondary.maxMana,
      strength: primary.strength || secondary.strength,
      agility: primary.agility || secondary.agility,
      vitality: primary.vitality || secondary.vitality,
      appearedInChapterIds: combinedAppearedIds,
      chapterAppearances: combinedAppearances,
      history: combinedHistory,
      tags: combinedTags,
      authorNotes: combinedNotes,
      ...overrides
    };

    // 3. Update Primary Database Record
    await this.updateCharacter(primaryId, mergedData);

    // 4. Remap Foreign Keys in PostgreSQL Database
    try {
      // Items ownership
      await this.supabase.from('items').update({ owner_character_name: primary.name }).eq('owner_character_name', secondary.name);
      
      // Relationships
      await this.supabase.from('relationships').update({ character1_name: primary.name }).eq('character1_name', secondary.name);
      await this.supabase.from('relationships').update({ character2_name: primary.name }).eq('character2_name', secondary.name);
      
      // Dialogue Facts
      await this.supabase.from('dialogue_facts').update({ speaker: primary.name }).eq('speaker', secondary.name);
      await this.supabase.from('dialogue_facts').update({ recipient: primary.name }).eq('recipient', secondary.name);
    } catch (e) {
      console.warn('[Merge FK Remap Note]:', e);
    }

    // 5. Audit Log Merge Operation
    this.recordMergeAudit({
      id: `merge-${Date.now()}`,
      bookId: primary.bookId,
      entityType: 'character',
      canonicalEntityId: primaryId,
      canonicalEntityName: primary.name,
      mergedEntityId: secondaryId,
      mergedEntityName: secondary.name,
      impactCount: combinedAppearances.length,
      mergedAt: new Date().toISOString()
    });

    // 6. Delete Secondary Record
    await this.deleteCharacter(secondaryId);

    this.notifyDataChanged();
    return true;
  }

  async mergeCharacters(primaryId: string, secondaryId: string): Promise<boolean> {
    return this.intelligentMergeCharacters(primaryId, secondaryId);
  }

  // ==================== MULTI-ENTITY INTELLIGENT MERGE ENGINE ====================

  async intelligentMergeAbilities(primaryId: string, secondaryId: string, overrides?: Partial<Ability>): Promise<boolean> {
    const abilities = await this.getAbilities('');
    const primary = abilities.find(a => a.id === primaryId);
    const secondary = abilities.find(a => a.id === secondaryId);
    if (!primary || !secondary) return false;

    const mergedUsers = Array.from(new Set([...primary.userCharacterNames, ...secondary.userCharacterNames]));
    const mergedTags = Array.from(new Set([...(primary.tags || []), ...(secondary.tags || [])]));
    const mergedNotes = Array.from(new Set([
      ...(primary.authorNotes || []),
      ...(secondary.authorNotes || []),
      ...(secondary.description ? [`Historical info from ${secondary.name}: ${secondary.description}`] : [])
    ]));

    const mergedData: Partial<Ability> = {
      description: primary.description.trim() ? primary.description : secondary.description,
      category: primary.category || secondary.category,
      userCharacterNames: mergedUsers,
      evolutionNotes: primary.evolutionNotes || secondary.evolutionNotes,
      tags: mergedTags,
      authorNotes: mergedNotes,
      ...overrides
    };

    await this.updateAbility(primaryId, mergedData);

    this.recordMergeAudit({
      id: `merge-${Date.now()}`,
      bookId: primary.bookId,
      entityType: 'ability',
      canonicalEntityId: primaryId,
      canonicalEntityName: primary.name,
      mergedEntityId: secondaryId,
      mergedEntityName: secondary.name,
      impactCount: mergedUsers.length,
      mergedAt: new Date().toISOString()
    });

    await this.deleteAbility(secondaryId);
    this.notifyDataChanged();
    return true;
  }

  async intelligentMergeItems(primaryId: string, secondaryId: string, overrides?: Partial<Item>): Promise<boolean> {
    const items = await this.getItems('');
    const primary = items.find(i => i.id === primaryId);
    const secondary = items.find(i => i.id === secondaryId);
    if (!primary || !secondary) return false;

    const mergedAppearedIds = Array.from(new Set([...(primary.appearedInChapterIds || []), ...(secondary.appearedInChapterIds || [])]));
    const mergedTags = Array.from(new Set([...(primary.tags || []), ...(secondary.tags || [])]));
    const mergedNotes = Array.from(new Set([
      ...(primary.authorNotes || []),
      ...(secondary.authorNotes || []),
      ...(secondary.description ? [`Historical description from ${secondary.name}: ${secondary.description}`] : [])
    ]));

    const mergedData: Partial<Item> = {
      description: primary.description.trim() ? primary.description : secondary.description,
      type: primary.type || secondary.type,
      ownerCharacterName: primary.ownerCharacterName || secondary.ownerCharacterName,
      previousOwnerName: primary.previousOwnerName || secondary.previousOwnerName,
      currentLocationName: primary.currentLocationName || secondary.currentLocationName,
      condition: primary.condition || secondary.condition,
      status: primary.status || secondary.status,
      appearedInChapterIds: mergedAppearedIds,
      tags: mergedTags,
      authorNotes: mergedNotes,
      ...overrides
    };

    await this.updateItem(primaryId, mergedData);

    this.recordMergeAudit({
      id: `merge-${Date.now()}`,
      bookId: primary.bookId,
      entityType: 'item',
      canonicalEntityId: primaryId,
      canonicalEntityName: primary.name,
      mergedEntityId: secondaryId,
      mergedEntityName: secondary.name,
      impactCount: mergedAppearedIds.length,
      mergedAt: new Date().toISOString()
    });

    await this.deleteItem(secondaryId);
    this.notifyDataChanged();
    return true;
  }

  async intelligentMergeLocations(primaryId: string, secondaryId: string, overrides?: Partial<LocationEntity>): Promise<boolean> {
    const locations = await this.getLocations('');
    const primary = locations.find(l => l.id === primaryId);
    const secondary = locations.find(l => l.id === secondaryId);
    if (!primary || !secondary) return false;

    const mergedCharsPresent = Array.from(new Set([...primary.charactersPresentNames, ...secondary.charactersPresentNames]));
    const mergedEvents = Array.from(new Set([...primary.eventsOccurred, ...secondary.eventsOccurred]));
    const mergedAppearedIds = Array.from(new Set([...(primary.appearedInChapterIds || []), ...(secondary.appearedInChapterIds || [])]));
    const mergedTags = Array.from(new Set([...(primary.tags || []), ...(secondary.tags || [])]));

    const mergedData: Partial<LocationEntity> = {
      summary: primary.summary.trim() ? primary.summary : secondary.summary,
      type: primary.type || secondary.type,
      charactersPresentNames: mergedCharsPresent,
      eventsOccurred: mergedEvents,
      appearedInChapterIds: mergedAppearedIds,
      tags: mergedTags,
      ...overrides
    };

    await this.updateLocation(primaryId, mergedData);

    // Remap location references across items & characters
    try {
      await this.supabase.from('items').update({ current_location_name: primary.name }).eq('current_location_name', secondary.name);
      await this.supabase.from('characters').update({ current_location: primary.name }).eq('current_location', secondary.name);
    } catch (e) {}

    this.recordMergeAudit({
      id: `merge-${Date.now()}`,
      bookId: primary.bookId,
      entityType: 'location',
      canonicalEntityId: primaryId,
      canonicalEntityName: primary.name,
      mergedEntityId: secondaryId,
      mergedEntityName: secondary.name,
      impactCount: mergedCharsPresent.length,
      mergedAt: new Date().toISOString()
    });

    await this.deleteLocation(secondaryId);
    this.notifyDataChanged();
    return true;
  }

  // ==================== MULTI-ENTITY DUPLICATE FINDERS ====================

  async findDuplicateAbilitySuggestions(bookId: string): Promise<{ item1: Ability; item2: Ability; confidence: number }[]> {
    const list = await this.getAbilities(bookId);
    const suggestions: { item1: Ability; item2: Ability; confidence: number }[] = [];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (isHighlySimilar(list[i].name, list[j].name)) {
          suggestions.push({ item1: list[i], item2: list[j], confidence: 95 });
        }
      }
    }
    return suggestions;
  }

  async findDuplicateItemSuggestions(bookId: string): Promise<{ item1: Item; item2: Item; confidence: number }[]> {
    const list = await this.getItems(bookId);
    const suggestions: { item1: Item; item2: Item; confidence: number }[] = [];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (isHighlySimilar(list[i].name, list[j].name)) {
          suggestions.push({ item1: list[i], item2: list[j], confidence: 95 });
        }
      }
    }
    return suggestions;
  }

  async findDuplicateLocationSuggestions(bookId: string): Promise<{ item1: LocationEntity; item2: LocationEntity; confidence: number }[]> {
    const list = await this.getLocations(bookId);
    const suggestions: { item1: LocationEntity; item2: LocationEntity; confidence: number }[] = [];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (isHighlySimilar(list[i].name, list[j].name)) {
          suggestions.push({ item1: list[i], item2: list[j], confidence: 95 });
        }
      }
    }
    return suggestions;
  }

  // ==================== MERGE AUDIT LOG ENGINE ====================

  private recordMergeAudit(record: any) {
    if (typeof window === 'undefined') return;
    try {
      const history = JSON.parse(localStorage.getItem('notter_merge_history') || '[]');
      history.unshift(record);
      localStorage.setItem('notter_merge_history', JSON.stringify(history.slice(0, 100)));
    } catch (e) {}
  }

  getMergeHistory(): any[] {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('notter_merge_history') || '[]');
    } catch (e) {
      return [];
    }
  }
}

export const repository = new StoryRepository();
