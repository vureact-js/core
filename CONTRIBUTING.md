# Contributing to VuReact Core

Thanks for helping improve VuReact Core. This guide focuses on the workflow contributors should follow in this repository.

## Before You Start

Make sure your local environment matches the current workspace requirements:

- Node.js `>= 20.19.0`
- pnpm `10+` recommended
- Git

This repository is a pnpm workspace with two main packages:

- `@vureact/compiler-core`
- `@vureact/runtime-core`

Please also review the [Code of Conduct](./CODE_OF_CONDUCT.md) and note that contributions are released under the [MIT License](./LICENSE).

## Choose the Right Collaboration Channel

Start with discussion before implementation when the change is significant.

Open or join an Issue or Discussion before writing code for:

- new features
- breaking changes
- architecture changes
- large refactors

Use the existing GitHub templates and channels:

- Bug reports: [`.github/ISSUE_TEMPLATE/bug_report.md`](./.github/ISSUE_TEMPLATE/bug_report.md)
- Feature requests: [`.github/ISSUE_TEMPLATE/feature_request.md`](./.github/ISSUE_TEMPLATE/feature_request.md)
- Showcase stories: [`.github/ISSUE_TEMPLATE/showcase.md`](./.github/ISSUE_TEMPLATE/showcase.md)
- Questions and usage help: GitHub Discussions and the project documentation

Small typo fixes and straightforward documentation corrections can go directly to a Pull Request.

## Local Setup

1. Fork the repository on GitHub.
2. Clone your fork and enter the workspace:

   ```bash
   git clone https://github.com/YOUR_USERNAME/core.git
   cd core
   ```

3. Install dependencies:

   ```bash
   pnpm install
   ```

4. Run tests to ensure the environment is normal:

   ```bash
   pnpm test:compiler-core
   pnpm test:adapter-hooks
   pnpm test:adapter-utils
   pnpm test:adapter-components
   ```

5. Build the packages you plan to touch:

   ```bash
   pnpm build:compiler-core
   pnpm build:runtime-core
   ```

6. Create a branch from the latest upstream default branch.

## Make Changes

Keep changes focused and easy to review.

- Follow the existing code style and project structure.
- Add or update documentation when behavior changes.
- Add or update tests when your change affects behavior.
- Avoid mixing unrelated refactors into the same Pull Request.

If your work touches both packages, describe the relationship clearly in your PR so reviewers can validate the integration path.

## Validate Changes

Run the checks that match the area you changed. Prefer targeted verification with a clear scope over vague claims like "all tests passed".

### Formatting

Run Prettier checks from the workspace root:

```bash
pnpm format:check
```

### `compiler-core`

Run the test suite:

```bash
pnpm test:compiler-core
```

Run specific module tests:

```bash
cd packages/compiler-core

pnpm test:fixture "<name of the test folder under any __tests__ directory>"
# example: pnpm test:fixture "define-model"

# Force update expected output files
pnpm test:fixture-update "<same as above>"
```

> If you see `[vureact]` related warnings, it is normal. These warnings are triggered by intentionally introduced edge cases, not by Jest test errors.

Run the relevant package build as well:

```bash
pnpm build:compiler-core
```

### `runtime-core`

Use the root scripts for the affected area:

```bash
pnpm test:adapter-hooks
pnpm test:adapter-utils
pnpm test:adapter-components
```

Run the relevant package build as well:

```bash
pnpm build:runtime-core
```

## Commit and Open a PR

Use clear commits. Conventional Commits are recommended:

```text
<type>[optional scope]: <description>
```

Common types used in this repository:

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `build`
- `ci`
- `chore`

Examples:

```text
feat(compiler-core): improve scoped style transform output
fix(runtime-core): correct adapter hook update timing
docs: rewrite contribution guide
```

Before opening a Pull Request:

- rebase or merge from the latest upstream default branch as needed
- make sure the relevant build and verification steps pass locally
- update docs when user-facing behavior changes

When opening the PR, follow the existing template:

- PR template: [`.github/PULL_REQUEST_TEMPLATE/pull_request_template.md`](./.github/PULL_REQUEST_TEMPLATE/pull_request_template.md)

Your PR description should include:

- the related issue, if any
- the affected package or packages
- the exact validation you ran
- screenshots only when they help explain the change

## Review Expectations

Reviewers may ask for clarification, narrower scope, or additional validation. That is part of keeping the project maintainable.

To help reviews move quickly:

- keep PRs focused
- respond to feedback with concrete updates
- call out tradeoffs or known follow-up work
- avoid force-pushing away context unless cleanup is necessary

If ownership is unclear, the repository's [CODEOWNERS](./.github/CODEOWNERS) file helps route reviews.
