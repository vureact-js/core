# 贡献指南

感谢您有兴趣为 Vureact Core 做出贡献！本文档提供了贡献项目的指南和说明。

## 🎯 项目概述

Vureact Core 是一个将 Vue 3 语法编译为可运行的 React 18+ 代码的下一代编译器框架。项目包含两个主要包：

### @vureact/compiler-core

一个 Vue 3 到 React 的编译器，将 Vue 单文件组件（SFCs）转换为带有 JSX/TSX 的 React 组件。

### @vureact/runtime-core

Vue 3 内置组件、响应式 API 和模板指令工具的 React 适配器。

## 🚀 快速开始

### 先决条件

- Node.js >= 14.0.0
- pnpm >= 8.0.0（推荐）
- Git

### 开发环境设置

1. **在 GitHub 上 Fork 仓库**
2. **本地克隆你的 Fork**：

   ```bash
   git clone https://github.com/你的用户名/core.git
   cd core
   ```

3. **安装依赖**：

   ```bash
   pnpm install
   ```

4. **构建包**：

   ```bash
   pnpm build:compiler-core
   pnpm build:runtime-core
   ```

5. **运行测试**以确保一切正常：

   ```bash
   # 运行 runtime-core 测试
   pnpm test:adapter-hooks
   pnpm test:adapter-utils
   pnpm test:adapter-components
   ```

## 📝 开发流程

### 分支策略

- `master`: 稳定的生产分支
- `develop`: 开发分支（如果存在）
- 功能分支：`feature/描述`
- 修复分支：`fix/issue编号-描述`
- 文档分支：`docs/主题`

### 创建功能分支

```bash
git checkout -b feature/你的功能名称
```

### 进行更改

1. **编写代码**，遵循我们的编码标准
2. **为新功能添加测试**
3. **如果需要，更新文档**
4. **本地运行测试**
5. **检查代码风格**：

   ```bash
   pnpm format:check
   ```

### 提交指南

我们遵循[约定式提交](https://www.conventionalcommits.org/zh-hans/)规范：

```
<类型>[可选 范围]: <描述>

[可选 正文]

[可选 脚注]
```

**类型：**

- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更改
- `style`: 代码风格更改（格式化等）
- `refactor`: 代码重构
- `test`: 添加或更新测试
- `chore`: 维护任务
- `build`: 构建系统更改
- `ci`: CI 配置更改

**范围（示例）：**

- `compiler-core`: 编译器包的更改
- `runtime-core`: 运行时包的更改
- `adapter-hooks`: 适配器钩子的更改
- `adapter-utils`: 适配器工具的更改
- `adapter-components`: 适配器组件的更改
- `cli`: CLI 工具的更改

**示例：**

```
feat(compiler-core): 添加 SFC 模板编译
fix(runtime-core): 修正 KeepAlive 组件行为
docs: 更新 API 文档
```

## 🔧 项目结构

```
core/
├── packages/
│   ├── compiler-core/          # Vue 到 React 编译器
│   │   ├── src/               # 源代码
│   │   │   ├── compiler/      # 编译器实现
│   │   │   ├── parser/        # Vue SFC 解析器
│   │   │   ├── transform/     # AST 转换
│   │   │   ├── codegen/       # 代码生成
│   │   │   ├── utils/         # 工具函数
│   │   │   └── cli/           # 命令行界面
│   │   ├── __tests__/         # 测试文件
│   │   └── package.json       # 包配置
│   └── runtime-core/          # 运行时适配器
│       ├── src/               # 源代码
│       │   ├── adapter-components/  # Vue 内置组件
│       │   ├── adapter-hooks/       # Vue 风格钩子
│       │   ├── adapter-utils/       # 指令工具
│       │   └── shared/              # 共享工具
│       ├── __tests__/         # 测试文件
│       └── package.json       # 包配置
├── package.json              # 根包配置
└── pnpm-workspace.yaml      # 工作区配置
```

## 📖 编码标准

### TypeScript

- 使用严格的 TypeScript 配置
- 提供适当的类型定义
- 尽可能避免使用 `any` 类型
- 使用接口定义对象形状

### 代码风格

- 使用 2 空格缩进
- 使用分号
- 字符串使用单引号
- 遵循 Prettier 配置

### 文档

- 使用 JSDoc 注释记录公共 API
- 添加功能时更新 README 文件
- 为复杂功能添加示例

## 🧪 测试

### 编写测试

- 彻底测试公共 API
- 测试边界情况和错误条件
- 模拟外部依赖
- 使用描述性的测试名称

### 测试结构

```typescript
describe('组件名称', () => {
  it('应该做某事', () => {
    // 准备
    // 执行
    // 断言
  });
});
```

### 运行测试

```bash
# 运行 compiler-core 测试
cd packages/compiler-core
pnpm test

# 运行 runtime-core 测试
cd packages/runtime-core
pnpm test

# 运行特定测试套件
pnpm test:adapter-hooks
pnpm test:adapter-utils
pnpm test:adapter-components
```

## 🔄 拉取请求流程

1. **确保你的分支是最新的**：

   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **运行所有检查**：

   ```bash
   pnpm build:compiler-core
   pnpm build:runtime-core
   pnpm format:check
   # 运行相关测试
   ```

3. **在 GitHub 上创建拉取请求**：
   - 使用清晰、描述性的标题
   - 引用相关的问题
   - 提供详细的描述
   - UI 更改请包含截图

4. **PR 审查流程**：
   - 及时处理审查意见
   - 保持提交内容专注且逻辑清晰
   - 如果需要，压缩提交
   - 确保 CI 通过

5. **批准后**：
   - 维护者将合并你的 PR
   - 你的更改将包含在下一个版本中

## 🐛 报告问题

### 错误报告

报告错误时，请包括：

1. **描述**：问题的清晰描述
2. **重现步骤**：逐步说明
3. **预期行为**：你期望发生的事情
4. **实际行为**：实际发生的事情
5. **环境**：Node.js 版本、操作系统等
6. **代码示例**：最小可重现代码

### 功能请求

对于功能请求，请：

1. **描述**你试图解决的问题
2. **解释为什么**需要这个功能
3. **提供示例**说明如何使用
4. **考虑**你尝试过的替代方案

## 🏗️ 构建和打包

### 开发构建

```bash
# 构建 compiler-core
pnpm build:compiler-core

# 构建 runtime-core
pnpm build:runtime-core
```

### 生产构建

- Compiler-core 使用 `tsup` 进行构建
- Runtime-core 使用 `rollup` 进行构建

### 版本控制

我们遵循[语义化版本控制](https://semver.org/lang/zh-CN/)：

- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

## 🤝 社区

### 获取帮助

- [GitHub Issues](https://github.com/vureact-js/core/issues) 用于错误报告
- 首先查看现有文档

### 认可

所有贡献者将在以下方面得到认可：

- 发布说明
- 贡献者列表
- 项目文档

## 📄 许可证

通过为 Vureact Core 做出贡献，你同意你的贡献将根据项目的[MIT 许可证](LICENSE)进行许可。

## 🙏 感谢

感谢你考虑为 Vureact Core 做出贡献。你的努力有助于让这个项目对 Vue 和 React 社区的每个人都变得更好！

---

_需要帮助？在 GitHub 上提出问题！_
