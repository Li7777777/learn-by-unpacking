# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added
- 计划支持英文与其他语言的教程输出约定。
- 计划提供示例学习项目（完整三件套样例）。

## [1.0.0] - 2026-08-21

协议首个稳定版本（2026-08-21 定稿），于 2026-09-10 以标准 Agent Skills 仓库形式开源。

### Added
- `skills/learn-by-unpacking/SKILL.md`：主协议入口，含启用条件、七条核心约束、五步工作流程、交付前自检清单。
- `skills/learn-by-unpacking/references/learn-by-unpacking-protocol.md`：详细参考，含输入确认协议、章节规划规范、源码精读协议与覆盖清单、教程章节骨架、六种图文手段、伴读提示词规范（阶段 A/B/C/D）、四类题目库与评分规则、学习记录字段规范、最终审查清单。
- 双模式支持：主题讲解 / 源码精读。
- 三件套交付：教程、伴读提示词、学习记录。
- 每日考察规则：概念 2 题 + 源码 2 题 + 设计 2 题 + 综合 1 题，每题 0~10 分。
- 掌握画像阈值：绿色 ≥8、黄色 5~7、红色 ≤3。
- 天数推导公式：`推荐天数 = ceil(全部章节总阅读时长 ÷ 每日可用时长)`，默认每日 150~180 分钟，另加一个不计入公式的全量复习日。
- 仓库基础设施：README、MIT 许可证、CONTRIBUTING、SECURITY、`.gitignore`。
- `scripts/validate-skill.mjs`：校验 skill 目录结构与 frontmatter。
- `.github/workflows/validate.yml`：push / PR 自动校验。
- `assets/pipeline.svg` 与 `assets/pipeline-dark.svg`：README 工作流程图（浅/深色）。

[Unreleased]: https://github.com/Li7777777/learn-by-unpacking/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Li7777777/learn-by-unpacking/releases/tag/v1.0.0
