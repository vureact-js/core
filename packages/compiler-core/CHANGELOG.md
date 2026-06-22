# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.9.0] - 2026-06-23

### Added

- Added `defineModel` macro API transform support: compiles Vue 3's `defineModel()` into a combination of React `props`, `useVRef()`, and `useUpdated()` to enable automatic synchronization of `v-model` two-way binding. Only supports `type`, `default`, `required` options and custom prop name [#56](https://github.com/vureact-js/core/issues/56)

[1.9.0]: https://github.com/vureact-js/core/compare/v1.8.5...v1.9.0

---

## [1.8.5] - 2026-05-27

### Fixed

- Fixed `provide()` internally using mappable APIs like `computed()` not being converted to React output [#46](https://github.com/vureact-js/core/issues/46)
- Fixed missing `<Provider>` component in generated React JSX when using provide in a template-less component [#51](https://github.com/vureact-js/core/issues/51)

---

[1.8.5]: https://github.com/vureact-js/core/compare/v1.8.4...v1.8.5

---

## [1.8.4] - 2026-05-25

### Fixed

- Fixed template parser crash when modifier events had no expression [#43](https://github.com/vureact-js/core/issues/43)
- Fixed `<slot>` with `v-else` causing slot props parsing crash [#44](https://github.com/vureact-js/core/issues/44)
- Fixed JSX children builder lacking tolerance for abnormal children shapes [#45](https://github.com/vureact-js/core/issues/45)
- Fixed Vue type imports being removed after compilation but corresponding type references in code not being removed, causing TS type errors [#47](https://github.com/vureact-js/core/issues/47)
- Fixed dependency analysis (e.g., `watchEffect`) missing optional chaining protection for object access mixed with optional chaining, causing crashes [#48](https://github.com/vureact-js/core/issues/48)
- Fixed compiler generating incorrect runtime method `dir.On` when handling special template events, causing page crashes [#49](https://github.com/vureact-js/core/issues/49)

---

[1.8.4]: https://github.com/vureact-js/core/compare/v1.8.3...v1.8.4

---

## [1.8.3] - 2026-05-15

### Fixed

- **Fixed React HMR not being triggered in watch mode after restoring a file to its initial content**: improved cache validation so reverting a file to its original state is still recognized as a change and the generated output is updated correctly.
- **Removed unnecessary warnings for component-name fallback to the filename**: inferring the component name from the filename is now treated as a normal fallback when no explicit name is declared, so no warning is emitted.

---

[1.8.3]: https://github.com/vureact-js/core/compare/v1.8.1...v1.8.3

---

## [1.8.1] - 2026-05-14

### Fixed

- **Fixed partial cache data loss during incremental compilation**: improved cache persistence logic to ensure complete data is saved and incremental compilation keeps working reliably.

---

[1.8.1]: https://github.com/vureact-js/core/compare/v1.8.0...v1.8.1

---

## [1.8.0] - 2026-05-05

### Changed

- **Improved file scanning efficiency**: source files are scanned only once per compilation, and all compilation stages share the same scan results to avoid repeated directory traversal.
- **Improved cache read/write performance**: refactored the cache read/write flow so cache files are read and written only once per compilation, reducing repeated I/O and improving full-build speed by about 30-40%.
- **Improved cache cleanup logic**: cleanup now operates in memory instead of repeatedly reading and writing disk state, avoiding cache desynchronization.
- **Improved terminal output experience**: added unified step-by-step progress output and follow-up instructions, including a GitHub star prompt after compilation completes.

### Fixed

- **Fixed full compilation deleting the workspace directory when compilation cache was disabled**: cleanup now removes only the cache files themselves, preventing generated output files and the Vite runtime environment from being wiped.
- **Fixed package update checks not working when the CLI starts**: corrected the update-check logic so new versions are properly detected and reported on startup.

### Removed

- **Removed repeated file scanning and cache read/write work from individual compilation phases**: these tasks are now performed centrally before and after compilation, and the results are shared across stages.

---

[1.8.0]: https://github.com/vureact-js/core/compare/v1.7.0...v1.8.0

---

## [1.7.0] - 2026-04-26

### Added

- **Added `:deep()` transform support**: supports deep-selector compilation across complex cases, including multiple arguments and nesting, so styles can penetrate child components correctly.
- **Added `:slotted()` transform support**: supports slot selector compilation so scoped styles can target slot content precisely.
- **Added `:global()` transform support**: supports global selector compilation so global style rules can be declared inside scoped styles.

### Fixed

- **Fixed incomplete `data-css-*` scope attribute coverage on component DOM elements during scoped-style transforms**: improved scope-attribute injection so all styleable DOM elements receive the proper scope marker.
- **Fixed scoped-style hash attributes being incorrectly injected into pseudo-classes, pseudo-elements, and attribute selectors, causing styles to break**: improved selector parsing to avoid injecting `scopeId` into non-element selectors such as `:hover`, `::before`, and `[attr]`.
- **Fixed missing default fallback when the file ID is absent**: improved fallback behavior to use a timestamp by default.
- **Fixed missing React `useMemo` imports after top-level variables were optimized into `useMemo`**: improved dependency import injection to ensure `useMemo` is imported correctly.
- **Fixed incorrect detection and handling of `v-on` cases that require function wrapping**: improved function-body expression recognition to generate valid JSX.
- **Fixed component props not being collected as Hook dependencies**: improved dependency analysis so all prop accesses are collected correctly.

### Changed

- **Refactored scoped-style handling into a modular architecture**: split `postcss.ts` into multiple modules under `postcss/` (`index.ts`, `selector.ts`, `standard.ts`, `deep.ts`, `utils.ts`, and `types.ts`) to improve maintainability and extensibility.
- **Improved scoped-style selector processing and transform tolerance**: enhanced selector parsing for better support across complex CSS selector cases.
- **Refactored non-string event-name `emit` calls to use computed property access**: dynamic event names now compile to `props[eventName]?.()` and emit a warning.
- **Refactored the dependency analyzer into multiple submodules**: split responsibilities into smaller modules to improve organization and maintainability.

---

[1.7.0]: https://github.com/vureact-js/core/compare/v1.6.2...v1.7.0

---

## [1.6.2] - 2026-04-21

### Fixed

- **Fixed `:key` on `<template>` not being handled correctly when the template contains multiple children**: the compiler now emits a clear warning when it cannot determine which child should receive the transferred `key`, and tells users that `<template>` should contain only one child in this case.
- **Fixed `:key` on `<template>` being incorrectly moved onto node types that do not support `key`**: when the first child is another `<template>`, a `<slot>`, or another unsupported node type, key transfer is skipped to avoid crashes or invalid output.

### Changed

- **Raised the runtime adapter package version to the latest available version**: synchronized runtime package versions for consistency.

---

[1.6.2]: https://github.com/vureact-js/core/compare/v1.6.1...v1.6.2

---

## [1.6.1] - 2026-04-17

### Changed

- **Simplified `defineAsyncComponent` preprocessing**: now only checks unsupported `hydrate` options.
- **Expanded adapter mapping**: added `defineAsyncComponent` to the adapter mapping list.

---

[1.6.1]: https://github.com/vureact-js/core/compare/v1.6.0...v1.6.1

---

## [1.6.0] - 2026-04-13

### Added

- **Added SFC metadata collection**: component `props`, `emits`, and `options` metadata are now collected during parsing.
- **Added `useAttrs` transform support**: Vue `useAttrs()` calls are transformed to React props and automatically asserted to a `Record` type in TypeScript to isolate original prop type hints.
- **Added TypeScript intersection-type support**: when a component uses `useAttrs`, the props type is automatically extended with a `Record` intersection to preserve complete typing.

### Changed

- **Refactored script metadata collection into a modular parsing-stage solution**: improves maintainability and extensibility.

### Fixed

- **Fixed conflicts between injected imports and top-of-file comments**: improved import injection to preserve alignment with existing leading comments.
- **Fixed incorrect migration of `<template>` nodes with specific directives**: improved template-node handling to avoid moving such nodes directly into generated React output.
- **Fixed `:key` on `<template>` not being transferred correctly**: the `:key` attribute is now moved to the first child node correctly.
- **Fixed function-field type handling in top-level SFC TypeScript declarations**: function fields are no longer incorrectly treated as slots and rewritten as `ReactNode`.

---

[1.6.0]: https://github.com/vureact-js/core/compare/v1.5.2...v1.6.0

---

## [1.5.2] - 2026-04-08

### Fixed

- **Fixed support for classic `<script>` syntax**: rather than producing incomplete, non-runnable React output, unsupported classic-script cases now fail clearly at compile time.

### Changed

- **Removed incomplete handling for classic script syntax**: projects using classic syntax can no longer compile, but this avoids broken runtime behavior.

---

[1.5.2]: https://github.com/vureact-js/core/compare/v1.5.1...v1.5.2

---

## [1.5.1] - 2026-04-04

### Fixed

- **Fixed misplaced comments in generated output**: improved code generation so comment positions stay aligned correctly.
- **Fixed missing string quotes around imported module names when Babel minification was disabled**: improved Babel config handling so import syntax remains valid.
- **Fixed simple literal values being hoisted even when the declaration was not `const`**: improved static-hoisting logic to avoid incorrect hoisting.
- **Fixed conflicts between some injected top-level imports and existing leading comments**: improved import insertion so it remains compatible with existing comment placement.

### Changed

- **Removed unused `@vr` special comments from generated component output**: cleaned up generated code by removing no-longer-needed marker comments.
- **Stopped minifying script output by default**: adjusted default compilation behavior to keep generated scripts more readable for debugging.

---

[1.5.1]: https://github.com/vureact-js/core/compare/v1.5.0...v1.5.1

---

## [1.5.0] - 2026-03-30

### Added

- **Added `output.packageJson` configuration**: allows custom configuration of the generated `package.json` for more flexible output management.

### Fixed

- **Fixed partial event-name normalization and event-handler wrapping behavior**: improved event handling so names are normalized consistently and handlers are wrapped correctly.
- **Fixed slot top-level type rewriting not being skipped for non-SFC script files**: improved type handling so non-SFC files do not receive unnecessary slot rewrites.
- **Fixed `React.memo` imports being injected into plain script files**: improved import injection to avoid injecting React optimization APIs incorrectly.
- **Fixed process not exiting after Vite bootstrap initialization failed**: improved error handling so the process exits correctly on initialization failure.
- **Fixed `dir` utility imports being injected into script files**: improved import analysis to avoid injecting incorrect utility imports.
- **Fixed adapters mistaking same-named local variables for Vue APIs**: improved Vue API recognition to avoid collisions with local bindings.
- **Fixed format conversion for dynamic HTML attribute values of string type**: improved attribute handling so string-valued dynamic attributes are converted correctly.
- **Fixed dynamic HTML `data-*` attributes not being converted to camelCase**: improved dynamic-attribute handling so `data-*` attributes are rewritten correctly.
- **Fixed template literals in HTML attribute values being compiled as plain text**: improved attribute-value handling so template literals are preserved properly.

### Changed

- **Stopped warning on `@import` inside SFC style blocks**: simplified style-import handling and reduced unnecessary warnings.
- **Improved runtime-import injection handling**: optimized runtime import injection for better compilation quality and efficiency.
- **Stopped removing `vue-router` imports**: they are now mapped to `@vureact-router` while preserving type imports.
- **Raised the runtime adapter package version to the latest available version**: synchronized runtime package versions for consistency.
- **Improved scoped-style ID injection logic**: avoids injecting `scopeId` into purely structural elements and other elements that do not require styling.

---

[1.5.0]: https://github.com/vureact-js/core/compare/v1.4.0...v1.5.0

---

## [1.4.0] - 2026-03-22

### Added

- **Added automatic router provider injection into generated React entry files**: simplifies routing setup in compiled React projects.
- **Added file-lock read/write support**: uses `proper-lockfile` for cross-process file locking to prevent data corruption during concurrent compilation.
- **Added support for specifying Vite and React versions inside `bootstrapVite`**: allows custom installation versions for Vite and React.
- **Added automatic workspace cleanup after full compilation failure**: removes incomplete output automatically to keep the workspace clean.
- **Added TypeScript support for VuReact config files**: supports `vureact.config.ts` with better type hints.
- **Added batch cache-update support**: improves cache management with batch update and cleanup behavior.
- **Added the `SetupManager` architecture**: refactors compiler-manager dependency injection for clearer dependency management.
- **Added config loaders and mergers**: separates config loading logic and enables more flexible config merge strategies.

### Fixed

- **Fixed project build failures when Vite was not initialized**: improved the Vite bootstrap flow and error handling.
- **Fixed imprecise dependency collection inside top-level declarations optimized into `useMemo`**: the dependency analyzer now collects only referenced root variables.
- **Fixed top-level declarations optimized into `useMemo` not being recognized as collectible dependencies elsewhere**: improved dependency recognition logic.
- **Fixed CLI options always overriding user configuration**: improved config merging so CLI options override only the required path-related settings.
- **Fixed JSON parse errors on the first compilation**: improved cache-file reads and error recovery.
- **Fixed data corruption when multiple processes operated on the same files during concurrent compilation**: file locking now ensures consistency.
- **Fixed partial cache data loss on every full compilation, which broke incremental compilation**: improved cache persistence logic.
- **Fixed workspace directories not being created when Vite bootstrap was disabled**: the workspace is now always created correctly.
- **Fixed static asset copies bypassing cache optimization on every compilation**: improved asset-manager cache behavior.
- **Fixed generated output files not being removed after deleting the original style files**: improved cleanup handling for style files.
- **Fixed cache records not being updated after deleting files and recompiling**: improved cache update behavior.
- **Fixed unchanged static assets still being counted repeatedly as processed during rebuilds, while unchanged assets were not counted as cached**: improved asset-processing statistics.
- **Fixed cache records and generated output not being removed after style files were deleted**: improved style cleanup behavior.

### Changed

- **Stopped collecting external imports as dependencies**: reduces unnecessary dependency collection and improves compile performance.
- **Improved function-scope dependency collection so not every external function is collected unconditionally**: now only analyzed functions are collected, reducing false positives.
- **Added optional-chaining protection for object-access dependencies**: avoids runtime crashes caused by nullish access.
- **Simplified CLI options to path-related essentials only**: removed behavior-related configuration from the CLI interface.
- **Improved cache maintenance for static assets**: refactored asset cache handling for better performance.
- **Improved CLI statistics after full compilation**: provides clearer compilation summaries.
- **Improved the dependency analyzer**: refactored route configuration handling, improved output quality, and reduced unnecessary `useCallback` wrapping.
- **Improved compiler architecture**: introduced modular types and functional configuration for better maintainability.

### Removed

- **Removed automatic output of router adaptation guides inside generated projects**: routing is now configured through injected providers instead.
- **Removed all behavior-related CLI configuration options**: the CLI now keeps only essential path configuration.
- **Removed the compiler `templates` directory**: deleted unused router template files.
- **Removed many long comments and simplified class/method documentation**: keeps the codebase cleaner and easier to read.

---

[1.4.0]: https://github.com/vureact-js/core/compare/v1.3.0...v1.4.0

---

## [1.3.0] - 2026-03-17

### Added

- **Added CLI update checks**: new versions are checked automatically when the CLI starts.
- **Added route configuration documentation**: usage guides are generated automatically when routing is enabled.
- **Added support for the `update-notifier` dependency**.

### Fixed

- **Fixed ref variable access inside `v-for` loops**: `.value` is now appended automatically where required.
- **Fixed event-call transforms**: event calls are now normalized to optional invocation (`onClick?.()`).
- **Fixed optional-chaining protection in dependency analysis**: prevents runtime errors caused by `ref.value` access.
- **Fixed cache management to avoid storing raw style source code**: reduces cache size.
- **Fixed CLI build configuration to ensure the correct shebang is injected**.

### Changed

- **Improved the example project layout**: removed old example projects.
- **Updated the README**: improved the project description and badge layout.
- **Improved compilation pipeline execution**: better error handling and progress reporting.

---

[1.3.0]: https://github.com/vureact-js/core/compare/v1.2.1...v1.3.0

---

## [1.2.1] - 2026-03-15

### Fixed

- **Fixed `provide` transform logic**: improved prop handling for the generated Provider component.
- **Fixed event-call transforms**: all event calls are now rewritten to optional invocation form (`onClick?.()`).
- **Fixed event-name generation in `v-model` transforms**.
- **Fixed `scopeId` injection on `template` and `slot` outlet nodes in templates**: these nodes no longer receive invalid scope markers.
- **Fixed slot-scope parameter typing**: now supports fields with hyphens and other non-identifier names.
- **Fixed imports for types such as `ReactNode`**: the `type` modifier is now injected correctly.
- **Fixed Vue Router history-mode API adapter mappings**.
- **Fixed `emit` event-name formatting**: supports transforms such as `update:xxx` -> `onUpdateXxx`.
- **Fixed `provide` transform ordering**: original calls are now collected and removed before renaming occurs.
- **Fixed scope-attribute injection logic**: avoids incorrect injection on specific node types.

---

[1.2.1]: https://github.com/vureact-js/core/compare/v1.2.0...v1.2.1

---

## [1.2.0] - 2026-03-06

### Added

- **Added transform support for the `defineExpose` macro API**.
- **Added `React.forwardRef` wrapping for components that use `defineExpose`**.
- **Improved API adaptation handling**.
- **Improved component ref handling**.

---

[1.2.0]: https://github.com/vureact-js/core/compare/v1.1.1...v1.2.0

---

## [1.1.1] - 2026-03-05

### Fixed

- **Fixed imported `.less` and `.scss` file extensions not being rewritten to `.css` when style preprocessing was enabled**.

---

[1.1.1]: https://github.com/vureact-js/core/compare/v1.1.0...v1.1.1

---

## [1.1.0] - 2026-03-05

### Added

- **Added standalone compilation support for style files** such as `.less` and `.sass`.
- **Added support for rewriting imported style files such as `.scss` to `.css`**.

---

[1.1.0]: https://github.com/vureact-js/core/compare/v1.0.4...v1.1.0

---

## [1.0.4] - 2026-03-05

### Fixed

- **Fixed slot typing so default slots without parameters, and non-scoped slots, use `ReactNode`**.
- **Fixed preset ignore lists not taking effect when `ignoreAssets` was not configured**.

---

[1.0.4]: https://github.com/vureact-js/core/compare/v1.0.3...v1.0.4

---

## [1.0.3] - 2026-03-04

### Fixed

- **Fixed generated TSX components so function parameters are emitted only when the original Vue component actually has props**.
- **Fixed special characters in template text not being handled correctly during Vue-template-to-JSX compilation**.

---

[1.0.3]: https://github.com/vureact-js/core/compare/v1.0.2...v1.0.3

---

## [1.0.2] - 2026-03-04

### Fixed

- **Fixed the `VUE_PACKAGES` constant configuration**: added `@vureact/compiler-core` to the exclusion list so it is not carried into generated React projects.

---

[1.0.2]: https://github.com/vureact-js/core/compare/v1.0.1...v1.0.2

---

## [1.0.1] - 2026-03-04

### Added

- chore: bump version to 1.0.1

### Fixed

- **Fixed incorrect production CLI entry references**.

### Docs

- add comprehensive JSDoc comments to core compiler classes
- update CHANGELOG with detailed 1.0.0 release notes

---

[1.0.1]: https://github.com/vureact-js/core/compare/v1.0.0...v1.0.1

---

## [1.0.0] - 2026-03-03

### 🚩 Milestone Release: VuReact 1.0.0 — "Mind Control"

This is the first preview release of VuReact, codenamed "Mind Control." It marks an important milestone in moving Vue-to-React compilation from proof of concept into engineering practice.

### ✨ Core Features

- **Complete compilation pipeline architecture**: a modern compiler architecture built on Babel and the Vue SFC compiler.
- **Comprehensive Vue 3 SFC support**: full compilation support for `<template>`, `<script setup>`, and `<style>`.
- **Seamless TypeScript migration**: preserves type definitions and generates React component prop types automatically.
- **Zero-runtime styling system**: processes scoped and module styles at compile time and outputs static CSS files.
- **Intelligent reactive-system adaptation**: adapts Vue 3 APIs such as `ref`, `computed`, `watch`, and `reactive` into React Hooks.

### Added

#### Compiler Core

- **File compiler (`FileCompiler`)**: supports both single-file and batch compilation through a unified interface.
- **Configuration system**: supports `vureact.config.js` for custom compilation behavior.
- **Plugin-system architecture**: reserves plugin hooks for custom transform rules.
- **Intelligent cache mechanism**: hash-based incremental compilation for substantially faster builds.
- **Error recovery**: graceful error handling and recovery so single-file failures do not break the whole compilation run.

#### Template Transforms

- **Vue template to JSX transforms**: full support for converting Vue template syntax into React JSX.
- **Directive support**: transforms for `v-if`, `v-else`, `v-else-if`, `v-for`, `v-model`, `v-show`, `v-on`, `v-bind`, and more.
- **Event-system transforms**: converts listeners such as `@click` and `@input` into React's event model.
- **Slot-system adaptation**: converts default, named, and scoped Vue slots into React children/props patterns.
- **Dynamic component support**: transforms `<component :is="...">` into React dynamic-component patterns.

#### Script Transforms

- **`<script setup>` support**: full support for Vue 3 `<script setup>` syntax sugar.
- **Composition API transforms**: support for compiler macros such as `defineProps`, `defineEmits`, and `defineExpose`.
- **Reactive API adaptation**:
  - `ref()` -> `useState()` / `useRef()`
  - `computed()` -> `useMemo()`
  - `watch()` -> `useEffect()` + dependency tracking
  - `reactive()` -> custom reactive hooks
- **Lifecycle hook mapping**: Vue lifecycle hooks are mapped into React lifecycle behavior.
- **Provide/Inject transforms**: converts Vue dependency injection into React Context patterns.

#### Style Processing

- **Scoped CSS support**: automatically generates unique selectors for style isolation.
- **CSS Modules support**: supports `.module.css`, `.module.scss`, and `.module.less`.
- **Preprocessor integration**: built-in Sass, Less, and Stylus support.
- **PostCSS processing**: supports PostCSS plugin chains.
- **Style extraction**: extracts styles from SFCs into standalone CSS files.

#### CLI Tooling

- **`vureact build` command**: one-shot compilation for an entire project.
- **`vureact watch` command**: watches files and recompiles on change.
- **Progress indicators**: uses `ora` for friendly compile progress feedback.
- **Colorized output**: uses `kleur` for readable terminal output.
- **Automatic config discovery**: finds `vureact.config.js` automatically in the project.

#### Engineering Support

- **Vite project integration**: automatically bootstraps a standard React + TypeScript + Vite project layout.
- **Hybrid development mode**: allows Vue and React components to coexist and interoperate in one project.
- **Dependency analysis**: analyzes import dependencies intelligently to rewrite import paths correctly.
- **Path alias support**: supports Webpack and Vite path alias configuration.
- **Asset handling**: copies and processes images, fonts, and other static assets.

### Changed

#### Architecture Improvements

- **Modular architecture refactor**: split the compiler into core, CLI, and utility modules.
- **Stronger type system**: uses TypeScript strict mode and provides comprehensive type definitions.
- **Build system optimization**: uses `tsup` and outputs both ESM and CJS formats.
- **Dependency management optimization**: controls dependency versions precisely to reduce package size.

#### Performance Improvements

- **Faster compilation**: improves performance through caching and parallel processing.
- **Lower memory usage**: improves AST processing to reduce memory overhead.
- **Better incremental compilation**: uses content-hash-based cache invalidation.

#### Developer Experience

- **Better error messages**: provides more detailed and actionable diagnostics with code locations.
- **Warning system**: non-fatal problems now surface as warnings instead of hard failures where possible.
- **Debug support**: adds more detailed debug logging options.
- **Documentation improvements**: provides fuller API docs and usage examples.

### Fixed

#### Template Transform Fixes

- **Complex nested templates**: fixed transform issues in deeply nested `v-if` and `v-for` scenarios.
- **Conditional rendering edge cases**: fixed edge cases involving `v-if` used together with `v-else`.
- **List rendering keys**: automatically adds appropriate `key` props to elements generated from `v-for`.
- **Event modifiers**: fixed handling for modifiers such as `.stop`, `.prevent`, and `.self`.
- **Dynamic bindings**: fixed transforms for `:class`, `:style`, and similar dynamic bindings.

#### Script Transform Fixes

- **Type inference improvements**: improved preservation and inference of TypeScript types during transforms.
- **Generic component support**: fixed Vue generic component transforms into React.
- **Async component handling**: fixed transforms for `defineAsyncComponent`.
- **Custom directives**: fixed baseline support for custom directives.
- **Global property access**: fixed access to globals such as `$attrs`, `$slots`, and `$emit`.

#### Style Processing Fixes

- **Scoped CSS selectors**: fixed generation for complex selectors under scoped mode.
- **Deep selectors**: fixed handling for `::v-deep`, `:deep()`, and similar patterns.
- **CSS variable support**: fixed CSS custom-property propagation and handling.
- **Media queries**: fixed processing for styles containing media queries.
- **Style priority**: ensures generated styles preserve the correct cascade order.

#### Engineering Fixes

- **Import path resolution**: fixed relative-path and alias-path resolution.
- **Circular dependency detection**: improved detection and handling of circular dependencies.
- **File encoding handling**: correctly handles source files with different encodings.
- **Line-ending consistency**: ensures generated files use consistent line endings.

### Security

#### Dependency Security

- **Regular dependency updates**: all production dependencies were updated to the latest secure versions.
- **Development dependency management**: development tooling stays on the latest stable versions.
- **Security audits**: uses `npm audit` regularly.

#### Code Security

- **Input validation**: validates and sanitizes all user inputs strictly.
- **Path traversal protection**: protects against path traversal.
- **Code-injection prevention**: ensures generated code is free from injection vulnerabilities.

#### Build Security

- **Source integrity**: ensures the build process does not introduce malicious code.
- **Release verification**: adds a strict pre-release validation flow.
- **Signature verification planning**: considers future package-signing support.

### 🔧 Tech Stack Details

#### Core Dependencies

- **@vue/compiler-sfc**: parses Vue 3 SFC files.
- **@babel/parser**: parses JavaScript and TypeScript.
- **@babel/traverse**: traverses Babel ASTs for transforms.
- **@babel/generator**: generates target code from transformed ASTs.
- **postcss**: processes and optimizes styles.

#### Development Tooling

- **TypeScript**: type-safe development.
- **tsup**: fast build tooling with dual ESM/CJS output.
- **tsx**: TypeScript execution environment for development and testing.

#### CLI Tooling

- **cac**: lightweight CLI framework.
- **ora**: terminal spinner.
- **kleur**: colored terminal output.
- **chokidar**: efficient file watching.

#### Style Processing

- **sass**: Sass/SCSS preprocessor.
- **less**: Less preprocessor.
- **autoprefixer**: automatic CSS vendor-prefix handling.

### 📁 Project Structure

```txt
compiler-core/
├── src/
│   ├── cli/                    # CLI command tooling
│   │   ├── index.ts           # CLI entry
│   │   ├── action.ts          # command execution logic
│   │   └── option.ts          # CLI option parsing
│   ├── compiler/              # compiler core
│   │   ├── index.ts           # compiler entry
│   │   ├── context/           # compilation context
│   │   └── shared/            # shared compilation logic
│   │       ├── base-compiler.ts  # base compiler
│   │       ├── file-compiler.ts  # file compiler
│   │       ├── define-config.ts  # config definitions
│   │       └── types.ts       # type definitions
│   ├── plugins/               # plugin system (reserved)
│   ├── shared/                # shared utilities
│   ├── utils/                 # helper functions
│   └── consts/                # constants
├── examples/                  # example projects
│   ├── 01-messy-vue-sfc/      # complex Vue project example
│   └── 02-vite-vue3-standard/ # standard Vite Vue project
├── lib/                       # build output
├── bin/                       # CLI executables
└── package.json              # project config
```

---

[1.0.0]: https://github.com/vureact-js/core/compare/v1.0.0...HEAD

---

## How to Update This Changelog

### For Contributors

When making changes, please add entries to the appropriate section under [Unreleased].

### For Maintainers

When releasing a new version:

1. Update the version number in `packages/compiler-core/package.json`
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
[Unreleased]: https://github.com/vureact-js/core/compare/v1.9.0...HEAD
[1.9.0]: https://github.com/vureact-js/core/compare/v1.8.5...v1.9.0
[1.8.5]: https://github.com/vureact-js/core/compare/v1.8.4...v1.8.5
[1.8.4]: https://github.com/vureact-js/core/compare/v1.8.3...v1.8.4
[1.8.3]: https://github.com/vureact-js/core/compare/v1.8.1...v1.8.3
[1.8.1]: https://github.com/vureact-js/core/compare/v1.8.0...v1.8.1
[1.8.0]: https://github.com/vureact-js/core/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/vureact-js/core/compare/v1.6.2...v1.7.0
[1.6.2]: https://github.com/vureact-js/core/compare/v1.6.1...v1.6.2
[1.6.1]: https://github.com/vureact-js/core/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/vureact-js/core/compare/v1.5.2...v1.6.0
[1.5.2]: https://github.com/vureact-js/core/compare/v1.5.1...v1.5.2
[1.5.1]: https://github.com/vureact-js/core/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/vureact-js/core/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/vureact-js/core/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/vureact-js/core/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/vureact-js/core/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/vureact-js/core/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/vureact-js/core/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/vureact-js/core/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/vureact-js/core/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/vureact-js/core/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/vureact-js/core/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/vureact-js/core/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/vureact-js/core/compare/v1.0.0...HEAD
```
