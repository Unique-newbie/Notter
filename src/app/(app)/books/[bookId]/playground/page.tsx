'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, Play, Code, CheckCircle2, RefreshCw } from 'lucide-react';

export default function ExtractionPlaygroundPage() {
  const params = useParams();
  const bookId = (params?.bookId as string) || 'book-1';

  const [sampleText, setSampleText] = useState('');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [isRunning, setIsRunning] = useState(false);
  const [resultJson, setResultJson] = useState<string | null>(null);

  const handleTestExtraction = async () => {
    if (!sampleText.trim()) return;
    setIsRunning(true);

    try {
      const res = await fetch('/api/analyze-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterText: sampleText,
          bookId,
          chapterNumber: 1,
          testMode: true,
          model
        })
      });

      const data = await res.json();
      setResultJson(JSON.stringify(data.extraction || data, null, 2));
    } catch (e) {
      setResultJson(JSON.stringify({ error: 'Extraction playground test failed.' }, null, 2));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-amber-400" /> AI Extraction Playground
        </h1>
        <p className="text-xs text-[#8e8ea0] mt-1">
          Paste prose snippets, test prompt extraction rules, and preview structured JSON outputs without mutating the database.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Input Prose Area */}
        <div className="p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">Sample Manuscript Prose</h3>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-[#181820] border border-[#232334] rounded-lg px-2.5 py-1 text-white font-mono text-[11px]"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
            </select>
          </div>

          <textarea
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            placeholder="Paste raw prose snippet here to test extraction rules..."
            rows={14}
            className="w-full bg-[#0c0c10] border border-[#232334] rounded-xl p-4 text-white placeholder-[#52526b] focus:outline-none focus:border-amber-500 font-serif leading-relaxed resize-none"
          />

          <button
            onClick={handleTestExtraction}
            disabled={isRunning || !sampleText.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Running Extraction Test...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Run Test Extraction (No DB Save)
              </>
            )}
          </button>
        </div>

        {/* JSON Result Output */}
        <div className="p-6 rounded-2xl bg-[#0c0c10] border border-[#232334] space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-[#232334] pb-3">
            <h3 className="font-bold text-white flex items-center gap-2 font-mono">
              <Code className="w-4 h-4 text-cyan-400" /> Structured Extraction JSON
            </h3>
            {resultJson && (
              <span className="px-2.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                TEST SUCCESSFUL
              </span>
            )}
          </div>

          {resultJson ? (
            <pre className="p-4 rounded-xl bg-[#121218] border border-[#232334] text-emerald-400 font-mono text-[11px] overflow-auto max-h-[60vh] leading-relaxed">
              {resultJson}
            </pre>
          ) : (
            <div className="p-12 text-center text-[#8e8ea0]">
              Paste prose on the left and click &quot;Run Test Extraction&quot; to inspect the generated JSON schema.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
