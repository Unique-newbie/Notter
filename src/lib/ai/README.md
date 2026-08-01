# AI Module (`src/lib/ai`)

## Overview
This module handles all external integrations with LLM providers for the purpose of story analysis, entity extraction, and consistency checking. It implements a Bring Your Own Key (BYOK) architecture.

## Directory Structure
- `/providers/`: Implementations for specific AI services (e.g., OpenAI, Anthropic).
- `/prompts/`: Templates and logic for constructing effective prompts.
- `/schemas/`: Zod schemas used to strictly validate the JSON output returned by the AI.
- `/pipeline.ts`: The core execution flow coordinating prompts, API calls, and validation.

## Key Concepts
- **BYOK**: The application does not proxy requests. API calls are made directly from the client using keys provided by the user.
- **Structured Output**: We mandate that AI models return JSON matching our predefined Zod schemas to ensure system stability.
- **Validation**: Raw AI responses are heavily sanitized and validated before entering the application state.

## Usage Guidelines
- To add a new AI provider, implement the base `IProvider` interface and register it.
- When modifying prompts, ensure the required JSON schema structure is explicitly communicated to the model in the system prompt.
