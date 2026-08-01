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
import { CharacterCodexHeader } from '@/components/character/CharacterCodexHeader';
import { DuplicateDetectionAlert } from '@/components/character/DuplicateDetectionAlert';

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
      <DuplicateDetectionAlert
        duplicates={duplicates}
        handleInitiateMerge={handleInitiateMerge}
      />

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
            
            <CharacterCodexHeader
              selectedChar={selectedChar}
              openEditProfileModal={openEditProfileModal}
              mergeDropdownOpen={mergeDropdownOpen}
              setMergeDropdownOpen={setMergeDropdownOpen}
              mergeCandidates={mergeCandidates}
              handleInitiateMerge={handleInitiateMerge}
              handleDelete={handleDelete}
            />

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
