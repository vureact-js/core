# Vureact Generated Project

这是一个由 **Vureact Compiler** 自动生成的 React 项目。它已经将原有的 Vue 3 逻辑转换为 React 运行时。

## 🛠 基础技术栈

本生成产物基于以下现代前端技术栈：

- **框架**: React 18+
- **构建工具**: Vite 5
- **语言**: TypeScript
- **运行时胶水**: `@vureact/runtime` (提供相关核心 Vue3 API 到 React 的适配包)

---

## ⚠️ 重要说明 (Important)

**请在开始开发前仔细阅读：**

1. **基础运行保证**：
   本目录包含的文件（`package.json`, `vite.config.ts`, `tsconfig.json` 等）仅能保证一个标准的 React 环境可以正常启动。

2. **外部依赖项手动同步**：
   **非常重要：** Vureact 仅负责代码逻辑的转换。如果你的原 Vue 项目中引用了额外的第三方库（例如：`axios`, `lodash`, `dayjs`, `ant-design`, `echarts` 等），**你需要手动在当前目录下执行 `npm install <package-name>` 来安装这些依赖/对应 React 版的依赖。**

3. **环境配置手动迁移**：
   如果原项目有特殊的环境变量（`.env`）、Vite 插件配置、路径别名（Alias）、Eslint 或 Less 等，请根据需要手动修改本目录下的 `vite.config.ts` 或相关配置文件。

---

## 🚀 快速开始

### 1. 安装依赖

进入本目录并安装基础依赖及你的业务依赖：

```bash
npm install
# 或者使用 pnpm / yarn
# pnpm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 构建产物

```bash
npm run build
```

---

本项目由 Vureact 自动生成。如果你计划重新运行编译器，请不要直接修改 src/ 中的核心逻辑，因为修改内容会被覆盖。
