'use client';

import React, { useState } from 'react';
import { Shield, Plus, Users, Flame, Search, CheckCircle2, Sparkles, X } from 'lucide-react';
import { communityStore } from '@/lib/store/communityStore';
import { Guild } from '@/types';

export default function GuildsPage() {
  const [guilds, setGuilds] = useState<Guild[]>(() => communityStore.getGuilds());
  const [query, setQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Guild Form State
  const [newGuildName, setNewGuildName] = useState('');
  const [newGuildTag, setNewGuildTag] = useState('');
  const [newGuildGenre, setNewGuildGenre] = useState('Fantasy');
  const [newGuildDesc, setNewGuildDesc] = useState('');
  const [toast, setToast] = useState('');

  const handleToggleGuild = (gId: string) => {
    const updated = communityStore.toggleJoinGuild(gId);
    setGuilds(updated);
  };

  const handleCreateGuild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuildName || !newGuildTag) return;

    const newG: Guild = {
      id: `guild-${Date.now()}`,
      name: newGuildName.trim(),
      tag: newGuildTag.trim().toUpperCase(),
      description: newGuildDesc.trim() || 'Author guild community.',
      genre: newGuildGenre,
      icon: '🛡️',
      memberCount: 1,
      totalWordsWritten: 0,
      weeklyGoalWords: 250000,
      isJoined: true,
      leaderUsername: 'author_notter',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setGuilds([newG, ...guilds]);
    setShowCreateModal(false);
    setToast(`Guild "[${newG.tag}] ${newG.name}" created successfully!`);
    setTimeout(() => setToast(''), 3500);

    setNewGuildName('');
    setNewGuildTag('');
    setNewGuildDesc('');
  };

  const filtered = guilds.filter(g =>
    g.name.toLowerCase().includes(query.toLowerCase()) ||
    g.genre.toLowerCase().includes(query.toLowerCase()) ||
    g.tag.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl bg-[#7c3aed] text-white text-xs font-bold shadow-2xl animate-in fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#232334] pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-cyan-400" /> Writing Guilds Directory
          </h1>
          <p className="text-xs text-[#8e8ea0] mt-1">
            Join genre-specific writing guilds to collaborate, compare weekly goals, and participate in guild sprints.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] shadow-purple transition-all"
        >
          <Plus className="w-4 h-4" /> Create New Guild
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-[#7c3aed] absolute left-3.5 top-3" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search guilds by name, genre, or tag..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#121218] border border-[#232334] text-white text-xs placeholder-[#52526b] focus:outline-none focus:border-[#7c3aed]"
        />
      </div>

      {/* Guild Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((g) => (
          <div
            key={g.id}
            className={`p-6 rounded-2xl border space-y-4 transition-all shadow-xl ${
              g.isJoined ? 'bg-[#181820] border-cyan-500/40' : 'bg-[#121218] border-[#232334] hover:border-[#7c3aed]/40'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-3 rounded-2xl bg-[#0c0c10] border border-[#232334]">{g.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-white text-base">{g.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      [{g.tag}]
                    </span>
                  </div>
                  <div className="text-[10px] text-[#8e8ea0] font-mono">Genre: {g.genre} • Led by @{g.leaderUsername}</div>
                </div>
              </div>

              <button
                onClick={() => handleToggleGuild(g.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  g.isJoined
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-[#181820] border border-[#232334] text-white hover:bg-[#7c3aed] shadow-purple'
                }`}
              >
                {g.isJoined ? 'Member ✅' : 'Join Guild'}
              </button>
            </div>

            <p className="text-xs text-[#a1a1aa] leading-relaxed line-clamp-2">{g.description}</p>

            <div className="pt-3 border-t border-[#232334] flex items-center justify-between text-xs font-mono text-[#8e8ea0]">
              <span>Members: <strong className="text-white">{g.memberCount.toLocaleString()}</strong></span>
              <span>Guild Words: <strong className="text-amber-400">{(g.totalWordsWritten / 1000000).toFixed(1)}M</strong></span>
              <span>Weekly Goal: <strong className="text-cyan-300">{(g.weeklyGoalWords / 1000).toFixed(0)}k</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Guild Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <form onSubmit={handleCreateGuild} className="w-full max-w-lg bg-[#121218] border border-[#232334] rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#232334] pb-3">
              <h3 className="font-bold text-white text-base">Create Writing Guild</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-[#8e8ea0] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="col-span-2 space-y-1">
                <label className="font-bold text-[#8e8ea0] uppercase text-[10px]">Guild Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Epic Worldbuilders"
                  value={newGuildName}
                  onChange={(e) => setNewGuildName(e.target.value)}
                  className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#8e8ea0] uppercase text-[10px]">Tag (2-5 letters)</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  placeholder="EPIC"
                  value={newGuildTag}
                  onChange={(e) => setNewGuildTag(e.target.value)}
                  className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2 text-white uppercase font-mono"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-[#8e8ea0] uppercase text-[10px]">Primary Genre</label>
              <select
                value={newGuildGenre}
                onChange={(e) => setNewGuildGenre(e.target.value)}
                className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2 text-white"
              >
                <option value="Fantasy">Fantasy</option>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="LitRPG / Progression">LitRPG / Progression</option>
                <option value="Romance">Romance</option>
                <option value="Mystery / Thriller">Mystery / Thriller</option>
              </select>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-[#8e8ea0] uppercase text-[10px]">Guild Description</label>
              <textarea
                rows={3}
                placeholder="Describe your guild's focus..."
                value={newGuildDesc}
                onChange={(e) => setNewGuildDesc(e.target.value)}
                className="w-full bg-[#181820] border border-[#232334] rounded-xl p-3 text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-[#181820] text-[#a1a1aa] font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] shadow-purple"
              >
                Create Guild
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
