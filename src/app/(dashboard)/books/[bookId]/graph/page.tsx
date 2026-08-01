'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { repository } from '@/lib/store/repository';
import { Character, Ability, Item, LocationEntity, Relationship } from '@/types';
import { GitBranch, Users, Shield, Package, MapPin, Sparkles, Filter, ZoomIn, ZoomOut, RotateCcw, Eye, Network } from 'lucide-react';
import Link from 'next/link';

interface MindNode {
  id: string;
  name: string;
  type: 'character' | 'ability' | 'item' | 'location';
  data: any;
  x: number;
  y: number;
}

interface MindEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  color: string;
}

export default function CanonGraphPage() {
  const params = useParams();
  const bookId = (params?.bookId as string) || 'book-1';

  const [characters, setCharacters] = useState<Character[]>([]);
  const [abilities, setAbilities] = useState<Ability[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<LocationEntity[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedNode, setSelectedNode] = useState<MindNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Filters & Zoom State
  const [showChars, setShowChars] = useState(true);
  const [showAbilities, setShowAbilities] = useState(true);
  const [showItems, setShowItems] = useState(true);
  const [showLocations, setShowLocations] = useState(true);
  const [zoomScale, setZoomScale] = useState(1);

  useEffect(() => {
    async function loadData() {
      await repository.cleanExistingDuplicates(bookId);
      const [c, a, i, l, r] = await Promise.all([
        repository.getCharacters(bookId),
        repository.getAbilities(bookId),
        repository.getItems(bookId),
        repository.getLocations(bookId),
        repository.getRelationships(bookId)
      ]);
      setCharacters(c);
      setAbilities(a);
      setItems(i);
      setLocations(l);
      setRelationships(r);
    }
    loadData();
  }, [bookId]);

  const handleZoomIn = () => setZoomScale(z => Math.min(1.8, z + 0.15));
  const handleZoomOut = () => setZoomScale(z => Math.max(0.5, z - 0.15));
  const handleResetZoom = () => setZoomScale(1);

  // Calculate Mind Map Radial / Cluster Layout
  const { nodes, edges } = useMemo(() => {
    const nodeList: MindNode[] = [];
    const edgeList: MindEdge[] = [];

    const charNodes: MindNode[] = showChars ? characters.map(c => ({ id: `char-${c.id}`, name: c.name, type: 'character', data: c, x: 0, y: 0 })) : [];
    const abilityNodes: MindNode[] = showAbilities ? abilities.map(a => ({ id: `abi-${a.id}`, name: a.name, type: 'ability', data: a, x: 0, y: 0 })) : [];
    const itemNodes: MindNode[] = showItems ? items.map(i => ({ id: `item-${i.id}`, name: i.name, type: 'item', data: i, x: 0, y: 0 })) : [];
    const locNodes: MindNode[] = showLocations ? locations.map(l => ({ id: `loc-${l.id}`, name: l.name, type: 'location', data: l, x: 0, y: 0 })) : [];

    const allNodes = [...charNodes, ...abilityNodes, ...itemNodes, ...locNodes];
    if (allNodes.length === 0) return { nodes: [], edges: [] };

    // Canvas Center
    const cx = 500;
    const cy = 350;

    // Distribute Character Nodes in Inner Ring
    const totalChars = charNodes.length || 1;
    charNodes.forEach((node, idx) => {
      const angle = (idx / totalChars) * 2 * Math.PI - Math.PI / 2;
      const radius = totalChars > 5 ? 180 : 130;
      node.x = cx + radius * Math.cos(angle);
      node.y = cy + radius * Math.sin(angle);
    });

    // Distribute Ability / Item / Location Nodes in Outer Cluster Rings around connected Characters
    const nonChars = [...abilityNodes, ...itemNodes, ...locNodes];
    nonChars.forEach((node, idx) => {
      // Find connected character if any
      let parentCharNode: MindNode | undefined;

      if (node.type === 'ability') {
        const userNames = node.data.userCharacterNames || [];
        parentCharNode = charNodes.find(cn => userNames.includes(cn.name));
      } else if (node.type === 'item') {
        parentCharNode = charNodes.find(cn => cn.name === node.data.ownerCharacterName);
      } else if (node.type === 'location') {
        parentCharNode = charNodes.find(cn => cn.data.currentLocation === node.name);
      }

      if (parentCharNode) {
        const offsetAngle = ((idx % 6) / 6) * 2 * Math.PI;
        node.x = parentCharNode.x + 110 * Math.cos(offsetAngle);
        node.y = parentCharNode.y + 110 * Math.sin(offsetAngle);
      } else {
        const angle = (idx / nonChars.length) * 2 * Math.PI;
        const radius = 320;
        node.x = cx + radius * Math.cos(angle);
        node.y = cy + radius * Math.sin(angle);
      }
    });

    nodeList.push(...allNodes);

    // Build Edges between Character <-> Character
    relationships.forEach(rel => {
      const source = charNodes.find(c => c.name === rel.character1Name);
      const target = charNodes.find(c => c.name === rel.character2Name);
      if (source && target) {
        edgeList.push({
          id: `rel-${rel.id}`,
          sourceId: source.id,
          targetId: target.id,
          label: rel.relationType,
          color: '#a78bfa'
        });
      }
    });

    // Build Edges between Character <-> Ability
    abilityNodes.forEach(ab => {
      const users = ab.data.userCharacterNames || [];
      users.forEach((userName: string) => {
        const source = charNodes.find(c => c.name === userName);
        if (source) {
          edgeList.push({
            id: `abi-edge-${ab.id}-${source.id}`,
            sourceId: source.id,
            targetId: ab.id,
            label: 'Uses Ability',
            color: '#f59e0b'
          });
        }
      });
    });

    // Build Edges between Character <-> Item
    itemNodes.forEach(item => {
      const owner = item.data.ownerCharacterName;
      if (owner) {
        const source = charNodes.find(c => c.name === owner);
        if (source) {
          edgeList.push({
            id: `item-edge-${item.id}-${source.id}`,
            sourceId: source.id,
            targetId: item.id,
            label: 'Owns Item',
            color: '#06b6d4'
          });
        }
      }
    });

    // Build Edges between Character <-> Location
    locNodes.forEach(loc => {
      charNodes.forEach(char => {
        if (char.data.currentLocation === loc.name) {
          edgeList.push({
            id: `loc-edge-${loc.id}-${char.id}`,
            sourceId: char.id,
            targetId: loc.id,
            label: 'Located At',
            color: '#10b981'
          });
        }
      });
    });

    return { nodes: nodeList, edges: edgeList };
  }, [characters, abilities, items, locations, relationships, showChars, showAbilities, showItems, showLocations]);

  // Connected nodes map for highlighting active selection
  const activeNodeId = hoveredNodeId || selectedNode?.id;
  const connectedEdgeIds = useMemo(() => {
    if (!activeNodeId) return new Set<string>();
    return new Set(
      edges.filter(e => e.sourceId === activeNodeId || e.targetId === activeNodeId).map(e => e.id)
    );
  }, [activeNodeId, edges]);

  const connectedNodeIds = useMemo(() => {
    if (!activeNodeId) return new Set<string>();
    const ids = new Set<string>([activeNodeId]);
    edges.forEach(e => {
      if (e.sourceId === activeNodeId) ids.add(e.targetId);
      if (e.targetId === activeNodeId) ids.add(e.sourceId);
    });
    return ids;
  }, [activeNodeId, edges]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'character': return '#7c3aed';
      case 'ability': return '#f59e0b';
      case 'item': return '#06b6d4';
      case 'location': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Network className="w-6 h-6 text-[#7c3aed]" /> Interactive Mind Map Knowledge Graph
          </h1>
          <p className="text-xs text-[#8e8ea0] mt-1">
            Visual mind map connecting characters, abilities, items, and locations with live node relationships.
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
          <Filter className="w-3.5 h-3.5 text-[#7c3aed]" /> Filter Mind Map:
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
        
        {/* Interactive SVG Mind Map Canvas */}
        <div className="lg:col-span-2 p-4 rounded-2xl bg-[#0c0c10] border border-[#232334] min-h-[560px] relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute top-4 left-4 text-xs font-mono text-[#8e8ea0] flex items-center gap-2 z-10">
            <Sparkles className="w-4 h-4 text-amber-400" /> Interactive Mind Map Canvas (Click node to inspect)
          </div>

          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-200"
            style={{ transform: `scale(${zoomScale})` }}
          >
            <svg viewBox="0 0 1000 700" className="w-full h-[540px]">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Render Mind Map Connection Edges */}
              {edges.map(edge => {
                const source = nodes.find(n => n.id === edge.sourceId);
                const target = nodes.find(n => n.id === edge.targetId);
                if (!source || !target) return null;

                const isHighlighted = connectedEdgeIds.has(edge.id);
                const strokeOpacity = activeNodeId ? (isHighlighted ? 1 : 0.15) : 0.4;
                const strokeWidth = isHighlighted ? 3 : 1.5;

                const midX = (source.x + target.x) / 2;
                const midY = (source.y + target.y) / 2;

                return (
                  <g key={edge.id}>
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={isHighlighted ? '#f59e0b' : edge.color}
                      strokeWidth={strokeWidth}
                      strokeOpacity={strokeOpacity}
                      strokeDasharray={isHighlighted ? 'none' : '4 4'}
                    />
                    <rect
                      x={midX - 35}
                      y={midY - 10}
                      width="70"
                      height="20"
                      rx="6"
                      fill="#0c0c10"
                      stroke={isHighlighted ? '#f59e0b' : '#232334'}
                      strokeWidth="1"
                      opacity={strokeOpacity}
                    />
                    <text
                      x={midX}
                      y={midY + 3}
                      fill={isHighlighted ? '#f59e0b' : '#8e8ea0'}
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      opacity={strokeOpacity}
                    >
                      {edge.label}
                    </text>
                  </g>
                );
              })}

              {/* Render Mind Map Nodes */}
              {nodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const isConnected = !activeNodeId || connectedNodeIds.has(node.id);
                const opacity = isConnected ? 1 : 0.25;
                const nodeColor = getNodeColor(node.type);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer transition-transform duration-200 hover:scale-110"
                    onClick={() => setSelectedNode(node)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    opacity={opacity}
                  >
                    <circle
                      r={node.type === 'character' ? 28 : 22}
                      fill="#121218"
                      stroke={isSelected ? '#ffffff' : nodeColor}
                      strokeWidth={isSelected ? 3.5 : 2}
                      filter={isSelected ? 'url(#glow)' : undefined}
                    />
                    <circle
                      r={node.type === 'character' ? 24 : 18}
                      fill={nodeColor}
                      fillOpacity="0.25"
                    />

                    {/* Node Text Label */}
                    <text
                      y={node.type === 'character' ? 42 : 36}
                      fill="#ffffff"
                      fontSize={node.type === 'character' ? '11' : '10'}
                      fontWeight="bold"
                      textAnchor="middle"
                      className="drop-shadow-md"
                    >
                      {node.name.length > 15 ? node.name.substring(0, 14) + '...' : node.name}
                    </text>
                    <text
                      y={node.type === 'character' ? 53 : 47}
                      fill={nodeColor}
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="uppercase tracking-wider font-mono"
                    >
                      {node.type}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Selected Node Details Sidebar */}
        {selectedNode ? (
          <div className="p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#232334] pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-extrabold bg-[#7c3aed]/20 text-[#a78bfa]">
                  {selectedNode.type}
                </span>
                <h3 className="text-xl font-extrabold text-white mt-1">{selectedNode.name}</h3>
              </div>
            </div>

            <p className="text-[#a1a1aa] leading-relaxed">
              {selectedNode.data.summary || selectedNode.data.description || 'No detailed summary recorded.'}
            </p>

            {/* Connected Nodes List */}
            <div className="space-y-2 pt-2 border-t border-[#232334]">
              <h4 className="font-extrabold text-[#a78bfa] uppercase tracking-wider text-[10px]">
                Connected Mind Map Nodes
              </h4>
              <div className="space-y-1.5">
                {edges.filter(e => e.sourceId === selectedNode.id || e.targetId === selectedNode.id).map((e, idx) => {
                  const otherId = e.sourceId === selectedNode.id ? e.targetId : e.sourceId;
                  const otherNode = nodes.find(n => n.id === otherId);
                  if (!otherNode) return null;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedNode(otherNode)}
                      className="p-2.5 rounded-xl bg-[#181820] border border-[#232334] hover:border-[#7c3aed] cursor-pointer flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <span className="font-bold text-white">{otherNode.name}</span>
                        <span className="text-[#8e8ea0] block text-[9px] uppercase font-mono">{otherNode.type}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#232334] text-amber-300 font-bold text-[10px]">
                        {e.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={`/books/${bookId}/${selectedNode.type === 'ability' ? 'abilities' : selectedNode.type + 's'}?id=${selectedNode.data.id}`}
                className="block text-center w-full py-2.5 rounded-xl bg-[#7c3aed] text-white font-bold hover:bg-[#6d28d9] transition-all flex items-center justify-center gap-1.5"
              >
                <Eye className="w-4 h-4" /> Open Full Codex Profile →
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#121218] border border-[#232334] flex flex-col items-center justify-center text-center text-[#8e8ea0] text-xs min-h-[300px]">
            <Network className="w-10 h-10 text-[#7c3aed]/40 mb-3" />
            <div className="font-bold text-white">Select a Mind Map Node</div>
            <div className="mt-1">Click any character, ability, item, or location node on the interactive SVG canvas to explore its connections.</div>
          </div>
        )}
      </div>
    </div>
  );
}
