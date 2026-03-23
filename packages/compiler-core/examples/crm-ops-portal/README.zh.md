# CRM 运营门户管理后台

简体中文 | [English](./README.md)

本示例是标准 `vue-ts` 风格工程，，用于验证常规 Vite + Vue3 + Vue Router 项目的闭环转换。

## 覆盖能力

- Vite + Vue3 + Vue Router 真实项目结构与依赖解析
- SFC（template/script/style）全量转换与样式 scoped 支持
- `defineProps` / `defineEmits` 转换为符合 React 规范的 TSX 组件接口
- `@vureact/runtime-core` 提供对 Vue API 的运行时适配
- `<router-link>` 与 `<router-view>` 组件及路由 API 的完整适配
- `v-model` 语法转换（支持自定义组件及多参数场景）
- 具名插槽、作用域插槽与默认插槽的完整转换
- `provide/inject` 依赖注入机制与运行时 Provider 适配
- 事件处理、指令、条件渲染、列表渲染等模板语法的全面覆盖
- Sass/Less 样式语法转换为 CSS 语法
- `emit('event')` 调用转换为组件 props 方法调用
- 协同中心场景覆盖：通知中心 + 审批中心 + 跨页面业务联动

## 业务闭环亮点

- 高价值线索联动：线索金额达到 100 万及以上时，自动生成审批单。
- 任务阻塞联动：任务进入阻塞态时，自动创建协同通知。
- 仪表盘协同摘要：展示未读通知、待审批、今日处理数。
- 闭环路径：线索/任务动作 -> 通知与审批处理 -> 仪表盘指标同步。

## 开始使用

### Step 1: 运行 VuReact 构建

在 `crm-ops-portal` 根目录下运行命令：

- 安装依赖

注意：若需进行本地测试，可直接执行编译命令，无需安装依赖，但需确保 `core` 项目所有依赖已安装。

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

- 修改路由入口配置（重要）

查看：[route-setup-notes.md](../../templates/route-setup-notes.zh.md)

- 启动 Vite dev 服务，并访问如 <http://localhost:5173>

```bash
npm run dev
```
