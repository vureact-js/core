# Contribution Guidelines ✅

Thank you for your interest and contributions to `@vureact/compiler-core`! This project is primarily written in TypeScript, uses `@vue/compiler-core` and `@vue/compiler-sfc` to parse Vue 3 code, leverages multiple core `@babel` modules to parse and manipulate scripts and ultimately generate React code, is built with `tsup`, provides a command-line tool `vureact` (supporting `-w` for hot reloading), and includes extensive core debugging capabilities in the source code (the `__tests__` directory). This guide outlines actionable steps and specifications from environment preparation to submitting PRs, enabling the community to contribute code and fix issues more efficiently.

> Once you have read and understood all the content below, you are welcome to contribute your creative ideas on the premise that the input and output results of the Vue-to-React conversion are accurate and meet the expected standards.

---

## Table of Contents

- 🧰 Environment & Quick Start
- 🔧 Local Development & Debugging
- 🧪 Testing & Examples
- ✨ Code Style & Type Checking
- 🧾 Commit Conventions & Branch Strategy
- 📤 PR Submission Standards & Template
- 🐛 Issue Reporting Guidelines
- 🔁 Code Review & Merging Strategy
- 📦 Release & Changelog

---

## 🧰 Environment & Quick Start

Prerequisite: Node.js >= 14. `pnpm` is recommended (the repository is a monorepo; it's advised to install dependencies uniformly at the root of the repository).

1. Clone the repository and install dependencies at the root directory:

```bash
git clone https://github.com/vureact-js/core.git
cd core
pnpm install
```

2. Navigate to this package (you can operate in the package directory or use the pnpm workspace filter):

```bash
# Run scripts in the package directory
cd packages/compiler-core
pnpm build

# Or use the workspace filter at the repository root
pnpm -F @vureact/compiler-core build
```

Common commands (can be run directly in the package directory):

- Build: `pnpm build` or `npm run build` (equivalent to executing `tsup`)
- Run development watch mode: `npx vureact -w` (or `node ./bin/vureact.js -w`)
- Run tests (see Testing section): `pnpm test` (package script)

---

## 🔧 Local Development & Debugging

- Recommended workflow:
  1. Create a new branch (see Branch Strategy)
  2. Run `npx vureact -w` locally to observe compilation results in real time in the example/target project
  3. Keep watch mode running after modifying source code to quickly test hot updates and output

- Example: The `example/` directory in the repository can be used to quickly verify the compiler's output. Execute the following in the example directory:

```bash
# At the root of the example directory
npx vureact
# Or with watch mode
npx vureact -w
```

- Logs & Debugging: The project uses tools like `kleur`/`ora` for log output. If necessary, add more detailed logs in `src/logger.ts` or corresponding modules to help locate issues.

---

## 🧪 Testing & Examples

- Test files are usually placed in the `__tests__` directory or adjacent `.test.ts` files, covering key subsystems such as parse, transform, and codegen.

- Jest or other frameworks are not used for testing; `tsx` is typically used to listen to test entry files for developers to verify whether inputs and outputs meet expectations.

- Running tests:

```bash
# In the package directory
pnpm test

# Or run the filtered package at the repository root
pnpm -F @vureact/compiler-core test

# Or directly run pre-written scripts at the repository root, e.g.:
npm run dev:parse
```

- When adding tests:
  - New test cases should be placed in the `__tests__` directory near the tested module;
  - Each test should include a minimal reproducible input (e.g., a small SFC file or string fragment) and clear assertions;
  - Prioritize covering edge cases (parsing failures, special syntax, scoped styles, slot/directive conversion, etc.).

---

## ✨ Code Style & Type Checking

- TypeScript is used; maintain complete type declarations and pay attention to exported type definitions (the `types` field in package.json).
- Use Prettier to maintain consistent code formatting:

```bash
# Check formatting
npx prettier --check "src/**/*.{ts,tsx,js,jsx,md}"
# Format code
npx prettier --write "src/**/*.{ts,tsx,js,jsx,md}"
```

- Before committing:
  - Run `pnpm build` to verify the build passes (`tsup` will catch compilation or packaging errors)
  - Run tests and ensure newly added/modified tests pass

---

## 🧾 Commit Conventions & Branch Strategy

To facilitate change tracking and automated releases, please use the **Conventional Commits** format:

- Examples:
  - feat: support new feature for \<feature>
  - fix: fix \<bug description>
  - re: any refactoring or modification
  - docs: update README/documentation
  - chore: build or dependency adjustments
  - test: add or modify tests

Branch naming recommendations:

- feat/<short-description>
- fix/<short-description>
- re/<short-description>
- docs/<short-description>
- chore/<short-description>

Try to include a brief description and associated issue number (if applicable) in the commit message.

---

## 📤 PR Submission Standards & Template

Ensure the following checks are completed before submitting a PR:

- [ ] Fork/Branch is rebased on the latest main branch
- [ ] Corresponding unit tests have been added or updated
- [ ] Local build (`pnpm build`) has no errors
- [ ] Code is formatted and type checking passes
- [ ] Documentation has been updated for modified points (if necessary)
- [ ] PR description is clear, including reproduction steps and explanation of change impacts

Recommended PR description template:

```
Short title (prefixed with feat/fix/…)

Detail what the change does and why the change is made.

Related issue: #123 (if applicable)

Test plan:
- Added/updated test files
- Manual verification steps (e.g., execute `npx vureact -w` in example/)

Are there any breaking changes: No/Yes (explanation)
```

Merging strategy: Typically, maintainers will merge after CI passes and at least one reviewer approves.

---

## 🐛 Issue Reporting Guidelines

If you find a bug or want to propose a feature, first search the Issues to see if the same problem already exists.

A high-quality issue template should include:

- Title (concise)
- Version information (e.g., `@vureact/compiler-core` version, Node version)
- Operating system & environment (Windows/macOS/Linux)
- Reproduction steps (minimal reproducible repository or code snippet)
- Expected result vs. actual result
- Relevant logs and error stacks

Example:

```
Title: v-if in template is lost after conversion to JSX

Version: @vureact/compiler-core v1.0.0, node v16
System: Windows 10

Reproduction steps:
1. Create an SFC containing v-if
2. Run npx vureact

Expected: Convert to generate equivalent conditional rendering JSX
Actual: Conditional judgment is missing in JSX, leading to rendering errors

Logs: <error stack>
```

---

## 🔁 Code Review & Merging Strategy

- PRs require approval from at least one reviewer; core team members or maintainers will perform the final merge.
- If the change includes API changes or breaking changes, clearly mark them in the PR and wait for a more rigorous review process.
- CI (tests, builds) must pass before merging is allowed.

---

## 📦 Release & Changelog

- Changes should follow semantic versioning (feat/fix) to enable automated changelog generation (if the repository uses automation tools).
- If the repository uses `CHANGELOG.md` or release notes, add a brief description during PR/merging.

---

---

## Acknowledgments

Thank you for every submission and suggestion! For further assistance, please leave a message in an Issue or directly @ core maintainers.

---
