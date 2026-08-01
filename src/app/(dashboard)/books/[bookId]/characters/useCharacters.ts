import { useState, useEffect, useCallback } from 'react';
import { repository } from '@/lib/store/repository';
import { Character, Ability, Item, Relationship, DialogueFactEntity } from '@/types';

export function useCharacters(bookId: string, initialCharId: string | null) {
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

  return {
    characters, setCharacters,
    selectedChar, setSelectedChar,
    abilities, setAbilities,
    items, setItems,
    relationships, setRelationships,
    dialogueFacts, setDialogueFacts,
    duplicates, setDuplicates,
    toast, showToast,
    dossierSearchQuery, setDossierSearchQuery,
    charListQuery, setCharListQuery,
    activeTab, setActiveTab,
    conflictModalOpen, setConflictModalOpen,
    mergePrimary, setMergePrimary,
    mergeSecondary, setMergeSecondary,
    mergeDropdownOpen, setMergeDropdownOpen,
    selectedMergeSecondary, setSelectedMergeSecondary,
    showRelForm, setShowRelForm,
    relOtherChar, setRelOtherChar,
    relType, setRelType,
    relDesc, setRelDesc,
    newNote, setNewNote,
    newTag, setNewTag,
    refreshCharacters
  };
}
