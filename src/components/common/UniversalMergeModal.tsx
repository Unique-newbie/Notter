'use client';

import React, { useState } from 'react';
import { Merge, ShieldAlert, X, Check, ArrowRight } from 'lucide-react';

interface UniversalMergeModalProps {
  isOpen: boolean;
  entityType: 'character' | 'ability' | 'item' | 'location' | 'organization' | 'event';
  primaryEntity: { id: string; name: string; description?: string; summary?: string };
  secondaryEntity: { id: string; name: string; description?: string; summary?: string };
  onConfirmMerge: (primaryId: string, secondaryId: string, overrides?: any) => Promise<void>;
  onClose: () => void;
}

export function UniversalMergeModal({
  isOpen,
  entityType,
  primaryEntity,
  secondaryEntity,
  onConfirmMerge,
  onClose
}: UniversalMergeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chosenDescription, setChosenDescription] = useState<'primary' | 'secondary' | 'combine'>('combine');

  if (!isOpen) return null;

  const handleExecute = async () => {
    setIsSubmitting(true);
    let descOverride = undefined;
    const pText = primaryEntity.description || primaryEntity.summary || '';
    const sText = secondaryEntity.description || secondaryEntity.summary || '';

    if (chosenDescription === 'primary') {
      descOverride = pText;
    } else if (chosenDescription === 'secondary') {
      descOverride = sText;
    } else if (chosenDescription === 'combine') {
      descOverride = `${pText}\n\n[Merged Record from ${secondaryEntity.name}]: ${sText}`;
    }

    const overrides = entityType === 'location'
      ? { summary: descOverride }
      : { description: descOverride };

    await onConfirmMerge(primaryEntity.id, secondaryEntity.id, overrides);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#121218] border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#232334] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Merge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base capitalize">Intelligent {entityType} Merge</h3>
              <p className="text-xs text-[#8e8ea0] mt-0.5">
                Merging <strong className="text-white">&quot;{secondaryEntity.name}&quot;</strong> into canonical <strong className="text-white">&quot;{primaryEntity.name}&quot;</strong>.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-[#8e8ea0] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entity Comparison Cards */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#181820] border border-[#7c3aed]/40 space-y-1">
            <div className="text-[10px] font-bold text-[#a78bfa] uppercase">Primary (Canonical Target)</div>
            <div className="font-extrabold text-white text-sm">{primaryEntity.name}</div>
            <p className="text-[#8e8ea0] text-[11px] line-clamp-3 leading-relaxed mt-1">
              {primaryEntity.description || primaryEntity.summary || 'No description.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#181820] border border-amber-500/40 space-y-1">
            <div className="text-[10px] font-bold text-amber-400 uppercase">Secondary (To be Merged)</div>
            <div className="font-extrabold text-white text-sm">{secondaryEntity.name}</div>
            <p className="text-[#8e8ea0] text-[11px] line-clamp-3 leading-relaxed mt-1">
              {secondaryEntity.description || secondaryEntity.summary || 'No description.'}
            </p>
          </div>
        </div>

        {/* Conflict Selector for Description */}
        <div className="space-y-2 text-xs">
          <label className="font-bold text-white uppercase tracking-wider text-[10px]">Description &amp; Notes Resolution</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setChosenDescription('primary')}
              className={`p-3 rounded-xl border text-left font-bold transition-all ${
                chosenDescription === 'primary' ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-white' : 'bg-[#181820] border-[#232334] text-[#8e8ea0]'
              }`}
            >
              Keep Primary Text
            </button>
            <button
              type="button"
              onClick={() => setChosenDescription('secondary')}
              className={`p-3 rounded-xl border text-left font-bold transition-all ${
                chosenDescription === 'secondary' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-[#181820] border-[#232334] text-[#8e8ea0]'
              }`}
            >
              Keep Secondary Text
            </button>
            <button
              type="button"
              onClick={() => setChosenDescription('combine')}
              className={`p-3 rounded-xl border text-left font-bold transition-all ${
                chosenDescription === 'combine' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-[#181820] border-[#232334] text-[#8e8ea0]'
              }`}
            >
              Combine Both Histories
            </button>
          </div>
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
            onClick={handleExecute}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-xs hover:from-amber-600 hover:to-orange-700 shadow-xl flex items-center gap-1.5 disabled:opacity-50"
          >
            <Merge className="w-4 h-4" /> {isSubmitting ? 'Merging Entity...' : 'Confirm Intelligent Merge'}
          </button>
        </div>

      </div>
    </div>
  );
}
