# Contributing to Notter

Thank you for contributing to Notter.

Notter is an open-source project, and contributions of all kinds are welcome, including bug fixes, features, documentation, and improvements.

## Getting Started

1. Check the [issue tracker](https://github.com/Unique-newbie/Notter/issues) for existing issues.
2. For significant changes, open or comment on an issue before starting work.
3. Fork the repository or create a branch if you have repository access.
4. Set up the project locally and make your changes.
5. Submit a pull request targeting the `dev` branch.

## Branches

* `main` — Production
* `dev` — Development and integration testing

Create a branch from `dev` for your work.

Recommended naming:

* `feature/<name>` — New features
* `fix/<name>` — Bug fixes
* `docs/<name>` — Documentation
* `refactor/<name>` — Refactoring or maintenance

Example:

```bash
git checkout dev
git pull
git checkout -b feature/my-feature
```

## Commits

Use clear, concise commit messages. Conventional Commits are recommended.

Examples:

```text
feat: add character relationship view
fix: resolve duplicate entity merging
docs: update installation guide
refactor: simplify canon parser
chore: update dependencies
```

## Pull Requests

All changes to `dev` and `main` must go through pull requests.

The usual workflow is:

```text
Feature branch
      ↓
Pull Request → dev
      ↓
Vercel Preview
      ↓
Review and testing
      ↓
Merge → dev
      ↓
Integration testing
      ↓
Pull Request → main
      ↓
Merge → main
      ↓
Production
```

When opening a pull request:

* Clearly describe what changed and why.
* Link related issues when applicable.
* Explain how the changes were tested.
* Include screenshots or recordings for UI changes.
* Address review comments before merging.

Pull requests are squash-merged into the target branch.

## Code Quality

Before submitting a pull request, run the project's available checks locally.

```bash
npm run lint
npx tsc --noEmit
```

Follow the existing TypeScript, ESLint, and formatting conventions. Avoid introducing `any` unless there is a clear reason.

## Documentation

Update relevant documentation when a change affects how Notter works or how users interact with it.

User documentation is maintained at:

**https://docs.notterpad.in**

## Questions

If you're unsure about an implementation or contribution, open an issue or start a discussion before making a significant change.

Thank you for helping improve Notter.
