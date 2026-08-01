'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { repository } from '@/lib/store/repository';
import { Character, Ability, Item, LocationEntity, Relationship } from '@/types';
import { GitBranch, Users, Shield, Package, MapPin, Sparkles, Filter } from 'lucide-react';
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

  useEffect(() => {
    repository.getCharacters(bookId).then(setCharacters);
    repository.getAbilities(bookId).then(setAbilities);
    repository.getItems(bookId).then(setItems);
    repository.getLocations(bookId).then(setLocations);
    repository.getRelationships(bookId).then(setRelationships);
  }, [bookId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <GitBranch className="w-6 h-6 text-[#7c3aed]" /> Interactive Canon Knowledge Graph
        </h1>
        <p className="text-xs text-[#8e8ea0] mt-1">
          Visually explore interconnected relationships, item ownership, ability mastery, and world locations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Graph Nodes Board */}
        <div className="lg:col-span-2 p-8 rounded-2xl bg-[#0c0c10] border border-[#232334] min-h-[500px] flex flex-col justify-center items-center relative overflow-hidden select-none">
          
          <div className="absolute top-4 left-4 text-xs font-mono text-[#8e8ea0] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> Dynamic Graph Canvas
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 max-w-xl">
            {/* Characters */}
            {characters.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedNode({ type: 'character', data: c })}
                className={`p-3 rounded-2xl border transition-all flex items-center gap-2 font-bold text-xs ${
                  selectedNode?.data?.id === c.id
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-purple scale-110'
                    : 'bg-[#181820] text-white border-[#7c3aed]/40 hover:border-[#7c3aed]'
                }`}
              >
                <Users className="w-4 h-4 text-[#a78bfa]" /> {c.name}
              </button>
            ))}

            {/* Abilities */}
            {abilities.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedNode({ type: 'ability', data: a })}
                className={`p-3 rounded-2xl border transition-all flex items-center gap-2 font-bold text-xs ${
                  selectedNode?.data?.id === a.id
                    ? 'bg-amber-500 text-black border-amber-500 shadow-amber scale-110'
                    : 'bg-[#181820] text-amber-300 border-amber-500/40 hover:border-amber-500'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-400" /> {a.name}
              </button>
            ))}

            {/* Items */}
            {items.map(i => (
              <button
                key={i.id}
                onClick={() => setSelectedNode({ type: 'item', data: i })}
                className={`p-3 rounded-2xl border transition-all flex items-center gap-2 font-bold text-xs ${
                  selectedNode?.data?.id === i.id
                    ? 'bg-cyan-500 text-black border-cyan-500 shadow-cyan scale-110'
                    : 'bg-[#181820] text-cyan-300 border-cyan-500/40 hover:border-cyan-500'
                }`}
              >
                <Package className="w-4 h-4 text-cyan-400" /> {i.name}
              </button>
            ))}

            {/* Locations */}
            {locations.map(l => (
              <button
                key={l.id}
                onClick={() => setSelectedNode({ type: 'location', data: l })}
                className={`p-3 rounded-2xl border transition-all flex items-center gap-2 font-bold text-xs ${
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

        {/* Selected Node Connections Panel */}
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
              {selectedNode.data.summary || selectedNode.data.description || 'No detailed description.'}
            </p>

            <div className="pt-2">
              <Link
                href={`/books/${bookId}/${selectedNode.type}s?id=${selectedNode.data.id}`}
                className="block text-center w-full py-2 rounded-xl bg-[#7c3aed] text-white font-bold hover:bg-[#6d28d9]"
              >
                Open Full {selectedNode.type} Profile →
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-[#121218] border border-[#232334] text-[#8e8ea0] text-xs">
            Click any node on the graph canvas to inspect connections.
          </div>
        )}

      </div>
    </div>
  );
}
