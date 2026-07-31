'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  itemTitle?: string;
  description: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  title,
  itemTitle,
  description,
  onConfirm,
  onClose,
  isDeleting = false
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#121218] border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-5">
        
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-white text-base">{title}</h3>
            {itemTitle && (
              <div className="font-mono text-xs font-bold text-amber-300">
                &ldquo;{itemTitle}&rdquo;
              </div>
            )}
            <p className="text-xs text-[#8e8ea0] leading-relaxed pt-1">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#232334]">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-[#181820] border border-[#232334] text-[#a1a1aa] font-bold text-xs hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-xl transition-all disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" /> {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>

      </div>
    </div>
  );
}
