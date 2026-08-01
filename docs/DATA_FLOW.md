# Data Flow & State Management

This document details the state management strategies and data pipelines utilized in NotterPad.

## State Management Philosophy

NotterPad uses a unidirectional data flow to ensure predictable state updates. The global state is managed externally to the React component tree and injected via hooks, preventing prop drilling and unnecessary re-renders.

### Key Principles:
-   **Single Source of Truth**: The IndexedDB database is the ultimate source of truth for persistent data. The in-memory state is a synchronized projection of this database.
-   **Reactive Updates**: Changes in the database must propagate to the UI reactively.
-   **Optimistic UI**: Where appropriate, the UI updates immediately based on user action, while the actual database transaction occurs asynchronously in the background.

## Data Pipelines

### 1. Read Pipeline (Database to UI)
1.  **Component Mount**: A React component mounts and uses a custom hook (e.g., `useEntities()`).
2.  **Store Query**: The hook queries the central store for the requested data.
3.  **Cache Check**: The store checks if the data is already in memory.
4.  **Repository Fetch**: If not in memory, the store requests the data from the appropriate Repository.
5.  **DB Query**: The Repository executes an IndexedDB query.
6.  **Resolution**: The DB returns the data, the Repository formats it, the Store caches it, and the hook triggers a React render with the new data.

### 2. Write Pipeline (UI to Database)
1.  **User Action**: User edits an entity and clicks "Save".
2.  **Store Dispatch**: The component dispatches an action to the Store (e.g., `store.updateEntity(entity)`).
3.  **Validation**: The Store validates the payload against the domain models.
4.  **Optimistic Update**: (Optional) The Store updates its in-memory cache immediately.
5.  **Repository Mutate**: The Store calls the relevant Repository method.
6.  **DB Transaction**: The Repository opens a read-write transaction with IndexedDB and persists the data.
7.  **Confirmation**: The transaction completes, and the Store is notified of success. (If failure, optimistic update is rolled back).

### 3. Inter-Store Communication
In complex scenarios, stores may need to communicate. This is handled via an event bus or direct store-to-store subscriptions, ensuring that an update in one domain (e.g., deleting a character) correctly cascades to related domains (e.g., removing that character's tags from a scene).

## Synchronization
Since NotterPad is local-first, synchronization across devices (if implemented in the future) will rely on capturing changesets (deltas) and resolving them via the Merge Engine, rather than direct state overwrites.
