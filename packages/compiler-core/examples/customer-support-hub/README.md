# Customer Support Hub

`Customer Support Hub` 是一个偏真实业务形态的多渠道客服协同示例，用来压测 VuReact 在复杂后台项目中的混写与转换能力。

简体中文 | [English](./README.en.md)

## 技术栈

- Vue 3
- Vue Router 4
- Ant Design React 6
- Zustand
- Sass
- dayjs
- fuse.js

## 业务范围

当前示例覆盖了一个中小型客服协同平台的主链路：

- 登录与基础后台壳层
- 总览 Dashboard
- 会话中心
- 工单列表
- 工单详情
- 客户管理
- 坐席管理
- 知识库
- SLA 看板
- 设置中心

## 重点能力覆盖

为了尽量挖出编译器边界问题，这个示例刻意把大量高风险语法放进真实页面里：

- 多层条件渲染：`v-if / v-else-if / v-else / v-show`
- 列表与嵌套列表：多层 `v-for`
- 具名插槽与作用域插槽
- 动态组件 `:is`
- `defineProps / defineEmits / defineExpose`
- `provide / inject`
- `watch / watchEffect / computed`
- 多 `v-model` 事件映射
- 模板字面量、对象字面量、数组字面量 props

## 使用本地编译生成 React 产物

如果你正在这个仓库里联调 compiler-core，请优先使用本地 CLI：

```bash
node ..\..\bin\vureact.js build
```

生成目录：

```bash
.vureact/react-app
```

## 运行 React 产物

```bash
cd .vureact/react-app
npm install
npm run dev
```

## 建议验收清单

1. 总览页可看到工单 KPI、渠道分布、待回复会话、热点客户。
2. 会话中心可筛选渠道、切换队列、批量转派、转工单、并单、挂起、保存草稿。
3. 工单详情可看到关联会话、升级记录、内部协同备注和时间轴联动。
4. 客户页、坐席页、SLA 看板首次进入有稳定 mock 数据。

## 相关文件

- [vureact.config.ts](./vureact.config.ts)
