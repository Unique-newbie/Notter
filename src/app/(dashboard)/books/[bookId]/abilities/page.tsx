'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { repository } from '@/lib/store/repository';
import { Ability } from '@/types';
import { Shield, Zap, User, Plus, Edit3, Trash2, X, CheckCircle2 } from 'lucide-react';

export default function AbilitiesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookId = (params?.bookId as string) || 'book-1';
  const initialId = searchParams.get('id');

  const [abilities, setAbilities] = useState<Ability[]>([]);
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);
  const [toast, setToast] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAbility, setEditingAbility] = useState<Ability | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Magic');
  const [usersInput, setUsersInput] = useState('');
  const [error, setError] = useState('');

  const loadAbilities = async () => {
    const list = await repository.getAbilities(bookId);
    setAbilities(list);
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
      const created = await repository.createAbility(bookId, {
        name: name.trim(),
        description: description.trim(),
        category,
        userCharacterNames: usersArr
      });
      if (created) {
        showToast(`Created ability "${created.name}"`);
        setSelectedAbility(created);
      }
    }

    setIsModalOpen(false);
    await loadAbilities();
  };

  const handleDeleteAbility = async (a: Ability) => {
    if (confirm(`Delete ability "${a.name}"?`)) {
      await repository.deleteAbility(a.id);
      showToast(`Deleted "${a.name}"`);
      setSelectedAbility(null);
      await loadAbilities();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-[#06b6d4]" /> Magic & Abilities System
          </h1>
          <p className="text-xs text-[#8e8ea0] mt-1">
            Spells, martial techniques, superpowers, and magic systems cataloged with character users.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] transition-all shadow-purple shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Ability
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ability List */}
        <div className="space-y-3">
          {abilities.length === 0 && (
            <div className="p-8 text-center rounded-xl bg-[#121218] border border-[#232334] text-[#8e8ea0] text-xs space-y-3">
              <Shield className="w-8 h-8 mx-auto text-[#06b6d4] opacity-40" />
              <div>No spells or abilities recorded yet.</div>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] transition-all shadow-purple"
              >
                + Add First Ability
              </button>
            </div>
          )}
          {abilities.map((ab) => (
            <div
              key={ab.id}
              onClick={() => setSelectedAbility(ab)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${
                selectedAbility?.id === ab.id
                  ? 'bg-[#121218] border-[#06b6d4] shadow-purple'
                  : 'bg-[#121218]/60 border-[#232334] hover:border-[#06b6d4]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{ab.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#1e1e2a] text-[#06b6d4]">
                  {ab.category || 'Magic'}
                </span>
              </div>
              <p className="text-xs text-[#8e8ea0] mt-1 line-clamp-2">{ab.description}</p>
            </div>
          ))}
        </div>

        {/* Ability Detail View */}
        {selectedAbility ? (
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-6">
            <div className="flex items-start justify-between border-b border-[#232334] pb-4">
              <div>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-[#06b6d4]/20 text-[#06b6d4] border border-[#06b6d4]/30">
                  {selectedAbility.category || 'Magic System'}
                </span>
                <h2 className="text-2xl font-extrabold text-white mt-2">{selectedAbility.name}</h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedAbility)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-[#181820] text-white border-[#232334] hover:border-[#06b6d4]/50 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDeleteAbility(selectedAbility)}
                  className="p-2 rounded-lg text-red-400 bg-[#181820] border border-[#232334] hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#06b6d4]">Description & Mechanics</h3>
              <p className="p-4 rounded-xl bg-[#181820] border border-[#232334] text-xs text-[#a1a1aa] leading-relaxed">
                {selectedAbility.description || 'No description provided.'}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#a78bfa] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Known Users / Practitioners
              </h3>
              <div className="flex flex-wrap gap-2">
                {(selectedAbility.userCharacterNames || []).length === 0 ? (
                  <span className="text-xs text-[#8e8ea0] italic">No practitioners registered.</span>
                ) : (
                  selectedAbility.userCharacterNames.map((u, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-lg bg-[#7c3aed]/15 text-[#a78bfa] border border-[#7c3aed]/30 font-semibold text-xs flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400" /> {u}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center bg-[#121218] border border-[#232334] rounded-2xl text-[#8e8ea0]">
            Select an ability to view details.
          </div>
        )}
      </div>

      {/* Create / Edit Ability Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#121218] border border-[#232334] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#232334] bg-[#0c0c10] flex items-center justify-between">
              <h2 className="font-bold text-white text-base">
                {editingAbility ? `Edit Ability: ${editingAbility.name}` : 'Add New Ability / Spell'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8e8ea0] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAbility} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-semibold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                    Ability Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fireball, Teleportation"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white placeholder-[#8e8ea0] focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="Magic, Martial, Tech, Superpower..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                  Description & Mechanics
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe effects, costs, rules, or limits..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#181820] border border-[#232334] rounded-xl p-3 text-white placeholder-[#8e8ea0] focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                  Practitioners / Users (Comma-separated names)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Isaac Carter, Sarah Vance"
                  value={usersInput}
                  onChange={(e) => setUsersInput(e.target.value)}
                  className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white placeholder-[#8e8ea0] focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div className="pt-4 border-t border-[#232334] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#181820] border border-[#232334] text-[#a1a1aa] hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#7c3aed] text-white font-bold hover:bg-[#6d28d9] shadow-purple"
                >
                  {editingAbility ? 'Save Ability' : 'Add Ability'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
