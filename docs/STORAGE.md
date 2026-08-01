# Storage Specification

NotterPad relies on IndexedDB for robust, local-first storage. This document outlines the schema, object stores, and data handling practices.

## IndexedDB Schema

The database is initialized with a specific version number. Schema upgrades are handled sequentially in the database upgrade block.

### Object Stores (12 Stores)

The application manages 12 distinct object stores to categorize and index data efficiently:

1.  `workspaces`: Top-level configuration and metadata for user workspaces.
2.  `novels`: Metadata and structural information for individual book projects.
3.  `chapters`: Hierarchical containers for scenes within a novel.
4.  `scenes`: The actual textual content and metadata for story segments.
5.  `characters`: Profiles, attributes, and relationships of story actors.
6.  `locations`: Settings and geographical data within the story world.
7.  `items`: Significant objects or artifacts in the story.
8.  `lore`: General world-building rules, history, and background information.
9.  `tags`: Reusable categorization labels applied across other entities.
10. `relationships`: Explicit connections between characters, locations, or items.
11. `blobs`: Binary large object storage (primarily for images and media).
12. `metadata`: System-level flags, sync timestamps, and application state.

## Schema Versions & Upgrades

-   **Version Management**: The database version is strictly controlled.
-   **Migration Strategy**: When the schema changes (e.g., adding an index, creating a new store), the version is incremented. The `onupgradeneeded` handler contains sequential logic to migrate data from version N to N+1.
-   **Backwards Compatibility**: Migrations must ensure existing user data is preserved and formatted to fit the new schema.

## Blob Handling

-   **Storage Adapter**: Binary data (like character portraits or cover images) is not stored directly in the main entity stores to prevent performance degradation during standard queries.
-   **Blobs Store**: Instead, media is stored in the dedicated `blobs` object store.
-   **Referencing**: Entities reference these blobs via unique UUIDs. The UI retrieves the blob asynchronously using the UUID when rendering the media.

## Storage Adapters

The repository pattern allows for abstracting the IndexedDB implementation. While `indexedDB` is the primary adapter, the architecture supports implementing fallback adapters (e.g., `localStorage` for smaller datasets or testing, though severely limited) or future network adapters.
