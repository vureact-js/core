# Commit Convention

This document outlines the commit message convention used in the Vureact Core project. Following this convention helps maintain a clean and readable commit history.

## Format

Each commit message consists of a **header**, an optional **body**, and an optional **footer**.

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Header

The header is mandatory and must follow this format:

### Type

Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc.)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Scope (Optional)

The scope should be the name of the package or component affected. Examples:

- `compiler-core`: Changes to the compiler-core package
- `runtime-core`: Changes to the runtime-core package
- `adapter-hooks`: Changes to adapter hooks in runtime-core
- `adapter-utils`: Changes to adapter utilities in runtime-core
- `adapter-components`: Changes to adapter components in runtime-core
- `parser`: Changes to the Vue SFC parser in compiler-core
- `transform`: Changes to AST transformations in compiler-core
- `codegen`: Changes to code generation in compiler-core
- `cli`: Changes to the CLI tool
- `deps`: Dependency updates
- `docs`: Documentation changes

### Description

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No dot (.) at the end
- Keep it concise (50 characters or less is ideal)

## Body (Optional)

- Use the imperative, present tense
- Include motivation for the change and contrasts with previous behavior
- Wrap at 72 characters
- Reference issues and pull requests liberally

## Footer (Optional)

### Breaking Changes

If there are breaking changes, the footer should start with `BREAKING CHANGE:` followed by a description of the change, justification, and migration notes.

### Issue References

Close issues using keywords:

- `Fixes #123`
- `Closes #123`
- `Resolves #123`

## Examples

### Simple fix

```
fix(compiler-core): correct template parsing for v-if directives
```

### Feature with scope

```
feat(runtime-core): add KeepAlive component adapter

- Implement Vue-like KeepAlive component for React
- Add lifecycle hooks support
- Include comprehensive tests

Fixes #45
```

### Breaking change

```
feat(compiler-core): change SFC compilation output format

BREAKING CHANGE: The compiled output now uses named exports instead of
default exports. Update your imports from:
import Component from './compiled-component'
to:
import { Component } from './compiled-component'
```

### Documentation update

```
docs: update API documentation for adapter hooks

Add usage examples and migration guide from Vue 3.
```

### Dependency update

```
chore(deps): update @vue/compiler-sfc to v3.5.22
```

## Best Practices

1. **Keep commits focused**: Each commit should represent a single logical change
2. **Write descriptive messages**: The message should clearly explain what changed and why
3. **Reference issues**: Link to relevant issues or pull requests
4. **Test before committing**: Ensure your changes don't break existing functionality
5. **Use conventional format**: Follow the type-scope-description format

## Tools

### Commitizen

For an interactive commit message builder, you can use Commitizen:

```bash
npx cz
```

### Commitlint

To validate commit messages, we use commitlint with the conventional config.

### Husky

We use Husky to run commitlint on commit-msg hook.

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Angular Commit Message Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [Commitizen](https://github.com/commitizen/cz-cli)
