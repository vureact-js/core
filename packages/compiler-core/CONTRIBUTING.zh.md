# 贡献指南（CONTRIBUTING.md） ✅

欢迎为本仓库贡献！本仓库为 monorepo，关注点包括 `core/packages/compiler-core`（Vue -> React 编译器内核）等包。以下贡献指南以 GitHub 开源实践为基准，并结合编译器开发的特殊性（解析 → AST 转换 → 代码生成）给出**可执行的开发/调试/测试/提交流程**。

---

## 目录

1. 贡献须知
2. 开发环境搭建（完整可执行步骤）
3. 本地开发与调试
4. 测试用例规范
5. 代码开发规范
6. 提交 PR 的标准流程
7. Bug 修复与问题反馈
8. 文档贡献规范
9. 其他注意事项

---

## 1) 贡献须知

- 项目核心方向：解析（parse）、AST 转换（transform）、代码生成（codegen）、兼容与适配（Vue3、React 18+）。
- 欢迎贡献：功能开发、Bug 修复、性能优化、测试用例、文档完善、跨版本兼容适配。
- 在开始前：请先搜索 Issues；对于重大功能或架构调整，请先提交 Issue 发起讨论并获得维护者认可。

---

## 2) 开发环境搭建（完整可执行步骤）

环境与工具：

- Node.js >= 14（建议使用 LTS）
- 包管理：pnpm（推荐），也兼容 npm/yarn
- 构建：`tsup`（包内 `build` 脚本使用）
- CLI：`vureact` 二进制位于 `packages/compiler-core/bin` 内

拉取并安装依赖：

```bash
# 克隆仓库并安装（在 repo 根）
git clone https://github.com/vureact-js/core.git
cd core
pnpm install
```

在 `compiler-core` 包的常用命令：

```bash
# 进入包目录
cd packages/compiler-core
# 构建
pnpm build
# 运行编译器 CLI（开发 watch 模式）
npx vureact -w
# 运行包内测试（开发时常用）
pnpm test
```

如果想把 `vureact` 安装为全局命令可用：

```bash
# 在仓库根或包目录运行
npm link
vureact -h
```

示例目录：`packages/compiler-core/example/` 可用于快速手动验证输入到输出的转换结果。

---

## 3) 本地开发与调试

推荐工作流：

1. 基于主分支拉取最新代码并创建分支（参见分支命名规范）。
2. 在 `packages/compiler-core` 运行 `npx vureact -w` 观察增量编译与热更新输出。
3. 修改源代码（`src/parse/`、`src/transform/`、`src/core/codegen/` 等），并在 `example/` 或自动化测试中验证输出。
4. 若需详细日志，临时增加日志点或在 IDE 中断点调试，完成后移除临时修改。

重要目录说明：

- `src/parse/`：SFC 与模板解析
- `src/transform/`：AST 转换、依赖分析与优化
- `src/core/codegen/`：生成 React (JSX/TSX) 的核心逻辑
- `example/`：手动验证工程
- `__tests__/`：基于 `tsx watch` 监听的手动编写测试用例，验证输入输出

---

## 4) 测试用例规范

测试目标：确保 Vue 源输入转换为期望的 React 输出且无回归。

- 新增或修改行为必须添加/更新对应测试用例。
- 测试用例结构建议：
  - Vue 输入（SFC 或片段）
  - 期望 React 输出（或基于 AST / 样例断言）
  - 自动化断言逻辑

覆盖场景：正常场景、边界场景（指令复杂组合、自定义指令）、兼容场景（Vue3 特性）、性能/优化相关场景。

运行测试：

```bash
# 在 package 目录
pnpm test
# 或在根目录使用 workspace 过滤
pnpm -F @vureact/compiler-core test
```

---

## 5) 代码开发规范

编码风格：

- 使用 TypeScript，确保类型完整。
- 使用 Prettier 进行格式化（项目已声明 `prettier` 为 peerDependency）。
- 遵循现有 ESLint / 格式化规则（若仓库未集中配置，请保持现有风格一致）。

命名与注释：

- 文件/函数/类命名应语义化（例如 `parseTemplate`、`transformElement`、`genJSXElement`）。
- 核心转换逻辑必须有说明性注释，公共方法请使用 JSDoc/TSDoc 注释以便生成 API 文档。
- 内部代码注释中英文都可，提供给用户的公共方法必需是英文注释。

目录与新增模块：

- 新增编译规则或适配应放到现有对应子目录，避免随意新增顶级目录。

提交规范（建议使用 Conventional Commits）：

- 示例： `feat: 增加 v-model 支持`、`fix: 修复 v-if 在嵌套场景下的错误`、`re: 重构/修改了 xxxx`

提交前检查清单：

- [ ] `pnpm -F @vureact/compiler-core build` 构建通过
- [ ] `pnpm -F @vureact/compiler-core test` 测试通过
- [ ] `npx prettier --check "src/**/*.{ts,tsx,js,jsx,md}"`
- [ ] 文档/示例同步更新（若需要）

---

## 6) 提交 PR 的标准流程 📤

1. Fork 并基于主分支创建分支（命名示例：`feat/xxx`、`fix/xxx`）。
2. 本地完成变更并确保通过上方检查清单。
3. 推送分支并在主仓发起 PR，PR 标题与提交类型对齐（feat/fix/docs 等）。
4. 在 PR 描述中包含：变更说明、验证步骤、测试覆盖、是否为破坏性变更（breaking change）。
5. 在收到审阅意见后及时修改并保持分支与主分支同步。

PR 示例模板（可贴入 PR 描述）：

```
### 类型
feat / fix / docs / test / chore / re

### 描述
简短描述改动

### 验证
- Unit tests: path/to/test
- Manual: cd packages/compiler-core && npx vureact -w

### 关联 Issue
Fixes #123 (如适用)

### 破坏性变更
否 / 是（说明）
```

---

## 7) Bug 修复与问题反馈（Issue）🐞

高质量 Issue 包含：

- 标题、受影响包与版本（例如 `@vureact/compiler-core v1.0.0`）
- 环境（OS、Node 版本、包管理器版本）
- 最小复现步骤或最小复现仓库
- 预期与实际输出
- 错误堆栈与日志（如有）

Fix 流程：在 Issue 中描述复现并提出修复思路；提交 PR 时在描述中引用该 Issue，并添加相应测试用例。

---

## 8) 文档贡献规范 📝

- 新功能必须补充或更新文档（README、使用示例、迁移说明、API 文档）。
- 文档需包含：功能说明、示例（Vue 源码与生成 React 对比）、注意事项与兼容性限制。
- 使用 Markdown，示例代码块需高亮并能直接复制运行。

---

## 9) 其他注意事项 ⚠️

- 依赖升级：升级重大依赖前请在本地完整运行构建与测试并补充兼容测试用例。
- 兼容性策略：尽量在适配层处理版本差异，保持向下兼容并在 PR 中注明兼容性影响。
- 优先保证转换结果的正确性，再考虑性能优化，优化后需确保结果不变。

---

## 致谢

感谢每位贡献者的时间和付出！
