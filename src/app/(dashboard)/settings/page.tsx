'use client';

import React, { useState, useEffect } from 'react';
import { SYSTEM_EXTRACTION_PROMPT } from '@/lib/ai/prompt';
import { useAuth } from '@/lib/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  Key, Sparkles, Plus, Trash2, CheckCircle2, AlertTriangle, ShieldCheck,
  Server, Copy, Check, Lock, User, RefreshCw, Layers
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
  const { user, logout } = useAuth();
  const supabase = createClient();

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
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const loadApiKeys = async () => {
    setLoading(true);
    let loadedKeys: ApiKeyRecord[] = [];

    if (user) {
      try {
        const { data, error } = await supabase
          .from('user_api_keys')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          loadedKeys = data;
        }
      } catch (err) {
        console.warn('Supabase fetch error, falling back to localStorage:', err);
      }
    }

    if (loadedKeys.length === 0 && typeof window !== 'undefined') {
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
  }, [user]);

  const showSuccess = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const showError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(''), 4000);
  };

  const handleProviderSelect = (pid: string) => {
    setProviderId(pid);
    const prov = PROVIDERS.find(p => p.id === pid);
    if (prov) {
      setKeyName(`My ${prov.name}`);
      setModelInput(prov.defaultModel);
      if (pid === 'ollama') setBaseUrlInput('http://localhost:11434/v1');
      else if (pid === 'lmstudio') setBaseUrlInput('http://localhost:1234/v1');
      else setBaseUrlInput('');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/analyze-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          apiKey: apiKeyInput,
          model: modelInput,
          baseUrl: baseUrlInput,
          chapterText: 'Test chapter content to verify connection.'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult('Connection Successful! API Provider responded cleanly.');
      } else {
        setTestResult(`Connection Error: ${data.error || 'Failed to connect'}`);
      }
    } catch (err: any) {
      setTestResult(`Connection Failed: ${err.message}`);
    }
    setTesting(false);
  };

  const handleSaveKey = async () => {
    if (!apiKeyInput && providerId !== 'ollama' && providerId !== 'lmstudio') {
      showError('Please enter an API key');
      return;
    }

    const isFirstKey = apiKeys.length === 0;
    const newRecord: ApiKeyRecord = {
      id: `key-${Date.now()}`,
      provider_id: providerId,
      name: keyName.trim() || 'My API Key',
      api_key_encrypted: apiKeyInput || 'local-key',
      default_model: modelInput.trim() || 'gemini-1.5-flash',
      base_url: baseUrlInput.trim() || undefined,
      is_default: isFirstKey
    };

    if (user) {
      try {
        const { data, error } = await supabase.from('user_api_keys').insert({
          user_id: user.id,
          provider_id: providerId,
          name: newRecord.name,
          api_key_encrypted: newRecord.api_key_encrypted,
          default_model: newRecord.default_model,
          base_url: newRecord.base_url || null,
          is_default: isFirstKey
        }).select('*').single();

        if (!error && data) {
          newRecord.id = data.id;
        }
      } catch (err) {
        console.warn('Could not save key to Supabase DB, saving to localStorage:', err);
      }
    }

    // Always update local state & localStorage
    const updated = [newRecord, ...apiKeys.filter(k => k.id !== newRecord.id)];
    if (isFirstKey) {
      updated.forEach(k => { k.is_default = (k.id === newRecord.id); });
    }
    setApiKeys(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('notter_byok_keys', JSON.stringify(updated));
    }

    showSuccess(`Saved ${newRecord.name}`);
    setShowAddForm(false);
    setApiKeyInput('');
    setTestResult(null);
  };

  const handleSetDefaultKey = async (keyId: string) => {
    if (user) {
      try {
        await supabase.from('user_api_keys').update({ is_default: false }).eq('user_id', user.id);
        await supabase.from('user_api_keys').update({ is_default: true }).eq('id', keyId);
      } catch (err) {
        console.warn('Supabase update default key error:', err);
      }
    }

    const updated = apiKeys.map(k => ({
      ...k,
      is_default: k.id === keyId
    }));
    setApiKeys(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('notter_byok_keys', JSON.stringify(updated));
    }

    showSuccess('Updated default AI Provider');
  };

  const handleDeleteKey = async (keyId: string) => {
    if (confirm('Delete this API Key configuration?')) {
      if (user) {
        try {
          await supabase.from('user_api_keys').delete().eq('id', keyId);
        } catch (err) {
          console.warn('Supabase delete key error:', err);
        }
      }
      const updated = apiKeys.filter(k => k.id !== keyId);
      setApiKeys(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('notter_byok_keys', JSON.stringify(updated));
      }
      showSuccess('API Key deleted');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl bg-[#7c3aed] text-white text-sm font-semibold shadow-2xl animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}
      {errorToast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold shadow-2xl animate-in fade-in slide-in-from-top-2">
          {errorToast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <Key className="w-6 h-6 text-[#7c3aed]" /> Settings & BYOK API Keys
        </h1>
        <p className="text-xs text-[#8e8ea0] mt-1">
          Bring Your Own Key (BYOK): Configure your own AI provider keys for objective chapter extraction.
        </p>
      </div>

      {/* Account Info */}
      <div className="p-6 rounded-2xl bg-[#121218] border border-[#232334] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1e1e2a] border border-[#232334] flex items-center justify-center text-[#a78bfa]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#8e8ea0]">Authenticated Account</div>
            <div className="text-sm font-bold text-white mt-0.5">{user?.email || 'Authenticated User (Local Session)'}</div>
          </div>
        </div>
        {user && (
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-xs hover:bg-red-500/20 transition-all"
          >
            Sign Out
          </button>
        )}
      </div>

      {/* BYOK API Keys Section */}
      <div className="p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-6">
        <div className="flex items-center justify-between border-b border-[#232334] pb-4">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-[#a78bfa]" />
            <div>
              <h2 className="text-base font-bold text-white">AI Provider API Keys (BYOK)</h2>
              <p className="text-xs text-[#8e8ea0]">Notter never provides AI credits. Extractions execute directly using your configured provider API key.</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7c3aed] text-white hover:bg-[#6d28d9] text-xs font-bold transition-all shadow-purple"
          >
            <Plus className="w-4 h-4" /> {showAddForm ? 'Cancel' : 'Add API Key'}
          </button>
        </div>

        {/* Add Provider Key Form */}
        {showAddForm && (
          <div className="p-5 rounded-xl bg-[#181820] border border-[#7c3aed]/40 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-white text-sm">Configure New AI Provider</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#8e8ea0] uppercase text-[10px]">Select Provider</label>
                <select
                  value={providerId}
                  onChange={(e) => handleProviderSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121218] border border-[#232334] text-white text-xs"
                >
                  {PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#8e8ea0] uppercase text-[10px]">Configuration Label Name</label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. My Gemini Key"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121218] border border-[#232334] text-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#8e8ea0] uppercase text-[10px]">API Key</label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={PROVIDERS.find(p => p.id === providerId)?.placeholder || 'Enter API Key...'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121218] border border-[#232334] text-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#8e8ea0] uppercase text-[10px]">Default Model</label>
                <input
                  type="text"
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  placeholder="e.g. gemini-1.5-flash, gpt-4o"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121218] border border-[#232334] text-white text-xs font-mono"
                />
              </div>
            </div>

            {(providerId === 'ollama' || providerId === 'lmstudio' || providerId === 'custom') && (
              <div className="space-y-1 text-xs">
                <label className="font-bold text-[#8e8ea0] uppercase text-[10px]">Base API URL (Local/Custom Endpoint)</label>
                <input
                  type="text"
                  value={baseUrlInput}
                  onChange={(e) => setBaseUrlInput(e.target.value)}
                  placeholder="e.g. http://localhost:11434/v1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121218] border border-[#232334] text-white text-xs font-mono"
                />
              </div>
            )}

            {/* Connection Test Result */}
            {testResult && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                testResult.includes('Successful')
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-300'
              }`}>
                {testResult.includes('Successful') ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
                <span>{testResult}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#121218] border border-[#232334] text-[#a78bfa] font-bold text-xs hover:border-[#7c3aed]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} /> {testing ? 'Testing...' : 'Test Connection'}
              </button>

              <button
                type="button"
                onClick={handleSaveKey}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] shadow-purple"
              >
                Save Configuration
              </button>
            </div>
          </div>
        )}

        {/* Existing Configured Keys List */}
        <div className="space-y-3">
          {apiKeys.length === 0 && !showAddForm && (
            <div className="p-8 text-center text-xs text-[#8e8ea0] rounded-xl bg-[#181820] border border-[#232334]">
              No AI provider API keys configured yet. Click &quot;Add API Key&quot; above to add your Gemini, OpenAI, or Claude key.
            </div>
          )}

          {apiKeys.map(k => (
            <div key={k.id} className="p-4 rounded-xl bg-[#181820] border border-[#232334] flex items-center justify-between text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{k.name}</span>
                  {k.is_default && (
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Default Active
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-[#0c0c10] text-[#a78bfa] border border-[#232334]">
                    {k.provider_id}
                  </span>
                </div>
                <div className="text-[#8e8ea0] font-mono">
                  Model: <strong className="text-white">{k.default_model}</strong> | Key: ••••••••••••{k.api_key_encrypted.slice(-4)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!k.is_default && (
                  <button
                    onClick={() => handleSetDefaultKey(k.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#121218] border border-[#232334] text-[#a78bfa] hover:text-white font-semibold text-[11px]"
                  >
                    Set Active Default
                  </button>
                )}
                <button
                  onClick={() => handleDeleteKey(k.id)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                  title="Delete API Key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Extraction Prompt Inspector */}
      <div className="p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-4">
        <div className="flex items-center justify-between border-b border-[#232334] pb-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">System Extraction Prompt</h2>
              <p className="text-xs text-[#8e8ea0]">Strict non-generative prompt used for all structured JSON extractions.</p>
            </div>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(SYSTEM_EXTRACTION_PROMPT);
              setCopiedPrompt(true);
              setTimeout(() => setCopiedPrompt(false), 3000);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181820] border border-[#232334] text-[#a78bfa] text-xs font-semibold hover:text-white"
          >
            {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedPrompt ? 'Copied Prompt!' : 'Copy System Prompt'}
          </button>
        </div>

        <div className="p-4 rounded-xl bg-[#0c0c10] border border-[#232334] font-mono text-[11px] text-[#a1a1aa] leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
          {SYSTEM_EXTRACTION_PROMPT}
        </div>
      </div>

      {/* Advanced Settings & Cache Management */}
      <div className="p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-4 text-xs">
        <h2 className="text-base font-bold text-white border-b border-[#232334] pb-3">Advanced Settings &amp; Data Maintenance</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => {
              const data = {
                apiKeys,
                themePrefs: localStorage.getItem('notter_theme_prefs'),
                exportedAt: new Date().toISOString()
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `notter-settings-${Date.now()}.json`;
              a.click();
              showSuccess('Exported settings JSON!');
            }}
            className="p-4 rounded-xl bg-[#181820] border border-[#232334] hover:border-[#7c3aed] font-bold text-white text-left transition-all"
          >
            Export Settings JSON
            <span className="block text-[10px] text-[#8e8ea0] font-normal mt-0.5">Download local keys and theme configuration</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Clear local storage cache? (Saved sessions will be preserved in database)')) {
                localStorage.clear();
                showSuccess('Local cache cleared successfully!');
                setTimeout(() => window.location.reload(), 1000);
              }
            }}
            className="p-4 rounded-xl bg-[#181820] border border-[#232334] hover:border-amber-500 font-bold text-amber-300 text-left transition-all"
          >
            Clear Local Cache
            <span className="block text-[10px] text-[#8e8ea0] font-normal mt-0.5">Free up browser storage &amp; reset UI state</span>
          </button>

          <a
            href="/about"
            className="p-4 rounded-xl bg-[#181820] border border-[#232334] hover:border-cyan-400 font-bold text-cyan-300 text-left transition-all"
          >
            About &amp; Developer Diagnostics
            <span className="block text-[10px] text-[#8e8ea0] font-normal mt-0.5">App version v2.2.0 &amp; DB connection stats</span>
          </a>
        </div>
      </div>

    </div>
  );
}
