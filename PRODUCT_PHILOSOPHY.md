# Product Philosophy

NotterPad is built upon a strict set of principles that prioritize the author's autonomy, privacy, and creative control. This document outlines the philosophical foundation of the project.

## What NotterPad IS vs What It IS NOT

### What It IS
- **An intelligent assistant:** It automates the tedious task of maintaining a story bible by extracting structured facts.
- **A continuity manager:** It helps you detect plot holes and inconsistencies across large manuscripts.
- **A deterministic database:** Your story facts are stored relationally and are fully queryable.
- **A local-first application:** Your data lives on your device.

### What It IS NOT
- **A prose generator:** NotterPad will never write your story for you. There is no "continue writing" button.
- **A cloud-dependent service:** It does not require a constant internet connection or a centralized database.
- **A subscription trap:** The software is open-source; you only pay for the API calls you make via your own keys.

## Core Principles

### 1. Offline-First
A writer's flow should never be interrupted by server outages or poor Wi-Fi. The core application, manuscript editor, and story bible must function flawlessly offline. All data is persisted locally in IndexedDB.

### 2. Privacy-First
Your manuscript is your intellectual property. By storing data locally and supporting local LLMs (like Ollama), NotterPad ensures that your unpublished work is never exposed to third-party servers unless you explicitly choose to use a cloud API.

### 3. Author Control
The author is the final arbiter of truth. Automation exists to suggest and extract, but never to finalize. Every extracted fact, character update, or timeline shift must be explicitly approved by the user.

### 4. Deterministic Story Bible
Unlike chaotic text documents, the NotterPad Story Bible is structured. A character's age, abilities, and relationships are stored as distinct data points, allowing for precise querying, timeline visualization, and consistency checks.

### 5. Zero Cloud Dependencies
We reject vendor lock-in. NotterPad is designed to be fully self-contained. Exporting and importing your complete workspace as a standard JSON file ensures your data outlives the tool itself.

## AI as an Extraction Engine, Not a Generator

Generative AI in creative writing often results in homogenized prose and loss of authorial voice. NotterPad strictly limits AI usage to **structured data extraction**. 

When an author runs analysis on a chapter, the AI is prompted to return JSON payloads containing facts, entity relationships, and state changes. It is strictly forbidden from generating creative text. This ensures the AI acts as an overzealous librarian rather than a ghostwriter.

## Human-in-the-Loop Review Model

To maintain the integrity of the Story Bible, NotterPad employs a Human-in-the-Loop (HITL) model:
1. **Extraction:** The AI analyzes a chapter and identifies potential facts.
2. **Review Queue:** The facts are placed in a staging area.
3. **Approval:** The author reviews the suggestions, editing or discarding them as necessary.
4. **Commit:** Only upon approval are the facts permanently committed to the Story Bible.

## Long-Term Vision

Our vision is to become the definitive open-source standard for fiction continuity management. As manuscripts grow into multi-book series, maintaining continuity becomes exponentially difficult. NotterPad aims to solve this scaling problem, allowing authors to focus entirely on the art of storytelling while the software manages the underlying architecture of their universe.
