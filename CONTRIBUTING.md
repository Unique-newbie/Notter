# Contributing to NotterPad

First, thank you for considering contributing to NotterPad! It's people like you that make NotterPad an incredible open-source tool for writers.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please ensure your interactions are respectful and constructive.

## Getting Started

1. **Find an Issue**: Check the issue tracker for `good first issue` or `help wanted` labels.
2. **Setup Environment**: Follow the instructions in `INSTALLATION.md` to get your local development environment running.
3. **Discuss**: If you plan to make a significant change, please open an issue to discuss it first.

## Branch Naming Conventions

Please use the following conventions for your branch names:
- `feature/your-feature-name` (for new features)
- `fix/issue-description` (for bug fixes)
- `docs/what-you-documented` (for documentation updates)

## Commit Message Standards

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- `feat: add custom schema fields`
- `fix: resolve IndexedDB synchronization issue`
- `docs: update roadmap`
- `chore: update dependencies`

## Code Quality & TypeScript Rules

NotterPad uses strict TypeScript to ensure codebase integrity.
- Ensure all types are properly defined. Avoid `any`.
- Run type-checking locally before committing:
  ```bash
  npx tsc --noEmit
  ```
- Adhere to the existing ESLint and Prettier configurations. Run `npm run lint` to verify.

## Pull Request Process

1. Ensure your code passes all linting and type checks.
2. Update relevant documentation (README, API docs) if necessary.
3. Open a Pull Request against the `main` branch.
4. Fill out the provided PR template completely.
5. Await review from maintainers. Be prepared to address feedback!
