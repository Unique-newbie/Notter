# Import & Export Specs

NotterPad uses a structured JSON format for all backup and data portability operations, ensuring users own their data and can move it freely.

## Serialization Formats

The system supports two primary levels of export: Workspace and Novel.

### 1. Full Workspace Export

A complete snapshot of the user's NotterPad environment. This includes all novels, global settings, and cross-novel entities.

**Format Spec:**
```json
{
  "version": "1.0",
  "exportType": "workspace",
  "timestamp": "2023-10-27T10:00:00Z",
  "data": {
    "workspaces": [...],
    "novels": [...],
    "characters": [...],
    "locations": [...],
    "scenes": [...],
    // All other IndexedDB store arrays
  }
}
```

### 2. Single Novel Export

A scoped export containing only the data relevant to a specific novel.

**Format Spec:**
```json
{
  "version": "1.0",
  "exportType": "novel",
  "novelId": "uuid-1234",
  "timestamp": "2023-10-27T10:00:00Z",
  "data": {
    "novels": [{ /* Specific Novel */ }],
    "characters": [...], // Only characters linked to this novel
    "scenes": [...], // Only scenes linked to this novel
    // ...
  }
}
```

## Serialization Pipeline

1.  **Query**: The Export Engine queries the necessary Repositories to gather the data tree.
2.  **Sanitization**: Sensitive local data (like API keys, if accidentally linked to models) is stripped.
3.  **Blob Handling**: Images and blobs are converted to Base64 strings and embedded within the JSON structure to ensure the export is a single file.
4.  **Compression**: (Optional/Future) The JSON payload may be zipped to reduce file size.

## Deserialization & Import Pipeline

1.  **Validation**: The uploaded file is parsed and validated against the expected export JSON schema. Version checks are performed.
2.  **Merge Engine Handoff**: The imported entities are passed to the Merge Engine.
    *   If importing a novel that doesn't exist, it is created.
    *   If importing over an existing workspace/novel, the Merge Engine handles conflict resolution (see `MERGE_ENGINE.md`).
3.  **Blob Rehydration**: Base64 strings are converted back into binary Blobs and stored in the IndexedDB `blobs` store.
4.  **Persistence**: The resolved data is written to the IndexedDB via bulk transactions.
