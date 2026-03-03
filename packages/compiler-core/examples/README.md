# compiler-core examples

这组示例用于发布前双项目闭环验证（编译 -> 生成 React 工程 -> 安装依赖 -> 构建验证）。

## 项目说明

- `01-messy-vue-sfc`: 散乱目录、多特性混合输入。
- `02-vite-vue3-standard`: 标准 `vue-ts` 工程输入。

## docs 素材映射

- `beginner-template-stable.md` -> `01-messy-vue-sfc/src/labs/TemplateStableDemo.vue`
- `beginner-component-communication.md` -> `01-messy-vue-sfc/src/feature-alpha/UserCard.vue` + `UserPanel.vue`
- `advanced-context-events-slots.md` -> `01-messy-vue-sfc/src/feature-beta/ParentPage.vue` + `ThemeCard.vue`
- `advanced-style-pipeline.md` -> `01-messy-vue-sfc/src/labs/StylePipelineDemo.vue`

说明：示例以 docs 内容为基础，做了工程化拼装以支持完整项目闭环。
