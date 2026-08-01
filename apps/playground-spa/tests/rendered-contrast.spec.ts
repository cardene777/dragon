import { test, expect, type Page } from "@playwright/test";
import { PNG } from "pngjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * edge label の **描画結果** の対比を実ブラウザで測る (#977)。
 *
 * `packages/dragon/test/theme-label-contrast.test.ts` (cardene777/cdl#388) は **宣言された配色**
 * を見る。 実際に画面に出る対比は半透明の重なり / 祖先の `opacity` / host 側の背景 / `@media` /
 * 状態依存 selector に依存し、 それらは実ブラウザでしか決まらない。
 *
 * 当初 jsdom に代表 DOM を組み立てて再現しようとしたが、 review で 6 round 連続して「代表 DOM と
 * 実ページの差」 を指摘され続けた。 合成 DOM は実ページと等価にならない。
 *
 * ## 測り方 = 画素を読む
 *
 * 計算で合成しない。 **文字を隠した画面と出した画面を撮って画素を比べる**。
 *
 *   背景色 = 文字を隠した画面の、 その画素の色
 *   文字色 = 文字を出した画面の、 **最も背景から離れた** 画素の色
 *
 * 「最も離れた画素」 を採るのは、 縁の画素が anti-alias で背景と混ざるため。 字の芯にあたる画素が
 * その文字の実効色になる。
 *
 * この形なら半透明の重なりも祖先の opacity も host の背景も、 合成の順序を自分で組み立てずに
 * 実際の値が入る。
 */

const BASE = process.env.PROD_BASE_URL ?? "http://localhost:4323";

/** `cdl-theme.css` が定義する主題。 */
const THEMES = ["blueprint", "circuit", "handdrawn", "isometric", "neumorphism", "pinboard"] as const;
const MODES = ["light", "dark"] as const;

/**
 * 測る見本。 2 件で性質を分ける。
 *
 *   `pattern-passthrough` = main + sub の 2 行を持つ (sub 行の対比を測るため)
 *   `oauth-flow` = label 付きの edge が 8 本 (tone の種類と本数を稼ぐため)
 *
 * 1 件だけだと label が 2 個しか無く、 主題の配色のごく一部しか通らない。
 */
const TARGETS = [
  // main 22px + sub 19px の 2 行。 sub 行の対比を測る唯一の経路なので件数を固定する。
  { slug: "patterns", id: "pattern-passthrough", expectedLabels: 2, expectedDeclaredPx: [22, 19] },
  { slug: "cookbook", id: "oauth-flow", expectedLabels: 8, expectedDeclaredPx: [22] },
] as const;

/**
 * 暗色の宣言を持たない主題。 明暗で同じ結果になるのが正しい。
 *
 * `cdl-theme.css` の `html.dark [data-cdl-theme="<name>"]` の数を数えた実測
 * (blueprint 23 / neumorphism 21 / isometric 6 / circuit 0 / handdrawn 0 / pinboard 0)。
 * 宣言が増えたらこの一覧も動かす。
 */
const NO_DARK_VARIANT = new Set(["circuit", "handdrawn", "pinboard"]);

/** WCAG 2.x の相対輝度。 */
function luminance([r, g, b]: [number, number, number]): number {
  const ch = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** WCAG AA の閾値。 large text = 24px 以上 or 太字 18.66px 以上。 */
const requiredRatio = (px: number, weight: number): number =>
  px >= 24 || (weight >= 700 && px >= 18.66) ? 3.0 : 4.5;

type Box = { x: number; y: number; width: number; height: number };
type Label = { key: string; box: Box; px: number; weight: number; text: string; declaredPx: number };

/**
 * 主題と明暗を当てた状態で見本を開く。
 *
 * 主題は **属性を直接立てる**。 `?theme=` の query は現状 app 側で反映されず (`useTheme` は
 * どこからも import されていない)、 `<html>` も `<svg>` も既定の `blueprint` のままになる。
 * `cdl-theme.css` の selector は `[data-cdl-theme="x"] [data-cdl-role="edge-label"]` の形なので、
 * 属性さえ立てば主題の配色は実際に当たる。
 *
 * app の UI 経路に依存させないのは、 本 test が見たいのが「主題の配色が実際に描かれた時の
 * 対比」 であって、 主題を選ぶ UI ではないため。
 */
async function open(page: Page, target: { slug: string; id: string }, theme: string, mode: string): Promise<void> {
  await page.goto(`${BASE}/catalog/${target.slug}`);
  await page.waitForSelector(".catalog-list-item", { timeout: 20000 });
  await page.locator(".catalog-list-item").filter({ hasText: target.id }).first().click();
  await page.waitForSelector(`[data-cdl-diagram="${target.id}"]`, { timeout: 20000 });
  await page.evaluate(([t, m]) => {
    document.documentElement.classList.toggle("dark", m === "dark");
    document.documentElement.setAttribute("data-cdl-theme", t);
    document.querySelectorAll("[data-cdl-diagram] svg").forEach((el) => {
      el.setAttribute("data-cdl-theme", t);
    });
  }, [theme, mode] as const);
  // 当たっていないと 12 通りが全て同じ画面になる。
  await page.waitForFunction(
    (t) => {
      const svg = document.querySelector("[data-cdl-diagram] svg");
      return svg?.getAttribute("data-cdl-theme") === t;
    },
    theme,
    { timeout: 20000 },
  );
  await page.evaluate(() => document.fonts.ready);
  // 主題の切替に transition が掛かるので落ち着くまで待つ。
  await page.waitForTimeout(600);
}

/** 描かれている edge label の位置と文字仕様を集める。 */
async function collectLabels(page: Page, id: string): Promise<Label[]> {
  return page.evaluate((id) => {
    const out: Array<{ key: string; box: Box; px: number; declaredPx: number; weight: number; text: string }> = [];
    const els = document.querySelectorAll(`[data-cdl-diagram="${id}"] [data-cdl-role="edge-label"]`);
    els.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const cs = getComputedStyle(el);
      // `getComputedStyle().fontSize` は SVG の **user 単位**。 `viewBox` で縮小されるので
      // 画面上の大きさとは別 (実測 = 宣言 22px が倍率 0.29-0.38 で 6.4-8.5 CSS px)。
      // WCAG の large text は画面上の大きさで決まるので、 倍率を掛けてから閾値を決める。
      const declared = parseFloat(cs.fontSize);
      const ctm = (el as SVGGraphicsElement).getScreenCTM();
      const scaleY = ctm === null ? 1 : Math.hypot(ctm.c, ctm.d);
      out.push({
        key: `${el.closest("[data-cdl-edge-label-for]")?.getAttribute("data-cdl-edge-label-for") ?? "?"}#${i}`,
        box: { x: r.x, y: r.y, width: r.width, height: r.height },
        px: declared * scaleY,
        declaredPx: declared,
        weight: Number.parseInt(cs.fontWeight, 10) || 400,
        text: (el.textContent ?? "").slice(0, 20),
      });
    });
    return out;
  }, id);
}

/**
 * 文字を隠す / 戻す。 隠した画面が背景になる。
 *
 * `index` を渡すとその 1 つだけを隠す。 全部隠すと、 重なった別 label が「背景」 に含まれたり
 * 含まれなかったりして、 差分を文字と誤認する経路が残る。
 */
async function setLabelsHidden(page: Page, id: string, hidden: boolean, index?: number): Promise<void> {
  await page.evaluate(([id, h, only]) => {
    document
      .querySelectorAll(`[data-cdl-diagram="${id}"] [data-cdl-role="edge-label"]`)
      .forEach((el, i) => {
        if (only !== undefined && i !== only) return;
        (el as SVGElement).style.visibility = h ? "hidden" : "";
      });
  }, [id, hidden, index] as const);
}

/** 画素を読む。 `clip` の範囲を撮って RGBA の配列で返す。 */
async function shoot(page: Page, clip: Box): Promise<PNG> {
  // `floor(x)` と `ceil(width)` を組み合わせると右端 / 下端が欠ける (`x=0.9, w=10.9` で末尾
  // 0.8px が落ちる)。 端を先に丸めてから幅を出す。
  const left = Math.floor(clip.x), top = Math.floor(clip.y);
  const right = Math.ceil(clip.x + clip.width), bottom = Math.ceil(clip.y + clip.height);
  const buf = await page.screenshot({
    clip: { x: left, y: top, width: right - left, height: bottom - top },
  });
  return PNG.sync.read(buf);
}

const at = (img: PNG, i: number): [number, number, number] =>
  [img.data[i], img.data[i + 1], img.data[i + 2]];

type Measured =
  | { kind: "ok"; fg: [number, number, number]; bg: [number, number, number]; ratio: number }
  | { kind: "invisible" }
  | { kind: "unmeasurable"; reason: string };

/**
 * 文字の芯の色と、 その位置の背景色から対比を出す。
 *
 * ## 芯の採り方 = 最も濃く塗られた画素
 *
 * 変化量が最大の画素を採る。 そこが字が最も濃く乗っている場所で、 **指定された文字色に最も
 * 近い**。
 *
 * 「変化量の大きい画素群の中の最悪値」 を採る形は採らない。 見本の label は画面上 6.4-8.5px
 * しかなく、 **ほぼ全ての画素が anti-alias で背景と混ざっている**。 最悪値を採ると混色を
 * 測ることになり、 実測で 12.37:1 の組が 2.81:1 と出た (指定色は同じなのに)。
 *
 * WCAG の対比は指定された色で判定する。 anti-alias は rasterize の副産物で、 配色の問題では
 * ない。 1 つの `<text>` の中で字ごとに色が変わることは無いので、 最も濃い画素 1 つでその
 * label の文字色を代表できる。
 *
 * ただし「最も濃い 1 画素」 だけを見ると「十分な対比の画素が 1 つある」 ことしか言えない。
 * 背景が場所によって違えば (格子 / 模様 / 半透明の重なり)、 別の字は基準を割っているかも
 * しれない。 そこで **芯の候補それぞれを、 その画素の背景と比べて最悪値を採る**。
 *
 * 3 倍で撮っているので芯の候補は実際に字で覆われた画素であり、 最悪値を採っても anti-alias の
 * 混色を拾わない (等倍で同じことをすると 12.37:1 の組が 2.81:1 と出た)。
 *
 * ## 背景が一様でない場合
 *
 * 芯の候補の背景色がばらついていると (gradient / 模様 / 半透明の重なり)、 どの背景と比べる
 * べきかが決まらない。 判定せずに `unmeasurable` を返す = 黙って通さない。
 */
function measure(visible: PNG, hidden: PNG): Measured {
  const n = Math.min(visible.data.length, hidden.data.length);
  const diffs: Array<{ i: number; d: number }> = [];
  let maxDiff = 0;
  for (let i = 0; i < n; i += 4) {
    const d = Math.abs(luminance(at(visible, i)) - luminance(at(hidden, i)));
    if (d > 0.001) diffs.push({ i, d });
    if (d > maxDiff) maxDiff = d;
  }
  // 1 画素も変わっていなければ文字が見えていない。 対比 1:1 とすると「真っ黒な違反」 になる
  // ので分ける。
  if (maxDiff <= 0.001) return { kind: "invisible" };

  const core = diffs.filter((x) => x.d >= maxDiff * 0.97);
  if (core.length === 0) return { kind: "unmeasurable", reason: "字の芯を特定できない" };

  let worst: Measured | null = null;
  let worstRatio = Infinity;
  for (const { i } of core) {
    const fg = at(visible, i);
    const bg = at(hidden, i);
    const r = contrast(fg, bg);
    if (r < worstRatio) { worstRatio = r; worst = { kind: "ok", fg, bg, ratio: r }; }
  }
  return worst ?? { kind: "unmeasurable", reason: "候補なし" };
}

/** 1 つの label の判定。 変異試験も本番も同じ経路を通す。 */
function judge(label: Label, m: Measured): string | null {
  const need = requiredRatio(label.px, label.weight);
  const where = `${label.key} ("${label.text}") 画面 ${label.px.toFixed(1)}px (宣言 ${label.declaredPx}px) / ${label.weight}`;
  if (m.kind === "invisible") return `${where} の文字が背景と同じ色で描かれている`;
  if (m.kind === "unmeasurable") return `${where} を測れなかった (${m.reason})`;
  if (m.ratio < need) {
    return `${where} は ${need}:1 が要るが ${m.ratio.toFixed(2)}:1 ` +
      `(文字 rgb(${m.fg.join(",")}) / 背景 rgb(${m.bg.join(",")}))`;
  }
  return null;
}

/**
 * 画素を細かく撮る。
 *
 * label の文字は画面上 6.4-9.3 CSS px しかなく、 等倍で撮ると **どの画素も完全には字で覆われて
 * いない** (実測 = 指定 rgb(134,86,49) が rgb(145,104,72) として出た)。 その値で判定すると
 * anti-alias の混色を測ることになり、 WCAG が見る「指定された色」 より厳しくなる。
 *
 * 3 倍で撮ると 7 CSS px の字が 21 device px になり、 字の芯に完全に覆われた画素が現れる。
 * 閾値の判定に使う大きさは CSS px のままなので、 large text の判定は変わらない。
 */
test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });

test.describe("edge label の描画対比 (#977)", () => {
  test.describe.configure({ timeout: 120000 });

  for (const theme of THEMES) {
    for (const mode of MODES) {
      test(`${theme} / ${mode} の edge label が WCAG AA を満たす`, async ({ page }) => {
        const failures: string[] = [];
        let measured = 0;
        let worst = Infinity;

        for (const target of TARGETS) {
          await open(page, target, theme, mode);
          const labels = await collectLabels(page, target.id);
          // **target ごとに** 件数を固定する。 合計だけだと、 `pattern-passthrough` の sub が
          // 消えて `oauth-flow` が 1 件増える形で合計が変わらず、 sub 行の検査を失う。
          expect(labels.length, `${target.id} の edge label 数`).toBe(target.expectedLabels);
          expect(
            [...new Set(labels.map((l) => l.declaredPx))].sort((a, b) => b - a),
            `${target.id} の宣言された大きさ`,
          ).toEqual([...target.expectedDeclaredPx]);

          for (let i = 0; i < labels.length; i++) {
            const l = labels[i];
            // その label だけを隠す。 撮る範囲も同じなので、 差分は必ずその文字による。
            await setLabelsHidden(page, target.id, true, i);
            const bg = await shoot(page, l.box);
            // 同じ状態で 2 度撮る。 差があれば animation 等で画面が動いており、 差分を文字と
            // 見なせない。
            //
            // **この分岐は現状の見本では通らない** (静止画なので 2 度撮っても必ず同じ)。
            // 変異試験でも検知できない = 動く見本を対象に加えた時に効く防御として残す。
            const bg2 = await shoot(page, l.box);
            await setLabelsHidden(page, target.id, false, i);
            const fg = await shoot(page, l.box);

            const drift = measure(bg2, bg);
            if (drift.kind === "ok") {
              failures.push(`${target.id}/${l.key} は隠した状態でも画面が動いており測れない`);
              continue;
            }
            const m = measure(fg, bg);
            if (m.kind === "ok") { measured++; worst = Math.min(worst, m.ratio); }
            const f = judge(l, m);
            if (f !== null) failures.push(`${target.id}/${f}`);
          }
        }

        // 1 件も測れていなければ、 0 件の failures は「満たした」 ことを意味しない。
        expect(measured, `${theme}/${mode} で実際に測れた label 数`).toBe(
          TARGETS.reduce((n, t) => n + t.expectedLabels, 0),
        );
        expect(failures, `${theme}/${mode} 最小の対比 ${worst.toFixed(2)}:1`).toEqual([]);
      });
    }
  }

  test("暗色の宣言を持たない主題の一覧が実際と合っている", () => {
    // 一覧がずれると、 暗色を持つ主題を「持たない」 として飛ばして検査しなくなる。
    // `cdl-theme.css` を読んで数える。
    const css = readFileSync(
      fileURLToPath(new URL("../src/styles/cdl-theme.css", import.meta.url)), "utf8",
    );
    const actual = THEMES.filter(
      (t) => !new RegExp(`html\\.dark \\[data-cdl-theme="${t}"\\]`).test(css),
    );
    expect([...actual].sort()).toEqual([...NO_DARK_VARIANT].sort());
  });

  test("judge の境界と種別 (単体)", () => {
    // `judge` は本番も変異試験も通る唯一の判定。 境界と種別を直接固定する。
    const label = (px: number, weight: number): Label => ({
      key: "k", box: { x: 0, y: 0, width: 1, height: 1 }, px, weight, text: "t", declaredPx: 22,
    });
    const ok = (ratio: number) => ({ kind: "ok" as const, fg: [0, 0, 0] as [number, number, number], bg: [255, 255, 255] as [number, number, number], ratio });

    // 画面上 7px の通常文字 = 4.5:1。 4.499 は落とし、 4.5 は通す。
    expect(judge(label(7, 700), ok(4.499))).not.toBeNull();
    expect(judge(label(7, 700), ok(4.5))).toBeNull();
    // 画面上 19px の太字 = large text の 3:1。 大きさの判定が効いていることを固定する。
    expect(judge(label(19, 700), ok(3.0))).toBeNull();
    expect(judge(label(19, 700), ok(2.999))).not.toBeNull();
    // 種別が判定に出る。
    expect(judge(label(7, 700), { kind: "invisible" })).toContain("同じ色");
    expect(judge(label(7, 700), { kind: "unmeasurable", reason: "理由" })).toContain("測れなかった");
  });

  test("画面上の大きさで閾値を決めている (変異試験)", async ({ page }) => {
    // **`#391` 以前の色を戻すと落ちること**。 この色は実測 3.7:1 前後で、
    //
    //   画面上の大きさ (7-9px) で判定 → 通常文字の 4.5:1 が要る → 落ちる
    //   宣言の大きさ (22px) で判定    → large text の 3:1 で足りる → 通る
    //
    // つまり `declared * scaleY` を `declared` に戻す変異を、 この色でだけ検知できる。
    // 一括で対比を落とす変異 (下の test) は 3:1 も割るので、 両者を区別しない。
    const target = TARGETS[0];
    await open(page, target, "neumorphism", "light");
    await page.addStyleTag({
      content: `html body [data-cdl-theme] [data-cdl-role="edge-label"] { fill: #a66a3d !important; }`,
    });
    await page.waitForTimeout(300);

    const labels = await collectLabels(page, target.id);
    const failures: string[] = [];
    for (let i = 0; i < labels.length; i++) {
      const l = labels[i];
      await setLabelsHidden(page, target.id, true, i);
      const bg = await shoot(page, l.box);
      await setLabelsHidden(page, target.id, false, i);
      const f = judge(l, measure(await shoot(page, l.box), bg));
      if (f !== null) failures.push(f);
    }
    // 3:1 は超えるが 4.5:1 は割る、 という中間の色であることも同時に固定する。
    expect(failures.length, "旧色が検知されない = 画面上の大きさを見ていない").toBeGreaterThan(0);
    expect(failures.some((f) => /4\.5:1 が要るが 3\./.test(f)), `検知の内容: ${failures.join(" | ")}`).toBe(true);
  });

  test("対比を落とすと検知する (変異試験)", async ({ page }) => {
    // 本 test の存在理由。 実際に閾値を割る配色を当てて、 検知できることを確かめる。
    const target = TARGETS[0];
    await open(page, target, "blueprint", "light");
    const labels = await collectLabels(page, target.id);
    expect(labels.length).toBeGreaterThan(0);

    // 背景に近い灰色を当てる。 pill の背景は白系なので対比が 1.5:1 前後まで落ちる。
    //
    // 主題の CSS も `!important` を使うので、 **主題より詳細度の高い selector** で当てる
    // (`[data-cdl-role="edge-label"]` だけだと主題側が勝って何も変わらない)。
    await page.addStyleTag({
      content: `html body [data-cdl-theme] [data-cdl-role="edge-label"] { fill: #e8e8e8 !important; }`,
    });
    await page.waitForTimeout(300);

    const fresh = await collectLabels(page, target.id);
    await setLabelsHidden(page, target.id, true);
    const bgShots = await Promise.all(fresh.map((l) => shoot(page, l.box)));
    await setLabelsHidden(page, target.id, false);
    const fgShots = await Promise.all(fresh.map((l) => shoot(page, l.box)));

    // **本番と同じ `judge` を通す**。 別経路で `Math.min(ratios) < 3` を確かめる形だと、
    // 本番側の判定を壊しても変異試験が通り続ける。
    const failures: string[] = [];
    let ok = 0;
    for (let i = 0; i < fresh.length; i++) {
      const m = measure(fgShots[i], bgShots[i]);
      if (m.kind === "ok") ok++;
      const f = judge(fresh[i], m);
      if (f !== null) failures.push(f);
    }
    expect(ok, "測れた label がある").toBeGreaterThan(0);
    expect(failures.length, "対比を落としたのに検知しない").toBeGreaterThan(0);
    // 「測れなかった」 ではなく「閾値を割った」 として検知していること。
    expect(failures.some((f) => /:1 が要るが/.test(f)), `検知の内容: ${failures.join(" | ")}`).toBe(true);
  });
});
