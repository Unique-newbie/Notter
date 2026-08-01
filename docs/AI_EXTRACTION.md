# AI Extraction Pipeline

This document details the Bring Your Own Key (BYOK) AI extraction architecture used to convert raw text into structured story entities.

## Bring Your Own Key (BYOK)

NotterPad does not proxy AI requests through a central server. All API calls are made directly from the user's browser to the AI provider.
-   **Security**: API keys are stored locally in the browser's storage and are never transmitted to NotterPad servers.
-   **Providers**: The system supports multiple providers (OpenAI, Anthropic, local LLMs) via a standardized adapter interface.

## Extraction Pipeline

The extraction process transforms unstructured text into strongly typed JSON data.

1.  **Input Selection**: The user selects a block of text in the editor and triggers extraction.
2.  **Context Gathering**: The system gathers relevant context (active novel, existing characters, current scene) to enrich the prompt.
3.  **Prompt Template Assembly**: The target entity type determines which prompt template is used. The context and selected text are injected into the template.
4.  **API Execution**: The request is dispatched to the configured AI provider.
5.  **Response Parsing**: The AI's response is captured.
6.  **Schema Validation**: The raw output is validated against Zod/JSON schemas.
7.  **Review Receipt**: Validated data is presented to the user for confirmation.

## Prompt Templates

Prompt templates are engineered to enforce structured output. They contain:
-   **System Instructions**: Defining the AI's role (e.g., "You are an expert story analyst").
-   **Task Definition**: Explicit instructions on what to extract.
-   **Output Format Specs**: Detailed instructions to return ONLY valid JSON matching a specific schema.
-   **Injected Variables**: Placeholders for `{{TEXT}}`, `{{CONTEXT}}`, and `{{SCHEMA}}`.

## JSON Schema Validation

To ensure application stability, AI output is strictly validated before being accepted into the system.
-   **Zod Schemas**: We use Zod to define the expected structure of extracted entities.
-   **Validation Step**: The raw JSON string from the AI is parsed and passed through the Zod schema.
-   **Error Handling**: If validation fails, the pipeline may automatically retry the prompt with the validation errors appended to correct the model's output, or fail gracefully and notify the user.

## Review Receipts

Extracted data is never saved directly to the database automatically.
-   **Receipt Generation**: The validated JSON is converted into a UI-friendly "Review Receipt".
-   **User Approval**: The user must review, optionally edit, and explicitly approve the extracted data.
-   **Commit**: Upon approval, the data is passed to the Merge Engine or directly to the Repositories for persistence.
