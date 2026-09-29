#!/usr/bin/env node
/**
 * 図の文字を 3 つの数で測る。
 *
 * 描き直す相手を勘で選ばないために置く。 「見た目が良くない」 は人によって違うが、
 * 「名前が枠の 1 割にしか広がっていない」 は誰が見ても同じ値になる。
 *
 * 3 つ要る。 広がりは **一番外側の文字** で決まるため、内側の名前が読めるように
 * なっても動かない。 描き方を 3 件直した回は、3 枚のうち 2 枚で広がりが 1 ポイントも
 * 動かず、残る 1 枚も 1 ポイントしか動かなかった。 同じ 3 枚で切れた名前は
 * 5 件 → 3 件 と 1 件 → 0 件 に減っている (#2669 で実測)。
 * 広がりだけを見ると、読めるようになった図を「変わらなかった」 と判定する。
 *
 * 測るのは **文字だけ**。 図形を数えると、どの図も 9 割で並ぶ = 枠いっぱいに敷く
 * カードの地 (`node-body`) が枠の 65% を 1 つで占めるため、図の差が消える (実測)。
 * 文字は下地を持たないので、広がりがそのまま「絵として使えている面積」 になる。
 *
 * 線を引く動きは JS が駆動する。 開いた直後は起点しか描かれていないため、同じ図を
 * 何度も読んで **一番広がった時** を採る。 段は繰り返すので待てば必ず全部描かれるが、
 * それは読む窓が繰り返しの周期より長い時にだけ成り立つ。 そこで回数を決め打ちにせず、
 * **値が伸びなくなるまで読む** (#2675)。 伸び続けたまま上限に達した図は
 * 「読み切れていない」 として別に出す。
 *
 * 使い方
 *   node apps/playground-spa/scripts/drawing-measure.mjs
 *   node apps/playground-spa/scripts/drawing-measure.mjs --group charts
 *   node apps/playground-spa/scripts/drawing-measure.mjs --id 図を速くする
 *   node apps/playground-spa/scripts/drawing-measure.mjs --json .context/redraw/measure.json
 *   node apps/playground-spa/scripts/drawing-measure.mjs --max-samples 60 --settle 8
 *
 * 引数
 *   --interval      1 回ごとの間隔 (既定 400ms)
 *   --max-samples   読む回数の上限 (既定 30)。 `--samples` も同じ意味で受ける
 *   --settle        入れ替わらない読みが何回続いたら落ち着いたとみなすか (既定 5)
 */
import { chromium } from "playwright";
import {
  一枚を測る,
  一群を測る,
  落ち着くまで読む,
  上限の既定,
  落ち着きの既定,
} from "../../../packages/dragon/scripts/drawing-measure-run.mjs";
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
// `--samples` は `--max-samples` と同じ意味で残す = 既にある手順を書き換えずに済む
const 読む上限 = Number(flag("max-samples", flag("samples", String(上限の既定))));
const 落ち着き = Number(flag("settle", String(落ち着きの既定)));
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
 *
 * 測るのは **画面の座標系**。 `getBBox()` は祖先の変換を見ないため、箱ごとに
 * `<g transform="translate(...)">` で位置を与える図では、離れた名前がすべて同じ値を返す。
 * 階層図の 3 つの名前は (60, 11, 24, 15) で揃い、重ねると 1 つ分に潰れて 0% になっていた。
 * 変換を持たない図 (四象限) は偶然正しく出るので、当たっている図があることが誤りを隠していた。
 *
 * 切れは **末尾が `…` で終わるか** で数える。 engine は幅に収まらない時だけ末尾に
 * `…` を足すので、途中に `…` を含む名前 (`pie / bar / …` のような書き方) は切れていない。
 * 3 つの数は同じ 1 回の読み取りから返す。 別々の読み取りから並べると、線を引く動きの
 * 途中と引き終わりを混ぜた組み合わせになり、突き合わせられない。
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

    // 枠も画面の座標系に写す。 SVG 自身の矩形を分母にすると、枠が余白付きで置かれた時に
    // 描画域より広い値で割ることになる
    const m = svg.getScreenCTM();
    if (!m) return null;
    const 写す = (x, y) => ({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f });
    const 左上 = 写す(vb.x, vb.y);
    const 右下 = 写す(vb.x + vb.width, vb.y + vb.height);
    const 枠の面積 = Math.abs(右下.x - 左上.x) * Math.abs(右下.y - 左上.y);
    if (!(枠の面積 > 0)) return null;

    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    let 件 = 0;
    let 切れ = 0;
    let 字 = 0;
    // 文字は `text` と、HTML で組む札を載せる `foreignObject` の 2 つに出る
    for (const el of svg.querySelectorAll("text, foreignObject")) {
      const b = el.getBoundingClientRect();
      if (!(b.width > 0) || !(b.height > 0)) continue;
      x0 = Math.min(x0, b.left);
      y0 = Math.min(y0, b.top);
      x1 = Math.max(x1, b.right);
      y1 = Math.max(y1, b.bottom);
      件 += 1;

      const t = (el.textContent ?? "").trim();
      if (t.endsWith("…")) 切れ += 1;
      // 読める字は、省略の印と空白を除いた数。 折り返しの改行を 1 字と数えると、
      // 同じ名前が枠の幅で増減する
      字 += t.replace(/[\s…]/g, "").length;
    }
    return {
      枠: { w: Math.round(vb.width), h: Math.round(vb.height) },
      広がり: 件 === 0 ? 0 : ((x1 - x0) * (y1 - y0)) / 枠の面積,
      文字の件数: 件,
      切れた名前: 切れ,
      読める字: 字,
    };
  });

/** 同じ図を、値が伸びなくなるまで読む。 打ち切りの考え方は `落ち着くまで読む` が持つ */
const 最大を採る = (page) =>
  落ち着くまで読む({
    読む: () => 読み取る(page),
    待つ: () => page.waitForTimeout(読む間隔),
    上限: 読む上限,
    落ち着き,
  });

const 群 = 群の一覧(readFileSync(CATALOG_TS, "utf8")).filter(
  (g) => 群指定.length === 0 || 群指定.includes(g),
);
if (群.length === 0) {
  console.error("走る群が 0 件。 --group の綴りを確かめる");
  process.exit(2);
}

/** 走っている図を 1 行ずつ出す。 出す先は標準エラー = 標準出力は表を運ぶ */
const 進捗 = (行) => process.stderr.write(`${行}\n`);

async function 群を開く(page, group) {
  await page.goto(`${BASE}/catalog/${group}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
}

/** 図の id は画面から取る。 catalog の source を読むと、画面に出ない図まで数える */
async function 図の一覧(page, 絞り) {
  const ids = await page
    .locator(".catalog-list .catalog-list-item")
    .evaluateAll((els) => els.map((e) => e.getAttribute("data-item-id")).filter((v) => v));
  return ids.filter((id) => 絞り.length === 0 || 絞り.includes(id));
}

async function 図を押す(page, id) {
  await page.locator(`.catalog-list-item[data-item-id="${id}"]`).first().click();
  await page.waitForTimeout(800);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const 結果 = [];
for (const group of 群) {
  結果.push(
    ...(await 一群を測る(group, {
      開く: () => 群を開く(page, group),
      一覧: () => 図の一覧(page, id指定),
      一枚: (g, id) =>
        一枚を測る(g, id, {
          押す: () => 図を押す(page, id),
          測る: () => 最大を採る(page),
          報せる: 進捗,
        }),
    })),
  );
}
await browser.close();

if (結果.length === 0) {
  console.error("測った図が 0 件。 --id の綴りを確かめる");
  process.exit(2);
}

const 測れた = 結果.filter((r) => r.測れた).sort((a, b) => a.広がり - b.広がり);
const 測れない = 結果.filter((r) => !r.測れた);
const 率 = (v) => `${Math.round(v * 100)}%`;

console.log(`| 図 | 群 | 枠 | 文字の広がり | 切れた名前 | 読める字 | 文字 |`);
console.log(`|---|---|---|---|---|---|---|`);
for (const r of 測れた) {
  console.log(
    `| ${r.id} | ${r.group} | ${r.枠.w}×${r.枠.h} | ${率(r.広がり)} | ${r.切れた名前} | ${r.読める字} | ${r.文字の件数} |`,
  );
}
console.log("");
console.log(`測れた ... ${測れた.length} 件 / 走査 ${結果.length} 件`);
// 切れは広がりと別に出す。 並び順は広がりなので、表の上のほうを見ても切れは拾えない
const 切れた図 = 測れた.filter((r) => r.切れた名前 > 0);
console.log(
  `名前が切れた図 ... ${切れた図.length} 件 / 切れた名前 ${切れた図.reduce((a, r) => a + r.切れた名前, 0)} 件`,
);
// 読み切れていないことを低い値に潰さない。 値は表にも出るが、最後の値ではない
const 読み切れていない = 測れた.filter((r) => r.読み切れた === false);
if (読み切れていない.length > 0) {
  console.log(`読み切れていない ... ${読み切れていない.length} 件 (上限 ${読む上限} 回まで伸び続けた)`);
  for (const r of 読み切れていない) console.log(`  ${r.group}/${r.id} ... ${率(r.広がり)}`);
}
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
