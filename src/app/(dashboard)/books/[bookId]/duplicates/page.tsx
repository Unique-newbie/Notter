'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { repository } from '@/lib/store/repository';
import { Character, Ability, Item, LocationEntity } from '@/types';
import { Merge, AlertCircle, CheckCircle2, Shield, Package, MapPin, Users } from 'lucide-react';
import { UniversalMergeModal } from '@/components/common/UniversalMergeModal';

export default function DuplicateReviewCenterPage() {
  const params = useParams();
  const bookId = (params?.bookId as string) || 'book-1';

  const [charDups, setCharDups] = useState<{ char1: Character; char2: Character; confidence: number }[]>([]);
  const [abilityDups, setAbilityDups] = useState<{ item1: Ability; item2: Ability; confidence: number }[]>([]);
  const [itemDups, setItemDups] = useState<{ item1: Item; item2: Item; confidence: number }[]>([]);
  const [locationDups, setLocationDups] = useState<{ item1: LocationEntity; item2: LocationEntity; confidence: number }[]>([]);
  const [toast, setToast] = useState('');

  // Universal Merge Modal state
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeEntityType, setMergeEntityType] = useState<'character' | 'ability' | 'item' | 'location'>('character');
  const [primaryTarget, setPrimaryTarget] = useState<any>(null);
  const [secondaryTarget, setSecondaryTarget] = useState<any>(null);

  const loadAllDuplicates = async () => {
    setCharDups(await repository.findDuplicateSuggestions(bookId));
    setAbilityDups(await repository.findDuplicateAbilitySuggestions(bookId));
    setItemDups(await repository.findDuplicateItemSuggestions(bookId));
    setLocationDups(await repository.findDuplicateLocationSuggestions(bookId));
  };

  useEffect(() => {
    loadAllDuplicates();
  }, [bookId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleOpenMerge = (type: 'character' | 'ability' | 'item' | 'location', p: any, s: any) => {
    setMergeEntityType(type);
    setPrimaryTarget(p);
    setSecondaryTarget(s);
    setMergeModalOpen(true);
  };

  const handleConfirmMerge = async (primaryId: string, secondaryId: string, overrides: any) => {
    let success = false;
    if (mergeEntityType === 'character') {
      success = await repository.intelligentMergeCharacters(primaryId, secondaryId, overrides);
    } else if (mergeEntityType === 'ability') {
      success = await repository.intelligentMergeAbilities(primaryId, secondaryId, overrides);
    } else if (mergeEntityType === 'item') {
      success = await repository.intelligentMergeItems(primaryId, secondaryId, overrides);
    } else if (mergeEntityType === 'location') {
      success = await repository.intelligentMergeLocations(primaryId, secondaryId, overrides);
    }

    if (success) {
      showToast(`Merged duplicate ${mergeEntityType} with zero data loss!`);
      await loadAllDuplicates();
    }
  };

  const totalDups = charDups.length + abilityDups.length + itemDups.length + locationDups.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[60] px-5 py-3 rounded-xl bg-[#7c3aed] text-white text-sm font-bold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" /> {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <Merge className="w-6 h-6 text-amber-400" /> Duplicate Review Center
        </h1>
        <p className="text-xs text-[#8e8ea0] mt-1">
          Review and execute intelligent zero-data-loss merges for duplicate entities across your entire Story Bible.
        </p>
      </div>

      {totalDups === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#121218] border border-[#232334] text-emerald-400 text-xs font-bold space-y-2">
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
          <div>Your Story Bible is 100% clean! No duplicate entity suggestions detected.</div>
        </div>
      ) : (
        <div className="space-y-6 text-xs">
          
          {/* Character Duplicates */}
          {charDups.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-extrabold text-[#a78bfa] uppercase tracking-wider text-xs flex items-center gap-2">
                <Users className="w-4 h-4" /> Character Duplicates ({charDups.length})
              </h2>
              {charDups.map((dup, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#121218] border border-[#232334] flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-white text-sm">&quot;{dup.char1.name}&quot;</span>
                    <span className="text-[#8e8ea0] mx-3">matches duplicate</span>
                    <span className="font-extrabold text-white text-sm">&quot;{dup.char2.name}&quot;</span>
                  </div>
                  <button
                    onClick={() => handleOpenMerge('character', dup.char1, dup.char2)}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-black font-extrabold hover:bg-amber-600 shadow-lg flex items-center gap-1.5"
                  >
                    <Merge className="w-4 h-4" /> Intelligent Merge
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Ability Duplicates */}
          {abilityDups.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-extrabold text-amber-400 uppercase tracking-wider text-xs flex items-center gap-2">
                <Shield className="w-4 h-4" /> Ability &amp; Spell Duplicates ({abilityDups.length})
              </h2>
              {abilityDups.map((dup, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#121218] border border-[#232334] flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-white text-sm">&quot;{dup.item1.name}&quot;</span>
                    <span className="text-[#8e8ea0] mx-3">matches duplicate</span>
                    <span className="font-extrabold text-white text-sm">&quot;{dup.item2.name}&quot;</span>
                  </div>
                  <button
                    onClick={() => handleOpenMerge('ability', dup.item1, dup.item2)}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-black font-extrabold hover:bg-amber-600 shadow-lg flex items-center gap-1.5"
                  >
                    <Merge className="w-4 h-4" /> Intelligent Merge
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Item Duplicates */}
          {itemDups.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-extrabold text-cyan-400 uppercase tracking-wider text-xs flex items-center gap-2">
                <Package className="w-4 h-4" /> Item &amp; Artifact Duplicates ({itemDups.length})
              </h2>
              {itemDups.map((dup, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#121218] border border-[#232334] flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-white text-sm">&quot;{dup.item1.name}&quot;</span>
                    <span className="text-[#8e8ea0] mx-3">matches duplicate</span>
                    <span className="font-extrabold text-white text-sm">&quot;{dup.item2.name}&quot;</span>
                  </div>
                  <button
                    onClick={() => handleOpenMerge('item', dup.item1, dup.item2)}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-black font-extrabold hover:bg-amber-600 shadow-lg flex items-center gap-1.5"
                  >
                    <Merge className="w-4 h-4" /> Intelligent Merge
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Universal Merge Modal */}
      {primaryTarget && secondaryTarget && (
        <UniversalMergeModal
          isOpen={mergeModalOpen}
          entityType={mergeEntityType}
          primaryEntity={primaryTarget}
          secondaryEntity={secondaryTarget}
          onConfirmMerge={handleConfirmMerge}
          onClose={() => setMergeModalOpen(false)}
        />
      )}

    </div>
  );
}
