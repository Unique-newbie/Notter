<div align="center">

  <img src="public/logo-icon.png" alt="NotterPad Logo" width="120" height="120" />

  # NotterPad

  **The Offline-First Story Bible for Novel Writers.**

  [![Website](https://img.shields.io/badge/Website-notterpad.in-7c3aed?style=flat-square)](https://notterpad.in)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
  [![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Offline First](https://img.shields.io/badge/Offline--First-100%25-brightgreen?style=flat-square)]()
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

  <p align="center">
    Organize novels, build living Story Bibles, track plot timelines, and audit story continuity—100% locally in your browser.
  </p>

</div>

---

## Short Introduction

**NotterPad** is a privacy-first, offline-first fiction knowledge engine and distraction-free writing environment built for authors writing complex novels, fantasy epics, and multi-book series.

Unlike traditional cloud-based writing software or AI generators, NotterPad keeps all manuscript data and Story Bible entities strictly on your device inside browser IndexedDB storage. It never uploads your creative work to external servers.

---

## Mission Statement

NotterPad empowers authors to maintain the canonical truth of their story world without sacrificing privacy or ownership.

**What NotterPad IS:**
- A local-first continuity engine and living Story Bible.
- A distraction-free writing tool with Zen Mode and Sprint writing sessions.
- An intelligent fact extraction tool that reads your prose and drafts character, item, location, and plot updates for your review.

**What NotterPad IS NOT:**
- NotterPad does **NOT** write chapters for you.
- NotterPad does **NOT** rewrite your prose or generate creative text.
- NotterPad does **NOT** store data on cloud servers or require a user account.
- NotterPad does **NOT** train AI models on your work.

The author always writes the prose. AI only extracts structured facts with explicit author approval.

---

## Screenshots

> *Interface mockups and screenshots:*

| Manuscript Editor & Zen Writing Pad | Living Story Bible & Character Codex |
|:---:|:---:|
| ![Manuscript Editor](public/logo-full.png) | ![Story Bible Codex](public/logo-full.png) |
| **Interactive Knowledge Graph** | **Timeline Visualizer & Canon Audit** |
| ![Knowledge Graph](public/logo-full.png) | ![Timeline Visualizer](public/logo-full.png) |

---

## Core Features

- **Manuscript Editor & Zen Mode:** Distraction-free chapter writing with word count analytics, reading time metrics, auto-save, and full-screen Zen Pad.
- **Sprint Mode 2.0:** Gamified timed and word-target writing sprints with real-time WPM metrics and session history logs.
- **Story Bible Codex:** Structured local database for Characters, Abilities, Items, Locations, Organizations, Relationships, and Dialogue Commitments.
- **Interactive Knowledge Graph:** D3/SVG entity network visualization rendering connections across characters, items, and locations.
- **Timeline Visualizer:** Chronological plot event tracker mapping chapter numbers, character involvement, and key story milestones.
- **Canon Inspector & Audit Engine:** Automated rule-based continuity validator checking for orphaned entities, unlinked characters, and timeline conflicts.
- **Universal Duplicate & Merge Engine:** Conflict-resolution engine for merging duplicate characters, abilities, or items without losing historical lore.
- **BYOK AI Fact Extraction:** Bring Your Own Key AI extraction engine that analyzes raw chapter text and generates human-in-the-loop review receipts.
- **Manual Prompt & JSON Importer:** Export system prompts to ChatGPT/Gemini Web and import raw JSON extraction payloads directly.
- **Complete Workspace & Single Novel Backups:** Export and restore full workspaces or individual books as JSON files instantly.

---

## Feature Comparison

| Feature | Cloud Writing Software | AI Content Generators | NotterPad |
| :--- | :--- | :--- | :--- |
| **Data Storage** | Vendor Cloud Servers | Vendor Cloud Servers | **100% Local IndexedDB** |
| **AI Role** | None / Add-on | Generates Prose / Replaces Author | **Extraction & Analysis Only** |
| **Human Review** | N/A | Automated Overwrites | **Human-in-the-Loop Review Queue** |
| **Offline Capability** | Limited / Online Required | Online Required | **100% Native Offline** |
| **Data Ownership** | Proprietary Formats | Vendor Lock-in | **JSON Export & Absolute Control** |
| **Subscription** | $10–$30/month | $20–$50/month | **Free & Open Source (BYOK)** |
| **Privacy & Security** | Server Telemetry | Model Training | **Zero Cloud Telemetry / Zero Storage** |

---

## Offline-First Philosophy

NotterPad is designed to work seamlessly without an internet connection:
1. **Zero Database Servers:** All data (books, chapters, characters, timeline events, image Blobs) is persisted locally in browser IndexedDB across 12 object stores.
2. **BYOK Privacy:** The only network requests made by the application are direct client-side API calls to your chosen AI provider (if configured) during chapter extraction.
3. **No Auth Guards:** No login, no password recovery, no user sessions. Your data remains in your browser's local sandbox.

---

## Supported AI Providers

NotterPad uses a **Bring Your Own Key (BYOK)** model for optional AI extraction. Configure keys in **Settings & Keys**:

- **Google Gemini** (`gemini-2.5-flash`, `gemini-2.5-pro`)
- **OpenAI** (`gpt-4o`, `gpt-4o-mini`)
- **Anthropic Claude** (`claude-3-5-sonnet`, `claude-3-haiku`)
- **Groq** (`llama-3.3-70b-versatile`)
- **xAI Grok** (`grok-2`)
- **OpenRouter** (Access to 100+ open-weights models)
- **Local Ollama** (e.g. `http://localhost:11434` - zero internet required)
- **Local LM Studio** (e.g. `http://localhost:1234`)

---

## Quick Start & Installation

### Requirements
- **Node.js**: v18.x or higher
- **Package Manager**: `npm` (v9+) or `pnpm` / `yarn`

### Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/Unique-newbie/Notter.git
cd Notter

# 2. Install dependencies
npm install

# 3. Start the local development server
npm run dev
```

Open your browser and navigate to `http://localhost:3000`.

---

## Running Locally

### Development Mode
```bash
npm run dev
```

### Production Build & Launch
```bash
# Build production bundle
npm run build

# Start production server locally
npm run start
```

---

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router & Server Actions)
- **UI & Components:** [React 19](https://react.dev/), [TailwindCSS](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/)
- **Language:** [TypeScript 5.x](https://www.typescriptlang.org/)
- **Local Storage Engine:** Custom `IndexedDBAdapter` wrapping native `window.indexedDB` (12 object stores + WebP image Blobs)
- **Extraction & AI:** Native Fetch client connecting to BYOK REST endpoints with strict JSON schema validation

---

## Directory Structure

```text
Notter/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (dashboard)/             # Main dashboard layout routes
│   │   │   ├── about/               # About & local diagnostics
│   │   │   ├── analytics/           # Writing sprint analytics
│   │   │   ├── books/               # Novel management & entity codex routes
│   │   │   │   └── [bookId]/        # Book context routes (chapters, characters, etc.)
│   │   │   ├── dashboard/           # Home dashboard
│   │   │   └── settings/            # 6-tab settings control center
│   │   ├── api/                     # Local API routes (analyze-chapter, check-consistency)
│   │   ├── layout.tsx               # Root layout & SEO metadata
│   │   ├── manifest.ts              # Web App Manifest
│   │   ├── page.tsx                 # Root redirect
│   │   ├── robots.ts                # Dynamic robots.txt
│   │   └── sitemap.ts               # Dynamic sitemap.xml
│   ├── components/                  # UI Component tree
│   │   ├── ai/                      # AI Review modals & extraction receipts
│   │   ├── audit/                   # Canon audit & consistency report views
│   │   ├── character/               # Character codex components & merge modals
│   │   ├── common/                  # Media uploader, modals, command palette
│   │   ├── editor/                  # Zen writing pad & manuscript editor
│   │   ├── layout/                  # Sidebar, Header, Global Search
│   │   ├── sprint/                  # Sprint launcher & sprint mode pad
│   │   └── timeline/                # Timeline visualizer components
│   ├── lib/                         # Core logic & store adapters
│   │   ├── ai/                      # AI prompts, parsers, and schema validators
│   │   ├── storage/                 # IndexedDB storage adapter & image manager
│   │   ├── store/                   # Central repository pattern & sprintStore
│   │   └── utils.ts                 # Utility functions (word count, reading time)
│   └── types/                       # Core TypeScript data contracts
├── public/                          # Static assets and icons
├── README.md                        # Repository overview
├── ARCHITECTURE.md                  # System architecture documentation
├── FEATURES.md                      # Detailed feature breakdown
├── PRODUCT_PHILOSOPHY.md            # Product vision & privacy philosophy
├── INSTALLATION.md                  # Comprehensive setup guide
├── ROADMAP.md                       # Open source development roadmap
├── CONTRIBUTING.md                  # Contribution guidelines
├── CHANGELOG.md                     # Semantic versioning release history
├── FAQ.md                           # Frequently asked questions
├── SECURITY.md                      # Security policy & disclosure
├── SUPPORT.md                       # Community support channels
└── LICENSE                          # MIT License
```

---

## Project Architecture Overview

NotterPad uses a **Repository Pattern** over browser IndexedDB:

```
┌─────────────────────────────────────────────────────────────┐
│                    React 19 UI Components                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Reads / Writes
┌──────────────────────────────▼──────────────────────────────┐
│                Central Repository (repository.ts)           │
└──────────────────────────────┬──────────────────────────────┘
                               │ Transactions
┌──────────────────────────────▼──────────────────────────────┐
│             IndexedDB Storage Engine (12 Stores)            │
└─────────────────────────────────────────────────────────────┘
```

For complete technical documentation, data models, and Mermaid diagrams, read [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Roadmap Summary

- **v2.0 (Completed):** 100% Offline-First IndexedDB Engine, BYOK AI Extraction, 6-Tab Settings, Universal Merge Engine.
- **v2.1 (In Progress):** Advanced Graph Visual Filters, EPUB/Docx Export Presets.
- **v2.2 (Planned):** Local Vector Search for Lore, Custom Schema Fields.

For detailed milestones, see [ROADMAP.md](ROADMAP.md).

---

## Website & Links

- **Official Website:** [https://notterpad.in](https://notterpad.in)
- **Documentation:** [FEATURES.md](FEATURES.md) | [ARCHITECTURE.md](ARCHITECTURE.md) | [INSTALLATION.md](INSTALLATION.md)
- **GitHub Discussions:** [Join Discussions](https://github.com/Unique-newbie/Notter/discussions)
- **Issue Tracker:** [Report a Bug](https://github.com/Unique-newbie/Notter/issues)
- **Feature Requests:** [Request a Feature](https://github.com/Unique-newbie/Notter/issues/new?template=feature_request.md)

---

## Contributing

We welcome open-source contributions! Whether fixing a bug, improving documentation, or proposing a feature, please review our [CONTRIBUTING.md](CONTRIBUTING.md) guide before submitting a Pull Request.

---

## License

NotterPad is licensed under the [MIT License](LICENSE). Free for personal and commercial use.

---

## Support & Community

If you encounter issues or have questions:
- Read the [FAQ](FAQ.md).
- Visit the [Support Guide](SUPPORT.md).
- Check security guidelines in [SECURITY.md](SECURITY.md).

---

## Acknowledgements

Built with passion for writers and storytellers worldwide. Special thanks to the open-source communities behind Next.js, React, TailwindCSS, and Lucide React.
