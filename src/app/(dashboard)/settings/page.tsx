'use client';

import React, { useState, useEffect } from 'react';
import { SYSTEM_EXTRACTION_PROMPT } from '@/lib/ai/prompt';
import { indexedDBAdapter } from '@/lib/storage/indexedDBAdapter';
import {
  Key, Sparkles, Plus, Trash2, CheckCircle2, AlertTriangle, ShieldCheck,
  Server, Copy, Check, Lock, RefreshCw, Layers, Download, Upload, HardDrive
} from 'lucide-react';

interface ApiKeyRecord {
  id: string;
  provider_id: string;
  name: string;
  api_key_encrypted: string;
  default_model: string;
  base_url?: string;
  is_default: boolean;
}

const PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini API', defaultModel: 'gemini-1.5-flash', placeholder: 'AIzaSy...' },
  { id: 'openai', name: 'OpenAI API', defaultModel: 'gpt-4o', placeholder: 'sk-proj-...' },
  { id: 'anthropic', name: 'Anthropic Claude API', defaultModel: 'claude-3-5-sonnet-20241022', placeholder: 'sk-ant-...' },
  { id: 'groq', name: 'Groq Cloud API', defaultModel: 'llama-3.3-70b-versatile', placeholder: 'gsk_...' },
  { id: 'xai', name: 'xAI Grok API', defaultModel: 'grok-beta', placeholder: 'xai-...' },
  { id: 'openrouter', name: 'OpenRouter API', defaultModel: 'google/gemini-2.0-flash-001', placeholder: 'sk-or-...' },
  { id: 'ollama', name: 'Ollama (Local LLM)', defaultModel: 'llama3:latest', placeholder: 'Not required for local Ollama' },
  { id: 'lmstudio', name: 'LM Studio (Local LLM)', defaultModel: 'local-model', placeholder: 'Not required for local LM Studio' },
  { id: 'custom', name: 'Custom OpenAI-Compatible', defaultModel: 'gpt-4o', placeholder: 'sk-...' }
];

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [errorToast, setErrorToast] = useState('');

  // Add Key Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [providerId, setProviderId] = useState('gemini');
  const [keyName, setKeyName] = useState('My Gemini API Key');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('gemini-1.5-flash');
  const [baseUrlInput, setBaseUrlInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const loadApiKeys = async () => {
    setLoading(true);
    let loadedKeys: ApiKeyRecord[] = [];
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('notter_byok_keys');
      if (stored) {
        try { loadedKeys = JSON.parse(stored); } catch (e) {}
      }
    }
    setApiKeys(loadedKeys);
    setLoading(false);
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  const showSuccess = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const showError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(''), 4000);
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim() && providerId !== 'ollama' && providerId !== 'lmstudio') {
      showError('Please enter a valid API Key.');
      return;
    }

    const newKeyRecord: ApiKeyRecord = {
      id: `key_${Date.now()}`,
      provider_id: providerId,
      name: keyName.trim() || `${providerId.toUpperCase()} Key`,
      api_key_encrypted: apiKeyInput.trim(),
      default_model: modelInput.trim() || 'default',
      base_url: baseUrlInput.trim() || undefined,
      is_default: apiKeys.length === 0
    };

    const nextKeys = [newKeyRecord, ...apiKeys];
    localStorage.setItem('notter_byok_keys', JSON.stringify(nextKeys));
    setApiKeys(nextKeys);
    setShowAddForm(false);
    setApiKeyInput('');
    showSuccess('API Key saved locally!');
  };

  const handleDeleteKey = (id: string) => {
    const nextKeys = apiKeys.filter(k => k.id !== id);
    localStorage.setItem('notter_byok_keys', JSON.stringify(nextKeys));
    setApiKeys(nextKeys);
    showSuccess('Key removed');
  };

  // Workspace Export & Import Handlers
  const handleExportWorkspace = async () => {
    try {
      const jsonStr = await indexedDBAdapter.exportFullWorkspaceJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notter-workspace-backup-${new Date().toISOString().substring(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Full workspace exported to JSON!');
    } catch (e) {
      showError('Export failed.');
    }
  };

  const handleImportWorkspace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const success = await indexedDBAdapter.importFullWorkspaceJSON(content);
        if (success) {
          showSuccess('Workspace imported successfully!');
          window.location.reload();
        } else {
          showError('Invalid backup JSON file.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 text-xs select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <Key className="w-6 h-6 text-[#7c3aed]" /> Settings & BYOK API Keys
        </h1>
        <p className="text-xs text-[#8e8ea0] mt-1">
          Notter 2.0 is 100% Offline-First. Your manuscripts and story bibles are stored locally inside your browser. Add your custom AI provider API keys below for chapter extractions.
        </p>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}

      {errorToast && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" /> {errorToast}
        </div>
      )}

      {/* Offline Storage & Backup Panel */}
      <div className="p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#232334] pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" /> Local Storage & Privacy Controls
          </h2>
          <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-extrabold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            100% Offline Engine Active
          </span>
        </div>

        <p className="text-[#a1a1aa] leading-relaxed">
          Your books, story bibles, characters, timeline events, and notes reside strictly inside your browser’s IndexedDB storage. You can export a backup JSON at any time or restore a backup onto another computer.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            onClick={handleExportWorkspace}
            className="px-4 py-2.5 rounded-xl bg-[#7c3aed] text-white font-bold hover:bg-[#6d28d9] transition-all flex items-center gap-2 shadow-purple"
          >
            <Download className="w-4 h-4" /> Export Complete Workspace (.JSON)
          </button>

          <label className="px-4 py-2.5 rounded-xl bg-[#1e1e2a] border border-[#232334] text-white font-semibold hover:bg-[#272738] transition-all flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4 text-[#a78bfa]" /> Import Workspace JSON
            <input type="file" accept=".json" onChange={handleImportWorkspace} className="hidden" />
          </label>
        </div>
      </div>

      {/* BYOK API Key Section */}
      <div className="p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#232334] pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Bring Your Own Key (BYOK)
            </h2>
            <p className="text-[11px] text-[#8e8ea0] mt-0.5">
              API keys are saved locally in your browser and are sent directly to the selected AI provider.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(s => !s)}
            className="px-3.5 py-2 rounded-xl bg-[#7c3aed] text-white font-bold hover:bg-[#6d28d9] transition-all flex items-center gap-1.5 shadow-purple"
          >
            <Plus className="w-4 h-4" /> Add API Key
          </button>
        </div>

        {/* Add Key Form */}
        {showAddForm && (
          <form onSubmit={handleSaveKey} className="p-5 rounded-xl bg-[#181820] border border-[#232334] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1">
                  AI Provider
                </label>
                <select
                  value={providerId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setProviderId(pid);
                    const p = PROVIDERS.find(x => x.id === pid);
                    if (p) setModelInput(p.defaultModel);
                  }}
                  className="w-full bg-[#121218] border border-[#232334] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#7c3aed]"
                >
                  {PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1">
                  Key Label / Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Personal Gemini Key"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full bg-[#121218] border border-[#232334] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1">
                API Key Secret
              </label>
              <input
                type="password"
                placeholder={PROVIDERS.find(p => p.id === providerId)?.placeholder || 'Paste API secret key here...'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full bg-[#121218] border border-[#232334] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#7c3aed]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl bg-[#121218] border border-[#232334] text-[#8e8ea0] hover:text-white font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#7c3aed] text-white font-bold hover:bg-[#6d28d9] transition-all shadow-purple"
              >
                Save API Key
              </button>
            </div>
          </form>
        )}

        {/* Existing Keys Table */}
        <div className="space-y-3">
          {apiKeys.length === 0 ? (
            <p className="text-center py-6 text-[#8e8ea0] italic">
              No custom API keys added yet. Add a key above to analyze chapters with AI.
            </p>
          ) : (
            apiKeys.map(k => (
              <div key={k.id} className="p-4 rounded-xl bg-[#181820] border border-[#232334] flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">{k.name}</div>
                  <div className="text-[11px] text-[#8e8ea0] font-mono mt-0.5">
                    Provider: {k.provider_id.toUpperCase()} • Model: {k.default_model}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteKey(k.id)}
                  className="p-2 rounded-lg text-[#8e8ea0] hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Remove Key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
