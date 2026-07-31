'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { repository } from '@/lib/store/repository';
import { Character, Ability, Item, Relationship, DialogueFactEntity } from '@/types';
import {
  Users, Shield, Package, Heart, BookOpen, Merge, Trash2, X,
  ChevronDown, Plus, Tag, FileText, AlertCircle, History, MessageSquare, Briefcase, MapPin, Smile, UserCheck
} from 'lucide-react';

export default function CharactersPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookId = (params?.bookId as string) || 'book-1';
  const initialCharId = searchParams.get('id');

  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [abilities, setAbilities] = useState<Ability[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [dialogueFacts, setDialogueFacts] = useState<DialogueFactEntity[]>([]);
  const [duplicates, setDuplicates] = useState<{ char1: Character; char2: Character; confidence: number }[]>([]);
  const [toast, setToast] = useState('');

  // Active Dossier Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'relationships' | 'inventory' | 'notes'>('overview');

  // Merge state
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<Character | null>(null);
  const [mergeDropdownOpen, setMergeDropdownOpen] = useState(false);

  // Relationship form state
  const [showRelForm, setShowRelForm] = useState(false);
  const [relOtherChar, setRelOtherChar] = useState('');
  const [relType, setRelType] = useState('');
  const [relDesc, setRelDesc] = useState('');

  // Author Notes & Tags state
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');

  const refreshCharacters = useCallback(async () => {
    const list = await repository.getCharacters(bookId);
    setCharacters(list);
    setAbilities(await repository.getAbilities(bookId));
    setItems(await repository.getItems(bookId));
    setRelationships(await repository.getRelationships(bookId));
    setDialogueFacts(await repository.getDialogueFacts(bookId));
    setDuplicates(await repository.findDuplicateSuggestions(bookId));

    if (list.length > 0) {
      const matched = initialCharId ? list.find(c => c.id === initialCharId) || list[0] : list[0];
      setSelectedChar(prev => {
        if (prev && list.find(c => c.id === prev.id)) {
          return list.find(c => c.id === prev.id)!;
        }
        return matched;
      });
    } else {
      setSelectedChar(null);
    }
  }, [bookId, initialCharId]);

  useEffect(() => {
    refreshCharacters();
    const handleDataChanged = () => refreshCharacters();
    window.addEventListener('storybible_data_changed', handleDataChanged);
    return () => window.removeEventListener('storybible_data_changed', handleDataChanged);
  }, [bookId, refreshCharacters]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleMerge = async (primaryId: string, secondaryId: string) => {
    const primary = characters.find(c => c.id === primaryId);
    const secondary = characters.find(c => c.id === secondaryId);
    if (!primary || !secondary) return;

    const result = await repository.mergeCharacters(primaryId, secondaryId);
    if (result) {
      showToast(`Merged "${secondary.name}" into "${primary.name}" — all references updated`);
    }
    setMergeMode(false);
    setMergeTarget(null);
    await refreshCharacters();
  };

  const handleDelete = async () => {
    if (!selectedChar) return;
    const name = selectedChar.name;
    await repository.deleteCharacter(selectedChar.id);
    showToast(`Deleted "${name}"`);
    setSelectedChar(null);
    await refreshCharacters();
  };

  const handleAddRelationship = async () => {
    if (!selectedChar || !relOtherChar || !relType) return;
    await repository.addRelationship(bookId, selectedChar.name, relOtherChar, relType, relDesc);
    showToast(`Added relationship: ${selectedChar.name} ↔ ${relOtherChar}`);
    setShowRelForm(false);
    setRelOtherChar('');
    setRelType('');
    setRelDesc('');
    await refreshCharacters();
  };

  const handleDeleteRelationship = async (relId: string) => {
    await repository.deleteRelationship(relId);
    showToast('Relationship removed');
    await refreshCharacters();
  };

  const handleAddAuthorNote = async () => {
    if (!selectedChar || !newNote.trim()) return;
    const updatedNotes = [...(selectedChar.authorNotes || []), newNote.trim()];
    await repository.updateCharacter(selectedChar.id, { authorNotes: updatedNotes });
    setNewNote('');
    showToast('Author note saved');
    await refreshCharacters();
  };

  const handleDeleteAuthorNote = async (index: number) => {
    if (!selectedChar || !selectedChar.authorNotes) return;
    const updated = selectedChar.authorNotes.filter((_, i) => i !== index);
    await repository.updateCharacter(selectedChar.id, { authorNotes: updated });
    showToast('Note deleted');
    await refreshCharacters();
  };

  const handleAddTag = async () => {
    if (!selectedChar || !newTag.trim()) return;
    const updatedTags = Array.from(new Set([...(selectedChar.tags || []), newTag.trim()]));
    await repository.updateCharacter(selectedChar.id, { tags: updatedTags });
    setNewTag('');
    showToast('Tag added');
    await refreshCharacters();
  };

  const handleDeleteTag = async (tagToDelete: string) => {
    if (!selectedChar || !selectedChar.tags) return;
    const updated = selectedChar.tags.filter(t => t !== tagToDelete);
    await repository.updateCharacter(selectedChar.id, { tags: updated });
    await refreshCharacters();
  };

  const mergeCandidates = characters.filter(c => selectedChar && c.id !== selectedChar.id);

  const RELATION_TYPES = [
    'Allies', 'Enemies', 'Lovers', 'Rivals', 'Family', 'Friends',
    'Master/Servant', 'Mentor/Student', 'Colleagues', 'Strangers',
    'Complicated', 'Other'
  ];

  // Create / Edit Character Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [charName, setCharName] = useState('');
  const [charSummary, setCharSummary] = useState('');
  const [charStatus, setCharStatus] = useState<any>('Active');
  const [charOccupation, setCharOccupation] = useState('');
  const [charLocation, setCharLocation] = useState('');
  const [charAliases, setCharAliases] = useState('');
  const [charGoals, setCharGoals] = useState('');
  const [charError, setCharError] = useState('');

  const openCreateModal = () => {
    setEditingChar(null);
    setCharName('');
    setCharSummary('');
    setCharStatus('Active');
    setCharOccupation('');
    setCharLocation('');
    setCharAliases('');
    setCharGoals('');
    setCharError('');
    setIsModalOpen(true);
  };

  const openEditProfileModal = (c: Character) => {
    setEditingChar(c);
    setCharName(c.name);
    setCharSummary(c.summary || '');
    setCharStatus(c.status || 'Active');
    setCharOccupation(c.occupation || '');
    setCharLocation(c.currentLocation || '');
    setCharAliases(c.aliases ? c.aliases.join(', ') : '');
    setCharGoals(c.goals || '');
    setCharError('');
    setIsModalOpen(true);
  };

  const handleSaveCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    setCharError('');
    if (!charName.trim()) {
      setCharError('Please enter a character name.');
      return;
    }

    const aliasesArr = charAliases.split(',').map(a => a.trim()).filter(Boolean);

    if (editingChar) {
      await repository.updateCharacter(editingChar.id, {
        summary: charSummary.trim(),
        status: charStatus,
      });
      showToast(`Updated profile for "${charName.trim()}"`);
    } else {
      const created = await repository.createCharacter(bookId, {
        name: charName.trim(),
        summary: charSummary.trim(),
        status: charStatus,
        occupation: charOccupation.trim(),
        currentLocation: charLocation.trim(),
        aliases: aliasesArr,
        goals: charGoals.trim()
      });
      if (created) {
        showToast(`Created character "${created.name}"`);
        setSelectedChar(created);
      }
    }

    setIsModalOpen(false);
    await refreshCharacters();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[60] px-5 py-3 rounded-xl bg-[#7c3aed] text-white text-sm font-semibold shadow-2xl animate-in slide-in-from-top-2 fade-in duration-300">
          {toast}
        </div>
      )}

      {/* Duplicate Detection Alert Banner */}
      {duplicates.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Automatic Duplicate Character Suggestions ({duplicates.length} detected)</span>
          </div>
          <div className="space-y-2 pt-1">
            {duplicates.map((dup, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-[#121218] border border-[#232334] text-xs">
                <div>
                  <span className="font-bold text-white">&quot;{dup.char1.name}&quot;</span>
                  <span className="text-[#8e8ea0] mx-2">matches</span>
                  <span className="font-bold text-white">&quot;{dup.char2.name}&quot;</span>
                  <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold">
                    {dup.confidence}% similarity
                  </span>
                </div>
                <button
                  onClick={() => handleMerge(dup.char1.id, dup.char2.id)}
                  className="px-3 py-1 rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9] text-[11px] font-bold transition-all flex items-center gap-1"
                >
                  <Merge className="w-3 h-3" /> Merge &quot;{dup.char2.name}&quot; → &quot;{dup.char1.name}&quot;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#a78bfa]" /> Character Dossiers
          </h1>
          <p className="text-xs text-[#8e8ea0] mt-1">
            Complete character records, per-chapter history, dialogue commitments, and author notes.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] transition-all shadow-purple shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Character
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Character List */}
        <div className="space-y-3">
          {characters.length === 0 && (
            <div className="p-8 text-center rounded-xl bg-[#121218]/60 border border-[#232334] text-[#8e8ea0] text-sm">
              No characters extracted yet. Analyze a chapter first.
            </div>
          )}
          {characters.map((char) => {
            const isSelected = selectedChar?.id === char.id;
            return (
              <div
                key={char.id}
                onClick={() => { setSelectedChar(char); setMergeMode(false); setMergeTarget(null); }}
                className={`p-4 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-[#121218] border-[#7c3aed] shadow-purple'
                    : 'bg-[#121218]/60 border-[#232334] hover:border-[#7c3aed]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">{char.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#1e1e2a] text-[#a78bfa]">
                    {char.status}
                  </span>
                </div>
                <p className="text-xs text-[#8e8ea0] mt-1.5 line-clamp-2 leading-relaxed">{char.summary}</p>
                {char.aliases && char.aliases.length > 0 && (
                  <div className="text-[10px] text-[#52526b] mt-2 font-mono">
                    Known as: {char.aliases.join(', ')}
                  </div>
                )}
                {char.tags && char.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {char.tags.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#7c3aed]/15 text-[#a78bfa] border border-[#7c3aed]/20">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Character Detail Dossier View */}
        {selectedChar ? (
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-6">
            
            {/* Header / Actions */}
            <div className="flex items-start justify-between border-b border-[#232334] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/30">
                    {selectedChar.status}
                  </span>
                  {selectedChar.occupation && (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> {selectedChar.occupation}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-extrabold text-white mt-2">{selectedChar.name}</h2>
                {selectedChar.aliases && selectedChar.aliases.length > 0 && (
                  <p className="text-xs text-[#8e8ea0] mt-0.5 font-mono">
                    Aliases: {selectedChar.aliases.join(', ')}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditProfileModal(selectedChar)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-[#181820] text-[#a78bfa] border-[#232334] hover:border-[#7c3aed]/50 transition-all"
                  title="Edit character profile"
                >
                  <FileText className="w-3.5 h-3.5" /> Edit Profile
                </button>

                <button
                  onClick={() => { setMergeMode(!mergeMode); setMergeTarget(null); setMergeDropdownOpen(false); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    mergeMode
                      ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                      : 'bg-[#181820] text-[#a1a1aa] border-[#232334] hover:text-white hover:border-[#7c3aed]/50'
                  }`}
                  title="Merge duplicate character"
                >
                  <Merge className="w-3.5 h-3.5" /> Merge
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${selectedChar.name}"? This cannot be undone.`)) handleDelete();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-[#181820] text-red-400 border-[#232334] hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                  title="Delete character"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Merge Panel if toggled */}
            {mergeMode && (
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <Merge className="w-4 h-4" /> Merge Character Into &quot;{selectedChar.name}&quot;
                </div>
                <p className="text-xs text-[#8e8ea0]">
                  Select a duplicate character below to absorb all appearance histories, abilities, items, and relationships into <strong className="text-white">{selectedChar.name}</strong>.
                </p>

                <div className="relative">
                  <button
                    onClick={() => setMergeDropdownOpen(!mergeDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#181820] border border-[#232334] text-xs text-white hover:border-[#7c3aed]/50 transition-all"
                  >
                    <span>{mergeTarget ? mergeTarget.name : 'Select character to merge...'}</span>
                    <ChevronDown className={`w-4 h-4 text-[#8e8ea0] transition-transform ${mergeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {mergeDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg bg-[#0c0c10] border border-[#232334] shadow-2xl z-50">
                      {mergeCandidates.map(c => (
                        <button
                          key={c.id}
                          onClick={() => { setMergeTarget(c); setMergeDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-xs hover:bg-[#1e1e2a] transition-colors border-b border-[#232334]/50 last:border-0 ${
                            mergeTarget?.id === c.id ? 'bg-[#7c3aed]/10 text-[#a78bfa]' : 'text-white'
                          }`}
                        >
                          <div className="font-semibold">{c.name}</div>
                          <div className="text-[#8e8ea0] text-[11px] mt-0.5 line-clamp-1">{c.summary}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {mergeTarget && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#121218] border border-[#232334]">
                    <div className="text-xs text-[#a1a1aa]">
                      <span className="text-red-400 font-bold line-through">{mergeTarget.name}</span> → <span className="text-emerald-400 font-bold">{selectedChar.name}</span>
                    </div>
                    <button
                      onClick={() => handleMerge(selectedChar.id, mergeTarget.id)}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#7c3aed] text-white hover:bg-[#6d28d9] shadow-purple transition-all"
                    >
                      Confirm Merge
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dossier Category Navigation Tabs */}
            <div className="flex items-center border-b border-[#232334] gap-2 text-xs font-medium overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview & Profile', icon: UserCheck },
                { id: 'history', label: `Life Log & Timeline (${(selectedChar.chapterAppearances?.length || 0) + (selectedChar.history?.length || 0)})`, icon: History },
                { id: 'relationships', label: `Relationships & Facts (${relationships.filter(r => r.character1Name === selectedChar.name || r.character2Name === selectedChar.name).length + dialogueFacts.filter(d => d.speaker === selectedChar.name || d.recipient === selectedChar.name).length})`, icon: Heart },
                { id: 'inventory', label: 'Abilities & Items', icon: Package },
                { id: 'notes', label: `Author Notes & Tags (${(selectedChar.authorNotes?.length || 0) + (selectedChar.tags?.length || 0)})`, icon: Tag },
              ].map(t => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-all whitespace-nowrap ${
                      isActive
                        ? 'border-[#7c3aed] text-[#a78bfa] font-bold bg-[#181820]'
                        : 'border-transparent text-[#8e8ea0] hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Overview & Profile */}
            {activeTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#a78bfa]">Character Summary</h3>
                  <p className="p-4 rounded-xl bg-[#181820] border border-[#232334] text-[#a1a1aa] leading-relaxed">
                    {selectedChar.summary || 'No summary available.'}
                  </p>
                </div>

                {/* State Profile Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedChar.currentLocation && (
                    <div className="p-3 rounded-xl bg-[#181820] border border-[#232334] flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold uppercase text-[#8e8ea0]">Current Location</div>
                        <div className="text-white font-semibold">{selectedChar.currentLocation}</div>
                      </div>
                    </div>
                  )}
                  {selectedChar.emotionalState && (
                    <div className="p-3 rounded-xl bg-[#181820] border border-[#232334] flex items-center gap-2.5">
                      <Smile className="w-4 h-4 text-purple-400 shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold uppercase text-[#8e8ea0]">Emotional State</div>
                        <div className="text-white font-semibold">{selectedChar.emotionalState}</div>
                      </div>
                    </div>
                  )}
                  {selectedChar.physicalInjuries && (
                    <div className="p-3 rounded-xl bg-[#181820] border border-red-500/30 flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold uppercase text-red-400">Physical Injuries</div>
                        <div className="text-white font-semibold">{selectedChar.physicalInjuries}</div>
                      </div>
                    </div>
                  )}
                  {selectedChar.clothing && (
                    <div className="p-3 rounded-xl bg-[#181820] border border-[#232334] flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold uppercase text-[#8e8ea0]">Attire & Clothing</div>
                        <div className="text-white font-semibold">{selectedChar.clothing}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Goals & Decisions */}
                {selectedChar.goals && (
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Immediate Goals</h4>
                    <div className="p-3 rounded-xl bg-[#181820] border border-emerald-500/20 text-[#a1a1aa]">
                      {selectedChar.goals}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Life Log & History */}
            {activeTab === 'history' && (
              <div className="space-y-4 text-xs">
                {/* Chronological Life Log */}
                {selectedChar.history && selectedChar.history.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#a78bfa] flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" /> Entity Life Log
                    </h3>
                    <div className="space-y-2">
                      {selectedChar.history.map(ev => (
                        <div key={ev.id} className="p-3 rounded-xl bg-[#181820] border border-[#232334] flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#7c3aed]/20 text-[#a78bfa]">
                                Ch. {ev.chapterNumber}
                              </span>
                              <span className="font-bold text-white">{ev.type}</span>
                            </div>
                            <p className="text-[#a1a1aa] mt-1">{ev.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chapter Appearances Timeline */}
                {selectedChar.chapterAppearances && selectedChar.chapterAppearances.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Per-Chapter Appearance Log
                    </h3>
                    <div className="space-y-2">
                      {selectedChar.chapterAppearances.map((app, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-[#181820] border border-[#232334]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-white font-mono">Ch. {app.chapterNumber} — {app.chapterTitle}</span>
                            {app.statusInChapter && (
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#1e1e2a] text-[#a78bfa]">
                                {app.statusInChapter}
                              </span>
                            )}
                          </div>
                          <p className="text-[#a1a1aa] leading-relaxed">{app.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Relationships & Spoken Facts */}
            {activeTab === 'relationships' && (
              <div className="space-y-6 text-xs">
                {/* Spoken Dialogue Facts */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Dialogue Commitments & Facts
                  </h3>
                  {dialogueFacts.filter(d => d.speaker === selectedChar.name || d.recipient === selectedChar.name).length === 0 ? (
                    <p className="text-[#8e8ea0] italic p-3 rounded-xl bg-[#181820] border border-[#232334]">
                      No spoken dialogue commitments or secrets recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {dialogueFacts
                        .filter(d => d.speaker === selectedChar.name || d.recipient === selectedChar.name)
                        .map(df => (
                          <div key={df.id} className="p-3 rounded-xl bg-[#181820] border border-amber-500/20 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-amber-300">
                                {df.speaker} {df.recipient ? `→ ${df.recipient}` : ''}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
                                {df.type} (Ch. {df.chapterNumber})
                              </span>
                            </div>
                            <p className="text-white font-mono text-[11px]">&quot;{df.fact}&quot;</p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Relationships Network */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5" /> Relationships Network
                    </h3>
                    <button
                      onClick={() => setShowRelForm(!showRelForm)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> {showRelForm ? 'Cancel' : 'Add Relationship'}
                    </button>
                  </div>

                  {showRelForm && (
                    <div className="p-4 rounded-xl bg-[#7c3aed]/5 border border-[#7c3aed]/20 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select
                          value={relOtherChar}
                          onChange={(e) => setRelOtherChar(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#181820] border border-[#232334] text-xs text-white"
                        >
                          <option value="">Select target character...</option>
                          {characters.filter(c => c.id !== selectedChar.id).map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                        <select
                          value={relType}
                          onChange={(e) => setRelType(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#181820] border border-[#232334] text-xs text-white"
                        >
                          <option value="">Select type...</option>
                          {RELATION_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        value={relDesc}
                        onChange={(e) => setRelDesc(e.target.value)}
                        placeholder="Relationship details..."
                        className="w-full px-3 py-2 rounded-lg bg-[#181820] border border-[#232334] text-xs text-white placeholder-[#52526b]"
                      />
                      <button
                        onClick={handleAddRelationship}
                        disabled={!relOtherChar || !relType}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                      >
                        Save Relationship
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {relationships
                      .filter(r => r.character1Name === selectedChar.name || r.character2Name === selectedChar.name)
                      .map(r => (
                        <div key={r.id} className="p-3 rounded-xl bg-[#181820] border border-[#232334] flex items-center justify-between group">
                          <div>
                            <span className="font-bold text-white">
                              {r.character1Name === selectedChar.name ? r.character2Name : r.character1Name}
                            </span>
                            <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/20">
                              {r.relationType}
                            </span>
                            <p className="text-[#a1a1aa] mt-1">{r.description}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteRelationship(r.id)}
                            className="p-1.5 text-[#52526b] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Abilities & Inventory */}
            {activeTab === 'inventory' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Abilities */}
                <div className="p-4 rounded-xl bg-[#181820] border border-[#232334] space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#06b6d4] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Associated Abilities
                  </h4>
                  {abilities.filter(a => a.userCharacterNames.includes(selectedChar.name)).length === 0 ? (
                    <p className="text-[#8e8ea0] italic">No abilities assigned yet.</p>
                  ) : (
                    abilities
                      .filter(a => a.userCharacterNames.includes(selectedChar.name))
                      .map(a => (
                        <div key={a.id} className="p-2.5 rounded bg-[#121218] border border-[#232334]">
                          <div className="font-bold text-white">{a.name}</div>
                          <div className="text-[#8e8ea0] mt-0.5">{a.description}</div>
                        </div>
                      ))
                  )}
                </div>

                {/* Possessed Items */}
                <div className="p-4 rounded-xl bg-[#181820] border border-[#232334] space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#f59e0b] flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" /> Possessed Items
                  </h4>
                  {items.filter(i => i.ownerCharacterName === selectedChar.name).length === 0 ? (
                    <p className="text-[#8e8ea0] italic">No items owned.</p>
                  ) : (
                    items
                      .filter(i => i.ownerCharacterName === selectedChar.name)
                      .map(i => (
                        <div key={i.id} className="p-2.5 rounded bg-[#121218] border border-[#232334]">
                          <div className="font-bold text-white flex items-center justify-between">
                            <span>{i.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">{i.status}</span>
                          </div>
                          <div className="text-[#8e8ea0] mt-0.5">{i.description}</div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* Tab 5: Author Notes & Tags */}
            {activeTab === 'notes' && (
              <div className="space-y-6 text-xs">
                {/* Custom Tags Manager */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#a78bfa] flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Custom Tags
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag (e.g. Main Character, Villain)..."
                      className="flex-1 px-3 py-2 rounded-lg bg-[#181820] border border-[#232334] text-xs text-white placeholder-[#52526b]"
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-4 py-2 rounded-lg bg-[#7c3aed] text-white font-bold hover:bg-[#6d28d9]"
                    >
                      Add Tag
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {(selectedChar.tags || []).map((t, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/30 font-semibold">
                        #{t}
                        <button onClick={() => handleDeleteTag(t)} className="hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Private Author Notes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Private Author Notes (AI Protected)
                    </h3>
                    <span className="text-[10px] text-[#8e8ea0]">AI never modifies or overwrites these notes</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Write a private note or reminder..."
                      className="flex-1 px-3 py-2 rounded-lg bg-[#181820] border border-[#232334] text-xs text-white placeholder-[#52526b]"
                    />
                    <button
                      onClick={handleAddAuthorNote}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500"
                    >
                      Save Note
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(selectedChar.authorNotes || []).map((note, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#181820] border border-[#232334] flex items-center justify-between text-[#a1a1aa]">
                        <span>{note}</span>
                        <button onClick={() => handleDeleteAuthorNote(idx)} className="text-[#52526b] hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center bg-[#121218] border border-[#232334] rounded-2xl text-[#8e8ea0]">
            Select a character to view dossier details.
          </div>
        )}
      </div>

      {/* Create / Edit Character Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#121218] border border-[#232334] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#232334] bg-[#0c0c10] flex items-center justify-between">
              <h2 className="font-bold text-white text-base">
                {editingChar ? `Edit Character: ${editingChar.name}` : 'Create New Character'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8e8ea0] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCharacter} className="p-6 space-y-4 text-xs">
              {charError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                  {charError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                    Character Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingChar}
                    placeholder="e.g. Isaac Carter"
                    value={charName}
                    onChange={(e) => setCharName(e.target.value)}
                    className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white placeholder-[#8e8ea0] focus:outline-none focus:border-[#7c3aed] disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={charStatus}
                    onChange={(e) => setCharStatus(e.target.value)}
                    className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="Active">Active</option>
                    <option value="Deceased">Deceased</option>
                    <option value="Missing">Missing</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                  Character Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="Overview of role, background, or identity..."
                  value={charSummary}
                  onChange={(e) => setCharSummary(e.target.value)}
                  className="w-full bg-[#181820] border border-[#232334] rounded-xl p-3 text-white placeholder-[#8e8ea0] focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                    Occupation / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Guild Master, Commander"
                    value={charOccupation}
                    onChange={(e) => setCharOccupation(e.target.value)}
                    className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                    Current Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ironforge Fortress"
                    value={charLocation}
                    onChange={(e) => setCharLocation(e.target.value)}
                    className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                  Known Aliases (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. The Shadow, Lord Isaac"
                  value={charAliases}
                  onChange={(e) => setCharAliases(e.target.value)}
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
                  {editingChar ? 'Save Changes' : 'Create Character'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

