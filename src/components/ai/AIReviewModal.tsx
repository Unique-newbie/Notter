'use client';

import React, { useState, useEffect } from 'react';
import { StructuredExtractionJSON, AIExtraction } from '@/types';
import {
  CheckCircle2, XCircle, Edit3, AlertTriangle, Sparkles, User,
  Shield, Package, MapPin, Calendar, FileText, Bookmark, MessageSquare,
  Users, GitCommit, CheckSquare, Square, Filter
} from 'lucide-react';
import { repository } from '@/lib/store/repository';

interface AIReviewModalProps {
  isOpen: boolean;
  extractionDraft: AIExtraction | null;
  onClose: () => void;
  onApproved: () => void;
}

export function AIReviewModal({ isOpen, extractionDraft, onClose, onApproved }: AIReviewModalProps) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<StructuredExtractionJSON | null>(null);

  // Initialize selectedKeys with all items when extractionDraft changes
  useEffect(() => {
    if (!extractionDraft) return;
    const data = extractionDraft.extraction;
    const keys = new Set<string>();

    const allChars = [...(data.characters || []), ...(data.new_characters || [])];
    allChars.forEach((c, i) => keys.add(`char-${c.name}-${i}`));
    (data.events || []).forEach((e, i) => keys.add(`ev-${e.title}-${i}`));
    (data.abilities || []).forEach((a, i) => keys.add(`ab-${a.name}-${i}`));
    (data.items || []).forEach((it, i) => keys.add(`item-${it.name}-${i}`));
    (data.locations || []).forEach((l, i) => keys.add(`loc-${l.name}-${i}`));
    (data.organizations || []).forEach((o, i) => keys.add(`org-${o.name}-${i}`));
    (data.relationship_changes || []).forEach((r, i) => keys.add(`rel-${r.character1}-${r.character2}-${i}`));
    (data.dialogue_facts || []).forEach((d, i) => keys.add(`df-${d.speaker}-${i}`));
    (data.plot_threads || []).forEach((p, i) => keys.add(`plot-${p.title}-${i}`));
    (data.foreshadowing || []).forEach((f, i) => keys.add(`fore-${f.clueDescription}-${i}`));

    setSelectedKeys(keys);
    setEditedData(null);
  }, [extractionDraft]);

  if (!isOpen || !extractionDraft) return null;

  const data: StructuredExtractionJSON = editedData || extractionDraft.extraction;

  const toggleKey = (key: string) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedKeys(next);
  };

  const selectAll = () => {
    const keys = new Set<string>();
    const allChars = [...(data.characters || []), ...(data.new_characters || [])];
    allChars.forEach((c, i) => keys.add(`char-${c.name}-${i}`));
    (data.events || []).forEach((e, i) => keys.add(`ev-${e.title}-${i}`));
    (data.abilities || []).forEach((a, i) => keys.add(`ab-${a.name}-${i}`));
    (data.items || []).forEach((it, i) => keys.add(`item-${it.name}-${i}`));
    (data.locations || []).forEach((l, i) => keys.add(`loc-${l.name}-${i}`));
    (data.organizations || []).forEach((o, i) => keys.add(`org-${o.name}-${i}`));
    (data.relationship_changes || []).forEach((r, i) => keys.add(`rel-${r.character1}-${r.character2}-${i}`));
    (data.dialogue_facts || []).forEach((d, i) => keys.add(`df-${d.speaker}-${i}`));
    (data.plot_threads || []).forEach((p, i) => keys.add(`plot-${p.title}-${i}`));
    (data.foreshadowing || []).forEach((f, i) => keys.add(`fore-${f.clueDescription}-${i}`));
    setSelectedKeys(keys);
  };

  const deselectAll = () => {
    setSelectedKeys(new Set());
  };

  const handleApproveSelected = () => {
    const approvedKeysArray = Array.from(selectedKeys);
    repository.approveExtractionGranular(extractionDraft.id, approvedKeysArray, editedData || undefined);
    onApproved();
    onClose();
  };

  const handleRejectAll = () => {
    repository.rejectExtraction(extractionDraft.id);
    onClose();
  };

  // Compile list of PR change items
  const changeItems: { key: string; category: string; icon: any; color: string; title: string; subtitle?: string; details: any }[] = [];

  const allChars = [...(data.characters || []), ...(data.new_characters || [])];
  allChars.forEach((c, i) => {
    changeItems.push({
      key: `char-${c.name}-${i}`,
      category: 'character',
      icon: User,
      color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
      title: `Character: ${c.name}`,
      subtitle: c.status ? `Status: ${c.status}` : 'Active',
      details: c
    });
  });

  (data.events || []).forEach((e, i) => {
    changeItems.push({
      key: `ev-${e.title}-${i}`,
      category: 'event',
      icon: Calendar,
      color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
      title: `Event: ${e.title}`,
      subtitle: `Significance: ${e.significance || 'Major'}`,
      details: e
    });
  });

  (data.dialogue_facts || []).forEach((d, i) => {
    changeItems.push({
      key: `df-${d.speaker}-${i}`,
      category: 'dialogue',
      icon: MessageSquare,
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      title: `Dialogue Fact (${d.type}): ${d.speaker}${d.recipient ? ` → ${d.recipient}` : ''}`,
      subtitle: d.fact,
      details: d
    });
  });

  (data.items || []).forEach((it, i) => {
    changeItems.push({
      key: `item-${it.name}-${i}`,
      category: 'item',
      icon: Package,
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      title: `Item: ${it.name}`,
      subtitle: `Owner: ${it.owner || 'Unowned'} | Status: ${it.status || 'Active'}`,
      details: it
    });
  });

  (data.locations || []).forEach((l, i) => {
    changeItems.push({
      key: `loc-${l.name}-${i}`,
      category: 'location',
      icon: MapPin,
      color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
      title: `Location: ${l.name}`,
      subtitle: l.summary,
      details: l
    });
  });

  (data.abilities || []).forEach((a, i) => {
    changeItems.push({
      key: `ab-${a.name}-${i}`,
      category: 'ability',
      icon: Shield,
      color: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
      title: `Ability: ${a.name}`,
      subtitle: `Users: ${(a.users || []).join(', ') || 'None'}`,
      details: a
    });
  });

  (data.relationship_changes || []).forEach((r, i) => {
    changeItems.push({
      key: `rel-${r.character1}-${r.character2}-${i}`,
      category: 'relationship',
      icon: Users,
      color: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
      title: `Relationship: ${r.character1} ↔ ${r.character2}`,
      subtitle: `${r.relationType}: ${r.description}`,
      details: r
    });
  });

  (data.organizations || []).forEach((o, i) => {
    changeItems.push({
      key: `org-${o.name}-${i}`,
      category: 'organization',
      icon: Users,
      color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
      title: `Organization: ${o.name}`,
      subtitle: o.description,
      details: o
    });
  });

  (data.plot_threads || []).forEach((p, i) => {
    changeItems.push({
      key: `plot-${p.title}-${i}`,
      category: 'plot',
      icon: Bookmark,
      color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
      title: `Plot Thread: ${p.title}`,
      subtitle: p.description,
      details: p
    });
  });

  (data.foreshadowing || []).forEach((f, i) => {
    changeItems.push({
      key: `fore-${f.clueDescription}-${i}`,
      category: 'foreshadowing',
      icon: AlertTriangle,
      color: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
      title: `Foreshadowing: ${f.clueDescription}`,
      subtitle: f.payoffTarget ? `Target: ${f.payoffTarget}` : 'Clue observed',
      details: f
    });
  });

  const filteredItems = filterType === 'all'
    ? changeItems
    : changeItems.filter(item => item.category === filterType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-5xl h-[92vh] bg-[#121218] border border-[#232334] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* PR Header Bar */}
        <div className="px-6 py-4 border-b border-[#232334] bg-[#0c0c10] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/20 border border-[#7c3aed]/40 flex items-center justify-center text-[#a78bfa]">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base flex items-center gap-2.5">
                Pull Request Review: Extraction Receipt
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/30">
                  {changeItems.length} Proposed Changes
                </span>
              </h2>
              <p className="text-xs text-[#8e8ea0] mt-0.5">
                Review proposed database changes below. Check the items you want to commit into your Story Bible.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isEditing
                  ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                  : 'bg-[#181820] text-[#a1a1aa] border-[#232334] hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? 'Editing Mode' : 'Edit Raw JSON'}
            </button>
          </div>
        </div>

        {/* Controls Bar: Filter & Select All / Deselect All */}
        <div className="px-6 py-2.5 bg-[#09090b] border-b border-[#232334] flex items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#8e8ea0]" />
            <span className="text-[#8e8ea0] font-semibold">Filter:</span>
            {['all', 'character', 'event', 'dialogue', 'item', 'location', 'ability', 'relationship'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterType(cat)}
                className={`px-2.5 py-1 rounded-lg uppercase font-bold text-[10px] transition-all ${
                  filterType === cat
                    ? 'bg-[#7c3aed] text-white'
                    : 'bg-[#181820] text-[#8e8ea0] hover:text-white border border-[#232334]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 font-semibold">
            <button
              onClick={selectAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#181820] border border-[#232334] text-[#a78bfa] hover:bg-[#7c3aed]/20 transition-all text-[11px]"
            >
              <CheckSquare className="w-3.5 h-3.5" /> Select All ({changeItems.length})
            </button>
            <button
              onClick={deselectAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#181820] border border-[#232334] text-[#8e8ea0] hover:text-white transition-all text-[11px]"
            >
              <Square className="w-3.5 h-3.5" /> Deselect All
            </button>
          </div>
        </div>

        {/* Warnings Banner if any */}
        {data.warnings && data.warnings.length > 0 && (
          <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <div className="flex-1">
              <strong>Extraction Note:</strong> {data.warnings.join(' | ')}
            </div>
          </div>
        )}

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">

          {/* Raw JSON Editor if enabled */}
          {isEditing ? (
            <div className="space-y-3 h-full flex flex-col">
              <h3 className="font-bold text-white text-sm">Edit Raw Extraction Data</h3>
              <textarea
                value={JSON.stringify(data, null, 2)}
                onChange={(e) => {
                  try {
                    const p = JSON.parse(e.target.value);
                    setEditedData(p);
                  } catch (err) {}
                }}
                className="w-full flex-1 min-h-[400px] bg-[#181820] border border-[#232334] rounded-xl p-4 text-emerald-400 font-mono text-xs focus:outline-none focus:border-[#7c3aed]"
              />
            </div>
          ) : (
            <>
              {/* Summary Receipt Banner */}
              <div className="p-4 rounded-xl bg-[#181820] border border-[#232334] space-y-1.5">
                <div className="flex items-center justify-between text-[#a78bfa] font-bold uppercase text-[10px] tracking-wider">
                  <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Chapter Summary Receipt</span>
                  {data.timeline?.time_passed && (
                    <span className="text-[#8e8ea0] font-mono normal-case">Time elapsed: {data.timeline.time_passed}</span>
                  )}
                </div>
                <p className="text-[#a1a1aa] leading-relaxed">{data.summary || 'No summary extracted.'}</p>
              </div>

              {/* Proposed Change Cards */}
              <div className="space-y-3">
                {filteredItems.length === 0 ? (
                  <div className="p-8 text-center text-[#8e8ea0] rounded-xl bg-[#181820]/40 border border-[#232334]">
                    No change items matching category filter &quot;{filterType}&quot;.
                  </div>
                ) : (
                  filteredItems.map(item => {
                    const isChecked = selectedKeys.has(item.key);
                    const Icon = item.icon;
                    const c = item.details;

                    return (
                      <div
                        key={item.key}
                        onClick={() => toggleKey(item.key)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                          isChecked
                            ? 'bg-[#181820] border-[#7c3aed]/60 shadow-purple'
                            : 'bg-[#121218]/60 border-[#232334] opacity-60 hover:opacity-100 hover:border-[#7c3aed]/30'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className="pt-0.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleKey(item.key)}
                            className="w-4 h-4 rounded border-[#232334] bg-[#0c0c10] text-[#7c3aed] focus:ring-0 cursor-pointer"
                          />
                        </div>

                        {/* Category Icon Badge */}
                        <div className={`p-2 rounded-lg border ${item.color} shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-white text-sm">{item.title}</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-[#0c0c10] text-[#8e8ea0] border border-[#232334]">
                              {item.category}
                            </span>
                          </div>

                          <p className="text-[#a1a1aa]">{item.subtitle}</p>

                          {/* Render detailed metadata chips if character */}
                          {item.category === 'character' && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {c.emotional_state && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                  Mood: {c.emotional_state}
                                </span>
                              )}
                              {c.physical_injuries && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-300 border border-red-500/20">
                                  Injuries: {c.physical_injuries}
                                </span>
                              )}
                              {c.clothing && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                  Clothing: {c.clothing}
                                </span>
                              )}
                              {c.goals && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                  Goal: {c.goals}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Render dialogue details */}
                          {item.category === 'dialogue' && (
                            <p className="text-amber-300 font-mono text-[11px] bg-amber-500/5 p-2 rounded border border-amber-500/20 mt-1">
                              &quot;{c.fact}&quot;
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

        </div>

        {/* Footer Actions Bar */}
        <div className="px-6 py-4 border-t border-[#232334] bg-[#0c0c10] flex items-center justify-between">
          <button
            onClick={handleRejectAll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-all"
          >
            <XCircle className="w-4 h-4" /> Reject All Changes
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#181820] border border-[#232334] text-[#a1a1aa] hover:text-white text-xs font-semibold transition-all"
            >
              Cancel
            </button>

            <button
              onClick={handleApproveSelected}
              disabled={selectedKeys.size === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7c3aed] text-white hover:bg-[#6d28d9] shadow-purple text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" /> Commit Selected Changes ({selectedKeys.size} / {changeItems.length})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
