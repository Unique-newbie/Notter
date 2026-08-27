'use client';

import React, { useEffect, useState } from 'react';
import { indexedDBAdapter } from '@/lib/storage/indexedDBAdapter';
import { repository } from '@/lib/store/repository';
import { Book } from '@/types';
import {
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  HardDrive,
  Timer,
  Keyboard,
  Info,
  Settings2,
  ShieldCheck,
  Database,
  ChevronRight,
  X,
  BookOpen,
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
  {
    id: 'gemini',
    name: 'Google Gemini',
    defaultModel: 'gemini-1.5-flash',
    placeholder: 'AIzaSy...',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    defaultModel: 'gpt-4o',
    placeholder: 'sk-proj-...',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    defaultModel: 'claude-3-5-sonnet-20241022',
    placeholder: 'sk-ant-...',
  },
  {
    id: 'groq',
    name: 'Groq',
    defaultModel: 'llama-3.3-70b-versatile',
    placeholder: 'gsk_...',
  },
  {
    id: 'xai',
    name: 'xAI Grok',
    defaultModel: 'grok-beta',
    placeholder: 'xai-...',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    defaultModel: 'google/gemini-2.0-flash-001',
    placeholder: 'sk-or-...',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    defaultModel: 'llama3:latest',
    placeholder: 'Not required for local Ollama',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    defaultModel: 'local-model',
    placeholder: 'Not required for local LM Studio',
  },
];

type SettingsTab =
  | 'autosave'
  | 'ai'
  | 'backup'
  | 'shortcuts'
  | 'info';

const SETTINGS_NAV = [
  {
    id: 'autosave',
    label: 'General',
    description: 'Writing preferences',
    icon: Settings2,
  },
  {
    id: 'ai',
    label: 'AI Providers',
    description: 'Bring your own keys',
    icon: Sparkles,
  },
  {
    id: 'backup',
    label: 'Backup & Data',
    description: 'Export and restore',
    icon: Database,
  },
  {
    id: 'shortcuts',
    label: 'Shortcuts',
    description: 'Keyboard controls',
    icon: Keyboard,
  },
  {
    id: 'info',
    label: 'Diagnostics',
    description: 'Workspace information',
    icon: Info,
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] =
    useState<SettingsTab>('autosave');

  const [toast, setToast] = useState('');
  const [errorToast, setErrorToast] = useState('');

  const [autoSaveMs, setAutoSaveMs] =
    useState(1000);

  const [apiKeys, setApiKeys] =
    useState<ApiKeyRecord[]>([]);

  const [showAddForm, setShowAddForm] =
    useState(false);

  const [providerId, setProviderId] =
    useState('gemini');

  const [keyName, setKeyName] =
    useState('My Gemini Key');

  const [apiKeyInput, setApiKeyInput] =
    useState('');

  const [modelInput, setModelInput] =
    useState('gemini-1.5-flash');

  const [books, setBooks] =
    useState<Book[]>([]);

  const [selectedBookToExport, setSelectedBookToExport] =
    useState('');

  const [storageStats, setStorageStats] =
    useState({
      booksCount: 0,
      chaptersCount: 0,
      charactersCount: 0,
    });

  useEffect(() => {
    const storedAutoSave = parseInt(
      localStorage.getItem(
        'notter_autosave_ms'
      ) || '1000',
      10
    );

    let storedKeys: ApiKeyRecord[] = [];

    try {
      storedKeys = JSON.parse(
        localStorage.getItem(
          'notter_byok_keys'
        ) || '[]'
      );
    } catch {
      storedKeys = [];
    }

    setAutoSaveMs(storedAutoSave);
    setApiKeys(storedKeys);

    loadBooksAndStats();
  }, []);

  const loadBooksAndStats = async () => {
    try {
      const list =
        await repository.getBooks();

      setBooks(list);

      if (list.length > 0) {
        setSelectedBookToExport(
          (current) =>
            current || list[0].id
        );
      }

      const allChaps =
        await indexedDBAdapter.getAll(
          'chapters'
        );

      const allChars =
        await indexedDBAdapter.getAll(
          'characters'
        );

      setStorageStats({
        booksCount: list.length,
        chaptersCount: allChaps.length,
        charactersCount: allChars.length,
      });
    } catch {
      showError(
        'Unable to load workspace information.'
      );
    }
  };

  const showSuccess = (message: string) => {
    setToast(message);
    setErrorToast('');

    window.setTimeout(
      () => setToast(''),
      3500
    );
  };

  const showError = (message: string) => {
    setErrorToast(message);
    setToast('');

    window.setTimeout(
      () => setErrorToast(''),
      4000
    );
  };

  const handleSaveAutoSave = () => {
    localStorage.setItem(
      'notter_autosave_ms',
      autoSaveMs.toString()
    );

    showSuccess(
      'Auto-save preference saved.'
    );
  };

  const handleSaveKey = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !apiKeyInput.trim() &&
      providerId !== 'ollama' &&
      providerId !== 'lmstudio'
    ) {
      showError(
        'Please enter a valid API key.'
      );
      return;
    }

    const newKeyRecord: ApiKeyRecord = {
      id: `key_${Date.now()}`,
      provider_id: providerId,
      name:
        keyName.trim() ||
        `${providerId.toUpperCase()} Key`,
      api_key_encrypted:
        apiKeyInput.trim(),
      default_model:
        modelInput.trim() || 'default',
      is_default:
        apiKeys.length === 0,
    };

    const nextKeys = [
      newKeyRecord,
      ...apiKeys,
    ];

    localStorage.setItem(
      'notter_byok_keys',
      JSON.stringify(nextKeys)
    );

    setApiKeys(nextKeys);
    setShowAddForm(false);
    setApiKeyInput('');

    showSuccess(
      'API key saved locally.'
    );
  };

  const handleDeleteKey = (
    id: string
  ) => {
    const nextKeys =
      apiKeys.filter(
        (key) => key.id !== id
      );

    localStorage.setItem(
      'notter_byok_keys',
      JSON.stringify(nextKeys)
    );

    setApiKeys(nextKeys);

    showSuccess('API key removed.');
  };

  const handleExportWorkspace =
    async () => {
      try {
        const jsonStr =
          await indexedDBAdapter.exportFullWorkspaceJSON();

        const blob = new Blob(
          [jsonStr],
          {
            type: 'application/json',
          }
        );

        const url =
          URL.createObjectURL(blob);

        const a =
          document.createElement('a');

        a.href = url;
        a.download = `notter-workspace-${new Date()
          .toISOString()
          .substring(0, 10)}.json`;

        a.click();

        URL.revokeObjectURL(url);

        showSuccess(
          'Workspace backup exported.'
        );
      } catch {
        showError(
          'Workspace export failed.'
        );
      }
    };

  const handleExportSingleBook =
    async () => {
      if (!selectedBookToExport) {
        return;
      }

      try {
        const jsonStr =
          await indexedDBAdapter.exportSingleBookJSON(
            selectedBookToExport
          );

        const blob = new Blob(
          [jsonStr],
          {
            type: 'application/json',
          }
        );

        const url =
          URL.createObjectURL(blob);

        const a =
          document.createElement('a');

        a.href = url;

        a.download = `notter-book-${selectedBookToExport}-${new Date()
          .toISOString()
          .substring(0, 10)}.json`;

        a.click();

        URL.revokeObjectURL(url);

        showSuccess(
          'Book backup exported.'
        );
      } catch {
        showError(
          'Book export failed.'
        );
      }
    };

  const handleImportJSON = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    const reader =
      new FileReader();

    reader.onload = async (
      event
    ) => {
      const content =
        event.target?.result as string;

      if (!content) {
        return;
      }

      try {
        let success = false;

        if (
          content.includes(
            '2.0-single-book'
          )
        ) {
          success =
            await indexedDBAdapter.importSingleBookJSON(
              content
            );
        } else {
          success =
            await indexedDBAdapter.importFullWorkspaceJSON(
              content
            );
        }

        if (success) {
          showSuccess(
            'Backup restored successfully.'
          );

          window.setTimeout(
            () => window.location.reload(),
            1000
          );
        } else {
          showError(
            'The backup file could not be imported.'
          );
        }
      } catch {
        showError(
          'Invalid backup file.'
        );
      }
    };

    reader.readAsText(file);

    e.target.value = '';
  };

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">
      {/* Page Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666672]">
              <Settings2 className="h-3.5 w-3.5" />
              Workspace
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Settings
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#71717a]">
              Configure how Notter saves,
              connects to AI, and manages
              your workspace.
            </p>
          </div>
        </div>
      </header>

      {/* Notifications */}
      {(toast || errorToast) && (
        <div className="mb-6">
          {toast && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{toast}</span>

              <button
                onClick={() => setToast('')}
                className="ml-auto text-emerald-400/60 hover:text-emerald-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {errorToast && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorToast}</span>

              <button
                onClick={() =>
                  setErrorToast('')
                }
                className="ml-auto text-red-400/60 hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[210px_minmax(0,1fr)]">
        {/* Settings Navigation */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <nav className="space-y-1">
            {SETTINGS_NAV.map((item) => {
              const Icon = item.icon;
              const active =
                activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() =>
                    setActiveTab(
                      item.id as SettingsTab
                    )
                  }
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                    active
                      ? 'bg-[#18151f] text-white'
                      : 'text-[#71717a] hover:bg-[#121216] hover:text-[#d4d4d8]'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      active
                        ? 'bg-[#7c3aed]/15 text-[#a78bfa]'
                        : 'bg-[#151519] text-[#55555f] group-hover:text-[#8e8e98]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium">
                      {item.label}
                    </div>

                    <div className="mt-0.5 truncate text-[10px] text-[#52525b]">
                      {item.description}
                    </div>
                  </div>

                  {active && (
                    <ChevronRight className="h-3.5 w-3.5 text-[#8b5cf6]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Privacy Notice */}
          <div className="mt-6 rounded-xl border border-[#202026] bg-[#101014] p-3">
            <ShieldCheck className="mb-2 h-4 w-4 text-emerald-400" />

            <p className="text-[10px] leading-relaxed text-[#62626c]">
              Your workspace is stored locally
              in your browser. Notter does not
              need your AI keys to provide the
              application.
            </p>
          </div>
        </aside>

        {/* Settings Content */}
        <section className="min-w-0">
          {/* GENERAL */}
          {activeTab === 'autosave' && (
            <SettingsSection
              icon={Timer}
              iconClass="text-[#a78bfa]"
              title="General"
              description="Control how Notter handles your writing workspace."
            >
              <div className="space-y-6">
                <SettingRow
                  title="Auto-save"
                  description="Automatically save your active chapter while you write."
                >
                  <select
                    value={autoSaveMs}
                    onChange={(e) =>
                      setAutoSaveMs(
                        parseInt(
                          e.target.value,
                          10
                        )
                      )
                    }
                    className="w-full rounded-lg border border-[#292932] bg-[#101014] px-3 py-2 text-sm text-white outline-none transition focus:border-[#7c3aed] sm:w-64"
                  >
                    <option value={500}>
                      Every 500ms
                    </option>
                    <option value={1000}>
                      Every 1 second
                    </option>
                    <option value={2000}>
                      Every 2 seconds
                    </option>
                  </select>
                </SettingRow>

                <div className="border-t border-[#202026]" />

                <SettingRow
                  title="Current setting"
                  description="Your selected auto-save interval."
                >
                  <span className="rounded-lg border border-[#292932] bg-[#151519] px-3 py-2 text-xs font-medium text-[#a1a1aa]">
                    {autoSaveMs < 1000
                      ? `${autoSaveMs}ms`
                      : `${autoSaveMs / 1000}s`}
                  </span>
                </SettingRow>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={
                      handleSaveAutoSave
                    }
                    className="rounded-lg bg-[#7c3aed] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#6d28d9]"
                  >
                    Save changes
                  </button>
                </div>
              </div>
            </SettingsSection>
          )}

          {/* AI */}
          {activeTab === 'ai' && (
            <SettingsSection
              icon={Sparkles}
              iconClass="text-amber-400"
              title="AI Providers"
              description="Connect your own AI providers and models."
              action={
                <button
                  onClick={() =>
                    setShowAddForm(
                      (current) =>
                        !current
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#7c3aed] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#6d28d9]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add provider
                </button>
              }
            >
              <div className="space-y-5">
                <div className="rounded-xl border border-[#202026] bg-[#101014] p-4">
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />

                    <div>
                      <p className="text-xs font-medium text-[#d4d4d8]">
                        Bring your own key
                      </p>

                      <p className="mt-1 text-[11px] leading-relaxed text-[#62626c]">
                        Keys are stored locally in
                        your browser and are used
                        to communicate directly with
                        the provider you select.
                      </p>
                    </div>
                  </div>
                </div>

                {showAddForm && (
                  <form
                    onSubmit={
                      handleSaveKey
                    }
                    className="rounded-xl border border-[#292932] bg-[#101014] p-5"
                  >
                    <div className="mb-5">
                      <h3 className="text-sm font-semibold text-white">
                        Add AI provider
                      </h3>

                      <p className="mt-1 text-[11px] text-[#62626c]">
                        Add a provider and model
                        for AI features.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Provider">
                        <select
                          value={providerId}
                          onChange={(e) => {
                            const id =
                              e.target.value;

                            setProviderId(id);

                            const provider =
                              PROVIDERS.find(
                                (p) =>
                                  p.id === id
                              );

                            if (provider) {
                              setModelInput(
                                provider.defaultModel
                              );
                            }
                          }}
                          className={inputClass}
                        >
                          {PROVIDERS.map(
                            (provider) => (
                              <option
                                key={
                                  provider.id
                                }
                                value={
                                  provider.id
                                }
                              >
                                {provider.name}
                              </option>
                            )
                          )}
                        </select>
                      </Field>

                      <Field label="Key name">
                        <input
                          value={keyName}
                          onChange={(e) =>
                            setKeyName(
                              e.target.value
                            )
                          }
                          placeholder="My personal key"
                          className={inputClass}
                        />
                      </Field>

                      <Field label="API key">
                        <input
                          type="password"
                          value={apiKeyInput}
                          onChange={(e) =>
                            setApiKeyInput(
                              e.target.value
                            )
                          }
                          placeholder={
                            PROVIDERS.find(
                              (p) =>
                                p.id ===
                                providerId
                            )?.placeholder
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Default model">
                        <input
                          value={modelInput}
                          onChange={(e) =>
                            setModelInput(
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </Field>
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setShowAddForm(
                            false
                          )
                        }
                        className="rounded-lg border border-[#292932] px-3 py-2 text-xs font-medium text-[#71717a] transition hover:text-white"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="rounded-lg bg-[#7c3aed] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#6d28d9]"
                      >
                        Save provider
                      </button>
                    </div>
                  </form>
                )}

                <div>
                  <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#52525b]">
                    Connected providers
                  </div>

                  {apiKeys.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#292932] px-5 py-10 text-center">
                      <Sparkles className="mx-auto mb-3 h-5 w-5 text-[#3f3f46]" />

                      <p className="text-xs font-medium text-[#71717a]">
                        No AI providers connected
                      </p>

                      <p className="mt-1 text-[10px] text-[#4f4f58]">
                        Add a provider to enable
                        AI features.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {apiKeys.map(
                        (key) => (
                          <div
                            key={key.id}
                            className="flex items-center gap-3 rounded-xl border border-[#202026] bg-[#101014] px-4 py-3"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#18151f]">
                              <Sparkles className="h-4 w-4 text-[#a78bfa]" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium text-[#d4d4d8]">
                                {key.name}
                              </p>

                              <p className="mt-0.5 truncate font-mono text-[10px] text-[#52525b]">
                                {key.provider_id.toUpperCase()}{' '}
                                ·{' '}
                                {
                                  key.default_model
                                }
                              </p>
                            </div>

                            <button
                              onClick={() =>
                                handleDeleteKey(
                                  key.id
                                )
                              }
                              className="rounded-lg p-2 text-[#52525b] transition hover:bg-red-500/10 hover:text-red-400"
                              title="Remove provider"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </SettingsSection>
          )}

          {/* BACKUP */}
          {activeTab === 'backup' && (
            <SettingsSection
              icon={HardDrive}
              iconClass="text-emerald-400"
              title="Backup & Data"
              description="Export, restore, and manage your local workspace."
            >
              <div className="space-y-4">
                <DataCard
                  icon={Download}
                  title="Full workspace"
                  description="Export all books, chapters, Story Bible data, and workspace information."
                  action={
                    <button
                      onClick={
                        handleExportWorkspace
                      }
                      className={primaryButton}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export workspace
                    </button>
                  }
                />

                <DataCard
                  icon={BookOpen}
                  title="Single book"
                  description="Export one book and all of its related data."
                  action={
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        value={
                          selectedBookToExport
                        }
                        onChange={(e) =>
                          setSelectedBookToExport(
                            e.target.value
                          )
                        }
                        className="rounded-lg border border-[#292932] bg-[#101014] px-3 py-2 text-xs text-white outline-none"
                      >
                        {books.length ===
                        0 ? (
                          <option value="">
                            No books available
                          </option>
                        ) : (
                          books.map(
                            (book) => (
                              <option
                                key={
                                  book.id
                                }
                                value={
                                  book.id
                                }
                              >
                                {
                                  book.title
                                }
                              </option>
                            )
                          )
                        )}
                      </select>

                      <button
                        onClick={
                          handleExportSingleBook
                        }
                        disabled={
                          !selectedBookToExport
                        }
                        className={secondaryButton}
                      >
                        Export
                      </button>
                    </div>
                  }
                />

                <DataCard
                  icon={Upload}
                  title="Restore backup"
                  description="Import a previously exported Notter JSON backup."
                  action={
                    <label className={secondaryButton}>
                      <Upload className="h-3.5 w-3.5" />
                      Choose JSON

                      <input
                        type="file"
                        accept=".json"
                        onChange={
                          handleImportJSON
                        }
                        className="hidden"
                      />
                    </label>
                  }
                />

                <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/[0.035] p-5">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-semibold text-red-300">
                        Danger zone
                      </h3>

                      <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-[#71717a]">
                        Remove extracted Story
                        Bible data from a book
                        without deleting its written
                        chapter text.
                      </p>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <select
                          value={
                            selectedBookToExport
                          }
                          onChange={(e) =>
                            setSelectedBookToExport(
                              e.target.value
                            )
                          }
                          className="rounded-lg border border-[#292932] bg-[#101014] px-3 py-2 text-xs text-white outline-none"
                        >
                          <option value="">
                            Select book
                          </option>

                          {books.map(
                            (book) => (
                              <option
                                key={
                                  book.id
                                }
                                value={
                                  book.id
                                }
                              >
                                {
                                  book.title
                                }
                              </option>
                            )
                          )}
                        </select>

                        <button
                          onClick={async () => {
                            if (
                              !selectedBookToExport
                            ) {
                              return;
                            }

                            const targetBook =
                              books.find(
                                (book) =>
                                  book.id ===
                                  selectedBookToExport
                              );

                            const title =
                              targetBook?.title ||
                              'this book';

                            if (
                              confirm(
                                `PURGE STORY BIBLE WARNING:\n\nThis will permanently delete all extracted Story Bible data for "${title}".\n\nWritten chapter text will NOT be deleted.\n\nProceed?`
                              )
                            ) {
                              await repository.purgeBookStoryBibleData(
                                selectedBookToExport
                              );

                              showSuccess(
                                `Story Bible data for "${title}" was purged.`
                              );

                              loadBooksAndStats();
                            }
                          }}
                          disabled={
                            !selectedBookToExport
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Purge data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SettingsSection>
          )}

          {/* SHORTCUTS */}
          {activeTab === 'shortcuts' && (
            <SettingsSection
              icon={Keyboard}
              iconClass="text-cyan-400"
              title="Keyboard Shortcuts"
              description="Quick controls for writing and navigation."
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  {
                    key: 'Ctrl + K',
                    action:
                      'Open Universal Story Bible Search',
                  },
                  {
                    key: 'Ctrl + S',
                    action:
                      'Force Auto-Save Active Chapter',
                  },
                  {
                    key: 'Ctrl + Shift + Z',
                    action:
                      'Toggle Full-Screen Zen Mode',
                  },
                  {
                    key: 'Ctrl + Shift + E',
                    action:
                      'Trigger AI Chapter Extraction',
                  },
                  {
                    key: 'Ctrl + B',
                    action:
                      'Toggle Sidebar Collapse',
                  },
                  {
                    key: 'Esc',
                    action:
                      'Close Active Modals or Overlay',
                  },
                ].map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between gap-4 rounded-xl border border-[#202026] bg-[#101014] px-4 py-3"
                  >
                    <span className="text-xs text-[#a1a1aa]">
                      {shortcut.action}
                    </span>

                    <kbd className="shrink-0 rounded-md border border-[#292932] bg-[#18181d] px-2 py-1 font-mono text-[10px] font-semibold text-[#a78bfa]">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </SettingsSection>
          )}

          {/* DIAGNOSTICS */}
          {activeTab === 'info' && (
            <SettingsSection
              icon={Info}
              iconClass="text-amber-400"
              title="Diagnostics"
              description="Information about your current Notter workspace."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard
                  label="Books"
                  value={
                    storageStats.booksCount
                  }
                />

                <StatCard
                  label="Chapters"
                  value={
                    storageStats.chaptersCount
                  }
                />

                <StatCard
                  label="Characters"
                  value={
                    storageStats.charactersCount
                  }
                />
              </div>

              <div className="mt-6 rounded-xl border border-[#202026] bg-[#101014] p-5">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />

                  <div>
                    <h3 className="text-xs font-semibold text-[#d4d4d8]">
                      Local workspace
                    </h3>

                    <p className="mt-1 text-[11px] leading-relaxed text-[#62626c]">
                      Your current workspace
                      contains{' '}
                      {
                        storageStats.booksCount
                      }{' '}
                      book
                      {storageStats.booksCount !==
                      1
                        ? 's'
                        : ''}{' '}
                      and{' '}
                      {
                        storageStats.chaptersCount
                      }{' '}
                      chapter
                      {storageStats.chaptersCount !==
                      1
                        ? 's'
                        : ''}
                      .
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl border border-[#202026] bg-[#101014] px-4 py-3">
                <div>
                  <p className="text-xs font-medium text-[#a1a1aa]">
                    Application version
                  </p>

                  <p className="mt-0.5 text-[10px] text-[#52525b]">
                    Current development build
                  </p>
                </div>

                <span className="rounded-md border border-[#292932] bg-[#18181d] px-2 py-1 font-mono text-[10px] text-[#71717a]">
                  ALPHA
                </span>
              </div>
            </SettingsSection>
          )}
        </section>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Reusable UI                                                                 */
/* -------------------------------------------------------------------------- */

const inputClass =
  'w-full rounded-lg border border-[#292932] bg-[#101014] px-3 py-2 text-sm text-white outline-none transition placeholder:text-[#45454e] focus:border-[#7c3aed]';

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[#7c3aed] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-40';

const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-[#292932] bg-[#151519] px-3 py-2 text-xs font-semibold text-[#d4d4d8] transition hover:border-[#3a3a45] hover:bg-[#1b1b21] disabled:cursor-not-allowed disabled:opacity-40';

function SettingsSection({
  icon: Icon,
  iconClass,
  title,
  description,
  action,
  children,
}: {
  icon: React.ElementType;
  iconClass: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#202026] bg-[#0f0f13]">
      <div className="flex items-start justify-between gap-4 border-b border-[#202026] px-5 py-5 sm:px-6">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#18181d]">
            <Icon
              className={`h-4 w-4 ${iconClass}`}
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">
              {title}
            </h2>

            <p className="mt-1 text-[11px] leading-relaxed text-[#62626c]">
              {description}
            </p>
          </div>
        </div>

        {action}
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </div>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#d4d4d8]">
          {title}
        </p>

        <p className="mt-1 max-w-lg text-[11px] leading-relaxed text-[#62626c]">
          {description}
        </p>
      </div>

      <div className="shrink-0">
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-[#62626c]">
        {label}
      </span>

      {children}
    </label>
  );
}

function DataCard({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#202026] bg-[#101014] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#18181d]">
          <Icon className="h-4 w-4 text-[#8b8b96]" />
        </div>

        <div className="min-w-0">
          <h3 className="text-xs font-semibold text-[#d4d4d8]">
            {title}
          </h3>

          <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-[#62626c]">
            {description}
          </p>
        </div>
      </div>

      <div className="shrink-0">
        {action}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-[#202026] bg-[#101014] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#52525b]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

