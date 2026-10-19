import { test, expect, type Locator, type Page } from "@playwright/test";
import { PNG } from "pngjs";
import {
  contrast,
  requiredRatio,
  shoot,
  measure,
  type Box,
  type Measured,
} from "./helpers/pixel-contrast";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PRESET_TYPES, THEMES, type DslTheme } from "@cardenelabs/dragon";
import { 六色の記法 } from "./box-and-edge-figure";
import { 一覧の行 } from "./catalog-item-pick";
import { sourceYaml__textDslSwimlaneStages } from "../src/topics/catalog/text-dsl.cdl";
import {
  sourceYaml__presetDeliveryClasses,
  sourceYaml__presetDeliveryRelations,
} from "../src/topics/catalog/presets.cdl";
import {
  sourceYaml__branchParcelsBar,
  sourceYaml__deliveryOfficeTree,
  sourceYaml__deliveryResultStacked,
  sourceYaml__measureEffortQuadrant,
  sourceYaml__monthlyDeliveriesLine,
  sourceYaml__onTimeRateSlope,
  sourceYaml__onTimeShareGauge,
  sourceYaml__orderToDeliveryFunnel,
  sourceYaml__parcelSizeWaffle,
  sourceYaml__parcelStatusPie,
  sourceYaml__redeliveryIdeasMind,
  sourceYaml__shipperFeelingJourney,
  sourceYaml__sortingShelfGantt,
} from "../src/topics/catalog/charts.cdl";
import {
  THEME_TONES,
  readFixedThemeChartSeries,
  readFixedThemeLead,
  readFixedThemeOutline,
  readFixedThemeToneSeries,
  readThemeNotes,
  themeGanttSeriesColors,
  type ThemeValues,
} from "./helpers/theme-notes";
import {
  effectivePaint,
  over,
  parseColor,
  readPaints,
  type Rgb,
} from "./helpers/effective-color";
import {
  FIXED_THEME_DEVICE_SCALE_FACTOR,
  checkBoxAndLineContrast,
  checkFixedThemeAcrossTypes,
  checkTextContrast,
  color,
  colorKey,
  fixedThemes,
  openEditorTheme,
  samplesByType,
  stopDiagram,
} from "./helpers/fixed-theme-checks";
import { 固定色を取り出す } from "./helpers/fixed-colors";
import { COLOR_ONLY_THEMES } from "./helpers/theme-role-table-final";
import { checkEdgeLabelContrast, SINGLE_SERIES_SOURCE } from "./helpers/label-tone-checks";

/**
 * edge label の **描画結果** の対比を実ブラウザで測る (#977)。
 *
 * `packages/dragon/test/edge-label-contrast.test.ts` (cardene777/cdl#388) は **宣言された配色**
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

const MODES = ["light", "dark"] as const;

const 図録の図表 = [
  sourceYaml__branchParcelsBar,
  sourceYaml__monthlyDeliveriesLine,
  sourceYaml__parcelStatusPie,
  sourceYaml__sortingShelfGantt,
  sourceYaml__shipperFeelingJourney,
  sourceYaml__orderToDeliveryFunnel,
  sourceYaml__measureEffortQuadrant,
  sourceYaml__onTimeRateSlope,
  sourceYaml__onTimeShareGauge,
  sourceYaml__parcelSizeWaffle,
  sourceYaml__deliveryResultStacked,
  sourceYaml__deliveryOfficeTree,
  sourceYaml__redeliveryIdeasMind,
] as const;

const 図表の意匠 = ["blueprint", "letterpress", "catalog", "terminal", "sketch", "neon", "relief"] as const;

test.describe("図表の題と放射の葉の描画対比 (#2854)", () => {
  for (const theme of 図表の意匠) {
    test(`${theme}: 13 図の題と放射の葉が 4.5:1 を保つ`, async ({ page }) => {
      for (const source of 図録の図表) {
        await openEditorTheme(page, source, theme, false);
        const stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
        const title = stage.locator('[data-cdl-role="figure-title"]');
        await expect(title).toHaveCount(1);
        const titlePaint = await title.evaluate((element) => {
          const root = element.closest<SVGSVGElement>('svg[data-cdl-stage]');
          if (!root) throw new Error("図の題の舞台を読めない");
          const box = element.getBoundingClientRect();
          const x = box.left + box.width / 2;
          const y = box.top + box.height / 2;
          // 放射と木の題は node-body の外、札の上にある。題だけを一時的に隠し、
          // その画素で実際に後ろへ重なる塗りを取る。直下 body という DOM 前提を置かない。
          const before = (element as SVGElement).style.visibility;
          (element as SVGElement).style.visibility = "hidden";
          const painted = document.elementsFromPoint(x, y).find((candidate) => {
            if (!(candidate instanceof SVGGeometryElement)) return false;
            if (candidate === element || candidate.closest('[data-cdl-role="figure-title"]')) return false;
            const tag = candidate.tagName.toLowerCase();
            if (!["rect", "path", "circle", "ellipse", "polygon"].includes(tag)) return false;
            const style = getComputedStyle(candidate);
            return style.display !== "none" && style.visibility !== "hidden" &&
              style.fill !== "none" && Number(style.fillOpacity || 1) > 0 && Number(style.opacity || 1) > 0;
          });
          (element as SVGElement).style.visibility = before;
          return {
            text: getComputedStyle(element).fill,
            background: painted ? getComputedStyle(painted).fill : getComputedStyle(root).backgroundColor,
            label: element.textContent ?? "?",
          };
        });
        expect(
          contrast(color(titlePaint.text), color(titlePaint.background)),
          `${theme}/${titlePaint.label}: 題 ${titlePaint.text} / 札 ${titlePaint.background}`,
        ).toBeGreaterThanOrEqual(4.5);
      }

      await openEditorTheme(page, sourceYaml__redeliveryIdeasMind, theme, false);
      const stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
      await expect(stage.locator('[data-cdl-role="mind-leaf-title"]').first()).toBeVisible({ timeout: 10_000 });
      const leaves = await stage.evaluate((element) => {
        const body = element.querySelector<SVGElement>(
          '[data-cdl-kind="mind-map"] [data-cdl-role="node-body"]',
        );
        if (!body) throw new Error("放射の地を読めない");
        const background = getComputedStyle(body).fill;
        return [...element.querySelectorAll<SVGTextElement>('[data-cdl-role="mind-leaf-title"]')].map(
          (leaf) => ({ text: leaf.textContent ?? "?", fill: getComputedStyle(leaf).fill, background }),
        );
      });
      expect(leaves.length, `${theme}: 放射の葉を測れていない`).toBeGreaterThan(0);
      for (const leaf of leaves) {
        expect(
          contrast(color(leaf.fill), color(leaf.background)),
          `${theme}/${leaf.text}: 葉 ${leaf.fill} / 地 ${leaf.background}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});

const 段の箱の対比見本 = sourceYaml__textDslSwimlaneStages.replace(/\nanimation:[\s\S]*$/, "");

type StageTextContrastResult = { measured: number; failures: string[] };

/** 段の見出しと札の右の字を、実際の fill と祖先までの opacity で面へ合成して測る。 */
async function checkStageTextContrast(
  page: Page,
  theme: DslTheme,
  mode: string,
): Promise<StageTextContrastResult> {
  await stopDiagram(page);
  const stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
  const ground = color(await stage.evaluate((element) => getComputedStyle(element).backgroundColor));
  const columns = await stage.locator('[data-cdl-role="stage-column"]').evaluateAll(readPaints);
  const cards = await stage.locator('[data-cdl-kind="card"] [data-cdl-role="node-body"]').evaluateAll(readPaints);
  const failures: string[] = [];
  if (columns.length !== 4) failures.push(`${theme}/${mode}: 段階の列が ${columns.length} 件 (4 件が要る)`);
  if (cards.length !== 8) failures.push(`${theme}/${mode}: 札の面が ${cards.length} 件 (8 件が要る)`);
  const column = columns[0];
  const card = cards[0];
  if (!column || !card) return { measured: 0, failures };
  const columnFace = effectivePaint(column, ground).face;
  const cardFace = effectivePaint(card, columnFace).face;

  let measured = 0;
  for (const [role, expected, background] of [
    ["stage-name", 4, columnFace],
    ["stage-number", 4, columnFace],
    ["stage-note", 8, cardFace],
  ] as const) {
    const texts = await stage.locator(`[data-cdl-role="${role}"]`).evaluateAll(readPaints);
    if (texts.length !== expected) {
      failures.push(`${theme}/${mode}: ${role} が ${texts.length} 件 (${expected} 件が要る)`);
    }
    for (const [index, paint] of texts.entries()) {
      if (!paint.rendered) {
        failures.push(`${theme}/${mode}: ${role} ${index + 1} が描かれていない`);
        continue;
      }
      const foreground = effectivePaint({ ...paint, stroke: "none", strokeOpacity: 0 }, background).face;
      const ratio = contrast(foreground, background);
      measured += 1;
      if (ratio < 4.5) {
        failures.push(`${theme}/${mode}: ${role} ${index + 1} と面 ${ratio.toFixed(2)}:1 < 4.5:1`);
      }
    }
  }
  return { measured, failures };
}

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
  /*
   * **`oauth-flow` から差し替えた** (#1488)。
   *
   * `oauth-flow` は順序図で、`#1466` から 1 枚の板として描かれる。 言づては矢印ではなく板の
   * 中の行 (`sequence-label`) になったので、矢印の札は 1 つも出ない (実測 = 12 秒見て 0 件)。
   *
   * 矢印の札を 5 件持つ図に替える。 板の中の行の対比は別の役割なので、この検査の対象外
   * (`#1488` に残した)。
   */
  { slug: "patterns", id: "pattern-fan-in", expectedLabels: 5, expectedDeclaredPx: [22] },
] as const;

type Label = { key: string; box: Box; px: number; weight: number; text: string; declaredPx: number };

/**
 * 明暗を当てた状態で見本を開く。
 *
 * 明暗は `<html>` の class で決まる。 図の色は `cdl-theme.css` が `var(--d-*)` で参照し、
 * その変数を `globals.css` が `html.dark` で差し替えるので、 class を切り替えるだけで
 * 図まで追随する。
 *
 * app の切替 UI を経由しないのは、 本 test が見たいのが「配色が実際に描かれた時の対比」
 * であって、 切替の操作ではないため。
 */
async function open(page: Page, target: { slug: string; id: string }, mode: string): Promise<void> {
  await page.goto(`catalog/${target.slug}`);
  await page.waitForSelector(".catalog-list-item", { timeout: 20000 });
  await 一覧の行(page, target.id).click();
  await page.waitForSelector(`[data-cdl-diagram="${target.id}"]`, { timeout: 20000 });
  await page.evaluate((m) => {
    document.documentElement.classList.toggle("dark", m === "dark");
  }, mode);
  // 当たっていないと明暗 2 通りが同じ画面になる。
  await page.waitForFunction(
    (m) => document.documentElement.classList.contains("dark") === (m === "dark"),
    mode,
    { timeout: 20000 },
  );
  await page.evaluate(() => document.fonts.ready);
  // 明暗の切替に transition が掛かるので落ち着くまで待つ。
  await page.waitForTimeout(600);
}

/** 撮り直す回数。 動いている瞬間に当たっても、 次の機会を待てば測れる (#1072)。 */
const STILL_ATTEMPTS = 5;

/**
 * 札が出そろうまで待ってから、画面を止める (#1488)。
 *
 * `#1470` で矢印が段に合わせて出るようになり、札は段が進むと現れて次の周で消える
 * (実測 = `pattern-passthrough` は 12 秒のうち 5 秒しか 2 件出ていない)。 決め打ちの待ち時間で
 * 数えると 0 件になり、その先の測定が丸ごと空振りする。
 *
 * **数えた後に止める**。 待つだけだと、1 件ずつ撮っている途中で段が進んで札が消える。
 * 段の進みは `requestAnimationFrame` と timer が回すので、両方を止めれば DOM が固定される。
 */
async function 札が出そろうまで待って止める(page: Page, id: string, 期待: number): Promise<void> {
  await page
    .waitForFunction(
      ({ id, n }) =>
        document.querySelectorAll(`[data-cdl-diagram="${id}"] [data-cdl-role="edge-label"]`).length === n,
      { id, n: 期待 },
      { timeout: 30000 },
    )
    .catch(() => {
      throw new Error(`${id} の edge label が ${期待} 件になる瞬間が 30 秒の間に来ない`);
    });
  await page.evaluate(() => {
    const w = window as unknown as {
      requestAnimationFrame: (cb: FrameRequestCallback) => number;
      setTimeout: typeof setTimeout;
    };
    w.requestAnimationFrame = () => 0;
    const maxId = Number(w.setTimeout(() => {}, 0));
    for (let i = 0; i <= maxId; i += 1) {
      clearInterval(i);
      clearTimeout(i);
    }
  });
  // 止めた直後は最後の 1 コマが描き終わっていない
  await page.waitForTimeout(300);
}

/**
 * その label の領域が動いていない瞬間を捉えて、 背景と文字を撮る (#1072)。
 *
 * 隠した状態で 2 度撮り、 差があれば animation 等で画面が動いており、 差分を文字と見なせない。
 *
 * **見本は動き続ける**。 `oauth-flow` は `animation:` を持ち、 描画側は
 * `requestAnimationFrame` の loop で段を進める。 「止まるまで待つ」 形は成立しない
 * (実測 = `pattern-passthrough` も 20 秒待っても止まらない)。
 *
 * 動くのは図の一部で、 label の領域は多くの瞬間で静止している。 だから **測れる瞬間まで
 * 撮り直す**。 1 回で諦めると、 負荷が高い時にだけその label が測れず、 件数だけが 1 少なく
 * なって落ちる (実測 = 全件実行 3 回のうち 2 回、 落ちる主題は毎回違う)。
 *
 * 撮り直しても駄目なら `null` を返す = 呼出側が理由付きで失敗させる。 動いた画面の色を
 * 対比として報告しない。
 */
async function shootWhenStill(
  page: Page,
  id: string,
  index: number,
  box: Box,
): Promise<{ bg: PNG; fg: PNG } | null> {
  for (let attempt = 0; attempt < STILL_ATTEMPTS; attempt++) {
    // その label だけを隠す。 撮る範囲も同じなので、 差分は必ずその文字による。
    await setLabelsHidden(page, id, true, index);
    const bg = await shoot(page, box);
    const bg2 = await shoot(page, box);
    await setLabelsHidden(page, id, false, index);
    const fg = await shoot(page, box);
    if (measure(bg2, bg).kind !== "ok") return { bg, fg };
    // 動いていた。 次の機会を待つ
    await page.waitForTimeout(200);
  }
  return null;
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

  for (const mode of MODES) {
      test(`${mode} の edge label が WCAG AA を満たす`, async ({ page }) => {
        const failures: string[] = [];
        let measured = 0;
        let worst = Infinity;

        for (const target of TARGETS) {
          await open(page, target, mode);
          await 札が出そろうまで待って止める(page, target.id, target.expectedLabels);
          const labels = await collectLabels(page, target.id);
          // **target ごとに** 件数を固定する。 合計だけだと、 `pattern-passthrough` の sub が
          // 消えて `oauth-flow` が 1 件増える形で合計が変わらず、 sub 行の検査を失う。
          expect(labels.length, `${target.id} の edge label 数`).toBe(target.expectedLabels);
          expect(
            [...new Set(labels.map((l) => l.declaredPx))].sort((a, b) => b - a),
            `${target.id} の宣言された大きさ`,
          ).toEqual([...target.expectedDeclaredPx]);

          for (const [i, l] of labels.entries()) {
            const shot = await shootWhenStill(page, target.id, i, l.box);
            if (shot === null) {
              failures.push(
                `${target.id}/${l.key} は ${STILL_ATTEMPTS} 回撮り直しても画面が動いており測れない`,
              );
              continue;
            }
            const m = measure(shot.fg, shot.bg);
            if (m.kind === "ok") { measured++; worst = Math.min(worst, m.ratio); }
            const f = judge(l, m);
            if (f !== null) failures.push(`${target.id}/${f}`);
          }
        }

        // **理由を先に出す**。 測れなかった label は必ず `failures` にも理由が入る
        // (測れない 3 経路 = 画面が動いた / 文字が背景と同じ / 芯を特定できない、 のどれも
        // `failures.push` を通る)。 件数を先に照合すると「9 対 10」 だけが出て、 なぜ 1 件
        // 落ちたのかが失敗の文面から消える (#1072 の調査で 2 回とも理由が読めなかった)。
        expect(failures, `${mode} 最小の対比 ${worst.toFixed(2)}:1`).toEqual([]);
        // 1 件も測れていなければ、 0 件の failures は「満たした」 ことを意味しない。
        expect(measured, `${mode} で実際に測れた label 数`).toBe(
          TARGETS.reduce((n, t) => n + t.expectedLabels, 0),
        );
      });
  }

  test("図の配色が明暗を 1 箇所でしか決めていない", async ({ page }) => {
    // 元は「暗色の宣言を持たない主題の一覧」 を照合していた。 主題を廃止したので、
    // その一覧が守っていた前提 (どこで暗色が決まるか) を直接測る形に置き換えた。
    //
    // 図の色は変数の差し替えだけで明暗が決まる。 `cdl-theme.css` に `html.dark` を書くと
    // 決める場所が 2 つになり、 変数を変えても図だけ古い色のまま残る。
    // **図に色を当てる CSS を機械的に集める**。 一覧を手で書くと、 3 つ目の file が
    // 増えた時に漏れる (実測 = `cdl-theme.css` だけ見ていた間、 図の中の操作盤を描く
    // `catalog-widgets.css` に `html.dark` が 160 行残っていた)。
    //
    // 目印は「図の部品に色を当てる selector を持つこと」。 `data-cdl-role` (図の部品) と
    // `.cdl-ip-` (図の中の操作盤) のどちらかを書いている file が対象。
    const styles = fileURLToPath(new URL("../src/styles", import.meta.url));
    // 説明文を先に落としてから目印を探す。 落とさないと「かつて `.cdl-ip-` を使っていた」 と
    // 書いただけの file を拾う (実測 = `catalog-new.css` が説明文だけで対象に入った)。
    //
    // 併せて **目印を持つ規則に色の指定があること** も条件にする。 目印を持つが色を当てない
    // file (`display: none` だけを書く等) は配色の file ではない。
    const 対象 = readdirSync(styles)
      .filter((f) => f.endsWith(".css"))
      .filter((f) => {
        const 規則 = readFileSync(join(styles, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
        if (!規則.includes("data-cdl-role") && !規則.includes(".cdl-ip-")) return false;
        // 目印を含む規則の塊を取り出し、 その中に色の指定があるかを見る
        return [...規則.matchAll(/([^{}]*)\{([^{}]*)\}/g)].some((m) => {
          // 2 つとも必須の群。 一致した以上必ず取れる
          const sel = m[1];
          const body = m[2];
          if (sel === undefined || body === undefined) return false;
          return (
            (sel.includes("data-cdl-role") || sel.includes(".cdl-ip-")) &&
            /(^|[;\s])(color|background|background-color|fill|stroke|border-color)\s*:/.test(body)
          );
        });
      })
      .sort();

    // 見つからない = 目印を変えたか、 集め方が壊れている。 空で通ると検査が空振りする。
    expect(対象.length, "図に色を当てる CSS が 1 件も見つからない").toBeGreaterThan(0);

    const 違反: string[] = [];
    /** 名前を書いて選ぶ配色の塊 (`[data-cdl-palette="kinari"]` 等)。 名前 → 明暗 → 口 */
    const 配色: Map<string, Map<string, Set<string>>> = new Map();
    for (const 名 of 対象) {
      const css = readFileSync(join(styles, 名), "utf8");
      // 説明文に書くのは構わない (規約そのものを書いてある)。 見るのは規則の側だけ。
      const 規則だけ全部 = css.replace(/\/\*[\s\S]*?\*\//g, "");

      /*
       * 名前を書いて選ぶ配色 (#1553) の塊だけは、色を直に書き明暗も 2 面で書く。
       *
       * 上の規約 (明暗を 1 箇所で決める) の狙いは「変数を変えても図だけ古い色のまま残る」 を
       * 防ぐこと = 図の色が `--d-*` から流れてくることが前提にある。 本節の色は `--d-*` から
       * 来ない。 意匠帳 (`docs/design/er/note.md`) が図のために決めた別の組で、入れ替わる
       * 上流を持たない。
       *
       * **代わりに別の縛りを掛ける**。 穴を空けるだけにすると、明るい側だけ直して暗い側を
       * 忘れる形が通る。 下で「どの名前も明暗の両方で同じ 7 つを定義していること」 を見る。
       */
      const 塊 = [...規則だけ全部.matchAll(/([^{}]*)\{([^{}]*)\}/g)];
      const 名前で選ぶ = (selector: string): RegExpExecArray | null => {
        const 外す側を除いた選択子 = selector.replace(/:not\(\s*:where\([^)]*\)\s*\)/g, "");
        return /\[data-cdl-palette="([^"]+)"\]/.exec(外す側を除いた選択子);
      };
      for (const m of 塊) {
        const sel = m[1] ?? "";
        const body = m[2] ?? "";
        const 名前 = 名前で選ぶ(sel);
        if (!名前) continue;
        const 明暗 = sel.includes("html.dark") ? "暗" : "明";
        const 口 = new Set(
          [...body.matchAll(/--er-([a-z-]+)\s*:/g)].flatMap((x) => (x[1] === undefined ? [] : [x[1]])),
        );
        // 必須の群。 一致した以上必ず取れる
        const 表 = 配色.get(名前[1]!) ?? new Map<string, Set<string>>();
        const 足す先 = 表.get(明暗) ?? new Set<string>();
        for (const 値 of 口) 足す先.add(値);
        表.set(明暗, 足す先);
        配色.set(名前[1]!, 表);
      }
      const 規則だけ = 塊
        .filter((m) => 名前で選ぶ(m[1] ?? "") === null)
        .map((m) => m[0])
        .join("\n");
      const n = (規則だけ.match(/html\.dark/g) ?? []).length;
      if (n > 0) 違反.push(`${名} に html.dark が ${n} 件`);

      // 色を直に書くと明暗が追随しない。 埋め込み画像の中の色 (`%23`) も同じ。
      //
      // **色かどうかの判定はブラウザに任せる**。 自分で色関数と名前を数え上げると
      // 「また別の書き方が漏れている」 が繰り返し出て収束しない (review 2 巡連続で
      // `hsl()` の黒 / `tomato` / `rebeccapurple` を指摘された)。
      //
      // 値を実際に解決させれば、 色関数の種類も名前の一覧も知らなくてよい。
      // **property を選ばない**。 一覧を持つと漏れる (実測 = `border-left` が抜けていた)。
      // 全ての宣言の値を渡し、 色かどうかはブラウザに判定させる。
      // 必須の群。 一致した以上必ず取れる
      const 宣言 = [...規則だけ.matchAll(/(?:^|[;{])\s*[a-z-]+\s*:\s*([^;{}]*)/gi)].flatMap((m) =>
        m[1] === undefined ? [] : [m[1]],
      );
      const 直書き = await 固定色を取り出す(page, 宣言);
      if (直書き.length > 0) {
        違反.push(`${名} に色の直書きが ${直書き.length} 件 (例 ${直書き.slice(0, 3).join(" / ")})`);
      }
      if (!/var\(--d-/.test(規則だけ)) 違反.push(`${名} が変数を参照していない`);
    }

    /*
     * 名前を書いて選ぶ配色は、明暗の両方で同じ口を埋める (#1553)。
     *
     * 上で色の直書きを許した分の埋め合わせ。 片側だけ直すと、その画面でだけ既定の色が出る。
     */
    // 0 件だと下の照合が「対象なし」 で素通りする
    expect(配色.size, "名前を書いて選ぶ配色が 1 つも見つからない (検査が空振りしている)").toBeGreaterThan(0);

    /*
     * **口の一覧は実物から導く** (#1709)。
     *
     * 元は 7 つを手で並べていたが、色を 2 つ足した (`--er-own` / `--er-link`) 時に
     * 直されず、この検査は落ちたまま積み上がっていた。 守りたいのは「どこかに書き忘れが
     * ある」 ことなので、名前の数を固定する必要は無い。
     *
     * 見るのは 2 つ。 どの配色も明暗で同じ口を埋めること、どの配色も互いに同じ口を
     * 持つこと。 片側だけ直した / 新しい配色で 1 つ書き忘れた のどちらもここで落ちる。
     */
    const 帳 = readThemeNotes();
    const 口の一覧 = [...(配色.values().next().value?.get("明") ?? [])].sort();
    expect(口の一覧.length, "配色が口を 1 つも定義していない (検査が空振りしている)").toBeGreaterThan(0);
    for (const [名前, 表] of 配色) {
      const note = 帳.get(名前 as DslTheme);
      // 生成りと青磁は記法から外した (#2960) が、CSS の塊は #2962 で消すまで残る。
      // 意匠帳を持たないので、明暗の両方で口をそろえることだけを見る
      if (!(COLOR_ONLY_THEMES as readonly string[]).includes(名前)) {
        expect(note, `配色 ${名前} の意匠帳が無い`).toBeDefined();
      }
      const sides = note?.mode === "fixed" ? ["明"] : ["明", "暗"];
      if (note?.mode === "fixed") {
        expect(表.has("暗"), `固定の配色 ${名前} が暗の塊を持つ`).toBe(false);
      }
      for (const 明暗 of sides) {
        expect(
          [...(表.get(明暗) ?? [])].sort(),
          `配色 ${名前} の ${明暗} が他と同じ口を埋めていない (${口の一覧.length} 個そろえる)`,
        ).toEqual(口の一覧);
      }
    }

    expect(違反, "図の配色が明暗を 2 箇所以上で決めている").toEqual([]);
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
    await open(page, target, "light");
    await 札が出そろうまで待って止める(page, target.id, target.expectedLabels);
    await page.addStyleTag({
      content: `html body [data-cdl-role="edge-label"] { fill: #a66a3d !important; }`,
    });
    await page.waitForTimeout(300);

    const labels = await collectLabels(page, target.id);
    const failures: string[] = [];
    for (const [i, l] of labels.entries()) {
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
    await open(page, target, "light");
    await 札が出そろうまで待って止める(page, target.id, target.expectedLabels);
    const labels = await collectLabels(page, target.id);
    expect(labels.length).toBeGreaterThan(0);

    // 背景に近い灰色を当てる。 pill の背景は白系なので対比が 1.5:1 前後まで落ちる。
    //
    // 主題の CSS も `!important` を使うので、 **主題より詳細度の高い selector** で当てる
    // (`[data-cdl-role="edge-label"]` だけだと主題側が勝って何も変わらない)。
    await page.addStyleTag({
      content: `html body [data-cdl-role="edge-label"] { fill: #e8e8e8 !important; }`,
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
    for (const [i, l] of fresh.entries()) {
      const fg = fgShots[i];
      const bg = bgShots[i];
      // 3 つの並びは `fresh` から同じ数だけ作っているので必ず揃う
      if (fg === undefined || bg === undefined) continue;
      const m = measure(fg, bg);
      if (m.kind === "ok") ok++;
      const f = judge(l, m);
      if (f !== null) failures.push(f);
    }
    expect(ok, "測れた label がある").toBeGreaterThan(0);
    expect(failures.length, "対比を落としたのに検知しない").toBeGreaterThan(0);
    // 「測れなかった」 ではなく「閾値を割った」 として検知していること。
    expect(failures.some((f) => /:1 が要るが/.test(f)), `検知の内容: ${failures.join(" | ")}`).toBe(true);
  });
});

test.describe("図録の関係と型の多重度 (#2836)", () => {
  test.describe.configure({ timeout: 120000 });

  for (const [name, source] of [
    ["関係", sourceYaml__presetDeliveryRelations],
    ["型", sourceYaml__presetDeliveryClasses],
  ] as const) {
    test(`${name}の多重度が暗い台の上で 4.5 以上`, async ({ page }) => {
      await openEditorTheme(page, source, "catalog", false);
      await stopDiagram(page);
      const stage = page.locator('svg[data-cdl-stage][data-cdl-palette="catalog"]');
      const result = await stage.evaluate((element) => {
        const ground = getComputedStyle(element).backgroundColor;
        return {
          ground,
          labels: [...element.querySelectorAll('[data-cdl-role="edge-end-label"]')].map((label) => ({
            text: label.textContent ?? "",
            fill: getComputedStyle(label).fill,
          })),
        };
      });
      expect(result.labels, `${name}の多重度`).toHaveLength(3);
      for (const label of result.labels) {
        expect(label.fill, `${name}/${label.text} の見本色`).toBe("rgb(163, 154, 135)");
        expect(
          contrast(color(label.fill), color(result.ground)),
          `${name}/${label.text}: ${label.fill} on ${result.ground}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrast(color("rgb(111, 103, 87)"), color(result.ground))).toBeLessThan(4.5);
    });
  }
});

test.describe("図録の関係線の描画対比 (#2836)", () => {
  test.describe.configure({ timeout: 120000 });

  test("状態の矢印と使う点線が地に対して 3 以上", async ({ page }) => {
    await open(page, { slug: "presets", id: "delivery-relations-demo" }, "light");
    await page.getByRole("combobox", { name: "図の色味" }).selectOption({ label: "図録" });
    const stage = page.locator(
      '[data-cdl-diagram="delivery-relations-demo"] svg[data-cdl-stage][data-cdl-palette="catalog"]',
    );
    await expect(stage).toHaveCount(1);
    await expect(stage.locator('[data-cdl-tone="warning"] [data-cdl-role="edge-line"]')).toHaveCount(3);
    await expect(stage.locator('[data-cdl-tone="teal"] [data-cdl-role="edge-line"]')).toHaveCount(3);
    await stopDiagram(page);
    const result = await stage.evaluate((element) => ({
      ground: getComputedStyle(element).backgroundColor,
      lines: [...element.querySelectorAll<SVGPathElement>('[data-cdl-role="edge-line"]')]
        .filter((line) => ["warning", "teal"].includes(line.closest("[data-cdl-tone]")?.getAttribute("data-cdl-tone") ?? ""))
        .map((line) => {
          const style = getComputedStyle(line);
          return {
            tone: line.closest("[data-cdl-tone]")?.getAttribute("data-cdl-tone") ?? "",
            stroke: style.stroke,
            strokeOpacity: Number(style.strokeOpacity || 1),
          };
        }),
    }));
    const ground = color(result.ground);
    const expected = {
      warning: "rgb(232, 112, 90)",
      teal: "rgb(79, 174, 154)",
    } as const;
    for (const tone of ["warning", "teal"] as const) {
      const lines = result.lines.filter((line) => line.tone === tone);
      expect(lines, `${tone} の関係線`).toHaveLength(3);
      for (const [index, line] of lines.entries()) {
        expect(line.stroke, `${tone} ${index + 1} の見本色`).toBe(expected[tone]);
        expect(line.strokeOpacity, `${tone} ${index + 1} の不透明度`).toBe(1);
        expect(
          contrast(over(color(line.stroke), line.strokeOpacity, ground), ground),
          `${tone} ${index + 1}: ${line.stroke} / ${line.strokeOpacity} on ${result.ground}`,
        ).toBeGreaterThanOrEqual(3);
      }
    }

    expect(contrast(over([167, 88, 76], 0.85, ground), ground), "旧い状態色を検知する").toBeLessThan(3);
    expect(contrast(over([63, 130, 119], 0.85, ground), ground), "旧い使う色を検知する").toBeLessThan(3);
  });
});


test.describe("固定の意匠 × 図種 (#2790)", () => {
  test.describe.configure({ timeout: 300_000 });
  test.use({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: FIXED_THEME_DEVICE_SCALE_FACTOR,
  });
  const samples = samplesByType();
  const leadColors = readFixedThemeLead();

  test("EDITOR_SAMPLES が全ての図種を 1 件以上持つ", () => {
    expect(samples.size, `選べた図種: ${[...samples.keys()].join(" / ")}`).toBe(PRESET_TYPES.size);
  });

  for (const note of fixedThemes()) {
    for (const dark of [false, true]) {
      const mode = dark ? "暗" : "明";
      test(`${note.name} / ${mode}: 全図種で固定色と contrast が出る`, async ({ page }) => {
        const result = await checkFixedThemeAcrossTypes(page, note, dark);
        const grounds = [...new Set(result.groundByType.values())].join(" / ");
        console.log(
          `${note.name} contrast ${mode}: applied=${result.applied}/${PRESET_TYPES.size} ` +
            `boxTypes=${result.boxTypes} edgeTypes=${result.edgeTypes} ` +
            `halfFrames=${result.halfFrames} outlineless=${result.outlineless} ` +
            `failures=${result.failures.length} ` +
            `grounds=${grounds}`,
        );

        expect(result.applied, `${note.name} が当たった図種`).toBe(PRESET_TYPES.size);
        expect(result.boxTypes, "箱を測れた図種が 0 件").toBeGreaterThan(0);
        expect(result.edgeTypes, "線を測れた図種が 0 件").toBeGreaterThan(0);
        if (readFixedThemeOutline().get(note.name) === "none") {
          expect(result.outlineless, "縁線なしの箱を 1 件も測れていない").toBeGreaterThan(0);
        } else {
          expect(
            result.halfFrames,
            "描き手が半分の濃さで描いた枠を 1 件も測れていない (検査が空振りしている)",
          ).toBeGreaterThan(0);
        }
        expect(result.failures, `${note.name}/${mode} の違反`).toEqual([]);
      });
    }
  }

  for (const note of fixedThemes()) {
    if (readFixedThemeOutline().get(note.name) === "none") continue;
    test(`${note.name}: 枠の濃さの決まりを外すと箱の枠の検査が落ちる (陽性対照)`, async ({ page }) => {
      const lead = leadColors.get(note.name);
      if (!lead) throw new Error(`${note.name} の一を読めない`);
      let target: { type: string; stage: Locator } | null = null;
      for (const [type, source] of samples) {
        await openEditorTheme(page, source, note.name, false);
        const stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${note.name}"]`);
        if (await stage.locator('[data-cdl-kind="function"] [data-cdl-role="node-body"]').count() > 0) {
          target = { type, stage };
          break;
        }
      }
      expect(target, `${note.name} で function の箱を持つ図種が無い`).not.toBeNull();
      if (target === null) return;

      const before = await checkBoxAndLineContrast(page, target.stage, target.type, "明", note, lead);
      expect(
        before.failures.filter((failure) => failure.includes("箱の枠")),
        `${note.name} の決まりを外す前から箱の枠が落ちている`,
      ).toEqual([]);

      const removed = await page.evaluate(() => {
        const removeFrom = (rules: CSSRuleList): number => {
          let count = 0;
          for (const rule of rules) {
            if (
              rule instanceof CSSStyleRule &&
              rule.selectorText.includes('[data-cdl-role="node-body"]') &&
              rule.style
                .getPropertyValue("stroke-opacity")
                .includes("var(--dragon-theme-box-frame-opacity)")
            ) {
              // 共通の宣言は全意匠から外れるが、この頁に開く図は検査中の意匠だけなので、
              // 測る対象は「その意匠で枠の濃さの決まりが無い時」のまま変わらない。
              rule.style.removeProperty("stroke-opacity");
              count += 1;
            }
            const nested = (rule as CSSRule & { cssRules?: CSSRuleList }).cssRules;
            if (nested !== undefined) count += removeFrom(nested);
          }
          return count;
        };
        let count = 0;
        for (const sheet of document.styleSheets) count += removeFrom(sheet.cssRules);
        return count;
      });
      expect(removed, `${note.name} の枠の濃さの決まりを見つけられない`).toBeGreaterThanOrEqual(1);

      const after = await checkBoxAndLineContrast(page, target.stage, target.type, "明", note, lead);
      expect(
        after.failures.filter((failure) =>
          failure.includes("箱の枠") && failure.includes("実効") && failure.includes("< 4.61"),
        ),
        `${note.name} の枠の濃さを外しても実効対比の検査が落ちない`,
      ).not.toEqual([]);
    });
  }

  for (const note of fixedThemes()) {
    test(`${note.name}: 六色の記法が意匠帳の 3 色へ割り当たる`, async ({ page }) => {
      await openEditorTheme(page, 六色の記法, note.name, false);
      const tones = await page.locator("[data-cdl-edge][data-cdl-tone]").evaluateAll((edges) =>
        Object.fromEntries(edges.flatMap((edge) => {
          const tone = edge.getAttribute("data-cdl-tone");
          const line = edge.querySelector('[data-cdl-role="edge-line"]');
          return tone && line ? [[tone, getComputedStyle(line).stroke]] : [];
        })),
      );
      const expected: Record<string, keyof ThemeValues> = {
        accent: "line",
        teal: "own",
        success: "link",
        error: "own",
        warning: "own",
        info: "line",
      };
      expect(Object.keys(tones).sort()).toEqual(Object.keys(expected).sort());
      for (const [tone, port] of Object.entries(expected)) {
        expect(colorKey(tones[tone] ?? ""), tone).toBe(colorKey(note.value[port]));
      }
    });
  }
});

test.describe("段の箱の見出しと担当の字 (#2831)", () => {
  test.describe.configure({ timeout: 300_000 });
  const themes = [...readThemeNotes().keys()];

  for (const theme of themes) {
    for (const dark of [false, true]) {
      const mode = dark ? "暗" : "明";
      test(`${theme} / ${mode}: 見出しと担当の字が面の上で 4.5 以上`, async ({ page }) => {
        await openEditorTheme(page, 段の箱の対比見本, theme, dark);
        const result = await checkStageTextContrast(page, theme, mode);
        expect(result.measured, `${theme}/${mode}: 測れた字`).toBe(16);
        expect(result.failures, `${theme}/${mode}: 段の箱の字の違反`).toEqual([]);
      });
    }
  }

  test("stage-note を札の面と同じ色にすると検知する (陽性対照)", async ({ page }) => {
    const theme: DslTheme = "blueprint";
    await openEditorTheme(page, 段の箱の対比見本, theme, false);
    const stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
    await stage.locator('[data-cdl-role="stage-note"]').evaluateAll((notes) => {
      for (const note of notes) {
        const nodeId = note.getAttribute("data-cdl-stage-node");
        const body = nodeId === null
          ? null
          : document.querySelector(`[data-cdl-node="${CSS.escape(nodeId)}"] [data-cdl-role="node-body"]`);
        if (body !== null) (note as SVGElement).style.setProperty("fill", getComputedStyle(body).fill, "important");
      }
    });
    const result = await checkStageTextContrast(page, theme, "陽性対照");
    expect(
      result.failures.filter((failure) => failure.includes("stage-note") && failure.includes("< 4.5:1")),
      "担当の字を札の面と同じ色にしても検知しない",
    ).not.toEqual([]);
  });
});

test.describe("線の札の対比 (#2817)", () => {
  test.describe.configure({ timeout: 300_000 });
  test.use({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: FIXED_THEME_DEVICE_SCALE_FACTOR,
  });

  for (const theme of ["catalog", "terminal", "sketch", "neon", "relief"] as const) {
    for (const dark of [false, true]) {
      const mode = dark ? "暗" : "明";
      test(`${theme} / ${mode}: 非強調の 3 枚と主役の札の字が 4.5 以上`, async ({
        page,
      }, testInfo) => {
        const report = await checkEdgeLabelContrast(page, theme, dark);
        console.log(report);
        testInfo.annotations.push({ type: `${theme} labels contrast ${mode}`, description: report });
      });
    }
  }
});

/**
 * 箱の中の絵 (#2811)。
 *
 * 描き手は箱の右上に、箱の種類を示す小さな絵 (`node-kind-icon`) を置く。 箱の子図形を選ぶ規則が
 * 絵まで選ぶと、絵は面の色で塗られて枠の色の輪郭だけが残り、種類を見分けられなくなる。
 *
 * 意匠は `THEMES` に登録された全てを読む (`readThemeNotes`)。 意匠を足せば検査も増える。
 * 固定の意匠も明暗の両方で回す = 明暗の切替が固定の舞台へ漏れていないことも同時に見る。
 */
test.describe("箱の中の絵 (#2811)", () => {
  test.describe.configure({ timeout: 300_000 });
  const samples = samplesByType();
  const notes = [...readThemeNotes().values()];

  /**
   * 絵を測る図種。 `topology` と `c4` が #2811 の対象で、`swimlane` も同じ箱 (`GenericNode`) を
   * 使って絵を描く。 見本に絵が 1 つも無い図種があれば、その図種の検査は空振りとして落とす。
   */
  const 絵を測る図種 = ["topology", "c4", "swimlane"] as const;

  /** 絵が箱の面に対して要る対比。 字ではない図形の下限 (WCAG 1.4.11) */
  const 絵の対比の下限 = 3;

  type KindIcon = {
    node: string | null;
    look: string | null;
    active: boolean;
    /** 構造が想定と違って測れなかった理由。 測れた時は `null` */
    problem: string | null;
    fill: string;
    fillOpacity: number;
    stroke: string;
    /** 絵の `path` から箱 (`node-body`) の手前までの `opacity` の積。 描き手は 0.7 を付ける */
    opacity: number;
    /** 絵の位置で解いた `--d-text-secondary`。 色に解けない時は `null` */
    expected: string | null;
    underlayFill: string;
    underlayStroke: string;
    /** 絵の真後ろにある箱の図形。 箱の中に無い時は `null` (台がそのまま見える) */
    face: { fill: string; fillOpacity: number; opacity: number } | null;
    /** 箱から文書の根までの `opacity` の積 */
    bodyOpacity: number;
  };

  const 読める色 = (value: string): string | null => {
    try {
      const parsed = parseColor(value);
      return parsed === null ? null : parsed.rgb.map((part) => Math.round(part)).join(",");
    } catch {
      return null;
    }
  };

  async function readKindIcons(stage: Locator): Promise<KindIcon[]> {
    return stage.evaluate((root): KindIcon[] => {
      const 積 = (from: Element, until: Element | null): number => {
        let product = 1;
        for (let current: Element | null = from; current !== null && current !== until; current = current.parentElement) {
          product *= Number(getComputedStyle(current).opacity || 1);
        }
        return product;
      };
      // 変数の計算値は色の文字列のままなので、画面の部品に当てて計算値の色へ解く。
      const 色に解く = (value: string): string | null => {
        if (value === "") return null;
        const probe = document.createElement("span");
        probe.style.color = value;
        if (probe.style.color === "") return null;
        document.body.append(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        return resolved;
      };

      return [...root.querySelectorAll('[data-cdl-role="node-kind-icon"]')].map((icon) => {
        const body = icon.closest('[data-cdl-role="node-body"]');
        const path = icon.querySelector("path");
        const underlay = icon.querySelector(":scope > rect");
        const base = {
          node: icon.closest("[data-cdl-node]")?.getAttribute("data-cdl-node") ?? null,
          look: body?.getAttribute("data-cdl-look") ?? null,
          active: icon.closest('[data-cdl-active="true"]') !== null,
        };
        if (body === null || path === null || underlay === null) {
          return {
            ...base,
            problem: `箱 ${body !== null} / 絵の path ${path !== null} / 下敷き ${underlay !== null} のどれかが無い`,
            fill: "", fillOpacity: 1, stroke: "", opacity: 1, expected: null,
            underlayFill: "", underlayStroke: "", face: null, bodyOpacity: 1,
          };
        }

        // 絵の真後ろの図形 = 下敷きの中心を面で含む図形のうち、最後に描かれたもの。
        const area = underlay.getBoundingClientRect();
        const center = new DOMPoint(area.x + area.width / 2, area.y + area.height / 2);
        let face: Element | null = null;
        for (const shape of [body, ...body.querySelectorAll("rect, path, ellipse, circle, polygon")]) {
          if (!(shape instanceof SVGGeometryElement) || shape.closest('[data-cdl-role="node-kind-icon"]')) continue;
          const matrix = shape.getScreenCTM();
          if (matrix !== null && shape.isPointInFill(center.matrixTransform(matrix.inverse()))) face = shape;
        }

        const pathStyle = getComputedStyle(path);
        const underlayStyle = getComputedStyle(underlay);
        const faceStyle = face === null ? null : getComputedStyle(face);
        return {
          ...base,
          problem: null,
          fill: pathStyle.fill,
          fillOpacity: Number(pathStyle.fillOpacity || 1),
          stroke: pathStyle.stroke,
          opacity: 積(path, body),
          expected: 色に解く(pathStyle.getPropertyValue("--d-text-secondary").trim()),
          underlayFill: underlayStyle.fill,
          underlayStroke: underlayStyle.stroke,
          face: face === null || faceStyle === null
            ? null
            : { fill: faceStyle.fill, fillOpacity: Number(faceStyle.fillOpacity || 1), opacity: 積(face, body) },
          bodyOpacity: 積(body, null),
        };
      });
    });
  }

  /** 絵 1 つずつに、塗り・輪郭・下敷き・面との実効対比の 4 つを課す。 */
  function checkKindIcons(icons: KindIcon[], ground: Rgb, where: string): string[] {
    const failures: string[] = [];
    for (const icon of icons) {
      const label = `${where}: 絵 ${icon.node ?? "不明"} (look ${icon.look ?? "なし"}${icon.active ? " / 光" : ""})`;
      if (icon.problem !== null) {
        failures.push(`${label}: ${icon.problem}`);
        continue;
      }
      if (icon.stroke !== "none") failures.push(`${label}: 輪郭 ${icon.stroke} (none が要る)`);
      const fill = 読める色(icon.fill);
      const expected = icon.expected === null ? null : 読める色(icon.expected);
      if (expected === null) failures.push(`${label}: --d-text-secondary を色に解けない`);
      else if (fill !== expected) {
        failures.push(`${label}: 塗り ${icon.fill} / --d-text-secondary ${icon.expected}`);
      }
      if (icon.underlayFill !== "rgba(0, 0, 0, 0)" || icon.underlayStroke !== "none") {
        failures.push(`${label}: 下敷き fill ${icon.underlayFill} / stroke ${icon.underlayStroke} (透明が要る)`);
      }

      // 絵は箱の面の上に描く 1 枚。 面を塗り、絵を枠と見なすと、`effectivePaint` の合成式
      // (面の上に重ね、箱ごと台へ重ねる) と同じになる。 箱の `opacity` は面と絵の組に 1 度だけ掛かる。
      const shown = effectivePaint(
        {
          fill: icon.face?.fill ?? "none",
          fillOpacity: icon.face === null ? 1 : icon.face.fillOpacity * icon.face.opacity,
          stroke: fill === null ? "none" : icon.fill,
          strokeOpacity: icon.fillOpacity * icon.opacity,
          opacity: icon.bodyOpacity,
        },
        ground,
      );
      if (shown.frame === null) {
        failures.push(`${label}: 塗り ${icon.fill} を色として読めない`);
        continue;
      }
      const ratio = contrast(shown.frame, shown.face);
      if (ratio < 絵の対比の下限) {
        failures.push(
          `${label}: 面との実効 ${ratio.toFixed(2)}:1 < ${絵の対比の下限} ` +
          `(絵 ${icon.fill} × ${(icon.fillOpacity * icon.opacity).toFixed(2)} / 面 ${icon.face?.fill ?? "なし"})`,
        );
      }
    }
    return failures;
  }

  /** 箱の中の、絵ではない図形の計算値。 箱ごとに描かれた順で並べる */
  async function readBoxShapes(stage: Locator): Promise<string[]> {
    return stage.evaluate((root) =>
      [...root.querySelectorAll('[data-cdl-role="node-body"]')].flatMap((body) => {
        const node = body.closest("[data-cdl-node]")?.getAttribute("data-cdl-node") ?? "不明";
        return [body, ...body.querySelectorAll("rect, path, ellipse, circle, polygon, polyline, line")]
          .filter((shape) => shape.closest('[data-cdl-role="node-kind-icon"]') === null)
          .map((shape, index) => {
            const style = getComputedStyle(shape);
            return (
              `${node}#${index} ${shape.tagName}: fill ${style.fill} / stroke ${style.stroke} / ` +
              `stroke-width ${style.strokeWidth} / stroke-opacity ${style.strokeOpacity} / ` +
              `fill-opacity ${style.fillOpacity}`
            );
          });
      }),
    );
  }

  for (const note of notes) {
    for (const dark of [false, true]) {
      const mode = dark ? "暗" : "明";

      test(`${note.name} / ${mode}: 箱の中の絵が地の字の色で輪郭を持たずに描かれる`, async ({ page }) => {
        const failures: string[] = [];
        for (const type of 絵を測る図種) {
          const source = samples.get(type);
          if (source === undefined) throw new Error(`${type} の見本が無い`);
          await openEditorTheme(page, source, note.name, dark);
          await stopDiagram(page);
          const stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${note.name}"]`);
          const ground = color(await stage.evaluate((element) => getComputedStyle(element).backgroundColor));
          const icons = await readKindIcons(stage);
          if (icons.length === 0) failures.push(`${type}/${mode}: 絵が 1 つも無い (検査が空振りしている)`);
          failures.push(...checkKindIcons(icons, ground, `${type}/${mode}`));
        }
        expect(failures, `${note.name}/${mode} の絵の違反`).toEqual([]);
      });

      test(`${note.name} / ${mode}: 絵を外す前の規則に戻しても絵以外の箱の図形は同じ値になる`, async ({ page }) => {
        const failures: string[] = [];
        for (const type of 絵を測る図種) {
          const source = samples.get(type);
          if (source === undefined) throw new Error(`${type} の見本が無い`);
          await openEditorTheme(page, source, note.name, dark);
          await stopDiagram(page);
          const stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${note.name}"]`);
          const now = await readBoxShapes(stage);
          if (now.length === 0) failures.push(`${type}/${mode}: 箱の図形が 1 つも無い (検査が空振りしている)`);

          // 箱の子図形の規則から、絵を外す条件だけを取り除く = main の時点の選択子へ戻す。
          // 書き戻した選択子を読み直し、黙って捨てられていないことも確かめる。
          const reverted = await page.evaluate(() => {
            const exclusion = /:not\(:where\(\[data-cdl-role="?node-kind-icon"?\]\)\)/g;
            let changed = 0;
            let rejected = 0;
            const walk = (rules: CSSRuleList): void => {
              for (const rule of rules) {
                if (rule instanceof CSSStyleRule) {
                  const next = rule.selectorText.replace(exclusion, "");
                  if (next !== rule.selectorText) {
                    rule.selectorText = next;
                    if (rule.selectorText === next) changed += 1;
                    else rejected += 1;
                  }
                }
                const nested = (rule as CSSRule & { cssRules?: CSSRuleList }).cssRules;
                if (nested !== undefined) walk(nested);
              }
            };
            for (const sheet of document.styleSheets) walk(sheet.cssRules);
            return { changed, rejected };
          });
          if (reverted.changed === 0) failures.push(`${type}/${mode}: 絵を外す条件を持つ規則が見つからない`);
          if (reverted.rejected > 0) failures.push(`${type}/${mode}: 選択子の書き戻しが ${reverted.rejected} 件拒まれた`);

          const before = await readBoxShapes(stage);
          if (JSON.stringify(before) !== JSON.stringify(now)) {
            const differs = now.flatMap((value, index) =>
              value === before[index] ? [] : [`今 ${value} / 戻す前の規則 ${before[index] ?? "無し"}`],
            );
            failures.push(`${type}/${mode}: 絵以外の図形の値が変わった (${now.length} / ${before.length} 件): ${differs.slice(0, 3).join(" | ")}`);
          }
        }
        expect(failures, `${note.name}/${mode} の箱の図形の違反`).toEqual([]);
      });
    }
  }
});

const 色みごとの日程 = `title: "色みごとの工程"
type: gantt

actors:
  - 設計: { value: "1期", tone: accent, owner: "設計班" }
  - 実装: { value: "2期", tone: teal, owner: "実装班" }
  - 検証: { value: "3期", tone: success, owner: "検証班" }
  - 公開: { value: "4期", tone: warning, owner: "公開班" }
  - 計測: { value: "5期", tone: info, owner: "計測班" }
  - 改善: { value: "6期", tone: error, owner: "改善班" }
`;

const 六段の漏斗 = `title: "六段の絞り込み"
type: funnel

actors:
  - 訪問: "12000"
  - 閲覧: "8000"
  - 会員登録: "3400"
  - カート投入: "1200"
  - 申込み: "480"
  - 継続: "200"
`;

type ScheduleBounds = { left: number; top: number; right: number; bottom: number };
type GanttSchedule = {
  ground: Rgb;
  ganttGround: Rgb;
  ownerCount: number;
  bars: Array<{
    emphasis: string | null;
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
    bounds: ScheduleBounds;
    owner: { fill: string; text: string; bounds: ScheduleBounds } | null;
  }>;
};
type FunnelSchedule = {
  ground: Rgb;
  stages: Array<{ fill: string; fillOpacity: number }>;
  names: string[];
};

async function readGanttSchedule(
  page: Page,
  source: string,
  theme: DslTheme,
  dark: boolean,
): Promise<GanttSchedule> {
  await openEditorTheme(page, source, theme, dark);
  const stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
  const groundPaints = await stage.evaluate((element) => {
    const style = getComputedStyle(element);
    // 電飾の意匠帳にある「台」は舞台の地でなく、図表内の専用の地を指す。
    return {
      stage: style.backgroundColor,
      chart: style.getPropertyValue("--theme-neon-chart-ground").trim(),
    };
  });
  const { ownerCount, bars } = await stage.evaluate((root) => {
    const box = ({ left, top, right, bottom }: DOMRect) => ({ left, top, right, bottom });
    return {
      ownerCount: root.querySelectorAll('[data-cdl-role="gantt-owner"]').length,
      bars: [...root.querySelectorAll('[data-cdl-role="gantt-bar"]')].map((element) => {
        const style = getComputedStyle(element);
        // 描き手は帯と担当の字を同じ g の兄弟に置く。帯の g から対応する字を引く。
        const owner = element.parentElement?.querySelector('[data-cdl-role="gantt-owner"]');
        return {
          emphasis: element.getAttribute("data-cdl-emphasis"),
          fill: style.fill,
          fillOpacity: Number(style.fillOpacity),
          stroke: style.stroke,
          strokeWidth: Number.parseFloat(style.strokeWidth),
          bounds: box(element.getBoundingClientRect()),
          owner: owner
            ? {
                fill: getComputedStyle(owner).fill,
                text: owner.textContent ?? "",
                bounds: box(owner.getBoundingClientRect()),
              }
            : null,
        };
      }),
    };
  });
  return {
    ground: color(groundPaints.stage),
    ganttGround: color(groundPaints.chart || groundPaints.stage),
    ownerCount,
    bars,
  };
}

async function readFunnelSchedule(page: Page, theme: DslTheme, dark: boolean): Promise<FunnelSchedule> {
  await openEditorTheme(page, 六段の漏斗, theme, dark);
  const stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
  const ground = color(await stage.evaluate((element) => getComputedStyle(element).backgroundColor));
  const stages = await stage.locator('[data-cdl-role="funnel-stage"]').evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      return { fill: style.fill, fillOpacity: Number(style.fillOpacity) };
    }));
  const names = await stage.locator('[data-cdl-role="funnel-stage"] + text').evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).fill));
  return { ground, stages, names };
}

const 宅配の時間軸 = `title: "荷物を届ける"
type: swimlane
shape: timeline
lanes:
  shipper: { label: 荷主 }
  office: { label: 営業所 }
  courier: { label: 配送便 }
actors:
  - 始まり: { kind: mark-start, lane: shipper }
  - 集荷を頼む: { lane: shipper }
  - 受け付ける: { lane: office }
  - 送り状を起こす: { lane: office }
  - 便に積む: { lane: courier }
  - 届けに行く: { lane: courier }
  - 在宅?: { kind: decision, lane: courier }
  - 受け取る: { lane: shipper }
  - 持ち戻る: { lane: courier }
  - 終わり: { kind: mark-end, lane: shipper }
flow:
  - 始まり -> 集荷を頼む
  - 集荷を頼む -> 受け付ける
  - 受け付ける -> 送り状を起こす
  - 送り状を起こす -> 便に積む
  - 便に積む -> 届けに行く
  - 届けに行く -> 在宅?
  - 在宅? -> 受け取る: "はい" (success)
  - 在宅? -> 持ち戻る: "いいえ" (error)
  - 持ち戻る -> 便に積む: "翌日もう一度" (error, dashed)
  - 受け取る -> 終わり
`;

test.describe("模様を当てた棒の図表 (#2801)", () => {
  test.describe.configure({ timeout: 300_000 });
  test.use({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: FIXED_THEME_DEVICE_SCALE_FACTOR,
  });
  const notes = new Map(fixedThemes().map((note) => [note.name, note]));
  const leads = readFixedThemeLead();

  for (const theme of ["blueprint", "sketch"] as const) {
    for (const dark of [false, true]) {
      const mode = dark ? "暗" : "明";
      test(`${theme} / ${mode}: 模様付きの棒で図形と字の対比を保つ`, async ({ page }) => {
        const note = notes.get(theme);
        const lead = leads.get(theme);
        if (!note || !lead) throw new Error(`${theme} の意匠帳を読めない`);
        await openEditorTheme(page, SINGLE_SERIES_SOURCE, theme, dark);
        const stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
        const failures: string[] = [];
        const bars = await stage.locator('[data-cdl-role="chart-bar"]').evaluateAll((elements) =>
          elements.map((element) => {
            const style = getComputedStyle(element);
            let opacity = 1;
            for (let current: Element | null = element; current !== null; current = current.parentElement) {
              opacity *= Number(getComputedStyle(current).opacity || 1);
            }
            return {
              fill: style.fill,
              stroke: style.stroke,
              strokeOpacity: Number(style.strokeOpacity || 1),
              opacity,
            };
          }));
        if (!bars.some((bar) => /^url\(["']?#/.test(bar.fill))) {
          failures.push(`${theme}/${mode}: 模様で塗った棒が 0 件`);
        }

        const shapes = await checkBoxAndLineContrast(page, stage, "chart", mode, note, lead);
        failures.push(...shapes.failures);
        const texts = await checkTextContrast(page, "chart", mode);
        failures.push(...texts.failures);
        if (texts.measured < 1) failures.push(`${theme}/${mode}: 測れた字が 0 件`);

        const face = color(note.value.face);
        for (const [index, bar] of bars.entries()) {
          const paint = effectivePaint({
            fill: note.value.face,
            fillOpacity: 1,
            stroke: bar.stroke,
            strokeOpacity: bar.strokeOpacity,
            opacity: bar.opacity,
          }, face);
          if (paint.frame === null) {
            failures.push(`${theme}/${mode}: 棒 ${index + 1} の枠が無い`);
            continue;
          }
          const ratio = contrast(paint.frame, face);
          if (ratio < 3) failures.push(`${theme}/${mode}: 棒 ${index + 1} の枠と箱の面 ${ratio.toFixed(2)}:1 < 3:1`);
        }
        expect(failures, `${theme}/${mode} の模様付きの棒の違反`).toEqual([]);
      });
    }
  }
});

test.describe("日程の図の棒と漏斗図の段 (#2801)", () => {
  test.describe.configure({ timeout: 300_000 });
  test.use({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: FIXED_THEME_DEVICE_SCALE_FACTOR,
  });
  const samples = samplesByType();
  const chartSeries = readFixedThemeChartSeries();
  const toneSeries = readFixedThemeToneSeries();

  for (const note of fixedThemes()) {
    for (const dark of [false, true]) {
      const mode = dark ? "暗" : "明";
      test(`${note.name} / ${mode}: 日程の棒・帯・担当の字と漏斗の段が表の計算後の値になる`, async ({ page }) => {
        const failures: string[] = [];
        const chart = chartSeries.get(note.name);
        const tones = toneSeries.get(note.name);
        if (!chart || !tones) throw new Error(`${note.name} の系列色と色みの対応を意匠帳から読めない`);
        const ganttColors = themeGanttSeriesColors(chart, tones);
        const gantt = await readGanttSchedule(page, 色みごとの日程, note.name, dark);
        if (gantt.bars.length !== 6) {
          failures.push(`${note.name}/${mode}: 色み付きの日程の棒が ${gantt.bars.length} 件 (6 件が要る)`);
        }
        if (gantt.ownerCount !== 6) {
          failures.push(`${note.name}/${mode}: 日程の担当の字が ${gantt.ownerCount} 件 (6 件が要る)`);
        }
        for (const [index, tone] of THEME_TONES.entries()) {
          const bar = gantt.bars[index];
          const expected = ganttColors[tones.seriesByTone[tone] - 1];
          if (!bar || !expected) continue;
          if (note.name === "sketch" && !bar.fill.includes("dragon-sketch-pen")) {
            failures.push(`${note.name}/${mode}/${tone}: 日程の帯が淡い斜線でない (${bar.fill})`);
          } else if (note.name !== "sketch") {
            const expectedFill = note.name === "neon"
              ? `rgb(${over(color(expected), 0.18, gantt.ganttGround).join(" ")})`
              : expected;
            if (colorKey(bar.fill) !== colorKey(expectedFill)) {
              failures.push(`${note.name}/${mode}/${tone}: 日程の帯 ${bar.fill} / 見本の面 ${expectedFill}`);
            }
          }
          if (bar.fillOpacity !== tones.opacity) failures.push(`${note.name}/${mode}/${tone}: 濃さ ${bar.fillOpacity} / ${tones.opacity}`);
          if (tones.stroke && colorKey(bar.stroke) !== colorKey(tones.stroke)) {
            failures.push(`${note.name}/${mode}/${tone}: 日程の枠 ${bar.stroke} / ${tones.stroke}`);
          }
          if (tones.strokeWidth !== undefined && bar.strokeWidth !== tones.strokeWidth) {
            failures.push(`${note.name}/${mode}/${tone}: 日程の枠幅 ${bar.strokeWidth} / ${tones.strokeWidth}`);
          }
          if (!bar.owner) continue;
          const ownerColor = bar.emphasis === "primary"
            ? tones.ganttOwnerColor
            : tones.ganttSecondaryOwnerColor ?? tones.ganttOwnerColor;
          if (colorKey(bar.owner.fill) !== colorKey(ownerColor)) {
            failures.push(`${note.name}/${mode}/${tone}: 担当の字 ${bar.owner.fill} / ${ownerColor}`);
          }
          if (
            bar.owner.bounds.left < bar.bounds.left ||
            bar.owner.bounds.top < bar.bounds.top ||
            bar.owner.bounds.right > bar.bounds.right ||
            bar.owner.bounds.bottom > bar.bounds.bottom
          ) {
            failures.push(`${note.name}/${mode}/${tone}: 担当「${bar.owner.text}」が日程の帯からはみ出す`);
          }
        }

        const defaultGantt = samples.get("gantt");
        if (!defaultGantt) throw new Error("色みを書かない日程の見本が無い");
        const firstGanttColor = ganttColors[0];
        if (!firstGanttColor) throw new Error(`${note.name} の日程の系列 1 が無い`);
        const plainGantt = await readGanttSchedule(page, defaultGantt, note.name, dark);
        if (plainGantt.bars.length === 0) failures.push(`${note.name}/${mode}: 色みの無い日程の棒が 0 件`);
        for (const bar of plainGantt.bars) {
          const fill = bar.fill;
          if (note.name === "sketch" && !fill.includes("dragon-sketch-pen")) {
            failures.push(`${note.name}/${mode}: 色みの無い日程が淡い斜線でない (${fill})`);
          } else if (note.name !== "sketch") {
            const expectedFill = note.name === "neon"
              ? `rgb(${over(color(firstGanttColor), 0.18, plainGantt.ganttGround).join(" ")})`
              : firstGanttColor;
            if (colorKey(fill) !== colorKey(expectedFill)) {
              failures.push(`${note.name}/${mode}: 色みの無い日程 ${fill} / 見本の面 ${expectedFill}`);
            }
          }
          if (note.name === "relief" && colorKey(fill) === colorKey(note.value.ink)) {
            failures.push(`${note.name}/${mode}: 色みの無い日程の棒が墨になっている`);
          }
        }

        const funnel = await readFunnelSchedule(page, note.name, dark);
        if (funnel.stages.length !== 6) {
          failures.push(`${note.name}/${mode}: 漏斗の段が ${funnel.stages.length} 件 (6 件が要る)`);
        }
        for (const [index, value] of funnel.stages.entries()) {
          const expected = chart.colors[index];
          if (!expected) continue;
          if (colorKey(value.fill) !== colorKey(expected)) {
            failures.push(`${note.name}/${mode}: 漏斗の段 ${index + 1} ${value.fill} / 系列 ${index + 1} ${expected}`);
          }
          if (value.fillOpacity !== tones.opacity) failures.push(`${note.name}/${mode}: 漏斗の段 ${index + 1} の濃さ ${value.fillOpacity} / ${tones.opacity}`);
        }
        if (tones.textColor) {
          if (funnel.names.length !== 6) {
            failures.push(`${note.name}/${mode}: 漏斗の段の名前が ${funnel.names.length} 件 (6 件が要る)`);
          }
          for (const fill of funnel.names) {
            if (colorKey(fill) !== colorKey(tones.textColor)) {
              failures.push(`${note.name}/${mode}: 漏斗の段の字 ${fill} / ${tones.textColor}`);
            }
          }
        }
        expect(failures, `${note.name}/${mode} の日程と漏斗の計算後の値の違反`).toEqual([]);
      });

      test(`${note.name} / ${mode}: 日程の棒・帯・担当の字と漏斗の段が対比を保つ`, async ({ page }) => {
        const failures: string[] = [];
        const gantt = await readGanttSchedule(page, 色みごとの日程, note.name, dark);
        if (gantt.bars.length !== 6) {
          failures.push(`${note.name}/${mode}: 色み付きの日程の棒が ${gantt.bars.length} 件 (6 件が要る)`);
        }
        if (gantt.ownerCount !== 6) {
          failures.push(`${note.name}/${mode}: 日程の担当の字が ${gantt.ownerCount} 件 (6 件が要る)`);
        }
        for (const [index, tone] of THEME_TONES.entries()) {
          const bar = gantt.bars[index];
          if (!bar) continue;
          if (note.name !== "sketch") {
            // 電飾の薄い面は枠で形を示すため、非文字部品の境界色を台と比べる。
            const boundary = note.name === "neon" ? color(bar.stroke) : color(bar.fill);
            const boundaryRatio = contrast(boundary, gantt.ground);
            if (boundaryRatio < 3) {
              failures.push(`${note.name}/${mode}/${tone}: 日程の棒の境と台 ${boundaryRatio.toFixed(2)}:1 < 3:1`);
            }
            if (!bar.owner) {
              failures.push(`${note.name}/${mode}/${tone}: 日程の担当の字が無い`);
              continue;
            }
            const ownerRatio = contrast(color(bar.owner.fill), color(bar.fill));
            const report = `${note.name}/${mode}/${tone}: ${ownerRatio.toFixed(2)}`;
            test.info().annotations.push({ type: "contrast", description: report });
            console.log(report);
            if (ownerRatio < 4.5) {
              failures.push(`${note.name}/${mode}/${tone}: 日程の帯と担当の字 ${ownerRatio.toFixed(2)}:1 < 4.5:1`);
            }
          }
        }
        if (note.name === "sketch") {
          const texts = await checkTextContrast(page, "gantt", mode);
          failures.push(...texts.failures);
          if (texts.measured < 1) failures.push(`${note.name}/${mode}: 日程で測れた字が 0 件`);
        }

        const defaultGantt = samples.get("gantt");
        if (!defaultGantt) throw new Error("色みを書かない日程の見本が無い");
        const plainGantt = await readGanttSchedule(page, defaultGantt, note.name, dark);
        if (plainGantt.bars.length === 0) failures.push(`${note.name}/${mode}: 色みの無い日程の棒が 0 件`);
        if (note.name !== "sketch") {
          for (const bar of plainGantt.bars) {
            const boundary = note.name === "neon" ? color(bar.stroke) : color(bar.fill);
            const ratio = contrast(boundary, plainGantt.ground);
            if (ratio < 3) {
              failures.push(`${note.name}/${mode}: 色みの無い日程の棒の境と台 ${ratio.toFixed(2)}:1 < 3:1`);
            }
          }
        }

        const funnel = await readFunnelSchedule(page, note.name, dark);
        if (funnel.stages.length !== 6) {
          failures.push(`${note.name}/${mode}: 漏斗の段が ${funnel.stages.length} 件 (6 件が要る)`);
        }
        for (const [index, value] of funnel.stages.entries()) {
          const ratio = contrast(color(value.fill), funnel.ground);
          if (ratio < 3) {
            failures.push(`${note.name}/${mode}: 漏斗の段 ${index + 1} と台 ${ratio.toFixed(2)}:1 < 3:1`);
          }
        }
        const texts = await checkTextContrast(page, "funnel", mode);
        failures.push(...texts.failures);
        if (texts.measured < 1) failures.push(`${note.name}/${mode}: 漏斗で測れた字が 0 件`);
        expect(failures, `${note.name}/${mode} の日程と漏斗の対比違反`).toEqual([]);
      });
    }
  }
});

test.describe("時間軸の番号・担当・線の札・線幅・電飾の分かれ道 (#2832)", () => {
  test.describe.configure({ timeout: 300_000 });
  test.use({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: FIXED_THEME_DEVICE_SCALE_FACTOR,
  });

  for (const theme of THEMES) {
    for (const dark of [false, true]) {
      const mode = dark ? "暗" : "明";
      test(`${theme} / ${mode}: 札の対比と線幅を描画後の計算値でも保つ`, async ({ page }) => {
        await openEditorTheme(page, 宅配の時間軸, theme, dark);
        const stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
        await expect(stage.locator(
          '[data-cdl-node]:has([data-cdl-mark="timeline-number"]) [data-cdl-role="node-label"]',
        )).toHaveCount(6);
        await expect(stage.locator('[data-cdl-role="stage-note"]')).toHaveCount(6);
        await expect(stage.locator(
          '[data-cdl-edge-label-for] [data-cdl-role="edge-label"]',
        )).toHaveCount(3);

        const titles = await stage.locator(
          '[data-cdl-lane="timeline-steps"][data-cdl-kind="card"] [data-cdl-role="node-label"]',
        ).evaluateAll((elements) => elements.map((element) => {
          const node = element.closest<SVGGraphicsElement>('[data-cdl-node]');
          const width = Number(node?.getAttribute("data-cdl-w"));
          const style = getComputedStyle(element);
          return {
            fontSize: Number.parseFloat(style.fontSize),
            fontWeight: Number.parseFloat(style.fontWeight),
            textWidth: element instanceof SVGGraphicsElement ? element.getBBox().width : Number.NaN,
            nodeWidth: width,
          };
        }));
        expect(titles, `${theme}/${mode} の時間軸の札の題`).toHaveLength(7);
        const expectedWeight = theme === "letterpress" || theme === "sketch" || theme === "neon"
          ? 800
          : 700;
        for (const [index, title] of titles.entries()) {
          expect(title.fontSize, `${theme}/${mode} の札 ${index + 1} の題の字`).toBe(25);
          expect(title.fontWeight, `${theme}/${mode} の札 ${index + 1} の題の太さ`).toBe(expectedWeight);
          expect(title.textWidth, `${theme}/${mode} の札 ${index + 1} の題の幅`).toBeLessThanOrEqual(
            title.nodeWidth,
          );
        }

        const decision = stage.locator(
          '[data-cdl-lane="timeline-axis"][data-cdl-kind="decision"]',
        );
        const decisionSize = await decision.locator(
          'g[data-cdl-role="node-body"] > path',
        ).evaluate((element) => {
          if (!(element instanceof SVGGraphicsElement)) throw new Error("分かれ道の菱形を測れない");
          const box = element.getBBox();
          return { width: box.width, height: box.height };
        });
        expect(decisionSize.width, `${theme}/${mode} の分かれ道の幅`).toBe(124);
        expect(decisionSize.height, `${theme}/${mode} の分かれ道の高さ`).toBe(92);
        const decisionTitle = await decision.locator('[data-cdl-role="node-label"]').evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).fontSize),
        );
        expect(decisionTitle, `${theme}/${mode} の「在宅?」の字`).toBe(26);

        const noLabelGap = await stage.evaluate((svg) => {
          if (!(svg instanceof SVGSVGElement)) throw new Error("時間軸の SVG を測れない");
          const edge = svg.querySelector('[data-cdl-edge][data-cdl-edge-label="いいえ"]');
          const line = edge?.querySelector('[data-cdl-role="edge-line"]');
          const edgeId = edge?.getAttribute("data-cdl-edge");
          const label = edgeId === null || edgeId === undefined
            ? null
            : svg.querySelector(
              `[data-cdl-edge-label-for="${CSS.escape(edgeId)}"] [data-cdl-role="edge-label-bg"]`,
            );
          if (!(line instanceof SVGGraphicsElement) || !(label instanceof SVGGraphicsElement)) {
            throw new Error("「いいえ」の線か札を測れない");
          }
          const rootPoint = (element: SVGGraphicsElement, x: number, y: number): DOMPoint => {
            const matrix = element.getCTM();
            if (matrix === null) throw new Error("「いいえ」の座標を測れない");
            return new DOMPoint(x, y).matrixTransform(matrix);
          };
          const lineBox = line.getBBox();
          const labelBox = label.getBBox();
          const lineY = rootPoint(line, lineBox.x, lineBox.y).y;
          const labelBottom = rootPoint(
            label,
            labelBox.x + labelBox.width / 2,
            labelBox.y + labelBox.height,
          ).y;
          return lineY - labelBottom;
        });
        expect(noLabelGap, `${theme}/${mode} の「いいえ」の札と線の間`).toBeCloseTo(20, 5);

        const labels = await stage.locator('[data-cdl-edge-label-for]').evaluateAll((elements) =>
          elements.map((element) => {
            const background = element.querySelector('[data-cdl-role="edge-label-bg"]');
            const text = element.querySelector('[data-cdl-role="edge-label"]');
            if (!background || !text) throw new Error("時間軸の線の札から面または字を読めない");
            return {
              edge: element.getAttribute("data-cdl-edge-label-for") ?? "?",
              background: getComputedStyle(background).fill,
              text: getComputedStyle(text).fill,
            };
          }),
        );
        for (const label of labels) {
          expect(
            contrast(color(label.text), color(label.background)),
            `${theme}/${mode}/${label.edge} の札の字 ${label.text} / 面 ${label.background}`,
          ).toBeGreaterThanOrEqual(4.5);
        }

        const noLine = stage.locator(
          '[data-cdl-edge][data-cdl-edge-label="いいえ"] [data-cdl-role="edge-line"]',
        );
        const returnLine = stage.locator(
          '[data-cdl-edge][data-cdl-edge-label="翌日もう一度"] [data-cdl-role="edge-line"]',
        );
        await expect(noLine).toHaveCount(1);
        await expect(returnLine).toHaveCount(1);
        expect(Number.parseFloat(await noLine.evaluate((element) => getComputedStyle(element).strokeWidth)))
          .toBe(5);
        expect(Number.parseFloat(await returnLine.evaluate((element) => getComputedStyle(element).strokeWidth)))
          .toBe(6);

        if (theme === "neon") {
          const decisionOutline = stage.locator(
            '[data-cdl-lane="timeline-axis"][data-cdl-kind="decision"][data-cdl-active="false"] '
            + 'g[data-cdl-role="node-body"] > path',
          );
          await expect(decisionOutline).toHaveCount(1);
          const decision = await decisionOutline.evaluate((element) => {
            const style = getComputedStyle(element);
            return { fill: style.fill, stroke: style.stroke, strokeWidth: style.strokeWidth };
          });
          expect(decision.fill).toBe("rgb(9, 7, 15)");
          expect(decision.stroke).toBe("rgb(0, 229, 255)");
          expect(Number.parseFloat(decision.strokeWidth)).toBe(3);
        }

        const texts = await checkTextContrast(page, "swimlane", mode);
        expect(texts.failures, `${theme}/${mode} の時間軸の字の違反`).toEqual([]);
        expect(texts.measured, `${theme}/${mode} で測れた字`).toBeGreaterThan(0);
      });
    }
  }
});
