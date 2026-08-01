'use client';

import React, { useState, useEffect } from 'react';
import { repository } from '@/lib/store/repository';
import { Character, Ability, Item, LocationEntity, DialogueFactEntity } from '@/types';
import { Search, X, Users, Shield, Package, MapPin, MessageSquare, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SearchModalProps {
  isOpen: boolean;
  bookId: string;
  onClose: () => void;
}

export function SearchModal({ isOpen, bookId, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [abilities, setAbilities] = useState<Ability[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<LocationEntity[]>([]);
  const [dialogueFacts, setDialogueFacts] = useState<DialogueFactEntity[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    repository.getCharacters(bookId).then(setCharacters);
    repository.getAbilities(bookId).then(setAbilities);
    repository.getItems(bookId).then(setItems);
    repository.getLocations(bookId).then(setLocations);
    repository.getDialogueFacts(bookId).then(setDialogueFacts);
  }, [isOpen, bookId]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredChars = q ? characters.filter(c => c.name.toLowerCase().includes(q) || (c.summary && c.summary.toLowerCase().includes(q))) : [];
  const filteredAbilities = q ? abilities.filter(a => a.name.toLowerCase().includes(q) || (a.description && a.description.toLowerCase().includes(q))) : [];
  const filteredItems = q ? items.filter(i => i.name.toLowerCase().includes(q) || (i.description && i.description.toLowerCase().includes(q))) : [];
  const filteredLocations = q ? locations.filter(l => l.name.toLowerCase().includes(q) || (l.summary && l.summary.toLowerCase().includes(q))) : [];
  const filteredDialogue = q ? dialogueFacts.filter(d => d.fact.toLowerCase().includes(q) || d.speaker.toLowerCase().includes(q)) : [];

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/85 backdrop-blur-md p-4 pt-16 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#121218] border border-[#7c3aed]/40 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        
        {/* Search Bar Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-[#7c3aed] absolute left-4 top-3.5" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search characters, spells, artifacts, locations, dialogue facts..."
            className="w-full pl-12 pr-10 py-3 rounded-xl bg-[#0c0c10] border border-[#232334] text-white text-sm placeholder-[#52526b] focus:outline-none focus:border-[#7c3aed]"
          />
          <button onClick={onClose} className="absolute right-3 top-3.5 text-[#8e8ea0] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {!q ? (
            <div className="p-8 text-center text-[#8e8ea0]">
              Type a character name, spell, artifact, location, or promise to search across the Story Bible...
            </div>
          ) : (
            <>
              {/* Characters */}
              {filteredChars.length > 0 && (
                <div className="space-y-2">
                  <div className="font-extrabold text-[#a78bfa] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Characters ({filteredChars.length})
                  </div>
                  {filteredChars.map(c => (
                    <Link key={c.id} href={`/books/${bookId}/characters?id=${c.id}`} onClick={onClose} className="block p-3 rounded-xl bg-[#181820] hover:bg-[#232334] border border-[#232334] text-white font-bold">
                      {c.name} <span className="text-[#8e8ea0] font-normal text-[11px] block mt-0.5">{c.summary}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Abilities */}
              {filteredAbilities.length > 0 && (
                <div className="space-y-2">
                  <div className="font-extrabold text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Abilities &amp; Spells ({filteredAbilities.length})
                  </div>
                  {filteredAbilities.map(a => (
                    <Link key={a.id} href={`/books/${bookId}/abilities?id=${a.id}`} onClick={onClose} className="block p-3 rounded-xl bg-[#181820] hover:bg-[#232334] border border-[#232334] text-white font-bold">
                      {a.name} <span className="text-[#8e8ea0] font-normal text-[11px] block mt-0.5">{a.description}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Items */}
              {filteredItems.length > 0 && (
                <div className="space-y-2">
                  <div className="font-extrabold text-cyan-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" /> Items &amp; Artifacts ({filteredItems.length})
                  </div>
                  {filteredItems.map(i => (
                    <Link key={i.id} href={`/books/${bookId}/items?id=${i.id}`} onClick={onClose} className="block p-3 rounded-xl bg-[#181820] hover:bg-[#232334] border border-[#232334] text-white font-bold">
                      {i.name} <span className="text-[#8e8ea0] font-normal text-[11px] block mt-0.5">{i.description}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Locations */}
              {filteredLocations.length > 0 && (
                <div className="space-y-2">
                  <div className="font-extrabold text-emerald-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Locations ({filteredLocations.length})
                  </div>
                  {filteredLocations.map(l => (
                    <Link key={l.id} href={`/books/${bookId}/locations?id=${l.id}`} onClick={onClose} className="block p-3 rounded-xl bg-[#181820] hover:bg-[#232334] border border-[#232334] text-white font-bold">
                      {l.name} <span className="text-[#8e8ea0] font-normal text-[11px] block mt-0.5">{l.summary}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Dialogue Facts */}
              {filteredDialogue.length > 0 && (
                <div className="space-y-2">
                  <div className="font-extrabold text-pink-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Dialogue Commitments ({filteredDialogue.length})
                  </div>
                  {filteredDialogue.map(df => (
                    <div key={df.id} className="p-3 rounded-xl bg-[#181820] border border-[#232334]">
                      <div className="font-bold text-amber-300">{df.speaker} → {df.recipient || 'Everyone'}</div>
                      <div className="text-white font-mono mt-0.5">&quot;{df.fact}&quot;</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
