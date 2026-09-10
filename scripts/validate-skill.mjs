#!/usr/bin/env node
/**
 * validate-skill.mjs — 校验本仓库内的 Agent Skills 结构。
 *
 * 用法：
 *   node scripts/validate-skill.mjs            # 校验 skills/ 下全部 skill
 *   node scripts/validate-skill.mjs --strict   # 把警告也视为失败
 *
 * 无第三方依赖，Node 18+。
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(REPO_ROOT, "skills");
const STRICT = process.argv.includes("--strict");

const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/; // Agent Skills: 小写、数字、连字符
const MAX_NAME = 64;
const MAX_DESCRIPTION = 1024;

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

/** 极简 YAML frontmatter 解析：只取顶层 key 与 `key: "value"` / `key: value`。 */
function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  if (!m) return null;
  const data = {};
  let currentKey = null;
  for (const rawLine of m[1].split(/\r?\n/)) {
    if (!rawLine.trim()) continue;
    const indent = rawLine.match(/^[ \t]*/)[0].length;
    const kv = /^[ \t]*([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(rawLine);
    if (kv && indent === 0) {
      currentKey = kv[1];
      let value = kv[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
        (value.startsWith("'") && value.endsWith("'") && value.length > 1)
      ) {
        value = value.slice(1, -1);
      }
      data[currentKey] = value;
    } else if (currentKey && indent > 0 && kv) {
      // 嵌套层（metadata:）—— 平铺进 key，避免多遍解析
      data[`${currentKey}.${kv[1]}`] = kv[2].trim().replace(/^["']|["']$/g, "");
    } else {
      warn(`frontmatter 中无法解析的行：${rawLine.trim()}`);
    }
  }
  return { data, body: text.slice(m[0].length), end: m[0].length };
}

/** 提取 markdown 相对链接目标（忽略 http、锚点、邮件、代码块内内容）。 */
function collectRelativeLinks(body) {
  const withoutFences = body.replace(/^```[\s\S]*?^```[ \t]*$/gm, "");
  const links = [];
  const re = /!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?[^)]*\)/g;
  let m;
  while ((m = re.exec(withoutFences)) !== null) {
    const target = m[1];
    if (/^(https?:|mailto:|#|\/)/i.test(target)) continue;
    links.push(target.split("#")[0].split("?")[0]);
  }
  return links.filter(Boolean);
}

function listFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === ".git" || entry === "node_modules") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

function validateSkill(dir) {
  const dirName = relative(SKILLS_DIR, dir).split(/[\\/]/).join("/");
  const skillMd = join(dir, "SKILL.md");

  if (!existsSync(skillMd)) {
    fail(`${dirName}: 缺少 SKILL.md`);
    return;
  }

  const text = readFileSync(skillMd, "utf8");
  if (text.startsWith("\ufeff")) fail(`${dirName}: SKILL.md 含 BOM，可能导致 frontmatter 解析失败`);

  const fm = parseFrontmatter(text);
  if (!fm) {
    fail(`${dirName}: SKILL.md 开头缺少 --- frontmatter ---`);
    return;
  }

  const { data, body } = fm;

  // name
  const name = data.name;
  if (!name) {
    fail(`${dirName}: frontmatter 缺少 name`);
  } else {
    if (!NAME_RE.test(name)) fail(`${dirName}: name "${name}" 不符合 ^[a-z0-9]+(-[a-z0-9]+)*$`);
    if (name.length > MAX_NAME) fail(`${dirName}: name 超过 ${MAX_NAME} 字符`);
    if (name !== dirName.split("/").pop()) fail(`${dirName}: name (${name}) 与目录名不一致`);
  }

  // description
  const desc = data.description;
  if (!desc) {
    fail(`${dirName}: frontmatter 缺少 description`);
  } else {
    if (desc.length > MAX_DESCRIPTION)
      fail(`${dirName}: description ${desc.length} 字符，超过上限 ${MAX_DESCRIPTION}`);
    if (desc.length < 40)
      warn(`${dirName}: description 仅 ${desc.length} 字符，建议同时写明「做什么」与「何时启用」`);
    if (!/Use when|当用户|使用场景|启用/i.test(desc))
      warn(`${dirName}: description 未包含触发条件，agent 可能不会自动启用该 skill`);
  }

  // 可选元数据
  if (data["metadata.version"] && !/^\d+\.\d+\.\d+/.test(data["metadata.version"]))
    warn(`${dirName}: metadata.version "${data["metadata.version"]}" 不是语义化版本`);

  // 正文字量（渐进式披露：SKILL.md 应保持精炼）
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  if (words > 5000) warn(`${dirName}: SKILL.md 正文约 ${words} 词，细节建议移入 references/`);

  // 相对链接必须存在
  for (const link of collectRelativeLinks(body)) {
    const target = resolve(dirname(skillMd), link);
    if (!existsSync(target)) fail(`${dirName}: SKILL.md 中的链接目标不存在 -> ${link}`);
  }

  // references/ 里的文件也必须被引用（避免孤儿文件）
  const refDir = join(dir, "references");
  if (existsSync(refDir)) {
    const linked = new Set(
      collectRelativeLinks(body).map((l) => resolve(dirname(skillMd), l).replace(/\\/g, "/")),
    );
    for (const file of listFiles(refDir)) {
      if (/\.(md|txt)$/i.test(file) && !linked.has(file.replace(/\\/g, "/")))
        warn(`${dirName}: references/${relative(refDir, file)} 未被 SKILL.md 链接，agent 不会读到它`);
    }
  }

  return { name: name || dirName, descLength: desc ? desc.length : 0, words };
}

// —— 仓库级检查：所有 markdown 的相对链接必须存在
const MD_ROOT = ["README.md", "CONTRIBUTING.md", "SECURITY.md", "CHANGELOG.md"];
for (const rel of MD_ROOT) {
  const file = join(REPO_ROOT, rel);
  if (!existsSync(file)) {
    warn(`缺少 ${rel}`);
    continue;
  }
  for (const link of collectRelativeLinks(readFileSync(file, "utf8"))) {
    if (!existsSync(resolve(REPO_ROOT, link))) fail(`${rel}: 链接目标不存在 -> ${link}`);
  }
}

// —— 仓库级检查：README 引用的 svg 资源存在且为合法 XML 标签结构
const readmeText = existsSync(join(REPO_ROOT, "README.md"))
  ? readFileSync(join(REPO_ROOT, "README.md"), "utf8")
  : "";
const svgRefs = new Set();
for (const m of readmeText.matchAll(/(?:src|srcset)="([^"]+\.svg)"/g)) svgRefs.add(m[1]);
for (const link of collectRelativeLinks(readmeText)) if (/\.svg$/i.test(link)) svgRefs.add(link);
for (const ref of svgRefs) {
  const abs = join(REPO_ROOT, ref);
  if (!existsSync(abs)) {
    fail(`README.md: 图片不存在 -> ${ref}`);
    continue;
  }
  const svg = readFileSync(abs, "utf8");
  if (!/<svg[\s>]/.test(svg) || !/<\/svg>/.test(svg)) fail(`${ref}: 不是完整的 SVG 文档`);
  const stray = svg.match(/&(?!#\d+;|#x[0-9a-fA-F]+;amp;|lt;|gt;|quot;|apos;)/g);
  if (stray) fail(`${ref}: ${stray.length} 处未转义的 &，会导致 XML 解析失败`);
  if (!/aria-label=|<title>/.test(svg)) warn(`${ref}: 缺少 <title> 或 aria-label，不利于无障碍与可检索`);
}

if (!existsSync(SKILLS_DIR)) {
  console.error(`✗ 找不到 skills/ 目录：${SKILLS_DIR}`);
  process.exit(1);
}

const skills = readdirSync(SKILLS_DIR).filter((entry) => {
  const full = join(SKILLS_DIR, entry);
  return statSync(full).isDirectory() && existsSync(join(full, "SKILL.md"));
});

if (skills.length === 0) fail("skills/ 下没有任何包含 SKILL.md 的目录");

const results = [];
for (const entry of readdirSync(SKILLS_DIR)) {
  const full = join(SKILLS_DIR, entry);
  if (!statSync(full).isDirectory()) continue;
  if (entry === "node_modules" || entry.startsWith(".")) continue;
  if (!existsSync(join(full, "SKILL.md"))) {
    // 允许 skills/<ns>/<skill>/SKILL.md 一层嵌套
    const nested = listFiles(full).filter((f) => f.endsWith("SKILL.md"));
    if (nested.length === 0) {
      warn(`skills/${entry}: 目录内没有 SKILL.md`);
      continue;
    }
    for (const n of nested) {
      const r = validateSkill(dirname(n).replace(/\\/g, "/"));
      if (r) results.push(r);
    }
    continue;
  }
  const r = validateSkill(full);
  if (r) results.push(r);
}

for (const r of results) {
  console.log(`  ✓ ${r.name}  (description ${r.descLength} 字符 · 正文约 ${r.words} 词)`);
}

for (const w of warnings) console.log(`  ! ${w}`);
for (const e of errors) console.log(`  ✗ ${e}`);

const status = `\n${errors.length} 个错误，${warnings.length} 个警告。`;
if (errors.length > 0 || (STRICT && warnings.length > 0)) {
  console.log(status + (STRICT && errors.length === 0 ? "（--strict 模式下警告视为失败）" : ""));
  process.exit(1);
}
console.log(`\n校验通过：${results.length} 个 skill。${status}`);
