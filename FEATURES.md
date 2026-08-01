# Features Breakdown

This document provides a technical overview of NotterPad's core systems, detailing their purpose, implementation, and future trajectory.

## 1. Manuscript Editor
- **Purpose:** A distraction-free environment tailored for long-form fiction.
- **Why it exists:** Authors need a reliable, responsive editor integrated directly with their reference materials.
- **Access:** Primary workspace view.
- **Under the hood:** Built with React, leveraging local state synchronized with IndexedDB. Handles chapters as distinct units of text.
- **Status:** Functional.
- **Future Improvements:** Rich text support, split-screen viewing, collaborative editing (via CRDTs for local networks).

## 2. Story Bible Codex
- **Purpose:** The central repository for all story entities (Characters, Abilities, Items, Locations, Organizations, Relationships, Dialogue Facts).
- **Why it exists:** To prevent continuity errors and provide instant recall of story details.
- **Access:** Via the 'Codex' or 'Story Bible' navigation tab.
- **Under the hood:** A relational layer built on top of IndexedDB, mapping entities via unique IDs.
- **Status:** Core entities implemented.
- **Future Improvements:** Custom entity types, advanced filtering, nested hierarchies.

## 3. Interactive Knowledge Graph
- **Purpose:** Visualizes the interconnected nature of the story universe.
- **Why it exists:** Some authors are visual thinkers; a graph reveals structural weaknesses or unexplored connections.
- **Access:** 'Graph' view in the Codex.
- **Under the hood:** Utilizes D3.js or react-force-graph to render nodes (entities) and edges (relationships) dynamically based on the IndexedDB data.
- **Status:** Conceptual / Initial prototype.
- **Future Improvements:** Interactive node editing, temporal filtering (show graph at chapter X).

## 4. Timeline Visualizer
- **Purpose:** Tracks chronological events and character arcs.
- **Why it exists:** To ensure pacing is correct and events occur in logical sequence.
- **Access:** 'Timeline' tab.
- **Under the hood:** Sorts fact nodes chronologically. Maps entity lifespans against the global narrative timeline.
- **Status:** Planned.
- **Future Improvements:** Drag-and-drop event reordering, parallel timeline tracks for different POVs.

## 5. Sprint Mode 2.0
- **Purpose:** Gamified writing sessions to boost word count.
- **Why it exists:** To overcome writer's block and build consistent writing habits.
- **Access:** 'Sprint' button in the editor.
- **Under the hood:** A custom React hook (`sprintStore`) managing timers, word count deltas, and session analytics.
- **Status:** Basic timer and word count tracking implemented.
- **Future Improvements:** Historical sprint analytics, heatmaps, customizable sprint goals.

## 6. Canon Inspector & Audit Engine
- **Purpose:** Detects continuity errors and logical inconsistencies.
- **Why it exists:** To catch mistakes before the editor or reader does.
- **Access:** 'Audit' menu.
- **Under the hood:** Uses a deterministic rules engine combined with targeted LLM queries (`/api/check-consistency`) to compare the manuscript text against the canonical facts in the database.
- **Status:** Prototype.
- **Future Improvements:** Real-time inline warnings in the editor, cross-book consistency checking.

## 7. Duplicate Detector & Universal Merge Engine
- **Purpose:** Cleans up redundant entries in the Story Bible.
- **Why it exists:** AI extraction can sometimes create duplicate entities (e.g., "Jon" and "Jonathan").
- **Access:** 'Maintenance' or within the review queue.
- **Under the hood:** String similarity algorithms (Levenshtein distance) flag potential duplicates, presenting a UI to merge properties safely.
- **Status:** Basic implementation.
- **Future Improvements:** Automated background deduplication suggestions.

## 8. Manual Prompt / Raw JSON Importer
- **Purpose:** Allows power users to inject bulk data or use custom extraction prompts.
- **Why it exists:** To provide maximum flexibility and avoid lock-in.
- **Access:** Settings -> Import/Export.
- **Under the hood:** JSON schema validation ensures imported data adheres to the internal database structure before committing.
- **Status:** Functional.
- **Future Improvements:** Support for importing from other writing software formats.

## 9. Offline Storage & Backup/Restore
- **Purpose:** Ensures data safety without relying on cloud infrastructure.
- **Why it exists:** Core tenet of the Offline-First philosophy.
- **Access:** Automatic; Manual backup available in Settings.
- **Under the hood:** `IndexedDBAdapter` manages persistence. Backup serializes the entire DB to a downloaded JSON file.
- **Status:** Functional.
- **Future Improvements:** Automated scheduled local backups, encrypted backups.

## 10. BYOK AI Extraction Engine
- **Purpose:** Analyzes chapters to extract structured facts.
- **Why it exists:** To automate the tedious updating of the Story Bible.
- **Access:** 'Analyze Chapter' button.
- **Under the hood:** Hits `/api/analyze-chapter`. Manages API keys securely in local storage. Handles rate limiting and JSON parsing from various LLM providers.
- **Status:** Functional with OpenAI/Gemini.
- **Future Improvements:** Support for more local models, streaming extraction results.

## 11. Consolidated Settings & Themes
- **Purpose:** Personalization of the writing environment.
- **Why it exists:** Aesthetics and comfort are crucial for long writing sessions.
- **Access:** Settings menu.
- **Under the hood:** React context or global store managing CSS variables and user preferences.
- **Status:** Basic themes implemented.
- **Future Improvements:** Advanced typography controls, custom color palettes.
