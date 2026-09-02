#!/usr/bin/env node
/**
 * 図 1 つの見た目を artifact に出せる形で吸い出す。
 *
 * dev server (http://localhost:4323) を開き、段ごとの SVG と `:root` の色変数を控えて
 * `.context/design/<図>/` に置く。 併せて artifact に貼る `look.html` を組む。
 *
 * 段の動きは SVG を差し替えるのではなく、1 本の SVG の変わった属性だけを書き換えて出す。
 * engine が要素の inline style に transition を持たせているため、差し替えると宣言ごと捨てて動かない。
 *
 * 使い方
 *   node apps/playground-spa/scripts/design-export.mjs er-demo
 *   node apps/playground-spa/scripts/design-export.mjs er-demo --url http://localhost:4323
 */
import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { findNestedAtRules, scopeThemeCss } from "../../../packages/dragon/scripts/design-theme-css.mjs";
import { SPEC_ROLES, buildSpec, mergeMeasured } from "../../../packages/dragon/scripts/design-spec.mjs";
import { 受け取れるか } from "../../../packages/dragon/scripts/design-capture.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../..");
const CATALOG = resolve(REPO, "apps/playground-spa/src/topics/catalog");

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith("--"));
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
if (!id) {
  console.error("図の id を渡す (例 ... er-demo)");
  process.exit(2);
}
const BASE = flag("url", "http://localhost:4323");
/** 引き終わりを待つ 1 回ぶんの間隔 (ms) と、諦めるまでの回数 */
const SETTLE_STEP_MS = Number(flag("settle", "300"));
const SETTLE_TRIES = Number(flag("settle-tries", "8"));
const OUT = resolve(REPO, ".context/design", id);

/** 群は catalog の file 名から取る。 名前を新しく考えない */
export function findGroup(catalogDir, diagramId) {
  for (const file of readdirSync(catalogDir).sort()) {
    if (!file.endsWith(".cdl.ts")) continue;
    const text = readFileSync(join(catalogDir, file), "utf8");
    if (text.includes(`id: "${diagramId}"`)) return { group: file.replace(/\.cdl\.ts$/, ""), file };
  }
  return null;
}

/** 記法の抜粋。 id を含む宣言のかたまりを丸ごと取る */
export function extractSource(text, diagramId) {
  const lines = text.split("\n");
  const at = lines.findIndex((l) => l.includes(`id: "${diagramId}"`));
  if (at < 0) return "";
  let start = at;
  while (start > 0 && !/^(export )?const |^\s*er\(|^\s*swimlane\(/.test(lines[start])) start -= 1;
  let end = at + 1;
  while (end < lines.length && !/^(export )?const |^\/\/ ───/.test(lines[end])) end += 1;
  return lines.slice(start, end).join("\n").replace(/\s+$/, "");
}

const found = findGroup(CATALOG, id);
if (!found) {
  console.error(`catalog に ${id} が無い。 id の綴りを確かめる`);
  process.exit(2);
}
const { group, file } = found;
const source = extractSource(readFileSync(join(CATALOG, file), "utf8"), id);

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto(`${BASE}/catalog/${group}`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.locator("aside.catalog-sidebar").getByText(id, { exact: false }).first().click();
await page.waitForTimeout(2500);

const readVars = () =>
  page.evaluate(() => {
    const names = new Set();
    for (const sheet of Array.from(document.styleSheets)) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of Array.from(rules ?? [])) {
        for (const m of (rule.cssText ?? "").matchAll(/(--[\w-]+)\s*:/g)) names.add(m[1]);
      }
    }
    const cs = getComputedStyle(document.documentElement);
    const out = {};
    for (const n of [...names].sort()) {
      const v = cs.getPropertyValue(n).trim();
      if (v) out[n] = v;
    }
    return out;
  });

// 寸法も画面から測る。 markup の属性は cdl-theme.css に上書きされる (#1520 と同根)。
// 測る対象は役割で決める = 図の作りが違えば在る役割も違うので、決め打ちすると値が取れない (#1540)
const measureRoles = () => page.evaluate((roles) => {
  const svg = Array.from(document.querySelectorAll("main svg")).sort(
    (a, b) => b.outerHTML.length - a.outerHTML.length,
  )[0];
  const px = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
  };
  const areaOf = (el) => {
    try {
      const b = el.getBBox();
      return b.width * b.height;
    } catch {
      return 0;
    }
  };
  /**
   * 寸法を持たない要素 (`g` で組む箱) は、中で実際に描いている図形まで降りて測る。
   *
   * 降りる先は **最も大きい図形**。 先頭の子を取ると、箱の中に置いた 24 角の絵記号を
   * 箱の寸法として拾う (`infra-demo` の 6 件中 1 件が実際にそうなった)
   */
  const outlineOf = (el) => {
    if (px(getComputedStyle(el).width) !== null) return el;
    let best = null;
    let bestArea = 0;
    for (const d of el.querySelectorAll("*")) {
      const a = areaOf(d);
      if (a > bestArea) {
        bestArea = a;
        best = d;
      }
    }
    return best;
  };
  const measure = (el) => {
    const own = getComputedStyle(el);
    const shape = outlineOf(el);
    const cs = shape ? getComputedStyle(shape) : own;
    let w = px(cs.width);
    let h = px(cs.height);
    if (w === null || h === null) {
      // 線のように width / height を持たない要素は、描かれた矩形で測る
      try {
        const b = el.getBBox();
        w = w ?? px(b.width);
        h = h ?? px(b.height);
      } catch {
        // 描かれていない要素は測れない。 null のまま返して「測れなかった」 と出す
      }
    }
    return {
      w,
      h,
      rx: px(cs.rx),
      sw: px(own.strokeWidth) ?? px(cs.strokeWidth),
      r: px(cs.r),
      fs: px(own.fontSize),
      x: px(el.getAttribute("x1")) ?? px(el.getAttribute("x")) ?? px(cs.x),
    };
  };
  const measured = {};
  for (const role of roles) {
    const els = Array.from(svg.querySelectorAll(`[data-cdl-role="${role}"]`));
    measured[role] = { found: els.length, items: els.map(measure) };
  }
  const vb = (svg.getAttribute("viewBox") || "").split(/\s+/).map(Number);
  return { measured, vb };
}, SPEC_ROLES);

const light = await readVars();
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(500);
const dark = await readVars();
await page.evaluate(() => document.documentElement.classList.remove("dark"));
await page.waitForTimeout(500);

// 段は時間で進むので、新しい段が出なくなるまで控える。
// 寸法は段ごとに測る = 段が進むと要素が増えるため、最初の段だけ見ると後から出る線を 1 本も
// 測れない (`er-demo` の繋がり 6 本が実際にそうなった、#1540)
const seen = new Map();
const measuredByPhase = [];
let idle = 0;
/** いま画面に出ている段の id と markup */
const 今の段 = () =>
  page.evaluate(() => {
    const svg = Array.from(document.querySelectorAll("main svg")).sort(
      (a, b) => b.outerHTML.length - a.outerHTML.length,
    )[0];
    if (!svg) return null;
    const holder = document.querySelector("[data-cdl-phase-id]");
    return { phase: holder?.getAttribute("data-cdl-phase-id") ?? "p0", svg: svg.outerHTML };
  });

for (let i = 0; i < 120 && idle < 24; i += 1) {
  const snap = await 今の段();
  if (snap?.svg && !seen.has(snap.phase)) {
    // **引き終わってから控える** (#1543)。 段が変わった直後は線がまだ引かれている途中で、
    // 線は伸びかけの短い path、その下の光だけが全長で出る = 矢の先に光だけの棒が残る。
    // 意匠帳の `look.svg` はこの markup を焼き付けるので、途中の絵が永久に残る。
    //
    // 待つ長さを決め打ちにしない = 段の長さは engine が DOM に出しておらず、記法から辿っても
    // 段の id と対応が付かない。 markup を読み直して引き終わりを確かめる。
    let 判定 = { 受け取る: false, なぜ: "まだ読み直していない" };
    let 落ち着き = null;
    for (let t = 0; t < SETTLE_TRIES; t += 1) {
      await page.waitForTimeout(SETTLE_STEP_MS);
      落ち着き = await 今の段();
      判定 = 受け取れるか(snap, 落ち着き);
      if (判定.受け取る || 判定.なぜ.startsWith("待つ間に")) break;
    }
    // 控えるのは **判定を通したその markup**。 読み直すと、その間にまた段が進みうる
    if (判定.受け取る && 落ち着き) {
      seen.set(snap.phase, 落ち着き.svg);
      measuredByPhase.push(await measureRoles());
      idle = 0;
    } else {
      // 諦めたことを黙らせない。 段が欠けた時に、待ちが足りなかったのか段が無いのかを分ける
      console.warn(`  ${snap.phase} を控えなかった ... ${判定.なぜ}`);
    }
  } else {
    idle += 1;
  }
  await page.waitForTimeout(350);
}
await browser.close();

if (seen.size === 0) {
  console.error("段を 1 つも控えられなかった。 dev server が動いているか、id が一覧に出ているかを確かめる");
  process.exit(1);
}

const prep = (svg) =>
  svg
    .replace(/\swidth="[\d.]+"/, "")
    .replace(/\sheight="[\d.]+"/, "")
    .replace(/<svg /, '<svg preserveAspectRatio="xMidYMid meet" ');

const shots = [...seen.entries()]
  .map(([phase, svg]) => ({ phase, svg: prep(svg) }))
  .sort((a, b) => a.phase.localeCompare(b.phase, "en", { numeric: true }));

const drawn = mergeMeasured(measuredByPhase);
const spec = buildSpec(drawn.measured, { viewBox: drawn.vb, phaseCount: shots.length });
const 寸法行 = spec.filter(([, v]) => /^[\d.]/.test(v));
if (寸法行.length === 0) {
  console.warn("  寸法を 1 件も測れなかった。 図の役割が変わっているか、画面が描き終わる前に測っている");
}

// 図の色は cdl ではなく dragon 側の規則が当てる。 markup だけ控えると色が抜ける (#1520)
const THEME_CSS_PATH = resolve(REPO, "apps/playground-spa/src/styles/cdl-theme.css");
const themeCssRaw = readFileSync(THEME_CSS_PATH, "utf8");
const nested = findNestedAtRules(themeCssRaw);
if (nested.length > 0) {
  console.warn(`⚠ 入れ子の規則を落とした ... ${nested.join(" / ")}`);
  console.warn("  変換が入れ子を扱えないので、その中の色は意匠帳に出ない");
}
const themeLight = scopeThemeCss(themeCssRaw, ".light-face");
const themeDark = scopeThemeCss(themeCssRaw, ".dark-face");
if (themeLight.count === 0) {
  console.error("色の規則を 1 件も読めなかった。 cdl-theme.css の場所か中身を確かめる");
  process.exit(1);
}

const escHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const varBlock = (obj) => Object.entries(obj).map(([k, v]) => `      ${k}: ${v};`).join("\n");
const swatches = Object.keys(light)
  .filter((k) => k.startsWith("--cdl-"))
  .slice(0, 18)
  .map((k) => [k, light[k], dark[k] || light[k]]);

const html = `<title>${escHtml(id)} の意匠帳</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@400;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
  :root {
    --ground: #f7f5f0; --panel: #fffdf9; --edge: #ded8cc; --edge-soft: #ebe6dc;
    --ink: #2a2723; --ink-mid: #6d6960; --ink-dim: #938d82;
    --accent: #c8442a; --accent-soft: #f6e3dd;
    --shadow: 0 1px 2px rgba(42, 39, 35, .06), 0 8px 24px -16px rgba(42, 39, 35, .35);
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --ground: #1b1917; --panel: #232120; --edge: #3d3935; --edge-soft: #2e2b29;
      --ink: #ece7df; --ink-mid: #a8a199; --ink-dim: #7d766e;
      --accent: #f2704c; --accent-soft: #3a2620;
      --shadow: 0 1px 2px rgba(0, 0, 0, .4), 0 8px 24px -16px rgba(0, 0, 0, .8);
    }
  }
  :root[data-theme="dark"] {
    --ground: #1b1917; --panel: #232120; --edge: #3d3935; --edge-soft: #2e2b29;
    --ink: #ece7df; --ink-mid: #a8a199; --ink-dim: #7d766e;
    --accent: #f2704c; --accent-soft: #3a2620;
    --shadow: 0 1px 2px rgba(0, 0, 0, .4), 0 8px 24px -16px rgba(0, 0, 0, .8);
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--ground); color: var(--ink); line-height: 1.75; font-size: 15px;
    font-family: "Zen Kaku Gothic New", -apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif; }
  .wrap { max-width: 1360px; margin: 0 auto; padding: 40px 28px 96px; display: flex; flex-direction: column; gap: 40px; }
  .masthead { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 20px; border-bottom: 2px solid var(--ink); padding-bottom: 18px; }
  .masthead h1 { font-family: "Zen Old Mincho", serif; font-weight: 700; font-size: clamp(30px, 4vw, 46px); margin: 0; letter-spacing: .04em; text-wrap: balance; }
  .idline { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; font-family: "JetBrains Mono", ui-monospace, monospace; font-size: 12.5px; color: var(--ink-mid); }
  .chip { border: 1px solid var(--edge); border-radius: 999px; padding: 3px 11px; background: var(--panel); }
  .chip.now { border-color: var(--accent); color: var(--accent); }
  .lede { max-width: 62ch; color: var(--ink-mid); margin: 0; }
  .face-eyebrow { font-family: "JetBrains Mono", monospace; font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-dim); display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
  .face-eyebrow b { font-family: "Zen Kaku Gothic New", sans-serif; font-weight: 700; font-size: 14px; letter-spacing: .02em; color: var(--ink); text-transform: none; }
  section { display: flex; flex-direction: column; gap: 14px; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 900px) { .pair { grid-template-columns: 1fr; } }
  .face { border: 1px solid var(--edge); border-radius: 4px; overflow: hidden; background: var(--panel); box-shadow: var(--shadow); }
  .face > figcaption { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--edge-soft); font-family: "JetBrains Mono", monospace; font-size: 11.5px; color: var(--ink-mid); }
  .stagewrap { overflow-x: auto; }
  .stage { padding: 10px; }
  .stage svg { display: block; width: 100%; height: auto; }
  .light-face { color-scheme: light;
${varBlock(light)}
  }
  .dark-face { color-scheme: dark;
${varBlock(dark)}
  }
  .light-face .stage { background: var(--cdl-stage-bg, #faf9f6); }
  .dark-face .stage { background: var(--cdl-stage-bg, #23211e); }
  .rail { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: var(--panel); border: 1px solid var(--edge); border-radius: 4px; padding: 10px 12px; box-shadow: var(--shadow); }
  button { font: inherit; font-size: 13px; color: var(--ink); background: var(--panel); border: 1px solid var(--edge); border-radius: 3px; padding: 5px 13px; cursor: pointer; transition: border-color .15s, background .15s; }
  button:hover { border-color: var(--accent); }
  button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  button[aria-pressed="true"], button.on { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); }
  .steps { display: flex; gap: 6px; margin-left: auto; }
  .steps button { font-family: "JetBrains Mono", monospace; min-width: 42px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { text-align: left; padding: 9px 12px; border-bottom: 1px solid var(--edge-soft); vertical-align: top; }
  th { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-dim); font-weight: 500; font-family: "JetBrains Mono", monospace; }
  td.num { font-family: "JetBrains Mono", monospace; font-variant-numeric: tabular-nums; white-space: nowrap; }
  td.why { color: var(--ink-mid); }
  .card { background: var(--panel); border: 1px solid var(--edge); border-radius: 4px; box-shadow: var(--shadow); overflow: hidden; }
  .card > table tr:last-child td { border-bottom: none; }
  .swatches { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px; }
  .sw { display: flex; align-items: center; gap: 8px; border: 1px solid var(--edge-soft); border-radius: 3px; padding: 5px 9px; font-family: "JetBrains Mono", monospace; font-size: 11px; color: var(--ink-mid); }
  .dot { width: 15px; height: 15px; border-radius: 2px; border: 1px solid var(--edge); flex: none; }
  .dot + .dot { margin-left: -4px; }
  details { background: var(--panel); border: 1px solid var(--edge); border-radius: 4px; box-shadow: var(--shadow); }
  summary { cursor: pointer; padding: 11px 14px; font-weight: 500; }
  summary:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
  pre { margin: 0; padding: 0 14px 14px; overflow-x: auto; font-family: "JetBrains Mono", monospace; font-size: 12.5px; line-height: 1.7; color: var(--ink-mid); }
  .stage { cursor: zoom-in; }
  .stage:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
  .hint-zoom { font-size: 11px; color: var(--ink-dim); }

  /* height は書かない = dialog の既定 fit-content が中身に合わせる。
     auto にすると上下が固定された箱として扱われ、画面いっぱいに伸びる (#1526) */
  dialog.zoom { width: 96vw; max-width: 96vw; max-height: 92vh; padding: 0; border: 1px solid var(--edge);
    border-radius: 6px; background: var(--panel); color: var(--ink); box-shadow: var(--shadow); }
  dialog.zoom::backdrop { background: rgba(20, 18, 16, .6); }
  .zoom-head { display: flex; justify-content: space-between; align-items: center; gap: 12px;
    padding: 10px 14px; border-bottom: 1px solid var(--edge-soft);
    font-family: "JetBrains Mono", monospace; font-size: 12px; color: var(--ink-mid); }
  .zoom-body { max-height: calc(92vh - 45px); overflow: auto; padding: 14px; }
  .zoom-body svg { display: block; width: 100%; height: auto; }
  .zoom-body.light-face { background: var(--cdl-stage-bg, #faf9f6); }
  .zoom-body.dark-face { background: var(--cdl-stage-bg, #23211e); }

  @media (prefers-reduced-motion: reduce) { button { transition: none; } }

  /* ── 図の色 (apps/playground-spa/src/styles/cdl-theme.css を面の下に閉じ込めたもの) ── */
${themeLight.css}
${themeDark.css}
</style>

<div class="wrap">
  <header class="masthead">
    <div>
      <h1>${escHtml(id)}</h1>
      <p class="lede">意匠を決めて docs/design/notation/${escHtml(group)}/${escHtml(id)}/ に納める。</p>
    </div>
    <div class="idline">
      <span class="chip">群 ${escHtml(group)}</span>
      <span class="chip">名 ${escHtml(id)}</span>
      <span class="chip now" id="phaseChip">段 1 / ${shots.length}</span>
    </div>
  </header>

  <section>
    <div class="face-eyebrow"><b>明暗を同じ段で並べる</b><span>片側だけ直すと必ずずれる</span></div>
    <div class="pair">
      <figure class="face light-face" style="margin:0">
        <figcaption><span>明るい側 <span class="hint-zoom">押すと大きく</span></span><span>--cdl-stage-bg ${light["--cdl-stage-bg"] ?? ""}</span></figcaption>
        <div class="stagewrap"><div class="stage" id="stageLight" role="button" tabindex="0" aria-label="明るい側の図を大きく見る"></div></div>
      </figure>
      <figure class="face dark-face" style="margin:0">
        <figcaption><span>暗い側 <span class="hint-zoom">押すと大きく</span></span><span>--cdl-stage-bg ${dark["--cdl-stage-bg"] ?? ""}</span></figcaption>
        <div class="stagewrap"><div class="stage" id="stageDark" role="button" tabindex="0" aria-label="暗い側の図を大きく見る"></div></div>
      </figure>
    </div>
  </section>

  <section>
    <div class="rail">
      <button id="play" aria-pressed="true">止める</button>
      <div class="steps" id="steps"></div>
    </div>
  </section>

  <section>
    <div class="face-eyebrow"><b>効いている寸法</b><span>描いた結果から実測した値。 そのまま note.md に載る</span></div>
    <div class="card">
      <table>
        <thead><tr><th>何の値</th><th>今の値</th><th>読み方</th></tr></thead>
        <tbody>
${spec.map(([k, v, why]) => `          <tr><td>${escHtml(k)}</td><td class="num">${escHtml(v)}</td><td class="why">${escHtml(why)}</td></tr>`).join("\n")}
        </tbody>
      </table>
    </div>
  </section>

  <section>
    <div class="face-eyebrow"><b>使っている色</b><span>左が明るい側、 右が暗い側</span></div>
    <div class="card"><div class="swatches" id="swatches"></div></div>
  </section>

  <section>
    <div class="face-eyebrow"><b>この見た目を出す記法</b><span>納める時はこのまま source.cdl.ts になる</span></div>
    <details>
      <summary>${escHtml(id)} の書き方を開く</summary>
      <pre>${escHtml(source)}</pre>
    </details>
  </section>
</div>

<dialog class="zoom" id="zoom">
  <div class="zoom-head">
    <span id="zoomTitle">明るい側</span>
    <button id="zoomClose">閉じる</button>
  </div>
  <div class="zoom-body" id="zoomBody"></div>
</dialog>

${shots.map((s, i) => `<template data-phase="${i}" data-id="${s.phase}">${s.svg}</template>`).join("\n")}

<script>
(function () {
  var HOLD = 1500;
  var templates = Array.prototype.slice.call(document.querySelectorAll("template[data-phase]"));
  var chip = document.getElementById("phaseChip");
  var stepsBox = document.getElementById("steps");
  var idx = 0, timer = null;

  var KEYS = ["data-cdl-node", "data-cdl-lane", "data-cdl-edge", "data-cdl-edge-id", "data-cdl-role", "data-cdl-row-index", "data-cdl-kind", "data-cdl-phase-id", "data-cdl-frame"];

  function keyOf(el, seen) {
    var k = el.tagName;
    var id = el.getAttribute("id");
    if (id) k += "#" + id;
    for (var i = 0; i < KEYS.length; i++) {
      var v = el.getAttribute(KEYS[i]);
      if (v !== null) k += "|" + KEYS[i] + "=" + v;
    }
    seen[k] = (seen[k] || 0) + 1;
    return k + "@" + seen[k];
  }

  function place(parent, node, at) {
    if (parent.children[at] === node) return;
    parent.insertBefore(node, parent.children[at] || null);
  }

  function appear(el) {
    if (!el.style) return;
    var keep = el.style.transition;
    el.style.opacity = "0";
    el.style.transition = "opacity 320ms ease-out";
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.style.opacity = "";
        setTimeout(function () {
          el.style.transition = keep;
          if (!el.getAttribute("style")) el.removeAttribute("style");
        }, 360);
      });
    });
  }

  // 変わった所だけ書き換える。 engine が要素に付けた transition がそのまま効く
  function morph(live, next) {
    var na = next.attributes;
    for (var i = 0; i < na.length; i++) {
      if (live.getAttribute(na[i].name) !== na[i].value) live.setAttribute(na[i].name, na[i].value);
    }
    var la = live.attributes;
    for (var j = la.length - 1; j >= 0; j--) {
      if (!next.hasAttribute(la[j].name)) live.removeAttribute(la[j].name);
    }
    if (next.children.length === 0) {
      while (live.children.length) live.removeChild(live.lastElementChild);
      if (live.textContent !== next.textContent) live.textContent = next.textContent;
      return;
    }
    var seenL = {}, seenN = {}, byKey = {};
    var liveKids = Array.prototype.slice.call(live.children);
    for (var a = 0; a < liveKids.length; a++) byKey[keyOf(liveKids[a], seenL)] = liveKids[a];
    var nextKids = Array.prototype.slice.call(next.children);
    for (var b = 0; b < nextKids.length; b++) {
      var k = keyOf(nextKids[b], seenN);
      var cur = byKey[k];
      if (cur) {
        morph(cur, nextKids[b]);
        delete byKey[k];
        place(live, cur, b);
      } else {
        var add = nextKids[b].cloneNode(true);
        place(live, add, b);
        appear(add);
      }
    }
    for (var leftover in byKey) if (byKey[leftover].parentNode === live) live.removeChild(byKey[leftover]);
  }

  // 面ごとに id を分ける。 段をまたいでも同じ接頭辞なので、書き換えの対象にならない
  function uniqueIds(root, tag) {
    var withId = root.querySelectorAll("[id]");
    var map = {};
    for (var i = 0; i < withId.length; i++) {
      var old = withId[i].getAttribute("id");
      map[old] = tag + "-" + old;
      withId[i].setAttribute("id", map[old]);
    }
    var all = root.querySelectorAll("*");
    for (var j = 0; j < all.length; j++) {
      var attrs = all[j].attributes;
      for (var k = 0; k < attrs.length; k++) {
        var v = attrs[k].value;
        if (v.indexOf("url(#") >= 0) {
          attrs[k].value = v.replace(/url\\(#([^)]+)\\)/g, function (_, name) { return "url(#" + (map[name] || name) + ")"; });
        } else if (v.charAt(0) === "#" && map[v.slice(1)]) {
          attrs[k].value = "#" + map[v.slice(1)];
        }
      }
    }
  }

  function makeFace(host, tag) {
    var frames = templates.map(function (t) {
      var holder = document.createElement("div");
      holder.appendChild(t.content.cloneNode(true));
      uniqueIds(holder, tag);
      return holder.querySelector("svg");
    });
    host.appendChild(frames[0].cloneNode(true));
    return { svg: host.querySelector("svg"), frames: frames };
  }

  var faces = [
    makeFace(document.getElementById("stageLight"), "l"),
    makeFace(document.getElementById("stageDark"), "d"),
  ];

  // 覆い ... 押した側の図をもう 1 枚組んで、書き換え先に加える。
  // 加えないと開いている間だけ止まって見える
  var dlg = document.getElementById("zoom");
  var zoomBody = document.getElementById("zoomBody");
  var zoomTitle = document.getElementById("zoomTitle");
  var zoomFace = null;
  var zoomKind = null;

  function zoomLabel() {
    return (zoomKind === "light" ? "明るい側" : "暗い側") + " ・ 段 " + (idx + 1) + " / " + templates.length;
  }

  function openZoom(kind) {
    if (zoomFace) return;
    zoomKind = kind;
    zoomBody.className = "zoom-body " + (kind === "light" ? "light-face" : "dark-face");
    zoomTitle.textContent = zoomLabel();
    zoomFace = makeFace(zoomBody, "z" + kind);
    morph(zoomFace.svg, zoomFace.frames[idx]);
    faces.push(zoomFace);
    dlg.showModal();
  }

  function shutZoom() {
    if (!zoomFace) return;
    faces = faces.filter(function (f) { return f !== zoomFace; });
    zoomFace = null;
    zoomKind = null;
    zoomBody.replaceChildren();
  }

  dlg.addEventListener("close", shutZoom);
  document.getElementById("zoomClose").addEventListener("click", function () { dlg.close(); });

  [["stageLight", "light"], ["stageDark", "dark"]].forEach(function (pair) {
    var el = document.getElementById(pair[0]);
    el.addEventListener("click", function () { openZoom(pair[1]); });
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openZoom(pair[1]); }
    });
  });

  function show(n) {
    idx = (n + templates.length) % templates.length;
    faces.forEach(function (f) { morph(f.svg, f.frames[idx]); });
    chip.textContent = "段 " + (idx + 1) + " / " + templates.length;
    if (zoomFace) zoomTitle.textContent = zoomLabel();
    var bs = stepsBox.querySelectorAll("button");
    for (var i = 0; i < bs.length; i++) bs[i].className = i === idx ? "on" : "";
  }

  templates.forEach(function (t, i) {
    var b = document.createElement("button");
    b.textContent = t.getAttribute("data-id");
    b.addEventListener("click", function () { stop(); show(i); });
    stepsBox.appendChild(b);
  });

  var playBtn = document.getElementById("play");
  function start() {
    if (timer) return;
    timer = setInterval(function () { show(idx + 1); }, HOLD);
    playBtn.setAttribute("aria-pressed", "true");
    playBtn.textContent = "止める";
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    playBtn.setAttribute("aria-pressed", "false");
    playBtn.textContent = "再生";
  }
  playBtn.addEventListener("click", function () { if (timer) stop(); else start(); });

  var pairs = ${JSON.stringify(swatches)};
  var sw = document.getElementById("swatches");
  pairs.forEach(function (p) {
    var el = document.createElement("span");
    el.className = "sw";
    var a = document.createElement("i"); a.className = "dot"; a.style.background = p[1];
    var b = document.createElement("i"); b.className = "dot"; b.style.background = p[2];
    el.appendChild(a); el.appendChild(b);
    el.appendChild(document.createTextNode(p[0].replace("--cdl-", "")));
    sw.appendChild(el);
  });

  show(0);
  if (!window.matchMedia || !window.matchMedia("(prefers-reduced-motion: reduce)").matches) start();
  else stop();
})();
</script>
`;

shots.forEach((s, i) => writeFileSync(join(OUT, `phase-${i}-${s.phase}.svg`), s.svg));
writeFileSync(
  join(OUT, "meta.json"),
  JSON.stringify({ id, group, phases: shots.map((s, i) => ({ index: i, phase: s.phase })), spec, light, dark }, null, 2),
);
writeFileSync(join(OUT, "look.html"), html);
writeFileSync(join(OUT, "source.cdl.ts"), `${source}\n`);

console.log(`吸い出した ... ${OUT}`);
console.log(`  群 ${group} / 段 ${shots.length} / 色変数 ${Object.keys(light).length}`);
console.log(`  artifact に渡す file = ${join(OUT, "look.html")}`);
if (!existsSync(join(OUT, "look.html"))) process.exit(1);
