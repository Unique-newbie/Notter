'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { repository } from '@/lib/store/repository';
import { Character, Ability, Item, LocationEntity, Relationship } from '@/types';
import { GitBranch, Users, Shield, Package, MapPin, Sparkles, Filter, ZoomIn, ZoomOut, RotateCcw, Eye, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CanonGraphPage() {
  const params = useParams();
  const bookId = (params?.bookId as string) || 'book-1';

  const [characters, setCharacters] = useState<Character[]>([]);
  const [abilities, setAbilities] = useState<Ability[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<LocationEntity[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  // Filters & Zoom State
  const [showChars, setShowChars] = useState(true);
  const [showAbilities, setShowAbilities] = useState(true);
  const [showItems, setShowItems] = useState(true);
  const [showLocations, setShowLocations] = useState(true);
  const [zoomScale, setZoomScale] = useState(1);

  useEffect(() => {
    repository.getCharacters(bookId).then(setCharacters);
    repository.getAbilities(bookId).then(setAbilities);
    repository.getItems(bookId).then(setItems);
    repository.getLocations(bookId).then(setLocations);
    repository.getRelationships(bookId).then(setRelationships);
  }, [bookId]);

  const handleZoomIn = () => setZoomScale(z => Math.min(1.5, z + 0.15));
  const handleZoomOut = () => setZoomScale(z => Math.max(0.6, z - 0.15));
  const handleResetZoom = () => setZoomScale(1);

  // Find related entities for selected node
  const getConnectedEntities = () => {
    if (!selectedNode) return [];
    const connected: { name: string; type: string; rel: string }[] = [];
    const name = selectedNode.data.name;

    if (selectedNode.type === 'character') {
      relationships.forEach(r => {
        if (r.character1Name === name) connected.push({ name: r.character2Name, type: 'Character', rel: r.relationType });
        if (r.character2Name === name) connected.push({ name: r.character1Name, type: 'Character', rel: r.relationType });
      });
      items.forEach(i => {
        if (i.ownerCharacterName === name) connected.push({ name: i.name, type: 'Item', rel: 'Owner of' });
      });
      abilities.forEach(a => {
        if (a.userCharacterNames?.includes(name)) connected.push({ name: a.name, type: 'Ability', rel: 'Practitioner of' });
      });
    }

    return connected;
  };

  const connectedList = getConnectedEntities();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <GitBranch className="w-6 h-6 text-[#7c3aed]" /> Redesigned Canon Knowledge Graph
          </h1>
          <p className="text-xs text-[#8e8ea0] mt-1">
            Explore canonical character relationships, item ownership, ability masteries, and location presence visually.
          </p>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#121218] border border-[#232334]">
          <button onClick={handleZoomOut} className="p-2 rounded-lg bg-[#181820] text-white hover:bg-[#232334]" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs text-[#a78bfa] px-2">{Math.round(zoomScale * 100)}%</span>
          <button onClick={handleZoomIn} className="p-2 rounded-lg bg-[#181820] text-white hover:bg-[#232334]" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleResetZoom} className="p-2 rounded-lg bg-[#181820] text-[#8e8ea0] hover:text-white" title="Reset View">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Toggle Toolbar */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#121218] border border-[#232334] text-xs">
        <span className="font-bold text-[#8e8ea0] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#7c3aed]" /> Filter Graph View:
        </span>
        <button
          onClick={() => setShowChars(c => !c)}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            showChars ? 'bg-[#7c3aed] text-white' : 'bg-[#181820] text-[#8e8ea0]'
          }`}
        >
          Characters ({characters.length})
        </button>
        <button
          onClick={() => setShowAbilities(a => !a)}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            showAbilities ? 'bg-amber-500 text-black' : 'bg-[#181820] text-[#8e8ea0]'
          }`}
        >
          Abilities ({abilities.length})
        </button>
        <button
          onClick={() => setShowItems(i => !i)}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            showItems ? 'bg-cyan-500 text-black' : 'bg-[#181820] text-[#8e8ea0]'
          }`}
        >
          Items ({items.length})
        </button>
        <button
          onClick={() => setShowLocations(l => !l)}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            showLocations ? 'bg-emerald-500 text-black' : 'bg-[#181820] text-[#8e8ea0]'
          }`}
        >
          Locations ({locations.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Canvas */}
        <div className="lg:col-span-2 p-8 rounded-2xl bg-[#0c0c10] border border-[#232334] min-h-[520px] flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute top-4 left-4 text-xs font-mono text-[#8e8ea0] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> Interactive Graph Canvas
          </div>

          <div
            className="flex flex-wrap items-center justify-center gap-4 max-w-2xl transition-transform duration-200"
            style={{ transform: `scale(${zoomScale})` }}
          >
            {/* Characters */}
            {showChars && characters.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedNode({ type: 'character', data: c })}
                className={`p-3.5 rounded-2xl border transition-all flex items-center gap-2 font-bold text-xs ${
                  selectedNode?.data?.id === c.id
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-purple scale-110'
                    : 'bg-[#181820] text-white border-[#7c3aed]/40 hover:border-[#7c3aed]'
                }`}
              >
                <Users className="w-4 h-4 text-[#a78bfa]" /> {c.name}
              </button>
            ))}

            {/* Abilities */}
            {showAbilities && abilities.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedNode({ type: 'ability', data: a })}
                className={`p-3.5 rounded-2xl border transition-all flex items-center gap-2 font-bold text-xs ${
                  selectedNode?.data?.id === a.id
                    ? 'bg-amber-500 text-black border-amber-500 shadow-amber scale-110'
                    : 'bg-[#181820] text-amber-300 border-amber-500/40 hover:border-amber-500'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-400" /> {a.name}
              </button>
            ))}

            {/* Items */}
            {showItems && items.map(i => (
              <button
                key={i.id}
                onClick={() => setSelectedNode({ type: 'item', data: i })}
                className={`p-3.5 rounded-2xl border transition-all flex items-center gap-2 font-bold text-xs ${
                  selectedNode?.data?.id === i.id
                    ? 'bg-cyan-500 text-black border-cyan-500 shadow-cyan scale-110'
                    : 'bg-[#181820] text-cyan-300 border-cyan-500/40 hover:border-cyan-500'
                }`}
              >
                <Package className="w-4 h-4 text-cyan-400" /> {i.name}
              </button>
            ))}

            {/* Locations */}
            {showLocations && locations.map(l => (
              <button
                key={l.id}
                onClick={() => setSelectedNode({ type: 'location', data: l })}
                className={`p-3.5 rounded-2xl border transition-all flex items-center gap-2 font-bold text-xs ${
                  selectedNode?.data?.id === l.id
                    ? 'bg-emerald-500 text-black border-emerald-500 shadow-emerald scale-110'
                    : 'bg-[#181820] text-emerald-300 border-emerald-500/40 hover:border-emerald-500'
                }`}
              >
                <MapPin className="w-4 h-4 text-emerald-400" /> {l.name}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Node Panel & Related Connections */}
        {selectedNode ? (
          <div className="p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#232334] pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-extrabold bg-[#7c3aed]/20 text-[#a78bfa]">
                  {selectedNode.type}
                </span>
                <h3 className="text-xl font-extrabold text-white mt-1">{selectedNode.data.name}</h3>
              </div>
            </div>

            <p className="text-[#a1a1aa] leading-relaxed">
              {selectedNode.data.summary || selectedNode.data.description || 'No detailed summary.'}
            </p>

            {/* Canonical Connection Links */}
            {connectedList.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#232334]">
                <h4 className="font-extrabold text-[#a78bfa] uppercase tracking-wider text-[10px]">
                  Connected Canonical Links ({connectedList.length})
                </h4>
                <div className="space-y-1.5">
                  {connectedList.map((c, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[#181820] border border-[#232334] flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-bold text-white">{c.name}</span>
                        <span className="text-[#8e8ea0] block text-[9px] uppercase font-mono">{c.type}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#232334] text-amber-300 font-bold text-[10px]">
                        {c.rel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <Link
                href={`/books/${bookId}/${selectedNode.type === 'ability' ? 'abilities' : selectedNode.type + 's'}?id=${selectedNode.data.id}`}
                className="block text-center w-full py-2.5 rounded-xl bg-[#7c3aed] text-white font-bold hover:bg-[#6d28d9] transition-all flex items-center justify-center gap-1.5"
              >
                <Eye className="w-4 h-4" /> Open Full Profile →
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-[#121218] border border-[#232334] text-[#8e8ea0] text-xs">
            Click any node on the graph canvas to inspect canonical relationships and connection links.
          </div>
        )}

      </div>
    </div>
  );
}
