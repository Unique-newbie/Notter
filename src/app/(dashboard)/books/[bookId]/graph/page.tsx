'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { repository } from '@/lib/store/repository';
import { Character, Ability, Item, LocationEntity, Relationship } from '@/types';
import {
  GitBranch, Users, Shield, Package, MapPin, Sparkles, Filter,
  ZoomIn, ZoomOut, RotateCcw, Eye, Network, Search, Maximize2, Minimize2, X
} from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');

  // Filters & Zoom State
  const [showChars, setShowChars] = useState(true);
  const [showAbilities, setShowAbilities] = useState(true);
  const [showItems, setShowItems] = useState(true);
  const [showLocations, setShowLocations] = useState(true);
  const [zoomScale, setZoomScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Pan State
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

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

  // Smooth Mouse Wheel Zooming
  const handleWheel = (e: React.WheelEvent) => {
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoomScale(z => Math.max(0.3, Math.min(3.0, z * zoomFactor)));
  };

  const handleZoomIn = () => setZoomScale(z => Math.min(3.0, z + 0.15));
  const handleZoomOut = () => setZoomScale(z => Math.max(0.3, z - 0.15));
  const handleResetZoom = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.id === 'graph-bg' || target.tagName === 'svg' || target.classList.contains('canvas-container')) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleBackgroundClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.id === 'graph-bg' || target.tagName === 'svg') {
      setSelectedNode(null);
    }
  };

  // Calculate Stable Mind Map Layout (Collision-Free, Non-overlapping Nodes)
  const { nodes, edges } = useMemo(() => {
    const nodeList: MindNode[] = [];
    const edgeList: MindEdge[] = [];

    const query = searchQuery.toLowerCase().trim();

    const charNodes: MindNode[] = showChars
      ? characters.filter(c => !query || c.name.toLowerCase().includes(query))
          .map(c => ({ id: `char-${c.id}`, name: c.name, type: 'character', data: c, x: 0, y: 0 }))
      : [];

    const abilityNodes: MindNode[] = showAbilities
      ? abilities.filter(a => !query || a.name.toLowerCase().includes(query))
          .map(a => ({ id: `abi-${a.id}`, name: a.name, type: 'ability', data: a, x: 0, y: 0 }))
      : [];

    const itemNodes: MindNode[] = showItems
      ? items.filter(i => !query || i.name.toLowerCase().includes(query))
          .map(i => ({ id: `item-${i.id}`, name: i.name, type: 'item', data: i, x: 0, y: 0 }))
      : [];

    const locNodes: MindNode[] = showLocations
      ? locations.filter(l => !query || l.name.toLowerCase().includes(query))
          .map(l => ({ id: `loc-${l.id}`, name: l.name, type: 'location', data: l, x: 0, y: 0 }))
      : [];

    const allNodes = [...charNodes, ...abilityNodes, ...itemNodes, ...locNodes];
    if (allNodes.length === 0) return { nodes: [], edges: [] };

    // Canvas Center Dimensions
    const cx = 800;
    const cy = 600;

    // Concentric Ring Positioning
    const totalChars = charNodes.length || 1;
    charNodes.forEach((node, idx) => {
      const angle = (idx / totalChars) * 2 * Math.PI - Math.PI / 2;
      const radius = Math.max(180, totalChars * 30);
      node.x = cx + radius * Math.cos(angle);
      node.y = cy + radius * Math.sin(angle);
    });

    const totalAbilities = abilityNodes.length || 1;
    abilityNodes.forEach((node, idx) => {
      const angle = (idx / totalAbilities) * 2 * Math.PI;
      const radius = Math.max(380, totalAbilities * 26);
      node.x = cx + radius * Math.cos(angle);
      node.y = cy + radius * Math.sin(angle);
    });

    const totalItems = itemNodes.length || 1;
    itemNodes.forEach((node, idx) => {
      const angle = (idx / totalItems) * 2 * Math.PI - Math.PI / 4;
      const radius = Math.max(560, totalItems * 26);
      node.x = cx + radius * Math.cos(angle);
      node.y = cy + radius * Math.sin(angle);
    });

    const totalLocs = locNodes.length || 1;
    locNodes.forEach((node, idx) => {
      const angle = (idx / totalLocs) * 2 * Math.PI + Math.PI / 6;
      const radius = Math.max(740, totalLocs * 24);
      node.x = cx + radius * Math.cos(angle);
      node.y = cy + radius * Math.sin(angle);
    });

    // Force Relaxation for Zero Node Collisions
    const minDistance = 150;
    for (let iter = 0; iter < 40; iter++) {
      for (let i = 0; i < allNodes.length; i++) {
        for (let j = i + 1; j < allNodes.length; j++) {
          const n1 = allNodes[i];
          const n2 = allNodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          if (dist < minDistance) {
            const overlap = (minDistance - dist) / 2;
            const nx = (dx / dist) * overlap;
            const ny = (dy / dist) * overlap;
            n1.x -= nx;
            n1.y -= ny;
            n2.x += nx;
            n2.y += ny;
          }
        }
      }
    }

    nodeList.push(...allNodes);

    // Build Character Relationships
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

    // Build Ability Links
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

    // Build Item Links
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

    // Build Location Links
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
  }, [characters, abilities, items, locations, relationships, showChars, showAbilities, showItems, showLocations, searchQuery]);

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
    <div className={`space-y-6 max-w-7xl mx-auto pb-12 select-none ${isFullscreen ? 'fixed inset-0 z-50 bg-[#09090b] max-w-none p-6 pb-6 overflow-hidden flex flex-col justify-between' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Network className="w-6 h-6 text-[#7c3aed]" /> Interactive Mind Map Knowledge Graph
          </h1>
          <p className="text-xs text-[#8e8ea0] mt-1">
            Smooth, collision-free mind map layout with active connection highlighting, pan/zoom, and fullscreen mode.
          </p>
        </div>

        {/* Zoom, Fullscreen & Reset Controls */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#121218] border border-[#232334]">
          <button onClick={handleZoomOut} className="p-2 rounded-lg bg-[#181820] text-white hover:bg-[#232334]" title="Zoom Out (or Scroll Wheel)">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs text-[#a78bfa] px-2">{Math.round(zoomScale * 100)}%</span>
          <button onClick={handleZoomIn} className="p-2 rounded-lg bg-[#181820] text-white hover:bg-[#232334]" title="Zoom In (or Scroll Wheel)">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleResetZoom} className="p-2 rounded-lg bg-[#181820] text-[#8e8ea0] hover:text-white" title="Reset View & Pan">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(f => !f)}
            className="p-2 rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-all ml-1 shadow-purple"
            title={isFullscreen ? 'Exit Full Screen' : 'Go Full Screen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mind Map Search & Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#121218] border border-[#232334] text-xs">
        <div className="flex items-center gap-3 overflow-x-auto">
          <span className="font-bold text-[#8e8ea0] uppercase tracking-wider text-[10px] flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#7c3aed]" /> Filter Nodes:
          </span>
          <button
            onClick={() => setShowChars(c => !c)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              showChars ? 'bg-[#7c3aed] text-white' : 'bg-[#181820] text-[#8e8ea0]'
            }`}
          >
            Characters ({characters.length})
          </button>
          <button
            onClick={() => setShowAbilities(a => !a)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              showAbilities ? 'bg-amber-500 text-black' : 'bg-[#181820] text-[#8e8ea0]'
            }`}
          >
            Abilities ({abilities.length})
          </button>
          <button
            onClick={() => setShowItems(i => !i)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              showItems ? 'bg-cyan-500 text-black' : 'bg-[#181820] text-[#8e8ea0]'
            }`}
          >
            Items ({items.length})
          </button>
          <button
            onClick={() => setShowLocations(l => !l)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              showLocations ? 'bg-emerald-500 text-black' : 'bg-[#181820] text-[#8e8ea0]'
            }`}
          >
            Locations ({locations.length})
          </button>
        </div>

        {/* Mind Map Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-[#8e8ea0] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mind map (e.g. Isaac, Sophia)..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#181820] border border-[#232334] text-white text-xs placeholder-[#52526b] focus:outline-none focus:border-[#7c3aed]"
          />
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${isFullscreen ? 'flex-1' : ''}`}>
        
        {/* Interactive SVG Mind Map Canvas */}
        <div
          className={`lg:col-span-2 p-4 rounded-2xl bg-[#0c0c10] border border-[#232334] min-h-[600px] relative overflow-hidden flex flex-col items-center justify-center cursor-grab active:cursor-grabbing canvas-container ${isFullscreen ? 'h-full' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onClick={handleBackgroundClick}
        >
          <div className="absolute top-4 left-4 text-xs font-mono text-[#8e8ea0] flex items-center gap-2 z-10 pointer-events-none">
            <Sparkles className="w-4 h-4 text-amber-400" /> Smooth Mind Map Canvas (Scroll to zoom • Drag to pan • Click empty space to unselect)
          </div>

          <div
            className="w-full h-full flex items-center justify-center pointer-events-auto"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`
            }}
          >
            <svg id="graph-bg" viewBox="0 0 1600 1200" className="w-full h-full min-h-[580px]">
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
                const strokeOpacity = activeNodeId ? (isHighlighted ? 1 : 0.1) : 0.4;
                const strokeWidth = isHighlighted ? 3.5 : 1.5;

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
                      x={midX - 40}
                      y={midY - 10}
                      width="80"
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

              {/* Render Stable Non-Flickering Mind Map Node Cards */}
              {nodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const isConnected = !activeNodeId || connectedNodeIds.has(node.id);
                const opacity = isConnected ? 1 : 0.2;
                const nodeColor = getNodeColor(node.type);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(prev => prev?.id === node.id ? null : node);
                    }}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    opacity={opacity}
                  >
                    {/* Bounding Card Box */}
                    <rect
                      x="-70"
                      y="-18"
                      width="140"
                      height="36"
                      rx="10"
                      fill="#121218"
                      stroke={isSelected ? '#ffffff' : nodeColor}
                      strokeWidth={isSelected ? 3 : 1.5}
                      filter={isSelected ? 'url(#glow)' : undefined}
                    />

                    {/* Left Color Pill Indicator */}
                    <circle
                      cx="-52"
                      cy="0"
                      r="9"
                      fill={nodeColor}
                    />

                    {/* Node Name Label Inside Bounding Box */}
                    <text
                      x="-36"
                      y="4"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="start"
                    >
                      {node.name.length > 13 ? node.name.substring(0, 12) + '…' : node.name}
                    </text>

                    {/* Node Type Badge */}
                    <text
                      x="58"
                      y="4"
                      fill={nodeColor}
                      fontSize="7"
                      fontWeight="bold"
                      textAnchor="end"
                      className="uppercase font-mono"
                    >
                      {node.type.substring(0, 4)}
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

              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg text-[#8e8ea0] hover:text-white"
                title="Unselect / Close Inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[#a1a1aa] leading-relaxed">
              {selectedNode.data.summary || selectedNode.data.description || 'No detailed summary recorded.'}
            </p>

            {/* Connected Nodes List */}
            <div className="space-y-2 pt-2 border-t border-[#232334]">
              <h4 className="font-extrabold text-[#a78bfa] uppercase tracking-wider text-[10px]">
                Connected Mind Map Nodes
              </h4>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
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
