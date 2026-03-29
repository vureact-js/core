# CRM 后台迁移实战

CRM 客户与销售运营台 Vue 3 项目迁移实战。

本示例是标准 `vue-ts` 风格工程，，用于验证常规 Vite + Vue3 + Vue Router 项目的闭环转换。

简体中文 | [English](./README.en.md)

## 开始使用

### Step 1: 运行 VuReact 构建

- 安装依赖

```bash
npm install
```

- 执行编译

```bash
# 方式一：vureact 全量编译
npm run vr:build

# 方式二：vureact 增量编译（监听模式）
npm run vr:watch
```

### Step 2: 运行 React App

- 进入工作区构建产物目录

```bash
cd .vureact/react-app/
```

- 安装依赖

```bash
npm install
```

- 启动 Vite dev 服务，并访问如 <http://localhost:5173>

```bash
npm run dev
```

## 官方教程

<https://www.vureact.top/guide/crm-admin-backend/>
