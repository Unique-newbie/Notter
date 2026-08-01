import React from 'react';
import { Character, Ability, Item, Relationship, DialogueFactEntity } from '@/types';
import {
  UserCheck, Users, Zap, Heart, Package, Shield, History, MessageSquare, Tag,
  Sparkles, Award, FileText, CheckCircle2
} from 'lucide-react';

/**
 * Props for the CharacterCodexTabs component.
 */
export interface CharacterCodexTabsProps {
  activeTab: 'overview' | 'physical' | 'stats' | 'relationships' | 'inventory' | 'abilities' | 'history' | 'dialogue' | 'notes';
  setActiveTab: (tab: 'overview' | 'physical' | 'stats' | 'relationships' | 'inventory' | 'abilities' | 'history' | 'dialogue' | 'notes') => void;
  selectedChar: Character;
  dossierSearchQuery: string;
  setDossierSearchQuery?: (val: string) => void;
  abilities: Ability[];
  items: Item[];
  relationships: Relationship[];
  dialogueFacts: DialogueFactEntity[];
  showRelForm: boolean;
  setShowRelForm: (show: boolean) => void;
  relOtherChar: string;
  setRelOtherChar: (val: string) => void;
  relType: string;
  setRelType: (val: string) => void;
  relDesc?: string;
  setRelDesc?: (val: string) => void;
  newNote?: string;
  setNewNote?: (val: string) => void;
  newNoteText?: string;
  setNewNoteText?: (val: string) => void;
  characters: Character[];
  RELATION_TYPES?: string[];
  onAddRelationship?: () => void;
  handleAddRelationship?: () => void;
  onDeleteRelationship?: (id: string) => void;
  handleDeleteRelationship?: (id: string) => void;
  onAddNote?: () => void;
  handleAddAuthorNote?: () => void;
  onDeleteNote?: (index: number) => void;
  handleDeleteAuthorNote?: (index: number) => void;
}

/**
 * Character Codex Tab Navigation and detailed content tabs for physical appearance, RPG stats, inventory, timeline, dialogue, and author notes.
 */
export function CharacterCodexTabs(props: CharacterCodexTabsProps) {
  const {
    activeTab,
    setActiveTab,
    selectedChar,
    dossierSearchQuery,
    abilities,
    items,
    relationships,
    dialogueFacts,
    showRelForm,
    setShowRelForm,
    relOtherChar,
    setRelOtherChar,
    relType,
    setRelType,
    relDesc = '',
    setRelDesc = () => {},
    newNote = props.newNoteText || '',
    setNewNote = props.setNewNoteText || (() => {}),
    characters,
  } = props;

  const onAddRelationship = props.onAddRelationship || props.handleAddRelationship || (() => {});
  const onDeleteRelationship = props.onDeleteRelationship || props.handleDeleteRelationship || (() => {});
  const onAddNote = props.onAddNote || props.handleAddAuthorNote || (() => {});
  const onDeleteNote = props.onDeleteNote || props.handleDeleteAuthorNote || (() => {});
  const query = dossierSearchQuery.toLowerCase();

  return (
    <div className="space-y-4">
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
              <p className="text-[#8e8ea0] italic">No explicit physical appearance traits stated in chapter prose yet.</p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
            {selectedChar.height && (
              <div className="p-3 rounded-xl bg-[#181820] border border-[#232334]">
                <div className="text-[10px] text-[#8e8ea0] uppercase">Height</div>
                <div className="font-bold text-white text-xs mt-0.5">{selectedChar.height}</div>
              </div>
            )}
            {selectedChar.weight && (
              <div className="p-3 rounded-xl bg-[#181820] border border-[#232334]">
                <div className="text-[10px] text-[#8e8ea0] uppercase">Weight / Build</div>
                <div className="font-bold text-white text-xs mt-0.5">{selectedChar.weight}</div>
              </div>
            )}
            {selectedChar.hairColor && (
              <div className="p-3 rounded-xl bg-[#181820] border border-[#232334]">
                <div className="text-[10px] text-[#8e8ea0] uppercase">Hair Color</div>
                <div className="font-bold text-white text-xs mt-0.5">{selectedChar.hairColor}</div>
              </div>
            )}
            {selectedChar.eyeColor && (
              <div className="p-3 rounded-xl bg-[#181820] border border-[#232334]">
                <div className="text-[10px] text-[#8e8ea0] uppercase">Eye Color</div>
                <div className="font-bold text-white text-xs mt-0.5">{selectedChar.eyeColor}</div>
              </div>
            )}
          </div>

          {selectedChar.scars && (
            <div className="p-4 rounded-xl bg-[#181820] border border-[#232334] space-y-1">
              <div className="font-bold text-amber-400 uppercase text-[10px]">Scars &amp; Distinguishing Marks</div>
              <div className="text-white">{selectedChar.scars}</div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: RPG Stats & Progression */}
      {activeTab === 'stats' && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
            {selectedChar.level && (
              <div className="p-3 rounded-xl bg-[#181820] border border-amber-500/30">
                <div className="text-[10px] text-amber-400 uppercase">Power Level</div>
                <div className="font-bold text-white text-sm mt-0.5">Level {selectedChar.level}</div>
              </div>
            )}
            {selectedChar.className && (
              <div className="p-3 rounded-xl bg-[#181820] border border-purple-500/30">
                <div className="text-[10px] text-purple-400 uppercase">System Class</div>
                <div className="font-bold text-white text-sm mt-0.5">{selectedChar.className}</div>
              </div>
            )}
          </div>

          {selectedChar.progressionHistory && selectedChar.progressionHistory.length > 0 ? (
            <div className="p-4 rounded-xl bg-[#181820] border border-[#232334] space-y-2">
              <h3 className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Progression Timeline</h3>
              <div className="space-y-2">
                {selectedChar.progressionHistory.map((p, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#121218] border border-[#232334] flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-[#a78bfa] font-bold">Ch {p.chapterNumber}:</span>
                      <span className="text-white ml-2">{p.attribute}</span>
                    </div>
                    <div className="text-amber-400 font-bold">{p.oldValue} → {p.newValue}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-[#8e8ea0] italic bg-[#181820] rounded-xl border border-[#232334]">
              No progression history entries recorded.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Relationships */}
      {activeTab === 'relationships' && (
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">Character Relationships</h3>
            <button
              onClick={() => setShowRelForm(!showRelForm)}
              className="px-3 py-1 rounded-lg bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9]"
            >
              + Add Relationship
            </button>
          </div>

          {showRelForm && (
            <div className="p-4 rounded-xl bg-[#181820] border border-[#232334] space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#8e8ea0] mb-1">Target Character</label>
                  <select
                    value={relOtherChar}
                    onChange={(e) => setRelOtherChar(e.target.value)}
                    className="w-full bg-[#121218] border border-[#232334] rounded-lg p-2 text-white"
                  >
                    <option value="">Select Character...</option>
                    {characters.filter(c => c.name !== selectedChar.name).map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#8e8ea0] mb-1">Relationship Type</label>
                  <input
                    type="text"
                    value={relType}
                    onChange={(e) => setRelType(e.target.value)}
                    placeholder="e.g. Allies, Rivals, Siblings"
                    className="w-full bg-[#121218] border border-[#232334] rounded-lg p-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-[#8e8ea0] mb-1">Description / Lore</label>
                <input
                  type="text"
                  value={relDesc}
                  onChange={(e) => setRelDesc(e.target.value)}
                  placeholder="Optional details..."
                  className="w-full bg-[#121218] border border-[#232334] rounded-lg p-2 text-white"
                />
              </div>
              <button
                onClick={onAddRelationship}
                disabled={!relOtherChar.trim()}
                className="px-4 py-1.5 rounded-lg bg-[#7c3aed] text-white font-bold text-xs disabled:opacity-50"
              >
                Save Relationship
              </button>
            </div>
          )}

          {relationships.filter(r => r.character1Name === selectedChar.name || r.character2Name === selectedChar.name)
            .filter(r => !query || r.character1Name.toLowerCase().includes(query) || r.character2Name.toLowerCase().includes(query) || r.relationType.toLowerCase().includes(query) || r.description.toLowerCase().includes(query))
            .map(r => (
            <div key={r.id} className="p-3 rounded-xl bg-[#181820] border border-[#232334] flex items-center justify-between">
              <div>
                <div className="font-bold text-white">
                  {r.character1Name === selectedChar.name ? r.character2Name : r.character1Name}
                  <span className="ml-2 text-xs text-[#a78bfa]">({r.relationType})</span>
                </div>
                {r.description && <div className="text-[#8e8ea0] text-[11px] mt-0.5">{r.description}</div>}
              </div>
              <button
                onClick={() => onDeleteRelationship(r.id)}
                className="text-[#8e8ea0] hover:text-red-400 text-xs"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Inventory & Weapons */}
      {activeTab === 'inventory' && (
        <div className="space-y-3 text-xs">
          <h3 className="font-bold text-white">Owned Items &amp; Artifacts</h3>
          {items.filter(i => i.ownerCharacterName === selectedChar.name)
            .filter(i => !query || i.name.toLowerCase().includes(query) || (i.description || '').toLowerCase().includes(query))
            .map(item => (
            <div key={item.id} className="p-3 rounded-xl bg-[#181820] border border-[#232334] flex items-center justify-between">
              <div>
                <div className="font-bold text-emerald-400">{item.name} <span className="text-[10px] text-[#8e8ea0]">({item.type})</span></div>
                <div className="text-[#a1a1aa] text-[11px] mt-0.5">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 6: Abilities & Skills */}
      {activeTab === 'abilities' && (
        <div className="space-y-3 text-xs">
          <h3 className="font-bold text-white">Associated Abilities &amp; Magic</h3>
          {abilities.filter(a => a.userCharacterNames?.includes(selectedChar.name))
            .filter(a => !query || a.name.toLowerCase().includes(query) || (a.description || '').toLowerCase().includes(query))
            .map(ab => (
            <div key={ab.id} className="p-3 rounded-xl bg-[#181820] border border-[#232334]">
              <div className="font-bold text-[#a78bfa]">{ab.name} <span className="text-[10px] text-[#8e8ea0]">({ab.category})</span></div>
              <div className="text-[#a1a1aa] text-[11px] mt-0.5">{ab.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 7: Author Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-3 text-xs">
          <h3 className="font-bold text-white">Author Notes &amp; Private Ideas</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add private note..."
              className="flex-1 bg-[#181820] border border-[#232334] rounded-lg p-2 text-white"
            />
            <button
              onClick={onAddNote}
              disabled={!newNote.trim()}
              className="px-4 py-2 bg-[#7c3aed] text-white font-bold rounded-lg disabled:opacity-50"
            >
              Add Note
            </button>
          </div>

          {(selectedChar.notes || [])
            .filter((note: string) => !query || note.toLowerCase().includes(query))
            .map((note: string, idx: number) => (
            <div key={idx} className="p-3 rounded-xl bg-[#181820] border border-[#232334] flex items-center justify-between">
              <div className="text-white">{note}</div>
              <button onClick={() => onDeleteNote(idx)} className="text-[#8e8ea0] hover:text-red-400 text-xs">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
