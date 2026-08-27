'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { repository } from '@/lib/store/repository';
import { Chapter, Character } from '@/types';
import { BookOpen, ChevronLeft, ChevronRight, Eye, Users } from 'lucide-react';
import { EntityHoverCard } from '@/components/common/EntityHoverCard';

export default function DistractionFreeReadPage() {
  const params = useParams();
  const bookId = (params?.bookId as string) || 'book-1';

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    repository.getChapters(bookId).then(cList => {
      setChapters(cList);
      if (cList.length > 0) setActiveIdx(0);
    });
    repository.getCharacters(bookId).then(setCharacters);
  }, [bookId]);

  if (chapters.length === 0) {
    return (
      <div className="p-12 text-center text-[#8e8ea0] text-xs">
        No chapters available to read. Write or create a chapter first.
      </div>
    );
  }

  const activeChap = chapters[activeIdx];

  // Helper to render text with interactive entity hover cards
  const renderInteractiveText = (text: string) => {
    let renderedText: React.ReactNode[] = [text];

    characters.forEach(char => {
      const nextRender: React.ReactNode[] = [];
      renderedText.forEach(chunk => {
        if (typeof chunk !== 'string') {
          nextRender.push(chunk);
          return;
        }

        const parts = chunk.split(new RegExp(`(${char.name})`, 'gi'));
        parts.forEach((part, pIdx) => {
          if (part.toLowerCase() === char.name.toLowerCase()) {
            nextRender.push(
              <EntityHoverCard
                key={`${char.id}-${pIdx}`}
                name={char.name}
                status={char.status}
                location={char.currentLocation}
                summary={char.summary}
              >
                {part}
              </EntityHoverCard>
            );
          } else {
            nextRender.push(part);
          }
        });
      });
      renderedText = nextRender;
    });

    return renderedText;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] p-6 md:p-12 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-3xl flex items-center justify-between border-b border-[#232334] pb-4 mb-8 text-xs">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-[#a78bfa]" />
          <h1 className="font-extrabold text-white text-base">
            Ch. {activeChap.chapterNumber}: {activeChap.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={activeIdx === 0}
            onClick={() => setActiveIdx(prev => Math.max(0, prev - 1))}
            className="p-2 rounded-xl bg-[#181820] border border-[#232334] text-white disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs text-[#8e8ea0]">
            {activeIdx + 1} / {chapters.length}
          </span>
          <button
            disabled={activeIdx === chapters.length - 1}
            onClick={() => setActiveIdx(prev => Math.min(chapters.length - 1, prev + 1))}
            className="p-2 rounded-xl bg-[#181820] border border-[#232334] text-white disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Manuscript Canvas */}
      <div className="w-full max-w-3xl space-y-6 font-serif text-lg leading-relaxed text-[#a1a1aa] selection:bg-amber-500/30">
        {activeChap.content ? (
          activeChap.content.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className="text-justify">
              {renderInteractiveText(paragraph)}
            </p>
          ))
        ) : (
          <p className="italic text-[#8e8ea0]">Chapter content is empty.</p>
        )}
      </div>
    </div>
  );
}
