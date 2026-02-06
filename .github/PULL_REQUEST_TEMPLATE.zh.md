## 类型

请选择：

- [ ] feat: 新功能
- [ ] fix: Bug 修复
- [ ] docs: 文档更新
- [ ] test: 测试相关
- [ ] chore: 构建/工具/依赖变更

---

## 简要说明 / Summary

请概述本次变更做了什么以及为什么要做（1-3 行）：

---

## 关联 Issue / Related issue

关联 Issue 编号（如有）： #

---

## 影响范围 / Packages affected

请勾选受影响的包：

- [ ] @vureact/compiler-core
- [ ] @vureact/runtime-core
- [ ] 其他（请说明）:

---

## 变更详情 / Details

请说明主要改动点、实现思路与必要的设计说明（若有设计文档，可附上链接）：

---

## 验证 & 测试 / How to verify

请列出复现与验证步骤（包含本地命令示例），并说明新增/更新的测试文件路径：

示例命令：

```bash
# 构建受影响包
pnpm -F @vureact/compiler-core build
pnpm -F @vureact/runtime-core build

# 运行包内测试（替换为实际包名）
pnpm -F @vureact/compiler-core test
pnpm -F @vureact/runtime-core test
```

已添加 / 更新的测试：

-

手动验证（如适用）：

1.
2.

---

## 文档更新 / Docs

- [ ] 已更新相关 README / 使用文档 / 示例
- 文档文件：

---

## 破坏性变更 / Breaking change

- [ ] 否
- [ ] 是（请说明影响范围与迁移方案）

---

## 检查清单 / Checklist

- [ ] 本地构建通过
- [ ] 本地测试通过（含新增测试）
- [ ] 代码风格/格式化（Prettier/ESLint）已处理
- [ ] 类型检查通过（TypeScript）
- [ ] 文档已更新（若需要）

---

## 备注 / Notes

可填写额外说明，如需要指定审阅者或关注点：

---

> 提交 PR 后请保持分支与主分支同步并及时响应审阅意见。合并通常需要 CI 通过与至少一位维护者/审阅者批准。谢谢你的贡献！ 🙏
