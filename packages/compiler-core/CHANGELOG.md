# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2026-03-30

### Added

- **新增 `output.packageJson` 配置选项**：支持对产物 `package.json` 内容进行自定义配置，提供更灵活的产物管理

### Fixed

- **修复部分事件名未规范化与事件处理函数包裹问题**：改进事件处理逻辑，确保事件名格式统一和函数正确包裹
- **修复非 SFC 脚本文件未跳过 slot 顶层类型改写问题**：优化类型处理逻辑，避免对非 SFC 文件进行不必要的类型改写
- **修复脚本文件被注入 `React.memo` 导入的问题**：改进导入注入逻辑，避免错误注入 React 优化 API
- **修复初始化 Vite 失败但终端进程未结束问题**：改进错误处理机制，确保进程在初始化失败时正确退出
- **修复脚本文件被注入 `dir` 工具包导入的问题**：优化导入分析，避免错误注入工具包导入
- **修复适配器把同名局部变量识别为 Vue API 的问题**：改进 Vue API 识别逻辑，避免与局部变量冲突
- **修复 HTML 动态属性值为字符串类型时的格式转换错误**：改进属性值处理，确保字符串类型属性正确转换
- **修复 HTML 的 `data-*` 为动态属性时，未转换成小驼峰格式**：改进动态属性处理，确保 `data-*` 属性正确转换为小驼峰格式
- **修复 HTML 属性值为模板字面量时，被编译为纯文本的问题**：改进属性值处理逻辑，确保模板字面量正确保留

### Changed

- **不再对 SFC style 块的 `@import` 发出警告**：简化样式导入处理，减少不必要的警告信息
- **优化需要运行时 import 注入的处理逻辑**：改进运行时导入注入机制，提升编译效率和代码质量
- **`vue-router` 导入不再删除，映射为 `@vureact-router` 且保留类型导入**：改进路由导入处理，确保类型信息完整保留
- **提升运行时适配包的版本号至当前最新**：同步更新运行时适配包版本，确保版本一致性
- **优化作用域样式 ID 注入逻辑**：避免向纯结构元素等不需要样式的元素注入 `scopeId`

---

[1.5.0]: https://github.com/vureact-js/core/compare/v1.4.0...v1.5.0

---

## [1.4.0] - 2026-03-22

### Added

- **新增 React 产物入口文件注入路由提供器**：自动在编译后的 React 项目中注入路由提供器，简化路由配置
- **新增文件锁读写机制**：基于 `proper-lockfile` 实现跨进程文件锁，解决并发编译场景下的数据混乱问题
- **新增支持在 `bootstrapVite` 选项中指定 Vite 版本和 React 版本**：允许用户自定义 Vite 和 React 的安装版本
- **新增全量编译失败后自动移除工作区产物**：编译失败时自动清理不完整的输出，保持工作区干净
- **新增支持 TypeScript 类型的 vureact 配置文件**：支持 `vureact.config.ts` 配置文件，提供更好的类型提示
- **新增批量缓存更新功能**：优化缓存管理，支持批量更新和清理缓存记录
- **新增 SetupManager 架构**：重构编译器管理器依赖注入，提供更清晰的依赖管理
- **新增配置加载器和合并器**：分离配置加载逻辑，支持更灵活的配置合并策略

### Fixed

- **修复未初始化 Vite 时导致项目构建失败问题**：改进 Vite 初始化流程，提供更好的错误处理
- **修复被优化为 `useMemo` 的顶层变量声明，其内部依赖收集不精确**：改进依赖分析器，只收集引用的根变量
- **修复被优化为 `useMemo` 的顶层变量声明，在其他地方使用时未被识别为可收集的依赖**：优化依赖识别逻辑
- **修复编译器 CLI 选项总是覆盖用户配置**：改进配置合并策略，CLI 选项只覆盖必要的路径相关配置
- **修复首次编译出现 JSON 解析报错问题**：改进缓存文件读取，提供更好的错误恢复
- **修复并发编译场景下，多个进程操作同一文件导致数据混乱**：通过文件锁机制确保数据一致性
- **修复每次执行全量编译，都有一部分缓存数据丢失，导致增量编译功能失效**：改进缓存持久化逻辑
- **修复关闭 Vite 初始化导致未创建工作区目录**：确保工作区目录始终被正确创建
- **修复每次编译时静态资产的拷贝没有经过缓存优化**：改进资产管理器缓存逻辑
- **修复删除原样式文件后，对应产物文件未被删除**：完善清理管理器，支持样式文件清理
- **修复当删除文件并重新编译后，缓存记录未更新**：改进缓存更新机制
- **修复静态资产无改动但重复构建仍出现已处理了多少文件，且无改动资产未计入缓存数**：优化资产处理统计
- **修复删除样式文件后，没有同步删除对应产物文件和缓存记录**：完善样式文件清理流程

### Changed

- **优化外部 import 不再作为依赖被收集**：减少不必要的依赖收集，提升编译性能
- **优化函数内部的依赖收集不再把所有外部函数都无条件收集**：只收集已分析过的函数，减少误判
- **优化对对象访问形式的依赖添加一层可选链保护**：防止运行时的空值访问导致崩溃
- **优化 CLI 只保留路径相关的必要选项**：简化 CLI 接口，移除行为相关配置
- **优化对静态资产的缓存维护流程**：改进资产缓存管理，提升性能
- **优化全量编译后的 CLI 统计信息**：提供更清晰的编译统计报告
- **优化依赖分析器**：重构路由配置，提升编译质量，减少不必要的 `useCallback` 包装
- **优化编译器架构**：引入模块化类型和函数式配置，提升代码可维护性

### Removed

- **移除在项目工程中自动输出路由适配指南的功能**：简化输出，路由配置现在通过注入提供器实现
- **移除 CLI 所有与行为相关的配置选项**：简化 CLI 接口，只保留必要的路径配置
- **移除编译器 templates 目录**：删除不再使用的路由配置模板文件
- **移除大量冗长注释，简化类和方法文档**：保持代码简洁，提高可读性

---

[1.4.0]: https://github.com/vureact-js/core/compare/v1.3.0...v1.4.0

---

## [1.3.0] - 2026-03-17

### Added

- 新增 CLI 更新检查功能，启动时自动检查新版本
- 新增路由配置说明文档，使用路由时自动生成配置指南
- 新增对 `update-notifier` 依赖的支持

### Fixed

- 修复 `v-for` 循环中 ref 变量访问，自动添加 `.value` 后缀
- 修复事件调用转换，统一改为可选调用（`onClick?.()`）
- 修复依赖分析中的可选链保护，避免 ref.value 访问导致的运行时错误
- 修复缓存管理，避免存储样式源码，减少缓存体积
- 修复 CLI 构建配置，确保正确的 shebang 注入

### Changed

- 优化示例项目结构，移除旧的示例项目
- 更新 README 文档，改进项目描述和徽章布局
- 优化编译管线执行流程，改进错误处理和进度显示

---

[1.3.0]: https://github.com/vureact-js/core/compare/v1.2.1...v1.3.0

---

## [1.2.1] - 2026-03-15

### Fixed

- 修复 `provide` 转换逻辑，改进 Provider 组件的属性处理
- 修复事件调用转换，统一将事件调用变为可选的（`onClick?.()`）
- 修复 `v-model` 转换中的事件名生成逻辑
- 修复模板中 `template` 和 `slot` 出口节点不应注入 `scopeId` 的问题
- 修复插槽作用域参数类型定义，支持包含连字符等非法标识符的字段
- 修复 `ReactNode` 等类型导入，确保正确添加 `type` 修饰符
- 修复 Vue Router 历史模式 API 的适配映射
- 修复 `emit` 事件名格式化，支持 `update:xxx` -> `onUpdateXxx` 转换
- 修复 `provide` 处理顺序，确保在重命名之前收集并移除原始调用
- 修复样式作用域属性注入逻辑，避免在特定节点上错误注入

---

[1.2.1]: https://github.com/vureact-js/core/compare/v1.2.0...v1.2.1

---

## [1.2.0] - 2026-03-06

### Added

- 新增对 `defineExpose` 宏 API 的转换处理
- 新增使用 `defineExpose` 的场景下，通过 `React.forwardRef` 包装组件
- 优化 API 适配处理
- 优化对组件 ref 的处理

---

[1.2.0]: https://github.com/vureact-js/core/compare/v1.1.1...v1.2.0

---

## [1.1.1] - 2026-03-05

### Fiexd

- 修复当样式预处理启用时，样式文件里导入的 `.less`/`.scss` 文件后缀没有替换成 `.css`

---

[1.1.1]: https://github.com/vureact-js/core/compare/v1.1.0...v1.1.1

---

## [1.1.0] - 2026-03-05

### Added

- 新增单独对 style 文件的编译处理，如 `.less` 和 `.sass` 等
- 支持对文件内 import 的样式文件，如 `.scss` 等替换成 `.css`

---

[1.1.0]: https://github.com/vureact-js/core/compare/v1.0.4...v1.1.0

---

## [1.0.4] - 2026-03-05

### Fiexd

- 修复当是默认插槽且没有参数，或者是非作用域插槽（没有参数），则使用 ReactNode 类型
- 修复当 ignoreAssets 选项没有配置时，预设的排除列表没有生效

---

[1.0.4]: https://github.com/vureact-js/core/compare/v1.0.3...v1.0.4

---

## [1.0.3] - 2026-03-04

### Fiexd

- 修复只有当 Vue 组件有 props 时，编译后的 TSX 组件才返回组件函数参数
- 修复 Vue 模板编译到 JSX 时，文本中的特殊字符没有被正确处理

---

[1.0.3]: https://github.com/vureact-js/core/compare/v1.0.2...v1.0.3

---

## [1.0.2] - 2026-03-04

### Fixed

- 修复 VUE_PACKAGES 常量配置，添加 `@vureact/compiler-core` 到排除列表，避免将其带到 React 项目中

---

[1.0.2]: https://github.com/vureact-js/core/compare/v1.0.1...v1.0.2

---

## [1.0.1] - 2026-03-04

### Added

- chore: bump version to 1.0.1

### Fixed

- 修复生产环境CLI入口文件引用错误

### Docs

- add comprehensive JSDoc comments to core compiler classes
- update CHANGELOG with detailed 1.0.0 release notes

---

[1.0.1]: https://github.com/vureact-js/core/compare/v1.0.0...v1.0.1

---

## [1.0.0] - 2026-03-03

### 🚩 里程碑版本：VuReact 1.0.0 —— "心灵控制"

这是 VuReact 的第一个先行版本，代号"心灵控制"。此版本标志着 Vue 到 React 编译从概念验证走向工程实践的重要里程碑。

### ✨ 核心特性

- **完整的编译流水线架构**：基于 Babel 和 Vue SFC 编译器的现代化编译架构
- **Vue 3 SFC 全面支持**：完整支持 `<template>`、`<script setup>`、`<style>` 三部分编译
- **TypeScript 无缝迁移**：完整保留类型定义，自动生成 React 组件类型接口
- **零运行时样式系统**：编译时处理 scoped/module 样式，生成静态 CSS 文件
- **响应式系统智能适配**：`ref`、`computed`、`watch`、`reactive` 等 Vue 3 API 的 React Hooks 适配

### Added

#### 编译器核心功能

- **文件编译器 (`FileCompiler`)**：支持单文件和批量编译，提供统一的编译接口
- **配置系统**：支持 `vureact.config.js` 配置文件，可自定义编译选项
- **插件系统架构**：预留插件接口，支持自定义转换规则
- **智能缓存机制**：基于文件哈希的增量编译，大幅提升编译速度
- **错误恢复机制**：优雅的错误处理和恢复，避免单文件错误影响整体编译

#### 模板转换能力

- **Vue 模板到 JSX 转换**：完整支持 Vue 模板语法到 React JSX 的转换
- **指令系统支持**：`v-if`、`v-else`、`v-else-if`、`v-for`、`v-model`、`v-show`、`v-on`、`v-bind` 等指令转换
- **事件系统转换**：`@click`、`@input` 等事件监听器转换为 React 事件系统
- **插槽系统适配**：Vue 插槽（默认插槽、具名插槽、作用域插槽）转换为 React children/props
- **动态组件支持**：`<component :is="...">` 转换为 React 动态组件

#### 脚本转换能力

- **`<script setup>` 语法支持**：完整支持 Vue 3 `<script setup>` 语法糖
- **Composition API 转换**：`defineProps`、`defineEmits`、`defineExpose` 等编译宏转换
- **响应式 API 适配**：
  - `ref()` → `useState()` / `useRef()`
  - `computed()` → `useMemo()`
  - `watch()` → `useEffect()` + 依赖追踪
  - `reactive()` → 自定义响应式 Hook
- **生命周期钩子映射**：Vue 生命周期钩子转换为 React 生命周期
- **Provide/Inject 转换**：Vue 依赖注入系统转换为 React Context

#### 样式处理能力

- **Scoped CSS 支持**：自动生成唯一选择器，实现样式隔离
- **CSS Modules 支持**：`.module.css`、`.module.scss`、`.module.less` 文件支持
- **预处理器集成**：内置 Sass、Less、Stylus 支持
- **PostCSS 处理**：支持 PostCSS 插件链
- **样式提取**：将样式从 SFC 中提取为独立的 CSS 文件

#### CLI 工具链

- **`vureact build` 命令**：一次性编译整个项目
- **`vureact watch` 命令**：监听文件变化，实时编译
- **进度指示器**：使用 `ora` 提供友好的编译进度反馈
- **彩色输出**：使用 `kleur` 提供高可读性的彩色终端输出
- **配置文件自动发现**：自动查找项目中的 `vureact.config.js`

#### 工程化支持

- **Vite 项目集成**：自动初始化标准 React + TypeScript + Vite 项目结构
- **混合开发模式**：支持 Vue 和 React 组件在同一项目中并存和互操作
- **依赖分析**：智能分析 import 依赖，确保正确的导入路径转换
- **路径别名支持**：支持 Webpack/Vite 路径别名配置
- **资源文件处理**：图片、字体等静态资源文件的复制和处理

### Changed

#### 架构改进

- **模块化架构重构**：将编译器拆分为核心模块、CLI 模块、工具模块
- **类型系统强化**：使用 TypeScript 严格模式，提供完整的类型定义
- **构建系统优化**：使用 `tsup` 进行构建，支持 ESM 和 CJS 双格式输出
- **依赖管理优化**：精确控制依赖版本，减少包体积

#### 性能优化

- **编译速度提升**：通过缓存和并行处理优化编译性能
- **内存使用优化**：改进 AST 处理，减少内存占用
- **增量编译优化**：基于内容哈希的智能缓存失效策略

#### 开发者体验

- **错误信息改进**：提供更详细、可操作的错误信息和代码位置提示
- **警告系统**：非致命问题提供警告而非错误，允许继续编译
- **调试支持**：提供详细的调试日志选项
- **文档完善**：提供完整的 API 文档和使用示例

### Fixed

#### 模板转换修复

- **复杂嵌套模板**：修复多层 `v-if`、`v-for` 嵌套的转换问题
- **条件渲染边界情况**：修复 `v-if` 与 `v-else` 配合使用的边界情况
- **列表渲染 Key**：自动为 `v-for` 生成的元素添加合适的 `key` 属性
- **事件修饰符**：修复 `.stop`、`.prevent`、`.self` 等事件修饰符的处理
- **动态属性绑定**：修复 `:class`、`:style` 动态绑定的转换

#### 脚本转换修复

- **类型推导改进**：改进 TypeScript 类型在转换过程中的保留和推导
- **泛型组件支持**：修复泛型 Vue 组件转换为 React 组件的问题
- **异步组件处理**：修复 `defineAsyncComponent` 的转换
- **自定义指令**：修复自定义指令的基本支持
- **全局属性访问**：修复 `$attrs`、`$slots`、`$emit` 等全局属性的访问

#### 样式处理修复

- **Scoped CSS 选择器**：修复复杂选择器在 scoped 模式下的生成
- **深度选择器**：修复 `::v-deep`、`:deep()` 等深度选择器的处理
- **CSS 变量支持**：修复 CSS 自定义变量的传递和处理
- **媒体查询**：修复包含媒体查询的样式处理
- **样式优先级**：确保转换后的样式保持正确的优先级顺序

#### 工程问题修复

- **导入路径解析**：修复相对路径和别名路径的解析问题
- **循环依赖检测**：改进循环依赖的检测和处理
- **文件编码处理**：正确处理不同编码的源文件
- **行尾符一致性**：确保生成文件的行尾符一致性

### Security

#### 依赖安全

- **定期依赖更新**：所有生产依赖更新到最新安全版本
- **开发依赖管理**：开发工具链保持最新稳定版本
- **安全审计**：使用 npm audit 定期进行安全审计

#### 代码安全

- **输入验证**：对所有用户输入进行严格的验证和清理
- **路径遍历防护**：防止路径遍历攻击
- **代码注入防护**：确保生成的代码安全无注入漏洞

#### 构建安全

- **源码完整性**：确保构建过程不引入恶意代码
- **发布验证**：严格的发布前验证流程
- **签名验证**：考虑未来添加发布包签名验证

### 🔧 技术栈详情

#### 核心依赖

- **@vue/compiler-sfc**: Vue 3 SFC 解析器，用于解析 `.vue` 文件
- **@babel/parser**: Babel 解析器，用于解析 JavaScript/TypeScript
- **@babel/traverse**: Babel AST 遍历器，用于代码转换
- **@babel/generator**: Babel 代码生成器，用于生成目标代码
- **postcss**: CSS 处理工具，用于样式转换和优化

#### 开发工具

- **TypeScript**: 类型安全的开发体验
- **tsup**: 极速构建工具，支持 ESM/CJS 双格式
- **tsx**: TypeScript 执行环境，用于开发和测试

#### CLI 工具

- **cac**: 轻量级 CLI 框架
- **ora**: 优雅的终端 spinner
- **kleur**: 终端彩色输出
- **chokidar**: 高效的文件监听库

#### 样式处理

- **sass**: Sass/SCSS 预处理器
- **less**: Less 预处理器
- **autoprefixer**: 自动添加 CSS 前缀

### 📁 项目结构

```txt
compiler-core/
├── src/
│   ├── cli/                    # CLI 命令行工具
│   │   ├── index.ts           # CLI 入口
│   │   ├── action.ts          # 命令执行逻辑
│   │   └── option.ts          # 命令行选项解析
│   ├── compiler/              # 编译器核心
│   │   ├── index.ts           # 编译器主入口
│   │   ├── context/           # 编译上下文
│   │   └── shared/            # 共享编译逻辑
│   │       ├── base-compiler.ts  # 基础编译器
│   │       ├── file-compiler.ts  # 文件编译器
│   │       ├── define-config.ts  # 配置定义
│   │       └── types.ts       # 类型定义
│   ├── plugins/               # 插件系统（预留）
│   ├── shared/                # 共享工具
│   ├── utils/                 # 工具函数
│   └── consts/                # 常量定义
├── examples/                  # 示例项目
│   ├── 01-messy-vue-sfc/     # 复杂 Vue 项目示例
│   └── 02-vite-vue3-standard/ # 标准 Vite Vue 项目
├── lib/                       # 构建输出目录
├── bin/                       # CLI 可执行文件
└── package.json              # 项目配置
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

```md
[Unreleased]: https://github.com/vureact-js/core/compare/v1.5.0...HEAD
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
