<div align="center">

# NotterPad

**The Offline-First Story Bible for Novel Writers.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Offline First](https://img.shields.io/badge/Offline--First-100%25-brightgreen)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)]()

</div>

---

## 🎯 Mission Statement

NotterPad is designed for authors who value continuity, privacy, and control. Our core philosophy is simple: **The author writes the prose; the tool manages the complexity.** We leverage AI strictly for structured extraction of facts from your manuscript—never for generating creative content. You maintain absolute control over your story world.

## 📸 Screenshots

> *Screenshots coming soon...*
>
> | Manuscript Editor | Story Bible Codex |
> |:---:|:---:|
> | <!-- Image placeholder: ![Manuscript Editor](./docs/assets/editor.png) --> | <!-- Image placeholder: ![Story Bible](./docs/assets/codex.png) --> |
> | Knowledge Graph | Sprint Mode |
> | <!-- Image placeholder: ![Knowledge Graph](./docs/assets/graph.png) --> | <!-- Image placeholder: ![Sprint Mode](./docs/assets/sprint.png) --> |

## ✨ Core Features

- **Manuscript Editor:** A distraction-free environment tailored for long-form fiction writing.
- **Story Bible Codex:** A deterministic database tracking Characters, Abilities, Items, Locations, Organizations, Relationships, and Dialogue Facts.
- **Knowledge Graph:** Interactive visual representation of how entities in your story interconnect.
- **Timeline Visualizer:** Track chronological events and character arcs with precision.
- **Sprint Mode:** Gamified writing sprints with analytics to boost productivity.
- **Canon Inspector:** An audit engine to detect continuity errors and logical inconsistencies.
- **Merge Engine:** A universal system for detecting and resolving duplicate entries across your codex.
- **BYOK AI Extraction:** Bring Your Own Key AI integration that intelligently reads your chapters and extracts structured facts, placing them in a review queue for your approval.

## ⚖️ Feature Comparison

| Feature | Cloud Apps | NotterPad |
|---------|------------|-----------|
| **Storage** | Cloud DB | Local IndexedDB |
| **AI Role** | Often generative / writing prose | Extraction & analysis only |
| **Cost** | Monthly subscription | Free & Open Source (Bring Your Own Key) |
| **Privacy** | Data harvested / used for training | 100% Local / Zero telemetry |
| **Offline Support** | Spotty / Requires connectivity | Native Offline-First |
| **Data Ownership** | Vendor lock-in | JSON export / Absolute ownership |

## 🔌 Supported AI Providers

Bring Your Own Key (BYOK) allows you to use your preferred LLM provider for fact extraction without subscriptions:
- Gemini
- OpenAI
- Anthropic (Claude)
- Groq
- xAI (Grok)
- OpenRouter
- Ollama (Local)
- LM Studio (Local)

## 🚀 Quick Start

Ensure you have Node.js 18+ and `npm` installed.

```bash
# Clone the repository
git clone https://github.com/unique-newbie/notter.git
cd notter

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Storage:** IndexedDB (via localforage / Dexie)

## 📁 Repository Structure

```text
notter/
├── app/               # Next.js App Router pages and API routes
├── components/        # React UI components
├── lib/               # Utility functions and core business logic
├── hooks/             # Custom React hooks
├── store/             # State management and IndexedDB adapters
├── types/             # TypeScript definitions
└── public/            # Static assets
```

## 📚 Documentation

Dive deeper into the architecture and philosophy of NotterPad:

- [Product Philosophy](PRODUCT_PHILOSOPHY.md) - Our vision and core principles.
- [Features Breakdown](FEATURES.md) - Detailed technical explanations of core systems.
- [Architecture](ARCHITECTURE.md) - System design and data flow.
- [Installation Guide](INSTALLATION.md) - Advanced setup and deployment options.
- [Roadmap](ROADMAP.md) - Upcoming features and milestones.

## 🤝 Contributing

We welcome contributions! Please check our [Contributing Guidelines](CONTRIBUTING.md) to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
