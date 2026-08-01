# NotterPad Codebase Guide

This document serves as the primary onboarding guide and reference for developers working on NotterPad. It outlines the core architectural principles, directory structure, data flow, and development guidelines.

## Directory Structure & Responsibilities

The codebase follows a modular, feature-based architecture to maintain separation of concerns:

- `src/components/`: Reusable UI components (React).
- `src/lib/storage/`: IndexedDB storage layer and repository pattern implementation.
- `src/lib/ai/`: Bring Your Own Key (BYOK) AI integrations, extraction logic, and prompt handling.
- `src/lib/store/`: Global state management and data stores.
- `src/lib/models/`: TypeScript interfaces and data models for entities.
- `src/lib/engines/`: Complex business logic engines (Canon Engine, Merge Engine).
- `docs/`: Technical documentation detailing specific system areas.

## Architecture & Design Principles

1.  **Local-First / Offline-First**: All data is stored locally in IndexedDB by default. The application must function without an internet connection (excluding AI features).
2.  **Bring Your Own Key (BYOK)**: User privacy and cost management are handled by requiring users to provide their own API keys for AI services.
3.  **Strict Typings**: TypeScript is used extensively to define entities and API boundaries, reducing runtime errors.
4.  **Separation of Concerns**: The UI layer should be decoupled from the storage and AI layers. Repositories handle data access, stores handle state, and components render the view.

## Data Flow: IndexedDB -> Repository -> React UI

1.  **IndexedDB**: The fundamental storage mechanism. 12 object stores house entities, chapters, blobs, etc.
2.  **Repositories (`src/lib/storage/repositories/`)**: Abstract the IndexedDB API. They provide CRUD operations and specific queries for entities.
3.  **State Management (`src/lib/store/`)**: Subscribes to changes or fetches data from repositories and exposes it to the React application via hooks or store subscriptions.
4.  **React UI**: Consumes the state. Actions dispatched from the UI flow back through the store to the repositories, updating the IndexedDB and triggering state refreshes.

## How to Add a New Entity Type

1.  **Define Model**: Create the TypeScript interface in `src/lib/models/`.
2.  **Update Schema**: Add a new object store definition in the IndexedDB initialization logic (`src/lib/storage/schema.ts` or equivalent). Ensure versioning is handled correctly.
3.  **Create Repository**: Implement a new repository class extending the base repository to handle CRUD for the new entity.
4.  **Update State**: Add state management logic in `src/lib/store/` to expose the new entity to the UI.
5.  **Build UI**: Create components to display and edit the entity.

## How to Add a New AI Provider (BYOK)

1.  **Implement Provider Interface**: Create a new class implementing the core AI provider interface (e.g., `IAIProvider`) in `src/lib/ai/providers/`.
2.  **Handle Authentication**: Implement logic to securely store and retrieve the provider's API key.
3.  **Map Schemas**: Ensure the provider's output can be mapped to the expected JSON schema for extractions.
4.  **Register Provider**: Add the new provider to the provider registry/factory so it can be selected by the user in settings.

## Storage, Merges, and Backups

-   **Storage**: Handled by IndexedDB. Blob storage is used for large assets (images).
-   **Merges**: The Merge Engine handles conflict resolution when entities have overlapping data or when importing. It uses intelligent heuristics to suggest merges.
-   **Backups**: Workspaces can be exported as full JSON objects. Novels can be exported individually. The import/export logic serializes and deserializes the IndexedDB state.

## Code Standards & TypeScript Rules

-   **Strict Mode**: TypeScript strict mode is enabled and must be adhered to. No `any` types unless absolutely necessary (and documented).
-   **JSDoc**: All exported functions, classes, and module headers must contain complete JSDoc annotations.
-   **No UI in Logic**: Business logic (`lib/`) must not import UI components.
-   **Formatting**: Use standard formatting (Prettier/ESLint) as configured in the project root.
