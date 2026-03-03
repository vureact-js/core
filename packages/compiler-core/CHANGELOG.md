# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-03-03

### 🚩 里程碑版本：VuReact 1.0.0 —— “心灵控制”

这是 VuReact 的第一个先行版本，代号"心灵控制"。此版本标志着 Vue 到 React 编译从概念验证走向工程实践的重要里程碑。

### Added

- **完整的编译流水线**：实现解析 → 转换 → 生成的完整编译架构
- **Vue SFC 支持**：完整支持 `<template>`、`<script setup>`、`<style>` 三部分编译
- **TypeScript 无缝迁移**：完整保留类型定义，自动生成 React 组件类型
- **零运行时样式**：编译时处理 scoped/module 样式，生成静态 CSS
- **响应式系统适配**：`ref`、`computed`、`watch` 等 API 的 React 适配
- **CLI 工具链**：提供 `build` 和 `watch` 双模式编译
- **增量编译**：基于文件哈希的智能缓存机制
- **Vite 集成**：自动初始化标准 React 项目结构
- **混合开发支持**：支持 Vue 和 React 组件在同一项目中并存

### Changed

- **架构重构**：从概念验证升级为生产就绪的工程化工具
- **编译约定标准化**：明确定义了编译约定和边界条件
- **错误处理改进**：提供更清晰的编译错误和警告信息
- **性能优化**：优化编译速度和内存使用

### Fixed

- **模板转换稳定性**：修复复杂嵌套模板的转换问题
- **类型系统处理**：改进 TypeScript 类型推导和生成
- **样式处理边界情况**：修复 scoped CSS 选择器生成问题
- **依赖分析**：改进 import 路径分析和依赖注入

### Security

- **依赖更新**：所有依赖包更新到最新安全版本
- **代码审计**：完成初步安全审计和代码审查

---

## How to Update This Changelog

### For Contributors

When making changes, please add entries to the appropriate section under [Unreleased].

### For Maintainers

When releasing a new version:

1. Update the version number in `packages/compiler-core/package.json` or `packages/runtime-core/package.json`
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

[Unreleased]: https://github.com/vureact-js/vureact-router/compare/v1.0.0...HEAD
