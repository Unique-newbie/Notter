# Storage Module (`src/lib/storage`)

## Overview
This module encapsulates all local data persistence logic, primarily interacting with IndexedDB. It utilizes the Repository pattern to isolate the database implementation details from the rest of the application.

## Directory Structure
- `/repositories/`: Contains classes responsible for CRUD operations on specific entity types (e.g., `CharacterRepository.ts`).
- `/schema.ts`: Defines the IndexedDB schema, object stores, and handles database version migrations.
- `/db.ts`: The core database connection instance and transaction manager.

## Key Concepts
- **Offline-First**: All data is stored locally.
- **Transactions**: Repositories must use IndexedDB transactions to ensure data integrity during multi-step operations.
- **Blobs**: Binary data is stored separately in the `blobs` store to optimize query performance on standard entity tables.

## Usage Guidelines
- Never interact with `indexedDB` directly from UI components or Store actions. Always inject and use a Repository.
- Ensure all exported functions and classes are documented with complete JSDoc annotations.
