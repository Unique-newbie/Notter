'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { repository } from '@/lib/store/repository';
import { LocationEntity } from '@/types';
import { MapPin, Users, Plus, Edit3, Trash2, X, CheckCircle2, Merge, AlertCircle } from 'lucide-react';
import { UniversalMergeModal } from '@/components/common/UniversalMergeModal';

export default function LocationsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookId = (params?.bookId as string) || 'book-1';
  const initialId = searchParams.get('id');

  const [locations, setLocations] = useState<LocationEntity[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationEntity | null>(null);
  const [duplicates, setDuplicates] = useState<{ item1: LocationEntity; item2: LocationEntity; confidence: number }[]>([]);
  const [toast, setToast] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationEntity | null>(null);
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [type, setType] = useState('City');
  const [charsInput, setCharsInput] = useState('');
  const [error, setError] = useState('');

  // Merge State
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergePrimary, setMergePrimary] = useState<LocationEntity | null>(null);
  const [mergeSecondary, setMergeSecondary] = useState<LocationEntity | null>(null);

  const loadLocations = async () => {
    const list = await repository.getLocations(bookId);
    setLocations(list);
    setDuplicates(await repository.findDuplicateLocationSuggestions(bookId));
    if (list.length > 0) {
      const match = initialId ? list.find(l => l.id === initialId) || list[0] : list[0];
      setSelectedLocation(prev => (prev && list.find(l => l.id === prev.id)) ? list.find(l => l.id === prev.id)! : match);
    } else {
      setSelectedLocation(null);
    }
  };

  useEffect(() => {
    loadLocations();
    const handleDataChanged = () => loadLocations();
    window.addEventListener('storybible_data_changed', handleDataChanged);
    return () => window.removeEventListener('storybible_data_changed', handleDataChanged);
  }, [bookId, initialId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleOpenMerge = (primary: LocationEntity, secondary: LocationEntity) => {
    setMergePrimary(primary);
    setMergeSecondary(secondary);
    setMergeModalOpen(true);
  };

  const handleConfirmMerge = async (primaryId: string, secondaryId: string, overrides: any) => {
    const success = await repository.intelligentMergeLocations(bookId, primaryId, secondaryId);
    if (success) {
      showToast('Intelligent Location Merge Complete!');
      await loadLocations();
    }
  };

  const openCreateModal = () => {
    setEditingLocation(null);
    setName('');
    setSummary('');
    setType('City');
    setCharsInput('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (l: LocationEntity) => {
    setEditingLocation(l);
    setName(l.name);
    setSummary(l.summary || '');
    setType(l.type || 'City');
    setCharsInput(l.charactersPresentNames ? l.charactersPresentNames.join(', ') : '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Please enter a location name.');
      return;
    }

    const charsArr = charsInput.split(',').map(c => c.trim()).filter(Boolean);

    if (editingLocation) {
      await repository.updateLocation(editingLocation.id, {
        name: name.trim(),
        summary: summary.trim(),
        type,
        charactersPresentNames: charsArr
      });
      showToast(`Updated "${name.trim()}"`);
    } else {
      await repository.createLocation(bookId, {
        name: name.trim(),
        summary: summary.trim(),
        type,
        charactersPresentNames: charsArr
      });
      showToast(`Created location "${name.trim()}"`);
    }

    setIsModalOpen(false);
    await loadLocations();
  };

  const handleDeleteLocation = async (id: string, locName: string) => {
    await repository.deleteLocation(id);
    showToast(`Deleted "${locName}"`);
    if (selectedLocation?.id === id) setSelectedLocation(null);
    await loadLocations();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[60] px-5 py-3 rounded-xl bg-[#7c3aed] text-white text-sm font-bold shadow-2xl animate-in slide-in-from-top-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" /> {toast}
        </div>
      )}

      {/* Duplicate Location Suggestions Banner */}
      {duplicates.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Duplicate Location Suggestions ({duplicates.length} detected)</span>
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
            <MapPin className="w-6 h-6 text-emerald-400" /> World Locations &amp; Realms
          </h1>
          <p className="text-xs text-[#8e8ea0] mt-1">
            Cities, fortresses, dungeons, realms, and key landmarks across your story world.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-600 hover:text-white transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" /> Add New Location
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Sidebar: Locations List */}
        <div className="space-y-2 max-h-[78vh] overflow-y-auto pr-1">
          {locations.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#121218] border border-[#232334] text-[#8e8ea0] text-xs space-y-2">
              <div>No locations recorded in this story bible yet.</div>
              <button onClick={openCreateModal} className="px-4 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs">
                + Add Location
              </button>
            </div>
          ) : (
            locations.map((loc) => {
              const isSelected = selectedLocation?.id === loc.id;
              return (
                <div
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-[#121218] border-emerald-500 shadow-lg'
                      : 'bg-[#121218]/60 border-[#232334] hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-white text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      {loc.name}
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#1e1e2a] text-emerald-400">
                      {loc.type || 'City'}
                    </span>
                  </div>

                  <p className="text-xs text-[#8e8ea0] mt-1.5 line-clamp-2 leading-relaxed">
                    {loc.summary || 'No summary recorded.'}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Right Details Panel */}
        {selectedLocation ? (
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-6">
            <div className="flex items-center justify-between border-b border-[#232334] pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {selectedLocation.type || 'City'}
                </span>
                <h2 className="text-2xl font-extrabold text-white mt-1">{selectedLocation.name}</h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedLocation)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-[#181820] text-emerald-400 border-[#232334] hover:border-emerald-500/50 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>

                {locations.length > 1 && (
                  <button
                    onClick={() => {
                      const secondary = locations.find(l => l.id !== selectedLocation.id);
                      if (secondary) handleOpenMerge(selectedLocation, secondary);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-[#181820] text-amber-400 border-amber-500/30 hover:bg-amber-500/10 transition-all"
                  >
                    <Merge className="w-3.5 h-3.5" /> Merge
                  </button>
                )}

                <button
                  onClick={() => handleDeleteLocation(selectedLocation.id, selectedLocation.name)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 border border-[#232334]"
                  title="Delete Location"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[#181820] border border-[#232334] space-y-1.5">
                <h3 className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">Location Overview &amp; Lore</h3>
                <p className="text-[#a1a1aa] leading-relaxed">{selectedLocation.summary || 'No detailed summary.'}</p>
              </div>

              <div className="p-4 rounded-xl bg-[#181820] border border-[#232334] space-y-2">
                <h3 className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">Characters Present or Associated</h3>
                {selectedLocation.charactersPresentNames && selectedLocation.charactersPresentNames.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedLocation.charactersPresentNames.map((cName, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-lg bg-[#121218] border border-[#232334] text-white font-bold flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-emerald-400" /> {cName}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#8e8ea0] italic">No characters assigned to this location yet.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center rounded-2xl bg-[#121218] border border-[#232334] text-[#8e8ea0] text-xs">
            Select a location to view details.
          </div>
        )}

      </div>

      {/* Universal Merge Modal */}
      {mergePrimary && mergeSecondary && (
        <UniversalMergeModal
          isOpen={mergeModalOpen}
          entityType="location"
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
                {editingLocation ? 'Edit Location' : 'Add New Location'}
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

            <form onSubmit={handleSaveLocation} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#8e8ea0]">Location Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Camelot Fortress, Iron Citadel"
                  className="w-full px-3 py-2 rounded-xl bg-[#181820] border border-[#232334] text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#8e8ea0]">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#181820] border border-[#232334] text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="City">City / Settlement</option>
                  <option value="Fortress">Fortress / Castle</option>
                  <option value="Dungeon">Dungeon / Cave</option>
                  <option value="Realm">Realm / Dimension</option>
                  <option value="Landmark">Landmark / Shrine</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#8e8ea0]">Summary &amp; Lore</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Describe this location..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-[#181820] border border-[#232334] text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#8e8ea0]">Characters Present (Comma Separated)</label>
                <input
                  type="text"
                  value={charsInput}
                  onChange={(e) => setCharsInput(e.target.value)}
                  placeholder="e.g. Arthur, Lancelot, Guinevere"
                  className="w-full px-3 py-2 rounded-xl bg-[#181820] border border-[#232334] text-white focus:outline-none focus:border-emerald-500"
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
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-600 hover:text-white"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
