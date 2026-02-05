# 贡献指南 ✅

感谢你对 `@vureact/compiler-core` 的兴趣与贡献！本项目以 TypeScript 为主、使用 `@vue/compiler-core` 与 `@vue/compiler-sfc` 解析 Vue 3 代码，使用 `@babel` 多个核心模块解析和操作 script 并最终生成 React 代码、使用 `tsup` 构建、提供命令行工具 `vureact`（支持 `-w` 热重载），并在源码中包含许多核心调试（`__tests__` 目录）。本指南说明从环境准备到提 PR 的可落地步骤与规范，便于社区更高效地贡献代码与修复问题。

> 当你阅读完并了解下方所有内容后，如果你想参与贡献，我们允许你在确保 vue -> react 的输入输出结果正确且符合预期的前提下，自由发挥你的创意。

---

## 目录

- 🧰 环境与快速开始
- 🔧 本地开发与调试
- 🧪 测试与示例
- ✨ 代码风格与类型检查
- 🧾 提交规范（Commit）与分支策略
- 📤 提交 PR 的标准与模板
- 🐛 问题报告（Issue）要点
- 🔁 代码审查与合并策略
- 📦 发布与变更日志

---

## 🧰 环境与快速开始

前提：Node.js >= 14。建议使用 `pnpm`（仓库为 monorepo，推荐在仓库根目录统一安装依赖）。

1. 克隆仓库并在仓库根目录安装依赖：

```bash
git clone https://github.com/vureact-js/core.git
cd core
pnpm install
```

2. 进入本包（可在包目录操作或使用 pnpm workspace 过滤器）：

```bash
# 在包目录运行脚本
cd packages/compiler-core
pnpm build

# 或在仓库根目录使用 workspace 过滤器
pnpm -F @vureact/compiler-core build
```

常用命令（在包目录下可直接运行）：

- 构建： `pnpm build` 或 `npm run build`（等同执行 `tsup`）
- 运行开发监视： `npx vureact -w`（或 `node ./bin/vureact.js -w`）
- 运行测试（见测试章节）: `pnpm test`（包内脚本）

---

## 🔧 本地开发与调试

- 推荐工作流程：
  1. 新建分支（见分支策略）
  2. 本地运行 `npx vureact -w` 在示例/目标工程中即时观察编译结果
  3. 变更源码后保持 watch 模式以便快速测试热更新与输出

- 示例：仓内 `example/` 目录可用于快速验证编译器的输出。可在示例目录执行：

```bash
# 在 example 根目录
npx vureact
# 或带 watch
npx vureact -w
```

- 日志与调试：项目使用 `kleur`/`ora` 等工具输出日志，必要时可在 `src/logger.ts` 或相应模块中增加更详细的日志以协助定位问题。

---

## 🧪 测试与示例

- 测试文件通常放置在 `__tests__` 目录或相邻 `.test.ts` 文件中，覆盖 parse、transform、codegen 等关键子系统。

- 未使用 Jest 或其他框架进行测试，通常使用 `tsx` 监听测试入口文件，用于开发者验证输入输出是否符合预期。

- 运行测试：

```bash
# 在包目录
pnpm test

# 或在仓库根目录运行过滤包
pnpm -F @vureact/compiler-core test

# 或在仓库根目录直接运行编写好的脚本，如：
npm run dev:parse
```

- 添加测试时：
  - 新增用例应放在靠近被测模块的 `__tests__` 目录下；
  - 每个测试应包含最小可复现的输入（例如一个小 SFC 文件或字符串片段）和明确的断言；
  - 优先覆盖边界场景（解析失败、特殊语法、scope 样式、插槽/指令转换等）。

---

## ✨ 代码风格与类型检查

- 使用 TypeScript，保持类型声明完整，注意导出的类型定义（`types` 字段在 package.json）。
- 使用 Prettier 保持代码格式统一：

```bash
# 检查格式
npx prettier --check "src/**/*.{ts,tsx,js,jsx,md}"
# 格式化
npx prettier --write "src/**/*.{ts,tsx,js,jsx,md}"
```

- 在提交前：
  - 运行 `pnpm build` 验证构建通过（`tsup` 会捕获编译或打包错误）
  - 运行测试并确保新增/变更的测试通过

---

## 🧾 提交规范（Commit）与分支策略

为便于变更追踪与自动化发布，请使用 **Conventional Commits** 格式：

- 示例：
  - feat: 支持 \<feature> 的新功能
  - fix: 修复 \<bug 描述>
  - re: 任何重构或修改
  - docs: 更新 README/文档
  - chore: 构建或依赖调整
  - test: 新增或修改测试

分支命名建议：

- feat/<短描述>
- fix/<短描述>
- re/<短描述>
- docs/<短描述>
- chore/<短描述>

在提交消息中尽量包含简短的描述与关联 issue 编号（如有）

---

## 📤 提交 PR 的标准与模板

在提交 PR 前确保完成以下检查：

- [ ] Fork/Branch 基于最新主分支 rebase
- [ ] 对应的单元测试已新增或更新
- [ ] 本地构建（`pnpm build`）无报错
- [ ] 代码格式化且类型检查通过
- [ ] 修改点已更新文档（必要时）
- [ ] PR 描述清晰，包含复现步骤与变更影响说明

建议的 PR 描述模板：

```
简短标题（前缀 feat/fix/…）

详述变更做了什么，以及为什么要做这次变更。

相关 issue: #123（如有）

测试计划:
- 已新增/更新的测试文件
- 手动验证步骤（例如在 example/ 中执行 `npx vureact -w`）

是否存在破坏性变更（breaking change）: 否/是（说明）
```

合并策略：通常会由维护者在 CI 通过且经过至少一位审阅者批准后合并。

---

## 🐛 问题报告（Issue）要点

如果发现 bug 或想提 feature，请先在 Issues 中搜索是否已有相同问题。

优质 issue 模板建议包含：

- 标题（简洁）
- 版本信息（例如 `@vureact/compiler-core` 版本、Node 版本）
- 操作系统与环境（Windows/macOS/Linux）
- 重现步骤（最小复现仓库或代码片段）
- 期望结果与实际结果
- 相关日志和错误堆栈

示例：

```
标题: 模板中的 v-if 在转换为 JSX 后丢失

版本: @vureact/compiler-core v1.0.0, node v16
系统: Windows 10

重现步骤:
1. 创建含有 v-if 的 SFC
2. 运行 npx vureact

期望: 转换生成等价的条件渲染 JSX
实际: JSX 中缺少条件判断，渲染出现错误

日志: <错误堆栈>
```

---

## 🔁 代码审查与合并策略

- PR 至少需要一名审阅者批准；核心团队成员或维护者会进行最终合并。
- 若改动包含 API 变化或破坏性变更，请在 PR 中明确标注并等待更严格的审阅流程。
- CI（测试、构建）必须通过，才会被允许合并。

---

## 📦 发布与变更日志

- 变更应遵循语义化（feat/fix）以便自动化生成变更日志（如仓库使用自动化工具）。
- 若仓库使用 `CHANGELOG.md` 或 release notes，请在 PR/合并时补充简短说明。

---

---

## 致谢

欢迎你的每一次提交与建议！如需更多协助，请在 Issue 中留言或直接 @ 核心维护者。

---
