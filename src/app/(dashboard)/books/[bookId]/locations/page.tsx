'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { repository } from '@/lib/store/repository';
import { LocationEntity } from '@/types';
import { MapPin, Users, Plus, Edit3, Trash2, X, CheckCircle2 } from 'lucide-react';

export default function LocationsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookId = (params?.bookId as string) || 'book-1';
  const initialId = searchParams.get('id');

  const [locations, setLocations] = useState<LocationEntity[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationEntity | null>(null);
  const [toast, setToast] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationEntity | null>(null);
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [type, setType] = useState('City');
  const [charsInput, setCharsInput] = useState('');
  const [error, setError] = useState('');

  const loadLocations = async () => {
    const list = await repository.getLocations(bookId);
    setLocations(list);
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
      const created = await repository.createLocation(bookId, {
        name: name.trim(),
        summary: summary.trim(),
        type,
        charactersPresentNames: charsArr
      });
      if (created) {
        showToast(`Created location "${created.name}"`);
        setSelectedLocation(created);
      }
    }

    setIsModalOpen(false);
    await loadLocations();
  };

  const handleDeleteLocation = async (l: LocationEntity) => {
    if (confirm(`Delete location "${l.name}"?`)) {
      await repository.deleteLocation(l.id);
      showToast(`Deleted "${l.name}"`);
      setSelectedLocation(null);
      await loadLocations();
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
            <MapPin className="w-6 h-6 text-[#10b981]" /> World Locations & Atlas
          </h1>
          <p className="text-xs text-[#8e8ea0] mt-1">
            Kingdoms, cities, fortresses, taverns, and dungeons cataloged automatically.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] transition-all shadow-purple shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Location List */}
        <div className="space-y-3">
          {locations.length === 0 && (
            <div className="p-8 text-center rounded-xl bg-[#121218] border border-[#232334] text-[#8e8ea0] text-xs space-y-3">
              <MapPin className="w-8 h-8 mx-auto text-[#10b981] opacity-40" />
              <div>No locations recorded yet.</div>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] transition-all shadow-purple"
              >
                + Add First Location
              </button>
            </div>
          )}
          {locations.map((loc) => (
            <div
              key={loc.id}
              onClick={() => setSelectedLocation(loc)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${
                selectedLocation?.id === loc.id
                  ? 'bg-[#121218] border-[#10b981] shadow-purple'
                  : 'bg-[#121218]/60 border-[#232334] hover:border-[#10b981]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{loc.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#1e1e2a] text-[#10b981]">
                  {loc.type || 'City'}
                </span>
              </div>
              <p className="text-xs text-[#8e8ea0] mt-1 line-clamp-2">{loc.summary}</p>
            </div>
          ))}
        </div>

        {/* Location Detail View */}
        {selectedLocation ? (
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-6">
            <div className="flex items-start justify-between border-b border-[#232334] pb-4">
              <div>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
                  {selectedLocation.type || 'City'}
                </span>
                <h2 className="text-2xl font-extrabold text-white mt-2">{selectedLocation.name}</h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedLocation)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-[#181820] text-white border-[#232334] hover:border-[#10b981]/50 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDeleteLocation(selectedLocation)}
                  className="p-2 rounded-lg text-red-400 bg-[#181820] border border-[#232334] hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">Summary & Lore</h3>
              <p className="p-4 rounded-xl bg-[#181820] border border-[#232334] text-xs text-[#a1a1aa] leading-relaxed">
                {selectedLocation.summary || 'No summary provided.'}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#a78bfa] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Characters Present / Visiting
              </h3>
              <div className="flex flex-wrap gap-2">
                {(selectedLocation.charactersPresentNames || []).length === 0 ? (
                  <span className="text-xs text-[#8e8ea0] italic">No characters recorded here.</span>
                ) : (
                  selectedLocation.charactersPresentNames.map((c, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-lg bg-[#7c3aed]/15 text-[#a78bfa] border border-[#7c3aed]/30 font-semibold text-xs flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#a78bfa]" /> {c}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center bg-[#121218] border border-[#232334] rounded-2xl text-[#8e8ea0]">
            Select a location to view details.
          </div>
        )}
      </div>

      {/* Create / Edit Location Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#121218] border border-[#232334] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#232334] bg-[#0c0c10] flex items-center justify-between">
              <h2 className="font-bold text-white text-base">
                {editingLocation ? `Edit Location: ${editingLocation.name}` : 'Add New Location'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8e8ea0] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-semibold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                    Location Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ironforge Citadel"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white placeholder-[#8e8ea0] focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                    Type
                  </label>
                  <input
                    type="text"
                    placeholder="City, Kingdom, Fortress, Tavern..."
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                  Summary & Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Overview of geography, history, or atmosphere..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full bg-[#181820] border border-[#232334] rounded-xl p-3 text-white placeholder-[#8e8ea0] focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                  Characters Present (Comma-separated names)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Isaac Carter, Sarah Vance"
                  value={charsInput}
                  onChange={(e) => setCharsInput(e.target.value)}
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
                  {editingLocation ? 'Save Location' : 'Add Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
