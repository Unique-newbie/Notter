'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { repository } from '@/lib/store/repository';
import { Character, Ability, Item, Relationship, DialogueFactEntity } from '@/types';
import {
  Users, Shield, Package, Heart, BookOpen, Merge, Trash2, X,
  ChevronDown, Plus, Tag, FileText, AlertCircle, History, MessageSquare, Briefcase, MapPin, Smile, UserCheck, Search, Sparkles, Sword, Zap, Award, CheckCircle2
} from 'lucide-react';
import { MergeConflictModal } from '@/components/character/MergeConflictModal';

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

  // Global Dossier Field Search Filter
  const [dossierSearchQuery, setDossierSearchQuery] = useState('');
  const [charListQuery, setCharListQuery] = useState('');

  // Active Codex Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'physical' | 'stats' | 'relationships' | 'inventory' | 'abilities' | 'history' | 'dialogue' | 'notes'>('overview');

  // Conflict Resolution Modal state
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [mergePrimary, setMergePrimary] = useState<Character | null>(null);
  const [mergeSecondary, setMergeSecondary] = useState<Character | null>(null);

  // Quick Merge Select State
  const [mergeDropdownOpen, setMergeDropdownOpen] = useState(false);
  const [selectedMergeSecondary, setSelectedMergeSecondary] = useState<Character | null>(null);

  // Relationship Form State
  const [showRelForm, setShowRelForm] = useState(false);
  const [relOtherChar, setRelOtherChar] = useState('');
  const [relType, setRelType] = useState('Allies');
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

  const handleInitiateMerge = (primary: Character, secondary: Character) => {
    setMergePrimary(primary);
    setMergeSecondary(secondary);
    setConflictModalOpen(true);
  };

  const handleConfirmIntelligentMerge = async (overrides: Partial<Character>) => {
    if (!mergePrimary || !mergeSecondary) return;
    const success = await repository.intelligentMergeCharacters(bookId, mergePrimary.id, mergeSecondary.id, 'combine');
    if (success) {
      showToast(`Merged "${mergeSecondary.name}" into "${mergePrimary.name}" with zero data loss!`);
    }
    setConflictModalOpen(false);
    setMergePrimary(null);
    setMergeSecondary(null);
    setSelectedMergeSecondary(null);
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

  // Filtered Character List
  const filteredCharacters = characters.filter(c =>
    c.name.toLowerCase().includes(charListQuery.toLowerCase()) ||
    (c.aliases && c.aliases.some(a => a.toLowerCase().includes(charListQuery.toLowerCase()))) ||
    (c.occupation && c.occupation.toLowerCase().includes(charListQuery.toLowerCase()))
  );

  const mergeCandidates = characters.filter(c => selectedChar && c.id !== selectedChar.id);

  const RELATION_TYPES = ['Allies', 'Enemies', 'Lovers', 'Rivals', 'Family', 'Friends', 'Mentor/Student', 'Colleagues'];

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
  const [charSpecies, setCharSpecies] = useState('');
  const [charHair, setCharHair] = useState('');
  const [charEyes, setCharEyes] = useState('');
  const [charHeight, setCharHeight] = useState('');
  const [charWeight, setCharWeight] = useState('');
  const [charScars, setCharScars] = useState('');
  const [charLevel, setCharLevel] = useState<number>(1);
  const [charClass, setCharClass] = useState('');

  const openCreateModal = () => {
    setEditingChar(null);
    setCharName('');
    setCharSummary('');
    setCharStatus('Active');
    setCharOccupation('');
    setCharLocation('');
    setCharAliases('');
    setCharGoals('');
    setCharSpecies('');
    setCharHair('');
    setCharEyes('');
    setCharHeight('');
    setCharWeight('');
    setCharScars('');
    setCharLevel(1);
    setCharClass('');
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
    setCharSpecies(c.species || '');
    setCharHair(c.hairColor || '');
    setCharEyes(c.eyeColor || '');
    setCharHeight(c.height || '');
    setCharWeight(c.weight || '');
    setCharScars(c.scars || '');
    setCharLevel(c.level || 1);
    setCharClass(c.className || '');
    setIsModalOpen(true);
  };

  const handleSaveCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!charName.trim()) return;

    const aliasesArr = charAliases.split(',').map(a => a.trim()).filter(Boolean);

    const payload: Partial<Character> = {
      name: charName.trim(),
      summary: charSummary.trim(),
      status: charStatus,
      occupation: charOccupation.trim(),
      currentLocation: charLocation.trim(),
      aliases: aliasesArr,
      goals: charGoals.trim(),
      species: charSpecies.trim(),
      hairColor: charHair.trim(),
      eyeColor: charEyes.trim(),
      height: charHeight.trim(),
      weight: charWeight.trim(),
      scars: charScars.trim(),
      level: charLevel,
      className: charClass.trim()
    };

    if (editingChar) {
      await repository.updateCharacter(editingChar.id, payload);
      showToast(`Updated RPG Dossier for "${charName.trim()}"`);
    } else {
      const created = await repository.createCharacter(bookId, payload as any);
      if (created) {
        showToast(`Created character "${created.name}"`);
        setSelectedChar(created);
      }
    }

    setIsModalOpen(false);
    await refreshCharacters();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[60] px-5 py-3 rounded-xl bg-[#7c3aed] text-white text-sm font-bold shadow-2xl animate-in slide-in-from-top-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" /> {toast}
        </div>
      )}

      {/* Duplicate Detection Alert Banner */}
      {duplicates.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Automatic Duplicate Character Suggestions ({duplicates.length} detected)</span>
          </div>
          <div className="space-y-2 pt-1">
            {duplicates.map((dup, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#121218] border border-[#232334] text-xs">
                <div>
                  <span className="font-bold text-white">&quot;{dup.char1.name}&quot;</span>
                  <span className="text-[#8e8ea0] mx-2">matches</span>
                  <span className="font-bold text-white">&quot;{dup.char2.name}&quot;</span>
                  <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold">
                    {dup.confidence}% similarity
                  </span>
                </div>
                <button
                  onClick={() => handleInitiateMerge(dup.char1, dup.char2)}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg"
                >
                  <Merge className="w-3.5 h-3.5" /> Intelligent Merge
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
            <Users className="w-6 h-6 text-[#a78bfa]" /> RPG Character Codex
          </h1>
          <p className="text-xs text-[#8e8ea0] mt-1">
            Definitive source of truth for every character: physical traits, RPG stats, inventory, skills, relationships, and dialogue history.
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
        
        {/* Left Sidebar: Character Directory Search */}
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

        {/* Right Area: RPG Character Codex */}
        {selectedChar ? (
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-6">
            
            {/* Header & Quick Merge Bar */}
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

            {/* Instant Search Bar Across Codex Fields */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#7c3aed] absolute left-3 top-2.5" />
              <input
                type="text"
                value={dossierSearchQuery}
                onChange={(e) => setDossierSearchQuery(e.target.value)}
                placeholder="Search across all codex fields (e.g., scar, sword, level 15, promise)..."
                className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-[#0c0c10] border border-[#232334] text-white text-xs placeholder-[#52526b] focus:outline-none focus:border-[#7c3aed]"
              />
            </div>

            {/* RPG Codex Tab Navigation Bar */}
            <div className="flex items-center border-b border-[#232334] gap-1.5 text-xs font-bold overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: UserCheck },
                { id: 'physical', label: 'Appearance & Attire', icon: Users },
                { id: 'stats', label: 'RPG Stats & Progression', icon: Zap },
                { id: 'relationships', label: 'Relationships', icon: Heart },
                { id: 'inventory', label: 'Inventory & Weapons', icon: Package },
                { id: 'abilities', label: 'Abilities & Skills', icon: Shield },
                { id: 'history', label: 'Story Timeline', icon: History },
                { id: 'dialogue', label: 'Dialogue Facts', icon: MessageSquare },
                { id: 'notes', label: 'Author Notes', icon: Tag }
              ].map(t => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`flex items-center gap-1.5 py-2 px-3 border-b-2 transition-all whitespace-nowrap text-xs ${
                      isActive
                        ? 'border-[#7c3aed] text-[#a78bfa] font-extrabold bg-[#181820]'
                        : 'border-transparent text-[#8e8ea0] hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-[#181820] border border-[#232334] space-y-2">
                  <h3 className="font-bold text-[#a78bfa] uppercase tracking-wider text-[10px]">Synopsis &amp; Biography</h3>
                  <p className="text-[#a1a1aa] leading-relaxed">{selectedChar.summary || 'No biography recorded.'}</p>
                </div>

                {/* Dynamic Novel Attributes Grid */}
                {selectedChar.dynamicAttributes && Object.keys(selectedChar.dynamicAttributes).length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-[#a78bfa] uppercase tracking-wider text-[10px]">World System &amp; Dynamic Attributes</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
                      {Object.entries(selectedChar.dynamicAttributes).map(([key, val]) => (
                        <div key={key} className="p-3 rounded-xl bg-[#181820] border border-amber-500/30">
                          <div className="text-[10px] text-amber-400 font-extrabold uppercase">{key}</div>
                          <div className="font-bold text-white text-xs mt-0.5">{String(val)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  {selectedChar.species && (
                    <div className="p-3 rounded-xl bg-[#181820] border border-[#232334]">
                      <div className="text-[10px] text-[#8e8ea0] uppercase">Species / Race</div>
                      <div className="font-bold text-white text-xs mt-0.5">{selectedChar.species}</div>
                    </div>
                  )}
                  {selectedChar.occupation && (
                    <div className="p-3 rounded-xl bg-[#181820] border border-[#232334]">
                      <div className="text-[10px] text-[#8e8ea0] uppercase">Occupation</div>
                      <div className="font-bold text-white text-xs mt-0.5">{selectedChar.occupation}</div>
                    </div>
                  )}
                  {selectedChar.currentLocation && (
                    <div className="p-3 rounded-xl bg-[#181820] border border-[#232334]">
                      <div className="text-[10px] text-[#8e8ea0] uppercase">Current Location</div>
                      <div className="font-bold text-white text-xs mt-0.5">{selectedChar.currentLocation}</div>
                    </div>
                  )}
                  <div className="p-3 rounded-xl bg-[#181820] border border-[#232334]">
                    <div className="text-[10px] text-[#8e8ea0] uppercase">Status</div>
                    <div className="font-bold text-emerald-400 text-xs mt-0.5">{selectedChar.status}</div>
                  </div>
                </div>

                {/* Explicit Known Facts Stream */}
                {selectedChar.knownFacts && selectedChar.knownFacts.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#181820] border border-[#232334] space-y-2">
                    <h3 className="font-bold text-[#a78bfa] uppercase tracking-wider text-[10px]">Verified Canonical Facts</h3>
                    <div className="space-y-1.5">
                      {selectedChar.knownFacts.map((fact, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-white text-xs">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{fact}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedChar.goals && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                    <div className="font-bold text-emerald-400 uppercase text-[10px]">Immediate Goals &amp; Drive</div>
                    <div className="text-white">{selectedChar.goals}</div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Physical Appearance */}
            {activeTab === 'physical' && (
              <div className="space-y-4 text-xs">
                {/* Explicit Stated Appearance Facts */}
                <div className="p-4 rounded-xl bg-[#181820] border border-[#232334] space-y-2">
                  <h3 className="font-bold text-cyan-400 uppercase tracking-wider text-[10px]">Explicit Stated Appearance Facts</h3>
                  {selectedChar.explicitAppearanceFacts && selectedChar.explicitAppearanceFacts.length > 0 ? (
                    <div className="space-y-2">
                      {selectedChar.explicitAppearanceFacts.map((trait, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-[#121218] border border-[#232334] text-white">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{trait}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#8e8ea0] italic">No explicit physical appearance traits stated in chapter prose yet. Zero defaults fabricated.</p>
                  )}
                </div>

                {/* Stated physical features if manually added */}
                {(selectedChar.scars || selectedChar.clothing || selectedChar.physicalInjuries) && (
                  <div className="space-y-3">
                    {selectedChar.scars && (
                      <div className="p-3.5 rounded-xl bg-[#181820] border border-[#232334] space-y-1">
                        <div className="text-[10px] font-bold text-amber-400 uppercase">Scars, Tattoos &amp; Features</div>
                        <div className="text-white">{selectedChar.scars}</div>
                      </div>
                    )}

                    {selectedChar.clothing && (
                      <div className="p-3.5 rounded-xl bg-[#181820] border border-[#232334] space-y-1">
                        <div className="text-[10px] font-bold text-cyan-400 uppercase">Current Attire &amp; Armor</div>
                        <div className="text-white">{selectedChar.clothing}</div>
                      </div>
                    )}

                    {selectedChar.physicalInjuries && (
                      <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 space-y-1">
                        <div className="text-[10px] font-bold text-red-400 uppercase">Physical Injuries</div>
                        <div className="text-white">{selectedChar.physicalInjuries}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Dynamic Attributes & Progression History */}
            {activeTab === 'stats' && (
              <div className="space-y-4 text-xs">
                {/* Dynamic Attributes Grid */}
                {selectedChar.dynamicAttributes && Object.keys(selectedChar.dynamicAttributes).length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">World System &amp; Dynamic Attributes</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                      {Object.entries(selectedChar.dynamicAttributes).map(([key, val]) => (
                        <div key={key} className="p-4 rounded-xl bg-[#181820] border border-[#232334] text-center">
                          <div className="text-[10px] text-[#8e8ea0] uppercase">{key}</div>
                          <div className="text-base font-extrabold text-amber-400 mt-1">{String(val)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#181820] border border-[#232334] text-center text-[#8e8ea0]">
                    No dynamic system attributes recorded for this character yet.
                  </div>
                )}

                {/* Progression History Timeline */}
                <div className="space-y-2 pt-2">
                  <h3 className="font-bold text-[#a78bfa] uppercase tracking-wider text-[10px]">Attribute Progression History</h3>
                  {selectedChar.progressionHistory && selectedChar.progressionHistory.length > 0 ? (
                    <div className="space-y-2">
                      {selectedChar.progressionHistory.map((prog) => (
                        <div key={prog.id} className="p-3 rounded-xl bg-[#181820] border border-[#232334] flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white font-mono flex items-center gap-2">
                              <span>Ch. {prog.chapterNumber}:</span>
                              <span className="text-amber-400">{prog.attribute}</span>
                            </div>
                            <div className="text-xs text-[#a1a1aa] mt-0.5">
                              <span className="line-through text-[#8e8ea0]">{prog.oldValue}</span> → <strong className="text-emerald-400">{prog.newValue}</strong>
                              {prog.reason && <span className="ml-2 text-[#8e8ea0]">({prog.reason})</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#8e8ea0] italic">No progression changes recorded across chapters yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 4: Relationships */}
            {activeTab === 'relationships' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white">Relationships Network</h3>
                  <button
                    onClick={() => setShowRelForm(!showRelForm)}
                    className="px-3 py-1 rounded-lg bg-[#7c3aed] text-white font-bold text-xs"
                  >
                    + Add Relationship
                  </button>
                </div>

                {showRelForm && (
                  <div className="p-4 rounded-xl bg-[#181820] border border-[#232334] space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={relOtherChar}
                        onChange={(e) => setRelOtherChar(e.target.value)}
                        className="bg-[#121218] border border-[#232334] rounded-lg p-2 text-white"
                      >
                        <option value="">Select target character...</option>
                        {characters.filter(c => c.id !== selectedChar.id).map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <select
                        value={relType}
                        onChange={(e) => setRelType(e.target.value)}
                        className="bg-[#121218] border border-[#232334] rounded-lg p-2 text-white"
                      >
                        {RELATION_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={handleAddRelationship} className="px-4 py-1.5 rounded-lg bg-[#7c3aed] text-white font-bold">
                      Save Relationship
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {relationships
                    .filter(r => r.character1Name === selectedChar.name || r.character2Name === selectedChar.name)
                    .map(r => (
                      <div key={r.id} className="p-3 rounded-xl bg-[#181820] border border-[#232334] flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white">
                            {r.character1Name === selectedChar.name ? r.character2Name : r.character1Name}
                          </span>
                          <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300">
                            {r.relationType}
                          </span>
                        </div>
                        <button onClick={() => handleDeleteRelationship(r.id)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Tab 5: Inventory */}
            {activeTab === 'inventory' && (
              <div className="space-y-3 text-xs">
                <h3 className="font-bold text-white">Possessed Inventory &amp; Artifacts</h3>
                {items.filter(i => i.ownerCharacterName === selectedChar.name).map(i => (
                  <div key={i.id} className="p-3 rounded-xl bg-[#181820] border border-[#232334]">
                    <div className="font-bold text-white">{i.name}</div>
                    <div className="text-[#8e8ea0] mt-0.5">{i.description}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 6: Abilities */}
            {activeTab === 'abilities' && (
              <div className="space-y-3 text-xs">
                <h3 className="font-bold text-white">Abilities &amp; Skills</h3>
                {abilities.filter(a => a.userCharacterNames.includes(selectedChar.name)).map(a => (
                  <div key={a.id} className="p-3 rounded-xl bg-[#181820] border border-[#232334]">
                    <div className="font-bold text-white">{a.name}</div>
                    <div className="text-[#8e8ea0] mt-0.5">{a.description}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 7: History */}
            {activeTab === 'history' && (
              <div className="space-y-3 text-xs">
                <h3 className="font-bold text-white">Story Timeline &amp; Appearances</h3>
                {(selectedChar.chapterAppearances || []).map((app, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#181820] border border-[#232334]">
                    <div className="font-bold text-white font-mono">Ch. {app.chapterNumber} — {app.chapterTitle}</div>
                    <div className="text-[#a1a1aa] mt-1">{app.summary}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 8: Dialogue Facts */}
            {activeTab === 'dialogue' && (
              <div className="space-y-3 text-xs">
                <h3 className="font-bold text-white">Dialogue Commitments &amp; Promises</h3>
                {dialogueFacts.filter(d => d.speaker === selectedChar.name || d.recipient === selectedChar.name).map(df => (
                  <div key={df.id} className="p-3 rounded-xl bg-[#181820] border border-amber-500/20">
                    <div className="font-bold text-amber-300">{df.speaker} → {df.recipient}</div>
                    <div className="text-white font-mono mt-1">&quot;{df.fact}&quot;</div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 9: Author Notes */}
            {activeTab === 'notes' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add private author note..."
                    className="flex-1 px-3 py-2 rounded-xl bg-[#181820] border border-[#232334] text-white"
                  />
                  <button onClick={handleAddAuthorNote} className="px-4 py-2 rounded-xl bg-[#7c3aed] text-white font-bold">
                    Add Note
                  </button>
                </div>
                {(selectedChar.authorNotes || []).map((n, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#181820] border border-[#232334] flex items-center justify-between">
                    <span className="text-white">{n}</span>
                    <button onClick={() => handleDeleteAuthorNote(idx)} className="text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center rounded-2xl bg-[#121218] border border-[#232334] text-[#8e8ea0]">
            Select a character to view their complete RPG Codex Dossier.
          </div>
        )}

      </div>

      {/* Intelligent Merge Conflict Resolution Modal */}
      {mergePrimary && mergeSecondary && (
        <MergeConflictModal
          isOpen={conflictModalOpen}
          primaryChar={mergePrimary}
          secondaryChar={mergeSecondary}
          onConfirmMerge={handleConfirmIntelligentMerge}
          onClose={() => setConflictModalOpen(false)}
        />
      )}

    </div>
  );
}
