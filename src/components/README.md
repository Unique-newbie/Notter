# Components (`src/components`)

## Overview
This directory contains the React component tree for NotterPad. It is responsible solely for the presentation tier of the application.

## Directory Structure
- `/common/` or `/ui/`: Highly reusable, generic, primitive UI components (Buttons, Inputs, Modals). These should be entirely stateless or only manage trivial internal state.
- `/features/` or domain-specific folders: Components tied to specific business logic or entities (e.g., `CharacterProfileCard`, `SceneEditor`).
- `/layouts/`: Structural components defining page shells and navigation structures.

## Key Concepts
- **Dumb vs. Smart Components**: Favor writing "dumb" (presentational) components that receive data via props. Connect "smart" (container) components to the global store, which then pass data down to the presentational components.
- **Performance**: Use React's memoization (`useMemo`, `useCallback`, `React.memo`) judiciously to prevent unnecessary re-renders, especially in large lists or complex editor views.
- **Styling**: Adhere to the project's styling conventions (e.g., Tailwind CSS, CSS Modules) to maintain a consistent design language.

## Usage Guidelines
- Components should not contain complex business logic or data fetching logic. Delegate these tasks to hooks and the Store module.
- Ensure all components are accessible (a11y) and responsive.
- Keep component files focused and concise. Break down large components into smaller, composable units.
