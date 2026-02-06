# Contribution Guidelines (CONTRIBUTING.md) ✅

Thank you for your interest in contributing to this repository! This document helps contributors get started quickly, follow standards, and submit high-quality PRs. It aligns with the tech stack used by this package: TypeScript, Rollup bundling, Jest testing, and React 18+ as peer dependencies.

---

## Table of Contents

1. Contribution Notes
2. Development Environment & Quick Start (Full Steps)
3. Local Development & Debugging Workflow
4. Test Case & Validation Standards
5. Code Standards & Submission Requirements
6. Standard PR Submission Process
7. Bug Reporting & Issue Feedback
8. Documentation & Example Update Standards
9. Other Considerations

---

## 1) Contribution Notes

- `runtime-core` provides Vue-style runtime adaptation (component adaptation, hooks, directive utils). Key focus areas: functional correctness, React compatibility, complete type definitions, and performance cost control.
- Welcome contribution types: feature development, bug fixes, type/documentation improvements, test case supplements, compatibility adaptation (different React versions/environments).
- For significant changes (design/compatibility/architecture), please submit an Issue to discuss with maintainers before implementation to avoid duplicate work and design conflicts.

---

## 2) Development Environment & Quick Start (Full Steps)

Environment requirements (recommended):

- Node.js >= 18.2.0
- pnpm >= 8 (recommended)
- React >= 18.2.0 (peerDependencies)

Installation & Build:

```bash
# Clone the repository and install dependencies (at repo root)
git clone https://github.com/vureact-js/core.git
cd core
pnpm install

# Enter the runtime-core package
cd packages/runtime-core
# Build dist
pnpm build
```

Common scripts (in package directory or using workspace filters):

- `pnpm build` — Clean and bundle with `rollup`
- `pnpm test` — Run jest (recommended after modifications)
- `pnpm test:watch` — Interactive watch mode
- `pnpm test:coverage` — Output test coverage

To use the runtime adaptation implementation globally locally (for manual integration verification):

```bash
# At package root or repo root
npm link
# Use in the target React project for testing
npm link @vureact/runtime-core
```

Example directory & manual verification:

- Examples/tests under `packages/runtime-core` can be used as a verification environment. If necessary, create a minimal demo (React project) to integrate and verify component/Hook behavior.

---

## 3) Local Development & Debugging Workflow

Recommended workflow:

1. Pull the latest code from the main branch (e.g., `master` or `dev`) and create a feature branch.
2. After modifying code, run `pnpm build` (or Rollup-related commands) to ensure bundling succeeds.
3. Use `pnpm test:watch` or `jest --watch` to monitor test changes and fix failed cases.
4. If needed, use `npm link` to link the local package to a test project for integration and runtime behavior verification.

Code debugging tips:

- Add detailed logs where necessary (remember to clean up before committing) or set breakpoints in your IDE for debugging.
- For component adaptation, it is recommended to write small runtime integration examples (e.g., mount components via React Testing Library and verify behavior).

---

## 4) Test Case & Validation Standards

Test scope:

- Hook behavior (`useState$`, `useWatch`, etc.)
- Component adaptation behavior (`KeepAlive`, `Transition`, `Teleport`, etc.)
- Logical correctness of Directive utils (`vCls`, `vStyle`, `vOn`)
- Compatibility with React (stable behavior under React 18)

Test requirements:

- New features / bug fixes must include corresponding unit or integration tests.
- Tests should include: input, expected behavior, assertions. For component behavior, runtime rendering assertions or snapshots (if appropriate) can be used.
- Covered scenarios include normal cases, edge cases, and compatibility with React Strict Mode.

Run tests:

```bash
# In package directory
pnpm test
# Watch mode
pnpm test:watch
```

Keeping tests passing is a mandatory requirement before merging.

---

## 5) Code Standards & Submission Requirements

Coding style:

- Use TypeScript, maintain complete type definitions, and update them synchronously with features.
- Use Prettier/ESLint (if provided by the repository) to maintain consistent style; if no centralized strategy exists, follow the current code style.

Comments & Documentation:

- Key logic (component internal state management, Hook boundary behavior, version compatibility checks) must include clear comments and TSDoc/JSDoc annotations.

Directories & New Modules:

- Place new features under existing `adapter-components/`, `adapter-hooks/`, or `adapter-utils/`; avoid adding top-level directories arbitrarily.

Commit messages & branches:

- Use Conventional Commits (e.g.: `feat: add useWatchSyncEffect`, `fix: correct Teleport portal target`).
- Branch naming examples: `feat/<short-desc>`, `fix/<short-desc>`.

Pre-submission checklist:

- [ ] `pnpm -F @vureact/runtime-core build` passes
- [ ] `pnpm -F @vureact/runtime-core test` passes
- [ ] `npx prettier --check "packages/runtime-core/src/**/*.{ts,tsx,js,jsx,md}"`
- [ ] Update or add necessary documentation/examples

---

## 6) Standard PR Submission Process

1. Fork this repository and create a new feature branch from the main branch.
2. Complete development locally and pass all local checks.
3. Push the branch and open a PR. The PR title should match the prefix of the main commit (feat/fix/docs/chore/test).
4. Include the following in the PR description:
   - Change type and purpose
   - Verification steps (unit test path, manual verification steps, demo link)
   - Whether it is a breaking change and compatibility notes
   - Associated Issue (if applicable)
5. Maintainers and reviewers may request additional tests or documentation; respond promptly and update the branch.

PR description example:

```md
### Type

feat / fix / docs / test

### Description

Briefly describe the changes and motivation.

### Verification

- Unit tests: packages/runtime-core/**tests**/xxx.test.ts
- Manual: link local package and run example project

### Associated Issue

Fixes #123 (if applicable)

### Breaking Change

No / Yes (explanation)
```

---

## 7) Bug Reporting & Issue Feedback

High-quality Issues should include:

- Affected package and version (e.g., `@vureact/runtime-core v1.0.0`)
- Environment (Node, React, OS, package manager version)
- Minimal reproduction steps or minimal reproduction repository
- Expected vs. actual results
- Error stack traces, logs, and relevant code snippets (if possible)

Fix process: Specify reproduction steps in the Issue, reference the Issue in the PR, and add automated tests after fixing to prevent regression.

---

## 8) Documentation & Example Update Standards

- Changes involving public APIs or user-visible behavior must update the README, examples, and documentation (including TypeScript type hint explanations).
- Documentation should include: feature description, example code (comparison between original Vue code and generated React code), notes, and compatibility information.
- Documentation is recommended to use Markdown, with highlighted example code that can be copied and run.

---

## 9) Other Considerations

- For dependency upgrades, fully run builds and tests locally, and add compatibility tests.
- Prioritize functional correctness and compatibility before performance optimization; ensure behavior remains unchanged after optimization.
- For changes involving multiple packages (e.g., coordinated upgrades of runtime-core and compiler-core), clearly explain the scope of changes in the PR and submit changes or PRs for related packages simultaneously.

---

## Acknowledgments

Thank you to every contributor for your efforts!
