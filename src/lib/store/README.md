# Store Module (`src/lib/store`)

## Overview
This module manages the global application state. It acts as the intermediary between the React UI layer and the persistent storage layer (`src/lib/storage`), ensuring that the UI remains reactive to data changes.

## Architecture
The state management relies on a unidirectional data flow pattern.
- **State**: The single source of truth for the UI at any given moment.
- **Actions/Dispatchers**: Functions called by the UI to request changes to the state.
- **Thunks/Async Actions**: Logic that interacts with the Repositories (IndexedDB) before updating the synchronous state.

## Key Concepts
- **Reactivity**: Components should subscribe only to the slices of state they need to minimize re-renders.
- **Optimistic Updates**: To make the UI feel fast, state is often updated immediately upon user action, with database persistence happening asynchronously in the background. Errors during persistence must trigger state rollbacks.
- **Cache invalidation**: The store must manage its own cache invalidation when data is modified in the repository layer to ensure it doesn't serve stale data.

## Usage Guidelines
- Do not import Repositories directly into React components. Always dispatch actions to the Store, which then orchestrates Repository interactions.
- Keep store logic free of UI concerns (e.g., no DOM manipulation or React-specific types).
