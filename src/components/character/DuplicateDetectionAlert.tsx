import React from 'react';
import { Character } from '@/types';
import { AlertCircle, Merge } from 'lucide-react';

interface DuplicateDetectionAlertProps {
  duplicates: { char1: Character; char2: Character; confidence: number }[];
  handleInitiateMerge: (primary: Character, secondary: Character) => void;
}

export function DuplicateDetectionAlert({
  duplicates,
  handleInitiateMerge
}: DuplicateDetectionAlertProps) {
  if (!duplicates || duplicates.length === 0) return null;

  return (
    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
      <div className="flex items-center gap-2 font-bold text-xs">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>Automatic Duplicate Character Suggestions ({duplicates.length} detected)</span>
      </div>
      <div className="space-y-2 pt-1">
        {duplicates.map((dup, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#121218] border border-[#232334] text-xs">
            <div>
              <span className="font-bold text-white">&quot;{dup.char1.name}&quot;</span>
              <span className="text-[#8e8ea0] mx-2">matches</span>
              <span className="font-bold text-white">&quot;{dup.char2.name}&quot;</span>
              <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold">
                {dup.confidence}% similarity
              </span>
            </div>
            <button
              onClick={() => handleInitiateMerge(dup.char1, dup.char2)}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg"
            >
              <Merge className="w-3.5 h-3.5" /> Intelligent Merge
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
