# 贡献指南（CONTRIBUTING.md）✅

感谢你愿意为本仓库贡献！本文件帮助贡献者快速上手、遵循规范并提交高质量 PR。文档贴合该包使用的技术栈：TypeScript、Rollup 打包、Jest 测试、Peer-deps 为 React 18+。

---

## 目录

1. 贡献须知
2. 开发环境与快速上手（完整步骤）
3. 本地开发与调试流程
4. 测试用例与校验规范
5. 代码规范与提交要求
6. 提交 PR 标准流程
7. Bug 报告与问题反馈（Issue）
8. 文档与示例更新规范
9. 其他注意事项

---

## 1) 贡献须知

- `runtime-core` 提供 Vue 风格的 runtime 适配（组件适配、hooks、directive utils），关键关注点：功能正确性、React 兼容性、类型定义完整性与性能成本控制。
- 欢迎贡献类型：功能开发、Bug 修复、类型/文档改进、测试用例补充、兼容性适配（不同 React 版本/环境）。
- 重要变更（设计/兼容性/架构）请在实现前先提交 Issue 与维护者讨论，避免重复实现与设计冲突。

---

## 2) 开发环境与快速上手（完整步骤）

环境要求（建议）：

- Node.js >= 18.2.0
- pnpm >= 8（推荐）
- React >= 18.2.0（peerDependencies）

安装与构建：

```bash
# 克隆仓库并安装依赖（在 repo 根）
git clone https://github.com/vureact-js/core.git
cd core
pnpm install

# 进入 runtime-core 包
cd packages/runtime-core
# 构建 dist
pnpm build
```

常用脚本（在包目录或使用 workspace 过滤器）：

- `pnpm build` — 清理并使用 `rollup` 打包
- `pnpm test` — 运行 jest（建议在修改后执行）
- `pnpm test:watch` — 交互式 watch 模式
- `pnpm test:coverage` — 输出测试覆盖率

若需在本地以全局方式使用 runtime 适配实现（用于手动集成验证）：

```bash
# 在 package 根或仓库根
npm link
# 在待测试的 React 项目中使用
npm link @vureact/runtime-core
```

示例目录与手动验证：

- `packages/runtime-core` 下的示例/测试可以作为验证环境，必要时创建一个最小 demo（React 项目）来集成验证组件/Hook 行为。

---

## 3) 本地开发与调试流程

推荐工作流程：

1. 基于主分支（例如 `master` 或 `dev`）拉取最新代码并创建 feature 分支。
2. 修改代码后运行 `pnpm build`（或 rollup 相关命令）以确保打包无误。
3. 使用 `pnpm test:watch` 或 `jest --watch` 观察测试变化并修复失败用例。
4. 在需要的情况下，使用 `npm link` 将本地包链接到测试项目中进行集成与运行时行为验证。

代码调试小贴士：

- 在需要的地方增加详细日志（注意提交代码前清理）或在 IDE 中打断点调试。
- 对于组件适配，建议编写运行时集成小例子（例如通过 React 测试库 mount 组件并验证行为）。

---

## 4) 测试用例与校验规范

测试范围：

- Hook 行为（`useState$`、`useWatch` 等）
- 组件适配行为（`KeepAlive`、`Transition`、`Teleport` 等）
- Directive utils（`vCls`、`vStyle`、`vOn`）的逻辑正确性
- 与 React 的兼容性（行为在 React 18 下稳定）

测试要求：

- 新增功能 / 修复 Bug 必须添加对应的单元或集成测试。
- 测试应包含：输入、预期行为、断言。对组件行为可使用运行时渲染断言或快照（若合适）。
- 覆盖场景包括正常场景、边界场景以及与 React 严格模式的兼容场景。

运行测试：

```bash
# 在包目录
pnpm test
# watch 模式
pnpm test:watch
```

保持测试绿色是合并前的硬性要求。

---

## 5) 代码规范与提交要求

编码风格：

- 使用 TypeScript，保持类型定义完整并随功能同步更新。
- 使用 Prettier/ESLint（若仓库提供）保持风格一致；若无集中策略，请遵循当前代码风格。

注释与文档：

- 关键逻辑（组件内部状态管理、Hook 边界行为、版本兼容判断）必须添加清晰注释与 TSDoc/JSDoc 标注。

目录与新增模块：

- 新功能请放在现有 `adapter-components/`、`adapter-hooks/` 或 `adapter-utils/` 下，避免随意新增顶级目录。

提交信息与分支：

- 请使用 Conventional Commits（例如：`feat: add useWatchSyncEffect`, `fix: correct Teleport portal target`）。
- 分支命名样例：`feat/<short-desc>`、`fix/<short-desc>`。

提交前检查清单：

- [ ] `pnpm -F @vureact/runtime-core build` 构建通过
- [ ] `pnpm -F @vureact/runtime-core test` 测试通过
- [ ] `npx prettier --check "packages/runtime-core/src/**/*.{ts,tsx,js,jsx,md}"`
- [ ] 更新或添加必要的文档/示例

---

## 6) 提交 PR 标准流程

1. Fork 本仓并从主分支新建功能分支。
2. 在本地完成开发并通过所有本地检查。
3. 推送分支并打开 PR，PR 标题与主要提交前缀一致（feat/fix/docs/chore/test）。
4. 在 PR 描述中包含：
   - 变更类型与目的
   - 验证步骤（单元测试路径、手动验证步骤、demo 链接）
   - 是否为破坏性变更（breaking change）及兼容性说明
   - 关联 Issue（如果适用）
5. 维护者与审阅者可能要求补充测试或文档，请及时响应并更新分支。

PR 描述示例：

```md
### 类型

feat / fix / docs / test

### 描述

简述改动及动机。

### 验证

- Unit tests: packages/runtime-core/**tests**/xxx.test.ts
- Manual: link local package and run example project

### 关联 Issue

Fixes #123 (如适用)

### 破坏性变更

否 / 是（说明）
```

---

## 7) Bug 报告与问题反馈（Issue）

高质量 Issue 应包含：

- 受影响包与版本（例如 `@vureact/runtime-core v1.0.0`）
- 环境（Node、React、OS、包管理器版本）
- 最小复现步骤或最小复现仓库
- 预期结果与实际结果
- 错误堆栈、日志与可能的代码片段

修复流程：在 Issue 中注明复现步骤并在 PR 中引用 Issue，修复后附上自动化测试以防回归。

---

## 8) 文档与示例更新规范

- 涉及公开 API 或用户可见行为的变更必须更新 README、示例与文档（包括 TypeScript 类型提示说明）。
- 文档应包含：功能说明、示例代码（Vue 源与生成 React 代码对比）、注意事项与兼容性信息。
- 文档建议使用 Markdown，示例代码高亮并可复制运行。

---

## 9) 其他注意事项

- 依赖升级需在本地完整跑通构建与测试，并补充兼容性测试。
- 请优先保证功能正确性和兼容性，再进行性能优化；优化后务必确保行为不发生变更。
- 对于涉及多包改动（例如 runtime-core 与 compiler-core 协同升级），请在 PR 中清晰说明改动范围并同时提交相关包的变更或 PR。

---

## 致谢

感谢每位贡献者的付出！
