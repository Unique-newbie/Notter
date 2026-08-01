'use client';

import React from 'react';
import { StructuredExtractionJSON } from '@/types';
import { GitPullRequest, Plus, Edit3, ArrowRight, Shield, Users, Package } from 'lucide-react';

interface CanonDiffReviewProps {
  extraction: StructuredExtractionJSON;
}

export function CanonDiffReview({ extraction }: CanonDiffReviewProps) {
  const chars = extraction.characters || [];
  const newChars = extraction.new_characters || [];

  return (
    <div className="space-y-4 text-xs font-sans">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/30 text-[#a78bfa] font-bold">
        <GitPullRequest className="w-4 h-4 text-amber-400" />
        <span>Canonical Pull Request Diff — Highlighting Exact Story State Updates</span>
      </div>

      {/* New Characters Added */}
      {newChars.length > 0 && (
        <div className="space-y-2">
          <div className="font-extrabold text-emerald-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> New Entities Introduced ({newChars.length})
          </div>
          {newChars.map((nc, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-white font-bold flex items-center justify-between">
              <div>
                <span>{nc.name}</span>
                <span className="text-[#8e8ea0] text-[11px] font-normal block mt-0.5">{nc.summary}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] uppercase bg-emerald-500/20 text-emerald-300 font-mono">
                + NEW ENTITY
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Character Progression & Attribute Shifts */}
      {chars.filter(c => c.progression_changes && c.progression_changes.length > 0).map((c, idx) => (
        <div key={idx} className="p-4 rounded-xl bg-[#181820] border border-[#232334] space-y-2">
          <div className="font-extrabold text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-[#a78bfa]" /> {c.name} — Attribute Updates
          </div>
          <div className="space-y-1.5 pt-1">
            {c.progression_changes?.map((p, pIdx) => (
              <div key={pIdx} className="p-2.5 rounded-lg bg-[#121218] border border-[#232334] flex items-center justify-between font-mono">
                <span className="text-amber-400 font-bold">{p.attribute}:</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="line-through text-red-400">{p.old_value}</span>
                  <ArrowRight className="w-3 h-3 text-[#8e8ea0]" />
                  <span className="text-emerald-400 font-bold">{p.new_value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
