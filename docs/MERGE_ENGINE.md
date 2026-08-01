# Merge Engine

The Merge Engine handles the critical task of resolving conflicts and managing duplicate entities within NotterPad, ensuring the Story Bible remains clean and authoritative.

## Overview

Conflicts arise in two primary scenarios:
1.  **AI Extraction**: The AI extracts an entity (e.g., "Jon Snow") that already exists in the database.
2.  **Importing/Syncing**: Data is imported from a backup or external source that contains overlapping data.

The Merge Engine prevents data loss while maintaining consistency through intelligent duplicate detection and conflict resolution.

## Duplicate Detection

Before resolving, the engine must identify potential matches.
-   **Primary Key Matching**: Exact matches on UUIDs (common during imports).
-   **Fuzzy Matching**: Uses string distance algorithms (like Levenshtein) on names and aliases to identify potential duplicates (e.g., "John Smith" vs. "Jon Smith").
-   **Heuristic Matching**: Compares core attributes (roles, associated locations) to calculate a confidence score for a match.

## Intelligent Conflict Resolution

When a duplicate or conflict is identified, the Merge Engine constructs a resolution strategy:

1.  **Diff Generation**: The engine compares the incoming entity data against the existing database entity and generates a granular diff.
2.  **Auto-Merge (Non-Destructive)**: If the incoming data adds new fields without overwriting existing data (e.g., adding a new alias to a character), the engine automatically merges them.
3.  **Conflict Flagging**: If the incoming data contradicts existing data (e.g., changing a character's age from 30 to 40), the engine flags a conflict.
4.  **Resolution UI**: The flagged conflicts are presented to the user via a specialized UI component, allowing them to explicitly choose which data points to keep ("Ours" vs. "Theirs" vs. "Manual Edit").

## API Usage

The core function exposed by the module is `resolveMerge(existingEntity, incomingEntity)`. This returns a `MergeResult` object containing the auto-merged entity, a list of unresolved conflicts, and confidence metrics.
