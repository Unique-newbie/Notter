'use client';

import React, { useState, useEffect } from 'react';
import { indexedDBAdapter } from '@/lib/storage/indexedDBAdapter';
import { repository } from '@/lib/store/repository';
import { Book } from '@/types';
import {
  Key, Sparkles, Plus, Trash2, CheckCircle2, AlertTriangle, ShieldCheck,
  Download, Upload, HardDrive, Palette, Sliders, Command, Info, Check, RefreshCw
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
  { id: 'lmstudio', name: 'LM Studio (Local LLM)', defaultModel: 'local-model', placeholder: 'Not required for local LM Studio' }
];

const THEMES = [
  { id: 'theme-obsidian', name: 'Obsidian Dark', color: '#09090b', accent: '#7c3aed', desc: 'Sleek dark violet theme for night writing' },
  { id: 'theme-amoled', name: 'AMOLED Black', color: '#000000', accent: '#a78bfa', desc: 'Pure true-black contrast for OLED displays' },
  { id: 'theme-nord', name: 'Nordic Frost', color: '#2e3440', accent: '#88c0d0', desc: 'Cool arctic blue palette inspired by Nord' },
  { id: 'theme-dracula', name: 'Dracula Cyber', color: '#282a36', accent: '#ff79c6', desc: 'Vibrant neon purple and pink theme' },
  { id: 'theme-light', name: 'Clean Daylight', color: '#f8fafc', accent: '#6366f1', desc: 'High readability light theme for daytime' }
];

export default function ConsolidatedSettingsPage() {
  const [activeTab, setActiveTab] = useState<'appearance' | 'editor' | 'ai' | 'backup' | 'shortcuts' | 'info'>('appearance');
  const [toast, setToast] = useState('');
  const [errorToast, setErrorToast] = useState('');

  // Appearance & Theme state
  const [currentTheme, setCurrentTheme] = useState('theme-obsidian');
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif');
  const [fontSize, setFontSize] = useState('16px');

  // Editor Preferences state
  const [autoSaveMs, setAutoSaveMs] = useState(1000);
  const [showWordCountGoal, setShowWordCountGoal] = useState(true);

  // BYOK API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [providerId, setProviderId] = useState('gemini');
  const [keyName, setKeyName] = useState('My Gemini Key');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('gemini-1.5-flash');

  // Single Book Export state
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookToExport, setSelectedBookToExport] = useState('');

  // Storage Stats
  const [storageStats, setStorageStats] = useState({ booksCount: 0, chaptersCount: 0, charactersCount: 0 });

  useEffect(() => {
    // Load theme & preferences
    const storedTheme = localStorage.getItem('notter_theme') || 'theme-obsidian';
    const storedFont = localStorage.getItem('notter_font') || 'Inter, sans-serif';
    const storedSize = localStorage.getItem('notter_fontsize') || '16px';
    const storedAutoSave = parseInt(localStorage.getItem('notter_autosave_ms') || '1000', 10);
    const storedKeys = JSON.parse(localStorage.getItem('notter_byok_keys') || '[]');

    setCurrentTheme(storedTheme);
    setFontFamily(storedFont);
    setFontSize(storedSize);
    setAutoSaveMs(storedAutoSave);
    setApiKeys(storedKeys);

    loadBooksAndStats();
  }, []);

  const loadBooksAndStats = async () => {
    const list = await repository.getBooks();
    setBooks(list);
    if (list.length > 0) setSelectedBookToExport(list[0].id);

    const allChaps = await indexedDBAdapter.getAll('chapters');
    const allChars = await indexedDBAdapter.getAll('characters');

    setStorageStats({
      booksCount: list.length,
      chaptersCount: allChaps.length,
      charactersCount: allChars.length
    });
  };

  const showSuccess = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const showError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(''), 4000);
  };

  const handleApplyTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    localStorage.setItem('notter_theme', themeId);
    document.documentElement.className = themeId;
    showSuccess(`Theme switched to ${THEMES.find(t => t.id === themeId)?.name}`);
  };

  const handleSaveEditorPrefs = () => {
    localStorage.setItem('notter_font', fontFamily);
    localStorage.setItem('notter_fontsize', fontSize);
    localStorage.setItem('notter_autosave_ms', autoSaveMs.toString());
    showSuccess('Editor writing preferences saved!');
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim() && providerId !== 'ollama' && providerId !== 'lmstudio') {
      showError('Please enter a valid API secret key.');
      return;
    }

    const newKeyRecord: ApiKeyRecord = {
      id: `key_${Date.now()}`,
      provider_id: providerId,
      name: keyName.trim() || `${providerId.toUpperCase()} Key`,
      api_key_encrypted: apiKeyInput.trim(),
      default_model: modelInput.trim() || 'default',
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

  // Export Complete Workspace
  const handleExportWorkspace = async () => {
    try {
      const jsonStr = await indexedDBAdapter.exportFullWorkspaceJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notter-full-workspace-${new Date().toISOString().substring(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Full workspace exported to JSON!');
    } catch (e) {
      showError('Export failed.');
    }
  };

  // Export Single Book
  const handleExportSingleBook = async () => {
    if (!selectedBookToExport) return;
    try {
      const jsonStr = await indexedDBAdapter.exportSingleBookJSON(selectedBookToExport);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notter-novel-${selectedBookToExport}-${new Date().toISOString().substring(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Single novel backup downloaded!');
    } catch (e) {
      showError('Single book export failed.');
    }
  };

  // Import JSON Workspace / Book
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        let success = false;
        if (content.includes('2.0-single-book')) {
          success = await indexedDBAdapter.importSingleBookJSON(content);
        } else {
          success = await indexedDBAdapter.importFullWorkspaceJSON(content);
        }

        if (success) {
          showSuccess('Import completed successfully!');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showError('Failed to parse backup JSON.');
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
          <Sliders className="w-6 h-6 text-[#7c3aed]" /> Application Settings & Preferences
        </h1>
        <p className="text-xs text-[#8e8ea0] mt-1">
          Configure writing themes, editor defaults, local BYOK AI keys, data backups, and shortcuts.
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

      {/* Tabs Header */}
      <div className="flex border-b border-[#232334] gap-2 overflow-x-auto pb-1">
        {[
          { id: 'appearance', label: 'Appearance & Themes', icon: Palette },
          { id: 'editor', label: 'Editor & Writing', icon: Sliders },
          { id: 'ai', label: 'AI Extraction (BYOK)', icon: Sparkles },
          { id: 'backup', label: 'Data Backup & Import', icon: HardDrive },
          { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Command },
          { id: 'info', label: 'Diagnostics & System', icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-[#7c3aed] text-white bg-[#121218]'
                  : 'border-transparent text-[#8e8ea0] hover:text-white hover:bg-[#121218]/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#a78bfa]' : 'text-[#8e8ea0]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: APPEARANCE & THEMES */}
      {activeTab === 'appearance' && (
        <div className="p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-6 shadow-xl">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#7c3aed]" /> Theme & Display Palettes
            </h2>
            <p className="text-[#8e8ea0] text-[11px] mt-0.5">Select your preferred color workspace.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {THEMES.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleApplyTheme(theme.id)}
                  className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${
                    isSelected
                      ? 'bg-[#181820] border-[#7c3aed] ring-2 ring-[#7c3aed]/40'
                      : 'bg-[#181820] border-[#232334] hover:border-[#7c3aed]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: theme.color }} />
                      <span className="font-bold text-white text-xs">{theme.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#a78bfa]" />}
                  </div>
                  <p className="text-[11px] text-[#8e8ea0]">{theme.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: EDITOR PREFERENCES */}
      {activeTab === 'editor' && (
        <div className="p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-6 shadow-xl">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#7c3aed]" /> Chapter Writing & Typography Settings
            </h2>
            <p className="text-[#8e8ea0] text-[11px] mt-0.5">Customize font sizes, line height, and auto-save timing.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1">
                Editor Font Family
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#7c3aed]"
              >
                <option value="Inter, sans-serif">Inter (Modern Sans)</option>
                <option value="Georgia, serif">Georgia (Classic Serif)</option>
                <option value="'Courier New', monospace">Courier (Monospace)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1">
                Font Size
              </label>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#7c3aed]"
              >
                <option value="14px">14px Small</option>
                <option value="16px">16px Standard</option>
                <option value="18px">18px Large</option>
                <option value="20px">20px Extra Large</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1">
                Auto-Save Frequency (ms)
              </label>
              <select
                value={autoSaveMs}
                onChange={(e) => setAutoSaveMs(parseInt(e.target.value, 10))}
                className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#7c3aed]"
              >
                <option value={500}>500ms Instant</option>
                <option value={1000}>1000ms (1 Second)</option>
                <option value={2000}>2000ms (2 Seconds)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveEditorPrefs}
              className="px-5 py-2.5 rounded-xl bg-[#7c3aed] text-white font-bold hover:bg-[#6d28d9] transition-all shadow-purple"
            >
              Save Writing Preferences
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: BYOK AI PROVIDERS */}
      {activeTab === 'ai' && (
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
              <Plus className="w-4 h-4" /> Add Key
            </button>
          </div>

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
                  placeholder={PROVIDERS.find(p => p.id === providerId)?.placeholder || 'Paste secret key...'}
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
      )}

      {/* TAB 4: BACKUP & IMPORT/EXPORT */}
      {activeTab === 'backup' && (
        <div className="p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-6 shadow-xl">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-400" /> Complete Workspace & Single Novel Backups
            </h2>
            <p className="text-[#8e8ea0] text-[11px] mt-0.5">
              Export and import your entire workspace or single novels cleanly as `.json` files.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Workspace Export */}
            <div className="p-5 rounded-xl bg-[#181820] border border-[#232334] space-y-3">
              <h3 className="font-bold text-white text-xs flex items-center gap-2">
                <Download className="w-4 h-4 text-[#a78bfa]" /> Export Complete Workspace
              </h3>
              <p className="text-[#8e8ea0] text-[11px] leading-relaxed">
                Downloads a single formatted JSON containing all books, chapters, story bible entities, and local preferences.
              </p>
              <button
                onClick={handleExportWorkspace}
                className="w-full py-2.5 rounded-xl bg-[#7c3aed] text-white font-bold hover:bg-[#6d28d9] transition-all flex items-center justify-center gap-2 shadow-purple"
              >
                <Download className="w-4 h-4" /> Download Complete Workspace (.JSON)
              </button>
            </div>

            {/* Single Book Export */}
            <div className="p-5 rounded-xl bg-[#181820] border border-[#232334] space-y-3">
              <h3 className="font-bold text-white text-xs flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" /> Export Single Novel Backup
              </h3>
              <p className="text-[#8e8ea0] text-[11px] leading-relaxed">
                Export only the selected book along with its chapters, story bible, and timeline.
              </p>

              <div className="flex gap-2">
                <select
                  value={selectedBookToExport}
                  onChange={(e) => setSelectedBookToExport(e.target.value)}
                  className="flex-1 bg-[#121218] border border-[#232334] rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  {books.map(b => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </select>
                <button
                  onClick={handleExportSingleBook}
                  disabled={!selectedBookToExport}
                  className="px-4 py-2 rounded-xl bg-[#1e1e2a] border border-[#232334] text-white font-bold hover:bg-[#272738] transition-all disabled:opacity-50"
                >
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Import Panel */}
          <div className="p-5 rounded-xl bg-[#181820] border border-emerald-500/30 space-y-3">
            <h3 className="font-bold text-white text-xs flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" /> Restore Backup (.JSON)
            </h3>
            <p className="text-[#8e8ea0] text-[11px]">
              Restore an exported workspace or merge a single novel backup into your local IndexedDB storage.
            </p>
            <label className="px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" /> Select Backup JSON File
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* TAB 5: KEYBOARD SHORTCUTS */}
      {activeTab === 'shortcuts' && (
        <div className="p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Command className="w-4 h-4 text-[#7c3aed]" /> Universal Keyboard Shortcuts
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'Ctrl + K', action: 'Open Universal Story Bible Search' },
              { key: 'Ctrl + S', action: 'Force Auto-Save Active Chapter' },
              { key: 'Ctrl + Shift + Z', action: 'Toggle Full-Screen Zen Mode' },
              { key: 'Ctrl + Shift + E', action: 'Trigger AI Chapter Extraction' },
              { key: 'Ctrl + B', action: 'Toggle Sidebar Collapse' },
              { key: 'Esc', action: 'Close Active Modals or Overlay' },
            ].map(s => (
              <div key={s.key} className="p-3.5 rounded-xl bg-[#181820] border border-[#232334] flex items-center justify-between">
                <span className="text-white font-medium">{s.action}</span>
                <kbd className="px-2.5 py-1 rounded bg-[#1e1e2a] border border-[#232334] text-[#a78bfa] font-mono text-[11px] font-bold">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: DIAGNOSTICS & SYSTEM INFO */}
      {activeTab === 'info' && (
        <div className="p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-4 shadow-xl font-mono text-xs">
          <h2 className="text-base font-bold text-white font-sans flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400" /> Diagnostics & Storage Telemetry
          </h2>

          <div className="space-y-2 p-4 rounded-xl bg-[#0c0c10] border border-[#232334] text-[#a1a1aa]">
            <div className="flex justify-between border-b border-[#232334] pb-2">
              <span>Application Version:</span>
              <span className="text-white font-bold">Notter v2.2.0 (Offline First)</span>
            </div>
            <div className="flex justify-between border-b border-[#232334] pb-2">
              <span>IndexedDB Status:</span>
              <span className="text-emerald-400 font-bold">Active (12 Object Stores)</span>
            </div>
            <div className="flex justify-between border-b border-[#232334] pb-2">
              <span>Total Novels Stored:</span>
              <span className="text-white font-bold">{storageStats.booksCount}</span>
            </div>
            <div className="flex justify-between border-b border-[#232334] pb-2">
              <span>Total Chapters Stored:</span>
              <span className="text-white font-bold">{storageStats.chaptersCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Characters Tracked:</span>
              <span className="text-white font-bold">{storageStats.charactersCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
