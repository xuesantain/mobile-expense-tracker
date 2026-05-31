# AGENTS.md

本文件为在此仓库中工作的编码代理提供项目约定和操作指南。请优先遵循本文件，其次参考 `README.md` 和现有代码风格。

## 项目概览

- 项目名称：`mobile-expense-tracker`
- 技术栈：Expo + React Native + TypeScript + SQLite
- 入口文件：`App.tsx`
- 业务目标：本地优先的手机记账 App，支持手动记账、预算、统计、CSV 导出，以及票据 OCR 文本解析确认流。

## 目录结构

- `App.tsx`：当前主要 UI 与业务编排入口。
- `src/types.ts`：领域类型定义，修改数据模型时先更新这里。
- `src/data/defaults.ts`：默认分类、账户等种子数据。
- `src/data/database.ts`：SQLite 初始化、迁移和数据访问逻辑。
- `src/utils/`：纯工具函数，包括金额、日期、预算、统计、OCR 解析。
- `__tests__/`：Jest 单元测试，当前覆盖金额、预算、OCR、统计逻辑。

## 常用命令

```bash
npm install
npm run start
npm run android
npm run ios
npm run web
npm run typecheck
npm test
```

在提交或交付较大改动前，至少运行：

```bash
npm run typecheck
npm test
```

## 开发约定

- 使用 TypeScript strict 模式，避免引入 `any`。确实需要时应缩小作用域并说明原因。
- 优先保持工具函数纯净、可测试；涉及金额、日期、预算和统计的逻辑应放在 `src/utils/` 并补充测试。
- SQLite 相关变更集中在 `src/data/database.ts`，涉及 schema 时要考虑迁移和默认数据兼容。
- 领域类型应从 `src/types.ts` 复用，不要在组件中重复定义相同结构。
- 金额以 `number` 表示业务数值，展示格式化逻辑应与计算逻辑分离。
- 日期字段当前使用字符串表示；新增逻辑时保持现有格式约定，不要混用多种日期格式。
- OCR 当前只负责从文本中提取候选金额、日期、商户和分类。接入真实图片识别时，只替换“图片转文本”层，保留用户确认后再入账的流程。
- UI 改动应符合移动端使用习惯，注意小屏布局、输入状态和空数据状态。

## 测试要求

- 修改 `src/utils/money.ts`、`budget.ts`、`ocr.ts`、`stats.ts` 时，同步更新对应测试。
- 修改数据库行为时，优先补充可独立验证的工具测试；若必须测试集成行为，保持测试数据小而明确。
- 修改类型或跨模块契约后运行 `npm run typecheck`。
- 不要为了通过测试而放宽 TypeScript 配置或删除现有断言。

## 工作注意事项

- 当前仓库可能包含未提交文件。不要重置、删除或覆盖与当前任务无关的改动。
- 新增依赖前先确认是否已有依赖能满足需求；如需新增，更新 `package.json` 并说明用途。
- 不要提交本地生成物、缓存、构建输出或依赖目录。
- 保持改动范围聚焦，避免在功能开发中混入无关重构。
