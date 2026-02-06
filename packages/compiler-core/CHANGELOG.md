# Changelog

All notable changes to this VuReact project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- 新增Vue3 `<script setup>` 语法的完整转换支持，包含ref/reactive等响应式API映射
- 新增配置项 `enableReactHooks`，支持手动开关Vue响应式转React Hooks的逻辑（#Unreleased）
- 新增CLI模块，支持命令行编译与监听模式（#2cbeef8, @smirk9581）
- 新增编译选项 `watch`、`onSuccess`、`onChange`，支持编译后回调（#3868470, #fb38255, @smirk9581）
- 新增缓存机制，支持 `saveCache`、`loadCache`、`updateCache` 等方法（#5b6b5a7, #294444d, #ba5e9b12, @smirk9581）
- 新增 `CompilerOptions.output.workspace` 配置项，支持多工作区编译（#68ef783, @smirk9581）
- 新增 `fileId` 与 `relativePath` 工具，提升文件标识唯一性（#ac846c5, #d1d4393, @smirk9581）
- 新增样式块解析与PostCSS插件，支持CSS作用域处理（#f813784, #4009365, @smirk9581）
- 新增 `prettier` 插件，支持生成代码格式化（#608e981, @smirk9581）
- 新增 `styleModule` 属性替换 `$style`，统一样式模块命名（#d7d110d, @smirk9581）
- 新增 `defineAsyncComponent`、`provide`、`inject` 等Vue API转换支持（#46d57ba, #b9af973, @smirk9581）
- 新增 `v-slot` 与作用域插槽转换支持（#76fdb4d, #34c4539, @smirk9581）
- 新增 `v-model` 事件处理器生成逻辑（#41a52d7, @smirk9581）
- 新增 `CtxProvider` 组件构造器，支持上下文注入（#90a3260, @smirk9581）
- 新增时间格式化工具（#eb78619, @smirk9581）
- 新增 `replaceVueSuffix` 工具，支持.vue文件名后缀替换（#621acef, @smirk9581）
- 新增 `normalizePropName` 与 `normalizePropValue` 工具（#5ae8fcc, #cdad1fc, @smirk9581）

### Changed

- 优化AST节点转换逻辑，减少生成的React代码冗余，提升代码可读性（#Unreleased）
- 调整项目构建输出目录，从`dist/`改为`lib/`，保持与前端工具库通用规范一致（#Unreleased）
- 重构缓存处理逻辑，统一 `CacheKey` 与 `CompiledResult` 接口命名（#5cc154b, #27c9c9a, @smirk9581）
- 重构日志输出格式，支持操作耗时计算与颜色优化（#cf6ba0e, #ed1549d, #db37aea, @smirk9581）
- 重构编译上下文结构，增加 `CompilationContext` 类型接口（#45f328b, @smirk9581）
- 重构 `templateVars` 为 `templateRefs`，提升模板变量管理（#a66ab54, @smirk9581）
- 优化 `defineProps` 与 `defineSlots` 字段结构，提升类型推导（#3a5b793, #012e6e5, @smirk9581）
- 重构 `processVueSyntax` 为 `processVueScript`，语义更清晰（#797f13a, @smirk9581）
- 优化编译产物结构，支持按需编译与原子化处理（#1fd48ef, @smirk9581）
- 优化 `splitMainBody` 为 `extractLocalStatements`（#45f3e9d, @smirk9581）
- 优化 `moduleScope` 与 `componentScope` 为 `global` 与 `local`（#1b88d1c, @smirk9581）
- 优化 `React_Hooks` 更名为 `ReactApis`（#11278c6, @smirk9581）

### Fixed

- 修复Vue `v-for` 循环带key时，生成React代码报key重复的Bug（#45）
- 修复Vue自定义组件属性透传时，丢失非props属性的问题（#52）
- 修复日志打印后未清空历史消息的问题（#274e579, @smirk9581）
- 修复 `workspace` 命令简写执行错误（#811837d, @smirk9581）
- 修复Vue源文件删除后对应CSS产物未被清理的问题（#fe8f8f7, @smirk9581）
- 修复 `style` 块中CSS import路径指向错误（#81bb12f, @smirk9581）
- 修复组件名缺失时警告信息未显示临时名称的问题（#a1fee11, @smirk9581）
- 修复 `@vureact/runtime` 包名引用错误（#e21ea1f, @smirk9581）
- 修复动态组件不注入 `data-css-hash` 属性的问题（#f12a3be, @smirk9581）
- 修复 `defineProps` 泛型生成逻辑与类型重复声明问题（#bb55e1e, @smirk9581）
- 修复 `v-for` 对象迭代中 `Object.entries` 使用错误（#fce28ec, @smirk9581）
- 修复 `inject` 节点未标记为响应式的问题（#15b6cde, @smirk9581）
- 修复无 `style` 文件时不添加 import 语句（#f40cc96, @smirk9581）
- 修复事件名应用错误（#24cceb3, @smirk9581）
- 修复 `setter` 函数参数未使用根标识符（#769d760, @smirk9581）

### Removed

- 移除 `adapter-utils` 中的 `v-` 工具字段，统一使用 `dir` 字段（#33e05e8, @smirk9581）
- 移除 `react-hook-builder.ts` 等冗余文件（#cda11d0, @smirk9581）
- 移除 `defineSlots` 字段（#4146560, @smirk9581）
- 移除 `parseTemplateExp` 工具（#fa7db84, @smirk9581）
- 移除开发测试命令（#b3cae6b, @smirk9581）

---

> 本版本基于 **2025-12-29 至 2026-02-06** 期间的提交记录整理，所有功能与修复均为未发布状态。  
> 主要贡献者：**smirk9581 (Owen Dells)**
