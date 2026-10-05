import { PRESET_TYPES } from "@cardenelabs/dragon";
import { expect, test, type Page } from "@playwright/test";

import { EDITOR_SAMPLES } from "../src/data/editor-samples";
import { 六色の記法, 記法をURLに載せる } from "./box-and-edge-figure";
import {
  FIXED_THEME_DEVICE_SCALE_FACTOR,
  checkFixedThemeAcrossTypes,
  openEditorTheme,
  samplesByType,
} from "./helpers/fixed-theme-checks";
import {
  captureThemeAppear,
  themeAppearCounts,
  themeAppearSource,
  themeEdgeAppearCounts,
} from "./helpers/theme-appear-capture";
import {
  readFixedThemeChartSeries,
  readFixedThemeLead,
  readFixedThemeRoleColor,
  readFixedThemeSingleSeriesBars,
  readFixedThemeToneSeries,
  readThemeNotes,
} from "./helpers/theme-notes";

const sketch = readThemeNotes().get("sketch");
if (sketch?.mode !== "fixed") throw new Error("手描きの意匠帳が固定の表ではない");

const hexToRgb = (hex: string): string => {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${value >> 16}, ${(value >> 8) & 255}, ${value & 255})`;
};

const stage = (page: Page) => page.locator('svg[data-cdl-stage][data-cdl-palette="sketch"]');

function sample(type: string): string {
  const found = EDITOR_SAMPLES.find((value) => {
    if (!new RegExp(`^type:\\s*${type}\\s*$`, "m").test(value.code)) return false;
    return type !== "chart" || /^shape:\s*bar\s*$/m.test(value.code);
  });
  if (!found) throw new Error(`editor-samples に ${type} の見本が無い`);
  return found.code;
}

const 段のない六色の記法 = 六色の記法.replace(/\nanimation:\n[\s\S]*$/, "");

const 鍵の記法 = `title: "鍵の見本"
type: record

actors:
  - 利用者: { subtitle: "利用者", rows: ["id: bigint", "email: text"], marks: ["鍵", ""] }
`;

const 帯の記法 = `title: "帯の見本"
type: sequence

actors:
  - 利用者
  - API

flow:
  - 利用者 -> API: "頼む"
  - API -> 利用者: "返す" { kind: return }

bands:
  - API: 0..1
`;

const BOX_SHAPE_SELECTOR = [
  ':is(rect, path, ellipse, circle, polygon)[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark])',
  'g[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark]) > :is(rect, path, ellipse, circle, polygon)',
  'g[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark]) > g:not(:where([data-cdl-role="node-kind-icon"])) > :is(rect, path, ellipse, circle, polygon)',
].join(", ");

const readEdgeLabels = (page: Page) =>
  stage(page).evaluate((root) => {
    const edges = new Map(
      [...root.querySelectorAll<SVGGraphicsElement>("[data-cdl-edge]")].flatMap((edge) => {
        const id = edge.getAttribute("data-cdl-edge");
        return id === null ? [] : [[id, edge] as const];
      }),
    );
    return [...root.querySelectorAll<SVGGraphicsElement>("[data-cdl-edge-label-for]")].flatMap(
      (group) => {
        const edgeId = group.getAttribute("data-cdl-edge-label-for");
        const edge = edgeId === null ? undefined : edges.get(edgeId);
        const background = group.querySelector<SVGGraphicsElement>(
          '[data-cdl-role="edge-label-bg"]',
        );
        const label = group.querySelector<SVGGraphicsElement>('[data-cdl-role="edge-label"]');
        const line = edge?.querySelector<SVGGraphicsElement>('[data-cdl-role="edge-line"]');
        if (!edge || !background || !label || !line) return [];
        const backgroundBox = background.getBBox();
        const labelBox = label.getBBox();
        return [
          {
            tone: group.getAttribute("data-cdl-tone"),
            background: getComputedStyle(background).fill,
            frame: getComputedStyle(background).stroke,
            frameWidth: getComputedStyle(background).strokeWidth,
            line: getComputedStyle(line).stroke,
            label: getComputedStyle(label).fill,
            fits: labelBox.width <= backgroundBox.width,
          },
        ];
      },
    );
  });

test.describe("sketch theme (#2794)", () => {
  test.describe.configure({ timeout: 300_000 });
  test.use({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: FIXED_THEME_DEVICE_SCALE_FACTOR,
  });

  for (const dark of [false, true]) {
    const mode = dark ? "暗" : "明";
    test(`sketch / ${mode}: 全図種で固定色と contrast が出る`, async ({ page }) => {
      const result = await checkFixedThemeAcrossTypes(page, sketch, dark);
      console.log(
        `sketch contrast ${mode}: applied=${result.applied}/${PRESET_TYPES.size} ` +
          `boxTypes=${result.boxTypes} edgeTypes=${result.edgeTypes} ` +
          `halfFrames=${result.halfFrames} failures=${result.failures.length}`,
      );

      expect(result.applied, "sketch が当たった図種").toBe(PRESET_TYPES.size);
      expect(result.boxTypes, "箱を測れた図種が 0 件").toBeGreaterThan(0);
      expect(result.edgeTypes, "線を測れた図種が 0 件").toBeGreaterThan(0);
      expect(
        result.halfFrames,
        "描き手が半分の濃さで描いた枠を 1 件も測れていない (検査が空振りしている)",
      ).toBeGreaterThan(0);
      expect(result.failures, `sketch/${mode} の違反`).toEqual([]);
    });
  }

  test("sketch dark-ground: 全図種の地は html.dark でも意匠帳の台から変わらない", async ({
    page,
  }) => {
    const samples = samplesByType();
    const expected = hexToRgb(sketch.value.ground);
    const failures: string[] = [];
    for (const [type, source] of samples) {
      const values: string[] = [];
      for (const dark of [false, true]) {
        await openEditorTheme(page, source, "sketch", dark);
        values.push(
          await stage(page).evaluate((element) => getComputedStyle(element).backgroundColor),
        );
      }
      console.log(
        `sketch dark-ground ${type}: light=${values[0]} dark=${values[1]} ` +
          `expected=${sketch.value.ground}`,
      );
      if (values[0] !== expected || values[1] !== expected) {
        failures.push(`${type}: light ${values[0]} / dark ${values[1]} / 台 ${expected}`);
      }
    }
    expect(samples.size).toBe(PRESET_TYPES.size);
    expect(failures).toEqual([]);
  });

  test("sketch initial-animation: 箱と線は各 1 回だけ描く", async ({ page }) => {
    await captureThemeAppear(page);
    await page.goto(`editor#s=${記法をURLに載せる(themeAppearSource("sketch"))}`);
    await page.waitForSelector('svg[data-cdl-stage][data-cdl-palette="sketch"]');
    await page.waitForFunction(
      () => {
        const c = document.querySelector('[data-cdl-node="c"]');
        return c !== null && !c.hasAttribute("data-cdl-hidden");
      },
      undefined,
      { timeout: 5_000 },
    );
    await page.waitForTimeout(800);

    const edgeIds = await page
      .locator("[data-cdl-edge]")
      .evaluateAll((elements) =>
        elements.flatMap((element) => element.getAttribute("data-cdl-edge") ?? []),
      );
    const firstBoxes = await themeAppearCounts(page);
    const firstEdges = await themeEdgeAppearCounts(page);
    expect(firstBoxes).toMatchObject({ a: 1, b: 1, c: 1 });
    expect(Object.values(firstBoxes).reduce((sum, value) => sum + value, 0)).toBe(3);
    expect(Object.keys(firstEdges).sort()).toEqual([...edgeIds].sort());
    expect(Object.values(firstEdges).every((count) => count === 1)).toBe(true);

    await expect(page.locator("[data-cdl-phase-index]").first()).toHaveAttribute(
      "data-cdl-phase-index",
      "2",
      { timeout: 5_000 },
    );
    await page.waitForTimeout(500);
    const finalBoxes = await themeAppearCounts(page);
    const finalEdges = await themeEdgeAppearCounts(page);
    console.log(
      `sketch initial-animation boxes=${JSON.stringify(finalBoxes)} ` +
        `edges=${JSON.stringify(finalEdges)}`,
    );
    expect(finalBoxes).toMatchObject({ a: 1, b: 1, c: 1 });
    expect(Object.values(finalBoxes).every((count) => count <= 1)).toBe(true);
    expect(Object.values(finalEdges).every((count) => count <= 1)).toBe(true);
  });

  test("sketch initial-animation: 動きを減らす時は箱と線を描く動きを止める", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await captureThemeAppear(page);
    await page.goto(`editor#s=${記法をURLに載せる(themeAppearSource("sketch"))}`);
    await page.waitForSelector('svg[data-cdl-stage][data-cdl-palette="sketch"]');
    await page.waitForTimeout(1_800);
    const boxes = await themeAppearCounts(page);
    const edges = await themeEdgeAppearCounts(page);
    console.log(
      `sketch initial-animation reduced boxes=${JSON.stringify(boxes)} ` +
        `edges=${JSON.stringify(edges)}`,
    );
    expect(Object.values(boxes)).toEqual([]);
    expect(Object.values(edges)).toEqual([]);
    await expect(page.locator('[data-cdl-role="node-body"]')).not.toHaveCount(0);
    await expect(page.locator('[data-cdl-role="edge-line"]')).not.toHaveCount(0);
  });

  test("sketch look: 揺れ・影・斜線・札・鍵・単系列の棒が意匠帳どおりになる", async ({
    page,
  }) => {
    const lead = readFixedThemeLead().get("sketch");
    const pale = readFixedThemeRoleColor("sketch", "淡");
    const chart = readFixedThemeChartSeries().get("sketch");
    const bars = readFixedThemeSingleSeriesBars().get("sketch");
    const toneSeries = readFixedThemeToneSeries().get("sketch");
    if (!lead || !pale || !chart || !bars || !toneSeries?.stroke || toneSeries.strokeWidth === undefined) {
      throw new Error("手描きの作りの色を意匠帳から読めない");
    }

    let activeBoxes = 0;
    let normalBoxes = 0;
    for (const type of ["class", "flowchart", "chart", "sequence", "gantt"]) {
      await openEditorTheme(page, sample(type), "sketch", false);
      await expect(page.locator("filter#dragon-sketch-wobble")).toHaveCount(1);
      await expect(page.locator("pattern#dragon-sketch-pen")).toHaveCount(1);

      const boxes = await stage(page)
        .locator(BOX_SHAPE_SELECTOR)
        .evaluateAll((elements) =>
          elements.map((element) => {
            const style = getComputedStyle(element);
            return {
              active: element.closest('[data-cdl-active="true"]') !== null,
              filter: style.filter,
              stroke: style.stroke,
              width: style.strokeWidth,
            };
          }),
        );
      normalBoxes += boxes.length;
      for (const box of boxes) {
        expect(box.filter, `${type} の箱の揺れ`).toContain("url(");
        expect(box.filter, `${type} の箱の揺れ`).toContain("dragon-sketch-wobble");
        expect(box.filter, `${type} の箱の影`).toContain("drop-shadow");
        expect(box.stroke, `${type} の箱の枠`).toBe(hexToRgb(sketch.value.frame));
        expect(box.width, `${type} の箱の太さ`).toBe(box.active ? "3px" : "2px");
        if (box.active) activeBoxes += 1;
      }

      if (type === "class" || type === "flowchart") {
        const lineFilters = await stage(page)
          .locator('[data-cdl-role="edge-line"]')
          .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).filter));
        expect(lineFilters.length, `${type} の線が無い`).toBeGreaterThan(0);
        expect(
          lineFilters.every((filter) => filter.includes("dragon-sketch-wobble")),
          `${type} の線の揺れ`,
        ).toBe(true);
      }
    }
    expect(normalBoxes, "見せ方と印を持たない箱を 1 件も測れていない").toBeGreaterThan(0);
    expect(activeBoxes, "強調の箱を 1 件も測れていない").toBeGreaterThan(0);

    for (const type of ["class", "flowchart", "chart", "sequence", "gantt", "topology", "c4"]) {
      await openEditorTheme(page, sample(type), "sketch", false);
      const textFailures = await stage(page).evaluate((root, forbidden) => {
        const failures: string[] = [];
        // 図の題も含む全ての字で、字自身と祖先に揺れが届かないことを調べる (#2749)。
        for (const text of root.querySelectorAll("text")) {
          if (getComputedStyle(text).fill === forbidden) {
            failures.push(`${text.textContent ?? ""}: 一を字に使っている`);
          }
          for (let current: Element | null = text; current && current !== root.parentElement; current = current.parentElement) {
            if (getComputedStyle(current).filter.includes("dragon-sketch-wobble")) {
              failures.push(`${text.textContent ?? ""}: ${current.tagName}`);
              break;
            }
          }
        }
        return failures;
      }, hexToRgb(lead));
      expect(textFailures, `${type} の字へ一または揺れが届いた`).toEqual([]);
    }

    await openEditorTheme(page, 帯の記法, "sketch", false);
    const sequenceBands = await stage(page)
      .locator('[data-cdl-role="sequence-band"]')
      .evaluateAll((elements) =>
        elements.map((element) => {
          const style = getComputedStyle(element);
          return { fill: style.fill, stroke: style.stroke, width: style.strokeWidth };
        }),
      );
    expect(sequenceBands.length, "順序図の帯が無い").toBeGreaterThan(0);
    for (const band of sequenceBands) {
      expect(band.fill).toContain("url(");
      expect(band.fill).toContain("dragon-sketch-pen");
      expect(band.stroke).toBe(hexToRgb(sketch.value.ink));
      expect(band.width).toBe("2px");
    }

    await openEditorTheme(page, sample("gantt"), "sketch", false);
    const ganttBars = await stage(page)
      .locator('[data-cdl-role="gantt-bar"]')
      .evaluateAll((elements) =>
        elements.map((element) => {
          const style = getComputedStyle(element);
          return { fill: style.fill, stroke: style.stroke, width: style.strokeWidth };
        }),
      );
    expect(ganttBars.length, "日程の棒が無い").toBeGreaterThan(0);
    const ganttFill = chart.colors[toneSeries.seriesByTone.accent - 1];
    if (!ganttFill) throw new Error("手描きの日程の系列 1 を意匠帳から読めない");
    for (const bar of ganttBars) {
      expect(bar.fill).toBe(hexToRgb(ganttFill));
      expect(bar.stroke).toBe(hexToRgb(toneSeries.stroke));
      expect(Number.parseFloat(bar.width)).toBe(toneSeries.strokeWidth);
    }
    const penFill = await page
      .locator("pattern#dragon-sketch-pen rect")
      .evaluate((element) => getComputedStyle(element).fill);
    expect(penFill, "ペンの斜線の色").toBe(hexToRgb(pale));

    await openEditorTheme(page, sample("chart"), "sketch", false);
    const chartBars = await stage(page)
      .locator('[data-cdl-role="chart-bar"]')
      .evaluateAll((elements) =>
        elements.map((element) => {
          const style = getComputedStyle(element);
          return {
            main: element.getAttribute("data-cdl-emphasis") === "primary",
            fill: style.fill,
            opacity: style.fillOpacity,
            stroke: style.stroke,
            width: style.strokeWidth,
          };
        }),
      );
    expect(chartBars.some((bar) => bar.main), "図表に主役の棒が無い").toBe(true);
    expect(chartBars.some((bar) => !bar.main), "図表に主役でない棒が無い").toBe(true);
    for (const bar of chartBars) {
      const expected = bar.main ? bars.primary : bars.secondary;
      const pattern = /^url\((#[a-z0-9-]+)\)$/.exec(expected.fill)?.[1];
      if (!pattern || !expected.stroke || expected.strokeWidth === undefined) {
        throw new Error("手描きの単系列の棒の模様と枠を意匠帳から読めない");
      }
      expect(bar.fill, "図表の棒へペンの模様が届かない").toContain(pattern.slice(1));
      expect(bar.stroke).toBe(hexToRgb(expected.stroke));
      expect(Number.parseFloat(bar.width)).toBe(expected.strokeWidth);
      expect(bar.opacity).toBe("1");
    }

    await openEditorTheme(page, 段のない六色の記法, "sketch", false);
    const tonedLabels = await readEdgeLabels(page);
    expect(tonedLabels.length, "面に色みを持つ線の札が無い").toBe(6);
    expect(
      new Set(tonedLabels.map((label) => label.frame)),
      "札の枠に一・二・三が揃わない",
    ).toEqual(new Set(chart.colors.slice(0, 3).map(hexToRgb)));
    for (const label of tonedLabels) {
      expect(label.background).toBe(hexToRgb(sketch.value.face));
      expect(label.frame, `${label.tone} の札と線`).toBe(label.line);
      expect(label.frameWidth).toBe("2px");
      expect(label.label).toBe(hexToRgb(sketch.value.ink));
      expect(label.fits, `${label.tone} の札の字が面からはみ出す`).toBe(true);
    }

    await openEditorTheme(page, 六色の記法, "sketch", false);
    const stagedLabels = await readEdgeLabels(page);
    expect(stagedLabels.length, "段のある六色の札が揃わない").toBe(6);
    for (const label of stagedLabels) {
      expect(label.tone, "段のある札の色み").not.toBeNull();
      expect(label.background).toBe(hexToRgb(sketch.value.face));
      expect(label.frame).toBe(label.line);
      expect(label.label).toBe(hexToRgb(sketch.value.ink));
    }

    await openEditorTheme(page, 鍵の記法, "sketch", false);
    const keys = await stage(page)
      .locator('[data-cdl-role="node-row-underline"]')
      .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).stroke));
    expect(keys.length, "鍵の下線が無い").toBeGreaterThan(0);
    expect(new Set(keys), "鍵の下線が一ではない").toEqual(new Set([hexToRgb(lead)]));
  });
});
