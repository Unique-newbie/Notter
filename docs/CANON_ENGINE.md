# Canon Engine

The Canon Engine is the core system responsible for maintaining narrative consistency across a NotterPad project. It acts as an automated auditor, verifying new text against established story facts.

## Purpose

As stories grow complex, maintaining consistency (the "Canon" or "Story Bible") becomes difficult. The Canon Engine automates the detection of contradictions regarding characters, locations, lore, and timelines.

## Core Mechanisms

### 1. The Story Bible
The Story Bible is the aggregate state of all extracted and manually created entities in the database (Characters, Locations, Lore, etc.). This serves as the ground truth for the Canon Engine.

### 2. Consistency Auditing (`/api/check-consistency`)
When a user writes new scenes or requests a canon check, the engine triggers an audit pipeline:

1.  **Context Construction**: The engine builds a localized context based on the current scene's participants and locations.
2.  **Rule Evaluation**: It evaluates the new text against specific rules derived from the Story Bible. For example:
    *   *Rule*: Character A has blue eyes.
    *   *Text*: "Character A blinked his brown eyes." -> **Violation**.
3.  **Heuristics & AI**: The engine uses a combination of hardcoded heuristics (e.g., timeline checks based on metadata) and AI-assisted logic to detect nuanced contradictions that regular expressions would miss.

### 3. Reporting
The engine returns a structured report detailing:
-   **Severity**: Warning (minor discrepancy) vs. Error (direct contradiction).
-   **Context**: The specific entity or rule violated.
-   **Suggestion**: Potential fixes or context to resolve the discrepancy.

## Extension

The Canon Engine is designed to be extensible. Developers can add new rule evaluators by implementing the `ICanonRule` interface and registering it with the engine.
