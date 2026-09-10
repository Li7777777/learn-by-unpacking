# Contributing

感谢你有兴趣改进 `learn-by-unpacking`。本仓库是一个 Agent Skills 仓库，主要内容是**学习协议的文本**，因此评审标准偏向「约束是否可执行、表述是否无歧义」，而不是代码风格。

## 我能贡献什么

- **新约束或新检查项** — 例如强制要求某一类图表、增加覆盖率自证的字段。
- **新的图文手段或题型** — 补充第六章的手段，或调整每日 7 题的配比。
- **其他语言本地化** — 新建 `skills/learn-by-unpacking-<lang>/`，保留协议结构，翻译表述并调整语言约定。
- **示例项目** — 用本 skill 真实生成的一套三件套（教程 / 伴读提示词 / 学习记录），放入 `examples/<主题>/`，用于验证协议能否被稳定执行。
- **工具链** — 扩展 `scripts/validate-skill.mjs`，例如检查章节骨架完整度。
- **文档修正** — 错别字、表述歧义、README 与协议不一致之处。

## 开始之前

1. 先读 [`skills/learn-by-unpacking/SKILL.md`](skills/learn-by-unpacking/SKILL.md) 和 [`references/learn-by-unpacking-protocol.md`](skills/learn-by-unpacking/references/learn-by-unpacking-protocol.md)。
2. 高变动的改动（新增核心约束、改评分规则、改天数公式）请**先开 issue** 说明动机与预期效果，达成一致后再提 PR。
3. 小改动（改文案、修链接）直接提 PR。

## 本地开发

无需依赖，只需要 Node.js 18+：

```bash
git clone https://github.com/Li7777777/learn-by-unpacking.git
cd learn-by-unpacking
node scripts/validate-skill.mjs
```

校验通过即符合仓库要求。CI 会在每次 push 和 PR 上运行同一脚本（见 `.github/workflows/validate.yml`）。

## 编写规范

- **简体中文为主**，术语首次出现时给出英文原词。
- **约束必须是可判定的。** 写「单章至少使用四种图文手段」，不写「尽量图文并茂」。
- **不引入无法核实的具体数字。** 阈值（15~40 分钟、2000~7000 字、≥8 分）应说明用途，改动时同步 README、SKILL.md、protocol 三处。
- **渐进式披露。** 决策必需的内容留在 `SKILL.md`；细节、模板、清单放 `references/`。`SKILL.md` 只通过相对链接指向它们。
- **链接用相对路径**，保证 skill 被复制到任何 skills 目录后仍可解析。
- 正文中的示例文件名保持 `教程-<主题>.md` 这种占位形式，不要写死某个具体主题。
- 改流程图时 `assets/pipeline.svg` 与 `assets/pipeline-dark.svg` 必须同步修改（两份为独立静态文件，仅颜色不同）。

## 提交与 PR

建议的提交信息前缀：

```text
feat: 新增可迁移方法的强制检查项
fix: 修正天数公式与每日分配的矛盾
docs: README 补充 Claude Code 安装路径
refactor: 把题库细则移入 references
chore: 更新 CI 的 Node 版本
```

PR 描述请包含：

- 变更动机（解决了学习过程中的什么实际问题）。
- 影响面（是否需要同步修改 README / SKILL.md / protocol / CHANGELOG）。
- `node scripts/validate-skill.mjs` 的结果。
- 若改动了协议，附一段按新协议执行的片段，证明它可被执行。

## 版本与变更记录

- 版本号遵循语义化版本，同时更新 `SKILL.md` frontmatter 的 `metadata.version` 和 `CHANGELOG.md`。
- 破坏性变更（改评分体系、改交付物数量、改文件命名约定）升主版本号，并在 CHANGELOG 写明迁移方式。
- Release 由仓库维护者在打 tag 后创建，tag 形如 `v1.1.0`。

## 行为准则

评审针对协议文本，不针对人。指出问题请引用具体行和理由；不接受「感觉不够好」这类无法行动的反馈。

## 许可证

向本仓库提交内容即表示你同意该贡献以 [MIT](LICENSE) 许可证发布。
