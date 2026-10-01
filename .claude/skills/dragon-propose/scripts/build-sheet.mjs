#!/usr/bin/env node
/**
 * 候補の一覧 (JSON) から、並べて見比べる頁を 1 枚組み立てる (#2780)。
 *
 * 使い方。
 *
 *   node .claude/skills/dragon-propose/scripts/build-sheet.mjs <候補.json> -o <出力.html>
 *
 * 候補の JSON の形は SKILL.md § 候補の一覧 が SSOT。
 *
 * **足りない形は止める**。 候補が 1 件 / 絵が 0 枚 / 推す案が 0 件や 2 件以上 / 絵の file が
 * 無い、のいずれも error で落とす。 黙って出すと「見せたつもりで見せていない」 頁ができる。
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ここ = dirname(fileURLToPath(import.meta.url));
const 雛形 = join(ここ, "..", "assets", "sheet-template.html");

/** HTML に埋める時に壊れる 5 文字を逃がす */
function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function 落とす(理由) {
  console.error(`build-sheet: ${理由}`);
  process.exit(1);
}

function 引数を読む(argv) {
  const 残り = argv.slice(2);
  let 入力;
  let 出力;
  for (let i = 0; i < 残り.length; i += 1) {
    if (残り[i] === "-o" || 残り[i] === "--out") {
      出力 = 残り[i + 1];
      i += 1;
    } else if (!入力) {
      入力 = 残り[i];
    }
  }
  if (!入力) 落とす("候補の JSON を渡してください (使い方は file 冒頭)");
  if (!出力) 落とす("-o で出力先を渡してください");
  return { 入力: resolve(入力), 出力: resolve(出力) };
}

function 検める(案, 入力dir) {
  if (!Array.isArray(案.候補)) 落とす("候補 が配列ではありません");
  if (案.候補.length < 2) 落とす(`候補が ${案.候補.length} 件しかありません (2 件から 4 件)`);
  if (案.候補.length > 4) 落とす(`候補が ${案.候補.length} 件あります (4 件まで、それ以上は選べない)`);

  const 推し = 案.候補.filter((c) => c.推奨 === true);
  if (推し.length !== 1) 落とす(`推す案が ${推し.length} 件です (ちょうど 1 件に決めてください)`);

  const 無い = [];
  for (const c of 案.候補) {
    if (!c.id) 落とす("候補に id がありません");
    if (!Array.isArray(c.絵) || c.絵.length === 0) 落とす(`候補 ${c.id} に絵が 1 枚もありません`);
    for (const g of c.絵) {
      if (!existsSync(join(入力dir, g.path))) 無い.push(`${c.id}: ${g.path}`);
    }
  }
  if (無い.length > 0) 落とす(`絵の file が見つかりません\n  ${無い.join("\n  ")}`);
}

function 表を組む(表) {
  if (!表 || !Array.isArray(表.見出し) || !Array.isArray(表.行) || 表.行.length === 0) return "";
  const th = 表.見出し.map((h) => `<th>${esc(h)}</th>`).join("");
  const tr = 表.行
    .map((行) => {
      const 推し = 行.推奨 === true ? ' data-oshi="1"' : "";
      const セル = (行.値 ?? 行)
        .map((v, i) => `<td${i === 0 ? "" : ' class="num"'}>${esc(v)}</td>`)
        .join("");
      return `<tr${推し}>${セル}</tr>`;
    })
    .join("\n        ");
  return `  <section>
    <h2>${esc(表.題 ?? "見比べる")}</h2>
    <div class="scroll">
      <table>
        <thead><tr>${th}</tr></thead>
        <tbody>
        ${tr}
        </tbody>
      </table>
    </div>
  </section>`;
}

function 札を組む(c) {
  const 推し = c.推奨 === true;
  const 絵 = c.絵
    .map(
      (g) => `        <figure>
          <button type="button" class="shot" data-cap="${esc(`${c.名前 ?? c.id} — ${g.題 ?? ""}`)}">
            <img src="${esc(g.path)}" alt="${esc(`${c.名前 ?? c.id} の ${g.題 ?? "絵"}`)}">
          </button>
          <figcaption>${esc(g.題 ?? "")}</figcaption>
        </figure>`,
    )
    .join("\n");
  return `      <article class="card"${推し ? ' data-oshi="1"' : ""}>
        <div class="card-head">
          <h3>${esc(c.名前 ?? c.id)}</h3>
          ${推し ? '<span class="badge">推す案</span>' : ""}
        </div>
        ${c.説明 ? `<p>${esc(c.説明)}</p>` : ""}
${絵}
      </article>`;
}

function 覚書を組む(覚書) {
  if (!Array.isArray(覚書) || 覚書.length === 0) return "";
  const 項 = 覚書
    .map((n) => `      <p><strong>${esc(n.題)}</strong><br>${esc(n.本文)}</p>`)
    .join("\n");
  return `  <section>
    <h2>決める前に知っておくこと</h2>
${項}
  </section>`;
}

const { 入力, 出力 } = 引数を読む(process.argv);
if (!existsSync(入力)) 落とす(`${入力} が見つかりません`);

let 案;
try {
  案 = JSON.parse(readFileSync(入力, "utf8"));
} catch (e) {
  落とす(`JSON を読めません: ${e.message}`);
}

検める(案, dirname(入力));

const html = readFileSync(雛形, "utf8")
  .replaceAll("__TITLE__", esc(案.題 ?? "候補"))
  .replaceAll("__EYEBROW__", esc(案.小見出し ?? "dragon"))
  .replaceAll("__LEAD__", esc(案.ねらい ?? ""))
  .replaceAll("__ASK__", esc(案.問い ?? "どの案で通しますか。"))
  .replaceAll("__FOOTER__", esc(案.脚注 ?? ""))
  .replace("<!--{TABLE}-->", 表を組む(案.表))
  .replace("<!--{CARDS}-->", 案.候補.map(札を組む).join("\n"))
  .replace("<!--{NOTES}-->", 覚書を組む(案.覚書));

writeFileSync(出力, html, "utf8");
console.log(`候補 ${案.候補.length} 件 / 絵 ${案.候補.reduce((n, c) => n + c.絵.length, 0)} 枚 → ${出力}`);
