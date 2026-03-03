# 01-messy-vue-sfc

本示例模拟“目录散乱 + 特性混合”的 Vue3 项目输入，用于发布前完整闭环测试。

## 运行

```bash
npm install

# vue 构建
npm run build

# vureact 构建
npm run vr:build

# vureact 构建
npm run vr:watch
```

## 覆盖能力

- `defineProps/defineEmits` 与默认/作用域插槽
- `provide/inject` 与事件回调链路
- `v-if/v-else`、`v-for`、`v-model`
- `module + scoped + scss` 样式处理
- 资源文件拷贝（`src/assets/demo.svg`）
