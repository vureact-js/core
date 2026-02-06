# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- 新增 `Adapter` 基类，为运行时适配提供统一接口 (#9f6f785, #fe480ee, @smirk9581)
- 新增 `vOn` 函数，支持Vue风格事件绑定到React的转换 (#fe480ee, @smirk9581)
- 新增 `vCls` 函数（原 `vBindCls`），支持 Vue `v-bind:class` 指令在 React JSX 中的使用 (#25a2a88, #464763a1, @smirk9581)
- 新增 `vStyle` 函数（原 `vBindStyle`），支持 Vue `v-bind:style` 指令在 React JSX 中的使用 (#43868347, #3a6f3bbe, @smirk9581)
- 新增 `vKeyless` 函数（原 `vBind`），用于通用属性绑定 (#27b64fa, #c8c1c649, @smirk9581)
- 新增小驼峰命名转换工具，用于转换Vue属性名为React风格 (#060f9d2d, #d0a554da, @smirk9581)
- 新增 `adapter-utils` 模块，包含属性名转换等共享工具函数 (#3e7f5af, #f78cfbda, @smirk9581)
- 新增 `adapter-hooks` 模块，提供 `useCtx`、`useCxtValue` 等React Hooks (#790ddd7, #ec296f47, @smirk9581)
- 新增 `adapter-components` 模块，导出 `CtxProvider`、`ContextProvider`、`KeepAlive` (`Alive`) 等关键组件 (#1f9d0086, #9dbe706c, #24f5dd44, @smirk9581)
- 新增 `adapter-router` 模块，将路由相关组件独立管理 (#5287888a, @smirk9581)
- 新增全局上下文注册器组件 (#19704709, @smirk9581)
- 新增Jest单元测试配置及 `jest.setup.cjs` (#46f3ceec, #6bc52c73, @smirk9581)
- 新增 `ContextProvider`、`adapter-hooks`、`adapter-utils`、`adapter-router` 等模块的单元测试 (#457600c6, #02f4f8a9, #e60c5da3, #0f63248b, @smirk9581)
- 新增Rollup构建配置，支持分包构建及路径别名 (#7aef6df8, #7c9e6200, @smirk9581)
- 新增Rollup专用的TypeScript配置文件 (#565c6577, @smirk9581)

### Changed

- 重构项目打包输出路径，由 `lib` 改为 `dist` (#b76f37bf, @smirk9581)
- 将 `adapter-hooks/hooks` 和 `adapter-components/components` 目录迁移至模块根目录 (#023d634b, #998e1cb3, @smirk9581)
- 变更主要组件的导出方式为按需导出，移除 `KeepAlive/index.tsx`，主文件更名为 `Alive.tsx` (#aa9b9cef, #69b0a157, #c73c1479, @smirk9581)
- 优化Rollup构建配置，将公共代码提取到 `chunks` 目录 (#525685ec, #bcc7d7c7, @smirk9581)
- 优化项目构建配置，调整构建输出目录与排除项 (#5d21e6a5, #dbedabac, @smirk9581)

- `vBindCls` 重命名为 `vCls` (#464763a1, @smirk9581)
- `vBindStyle` 重命名为 `vStyle` (#3a6f3bbe, @smirk9581)
- `vBind` 重命名为 `vKeyless` (#c8c1c649, @smirk9581)
- `useCxtValue` 文件路径变更为 `useCtx`，并优化其内部实现 (#746c2709, #ca4b6e6c, @smirk9581)
- 优化事件处理逻辑，`handler` 调用均包裹一层函数，并允许 `handler` 为非函数类型 (#25642e4a, @smirk9581)

- 更新项目 `package.json` 中的 `homepage` 字段 (#b6f54321, #109c0374, @smirk9581)
- 移除 `react-router-dom` 依赖，由独立的 `adapter-router` 模块处理路由 (#7e72c012, @smirk9581)
- 移除 `jest.setup.cjs` 安装文件，调整相关配置 (#5c40d0b9, @smirk9581)
- 优化 `repository.directory` 配置 (#8daa4337, @smirk9581)

### Fixed

- 修复 `lifecycle` 模块未全部导出的问题 (#6d8daf28, @smirk9581)
- 修复 `GuardManagerImpl` 模块导入路径错误的问题 (#76cf7be8, @smirk9581)
- 修复事件名转换逻辑，确保只有非 `on` 开头的事件名才进行转换 (#0c1d7eb8, @smirk9581)

- 修复 `@vureact/runtime` 包名引用错误 (#e21ea1f, @smirk9581)
- 修复 `adapter-hooks` 与 `adapter-components` 模块的导入逻辑 (#797a3171, #4c762719, @smirk9581)

### Removed

- 移除 `runtime-core/adapter-router` 模块 (#4d8b98ba, @smirk9581)
- 移除 `vModel`、`vShow`、`ifGroup`、`Once`、`Memo` 等组件及工具函数 (#28b7ef37, #75bbcd2c, #7e97b9ff, #b7b5539a, #259132b1, @smirk9581)
- 移除旧的 `vBind` 工具函数及相关测试 (#5ea32313, #5acbc87b, @smirk9581)
- 移除 `shared.ts`、`components` 模块等无用文件 (#402b5ebd, #ec15929f, #1e36e1a5, @smirk9581)
- 移除 `useCxtValue` 钩子（已被 `useCtx` 替代）(#cd0b9d4a, @smirk9581)

### Documentation

- 新增 `README` 与 `Contribution Guidelines` 文档 (#7eb49f93, #60416ad5, @smirk9581)
- 更新文档注释中的在线文档链接、URL地址及作者信息 (#f40a813d, #940e2d00, #ac06b1e1, #e7e86d7f, @smirk9581)
- 完善 `CtxProvider` 组件等模块的文档注释 (#2a3077db, #e455c6b4, @smirk9581)
- 修改文档注释中的URL链接格式 (#2c9f6843, @smirk9581)

---

> 本版本基于 **2025-11-30 至 2026-02-06** 期间的提交记录整理，所有功能与修复均为未发布状态。  
> 主要贡献者：**smirk9581 (Owen Dells)**
