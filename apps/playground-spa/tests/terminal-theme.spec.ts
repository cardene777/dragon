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
import { checkEdgeLabelTones, checkSingleSeriesBars } from "./helpers/label-tone-checks";
import {
  readFixedThemeChartSeries,
  readFixedThemeLead,
  readFixedThemeRoleColor,
  readThemeNotes,
} from "./helpers/theme-notes";

const terminal = readThemeNotes().get("terminal");
if (terminal?.mode !== "fixed") throw new Error("端末の意匠帳が固定の表ではない");

const hexToRgb = (hex: string): string => {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${value >> 16}, ${(value >> 8) & 255}, ${value & 255})`;
};

const stage = (page: Page) => page.locator('svg[data-cdl-stage][data-cdl-palette="terminal"]');

function sample(type: "record" | "flowchart" | "chart" | "gantt"): string {
  const found = EDITOR_SAMPLES.find((value) => {
    if (!new RegExp(`^type:\\s*${type}\\s*$`, "m").test(value.code)) return false;
    if (type === "record") return value.slug === "class";
    return type !== "chart" || /^shape:\s*bar\s*$/m.test(value.code);
  });
  if (!found) throw new Error(`editor-samples に ${type} の見本が無い`);
  return found.code;
}

const 段のない六色の記法 = 六色の記法.replace(/\nanimation:\n[\s\S]*$/, "");

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
            line: getComputedStyle(line).stroke,
            label: getComputedStyle(label).fill,
            fits: labelBox.width <= backgroundBox.width,
          },
        ];
      },
    );
  });

test.describe("terminal theme (#2793)", () => {
  test.describe.configure({ timeout: 300_000 });
  test.use({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: FIXED_THEME_DEVICE_SCALE_FACTOR,
  });

  for (const dark of [false, true]) {
    const mode = dark ? "暗" : "明";
    test(`terminal / ${mode}: 全図種で固定色と contrast が出る`, async ({ page }) => {
      const result = await checkFixedThemeAcrossTypes(page, terminal, dark);

      expect(result.applied, "terminal が当たった図種").toBe(PRESET_TYPES.size);
      expect(result.boxTypes, "箱を測れた図種が 0 件").toBeGreaterThan(0);
      expect(result.edgeTypes, "線を測れた図種が 0 件").toBeGreaterThan(0);
      expect(
        result.halfFrames,
        "描き手が半分の濃さで描いた枠を 1 件も測れていない (検査が空振りしている)",
      ).toBeGreaterThan(0);
      expect(result.failures, `terminal/${mode} の違反`).toEqual([]);
    });
  }

  test("terminal dark-ground: 全図種の地は html.dark でも意匠帳の台から変わらない", async ({
    page,
  }) => {
    const samples = samplesByType();
    const expected = hexToRgb(terminal.value.ground);
    const failures: string[] = [];
    for (const [type, source] of samples) {
      const values: string[] = [];
      for (const dark of [false, true]) {
        await openEditorTheme(page, source, "terminal", dark);
        values.push(
          await stage(page).evaluate((element) => getComputedStyle(element).backgroundColor),
        );
      }
      console.log(`terminal dark-ground ${type}: light=${values[0]} dark=${values[1]}`);
      if (values[0] !== expected || values[1] !== expected) {
        failures.push(`${type}: light ${values[0]} / dark ${values[1]} / 台 ${expected}`);
      }
    }
    expect(samples.size).toBe(PRESET_TYPES.size);
    expect(failures).toEqual([]);
  });

  test("terminal initial-animation: 箱と線は各 1 回だけ打つ", async ({ page }) => {
    await captureThemeAppear(page);
    await page.goto(`editor#s=${記法をURLに載せる(themeAppearSource("terminal"))}`);
    await page.waitForSelector('svg[data-cdl-stage][data-cdl-palette="terminal"]');
    await page.waitForFunction(
      () => {
        const c = document.querySelector('[data-cdl-node="c"]');
        return c !== null && !c.hasAttribute("data-cdl-hidden");
      },
      undefined,
      { timeout: 5_000 },
    );
    await page.waitForTimeout(1_000);

    const boxes = await themeAppearCounts(page);
    const edges = await themeEdgeAppearCounts(page);
    const edgeIds = await page
      .locator("[data-cdl-edge]")
      .evaluateAll((elements) =>
        elements.flatMap((element) => element.getAttribute("data-cdl-edge") ?? []),
      );
    console.log(
      `terminal initial-animation boxes=${JSON.stringify(boxes)} edges=${JSON.stringify(edges)}`,
    );
    expect(boxes).toMatchObject({ a: 1, b: 1, c: 1 });
    expect(Object.values(boxes).reduce((sum, value) => sum + value, 0)).toBe(3);
    expect(Object.keys(edges).sort()).toEqual([...edgeIds].sort());
    expect(Object.values(edges).every((count) => count === 1)).toBe(true);
  });

  test("terminal initial-animation: 動きを減らす時は箱と線を打たずに描く", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await captureThemeAppear(page);
    await page.goto(`editor#s=${記法をURLに載せる(themeAppearSource("terminal"))}`);
    await page.waitForSelector('svg[data-cdl-stage][data-cdl-palette="terminal"]');
    await page.waitForTimeout(1_800);
    const reducedBoxes = await themeAppearCounts(page);
    const reducedEdges = await themeEdgeAppearCounts(page);
    console.log(
      `terminal initial-animation reduced boxes=${JSON.stringify(reducedBoxes)} ` +
        `edges=${JSON.stringify(reducedEdges)}`,
    );
    expect(Object.values(reducedBoxes)).toEqual([]);
    expect(Object.values(reducedEdges)).toEqual([]);
    await expect(page.locator('[data-cdl-role="node-body"]')).not.toHaveCount(0);
    await expect(page.locator('[data-cdl-role="edge-line"]')).not.toHaveCount(0);
  });

  test("terminal look: 方眼・箱・題・等幅字・札・日程帯・単系列の棒が意匠帳どおりになる", async ({
    page,
  }) => {
    const title = readFixedThemeRoleColor("terminal", "題");
    const tagInk = readFixedThemeRoleColor("terminal", "札の字");
    const pale = readFixedThemeRoleColor("terminal", "淡");
    const lead = readFixedThemeLead().get("terminal");
    const chart = readFixedThemeChartSeries().get("terminal");
    if (!title || !tagInk || !pale || !lead || !chart)
      throw new Error("端末の作りの色を意匠帳から読めない");

    let activeBoxes = 0;
    let normalBoxes = 0;
    let titleTexts = 0;
    let chartBars = 0;
    let rowStripes = 0;
    for (const type of ["record", "flowchart", "chart"] as const) {
      await openEditorTheme(page, sample(type), "terminal", false);
      const background = await stage(page).evaluate((element) => {
        const style = getComputedStyle(element);
        return { image: style.backgroundImage, size: style.backgroundSize };
      });
      expect(background.size, `${type} の方眼の目`).toContain("44px 44px");
      expect(background.image, `${type} の方眼の線`).toContain("linear-gradient");

      const boxes = await stage(page)
        .locator('rect[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark])')
        .evaluateAll((elements) =>
          elements.map((element) => {
            const style = getComputedStyle(element);
            return {
              active: element.closest('[data-cdl-active="true"]') !== null,
              stroke: style.stroke,
              width: style.strokeWidth,
              rx: style.getPropertyValue("rx"),
              filter: style.filter,
            };
          }),
        );
      normalBoxes += boxes.length;
      for (const box of boxes) {
        expect(box.rx, `${type} の箱の角`).toBe("6px");
        if (box.active) {
          activeBoxes += 1;
          expect(box.stroke, `${type} の強調の箱の枠`).toBe(hexToRgb(lead));
          expect(box.width, `${type} の強調の箱の太さ`).toBe("1.5px");
          expect(box.filter, `${type} の強調の箱の光`).toContain("drop-shadow");
        } else {
          expect(box.stroke, `${type} の通常の箱の枠`).toBe(hexToRgb(terminal.value.frame));
          expect(box.width, `${type} の通常の箱の太さ`).toBe("1px");
        }
      }
      const stripes = await stage(page)
        .locator('[data-cdl-role="node-row-stripe"]')
        .evaluateAll((elements) =>
          elements.map((element) => {
            const style = getComputedStyle(element);
            return { rx: style.getPropertyValue("rx"), ry: style.getPropertyValue("ry") };
          }),
        );
      rowStripes += stripes.length;
      expect(
        stripes.every((stripe) => stripe.rx !== "6px" && stripe.ry !== "6px"),
        `${type} の行の帯の角`,
      ).toBe(true);

      const titles = await stage(page)
        .locator(
          '[data-cdl-node]:has([data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark])) [data-cdl-role="node-label"], [data-cdl-role="figure-title"]',
        )
        .evaluateAll((elements) =>
          elements.map((element) => {
            const style = getComputedStyle(element);
            return { fill: style.fill, filter: style.filter };
          }),
        );
      titleTexts += titles.length;
      for (const value of titles) {
        expect(value.fill, `${type} の題`).toBe(hexToRgb(title));
        expect(value.filter, `${type} の題の光`).toContain("drop-shadow");
      }

      const fonts = await stage(page)
        .locator("text")
        .evaluateAll((elements) => [
          ...new Set(elements.map((element) => getComputedStyle(element).fontFamily)),
        ]);
      expect(fonts.length, `${type} に字が無い`).toBeGreaterThan(0);
      expect(
        fonts.every((font) => font.includes("JetBrains Mono")),
        `${type} の書体`,
      ).toBe(true);

      if (type === "chart") {
        const bars = await stage(page)
          .locator('[data-cdl-role="chart-bar"]')
          .evaluateAll((elements) =>
            elements.map((element) => {
              const style = getComputedStyle(element);
              return {
                main: element.getAttribute("data-cdl-emphasis") === "primary",
                fill: style.fill,
                opacity: style.fillOpacity,
                filter: style.filter,
              };
            }),
          );
        chartBars += bars.length;
        expect(
          bars.some((bar) => bar.main),
          "図表に主役の棒が無い",
        ).toBe(true);
        expect(
          bars.some((bar) => !bar.main),
          "図表に主役でない棒が無い",
        ).toBe(true);
        for (const bar of bars) {
          expect(bar.fill).toBe(hexToRgb(bar.main ? lead : pale));
          expect(bar.opacity).toBe("1");
          if (bar.main) expect(bar.filter).toContain("drop-shadow");
        }
      }
    }
    expect(normalBoxes, "通常の箱を 1 件も測れていない").toBeGreaterThan(0);
    expect(activeBoxes, "強調の箱を 1 件も測れていない").toBeGreaterThan(0);
    expect(titleTexts, "題を 1 件も測れていない").toBeGreaterThan(0);
    expect(chartBars, "単系列の棒を 1 件も測れていない").toBeGreaterThan(0);
    expect(rowStripes, "表の箱の行の帯を 1 件も測れていない").toBeGreaterThan(0);

    await openEditorTheme(page, 段のない六色の記法, "terminal", false);
    const tonedLabels = await readEdgeLabels(page);
    expect(tonedLabels.length, "面に色みを持つ線の札が無い").toBe(6);
    expect(tonedLabels.every((label) => label.tone !== null), "段のない六色の札に色みが無い")
      .toBe(true);
    expect(
      new Set(tonedLabels.map((label) => label.background)).size,
      "札に一・二・三が揃わない",
    ).toBe(3);
    for (const label of tonedLabels) {
      expect(label.background, `${label.tone} の札と線`).toBe(label.line);
      expect(label.label, `${label.tone} の札の字`).toBe(hexToRgb(tagInk));
      expect(label.fits, `${label.tone} の札の字が面からはみ出す`).toBe(true);
    }
    expect(new Set(tonedLabels.map((label) => label.background))).toEqual(
      new Set(chart.colors.slice(0, 3).map(hexToRgb)),
    );

    await openEditorTheme(page, 六色の記法, "terminal", false);
    const stagedLabels = await readEdgeLabels(page);
    expect(stagedLabels.length, "段のある六色の札が揃わない").toBe(6);
    for (const label of stagedLabels) {
      expect(label.tone, "段のある札の色み").not.toBeNull();
      expect(label.background, `${label.tone} の札と線`).toBe(label.line);
      expect(label.label, `${label.tone} の札の字`).toBe(hexToRgb(tagInk));
      expect(label.fits, `${label.tone} の札の字が面からはみ出す`).toBe(true);
    }

    await openEditorTheme(page, sample("gantt"), "terminal", false);
    const ganttRows = await stage(page)
      .locator('[data-cdl-role="gantt-row"]')
      .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).fill));
    expect(ganttRows.length, "日程の帯が無い").toBeGreaterThan(0);
    expect(new Set(ganttRows), "日程の帯が意匠帳の縞ではない").toEqual(
      new Set([hexToRgb(terminal.value.stripe)]),
    );
  });

  test("terminal labels: 非強調札と主役札が意匠帳どおりになる", async ({ page }, testInfo) => {
    const report = await checkEdgeLabelTones(page, "terminal");
    console.log(report);
    testInfo.annotations.push({ type: "terminal labels", description: report });
  });

  test("terminal bars: 単系列の棒を意味属性で選ぶ", async ({ page }, testInfo) => {
    const report = await checkSingleSeriesBars(page, "terminal");
    console.log(report);
    testInfo.annotations.push({ type: "terminal bars", description: report });
  });
});
