'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { repository } from '@/lib/store/repository';
import { Ability } from '@/types';
import { Shield, Zap, User, Plus, Edit3, Trash2, X, CheckCircle2, Merge, AlertCircle } from 'lucide-react';
import { UniversalMergeModal } from '@/components/common/UniversalMergeModal';

export default function AbilitiesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookId = (params?.bookId as string) || 'book-1';
  const initialId = searchParams.get('id');

  const [abilities, setAbilities] = useState<Ability[]>([]);
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);
  const [duplicates, setDuplicates] = useState<{ item1: Ability; item2: Ability; confidence: number }[]>([]);
  const [toast, setToast] = useState('');

  // Modal & Merge State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAbility, setEditingAbility] = useState<Ability | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Magic');
  const [usersInput, setUsersInput] = useState('');
  const [error, setError] = useState('');

  // Universal Merge Modal state
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergePrimary, setMergePrimary] = useState<Ability | null>(null);
  const [mergeSecondary, setMergeSecondary] = useState<Ability | null>(null);

  const loadAbilities = async () => {
    const list = await repository.getAbilities(bookId);
    setAbilities(list);
    setDuplicates(await repository.findDuplicateAbilitySuggestions(bookId));
    if (list.length > 0) {
      const match = initialId ? list.find(a => a.id === initialId) || list[0] : list[0];
      setSelectedAbility(prev => (prev && list.find(a => a.id === prev.id)) ? list.find(a => a.id === prev.id)! : match);
    } else {
      setSelectedAbility(null);
    }
  };

  useEffect(() => {
    loadAbilities();
    const handleDataChanged = () => loadAbilities();
    window.addEventListener('storybible_data_changed', handleDataChanged);
    return () => window.removeEventListener('storybible_data_changed', handleDataChanged);
  }, [bookId, initialId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleOpenMerge = (primary: Ability, secondary: Ability) => {
    setMergePrimary(primary);
    setMergeSecondary(secondary);
    setMergeModalOpen(true);
  };

  const handleConfirmMerge = async (primaryId: string, secondaryId: string, overrides: any) => {
    const success = await repository.intelligentMergeAbilities(bookId, primaryId, secondaryId);
    if (success) {
      showToast('Intelligent Ability Merge Complete!');
      await loadAbilities();
    }
  };

  const openCreateModal = () => {
    setEditingAbility(null);
    setName('');
    setDescription('');
    setCategory('Magic');
    setUsersInput('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (a: Ability) => {
    setEditingAbility(a);
    setName(a.name);
    setDescription(a.description || '');
    setCategory(a.category || 'Magic');
    setUsersInput(a.userCharacterNames ? a.userCharacterNames.join(', ') : '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveAbility = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Please enter an ability name.');
      return;
    }

    const usersArr = usersInput.split(',').map(u => u.trim()).filter(Boolean);

    if (editingAbility) {
      await repository.updateAbility(editingAbility.id, {
        name: name.trim(),
        description: description.trim(),
        category,
        userCharacterNames: usersArr
      });
      showToast(`Updated "${name.trim()}"`);
    } else {
      await repository.createAbility(bookId, {
        name: name.trim(),
        description: description.trim(),
        category,
        userCharacterNames: usersArr
      });
      showToast(`Created ability "${name.trim()}"`);
    }

    setIsModalOpen(false);
    await loadAbilities();
  };

  const handleDeleteAbility = async (id: string, abilityName: string) => {
    await repository.deleteAbility(id);
    showToast(`Deleted "${abilityName}"`);
    if (selectedAbility?.id === id) setSelectedAbility(null);
    await loadAbilities();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[60] px-5 py-3 rounded-xl bg-[#7c3aed] text-white text-sm font-bold shadow-2xl animate-in slide-in-from-top-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" /> {toast}
        </div>
      )}

      {/* Duplicate Ability Suggestions Banner */}
      {duplicates.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Duplicate Ability Suggestions ({duplicates.length} detected)</span>
          </div>
          <div className="space-y-2 pt-1">
            {duplicates.map((dup, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#121218] border border-[#232334] text-xs">
                <div>
                  <span className="font-bold text-white">&quot;{dup.item1.name}&quot;</span>
                  <span className="text-[#8e8ea0] mx-2">matches</span>
                  <span className="font-bold text-white">&quot;{dup.item2.name}&quot;</span>
                </div>
                <button
                  onClick={() => handleOpenMerge(dup.item1, dup.item2)}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-black hover:bg-amber-600 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg"
                >
                  <Merge className="w-3.5 h-3.5" /> Intelligent Merge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-[#7c3aed]" /> Abilities &amp; Magic Codex
          </h1>
          <p className="text-xs text-[#8e8ea0] mt-1">
            Spells, martial techniques, passive skills, and ultimate abilities used across your story.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] transition-all shadow-purple"
        >
          <Plus className="w-4 h-4" /> Add New Ability
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Sidebar: Abilities List */}
        <div className="space-y-2 max-h-[78vh] overflow-y-auto pr-1">
          {abilities.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#121218] border border-[#232334] text-[#8e8ea0] text-xs space-y-2">
              <div>No abilities recorded in this story bible yet.</div>
              <button onClick={openCreateModal} className="px-4 py-1.5 rounded-lg bg-[#7c3aed] text-white font-bold text-xs">
                + Add Ability
              </button>
            </div>
          ) : (
            abilities.map((ability) => {
              const isSelected = selectedAbility?.id === ability.id;
              return (
                <div
                  key={ability.id}
                  onClick={() => setSelectedAbility(ability)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-[#121218] border-[#7c3aed] shadow-purple'
                      : 'bg-[#121218]/60 border-[#232334] hover:border-[#7c3aed]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-white text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      {ability.name}
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#1e1e2a] text-[#a78bfa]">
                      {ability.category || 'Magic'}
                    </span>
                  </div>

                  <p className="text-xs text-[#8e8ea0] mt-1.5 line-clamp-2 leading-relaxed">
                    {ability.description || 'No description recorded.'}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Right Details Panel */}
        {selectedAbility ? (
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-6">
            <div className="flex items-center justify-between border-b border-[#232334] pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-extrabold bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/30">
                  {selectedAbility.category || 'Magic'}
                </span>
                <h2 className="text-2xl font-extrabold text-white mt-1">{selectedAbility.name}</h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedAbility)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-[#181820] text-[#a78bfa] border-[#232334] hover:border-[#7c3aed]/50 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>

                {abilities.length > 1 && (
                  <button
                    onClick={() => {
                      const secondary = abilities.find(a => a.id !== selectedAbility.id);
                      if (secondary) handleOpenMerge(selectedAbility, secondary);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-[#181820] text-amber-400 border-amber-500/30 hover:bg-amber-500/10 transition-all"
                  >
                    <Merge className="w-3.5 h-3.5" /> Merge
                  </button>
                )}

                <button
                  onClick={() => handleDeleteAbility(selectedAbility.id, selectedAbility.name)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 border border-[#232334]"
                  title="Delete Ability"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[#181820] border border-[#232334] space-y-1.5">
                <h3 className="font-bold text-[#a78bfa] uppercase tracking-wider text-[10px]">Description &amp; Effects</h3>
                <p className="text-[#a1a1aa] leading-relaxed">{selectedAbility.description || 'No detailed description.'}</p>
              </div>

              <div className="p-4 rounded-xl bg-[#181820] border border-[#232334] space-y-2">
                <h3 className="font-bold text-[#a78bfa] uppercase tracking-wider text-[10px]">Known Practitioners &amp; Users</h3>
                {selectedAbility.userCharacterNames && selectedAbility.userCharacterNames.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedAbility.userCharacterNames.map((uName, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-lg bg-[#121218] border border-[#232334] text-white font-bold flex items-center gap-1.5">
                        <User className="w-3 h-3 text-[#a78bfa]" /> {uName}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#8e8ea0] italic">No characters associated with this ability yet.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center rounded-2xl bg-[#121218] border border-[#232334] text-[#8e8ea0] text-xs">
            Select an ability to view details.
          </div>
        )}

      </div>

      {/* Universal Merge Modal */}
      {mergePrimary && mergeSecondary && (
        <UniversalMergeModal
          isOpen={mergeModalOpen}
          entityType="ability"
          primaryEntity={mergePrimary}
          secondaryEntity={mergeSecondary}
          onConfirmMerge={handleConfirmMerge}
          onClose={() => setMergeModalOpen(false)}
        />
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121218] border border-[#232334] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#232334] pb-3">
              <h3 className="font-bold text-white text-base">
                {editingAbility ? 'Edit Ability' : 'Add New Ability'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8e8ea0] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveAbility} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#8e8ea0]">Ability Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Shadow Step, Fireball"
                  className="w-full px-3 py-2 rounded-xl bg-[#181820] border border-[#232334] text-white focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#8e8ea0]">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#181820] border border-[#232334] text-white focus:outline-none focus:border-[#7c3aed]"
                >
                  <option value="Magic">Magic</option>
                  <option value="Martial Arts">Martial Arts</option>
                  <option value="Tech">Technology</option>
                  <option value="Passive">Passive Skill</option>
                  <option value="Ultimate">Ultimate Skill</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#8e8ea0]">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this ability do?"
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-[#181820] border border-[#232334] text-white focus:outline-none focus:border-[#7c3aed] resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#8e8ea0]">Known Users (Comma Separated)</label>
                <input
                  type="text"
                  value={usersInput}
                  onChange={(e) => setUsersInput(e.target.value)}
                  placeholder="e.g. Arthur Pendragon, Merlin"
                  className="w-full px-3 py-2 rounded-xl bg-[#181820] border border-[#232334] text-white focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#181820] text-[#a1a1aa] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#7c3aed] text-white font-bold hover:bg-[#6d28d9]"
                >
                  Save Ability
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
