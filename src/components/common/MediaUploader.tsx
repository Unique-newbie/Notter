'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Check, RefreshCw, AlertCircle, Trash2, Clipboard } from 'lucide-react';
import { compressAndResizeImage } from '@/lib/storage/imageManager';

interface MediaUploaderProps {
  currentUrl?: string;
  onImageSelected: (file: File) => Promise<string | void>;
  aspectRatioWidth?: number;
  aspectRatioHeight?: number;
  maxSizeBytes?: number;
  label?: string;
}

export function MediaUploader({
  currentUrl,
  onImageSelected,
  aspectRatioWidth = 600,
  aspectRatioHeight = 800,
  maxSizeBytes = 500 * 1024,
  label = 'Upload Image'
}: MediaUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentUrl);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewUrl(currentUrl);
  }, [currentUrl]);

  // Listen for Clipboard Paste (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) handleFile(file);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Selected file must be an image (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be smaller than 10MB.');
      return;
    }

    setError('');
    setPendingFile(file);

    // Create instant local preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    // Simulate progress bar & process upload
    setUploading(true);
    setProgress(15);

    try {
      const interval = setInterval(() => {
        setProgress((p) => (p < 85 ? p + 25 : p));
      }, 150);

      const finalUrl = await onImageSelected(file);
      clearInterval(interval);
      setProgress(100);

      if (finalUrl) setPreviewUrl(finalUrl);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Image upload failed. Retry?');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3 select-none">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group rounded-2xl border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#7c3aed] bg-[#7c3aed]/10'
            : error
            ? 'border-red-500/50 bg-red-500/5'
            : 'border-[#232334] bg-[#121218] hover:border-[#7c3aed]/50 hover:bg-[#181820]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="hidden"
        />

        {/* Preview Image or Upload Icon */}
        {previewUrl ? (
          <div className="relative mx-auto max-w-[200px] overflow-hidden rounded-xl border border-[#232334]">
            <img
              src={previewUrl}
              alt="Uploaded Preview"
              className="w-full h-auto object-cover max-h-48 rounded-xl"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity gap-1.5">
              <Upload className="w-4 h-4" /> Replace Image
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#1e1e2a] border border-[#232334] flex items-center justify-center text-[#a78bfa] mx-auto shadow-xl group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <div className="font-bold text-white text-xs">{label}</div>
            <div className="text-[11px] text-[#8e8ea0]">
              Drag &amp; Drop, click to browse, or paste image with <kbd className="font-mono bg-[#1e1e2a] px-1 py-0.5 rounded text-amber-300">Ctrl+V</kbd>
            </div>
          </div>
        )}

        {/* Progress Bar Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 space-y-3">
            <RefreshCw className="w-6 h-6 text-[#7c3aed] animate-spin" />
            <div className="w-full max-w-xs bg-[#181820] h-2 rounded-full overflow-hidden border border-[#232334]">
              <div
                className="bg-gradient-to-r from-[#7c3aed] to-cyan-400 h-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-mono text-xs font-bold text-white">Compressing &amp; Uploading {progress}%</span>
          </div>
        )}

        {/* Success Alert Overlay */}
        {success && (
          <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm rounded-2xl flex items-center justify-center text-emerald-300 font-extrabold text-xs gap-2">
            <Check className="w-5 h-5 text-emerald-400" /> Upload Complete!
          </div>
        )}
      </div>

      {/* Error & Retry Bar */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          {pendingFile && (
            <button
              onClick={() => handleFile(pendingFile)}
              className="px-2.5 py-1 rounded bg-red-500/20 text-white font-bold text-[10px] hover:bg-red-500/40"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
