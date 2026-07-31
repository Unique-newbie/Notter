'use client';

import React, { useState } from 'react';
import { Sparkles, X, Search, BookOpen, CheckCircle2 } from 'lucide-react';
import { repository } from '@/lib/store/repository';
import Link from 'next/link';

interface StoryBibleAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBookId?: string;
}

export function StoryBibleAIModal({ isOpen, onClose, activeBookId }: StoryBibleAIModalProps) {
  const [query, setQuery] = useState('');
  const [answering, setAnswering] = useState(false);
  const [answerResult, setAnswerResult] = useState<{
    answer: string;
    referencedChapters: { id: string; chapterNumber: number; title: string }[];
    matchingEntities: { name: string; type: string }[];
  } | null>(null);

  if (!isOpen) return null;

  const handleAskQuestion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setAnswering(true);
    setAnswerResult(null);

    const books = await repository.getBooks();
    const bookId = activeBookId || (books.length > 0 ? books[0].id : 'book-1');

    const q = query.toLowerCase().trim();
    const chapters = await repository.getChapters(bookId);
    const characters = await repository.getCharacters(bookId);
    const items = await repository.getItems(bookId);
    const events = await repository.getTimelineEvents(bookId);
    const dialogueFacts = await repository.getDialogueFacts(bookId);
    const relationships = await repository.getRelationships(bookId);

    const refChaptersMap = new Map<string, { id: string; chapterNumber: number; title: string }>();
    const refEntities: { name: string; type: string }[] = [];

    let responseText = '';

    if (q.includes('meet') || q.includes('relationship') || q.includes('who is') || q.includes('who are')) {
      const matchedChars = characters.filter(c => q.includes(c.name.toLowerCase()));
      const matchedRels = relationships.filter(r =>
        q.includes(r.character1Name.toLowerCase()) || q.includes(r.character2Name.toLowerCase())
      );

      if (matchedRels.length > 0) {
        responseText = matchedRels.map(r => `• ${r.character1Name} and ${r.character2Name} (${r.relationType}): ${r.description}`).join('\n');
      } else if (matchedChars.length > 0) {
        responseText = matchedChars.map(c => `• ${c.name} (${c.status}): ${c.summary}`).join('\n');
        matchedChars.forEach(c => {
          refEntities.push({ name: c.name, type: 'Character' });
          c.appearedInChapterIds.forEach(chapId => {
            const chap = chapters.find(ch => ch.id === chapId);
            if (chap) refChaptersMap.set(chap.id, { id: chap.id, chapterNumber: chap.chapterNumber, title: chap.title });
          });
        });
      }
    }

    if (q.includes('own') || q.includes('item') || q.includes('sword') || q.includes('relic') || q.includes('weapon')) {
      const matchedItems = items.filter(i => q.includes(i.name.toLowerCase()) || (i.ownerCharacterName && q.includes(i.ownerCharacterName.toLowerCase())));
      if (matchedItems.length > 0) {
        const itemLines = matchedItems.map(i =>
          `• ${i.name} (Type: ${i.type || 'Item'}, Status: ${i.status}): Owner is ${i.ownerCharacterName || 'Unowned'}. Located at ${i.currentLocationName || 'Unknown'}. Details: ${i.description}`
        );
        responseText += (responseText ? '\n\n' : '') + itemLines.join('\n');
        matchedItems.forEach(i => refEntities.push({ name: i.name, type: 'Item' }));
      }
    }

    if (q.includes('promise') || q.includes('said') || q.includes('threat') || q.includes('secret') || q.includes('lie') || q.includes('oath')) {
      const matchedFacts = dialogueFacts.filter(d =>
        q.includes(d.speaker.toLowerCase()) || (d.recipient && q.includes(d.recipient.toLowerCase())) || q.includes(d.type.toLowerCase())
      );
      if (matchedFacts.length > 0) {
        const factLines = matchedFacts.map(d =>
          `• [Ch. ${d.chapterNumber} ${d.type}] ${d.speaker}${d.recipient ? ` to ${d.recipient}` : ''}: "${d.fact}"`
        );
        responseText += (responseText ? '\n\n' : '') + 'Dialogue Commitments Found:\n' + factLines.join('\n');
        matchedFacts.forEach(d => {
          const chap = chapters.find(ch => ch.id === d.chapterId);
          if (chap) refChaptersMap.set(chap.id, { id: chap.id, chapterNumber: chap.chapterNumber, title: chap.title });
        });
      }
    }

    if (!responseText) {
      const matchedEvents = events.filter(e =>
        e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || (e.participants && e.participants.some(p => p.toLowerCase().includes(q)))
      );
      if (matchedEvents.length > 0) {
        responseText = matchedEvents.map(e =>
          `• Ch. ${e.chapterNumber} (${e.title}): ${e.description}`
        ).join('\n');
        matchedEvents.forEach(e => {
          const chap = chapters.find(ch => ch.id === e.chapterId);
          if (chap) refChaptersMap.set(chap.id, { id: chap.id, chapterNumber: chap.chapterNumber, title: chap.title });
        });
      } else {
        const matchedChars = characters.filter(c => c.name.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q));
        if (matchedChars.length > 0) {
          responseText = matchedChars.map(c => `• ${c.name}: ${c.summary}`).join('\n');
        } else {
          responseText = `No canon records matching "${query}" were found in your approved Story Bible data. The AI never invents or hallucinates story facts.`;
        }
      }
    }

    setAnswerResult({
      answer: responseText,
      referencedChapters: Array.from(refChaptersMap.values()),
      matchingEntities: refEntities
    });
    setAnswering(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-[#121218] border border-[#232334] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#232334] bg-[#0c0c10] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#7c3aed]/20 border border-[#7c3aed]/40 flex items-center justify-center text-[#a78bfa]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Ask Story Bible AI</h2>
              <p className="text-xs text-[#8e8ea0]">
                Factual knowledge retrieval strictly powered by your approved Story Bible data.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#8e8ea0] hover:text-white hover:bg-[#1e1e2a]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Query Form */}
        <form onSubmit={handleAskQuestion} className="p-6 border-b border-[#232334] space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#8e8ea0]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question (e.g. 'When did Isaac meet Claire?', 'Who owns Excalibur?', 'Promises made by Isaac')..."
              className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-[#181820] border border-[#232334] text-xs text-white placeholder-[#52526b] focus:outline-none focus:border-[#7c3aed]"
              autoFocus
            />
            <button
              type="submit"
              disabled={answering || !query.trim()}
              className="absolute right-2 top-2 px-3 py-1 rounded-lg bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] transition-all disabled:opacity-40"
            >
              {answering ? 'Searching...' : 'Ask AI'}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] text-[#8e8ea0]">Suggestions:</span>
            {[
              'Who owns items?',
              'Every promise made',
              'Character relationships',
              'Locations visited'
            ].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => { setQuery(s); handleAskQuestion(); }}
                className="px-2 py-0.5 rounded text-[10px] bg-[#181820] border border-[#232334] text-[#a78bfa] hover:text-white"
              >
                {s}
              </button>
            ))}
          </div>
        </form>

        {/* Answer Output Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 text-xs">
          {answering && (
            <div className="p-8 text-center text-[#8e8ea0] space-y-2">
              <Sparkles className="w-6 h-6 mx-auto text-[#7c3aed] animate-spin" />
              <div>Querying approved Story Bible database...</div>
            </div>
          )}

          {answerResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#181820] border border-[#7c3aed]/30 space-y-2">
                <div className="flex items-center justify-between text-[#a78bfa] font-bold uppercase text-[10px] tracking-wider">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Story Bible Answer</span>
                  <span>Strict Canon Fact</span>
                </div>
                <div className="text-white leading-relaxed font-sans whitespace-pre-wrap">
                  {answerResult.answer}
                </div>
              </div>

              {/* Referenced Chapters */}
              {answerResult.referencedChapters.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase text-[#8e8ea0] tracking-wider">Supporting Chapters</h4>
                  <div className="flex flex-wrap gap-2">
                    {answerResult.referencedChapters.map(chap => (
                      <Link
                        key={chap.id}
                        href={`/books/${activeBookId || 'book-1'}/chapters?id=${chap.id}`}
                        onClick={onClose}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181820] border border-[#232334] text-xs font-semibold text-[#a78bfa] hover:border-[#7c3aed]"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> Ch. {chap.chapterNumber} — {chap.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!answering && !answerResult && (
            <div className="p-8 text-center text-[#8e8ea0]">
              Ask any question about your story universe. Answers are generated strictly from approved database entities.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
