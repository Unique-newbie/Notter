'use client';

import React, { useState } from 'react';
import { Character } from '@/types';
import { Merge, AlertTriangle, Check, X, ShieldAlert, ArrowRight } from 'lucide-react';

interface ConflictItem {
  key: keyof Character;
  label: string;
  valA: any;
  valB: any;
  choice: 'A' | 'B' | 'BOTH';
}

interface MergeConflictModalProps {
  isOpen: boolean;
  primaryChar: Character;
  secondaryChar: Character;
  onConfirmMerge: (resolvedOverrides: Partial<Character>) => Promise<void>;
  onClose: () => void;
}

export function MergeConflictModal({
  isOpen,
  primaryChar,
  secondaryChar,
  onConfirmMerge,
  onClose
}: MergeConflictModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Identify conflicting non-empty fields
  const detectConflicts = (): ConflictItem[] => {
    const fields: { key: keyof Character; label: string }[] = [
      { key: 'occupation', label: 'Occupation' },
      { key: 'currentLocation', label: 'Current Location' },
      { key: 'species', label: 'Species / Race' },
      { key: 'hairColor', label: 'Hair Color' },
      { key: 'eyeColor', label: 'Eye Color' },
      { key: 'height', label: 'Height' },
      { key: 'weight', label: 'Weight' },
      { key: 'build', label: 'Build' },
      { key: 'scars', label: 'Scars & Tattoos' },
      { key: 'clothing', label: 'Attire & Outfit' },
      { key: 'level', label: 'Level / Tier' },
      { key: 'rank', label: 'Rank' },
      { key: 'className', label: 'Class / Profession' }
    ];

    const conflicts: ConflictItem[] = [];

    fields.forEach(f => {
      const vA = primaryChar[f.key];
      const vB = secondaryChar[f.key];

      if (vA && vB && String(vA).trim() !== String(vB).trim()) {
        conflicts.push({
          key: f.key,
          label: f.label,
          valA: vA,
          valB: vB,
          choice: 'A'
        });
      }
    });

    return conflicts;
  };

  const [conflicts, setConflicts] = useState<ConflictItem[]>(() => detectConflicts());

  if (!isOpen) return null;

  const handleSetChoice = (index: number, choice: 'A' | 'B' | 'BOTH') => {
    setConflicts(prev => {
      const next = [...prev];
      next[index].choice = choice;
      return next;
    });
  };

  const handleSelectAll = (choice: 'A' | 'B') => {
    setConflicts(prev => prev.map(c => ({ ...c, choice })));
  };

  const handleExecuteMerge = async () => {
    setIsSubmitting(true);
    const overrides: Partial<Character> = {};

    conflicts.forEach(c => {
      if (c.choice === 'A') {
        (overrides as any)[c.key] = c.valA;
      } else if (c.choice === 'B') {
        (overrides as any)[c.key] = c.valB;
      } else if (c.choice === 'BOTH') {
        (overrides as any)[c.key] = `${c.valA} / ${c.valB}`;
      }
    });

    await onConfirmMerge(overrides);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#121218] border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#232334] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Intelligent Merge Conflict Resolution</h3>
              <p className="text-xs text-[#8e8ea0] mt-0.5">
                Merging <strong className="text-white">&quot;{secondaryChar.name}&quot;</strong> into <strong className="text-white">&quot;{primaryChar.name}&quot;</strong>. Choose values for conflicting fields.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-[#8e8ea0] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Conflict Controls */}
        <div className="flex items-center justify-between bg-[#181820] p-3 rounded-xl border border-[#232334] text-xs font-bold">
          <span className="text-[#8e8ea0]">Quick Action:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSelectAll('A')}
              className="px-3 py-1 rounded-lg bg-[#232334] text-[#a78bfa] hover:text-white"
            >
              Keep All Primary ({primaryChar.name})
            </button>
            <button
              onClick={() => handleSelectAll('B')}
              className="px-3 py-1 rounded-lg bg-[#232334] text-amber-300 hover:text-white"
            >
              Keep All Secondary ({secondaryChar.name})
            </button>
          </div>
        </div>

        {/* Conflict Items List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {conflicts.length === 0 ? (
            <div className="p-8 text-center text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              No conflicting fields detected! All non-empty fields and histories will be combined automatically.
            </div>
          ) : (
            conflicts.map((item, idx) => (
              <div key={item.key as string} className="p-4 rounded-xl bg-[#181820] border border-[#232334] space-y-2">
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#a78bfa]">
                  {item.label}
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  {/* Choice A */}
                  <button
                    type="button"
                    onClick={() => handleSetChoice(idx, 'A')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      item.choice === 'A'
                        ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-white shadow-purple font-bold'
                        : 'bg-[#121218] border-[#232334] text-[#8e8ea0] hover:text-white'
                    }`}
                  >
                    <div className="text-[10px] uppercase text-[#7c3aed]">Primary</div>
                    <div className="truncate mt-0.5">{String(item.valA)}</div>
                  </button>

                  {/* Choice B */}
                  <button
                    type="button"
                    onClick={() => handleSetChoice(idx, 'B')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      item.choice === 'B'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg font-bold'
                        : 'bg-[#121218] border-[#232334] text-[#8e8ea0] hover:text-white'
                    }`}
                  >
                    <div className="text-[10px] uppercase text-amber-400">Secondary</div>
                    <div className="truncate mt-0.5">{String(item.valB)}</div>
                  </button>

                  {/* Choice Both */}
                  <button
                    type="button"
                    onClick={() => handleSetChoice(idx, 'BOTH')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      item.choice === 'BOTH'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-lg font-bold'
                        : 'bg-[#121218] border-[#232334] text-[#8e8ea0] hover:text-white'
                    }`}
                  >
                    <div className="text-[10px] uppercase text-cyan-400">Combine Both</div>
                    <div className="truncate mt-0.5">{String(item.valA)} / {String(item.valB)}</div>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#232334]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-[#181820] text-[#a1a1aa] font-bold text-xs hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecuteMerge}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-xs hover:from-amber-600 hover:to-orange-700 shadow-xl flex items-center gap-1.5 disabled:opacity-50"
          >
            <Merge className="w-4 h-4" /> {isSubmitting ? 'Merging Entities...' : 'Confirm Intelligent Merge'}
          </button>
        </div>

      </div>
    </div>
  );
}
