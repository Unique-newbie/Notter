import React from 'react';
import { Character } from '@/types';
import { FileText, Merge, ChevronDown, Trash2 } from 'lucide-react';

interface CharacterCodexHeaderProps {
  selectedChar: Character;
  openEditProfileModal: (char: Character) => void;
  mergeDropdownOpen: boolean;
  setMergeDropdownOpen: (val: boolean) => void;
  mergeCandidates: Character[];
  handleInitiateMerge: (primary: Character, secondary: Character) => void;
  handleDelete: () => void;
}

export function CharacterCodexHeader({
  selectedChar,
  openEditProfileModal,
  mergeDropdownOpen,
  setMergeDropdownOpen,
  mergeCandidates,
  handleInitiateMerge,
  handleDelete
}: CharacterCodexHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232334] pb-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7c3aed]/30 to-[#1e1e2a] border border-[#7c3aed]/40 flex items-center justify-center text-white font-extrabold text-xl shadow-purple">
          {selectedChar.name.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white">{selectedChar.name}</h2>
            {selectedChar.level && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Level {selectedChar.level} {selectedChar.className || ''}
              </span>
            )}
          </div>
          {selectedChar.aliases && selectedChar.aliases.length > 0 && (
            <p className="text-xs text-[#8e8ea0] mt-0.5 font-mono">
              Aliases: {selectedChar.aliases.join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => openEditProfileModal(selectedChar)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-[#181820] text-[#a78bfa] border-[#232334] hover:border-[#7c3aed]/50 transition-all"
        >
          <FileText className="w-3.5 h-3.5" /> Edit Codex
        </button>

        {/* Intelligent Merge Select */}
        <div className="relative">
          <button
            onClick={() => setMergeDropdownOpen(!mergeDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-[#181820] text-amber-400 border-amber-500/30 hover:bg-amber-500/10 transition-all"
          >
            <Merge className="w-3.5 h-3.5" /> Merge <ChevronDown className="w-3 h-3" />
          </button>

          {mergeDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-[#0c0c10] border border-[#232334] p-2 shadow-2xl z-50 space-y-1">
              <div className="text-[10px] font-bold uppercase text-[#8e8ea0] px-2 py-1">Select Duplicate to Merge Into &quot;{selectedChar.name}&quot;</div>
              {mergeCandidates.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setMergeDropdownOpen(false);
                    handleInitiateMerge(selectedChar, c);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[#181820] text-white"
                >
                  <div className="font-bold">{c.name}</div>
                  <div className="text-[10px] text-[#8e8ea0] line-clamp-1">{c.summary}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleDelete}
          className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 border border-[#232334]"
          title="Delete Character"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
