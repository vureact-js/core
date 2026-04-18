# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-04-17

### Added

- **新增 `defineAsyncComponent` 适配器工具**：完整的异步组件支持，包含类型定义和测试用例
- **重构 `Suspense` 组件为目录结构**：将 Suspense 组件重构为模块化目录结构，添加上下文支持
- **新增 Suspense 子组件**：添加 `Suspense/Content.tsx` 和 `Suspense/Fallback.tsx` 组件，提供更灵活的 Suspense 使用方式

### Changed

- **优化 package.json 描述和关键词**：更新项目描述，添加更多相关关键词，提升可发现性
- **重构构建脚本**：将 `clean` 和 `build` 命令合并为单个 `build` 命令，简化构建流程

---

[1.1.0]: https://github.com/vureact-js/core/compare/v1.0.1...v1.1.0

---

## [1.0.1] - 2026-03-05

### Changed

- **重构 README 文件结构**：将中文设为主要语言，英文作为备选版本，优化文档组织结构
- **添加 npm 包徽章**：在 README 中添加版本、下载量、许可证和 React 版本徽章，提升项目可信度
- **更新作者信息**：将作者信息从 "Ryan John" 更新为 "Ruihong Zhong (Ryan John)"
- **优化项目主页链接**：移除主页链接中的语言后缀，统一使用主域名

### Fixed

- **修复 repository.directory 配置**：将目录路径从 `tree/master/packages/runtime-core` 修正为 `packages/runtime-core`

---

[1.0.1]: https://github.com/vureact-js/core/compare/v1.0.0...v1.0.1

---

## [1.0.0] - 2026-03-04

### 🚀 里程碑版本：@vureact/runtime-core 1.0.0 —— 从 Beta 到正式版

这是 @vureact/runtime-core 的第一个正式版本，标志着从 Beta 版本到生产就绪版本的重要里程碑。

### Added

#### 核心响应式系统

- **完整的 Vue 3 响应式 API 适配**：基于 Valtio 实现高性能的 Proxy-based 响应式系统
- **响应式钩子集合**：
  - `useReactive` / `useShallowReactive`：深度/浅层响应式对象
  - `useVRef` / `useShallowRefState`：响应式引用
  - `useComputed`：计算属性
  - `useWatch`：响应式监听
  - `useToVRef` / `useToVRefs`：响应式引用转换
  - `useToRaw`：获取响应式对象的原始值
  - `useReadonly` / `useShallowReadonly`：只读响应式对象
- **响应式工具函数**：
  - `wrapRef` / `unwrapRef`：引用包装和解包
  - `collectProxyAccess`：代理访问收集
  - 响应式代理相关的通用工具函数

#### Vue 内置组件适配

- **`<KeepAlive>` 组件**：Vue 风格的组件缓存，支持 `include`、`exclude`、`max` 属性
- **`<Transition>` 组件**：基于 react-transition-group 的过渡动画组件
- **`<Teleport>` 组件**：React Portal 的 Vue 风格封装
- **`<Suspense>` 组件**：异步组件加载支持

#### 模板指令工具集

- **`vCls`**：Vue 风格的 class 绑定工具
- **`vStyle`**：Vue 风格的 style 绑定工具
- **`vOn`**：Vue 风格的事件绑定工具
- **`vKeyless`**：无 key 渲染工具

#### 适配器架构

- **模块化导出结构**：
  - 主包：`@vureact/runtime-core`
  - 适配器组件：`@vureact/runtime-core/adapter-components`
  - 适配器钩子：`@vureact/runtime-core/adapter-hooks`
  - 适配器工具：`@vureact/runtime-core/adapter-utils`
- **完整的 TypeScript 支持**：全量类型定义，兼容 IntelliSense

### Changed

#### 架构优化

- **从 Beta 版本升级**：版本号从 `1.0.0-beta` 升级到 `1.0.0`
- **依赖优化**：
  - 使用 `valtio` 作为响应式引擎，替代原有的 `use-immer`、`immer`、`freeze-mutate`
  - 添加 `freeze-mutate` 和 `klona` 用于不可变数据操作
  - 使用 `react-fast-compare` 进行快速对象比较
  - 使用 `react-transition-group` 支持过渡动画
- **API 命名规范化**：
  - `useRefState` 重命名为 `useVRef`
  - `useToRefState` 重命名为 `useToVRef`
  - `useToRefStates` 重命名为 `useToVRefs`
  - `useCtx` 重命名为 `useInject`
  - `ContextProvider` / `CtxProvider` 重命名为 `Provider`

#### 性能优化

- **响应式系统优化**：基于 Valtio 的高性能响应式实现
- **依赖收集优化**：精确的依赖追踪，避免不必要的重渲染
- **内存使用优化**：改进代理对象的内存管理

#### 开发者体验

- **完整的测试套件**：为所有核心功能提供全面的单元测试
- **示例项目**：提供丰富的使用示例
- **文档完善**：完整的 API 文档和使用指南

### Fixed

#### 响应式系统修复

- **修复浅代理循环引用问题**：修复当访问浅代理的源对象时造成的循环引用
- **修复代理元数据处理**：优化 `createProxy` 增强处理逻辑
- **修复类型定义**：完善所有响应式 API 的类型定义

#### 组件适配修复

- **修复组件生命周期**：确保 Vue 生命周期正确映射到 React 生命周期
- **修复 Props 处理**：优化 Props 检测和类型推导
- **修复事件系统**：确保事件监听器正确工作

#### 工具函数修复

- **移除冗余工具**：清理不再使用的工具函数如 `isProxy`、`isRefState`、`setProxyMeta`
- **优化工具函数导入**：统一工具函数的导入路径

### 🔧 技术栈详情

#### 核心依赖

- **valtio**: React 社区成熟的 Proxy-based 响应式库
- **react-transition-group**: React 过渡动画库
- **react-fast-compare**: 快速对象比较工具
- **freeze-mutate**: 不可变数据操作工具
- **klona**: 深度克隆工具

#### 开发工具

- **TypeScript**: 类型安全的开发体验
- **Rollup**: 模块打包工具，支持 ESM/CJS 双格式
- **Jest**: 测试框架，提供完整的测试覆盖

#### 兼容性

- **React 18+**: 专为现代 React 应用设计
- **TypeScript 4.9+**: 完整的类型支持
- **ESM/CJS 双格式**: 支持现代和传统模块系统

### 📦 包结构

```txt
@vureact/runtime-core/
├── dist/                      # 构建输出
│   ├── cjs/                  # CommonJS 格式
│   ├── esm/                  # ES Module 格式
│   └── types/                # TypeScript 类型定义
├── src/
│   ├── adapter-components/   # 适配器组件
│   │   ├── KeepAlive.tsx
│   │   ├── Transition.tsx
│   │   ├── Teleport.tsx
│   │   └── Suspense.tsx
│   ├── adapter-hooks/        # 适配器钩子
│   │   ├── useReactive.ts
│   │   ├── useVRef.ts
│   │   ├── useComputed.ts
│   │   ├── useWatch.ts
│   │   └── lifecycle.ts
│   ├── adapter-utils/        # 适配器工具
│   │   ├── vCls.ts
│   │   ├── vStyle.ts
│   │   ├── vOn.ts
│   │   └── vKeyless.ts
│   └── shared/               # 共享工具
│       ├── hooks/            # 共享钩子
│       ├── utils/            # 工具函数
│       └── consts/           # 常量定义
├── examples/                 # 示例代码
├── __tests__/               # 测试文件
└── package.json             # 项目配置
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

```
[Unreleased]: https://github.com/vureact-js/core/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/vureact-js/core/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/vureact-js/core/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/vureact-js/core/compare/v1.0.0...HEAD
```
