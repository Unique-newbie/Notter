'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Users, Package, FileText, ArrowRight, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { repository } from '@/lib/store/repository';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBookId?: string;
}

export function GlobalSearchModal({ isOpen, onClose, activeBookId }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [targetBookId, setTargetBookId] = useState(activeBookId || 'book-1');
  const [results, setResults] = useState<{
    chapters: any[];
    characters: any[];
    abilities: any[];
    items: any[];
    locations: any[];
    events: any[];
    dialogueFacts: any[];
  }>({
    chapters: [],
    characters: [],
    abilities: [],
    items: [],
    locations: [],
    events: [],
    dialogueFacts: []
  });

  useEffect(() => {
    const loadTargetBook = async () => {
      if (activeBookId) {
        setTargetBookId(activeBookId);
      } else {
        const books = await repository.getBooks();
        if (books.length > 0) setTargetBookId(books[0].id);
      }
    };
    loadTargetBook();
  }, [activeBookId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const runSearch = async () => {
      if (!query.trim()) {
        setResults({ chapters: [], characters: [], abilities: [], items: [], locations: [], events: [], dialogueFacts: [] });
        return;
      }

      const q = query.toLowerCase();
      const rawChapters = await repository.getChapters(targetBookId);
      const rawCharacters = await repository.getCharacters(targetBookId);
      const rawAbilities = await repository.getAbilities(targetBookId);
      const rawItems = await repository.getItems(targetBookId);
      const rawLocations = await repository.getLocations(targetBookId);
      const rawEvents = await repository.getTimelineEvents(targetBookId);
      const rawDialogueFacts = await repository.getDialogueFacts(targetBookId);

      const chapters = rawChapters.filter(c => c.title.toLowerCase().includes(q) || c.content.toLowerCase().includes(q));
      const characters = rawCharacters.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        (c.aliases && c.aliases.some(a => a.toLowerCase().includes(q))) ||
        (c.tags && c.tags.some(t => t.toLowerCase().includes(q)))
      );
      const abilities = rawAbilities.filter(a => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
      const items = rawItems.filter(i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
      const locations = rawLocations.filter(l => l.name.toLowerCase().includes(q) || l.summary.toLowerCase().includes(q));
      const events = rawEvents.filter(e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
      const dialogueFacts = rawDialogueFacts.filter(d => d.speaker.toLowerCase().includes(q) || d.fact.toLowerCase().includes(q));

      setResults({ chapters, characters, abilities, items, locations, events, dialogueFacts });
    };

    runSearch();
  }, [query, targetBookId]);

  if (!isOpen) return null;

  const hasResults =
    results.chapters.length > 0 ||
    results.characters.length > 0 ||
    results.abilities.length > 0 ||
    results.items.length > 0 ||
    results.locations.length > 0 ||
    results.events.length > 0 ||
    results.dialogueFacts.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#121218] border border-[#232334] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-[#232334] bg-[#0c0c10]">
          <Search className="w-5 h-5 text-[#8e8ea0] mr-3" />
          <input
            type="text"
            autoFocus
            placeholder="Search characters, abilities, items, dialogue facts, events, locations, chapters..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-[#8e8ea0] text-sm focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-[#8e8ea0] hover:text-white mr-2">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-[10px] font-mono font-semibold text-[#8e8ea0] bg-[#1e1e2a] rounded border border-[#232334]">
            ESC
          </kbd>
        </div>

        {/* Search Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 text-xs">
          {!query.trim() && (
            <div className="p-8 text-center text-[#8e8ea0]">
              Type a name, item, ability, dialogue fact, or event title to search.
            </div>
          )}

          {query.trim() && !hasResults && (
            <div className="p-8 text-center text-[#8e8ea0]">
              No canon results found matching &quot;{query}&quot;.
            </div>
          )}

          {/* Characters */}
          {results.characters.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#a78bfa] mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Characters ({results.characters.length})
              </div>
              <div className="space-y-1">
                {results.characters.map((c) => (
                  <Link
                    key={c.id}
                    href={`/books/${targetBookId}/characters?id=${c.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#181820] hover:bg-[#1e1e2a] border border-[#232334] text-white transition-colors"
                  >
                    <div>
                      <div className="font-bold text-sm">{c.name}</div>
                      <div className="text-xs text-[#8e8ea0] line-clamp-1">{c.summary}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#8e8ea0]" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Dialogue Facts */}
          {results.dialogueFacts.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Dialogue Commitments & Secrets ({results.dialogueFacts.length})
              </div>
              <div className="space-y-1">
                {results.dialogueFacts.map((d) => (
                  <Link
                    key={d.id}
                    href={`/books/${targetBookId}/chapters?id=${d.chapterId}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#181820] hover:bg-[#1e1e2a] border border-amber-500/20 text-white transition-colors"
                  >
                    <div>
                      <div className="font-bold text-amber-300">
                        {d.speaker} ({d.type} - Ch. {d.chapterNumber})
                      </div>
                      <div className="text-xs text-[#a1a1aa] font-mono">&quot;{d.fact}&quot;</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#8e8ea0]" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          {results.items.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#f59e0b] mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Items ({results.items.length})
              </div>
              <div className="space-y-1">
                {results.items.map((i) => (
                  <Link
                    key={i.id}
                    href={`/books/${targetBookId}/items?id=${i.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#181820] hover:bg-[#1e1e2a] border border-[#232334] text-white transition-colors"
                  >
                    <div>
                      <div className="font-bold text-sm">{i.name}</div>
                      <div className="text-xs text-[#8e8ea0] line-clamp-1">{i.description}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#8e8ea0]" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Chapters */}
          {results.chapters.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Chapters ({results.chapters.length})
              </div>
              <div className="space-y-1">
                {results.chapters.map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/books/${targetBookId}/chapters?id=${ch.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#181820] hover:bg-[#1e1e2a] border border-[#232334] text-white transition-colors"
                  >
                    <div>
                      <div className="font-bold text-sm">Ch. {ch.chapterNumber} — {ch.title}</div>
                      <div className="text-xs text-[#8e8ea0] line-clamp-1">{ch.content.substring(0, 100)}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#8e8ea0]" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
