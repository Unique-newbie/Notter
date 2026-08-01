'use client';

import React, { useState } from 'react';
import { User, MapPin, Zap, Shield, Sparkles } from 'lucide-react';

interface EntityHoverCardProps {
  name: string;
  type?: 'character' | 'ability' | 'item' | 'location';
  status?: string;
  location?: string;
  rankOrLevel?: string | number;
  summary?: string;
  children: React.ReactNode;
}

export function EntityHoverCard({
  name,
  type = 'character',
  status = 'Active',
  location,
  rankOrLevel,
  summary,
  children
}: EntityHoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="cursor-pointer font-bold text-[#a78bfa] hover:underline decoration-amber-400">
        {children}
      </span>

      {isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-4 rounded-xl bg-[#0c0c10] border border-[#7c3aed]/40 shadow-2xl z-50 animate-in fade-in zoom-in-95 text-xs select-none">
          <div className="flex items-center gap-3 border-b border-[#232334] pb-2">
            <div className="w-9 h-9 rounded-lg bg-[#7c3aed]/20 border border-[#7c3aed]/40 flex items-center justify-center text-white font-extrabold text-sm">
              {name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-extrabold text-white text-sm">{name}</div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-emerald-400 font-bold uppercase">{status}</span>
                {rankOrLevel && <span className="text-amber-400 font-mono">Lv.{rankOrLevel}</span>}
              </div>
            </div>
          </div>

          {location && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#8e8ea0] mt-2">
              <MapPin className="w-3 h-3 text-[#06b6d4]" />
              <span>Location: <strong className="text-white">{location}</strong></span>
            </div>
          )}

          {summary && (
            <p className="text-[11px] text-[#a1a1aa] line-clamp-2 mt-2 leading-relaxed">
              {summary}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
