#!/usr/bin/env node
/**
 * 意匠帳の一覧を作る。
 *
 * `docs/design/notation/<群>/<図>/` を走査して `index.html` を組み立てる。
 * 一覧は手で書かない = 書くと entry を足した時に必ず取り残される。
 *
 * 使い方
 *   node packages/dragon/scripts/design-index.mjs [走査する dir]
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ROOT = resolve(HERE, "../../../docs/design/notation");

/** 走査から外す名前。 dir でないものと隠し dir は別途落とす */
const SKIP = new Set(["index.html", "README.md"]);

const isDir = (p) => existsSync(p) && statSync(p).isDirectory();

/**
 * 図の説明を note.md から 1 行だけ取る。
 * 見出しと箇条書きの記号は落とし、最初の本文行を返す。
 */
export function summaryOf(noteText) {
  if (!noteText) return "";
  const lines = noteText.split("\n");
  let at = 0;
  // 先頭が frontmatter なら、閉じる `---` まで中身ごと飛ばす。
  // 行頭の記号だけを見て飛ばすと、中の `title:` を説明として拾ってしまう
  while (at < lines.length && !lines[at].trim()) at += 1;
  if (lines[at]?.trim() === "---") {
    at += 1;
    while (at < lines.length && lines[at].trim() !== "---") at += 1;
    at += 1;
  }
  for (; at < lines.length; at += 1) {
    const line = lines[at].trim();
    if (!line || line.startsWith("#")) continue;
    return line.replace(/^[-*]\s*/, "");
  }
  return "";
}

/**
 * SVG の id を entry ごとに付け替える。
 *
 * 1 つの頁に複数の図を並べると、矢印の印などの id が重なる。
 * 重なると後の図が先頭の図の定義を引くので、端の形が全部同じになる。
 */
export function prefixIds(svg, prefix) {
  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  let out = svg;
  for (const id of new Set(ids)) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out
      .replace(new RegExp(`\\sid="${esc}"`, "g"), ` id="${prefix}-${id}"`)
      .replace(new RegExp(`url\\(#${esc}\\)`, "g"), `url(#${prefix}-${id})`)
      .replace(new RegExp(`(href)="#${esc}"`, "g"), `$1="#${prefix}-${id}"`);
  }
  return out;
}

/**
 * entry を集める。
 *
 * 集めた件数と、集められなかった dir の両方を返す。
 * 落ちた dir を黙って捨てると、一覧に出ないことに気付けない。
 */
export function collectEntries(root) {
  const entries = [];
  const problems = [];
  if (!isDir(root)) return { entries, problems: [{ path: root, why: "走査する dir が無い" }] };

  for (const group of readdirSync(root).sort()) {
    if (group.startsWith(".") || SKIP.has(group)) continue;
    const groupDir = join(root, group);
    if (!isDir(groupDir)) continue;

    for (const name of readdirSync(groupDir).sort()) {
      if (name.startsWith(".")) continue;
      const dir = join(groupDir, name);
      if (!isDir(dir)) continue;

      const look = join(dir, "look.svg");
      if (!existsSync(look)) {
        problems.push({ path: `${group}/${name}`, why: "look.svg が無い" });
        continue;
      }
      const notePath = join(dir, "note.md");
      entries.push({
        group,
        name,
        svg: readFileSync(look, "utf8"),
        summary: existsSync(notePath) ? summaryOf(readFileSync(notePath, "utf8")) : "",
        hasSource: existsSync(join(dir, "source.cdl.ts")),
        hasNote: existsSync(notePath),
      });
    }
  }
  return { entries, problems };
}

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** 一覧の頁を組む。 entry 1 件 = card 1 枚 */
export function buildIndexHtml(entries, problems = []) {
  const cards = entries
    .map((e, i) => {
      const missing = [];
      if (!e.hasSource) missing.push("source.cdl.ts");
      if (!e.hasNote) missing.push("note.md");
      const warn = missing.length ? `<p class="warn">${esc(missing.join(" / "))} が無い</p>` : "";
      return `      <article class="card" data-entry="${esc(e.group)}/${esc(e.name)}">
        <header><span class="group">${esc(e.group)}</span><h2>${esc(e.name)}</h2></header>
        <div class="look">${prefixIds(e.svg, `e${i}`)}</div>
        <p class="summary">${esc(e.summary || "決めたことがまだ書かれていない")}</p>
        ${warn}
      </article>`;
    })
    .join("\n");

  const issues = problems.length
    ? `    <section class="problems"><h2>集められなかった dir</h2><ul>${problems
        .map((p) => `<li>${esc(p.path)} — ${esc(p.why)}</li>`)
        .join("")}</ul></section>`
    : "";

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>dragon 記法の意匠帳</title>
<style>
  :root { --ground: #f7f5f0; --panel: #fffdf9; --edge: #ded8cc; --ink: #2a2723; --ink-mid: #6d6960; --accent: #c8442a; }
  @media (prefers-color-scheme: dark) {
    :root { --ground: #1b1917; --panel: #232120; --edge: #3d3935; --ink: #ece7df; --ink-mid: #a8a199; --accent: #f2704c; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--ground); color: var(--ink); font-family: "Zen Kaku Gothic New", -apple-system, "Hiragino Sans", sans-serif; line-height: 1.7; }
  .wrap { max-width: 1200px; margin: 0 auto; padding: 40px 24px 80px; }
  h1 { font-size: 30px; margin: 0 0 6px; letter-spacing: .04em; }
  .lede { color: var(--ink-mid); margin: 0 0 32px; }
  .grid { display: grid; gap: 20px; }
  .card { background: var(--panel); border: 1px solid var(--edge); border-radius: 4px; overflow: hidden; }
  .card header { display: flex; align-items: baseline; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--edge); }
  .card h2 { font-size: 16px; margin: 0; font-family: ui-monospace, monospace; }
  .group { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-mid); font-family: ui-monospace, monospace; }
  .look { overflow-x: auto; padding: 12px; }
  .look svg { display: block; width: 100%; height: auto; }
  .summary { margin: 0; padding: 0 14px 14px; color: var(--ink-mid); font-size: 14px; }
  .warn { margin: 0; padding: 0 14px 14px; color: var(--accent); font-size: 13px; }
  .problems { margin-top: 40px; border-top: 1px solid var(--edge); padding-top: 16px; color: var(--accent); }
  .count { font-family: ui-monospace, monospace; color: var(--ink-mid); }
</style>
</head>
<body>
  <div class="wrap">
    <h1>dragon 記法の意匠帳</h1>
    <p class="lede">決めた見た目を図ごとに 1 件ずつ貯めた一覧。 <span class="count">${entries.length} 件</span></p>
    <div class="grid">
${cards}
    </div>
${issues}
  </div>
</body>
</html>
`;
}

/** 走査して書き出す。 書き先は走査した dir の直下に固定する */
export function writeIndex(root) {
  const { entries, problems } = collectEntries(root);
  const out = join(root, "index.html");
  writeFileSync(out, buildIndexHtml(entries, problems));
  return { out, count: entries.length, problems };
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  const root = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_ROOT;
  const r = writeIndex(root);
  console.log(`一覧を書いた ... ${r.out} (${r.count} 件)`);
  for (const p of r.problems) console.warn(`  拾えなかった ... ${p.path} — ${p.why}`);
  if (r.count === 0) {
    console.warn("  entry が 1 件も無い。 走査先が違うか、まだ何も納めていない");
  }
}
