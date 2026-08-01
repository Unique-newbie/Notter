import React from 'react';
import { Search, Plus } from 'lucide-react';
import { Character } from '@/types';

interface CharacterListSidebarProps {
  charListQuery: string;
  setCharListQuery: (val: string) => void;
  filteredCharacters: Character[];
  selectedChar: Character | null;
  setSelectedChar: (char: Character) => void;
  openCreateModal: () => void;
}

export function CharacterListSidebar({
  charListQuery,
  setCharListQuery,
  filteredCharacters,
  selectedChar,
  setSelectedChar,
  openCreateModal
}: CharacterListSidebarProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 text-[#7c3aed] absolute left-3 top-3" />
        <input
          type="text"
          value={charListQuery}
          onChange={(e) => setCharListQuery(e.target.value)}
          placeholder="Search characters by name, alias..."
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#121218] border border-[#232334] text-white text-xs placeholder-[#52526b] focus:outline-none focus:border-[#7c3aed]"
        />
      </div>

      <div className="space-y-2 max-h-[78vh] overflow-y-auto pr-1">
        {filteredCharacters.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#121218] border border-[#232334] text-[#8e8ea0] text-xs space-y-2">
            <div>No characters found matching query.</div>
            <button onClick={openCreateModal} className="px-4 py-1.5 rounded-lg bg-[#7c3aed] text-white font-bold text-xs">
              + Create Character
            </button>
          </div>
        ) : (
          filteredCharacters.map((char) => {
            const isSelected = selectedChar?.id === char.id;
            return (
              <div
                key={char.id}
                onClick={() => setSelectedChar(char)}
                className={`p-4 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-[#121218] border-[#7c3aed] shadow-purple'
                    : 'bg-[#121218]/60 border-[#232334] hover:border-[#7c3aed]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-white text-sm flex items-center gap-2">
                    {char.name}
                    {char.level && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Lv.{char.level}
                      </span>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#1e1e2a] text-[#a78bfa]">
                    {char.status}
                  </span>
                </div>

                <p className="text-xs text-[#8e8ea0] mt-1.5 line-clamp-2 leading-relaxed">{char.summary}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
