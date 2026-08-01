# System Architecture

This document provides a high-level overview of the NotterPad system architecture, its component layers, and the interactions between them.

## High-Level Architecture

NotterPad is designed as a local-first, offline-capable web application. The architecture is heavily modularized to ensure maintainability and testability. The application is conceptually divided into three main tiers:

1.  **Presentation Tier (UI)**: React components and views.
2.  **Business Logic Tier**: State management, AI extraction pipelines, rule engines, and data processing.
3.  **Data Tier**: Local storage management via IndexedDB.

## Component Layers

### 1. Presentation Layer (React)
-   **Components**: Reusable, stateless UI components.
-   **Views/Pages**: Stateful components representing distinct screens in the application.
-   **Hooks**: React hooks used to interface with the State Layer.

### 2. State Management Layer (Stores)
-   Responsible for holding the application's current state in memory.
-   Acts as the intermediary between the Presentation Layer and the Data Access Layer.
-   Ensures UI components reactively update when data changes.

### 3. Business Logic Engines
-   **AI Extraction Engine**: Manages communication with external AI providers using the BYOK model. Handles prompt construction, request execution, and parsing structured JSON responses into application entities.
-   **Canon Engine**: Evaluates story consistency against a defined "Bible" of rules and established facts.
-   **Merge Engine**: Detects duplicates and manages the resolution of conflicting entity data.
-   **Import/Export Engine**: Handles serialization of the workspace for backups and deserialization for restoration.

### 4. Data Access Layer (Repositories)
-   Provides an abstraction over IndexedDB.
-   Each primary entity type has a corresponding Repository that implements standard CRUD operations and custom queries.
-   Hides the complexity of IndexedDB transactions and asynchronous database operations from the higher layers.

### 5. Storage Layer (IndexedDB)
-   The underlying browser-based database.
-   Manages 12 specific object stores for different data domains (novels, characters, locations, blobs, etc.).

## Data Flow Diagrams

### Core Entity Flow
`UI Action` -> `Store Dispatch` -> `Repository Method` -> `IndexedDB Transaction` -> `Data Persisted` -> `Store Updated` -> `UI Re-rendered`

### AI Extraction Flow
1.  User selects text and triggers extraction.
2.  UI calls AI Extraction Engine.
3.  Engine constructs prompt using defined templates.
4.  Engine calls external AI Provider (OpenAI, Anthropic, etc.) using stored BYOK key.
5.  AI returns structured JSON.
6.  Engine validates JSON against defined schema.
7.  Engine presents "Review Receipt" to the UI.
8.  User approves receipt.
9.  Data flows through standard Core Entity Flow to persist.
