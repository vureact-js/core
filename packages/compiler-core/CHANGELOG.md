# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.4] - 2026-03-05

### Fiexd

- 修复当是默认插槽且没有参数，或者是非作用域插槽（没有参数），则使用 ReactNode 类型
- 修复当 ignoreAssets 选项没有配置时，预设的排除列表没有生效

---

## [1.0.3] - 2026-03-04

### Fiexd

- 修复只有当 Vue 组件有 props 时，编译后的 TSX 组件才返回组件函数参数
- 修复 Vue 模板编译到 JSX 时，文本中的特殊字符没有被正确处理

---

## [1.0.2] - 2026-03-04

### Fixed

- 修复 VUE_PACKAGES 常量配置，添加 `@vureact/compiler-core` 到排除列表，避免将其带到 React 项目中

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

### 🎯 使用场景

#### 理想场景

1. **Vue 3 项目迁移**：将现有 Vue 3 项目逐步迁移到 React
2. **混合技术栈**：在 React 项目中引入 Vue 组件
3. **团队技术栈统一**：统一前端团队的技术栈
4. **库作者适配**：为 Vue 组件库提供 React 版本

#### 限制说明

1. **Vue 2 不支持**：仅支持 Vue 3 Composition API
2. **服务端渲染**：SSR 支持仍在开发中
3. **浏览器 API**：某些浏览器特定 API 可能需要手动适配
4. **第三方库**：部分 Vue 生态库需要额外适配器

### 🔄 未来规划

#### 短期目标

- **测试覆盖率**：达到 90% 以上的测试覆盖率
- **性能优化**：进一步优化编译速度和内存使用
- **错误恢复**：改进错误处理和恢复机制

#### 中期目标

- **插件系统**：完整的插件生态系统
- **SSR 支持**：服务端渲染支持
- **更多示例**：丰富的示例和最佳实践

#### 长期愿景

- **双向编译**：支持 React 到 Vue 的反向编译
- **AI 辅助**：AI 驱动的代码转换建议
- **生态整合**：深度集成主流前端工具链

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

[Unreleased]: https://github.com/vureact-js/core/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/vureact-js/core/releases/tag/v1.0.0
