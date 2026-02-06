# Contribution Guidelines (CONTRIBUTING.md) ✅

Welcome to contribute to this repository! This repository is a monorepo, focusing on packages such as `core/packages/compiler-core` (Vue -> React compiler core). The following contribution guidelines are based on GitHub open source practices, and combined with the particularities of compiler development (parsing → AST transformation → code generation) to provide **executable development/debugging/testing/submission processes**.

---

## Table of Contents

1. Contribution Notes
2. Development Environment Setup (Complete Executable Steps)
3. Local Development and Debugging
4. Test Case Specifications
5. Code Development Specifications
6. Standard PR Submission Process
7. Bug Fixes and Issue Reporting
8. Documentation Contribution Specifications
9. Other Considerations

---

## 1) Contribution Notes

- Core project direction: Parsing, AST transformation, code generation, compatibility and adaptation (Vue3, React 18+).
- Contributions welcome: Feature development, bug fixes, performance optimization, test cases, documentation improvement, cross-version compatibility adaptation.
- Before starting: Please search existing Issues first; for major features or architectural adjustments, submit an Issue to initiate discussion and obtain maintainer approval.

---

## 2) Development Environment Setup (Complete Executable Steps)

Environments and tools:

- Node.js >= 14 (LTS version recommended)
- Package management: pnpm (recommended), compatible with npm/yarn as well
- Building: `tsup` (used by the `build` script in the package)
- CLI: The `vureact` binary is located in `packages/compiler-core/bin`

Clone and install dependencies:

```bash
# Clone the repository and install dependencies (at repo root)
git clone https://github.com/vureact-js/core.git
cd core
pnpm install
```

Common commands in the `compiler-core` package:

```bash
# Enter the package directory
cd packages/compiler-core
# Build
pnpm build
# Run the compiler CLI (development watch mode)
npx vureact -w
# Run tests within the package (commonly used during development)
pnpm test
```

To install `vureact` as a globally available command:

```bash
# Run at repo root or package directory
npm link
vureact -h
```

Example directory: `packages/compiler-core/example/` can be used to quickly manually verify the conversion results from input to output.

---

## 3) Local Development and Debugging

Recommended workflow:

1. Pull the latest code based on the main branch and create a new branch (see branch naming conventions).
2. Run `npx vureact -w` in `packages/compiler-core` to observe incremental compilation and hot-update output.
3. Modify source code (in `src/parse/`, `src/transform/`, `src/core/codegen/`, etc.), and verify the output in `example/` or automated tests.
4. For detailed logs, temporarily add log points or debug with breakpoints in the IDE, and remove temporary modifications after completion.

Important directory explanations:

- `src/parse/`: SFC and template parsing
- `src/transform/`: AST transformation, dependency analysis and optimization
- `src/core/codegen/`: Core logic for generating React (JSX/TSX)
- `example/`: Manual verification project
- `__tests__/`: Manually written test cases monitored by `tsx watch` to verify input and output

---

## 4) Test Case Specifications

Test objective: Ensure that Vue source input is converted to the expected React output without regressions.

- New or modified behaviors must have corresponding test cases added/updated.
- Recommended test case structure:
  - Vue input (SFC or snippet)
  - Expected React output (or assertions based on AST / samples)
  - Automated assertion logic

Covered scenarios: Normal scenarios, boundary scenarios (complex combinations of directives, custom directives), compatibility scenarios (Vue3 features), performance/optimization-related scenarios.

Run tests:

```bash
# In the package directory
pnpm test
# Or use workspace filtering at the root directory
pnpm -F @vureact/compiler-core test
```

---

## 5) Code Development Specifications

Coding style:

- Use TypeScript to ensure complete type definitions.
- Use Prettier for formatting (the project has declared `prettier` as a peerDependency).
- Follow existing ESLint / formatting rules (if the repository is not centrally configured, keep consistent with the existing style).

Naming and comments:

- File/function/class names should be semantic (e.g., `parseTemplate`, `transformElement`, `genJSXElement`).
- Core transformation logic must have explanatory comments; public methods should use JSDoc/TSDoc comments to facilitate API documentation generation.
- Internal code comments can be in Chinese or English; public methods provided to users must have English comments.

Directories and new modules:

- New compilation rules or adaptations should be placed in the corresponding existing subdirectories; avoid randomly adding top-level directories.

Submission specifications (Conventional Commits recommended):

- Examples: `feat: add v-model support`, `fix: fix v-if error in nested scenarios`, `refactor: refactored/modified xxxx`

Pre-submission checklist:

- [ ] `pnpm -F @vureact/compiler-core build` builds successfully
- [ ] `pnpm -F @vureact/compiler-core test` tests pass
- [ ] `npx prettier --check "src/**/*.{ts,tsx,js,jsx,md}"`
- [ ] Documentation/examples are updated synchronously (if needed)

---

## 6) Standard PR Submission Process 📤

1. Fork the repository and create a branch based on the main branch (naming examples: `feat/xxx`, `fix/xxx`).
2. Complete changes locally and ensure compliance with the above checklist.
3. Push the branch and initiate a PR in the main repository; the PR title should align with the commit type (feat/fix/docs, etc.).
4. Include in the PR description: change explanation, verification steps, test coverage, and whether it is a breaking change.
5. Modify promptly upon receiving review comments and keep the branch in sync with the main branch.

PR example template (can be pasted into the PR description):

```
### Type
feat / fix / docs / test / chore / refactor

### Description
Brief description of the changes

### Verification
- Unit tests: path/to/test
- Manual: cd packages/compiler-core && npx vureact -w

### Related Issue
Fixes #123 (if applicable)

### Breaking Change
No / Yes (explanation)
```

---

## 7) Bug Fixes and Issue Reporting 🐞

High-quality Issues include:

- Title, affected package and version (e.g., `@vureact/compiler-core v1.0.0`)
- Environment (OS, Node version, package manager version)
- Minimal reproduction steps or minimal reproduction repository
- Expected and actual output
- Error stack and logs (if available)

Fix process: Describe the reproduction in the Issue and propose a fix approach; reference the Issue in the PR description when submitting the PR, and add corresponding test cases.

---

## 8) Documentation Contribution Specifications 📝

- New features must have supplementary or updated documentation (README, usage examples, migration instructions, API documentation).
- Documentation should include: feature description, examples (comparison of Vue source code and generated React code), notes and compatibility limitations.
- Use Markdown; example code blocks should be highlighted and directly copyable for execution.

---

## 9) Other Considerations ⚠️

- Dependency upgrades: Before upgrading major dependencies, run the full build and tests locally and add compatibility test cases.
- Compatibility strategy: Handle version differences in the adaptation layer as much as possible, maintain backward compatibility, and indicate compatibility impacts in the PR.
- Prioritize ensuring the correctness of conversion results, then consider performance optimization; ensure results remain unchanged after optimization.

---

## Acknowledgements

Thank you to every contributor for your time and efforts!
