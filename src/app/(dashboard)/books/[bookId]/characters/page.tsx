'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { repository } from '@/lib/store/repository';
import { Character, Ability, Item, Relationship, DialogueFactEntity } from '@/types';
import {
  Users, AlertCircle, Merge, Trash2,
  ChevronDown, Plus, FileText, Search, CheckCircle2
} from 'lucide-react';
import { MergeConflictModal } from '@/components/character/MergeConflictModal';
import { CharacterCodexTabs } from '@/components/character/CharacterCodexTabs';
import { CharacterModal } from '@/components/character/CharacterModal';
import { CharacterListSidebar } from '@/components/character/CharacterListSidebar';

import { useCharacters } from './useCharacters';

/**
 * Character Codex Management Page.
 * Renders character lists, detailed RPG character dossiers, and duplicate merge tools.
 */
export default function CharactersPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookId = (params?.bookId as string) || 'book-1';
  const initialCharId = searchParams.get('id');

  const {
    characters, selectedChar, setSelectedChar,
    abilities, items, relationships, dialogueFacts,
    duplicates, toast, showToast,
    dossierSearchQuery, setDossierSearchQuery,
    charListQuery, setCharListQuery,
    activeTab, setActiveTab,
    conflictModalOpen, setConflictModalOpen,
    mergePrimary, setMergePrimary,
    mergeSecondary, setMergeSecondary,
    mergeDropdownOpen, setMergeDropdownOpen,
    showRelForm, setShowRelForm,
    relOtherChar, setRelOtherChar,
    relType, setRelType,
    relDesc, setRelDesc,
    newNote, setNewNote,
    refreshCharacters
  } = useCharacters(bookId, initialCharId);

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
    const updatedNotes = [...(selectedChar.notes || []), newNote.trim()];
    await repository.updateCharacter(selectedChar.id, { notes: updatedNotes });
    setNewNote('');
    showToast('Author note saved');
    await refreshCharacters();
  };

  const handleDeleteAuthorNote = async (index: number) => {
    if (!selectedChar || !selectedChar.notes) return;
    const updated = selectedChar.notes.filter((_, i) => i !== index);
    await repository.updateCharacter(selectedChar.id, { notes: updated });
    showToast('Note deleted');
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

  const openCreateModal = () => {
    setEditingChar(null);
    setIsModalOpen(true);
  };

  const openEditProfileModal = (c: Character) => {
    setEditingChar(c);
    setIsModalOpen(true);
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
        <CharacterListSidebar
          charListQuery={charListQuery}
          setCharListQuery={setCharListQuery}
          filteredCharacters={filteredCharacters}
          selectedChar={selectedChar}
          setSelectedChar={setSelectedChar}
          openCreateModal={openCreateModal}
        />

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

            <CharacterCodexTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              selectedChar={selectedChar}
              dossierSearchQuery={dossierSearchQuery}
              abilities={abilities}
              items={items}
              relationships={relationships}
              dialogueFacts={dialogueFacts}
              showRelForm={showRelForm}
              setShowRelForm={setShowRelForm}
              relOtherChar={relOtherChar}
              setRelOtherChar={setRelOtherChar}
              relType={relType}
              setRelType={setRelType}
              relDesc={relDesc}
              setRelDesc={setRelDesc}
              newNote={newNote}
              setNewNote={setNewNote}
              characters={characters}
              onAddRelationship={handleAddRelationship}
              onDeleteRelationship={handleDeleteRelationship}
              onAddNote={handleAddAuthorNote}
              onDeleteNote={handleDeleteAuthorNote}
            />

          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center rounded-2xl bg-[#121218] border border-[#232334] text-[#8e8ea0]">
            Select a character to view their complete RPG Codex Dossier.
          </div>
        )}

      </div>

      {/* Merge Conflict Modal */}
      {mergePrimary && mergeSecondary && (
        <MergeConflictModal
          isOpen={conflictModalOpen}
          primaryChar={mergePrimary}
          secondaryChar={mergeSecondary}
          onClose={() => setConflictModalOpen(false)}
          onConfirmMerge={async () => {
            const ok = await repository.intelligentMergeCharacters(bookId, mergePrimary.id, mergeSecondary.id, 'combine');
            if (ok) {
              showToast('Characters merged successfully!');
              setConflictModalOpen(false);
              await refreshCharacters();
            }
          }}
        />
      )}

      {/* Create / Edit Character Modal */}
      <CharacterModal
        isOpen={isModalOpen}
        bookId={bookId}
        editingChar={editingChar}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={async (char, msg) => {
          showToast(msg);
          setIsModalOpen(false);
          await refreshCharacters();
          if (!editingChar) {
            setSelectedChar(char);
          }
        }}
      />
    </div>
  );
}
