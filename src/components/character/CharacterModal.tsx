import React, { useState, useEffect } from 'react';
import { Character } from '@/types';
import { repository } from '@/lib/store/repository';
import { X } from 'lucide-react';

/**
 * Props for the CharacterModal component.
 */
export interface CharacterModalProps {
  isOpen: boolean;
  bookId: string;
  editingChar: Character | null;
  onClose: () => void;
  onSaveSuccess: (char: Character, msg: string) => void;
}

/**
 * Modal to create or edit a Character profile.
 */
export function CharacterModal({
  isOpen,
  bookId,
  editingChar,
  onClose,
  onSaveSuccess,
}: CharacterModalProps) {
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

  useEffect(() => {
    if (isOpen) {
      if (editingChar) {
        setCharName(editingChar.name);
        setCharSummary(editingChar.summary || '');
        setCharStatus(editingChar.status || 'Active');
        setCharOccupation(editingChar.occupation || '');
        setCharLocation(editingChar.currentLocation || '');
        setCharAliases(editingChar.aliases ? editingChar.aliases.join(', ') : '');
        setCharGoals(editingChar.goals || '');
        setCharSpecies(editingChar.species || '');
        setCharHair(editingChar.hairColor || '');
        setCharEyes(editingChar.eyeColor || '');
        setCharHeight(editingChar.height || '');
        setCharWeight(editingChar.weight || '');
        setCharScars(editingChar.scars || '');
        setCharLevel(editingChar.level || 1);
        setCharClass(editingChar.className || '');
      } else {
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
      }
    }
  }, [isOpen, editingChar]);

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
      onSaveSuccess({ ...editingChar, ...payload } as Character, `Updated RPG Dossier for "${charName.trim()}"`);
    } else {
      const created = await repository.createCharacter(bookId, payload as any);
      if (created) {
        onSaveSuccess(created, `Created character "${created.name}"`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#121218] border border-[#232334] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-[#232334] flex items-center justify-between sticky top-0 bg-[#121218] z-10">
          <h2 className="text-xl font-extrabold text-white">
            {editingChar ? 'Edit Character Codex' : 'Create New Character'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#8e8ea0] hover:text-white hover:bg-[#232334] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#8e8ea0] uppercase mb-1.5">Name *</label>
              <input
                type="text"
                value={charName}
                onChange={(e) => setCharName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-[#0c0c10] border border-[#232334] text-white text-sm focus:outline-none focus:border-[#7c3aed]"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[#8e8ea0] uppercase mb-1.5">Aliases (comma separated)</label>
              <input
                type="text"
                value={charAliases}
                onChange={(e) => setCharAliases(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0c0c10] border border-[#232334] text-white text-sm focus:outline-none focus:border-[#7c3aed]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8e8ea0] uppercase mb-1.5">Summary</label>
              <textarea
                value={charSummary}
                onChange={(e) => setCharSummary(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-xl bg-[#0c0c10] border border-[#232334] text-white text-sm focus:outline-none focus:border-[#7c3aed] resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8e8ea0] uppercase mb-1.5">Status</label>
              <select
                value={charStatus}
                onChange={(e) => setCharStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0c0c10] border border-[#232334] text-white text-sm focus:outline-none focus:border-[#7c3aed]"
              >
                <option value="Active">Active</option>
                <option value="Deceased">Deceased</option>
                <option value="Missing">Missing</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-[#232334] flex items-center justify-end gap-3 sticky bottom-0 bg-[#121218] z-10">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-transparent text-white text-sm font-bold border border-[#232334] hover:bg-[#232334] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveCharacter}
            disabled={!charName.trim()}
            className="px-5 py-2 rounded-xl bg-[#7c3aed] text-white text-sm font-bold shadow-purple hover:bg-[#6d28d9] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Character
          </button>
        </div>
      </div>
    </div>
  );
}
