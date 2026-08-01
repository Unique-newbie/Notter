import React from 'react';
import { FileJson, X, Copy, Eye, CheckSquare } from 'lucide-react';

/**
 * Props for the ImportJsonModal component.
 */
export interface ImportJsonModalProps {
  isOpen: boolean;
  rawJsonInput: string;
  setRawJsonInput: (input: string) => void;
  onClose: () => void;
  onCopyFullPrompt: () => void;
  onImportRawJson: (directApprove: boolean) => void;
}

/**
 * Modal to manually import raw JSON extracted from an external AI.
 */
export function ImportJsonModal({
  isOpen,
  rawJsonInput,
  setRawJsonInput,
  onClose,
  onCopyFullPrompt,
  onImportRawJson,
}: ImportJsonModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-[#121218] border border-[#232334] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-[#232334] bg-[#0c0c10] flex items-center justify-between">
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <FileJson className="w-5 h-5 text-[#06b6d4]" /> Import Raw Extracted JSON
          </h2>
          <button onClick={onClose} className="text-[#8e8ea0] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-[#a1a1aa] leading-relaxed">
            Paste JSON extracted manually from Gemini Web, ChatGPT, or Claude. Click <strong>Directly Approve & Save</strong> to instantly create entities and mark as Analyzed!
          </p>

          <textarea
            rows={10}
            placeholder='Paste raw JSON here e.g. { "summary": "...", "characters": [] }'
            value={rawJsonInput}
            onChange={(e) => setRawJsonInput(e.target.value)}
            className="w-full bg-[#181820] border border-[#232334] rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-[#06b6d4]"
          />

          <div className="flex items-center justify-between pt-2 border-t border-[#232334]">
            <button
              type="button"
              onClick={onCopyFullPrompt}
              className="flex items-center gap-1.5 text-xs text-[#a78bfa] hover:underline"
            >
              <Copy className="w-3.5 h-3.5" /> Copy System Prompt + Chapter Text
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onImportRawJson(false)}
                disabled={!rawJsonInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-[#181820] border border-[#232334] text-[#a1a1aa] hover:text-white font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <Eye className="w-3.5 h-3.5" /> Review First
              </button>
              <button
                type="button"
                onClick={() => onImportRawJson(true)}
                disabled={!rawJsonInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7c3aed] text-white font-bold hover:bg-[#6d28d9] shadow-purple disabled:opacity-50"
              >
                <CheckSquare className="w-4 h-4" /> Directly Approve & Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
