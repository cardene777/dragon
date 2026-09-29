#!/usr/bin/env node
/**
 * 図の文字が枠をどれだけ使っているかを測る。
 *
 * 描き直す相手を勘で選ばないために置く。 「見た目が良くない」 は人によって違うが、
 * 「名前が枠の 1 割にしか広がっていない」 は誰が見ても同じ値になる。
 *
 * 測るのは **文字だけ**。 図形を数えると、どの図も 9 割で並ぶ = 枠いっぱいに敷く
 * カードの地 (`node-body`) が枠の 65% を 1 つで占めるため、図の差が消える (実測)。
 * 文字は下地を持たないので、広がりがそのまま「絵として使えている面積」 になる。
 *
 * 線を引く動きは JS が駆動する。 開いた直後は起点しか描かれていないため、同じ図を
 * 何度も読んで **一番広がった時** を採る。 段は繰り返すので待てば必ず全部描かれる。
 *
 * 使い方
 *   node apps/playground-spa/scripts/drawing-measure.mjs
 *   node apps/playground-spa/scripts/drawing-measure.mjs --group charts
 *   node apps/playground-spa/scripts/drawing-measure.mjs --id 図を速くする
 *   node apps/playground-spa/scripts/drawing-measure.mjs --json .context/redraw/measure.json
 */
import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../..");
const CATALOG_TS = resolve(REPO, "apps/playground-spa/src/lib/catalog.ts");

const args = process.argv.slice(2);
const flags = (name) =>
  args.flatMap((a, i) => (a === `--${name}` && args[i + 1] ? [args[i + 1]] : []));
const flag = (name, fallback) => flags(name)[0] ?? fallback;

const BASE = flag("url", "http://localhost:4323");
const 読む回数 = Number(flag("samples", "10"));
const 読む間隔 = Number(flag("interval", "400"));
const 群指定 = flags("group");
const id指定 = flags("id");
const JSON出力 = flag("json", "");

/**
 * 見本帳の群を実物から取る。 群の名前をこの script が別に持つと、片方だけ増えてずれる。
 */
export function 群の一覧(catalogTsText) {
  return [...catalogTsText.matchAll(/^\s*slug:\s*"([^"]+)"/gm)].map((m) => m[1]);
}

/**
 * 文字の広がりを読む。 browser の中で動くので、外の値を参照しない。
 *
 * 一番広い SVG を図とみなす。 画面には絵記号の SVG も並ぶため、大きさで選ぶ。
 */
const 読み取る = (page) =>
  page.evaluate(() => {
    const 候補 = Array.from(document.querySelectorAll("main svg"));
    if (候補.length === 0) return null;
    const svg = 候補
      .map((el) => ({ el, w: el.getBoundingClientRect().width }))
      .sort((a, b) => b.w - a.w)[0].el;
    const vb = svg.viewBox?.baseVal;
    if (!vb || vb.width <= 0 || vb.height <= 0) return null;

    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    let 件 = 0;
    // 文字は `text` と、HTML で組む札を載せる `foreignObject` の 2 つに出る
    for (const el of svg.querySelectorAll("text, foreignObject")) {
      let b;
      try {
        b = el.getBBox();
      } catch {
        continue;
      }
      if (!(b.width > 0) || !(b.height > 0)) continue;
      x0 = Math.min(x0, b.x);
      y0 = Math.min(y0, b.y);
      x1 = Math.max(x1, b.x + b.width);
      y1 = Math.max(y1, b.y + b.height);
      件 += 1;
    }
    return {
      枠: { w: Math.round(vb.width), h: Math.round(vb.height) },
      広がり: 件 === 0 ? 0 : ((x1 - x0) * (y1 - y0)) / (vb.width * vb.height),
      文字の件数: 件,
    };
  });

/** 同じ図を何度か読んで、一番描かれていた時の値を採る */
async function 最大を採る(page) {
  let 最大 = null;
  for (let i = 0; i < 読む回数; i += 1) {
    const v = await 読み取る(page);
    if (v && (最大 === null || v.広がり > 最大.広がり)) 最大 = v;
    await page.waitForTimeout(読む間隔);
  }
  return 最大;
}

const 群 = 群の一覧(readFileSync(CATALOG_TS, "utf8")).filter(
  (g) => 群指定.length === 0 || 群指定.includes(g),
);
if (群.length === 0) {
  console.error("走る群が 0 件。 --group の綴りを確かめる");
  process.exit(2);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const 結果 = [];
for (const group of 群) {
  await page.goto(`${BASE}/catalog/${group}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  // 図の id は画面から取る。 catalog の source を読むと、画面に出ない図まで数える
  const ids = (
    await page
      .locator(".catalog-list .catalog-list-item")
      .evaluateAll((els) => els.map((e) => e.getAttribute("data-item-id")).filter((v) => v))
  ).filter((id) => id指定.length === 0 || id指定.includes(id));
  for (const id of ids) {
    await page.locator(`.catalog-list-item[data-item-id="${id}"]`).first().click();
    await page.waitForTimeout(800);
    const v = await 最大を採る(page);
    if (!v) {
      結果.push({ group, id, 測れた: false, なぜ: "枠を持つ SVG が無い" });
      continue;
    }
    結果.push({ group, id, 測れた: true, ...v });
  }
}
await browser.close();

if (結果.length === 0) {
  console.error("測った図が 0 件。 --id の綴りを確かめる");
  process.exit(2);
}

const 測れた = 結果.filter((r) => r.測れた).sort((a, b) => a.広がり - b.広がり);
const 測れない = 結果.filter((r) => !r.測れた);
const 率 = (v) => `${Math.round(v * 100)}%`;

console.log(`| 図 | 群 | 枠 | 文字の広がり | 文字 |`);
console.log(`|---|---|---|---|---|`);
for (const r of 測れた) {
  console.log(
    `| ${r.id} | ${r.group} | ${r.枠.w}×${r.枠.h} | ${率(r.広がり)} | ${r.文字の件数} |`,
  );
}
console.log("");
console.log(`測れた ... ${測れた.length} 件 / 走査 ${結果.length} 件`);
if (測れない.length > 0) {
  // 測れなかったことを 0 に潰さない。 0% と「測っていない」 は別の状態
  console.log(`測れなかった ... ${測れない.length} 件`);
  for (const r of 測れない) console.log(`  ${r.group}/${r.id} ... ${r.なぜ}`);
}

if (JSON出力) {
  const out = resolve(REPO, JSON出力);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify({ base: BASE, 結果 }, null, 2)}\n`);
  console.log(`書き出し ... ${JSON出力}`);
}
