'use client';

import React, { useState } from 'react';
import { TimelineEvent, Chapter } from '@/types';
import { Clock, ChevronRight, Sparkles, MapPin, Filter, User, Package, Layers, Plus, Trash2, X, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { repository } from '@/lib/store/repository';

interface TimelineVisualizerProps {
  bookId: string;
  timelineEvents: TimelineEvent[];
  chapters: Chapter[];
  onRefresh?: () => void;
}

export function TimelineVisualizer({ bookId, timelineEvents, chapters, onRefresh }: TimelineVisualizerProps) {
  const [viewMode, setViewMode] = useState<'global' | 'character' | 'item' | 'location'>('global');
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [significanceFilter, setSignificanceFilter] = useState<string>('all');
  const [toast, setToast] = useState('');

  // Create Event Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [chapterNumber, setChapterNumber] = useState(1);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [participantsInput, setParticipantsInput] = useState('');
  const [significance, setSignificance] = useState<'Minor' | 'Major' | 'Climactic'>('Major');
  const [timePassedNote, setTimePassedNote] = useState('');
  const [error, setError] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const openCreateModal = () => {
    setTitle('');
    setChapterNumber(chapters.length > 0 ? chapters[chapters.length - 1].chapterNumber : 1);
    setDescription('');
    setLocation('');
    setParticipantsInput('');
    setSignificance('Major');
    setTimePassedNote('');
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Please enter an event title.');
      return;
    }

    const participantsArr = participantsInput.split(',').map(p => p.trim()).filter(Boolean);
    const matchedChap = chapters.find(c => c.chapterNumber === Number(chapterNumber));

    await repository.createTimelineEvent(bookId, {
      chapterId: matchedChap ? matchedChap.id : '',
      chapterNumber: Number(chapterNumber) || 1,
      title: title.trim(),
      description: description.trim(),
      location: location.trim() || undefined,
      participants: participantsArr,
      significance,
      timePassedNote: timePassedNote.trim() || undefined,
      currentArc: 'Main Story Arc'
    });

    showToast(`Added event "${title.trim()}"`);
    setIsModalOpen(false);
    if (onRefresh) onRefresh();
  };

  const handleDeleteEvent = async (evtId: string, evtTitle: string) => {
    if (confirm(`Delete timeline event "${evtTitle}"?`)) {
      await repository.deleteTimelineEvent(evtId);
      showToast(`Deleted "${evtTitle}"`);
      if (onRefresh) onRefresh();
    }
  };

  // Extract unique participants, locations, and items across timeline events
  const allCharacters = Array.from(new Set(
    timelineEvents.flatMap(e => e.participants || [])
  )).filter(Boolean);

  const allLocations = Array.from(new Set(
    timelineEvents.map(e => e.location).filter(Boolean) as string[]
  ));

  const allItems = Array.from(new Set(
    timelineEvents.flatMap(e => e.itemsExchanged || [])
  )).filter(Boolean);

  // Apply filters
  const filteredEvents = timelineEvents.filter(evt => {
    // Significance filter
    if (significanceFilter !== 'all' && evt.significance.toLowerCase() !== significanceFilter.toLowerCase()) {
      return false;
    }

    // View mode filters
    if (viewMode === 'character' && selectedCharacter) {
      if (!evt.participants?.includes(selectedCharacter) && evt.title.toLowerCase().indexOf(selectedCharacter.toLowerCase()) === -1) {
        return false;
      }
    }

    if (viewMode === 'item' && selectedItem) {
      if (!evt.itemsExchanged?.includes(selectedItem) && evt.description.toLowerCase().indexOf(selectedItem.toLowerCase()) === -1) {
        return false;
      }
    }

    if (viewMode === 'location' && selectedLocation) {
      if (evt.location?.toLowerCase() !== selectedLocation.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between border-b border-[#232334] pb-4">
        <div>
          <h2 className="text-base font-bold text-white">Chronological Story Events</h2>
          <p className="text-xs text-[#8e8ea0]">Filter timeline events or manually insert new story milestones.</p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] transition-all shadow-purple shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      {timelineEvents.length === 0 ? (
        <div className="p-12 text-center bg-[#121218] border border-[#232334] rounded-xl text-[#8e8ea0] space-y-3">
          <Clock className="w-10 h-10 mx-auto text-[#7c3aed] opacity-50" />
          <h3 className="text-sm font-semibold text-white">No Timeline Events Recorded</h3>
          <p className="text-xs text-[#8e8ea0] max-w-sm mx-auto">
            Analyze chapters using AI Extraction or click below to manually add a story event.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] transition-all shadow-purple"
          >
            + Add First Timeline Event
          </button>
        </div>
      ) : (
        <>
          {/* Control Bar: View Switcher & Filters */}
          <div className="p-4 rounded-xl bg-[#121218] border border-[#232334] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              
              {/* View Mode Switcher */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#8e8ea0] uppercase tracking-wider">Timeline View:</span>
                {[
                  { id: 'global', label: 'Global Story', icon: Layers },
                  { id: 'character', label: 'Character Timeline', icon: User },
                  { id: 'item', label: 'Item Timeline', icon: Package },
                  { id: 'location', label: 'Location Timeline', icon: MapPin },
                ].map(v => {
                  const Icon = v.icon;
                  const isActive = viewMode === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        setViewMode(v.id as any);
                        if (v.id === 'character' && !selectedCharacter && allCharacters.length > 0) setSelectedCharacter(allCharacters[0]);
                        if (v.id === 'location' && !selectedLocation && allLocations.length > 0) setSelectedLocation(allLocations[0]);
                        if (v.id === 'item' && !selectedItem && allItems.length > 0) setSelectedItem(allItems[0]);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#7c3aed] text-white shadow-purple'
                          : 'bg-[#181820] text-[#8e8ea0] hover:text-white border border-[#232334]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {v.label}
                    </button>
                  );
                })}
              </div>

              {/* Significance Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#8e8ea0]" />
                <span className="text-xs font-bold text-[#8e8ea0]">Significance:</span>
                {['all', 'minor', 'major', 'climactic'].map(sig => (
                  <button
                    key={sig}
                    onClick={() => setSignificanceFilter(sig)}
                    className={`px-2.5 py-1 rounded-md uppercase font-bold text-[10px] transition-all ${
                      significanceFilter === sig
                        ? 'bg-[#7c3aed] text-white'
                        : 'bg-[#181820] text-[#8e8ea0] hover:text-white border border-[#232334]'
                    }`}
                  >
                    {sig}
                  </button>
                ))}
              </div>

            </div>

            {/* Dynamic Dropdown Selectors */}
            {viewMode === 'character' && (
              <div className="flex items-center gap-3 pt-2 border-t border-[#232334]">
                <span className="text-xs font-semibold text-white">Filter Character:</span>
                <select
                  value={selectedCharacter}
                  onChange={(e) => setSelectedCharacter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#181820] border border-[#232334] text-xs text-white"
                >
                  <option value="">All Characters</option>
                  {allCharacters.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            {viewMode === 'item' && (
              <div className="flex items-center gap-3 pt-2 border-t border-[#232334]">
                <span className="text-xs font-semibold text-white">Filter Item:</span>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#181820] border border-[#232334] text-xs text-white"
                >
                  <option value="">All Items</option>
                  {allItems.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            )}

            {viewMode === 'location' && (
              <div className="flex items-center gap-3 pt-2 border-t border-[#232334]">
                <span className="text-xs font-semibold text-white">Filter Location:</span>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#181820] border border-[#232334] text-xs text-white"
                >
                  <option value="">All Locations</option>
                  {allLocations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Main Timeline View */}
          <div className="relative py-4 px-2">
            <div className="absolute left-1/2 top-10 bottom-10 w-0.5 bg-gradient-to-b from-[#7c3aed] via-[#06b6d4] to-[#7c3aed] -translate-x-1/2 hidden md:block" />

            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8e8ea0] rounded-xl bg-[#121218] border border-[#232334]">
                No timeline events matching the current filter criteria.
              </div>
            ) : (
              <div className="space-y-8 relative">
                {filteredEvents.map((evt, idx) => {
                  const isEven = idx % 2 === 0;
                  const matchedChapter = chapters.find(c => c.id === evt.chapterId || c.chapterNumber === evt.chapterNumber);

                  return (
                    <div key={evt.id} className="relative flex flex-col md:flex-row items-center justify-between group">
                      
                      <div className={`w-full md:w-[45%] ${isEven ? 'md:pr-8 md:text-right' : 'md:order-2 md:pl-8 md:text-left'}`}>
                        
                        {evt.timePassedNote && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181820] border border-[#7c3aed]/40 text-[#a78bfa] text-xs font-semibold mb-3 shadow-purple">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{evt.timePassedNote}</span>
                          </div>
                        )}

                        <div className="p-5 rounded-xl bg-[#121218] border border-[#232334] group-hover:border-[#7c3aed]/50 transition-all shadow-lg">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#7c3aed]/20 text-[#a78bfa]">
                              Chapter {evt.chapterNumber}
                            </span>
                            <div className="flex items-center gap-2">
                              {evt.currentArc && (
                                <span className="text-[10px] font-semibold text-[#8e8ea0]">
                                  Arc: {evt.currentArc}
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteEvent(evt.id, evt.title)}
                                className="text-[#52526b] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                                title="Delete Event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h3 className="font-bold text-white text-base group-hover:text-[#a78bfa] transition-colors">
                            {evt.title}
                          </h3>

                          <p className="text-xs text-[#a1a1aa] mt-2 leading-relaxed">
                            {evt.description}
                          </p>

                          {(evt.location || (evt.participants && evt.participants.length > 0)) && (
                            <div className="flex flex-wrap gap-2 pt-3">
                              {evt.location && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                  <MapPin className="w-3 h-3" /> {evt.location}
                                </span>
                              )}
                              {evt.participants && evt.participants.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                  <User className="w-3 h-3" /> {evt.participants.join(', ')}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="mt-4 pt-3 border-t border-[#232334] flex items-center justify-between text-xs">
                            <span className="text-[11px] font-medium text-[#8e8ea0]">
                              Significance: <strong className="text-white">{evt.significance}</strong>
                            </span>

                            {matchedChapter && (
                              <Link
                                href={`/books/${bookId}/chapters?id=${matchedChapter.id}`}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#7c3aed] hover:text-[#a78bfa]"
                              >
                                Read Chapter <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#121218] border-2 border-[#7c3aed] flex items-center justify-center text-[#a78bfa] z-10 shadow-purple hidden md:flex group-hover:scale-125 transition-transform">
                        <Sparkles className="w-4 h-4 text-[#7c3aed]" />
                      </div>

                      <div className={`hidden md:block w-[45%] ${isEven ? 'order-2' : 'order-1'}`} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#121218] border border-[#232334] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#232334] bg-[#0c0c10] flex items-center justify-between">
              <h2 className="font-bold text-white text-base">Add New Timeline Event</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8e8ea0] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-semibold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                    Event Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Battle of Ironforge"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                    Chapter #
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(Number(e.target.value))}
                    className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                  Event Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of what occurred during this milestone event..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#181820] border border-[#232334] rounded-xl p-3 text-white focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Citadel Courtyard"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                    Significance
                  </label>
                  <select
                    value={significance}
                    onChange={(e) => setSignificance(e.target.value as any)}
                    className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="Minor">Minor</option>
                    <option value="Major">Major</option>
                    <option value="Climactic">Climactic</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                    Participants (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Isaac Carter, Sarah Vance"
                    value={participantsInput}
                    onChange={(e) => setParticipantsInput(e.target.value)}
                    className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                    Time Jump Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3 Months Later..."
                    value={timePassedNote}
                    onChange={(e) => setTimePassedNote(e.target.value)}
                    className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
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
                  Add Timeline Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
