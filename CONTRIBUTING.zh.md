# 贡献指南

感谢你为 VuReact Core 做出贡献。本文档聚焦这个仓库里实际采用的贡献流程，而不是通用的开源模板说明。

## 开始之前

请先确认本地环境符合当前工作区要求：

- Node.js `>= 19.0.0`
- 推荐使用 pnpm `10+`
- Git

本仓库是一个 pnpm workspace，主要包含两个包：

- `@vureact/compiler-core`
- `@vureact/runtime-core`

提交代码前，也请阅读[行为准则](./CODE_OF_CONDUCT.zh.md)，并了解所有贡献均按 [MIT License](./LICENSE) 发布。

## 先选择合适的协作入口

如果变更影响较大，请先讨论，再开始实现。

以下类型的改动，必须先创建或参与 Issue / Discussion 再动手写代码：

- 新功能
- 破坏性变更
- 架构调整
- 大型重构

请优先使用仓库现有的 GitHub 模板和渠道：

- Bug 反馈： [`.github/ISSUE_TEMPLATE/bug_report.zh-CN.md`](./.github/ISSUE_TEMPLATE/bug_report.zh-CN.md)
- 功能请求： [`.github/ISSUE_TEMPLATE/feature_request.zh-CN.md`](./.github/ISSUE_TEMPLATE/feature_request.zh-CN.md)
- 使用案例分享： [`.github/ISSUE_TEMPLATE/showcase.zh-CN.md`](./.github/ISSUE_TEMPLATE/showcase.zh-CN.md)
- 使用问题与求助： GitHub Discussions 或项目文档

如果只是简单的错别字修复或直接明了的文档改进，可以直接提交 Pull Request。

## 本地准备

1. 先在 GitHub 上 Fork 仓库。
2. 克隆你的 Fork 并进入工作区：

   ```bash
   git clone https://github.com/YOUR_USERNAME/core.git
   cd core
   ```

3. 安装依赖：

   ```bash
   pnpm install
   ```

4. 构建你将要修改的包：

   ```bash
   pnpm build:compiler-core
   pnpm build:runtime-core
   ```

5. 基于上游最新默认分支创建你的工作分支。

## 开始修改

请尽量让每次改动保持聚焦，方便审查和回归验证。

- 遵循现有代码风格和目录结构。
- 如果行为发生变化，请同步更新文档。
- 如果改动影响行为，请补充或更新测试。
- 不要把无关重构混进同一个 Pull Request。

如果你的改动同时影响两个包，请在 PR 描述里明确说明它们之间的关系，方便评审确认联动影响。

## 验证改动

请运行与你修改范围相匹配的检查。相比笼统地写“全部测试通过”，我们更鼓励你提供范围明确的定向验证结果。

### 格式检查

在工作区根目录运行 Prettier 检查：

```bash
pnpm format:check
```

### `runtime-core`

根据你修改的区域，运行对应的根脚本：

```bash
pnpm test:adapter-hooks
pnpm test:adapter-utils
pnpm test:adapter-components
```

同时建议运行相关构建：

```bash
pnpm build:runtime-core
```

### `compiler-core`

至少运行包构建：

```bash
pnpm build:compiler-core
```

如果改动涉及解析、转换、代码生成，或 watch/build 行为，请额外运行该区域最相关的定向验证。当前仓库还没有为 `compiler-core` 提供一个统一覆盖所有场景的顶层自动化测试命令，因此请在 PR 中明确写出你实际执行了哪些验证。

## 提交 Commit 并创建 PR

建议使用清晰的提交信息，并遵循 Conventional Commits：

```text
<type>[optional scope]: <description>
```

本仓库最常用的类型包括：

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `build`
- `ci`
- `chore`

示例：

```text
feat(compiler-core): improve scoped style transform output
fix(runtime-core): correct adapter hook update timing
docs: rewrite contribution guide
```

提交 Pull Request 之前，请确认：

- 已按需要 rebase 或合并上游最新默认分支
- 本次改动相关的构建与验证已在本地通过
- 如果有用户可见行为变化，相关文档已同步更新

创建 PR 时，请遵循现有模板：

- PR 模板： [`.github/PULL_REQUEST_TEMPLATE/pull_request_template.zh-CN.md`](./.github/PULL_REQUEST_TEMPLATE/pull_request_template.zh-CN.md)

PR 描述中应至少包含：

- 关联的 Issue
- 受影响的包
- 你实际运行过的验证步骤
- 仅在确有帮助时附上截图

## 评审预期

评审者可能会要求你补充背景、缩小改动范围，或增加验证说明。这些要求的目标是保持项目长期可维护。

为了让评审更顺畅：

- 保持 PR 聚焦
- 对反馈给出明确更新
- 主动说明取舍和已知后续工作
- 除非确有必要，不要用 force-push 抹掉讨论上下文

如果你不确定应该由谁评审，可以参考仓库中的 [CODEOWNERS](./.github/CODEOWNERS)。
