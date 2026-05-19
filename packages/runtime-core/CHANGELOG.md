# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-04-26

### Fixed

- **Fixed callback parameter type inference for `useWatch`**: when `source` is an unwrapped `Ref`, callback parameters are now inferred automatically as the unwrapped value type.

---

[1.1.1]: https://github.com/vureact-js/core/compare/v1.1.0...v1.1.1

---

## [1.1.0] - 2026-04-17

### Added

- **Added a `defineAsyncComponent` adapter utility**: full async-component support, including type definitions and test coverage.
- **Refactored `Suspense` into a directory-based module structure**: split the component into a modular layout and added context support.
- **Added `Suspense` subcomponents**: introduced `Suspense/Content.tsx` and `Suspense/Fallback.tsx` for more flexible Suspense usage patterns.

### Changed

- **Improved the `package.json` description and keywords**: updated package metadata to improve discoverability.
- **Refactored build scripts**: merged the old `clean` and `build` commands into a single `build` command to simplify the build flow.

---

[1.1.0]: https://github.com/vureact-js/core/compare/v1.0.1...v1.1.0

---

## [1.0.1] - 2026-03-05

### Changed

- **Refactored the README structure**: made Chinese the primary language version and English the alternate version, improving documentation organization.
- **Added npm package badges**: included version, download count, license, and React version badges in the README to improve package credibility.
- **Updated author information**: changed the author field from "Ryan John" to "Ruihong Zhong (Ryan John)".
- **Improved project homepage links**: removed language suffixes from homepage URLs and standardized on the root domain.

### Fixed

- **Fixed `repository.directory` configuration**: changed the path from `tree/master/packages/runtime-core` to `packages/runtime-core`.

---

[1.0.1]: https://github.com/vureact-js/core/compare/v1.0.0...v1.0.1

---

## [1.0.0] - 2026-03-04

### 🚀 Milestone Release: @vureact/runtime-core 1.0.0 — From Beta to Stable

This is the first stable release of `@vureact/runtime-core`, marking the transition from beta to production-ready status.

### Added

#### Core Reactive System

- **Complete Vue 3 reactive API adaptation**: a high-performance proxy-based reactive system powered by Valtio.
- **Reactive hook collection**:
  - `useReactive` / `useShallowReactive`: deep and shallow reactive objects
  - `useVRef` / `useShallowRefState`: reactive references
  - `useComputed`: computed values
  - `useWatch`: reactive watchers
  - `useToVRef` / `useToVRefs`: reactive ref conversions
  - `useToRaw`: access to raw values behind reactive objects
  - `useReadonly` / `useShallowReadonly`: readonly reactive objects
- **Reactive utility helpers**:
  - `wrapRef` / `unwrapRef`: ref wrapping and unwrapping
  - `collectProxyAccess`: proxy access collection
  - shared proxy-related utility helpers

#### Vue Built-in Component Adapters

- **`<KeepAlive>`**: Vue-style component caching with `include`, `exclude`, and `max` support.
- **`<Transition>`**: transition component built on top of `react-transition-group`.
- **`<Teleport>`**: Vue-style wrapper around React Portal.
- **`<Suspense>`**: support for async component loading.

#### Template Directive Utilities

- **`vCls`**: Vue-style class binding utility.
- **`vStyle`**: Vue-style style binding utility.
- **`vOn`**: Vue-style event binding utility.
- **`vKeyless`**: utility for keyless rendering.

#### Adapter Architecture

- **Modular export structure**:
  - main package: `@vureact/runtime-core`
  - adapter components: `@vureact/runtime-core/adapter-components`
  - adapter hooks: `@vureact/runtime-core/adapter-hooks`
  - adapter utilities: `@vureact/runtime-core/adapter-utils`
- **Complete TypeScript support**: full type definitions with IntelliSense compatibility.

### Changed

#### Architecture Improvements

- **Upgraded from beta**: version number moved from `1.0.0-beta` to `1.0.0`.
- **Dependency updates**:
  - adopted `valtio` as the reactive engine, replacing earlier `use-immer`, `immer`, and `freeze-mutate` usage
  - added `freeze-mutate` and `klona` for immutable data operations
  - adopted `react-fast-compare` for fast object comparison
  - adopted `react-transition-group` for transition support
- **API naming normalization**:
  - `useRefState` -> `useVRef`
  - `useToRefState` -> `useToVRef`
  - `useToRefStates` -> `useToVRefs`
  - `useCtx` -> `useInject`
  - `ContextProvider` / `CtxProvider` -> `Provider`

#### Performance Improvements

- **Reactive-system optimization**: high-performance reactivity powered by Valtio.
- **Dependency collection optimization**: more precise dependency tracking to avoid unnecessary rerenders.
- **Memory usage optimization**: improved memory handling for proxy objects.

#### Developer Experience

- **Complete test suite**: comprehensive unit test coverage for all core capabilities.
- **Example projects**: rich usage examples for common scenarios.
- **Improved documentation**: complete API docs and usage guides.

### Fixed

#### Reactive System Fixes

- **Fixed circular-reference issues with shallow proxies**: resolved circular references caused by accessing the source object of a shallow proxy.
- **Fixed proxy metadata handling**: improved enhancement logic around `createProxy`.
- **Fixed type definitions**: completed type coverage across all reactive APIs.

#### Component Adapter Fixes

- **Fixed component lifecycle mapping**: ensured Vue lifecycle behavior maps correctly onto React lifecycle behavior.
- **Fixed prop handling**: improved prop detection and type inference.
- **Fixed event system behavior**: ensured event listeners work correctly.

#### Utility Fixes

- **Removed redundant utilities**: cleaned up unused helpers such as `isProxy`, `isRefState`, and `setProxyMeta`.
- **Improved utility imports**: standardized utility import paths.

### 🔧 Tech Stack Details

#### Core Dependencies

- **valtio**: a mature proxy-based reactive library from the React ecosystem
- **react-transition-group**: React transition animation library
- **react-fast-compare**: fast object comparison utility
- **freeze-mutate**: immutable data operation utility
- **klona**: deep clone utility

#### Development Tooling

- **TypeScript**: type-safe development experience
- **Rollup**: bundler with dual ESM/CJS output
- **Jest**: test framework with full test coverage

#### Compatibility

- **React 18+**: designed for modern React applications
- **TypeScript 4.9+**: full type support
- **Dual ESM/CJS output**: supports both modern and traditional module systems

### 📦 Package Structure

```txt
@vureact/runtime-core/
├── dist/                      # build output
│   ├── cjs/                   # CommonJS format
│   ├── esm/                   # ES Module format
│   └── types/                 # TypeScript type definitions
├── src/
│   ├── adapter-components/    # adapter components
│   │   ├── KeepAlive.tsx
│   │   ├── Transition.tsx
│   │   ├── Teleport.tsx
│   │   └── Suspense.tsx
│   ├── adapter-hooks/         # adapter hooks
│   │   ├── useReactive.ts
│   │   ├── useVRef.ts
│   │   ├── useComputed.ts
│   │   ├── useWatch.ts
│   │   └── lifecycle.ts
│   ├── adapter-utils/         # adapter utilities
│   │   ├── vCls.ts
│   │   ├── vStyle.ts
│   │   ├── vOn.ts
│   │   └── vKeyless.ts
│   └── shared/                # shared utilities
│       ├── hooks/             # shared hooks
│       ├── utils/             # utility helpers
│       └── consts/            # constant definitions
├── examples/                  # sample code
├── __tests__/                 # test files
└── package.json               # package config
```

---

[1.0.0]: https://github.com/vureact-js/core/compare/v1.0.0...HEAD

---

## How to Update This Changelog

### For Contributors

When making changes, please add entries to the appropriate section under [Unreleased].

### For Maintainers

When releasing a new version:

1. Update the version number in `packages/runtime-core/package.json`
2. Create a new heading for the version (e.g., `## [1.0.0] - 2024-01-01`)
3. Move all entries from [Unreleased] to the new version section
4. Update the links at the bottom of the file
5. Commit with message: `chore(release): v1.0.0`
6. Tag the release: `git tag -a v1.0.0 -m "Release v1.0.0"`

## Release Checklist

- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Run full test suite
- [ ] Build production artifacts
- [ ] Create GitHub release
- [ ] Publish to npm registry

---

```text
[Unreleased]: https://github.com/vureact-js/core/compare/v1.1.1...HEAD
[1.1.1]: https://github.com/vureact-js/core/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/vureact-js/core/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/vureact-js/core/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/vureact-js/core/compare/v1.0.0...HEAD
```
