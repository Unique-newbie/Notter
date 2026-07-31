import {
  Book, Chapter, Character, Ability, Item, LocationEntity,
  Organization, Relationship, TimelineEvent, PlotThread,
  Foreshadowing, AIExtraction, StructuredExtractionJSON,
  DialogueFactEntity, EntityHistoryEvent
} from '@/types';
import { createClient } from '@/lib/supabase/client';
import { isHighlySimilar } from '@/lib/ai/validator';

class StoryRepository {
  private supabase = createClient();

  private notifyDataChanged() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('storybible_data_changed'));
    }
  }

  // ==================== BOOK METHODS ====================

  async getBooks(): Promise<Book[]> {
    const { data, error } = await this.supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(b => ({
      id: b.id,
      title: b.title,
      description: b.description || '',
      coverColor: b.cover_color || '#7C3AED',
      genre: b.genre || 'Fantasy',
      status: b.status || 'Drafting',
      createdAt: b.created_at,
      updatedAt: b.updated_at
    }));
  }

  async getBook(id: string): Promise<Book | undefined> {
    const { data, error } = await this.supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;
    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      coverColor: data.cover_color || '#7C3AED',
      genre: data.genre || 'Fantasy',
      status: data.status || 'Drafting',
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async createBook(book: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'chapterCount' | 'totalWordCount'>): Promise<Book | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('books')
      .insert({
        user_id: user.id,
        title: book.title,
        description: book.description || '',
        cover_color: book.coverColor || '#7C3AED',
        genre: book.genre || 'Fantasy',
        status: book.status || 'Drafting'
      })
      .select('*')
      .single();

    if (error || !data) return null;
    this.notifyDataChanged();
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      coverColor: data.cover_color,
      genre: data.genre,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async updateBook(id: string, updates: Partial<Book>): Promise<boolean> {
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.genre !== undefined) updateData.genre = updates.genre;
    if (updates.coverColor !== undefined) updateData.cover_color = updates.coverColor;
    if (updates.status !== undefined) updateData.status = updates.status;

    updateData.updated_at = new Date().toISOString();

    const { error } = await this.supabase.from('books').update(updateData).eq('id', id);
    if (error) return false;
    this.notifyDataChanged();
    return true;
  }

  async deleteBook(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('books').delete().eq('id', id);
    if (error) return false;
    this.notifyDataChanged();
    return true;
  }

  // ==================== CHAPTER METHODS ====================

  async getChapters(bookId: string): Promise<Chapter[]> {
    const { data, error } = await this.supabase
      .from('chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('chapter_number', { ascending: true });

    if (error || !data) return [];
    return data.map(c => ({
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

  async createChapter(bookId: string, title: string, content: string, chapterNumber?: number): Promise<Chapter | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const existingChaps = await this.getChapters(bookId);
    const nextNum = chapterNumber || (existingChaps.length > 0 ? Math.max(...existingChaps.map(c => c.chapterNumber)) + 1 : 1);
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

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

    if (error || !data) return null;
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

    const { error } = await this.supabase.from('chapters').update(updateData).eq('id', id);
    if (error) return false;
    this.notifyDataChanged();
    return true;
  }

  async deleteChapter(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('chapters').delete().eq('id', id);
    if (error) return false;
    this.notifyDataChanged();
    return true;
  }

  // ==================== ENTITY GETTERS ====================

  async getCharacters(bookId: string): Promise<Character[]> {
    const { data, error } = await this.supabase.from('characters').select('*').eq('book_id', bookId);
    if (error || !data) return [];
    return data.map(c => ({
      id: c.id, bookId: c.book_id, name: c.name, aliases: c.aliases || [], summary: c.summary || '',
      status: c.status || 'Active', occupation: c.occupation, currentLocation: c.current_location,
      emotionalState: c.emotional_state, physicalInjuries: c.physical_injuries, physicalChanges: c.physical_changes,
      clothing: c.clothing, goals: c.goals, secretsRevealed: c.secrets_revealed || [],
      promisesMade: c.promises_made || [], promisesBroken: c.promises_broken || [],
      decisions: c.decisions || [], knowledgeGained: c.knowledge_gained || [],
      firstAppearanceChapterId: c.first_appearance_chapter_id, lastAppearanceChapterId: c.last_appearance_chapter_id,
      appearedInChapterIds: c.appeared_in_chapter_ids || [], chapterAppearances: c.chapter_appearances || [],
      history: c.history || [], tags: c.tags || [], authorNotes: c.author_notes || [], createdAt: c.created_at
    }));
  }

  async getAbilities(bookId: string): Promise<Ability[]> {
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
    const { data, error } = await this.supabase.from('organizations').select('*').eq('book_id', bookId);
    if (error || !data) return [];
    return data.map(o => ({
      id: o.id, bookId: o.book_id, name: o.name, description: o.description || '', alignment: o.alignment,
      leaderName: o.leader_name, memberNames: o.member_names || [], history: o.history || [],
      tags: o.tags || [], authorNotes: o.author_notes || [], createdAt: o.created_at
    }));
  }

  async getRelationships(bookId: string): Promise<Relationship[]> {
    const { data, error } = await this.supabase.from('relationships').select('*').eq('book_id', bookId);
    if (error || !data) return [];
    return data.map(r => ({
      id: r.id, bookId: r.book_id, character1Name: r.character1_name, character2Name: r.character2_name,
      relationType: r.relation_type, status: r.status, description: r.description, createdAt: r.created_at
    }));
  }

  async getDialogueFacts(bookId: string): Promise<DialogueFactEntity[]> {
    const { data, error } = await this.supabase.from('dialogue_facts').select('*').eq('book_id', bookId);
    if (error || !data) return [];
    return data.map(d => ({
      id: d.id, bookId: d.book_id, chapterId: d.chapter_id, chapterNumber: d.chapter_number,
      speaker: d.speaker, recipient: d.recipient, type: d.type, fact: d.fact, createdAt: d.created_at
    }));
  }

  async getTimelineEvents(bookId: string): Promise<TimelineEvent[]> {
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
      goals: data.goals, appearedInChapterIds: [], createdAt: data.created_at
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

          await this.supabase.from('characters').update({
            summary: c.summary || ex.summary, status: c.status || ex.status, occupation: c.occupation || ex.occupation,
            current_location: c.location || ex.current_location, emotional_state: c.emotional_state || ex.emotional_state,
            physical_injuries: c.physical_injuries || ex.physical_injuries, clothing: c.clothing || ex.clothing, goals: c.goals || ex.goals,
            appeared_in_chapter_ids: appIds, chapter_appearances: appearances
          }).eq('id', ex.id);
        } else {
          await this.supabase.from('characters').insert({
            user_id: userId, book_id: bookId, name: c.name, aliases: c.aliases || [], summary: c.summary || '',
            status: c.status || 'Active', occupation: c.occupation, current_location: c.location, emotional_state: c.emotional_state,
            physical_injuries: c.physical_injuries, clothing: c.clothing, goals: c.goals,
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
          if (!ev.title || !isApproved(`event-${ev.title}-${i}`)) continue;

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
          if (!pt.title || !isApproved(`pt-${pt.title}-${i}`)) continue;

          await this.supabase.from('plot_threads').insert({
            user_id: userId, book_id: bookId, chapter_id: chapterId, title: pt.title, description: pt.description || '', status: 'Open'
          });
        }
      }

      // 10. Process Foreshadowing
      if (data.foreshadowing && Array.isArray(data.foreshadowing)) {
        for (let i = 0; i < data.foreshadowing.length; i++) {
          const fs = data.foreshadowing[i];
          if (!fs.clueDescription || !isApproved(`fs-${fs.clueDescription}-${i}`)) continue;

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

  async mergeCharacters(primaryId: string, secondaryId: string): Promise<boolean> {
    return this.deleteCharacter(secondaryId);
  }
}

export const repository = new StoryRepository();
