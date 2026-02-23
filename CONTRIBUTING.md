# Contributing to Vureact Core

Thank you for your interest in contributing to Vureact Core! This document provides guidelines and instructions for contributing to the project.

## 🎯 Project Overview

Vureact Core is a next-generation compiler framework that compiles Vue 3 syntax into runnable React 18+ code. The project consists of two main packages:

### @vureact/compiler-core

A Vue 3 to React compiler that transforms Vue Single File Components (SFCs) into React components with JSX/TSX.

### @vureact/runtime-core

React adapter for Vue 3's built-in components, reactive APIs, and template directive utilities.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 14.0.0
- pnpm >= 8.0.0 (recommended)
- Git

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/core.git
   cd core
   ```

3. **Install dependencies**:

   ```bash
   pnpm install
   ```

4. **Build the packages**:

   ```bash
   pnpm build:compiler-core
   pnpm build:runtime-core
   ```

5. **Run tests** to ensure everything works:

   ```bash
   # For runtime-core tests
   pnpm test:adapter-hooks
   pnpm test:adapter-utils
   pnpm test:adapter-components
   ```

## 📝 Development Workflow

### Branch Strategy

- `master`: Stable production branch
- `develop`: Development branch (if exists)
- Feature branches: `feature/description`
- Bug fix branches: `fix/issue-number-description`
- Documentation branches: `docs/topic`

### Creating a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Write code** following our coding standards
2. **Add tests** for new functionality
3. **Update documentation** if needed
4. **Run tests** locally
5. **Check code style**:

   ```bash
   pnpm format:check
   ```

### Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `build`: Build system changes
- `ci`: CI configuration changes

**Scopes (examples):**

- `compiler-core`: Changes to the compiler package
- `runtime-core`: Changes to the runtime package
- `adapter-hooks`: Changes to adapter hooks
- `adapter-utils`: Changes to adapter utilities
- `adapter-components`: Changes to adapter components
- `cli`: Changes to the CLI tool

**Examples:**

```
feat(compiler-core): add SFC template compilation
fix(runtime-core): correct KeepAlive component behavior
docs: update API documentation
```

## 🔧 Project Structure

```
core/
├── packages/
│   ├── compiler-core/          # Vue to React compiler
│   │   ├── src/               # Source code
│   │   │   ├── compiler/      # Compiler implementation
│   │   │   ├── parser/        # Vue SFC parser
│   │   │   ├── transform/     # AST transformations
│   │   │   ├── codegen/       # Code generation
│   │   │   ├── utils/         # Utility functions
│   │   │   └── cli/           # Command line interface
│   │   ├── __tests__/         # Test files
│   │   └── package.json       # Package configuration
│   └── runtime-core/          # Runtime adapter
│       ├── src/               # Source code
│       │   ├── adapter-components/  # Vue built-in components
│       │   ├── adapter-hooks/       # Vue-like hooks
│       │   ├── adapter-utils/       # Directive utilities
│       │   └── shared/              # Shared utilities
│       ├── __tests__/         # Test files
│       └── package.json       # Package configuration
├── package.json              # Root package configuration
└── pnpm-workspace.yaml      # Workspace configuration
```

## 📖 Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Provide proper type definitions
- Avoid `any` type when possible
- Use interfaces for object shapes

### Code Style

- Use 2-space indentation
- Use semicolons
- Use single quotes for strings
- Follow Prettier configuration

### Documentation

- Document public APIs with JSDoc comments
- Update README files when adding features
- Add examples for complex functionality

## 🧪 Testing

### Writing Tests

- Test public APIs thoroughly
- Test edge cases and error conditions
- Mock external dependencies
- Use descriptive test names

### Test Structure

```typescript
describe('ComponentName', () => {
  it('should do something', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Running Tests

```bash
# Run compiler-core tests
cd packages/compiler-core
pnpm test

# Run runtime-core tests
cd packages/runtime-core
pnpm test

# Run specific test suites
pnpm test:adapter-hooks
pnpm test:adapter-utils
pnpm test:adapter-components
```

## 🔄 Pull Request Process

1. **Ensure your branch is up to date**:

   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run all checks**:

   ```bash
   pnpm build:compiler-core
   pnpm build:runtime-core
   pnpm format:check
   # Run relevant tests
   ```

3. **Create a Pull Request** on GitHub:
   - Use a clear, descriptive title
   - Reference related issues
   - Provide a detailed description
   - Include screenshots for UI changes

4. **PR Review Process**:
   - Address review comments promptly
   - Keep commits focused and logical
   - Squash commits if needed
   - Ensure CI passes

5. **After Approval**:
   - Maintainers will merge your PR
   - Your changes will be included in the next release

## 🐛 Reporting Issues

### Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Step-by-step instructions
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**: Node.js version, OS, etc.
6. **Code Example**: Minimal reproduction code

### Feature Requests

For feature requests, please:

1. **Describe the problem** you're trying to solve
2. **Explain why** this feature is needed
3. **Provide examples** of how it would be used
4. **Consider alternatives** you've tried

## 🏗️ Building and Packaging

### Development Build

```bash
# Build compiler-core
pnpm build:compiler-core

# Build runtime-core
pnpm build:runtime-core
```

### Production Build

- Compiler-core uses `tsup` for building
- Runtime-core uses `rollup` for building

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## 🤝 Community

### Getting Help

- [GitHub Issues](https://github.com/vureact-js/core/issues) for bug reports
- Check existing documentation first

### Recognition

All contributors will be recognized in:

- Release notes
- Contributors list
- Project documentation

## 📄 License

By contributing to Vureact Core, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).

## 🙏 Thank You

Thank you for considering contributing to Vureact Core. Your efforts help make this project better for everyone in the Vue and React communities!

---

_Need help? Open an issue on GitHub!_
