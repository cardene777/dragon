import { expect, test, type Page } from "@playwright/test";

import {
  sourceYaml__branchParcelsBar,
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
import { sourceYaml__sortParcelsByRegion } from "../src/topics/catalog/animation.cdl";
import {
  sourceYaml__presetDeliveryFlow,
  sourceYaml__presetDeliveryMetro,
  sourceYaml__presetDeliveryStages,
  sourceYaml__presetDeliveryTimeline,
} from "../src/topics/catalog/presets.cdl";
import { sourceYaml__kindFunction } from "../src/topics/catalog/primitives.cdl";
import {
  readCdlThemeRoleTable,
  resolveThemeRole,
} from "../src/lib/theme-role-table-test-helpers";
import { 記法をURLに載せる } from "./box-and-edge-figure";
import { color, openEditorTheme, stopDiagram } from "./helpers/fixed-theme-checks";
import { contrast } from "./helpers/pixel-contrast";
import {
  readFixedThemeSingleSeriesBars,
  readFixedThemeToneSeries,
} from "./helpers/theme-notes";

const fixedThemes = [
  "blueprint",
  "letterpress",
  "catalog",
  "terminal",
  "sketch",
  "neon",
  "relief",
] as const;

const fixedToneSeries = ["accent", "teal", "success", "warning", "info", "error"] as const;

const sourceYaml__toneSeriesGantt = `title: "色みごとの日程"
type: gantt
ticks: [2026年6月, 2026年7月, 2026年8月]
actors:
${fixedToneSeries.map((tone, index) => `  - 工程${index + 1}: { value: "2026年6月+${index / 10}", end: "{end${index + 1}}", tone: ${tone} }`).join("\n")}
states:
${fixedToneSeries.map((_, index) => `  end${index + 1}: ${1 + index / 10}`).join("\n")}`;

const sourceYaml__toneSeriesFunnel = `title: "色みごとの漏斗"
type: funnel
actors:
${fixedToneSeries.map((tone, index) => `  - 段${index + 1}: { value: "${60 - index * 5}", tone: ${tone} }`).join("\n")}`;

const table = (theme: string): ReadonlyMap<string, string> => readCdlThemeRoleTable(theme).light;

function role(theme: string, name: string): string {
  const value = resolveThemeRole(table(theme), name);
  if (value === undefined) throw new Error(`${theme} の ${name} が値の表に無い`);
  return value;
}

function computedPaint(value: string): string {
  if (/^#[0-9a-f]{6}$/i.test(value)) {
    const number = Number.parseInt(value.slice(1), 16);
    return `rgb(${number >> 16}, ${(number >> 8) & 255}, ${number & 255})`;
  }
  const pattern = /^url\((#[^)]+)\)$/.exec(value)?.[1];
  return pattern === undefined ? value : `url("${pattern}")`;
}

async function computedStyleValue(page: Page, property: string, value: string): Promise<string> {
  return page.locator("svg[data-cdl-stage]").evaluate((stage, input) => {
    const probe = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    probe.style.setProperty(input.property, input.value, "important");
    stage.append(probe);
    const computed = getComputedStyle(probe).getPropertyValue(input.property).trim();
    probe.remove();
    return computed;
  }, { property, value });
}

function withoutAnimation(source: string): string {
  return source.replace(/\nanimation:\s*[\s\S]*$/u, "");
}

async function open(page: Page, source: string, theme: string): Promise<void> {
  await openEditorTheme(page, source, theme, false);
  await stopDiagram(page);
}

/** 意匠を書かない図を画面の色で開く。 色だけの意匠 (生成り・青磁) は外した (#2960) */
async function openRolelessPalette(page: Page, source: string, dark: boolean): Promise<void> {
  await page.goto(`editor#s=${記法をURLに載せる(source)}`);
  await page.reload();
  await page.waitForSelector("svg[data-cdl-stage]:not([data-cdl-palette])");
  await page.evaluate((value) => document.documentElement.classList.toggle("dark", value), dark);
  await page.waitForFunction(
    (value) => document.documentElement.classList.contains("dark") === value,
    dark,
  );
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
  await stopDiagram(page);
}

async function metroValues(page: Page, theme: string): Promise<Record<string, unknown>> {
  await open(page, sourceYaml__presetDeliveryMetro, theme);
  return page.locator("svg[data-cdl-stage]").evaluate((stage) => {
    const style = (selector: string): CSSStyleDeclaration => {
      const element = stage.querySelector<SVGElement>(selector);
      if (element === null) throw new Error(`${selector} が路線図に無い`);
      return getComputedStyle(element);
    };
    const children = [
      '[data-cdl-routing="metro"]',
      '[data-cdl-node][data-cdl-kind="station"]',
      '[data-cdl-node][data-cdl-kind="mark-start"]',
      '[data-cdl-node][data-cdl-kind="mark-end"]',
      '[data-cdl-node][data-cdl-kind="decision"]',
    ];
    const pending = stage.querySelector<SVGElement>('[data-cdl-routing="metro"][data-cdl-pending="true"]');
    return {
      network: style('[data-cdl-role="metro-network"]').filter,
      guide: style('[data-cdl-role="metro-lane-guide"]').filter,
      children: children.map((selector) => style(selector).filter),
      branchLabel: style('[data-cdl-edge-label-for][data-cdl-tone]').filter,
      edgeLine: style('[data-cdl-routing="metro"] [data-cdl-role="edge-line"]').filter,
      decisionPath: style('[data-cdl-kind="decision"] [data-cdl-role="node-body"] path').filter,
      pendingOpacity: pending === null ? null : getComputedStyle(pending).opacity,
      returnTransform: style('[data-cdl-mark="metro-return-arrow"]').transform,
      lineOpacity: style('[data-cdl-routing="metro"] [data-cdl-role="edge-line"]').strokeOpacity,
      legend: style('[data-cdl-legend-mark="dotted-line"]').getPropertyValue("--cdl-text-accent").trim(),
      legendFilter: style('[data-cdl-role="legend"]').filter,
      startBody: style('[data-cdl-role="node-body"][data-cdl-mark="start"]').filter,
      endBody: style('[data-cdl-role="node-body"][data-cdl-mark="end"]').filter,
      inner: style('[data-cdl-role="node-inner"]').filter,
      badgeFilter: style('[data-cdl-role="metro-lane-badge"] rect').filter,
      badgeStrokeWidth: style('[data-cdl-role="metro-lane-badge"] rect').strokeWidth,
      badgeTitleWeight: style('[data-cdl-role="metro-lane-badge"] text:first-of-type').fontWeight,
    };
  });
}

test("満ちる四角の枠は 4 意匠で計算後の枠の口を使う", async ({ page }) => {
  for (const theme of ["catalog", "terminal", "sketch", "relief"] as const) {
    await open(page, sourceYaml__sortParcelsByRegion, theme);
    const stage = page.locator("svg[data-cdl-stage]");
    const declared = await stage.evaluate((element) => getComputedStyle(element).getPropertyValue("--er-frame").trim());
    const expected = await computedStyleValue(page, "stroke", declared);
    const frames = stage.locator('[data-cdl-kind="dyn-rect"] [data-cdl-shape="rect"] > rect:first-child');
    await expect(frames).toHaveCount(5);
    expect(await frames.evaluateAll((elements) => elements.map((element) => getComputedStyle(element).stroke)))
      .toEqual(Array(5).fill(expected));
  }
});

test("まだ来ていない路線は現れ方の後も計算後 opacity 0.3", async ({ page }) => {
  const values = await metroValues(page, "blueprint");
  expect(values.pendingOpacity).toBe("0.3");
});

test("路線図の戻る矢じりは全 7 意匠で計算後 transform none", async ({ page }) => {
  for (const theme of fixedThemes) {
    expect((await metroValues(page, theme)).returnTransform, theme).toBe("none");
  }
});

test("浮彫の路線図は network と guide だけに陰を当てる", async ({ page }) => {
  const values = await metroValues(page, "relief");
  expect(values.network).toBe('url("#dragon-metro-relief-shadow")');
  expect(values.guide).toBe('url("#dragon-metro-relief-shadow")');
  expect(values.children).toEqual(Array(5).fill("none"));
  expect(values.branchLabel).toBe('url("#dragon-metro-relief-shadow-label")');
  expect(values.badgeFilter).toBe('url("#dragon-relief-raised")');
  expect(values.decisionPath).toBe("none");
  const shadow = page.locator('filter[id="dragon-metro-relief-shadow"]');
  await expect(shadow).toHaveAttribute("filterUnits", "userSpaceOnUse");
  await expect(shadow.locator('feGaussianBlur[in="SourceAlpha"]')).toHaveAttribute("stdDeviation", "2");
  await expect(shadow.locator('feGaussianBlur[in="SourceAlpha"]')).toHaveAttribute("result", "metro-relief-blur");
  await expect(shadow.locator('feOffset[dx="2.5"]')).toHaveAttribute("dy", "2.5");
  await expect(shadow.locator('feFlood[flood-color="rgb(160,144,120)"]')).toHaveAttribute("flood-opacity", ".55");
  await expect(shadow.locator('feOffset[dx="-2"]')).toHaveAttribute("dy", "-2");
  await expect(shadow.locator('feFlood[flood-color="#ffffff"]')).toHaveAttribute("flood-opacity", ".95");
  const labelShadow = page.locator('filter[id="dragon-metro-relief-shadow-label"]');
  await expect(labelShadow).toHaveAttribute("filterUnits", "objectBoundingBox");
  await expect(labelShadow).toHaveAttribute("x", "-10%");
  await expect(labelShadow).toHaveAttribute("y", "-50%");
  await expect(labelShadow).toHaveAttribute("width", "120%");
  await expect(labelShadow).toHaveAttribute("height", "200%");
  await expect(labelShadow.locator('feGaussianBlur[in="SourceAlpha"]')).toHaveAttribute("stdDeviation", "2");
  await expect(labelShadow.locator('feGaussianBlur[in="SourceAlpha"]')).toHaveAttribute("result", "metro-relief-label-blur");
});

test("電飾の路線図は外箱へ二段の光を当て、内側の線へ重ねない", async ({ page }) => {
  const values = await metroValues(page, "neon");
  const networkEffect = await computedStyleValue(page, "filter", role("neon", "--dragon-chart-glow-effect"));
  const labelEffect = await computedStyleValue(page, "filter", role("neon", "--dragon-metro-label-effect"));
  expect(values.network).toBe("none");
  expect(values.guide).toBe(networkEffect);
  expect(values.children).toEqual(Array(5).fill(networkEffect));
  expect(values.branchLabel).toBe(labelEffect);
  expect(values.edgeLine).toBe("none");
  expect(values.decisionPath).toBe("none");
  const glow = page.locator('filter[id="dragon-metro-neon-glow"]');
  await expect(glow.locator('feGaussianBlur[in="SourceGraphic"][stdDeviation="1.5"]'))
    .toHaveAttribute("result", "metro-neon-halo");
  await expect(glow.locator('feGaussianBlur[in="SourceGraphic"][stdDeviation="5"]'))
    .toHaveAttribute("result", "metro-neon-haze");
  await expect(glow.locator("feColorMatrix")).toHaveCount(0);
  const labelGlow = page.locator('filter[id="dragon-metro-neon-glow-label"]');
  await expect(labelGlow).toHaveAttribute("filterUnits", "objectBoundingBox");
  await expect(labelGlow).toHaveAttribute("x", "-50%");
  await expect(labelGlow).toHaveAttribute("y", "-50%");
  await expect(labelGlow).toHaveAttribute("width", "200%");
  await expect(labelGlow).toHaveAttribute("height", "200%");
  await expect(labelGlow.locator('feGaussianBlur[result="metro-neon-label-halo"]'))
    .toHaveAttribute("stdDeviation", "1.5");
  await expect(labelGlow.locator('feGaussianBlur[result="metro-neon-label-haze"]'))
    .toHaveAttribute("stdDeviation", "5");
});

test("端末の路線図は外箱へ半透明の光を当てる", async ({ page }) => {
  const values = await metroValues(page, "terminal");
  const networkEffect = await computedStyleValue(page, "filter", role("terminal", "--dragon-chart-glow-effect"));
  const labelEffect = await computedStyleValue(page, "filter", role("terminal", "--dragon-metro-label-effect"));
  expect(values.network).toBe("none");
  expect(values.guide).toBe(networkEffect);
  expect(values.children).toEqual(Array(5).fill(networkEffect));
  expect(values.branchLabel).toBe(labelEffect);
  const glow = page.locator('filter[id="dragon-metro-terminal-glow"]');
  await expect(glow.locator('feGaussianBlur[in="SourceGraphic"]')).toHaveAttribute("stdDeviation", "3.5");
  await expect(glow.locator('feGaussianBlur[in="SourceGraphic"]')).toHaveAttribute("result", "metro-terminal-blur");
  await expect(glow.locator('feFuncA[type="linear"]')).toHaveAttribute("slope", ".5");
  await expect(glow.locator('feMergeNode[in="metro-terminal-dim"]')).toHaveCount(1);
  await expect(glow.locator('feMergeNode[in="SourceGraphic"]')).toHaveCount(1);
  const labelGlow = page.locator('filter[id="dragon-metro-terminal-glow-label"]');
  await expect(labelGlow).toHaveAttribute("filterUnits", "objectBoundingBox");
  await expect(labelGlow).toHaveAttribute("x", "-10%");
  await expect(labelGlow).toHaveAttribute("y", "-50%");
  await expect(labelGlow).toHaveAttribute("width", "120%");
  await expect(labelGlow).toHaveAttribute("height", "200%");
  await expect(labelGlow.locator('feGaussianBlur[in="SourceGraphic"]')).toHaveAttribute("stdDeviation", "3.5");
  await expect(labelGlow.locator('feGaussianBlur[in="SourceGraphic"]')).toHaveAttribute("result", "metro-terminal-label-blur");
});

test("浮彫の路線図の凡例は戻る点線と同じ計算後色を使う", async ({ page }) => {
  const values = await metroValues(page, "relief");
  expect(values.legend).toBe(role("relief", "--metro-no"));
});

test("端末・電飾・浮彫の路線図は始終点の外箱だけに光と陰を当てる", async ({ page }) => {
  for (const theme of ["terminal", "neon", "relief"] as const) {
    const values = await metroValues(page, theme);
    expect(values.legendFilter, theme).toContain("dragon-flow-sign-");
    expect([values.startBody, values.endBody, values.inner], theme).toEqual(["none", "none", "none"]);
  }
});

test("路線図の線路は不透明で、まだの線だけ親の opacity 0.3", async ({ page }) => {
  for (const theme of fixedThemes) {
    const values = await metroValues(page, theme);
    expect(values.lineOpacity, theme).toBe("1");
    expect(values.pendingOpacity, theme).toBe("0.3");
  }
});

test("手描きの名札は計算後 2px の墨枠と影、太字名は 800", async ({ page }) => {
  const values = await metroValues(page, "sketch");
  expect(values.badgeStrokeWidth).toBe("2px");
  expect(values.badgeFilter).toBe(
    await computedStyleValue(page, "filter", role("sketch", "--dragon-metro-badge-effect")),
  );
  for (const theme of ["letterpress", "sketch", "neon"] as const) {
    expect((await metroValues(page, theme)).badgeTitleWeight, theme).toBe("800");
  }
});

test("発想の枝・ジャーニー・折れ線・傾き図は計算後に図表の役の色を使う", async ({ page }) => {
  const check = async (
    theme: string,
    source: string,
    selector: string,
    property: string,
    expectedRole: string,
  ): Promise<void> => {
    await open(page, source, theme);
    const actual = await page.locator(selector).first().evaluate(
      (element, name) => getComputedStyle(element).getPropertyValue(name).trim(),
      property,
    );
    expect(actual, `${theme} / ${selector}`).toBe(
      await computedStyleValue(page, property, role(theme, expectedRole)),
    );
  };
  for (const theme of fixedThemes) {
    await open(page, sourceYaml__redeliveryIdeasMind, theme);
    for (const [tone, expectedRole] of [
      ["accent", "--cdl-chart-1"],
      ["teal", "--cdl-chart-2"],
      ["success", "--theme-mind-branch-3"],
      ["warning", "--theme-mind-branch-4"],
    ] as const) {
      const strokes = await page.locator(':is([data-cdl-role="mind-edge"], [data-cdl-role="mind-leaf-underline"])')
        .evaluateAll((elements, value) => elements
          .filter((element) => element.getAttribute("stroke")?.includes(`--cdl-tone-${value}`))
          .map((element) => getComputedStyle(element).stroke), tone);
      expect(strokes.length, `${theme} / mind / ${tone}`).toBeGreaterThan(0);
      expect(strokes).toEqual(Array(strokes.length).fill(
        await computedStyleValue(page, "stroke", role(theme, expectedRole)),
      ));
    }
    await check(theme, sourceYaml__shipperFeelingJourney, '[data-cdl-role="journey-level-name"]', "fill", "--theme-journey-axis-label");
    await check(theme, sourceYaml__monthlyDeliveriesLine, '[data-cdl-role="chart-line"][data-cdl-series="0"]', "stroke", "--cdl-tone-muted");
    await open(page, sourceYaml__onTimeRateSlope, theme);
    const lines = page.locator('[data-cdl-role="chart-slope-line"][data-cdl-emphasis="primary"]');
    await expect(lines).toHaveCount(2);
    const strokes = await lines.evaluateAll((elements) => elements.map((element) => getComputedStyle(element).stroke));
    const osakaRole = table(theme).has("--dragon-chart-slope-osaka")
      ? "--dragon-chart-slope-osaka"
      : "--er-own";
    for (const [index, line, expectedRole] of [
      [0, "名古屋（accent）", "--theme-lead"],
      [1, "大阪（error）", osakaRole],
    ] as const) {
      expect(strokes[index], `${theme} / 傾き図 / ${line}`).toBe(
        await computedStyleValue(page, "stroke", role(theme, expectedRole)),
      );
    }
  }
});

test("図面・端末の方眼、端末の一覧行と時間軸番号、端末・電飾のジャーニーの光は計算後値を保つ", async ({ page }) => {
  await open(page, sourceYaml__presetDeliveryMetro, "blueprint");
  expect(await page.locator("svg[data-cdl-stage]").evaluate((stage) => getComputedStyle(stage).backgroundSize))
    .toBe("20px 20px, 20px 20px");

  await open(page, withoutAnimation(sourceYaml__presetDeliveryTimeline), "terminal");
  const timeline = await page.locator("svg[data-cdl-stage]").evaluate((stage) => {
    const numberLabel = stage.querySelector<SVGElement>(
      '[data-cdl-node="timeline-number-1"] [data-cdl-role="node-label"]',
    );
    if (numberLabel === null) throw new Error("端末の時間軸に番号 1 が無い");
    return {
      backgroundSize: getComputedStyle(stage).backgroundSize,
      numberFamily: getComputedStyle(numberLabel).fontFamily,
    };
  });
  expect(timeline.backgroundSize).toBe("auto, 22px 22px, 22px 22px");
  expect(timeline.numberFamily).toBe(
    await computedStyleValue(page, "font-family", role("terminal", "--dragon-timeline-number-font")),
  );

  for (const { name, source, markRole, rowRoles } of [
    {
      name: "升目",
      source: sourceYaml__parcelSizeWaffle,
      markRole: "chart-waffle-item-mark",
      rowRoles: ["chart-waffle-item-mark", "chart-waffle-item-label", "chart-waffle-item-share"],
    },
    {
      name: "円",
      source: sourceYaml__parcelStatusPie,
      markRole: "chart-pie-table-mark",
      rowRoles: ["chart-pie-table-mark", "chart-pie-table-label", "chart-pie-table-value"],
    },
  ] as const) {
    await open(page, source, "terminal");
    const rows = await page.locator('[data-cdl-role="terminal-row-ordinal"]').evaluateAll(
      (ordinals, input) => ordinals.map((ordinal) => {
        const row = ordinal.parentElement;
        const mark = row?.querySelector<SVGGraphicsElement>(`[data-cdl-role="${input.markRole}"]`);
        if (row === null || mark === null || mark === undefined) {
          throw new Error(`${input.name}の番号と同じ行に色の四角が無い`);
        }
        const ordinalRect = ordinal.getBoundingClientRect();
        const markRect = mark.getBoundingClientRect();
        const transforms = input.rowRoles.map((roleName) => {
          const element = row.querySelector<SVGElement>(`[data-cdl-role="${roleName}"]`);
          if (element === null) throw new Error(`${input.name}の行に ${roleName} が無い`);
          const matrix = new DOMMatrix(getComputedStyle(element).transform);
          return { roleName, x: matrix.e, y: matrix.f };
        });
        return { ordinalRight: ordinalRect.right, markLeft: markRect.left, transforms };
      }),
      { name, markRole, rowRoles },
    );
    expect(rows.length, `${name}の端末行`).toBeGreaterThan(0);
    for (const [index, row] of rows.entries()) {
      expect(row.markLeft - row.ordinalRight, `${name}の ${index + 1} 行目の番号と色の四角`).toBeGreaterThanOrEqual(0);
      for (const transform of row.transforms) {
        expect(transform, `${name}の ${index + 1} 行目の ${transform.roleName}`).toEqual({
          roleName: transform.roleName,
          x: 0,
          y: 0,
        });
      }
    }
  }

  for (const theme of ["terminal", "neon"] as const) {
    await open(page, sourceYaml__shipperFeelingJourney, theme);
    const expected = computedPaint(role(theme, "--dragon-chart-glow-effect"));
    const filters = await page.locator(
      '[data-cdl-role="journey-line"], [data-cdl-role="journey-step"] > circle, [data-cdl-role="journey-opportunity"] > text',
    ).evaluateAll((elements) => elements.map((element) => getComputedStyle(element).filter));
    expect(filters.length, `${theme} のジャーニー`).toBeGreaterThan(0);
    expect(filters.every((filter) => filter === expected), theme).toBe(true);
  }
});

test("固定 7 意匠の日程の棒と漏斗の段は計算後に表の系列色と濃さを使う", async ({ page }) => {
  const expected = readFixedThemeToneSeries();
  for (const theme of fixedThemes) {
    for (const [source, selector, prefix] of [
      [sourceYaml__toneSeriesGantt, '[data-cdl-role="gantt-bar"]', "--dragon-gantt-series-"],
      [sourceYaml__toneSeriesFunnel, '[data-cdl-role="funnel-stage"]', "--dragon-funnel-series-"],
    ] as const) {
      await open(page, source, theme);
      if (theme === "sketch" && selector === '[data-cdl-role="gantt-bar"]') {
        await expect(page.locator('pattern[id="dragon-sketch-pen"]')).toHaveCount(1);
      }
      const values = await page.locator(selector).evaluateAll((elements) =>
        elements.map((element) => {
          const declaredFill = element.getAttribute("fill") ?? "";
          return {
            tone: element.getAttribute("data-cdl-tone") ??
              /^var\(--cdl-tone-([a-z]+)/u.exec(declaredFill)?.[1] ?? null,
            fill: getComputedStyle(element).fill,
            opacity: Number(getComputedStyle(element).fillOpacity),
          };
        }));
      expect(values, `${theme} / ${selector}`).toHaveLength(fixedToneSeries.length);
      const seriesByTone = expected.get(theme)?.seriesByTone;
      if (seriesByTone === undefined) throw new Error(`${theme} の色みと系列の対応が意匠帳に無い`);
      for (const value of values) {
        if (value.tone === null || !(value.tone in seriesByTone)) {
          throw new Error(`${theme} / ${selector} の色みを読めない: ${value.tone}`);
        }
        const series = seriesByTone[value.tone as keyof typeof seriesByTone];
        const expectedRole = theme === "sketch" && selector === '[data-cdl-role="gantt-bar"]'
          ? "--dragon-chart-series-4-fill"
          : `${prefix}${series}`;
        const expectedFill = theme === "neon" && selector === '[data-cdl-role="gantt-bar"]'
          ? `color-mix(in srgb, ${role(theme, expectedRole)} 18%, ${role(theme, "--theme-neon-chart-ground")})`
          : role(theme, expectedRole);
        expect(value.fill, `${theme} / ${selector} / ${value.tone}`).toBe(
          await computedStyleValue(page, "fill", expectedFill),
        );
        expect(value.opacity, `${theme} / ${selector} / ${value.tone}`).toBe(
          Number(role(theme, "--dragon-schedule-opacity")),
        );
      }
    }
  }
});

test("時間軸の札の高さは全配色、点列・線幅・菱形・矢じりは固定 7 意匠へ計算後に当てる", async ({ page }) => {
  const source = withoutAnimation(sourceYaml__presetDeliveryTimeline);
  for (const theme of fixedThemes) {
    await open(page, source, theme);
    const measured = await page.locator("svg[data-cdl-stage]").evaluate((stage) => {
      const style = (selector: string) => {
        const element = stage.querySelector<SVGElement>(selector);
        if (element === null) throw new Error(`${selector} が時間軸に無い`);
        return getComputedStyle(element);
      };
      const label = style('[data-cdl-edge-label-for][data-cdl-tone="success"] > [data-cdl-role="edge-label-bg"]');
      const text = style('[data-cdl-edge-label-for][data-cdl-tone="success"] > [data-cdl-role="edge-label"]');
      const transform = (selector: string) => {
        const matrix = new DOMMatrix(style(selector).transform);
        return { x: matrix.a, y: matrix.d };
      };
      const returnEdge = [...stage.querySelectorAll<SVGElement>("[data-cdl-edge]")]
        .find((element) => element.getAttribute("data-cdl-edge-label") === "翌日もう一度");
      const returnLine = returnEdge?.querySelector<SVGElement>('[data-cdl-role="edge-line"]');
      if (returnLine === null || returnLine === undefined) throw new Error("戻る線が時間軸に無い");
      const returnStyle = getComputedStyle(returnLine);
      return {
        fill: label.fill,
        height: label.height,
        rx: label.rx,
        fontSize: text.fontSize,
        fontWeight: text.fontWeight,
        noWidth: style('[data-cdl-edge-label="いいえ"] [data-cdl-role="edge-line"]').strokeWidth,
        yesWidth: style('[data-cdl-edge-label="はい"] [data-cdl-role="edge-line"]').strokeWidth,
        returnDash: returnStyle.strokeDasharray,
        returnCap: returnStyle.strokeLinecap,
        returnWidth: returnStyle.strokeWidth,
        normalArrow: transform('marker:not([id$="-sm"]) > [data-cdl-role="edge-arrowhead"][data-cdl-edge-head="triangle"]'),
        smallArrow: transform('marker[id$="-sm"] > [data-cdl-role="edge-arrowhead"][data-cdl-edge-head="triangle"]'),
      };
    });
    expect(measured.fill, theme).toBe(
      await computedStyleValue(page, "fill", role(theme, "--theme-timeline-label-success-fill")),
    );
    expect(measured.height, theme).toBe("40px");
    expect(measured.rx, theme).toBe(role(theme, "--theme-timeline-label-radius"));
    expect(measured.fontSize, theme).toBe("21px");
    expect(measured.fontWeight, theme).toBe("700");
    expect(measured.noWidth, theme).toBe(role(theme, "--theme-timeline-no-width"));
    expect(measured.yesWidth, theme).toBe(role(theme, "--theme-timeline-yes-width"));
    expect(measured.returnDash, theme).toMatch(/^0(?:px)?[, ]+9\.6(?:px)?$/);
    expect(measured.returnCap, theme).toBe("round");
    expect(measured.returnWidth, theme).toBe(role(theme, "--theme-timeline-return-width"));
    expect(measured.normalArrow.x, theme).toBeCloseTo(Number(role(theme, "--theme-timeline-arrow-scale-x")), 5);
    expect(measured.normalArrow.y, theme).toBeCloseTo(Number(role(theme, "--theme-timeline-arrow-scale-y")), 5);
    expect(measured.smallArrow.x, theme).toBeCloseTo(Number(role(theme, "--theme-timeline-small-arrow-scale-x")), 5);
    expect(measured.smallArrow.y, theme).toBeCloseTo(Number(role(theme, "--theme-timeline-small-arrow-scale-y")), 5);
  }

  await open(page, source, "neon");
  const decision = await page.locator('[data-cdl-kind="decision"] g[data-cdl-role="node-body"] > :is(rect, path, ellipse, circle, polygon)').first()
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return { fill: style.fill, stroke: style.stroke, width: style.strokeWidth, filter: style.filter };
    });
  expect(decision.fill).toBe(await computedStyleValue(page, "fill", role("neon", "--er-face")));
  expect(decision.stroke).toBe(await computedStyleValue(page, "stroke", role("neon", "--er-link")));
  expect(decision.width).toBe(`${role("neon", "--dragon-flow-decision-frame-width")}px`);
  expect(decision.filter).not.toBe("none");
  expect(decision.filter).toBe(
    await computedStyleValue(page, "filter", role("neon", "--dragon-timeline-decision-effect")),
  );

  await openRolelessPalette(page, source, false);
  const height = await page.locator('[data-cdl-edge-label-for][data-cdl-tone="success"] > [data-cdl-role="edge-label-bg"]').first()
    .evaluate((element) => getComputedStyle(element).height);
  expect(height, "画面の色").toBe("40px");
});

test("7 意匠の単系列棒は計算後に意匠帳の塗り・濃さ・枠を使う", async ({ page }) => {
  const expected = readFixedThemeSingleSeriesBars();
  expect(expected.size).toBe(7);
  for (const [theme, styles] of expected) {
    await open(page, `title: "単系列"\ntype: chart\nshape: bar\nactors:\n  - A: "2"\n  - B: "1"`, theme);
    const bars = await page.locator('[data-cdl-role="chart-bar"]').evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element);
        return {
          primary: element.getAttribute("data-cdl-emphasis") === "primary",
          fill: style.fill,
          opacity: Number(style.fillOpacity),
          presentationOpacity: Number(element.getAttribute("fill-opacity") ?? "1"),
          stroke: style.stroke,
          width: Number.parseFloat(style.strokeWidth),
        };
      }));
    for (const bar of bars) {
      const want = bar.primary ? styles.primary : styles.secondary;
      const opacity = theme === "letterpress" && !bar.primary ? bar.presentationOpacity : want.opacity;
      expect(bar.opacity, `${theme} / ${bar.primary ? "主役" : "通常"}`).toBe(opacity);
      expect(bar.fill, `${theme} / ${bar.primary ? "主役" : "通常"}の塗り`).toBe(
        await computedStyleValue(page, "fill", want.fill),
      );
      if (want.stroke !== undefined) {
        expect(bar.stroke).toBe(await computedStyleValue(page, "stroke", want.stroke));
      }
      if (want.strokeWidth !== undefined) expect(bar.width).toBe(want.strokeWidth);
    }
  }
});

test("図録の漏斗の字と手描きの日程の枠は計算後に意匠帳の例外を使う", async ({ page }) => {
  const expected = readFixedThemeToneSeries();
  await open(page, sourceYaml__toneSeriesFunnel, "catalog");
  const funnelText = await page.locator('[data-cdl-role="funnel-stage"] + text').first()
    .evaluate((element) => getComputedStyle(element).fill);
  expect(funnelText).toBe(await computedStyleValue(page, "fill", expected.get("catalog")?.textColor ?? ""));
  await open(page, sourceYaml__sortingShelfGantt, "sketch");
  const gantt = await page.locator('[data-cdl-role="gantt-bar"]').first().evaluate((element) => {
    const style = getComputedStyle(element);
    return { stroke: style.stroke, width: Number.parseFloat(style.strokeWidth) };
  });
  expect(gantt).toEqual({
    stroke: await computedStyleValue(page, "stroke", expected.get("sketch")?.stroke ?? ""),
    width: expected.get("sketch")?.strokeWidth,
  });
});

async function removeReader(page: Page, property: string, roleName: string): Promise<number> {
  return page.evaluate(({ property, roleName }) => {
    let removed = 0;
    for (const sheet of [...document.styleSheets]) {
      for (const rule of [...sheet.cssRules]) {
        if (rule instanceof CSSStyleRule && rule.style.getPropertyValue(property).includes(roleName)) {
          rule.style.removeProperty(property);
          removed += 1;
        }
      }
    }
    return removed;
  }, { property, roleName });
}

async function replaceThemeRole(
  page: Page,
  theme: string,
  roleName: string,
  value: string,
): Promise<string[]> {
  return page.evaluate(({ theme, roleName, value }) => {
    const previous: string[] = [];
    for (const sheet of [...document.styleSheets]) {
      for (const rule of [...sheet.cssRules]) {
        if (
          rule instanceof CSSStyleRule &&
          rule.selectorText.includes(`[data-cdl-palette="${theme}"]`) &&
          rule.style.getPropertyValue(roleName) !== ""
        ) {
          previous.push(rule.style.getPropertyValue(roleName).trim());
          rule.style.setProperty(roleName, value);
        }
      }
    }
    return previous;
  }, { theme, roleName, value });
}

async function expectFrameOpacityToFollowThemeRole(page: Page, theme: string): Promise<void> {
  await open(page, sourceYaml__kindFunction, theme);
  const read = (): Promise<{ selector: string; values: number[] }> => page.locator("svg[data-cdl-stage]").evaluate((stage) => {
    const readers: CSSStyleRule[] = [];
    for (const sheet of [...document.styleSheets]) {
      for (const rule of [...sheet.cssRules]) {
        if (
          rule instanceof CSSStyleRule &&
          rule.style.getPropertyValue("stroke-opacity").includes("--dragon-theme-box-frame-opacity")
        ) {
          readers.push(rule);
        }
      }
    }
    const reader = readers.at(0);
    if (readers.length !== 1 || reader === undefined) {
      throw new Error(`枠の濃さを読む規則が ${readers.length} 件ある`);
    }
    const selector = reader.selectorText;
    const values = [...stage.querySelectorAll<SVGElement>(selector)]
      .map((element) => Number(getComputedStyle(element).strokeOpacity));
    return { selector, values };
  });
  const original = await read();
  const expected = Number(role(theme, "--dragon-theme-box-frame-opacity"));
  expect(original.values.length, `${theme} / 処理の箱 / ${original.selector}`).toBeGreaterThan(0);
  expect(original.values).toEqual(Array(original.values.length).fill(expected));
  expect(await replaceThemeRole(page, theme, "--dragon-theme-box-frame-opacity", "0.37"))
    .toEqual([String(expected)]);
  expect((await read()).values).toEqual(Array(original.values.length).fill(0.37));
  expect(await replaceThemeRole(page, theme, "--dragon-theme-box-frame-opacity", String(expected)))
    .toEqual(["0.37"]);
  expect((await read()).values).toEqual(original.values);
}

test("陽性対照: 図面の枠の濃さを表の CSSOM で変えると計算後値が追い、戻すと元へ戻る", async ({ page }) => {
  await expectFrameOpacityToFollowThemeRole(page, "blueprint");
});

test("陽性対照: 活版の枠の濃さを表の CSSOM で変えると計算後値が追い、戻すと元へ戻る", async ({ page }) => {
  await expectFrameOpacityToFollowThemeRole(page, "letterpress");
});

test("陽性対照: success の字が読む宣言を CSSOM から外すと計算後の色の不一致を検知する", async ({ page }) => {
  await open(page, withoutAnimation(sourceYaml__presetDeliveryTimeline), "catalog");
  const expected = await computedStyleValue(page, "fill", role("catalog", "--er-type"));
  expect(await removeReader(page, "--cdl-tone-success", "--er-type")).toBeGreaterThan(0);
  const success = await page.locator('[data-cdl-edge-label-for][data-cdl-tone="success"] > [data-cdl-role="edge-label"]').first()
    .evaluate((element) => getComputedStyle(element).fill);
  expect(success).not.toBe(expected);
});

async function presentationPaint(
  page: Page,
  selector: string,
  property: "fill" | "stroke",
): Promise<{ actual: string; background: string; presentation: string }> {
  return page.locator(selector).first().evaluate((element, name) => {
    const svg = element as SVGElement;
    const attribute = svg.getAttribute(name);
    if (attribute === null) throw new Error(`${name} の presentation attribute が無い`);
    const actual = getComputedStyle(svg).getPropertyValue(name);
    const figure = svg.closest<SVGElement>("[data-cdl-node]");
    const body = figure?.querySelector<SVGElement>(":scope > [data-cdl-role='node-body']");
    const background = body === null || body === undefined
      ? getComputedStyle(svg.ownerSVGElement ?? svg).backgroundColor
      : getComputedStyle(body).fill;
    const before = svg.style.getPropertyValue(name);
    const priority = svg.style.getPropertyPriority(name);
    svg.style.setProperty(name, attribute, "important");
    const presentation = getComputedStyle(svg).getPropertyValue(name);
    if (before === "") svg.style.removeProperty(name);
    else svg.style.setProperty(name, before, priority);
    return { actual, background, presentation };
  }, property);
}

async function presentationPaints(
  page: Page,
  selector: string,
  property: "fill" | "stroke",
): Promise<Array<{ actual: string; attribute: string; presentation: string }>> {
  return page.locator(selector).evaluateAll((elements, name) =>
    elements.map((element) => {
      const svg = element as SVGElement;
      const attribute = svg.getAttribute(name);
      if (attribute === null) throw new Error(`${name} の presentation attribute が無い`);
      const actual = getComputedStyle(svg).getPropertyValue(name);
      const before = svg.style.getPropertyValue(name);
      const priority = svg.style.getPropertyPriority(name);
      svg.style.setProperty(name, attribute, "important");
      const presentation = getComputedStyle(svg).getPropertyValue(name);
      if (before === "") svg.style.removeProperty(name);
      else svg.style.setProperty(name, before, priority);
      return { actual, attribute, presentation };
    }), property);
}

test("図面の主役の漏斗は線だけで、ジャーニーの線と節目の丸は明暗とも cdl の属性色で描く", async ({ page }) => {
  for (const dark of [false, true]) {
    const tone = dark ? "暗" : "明";
    await openEditorTheme(page, sourceYaml__orderToDeliveryFunnel, "blueprint", dark);
    await stopDiagram(page);
    const funnel = await page.locator('[data-cdl-role="funnel-proportional-bar"][data-cdl-emphasis="primary"]')
      .evaluateAll((elements) => elements.map((element) => {
        const style = getComputedStyle(element);
        return { fill: style.fill, stroke: style.stroke };
      }));
    expect(funnel.length, `図面 ${tone} / 主役の漏斗の帯`).toBeGreaterThan(0);
    expect(funnel, `図面 ${tone} / 主役の漏斗の帯`).toEqual(Array(funnel.length).fill({
      fill: "none",
      stroke: await computedStyleValue(page, "stroke", role("blueprint", "--er-line")),
    }));

    await openEditorTheme(page, withoutAnimation(sourceYaml__shipperFeelingJourney), "blueprint", dark);
    await stopDiagram(page);
    for (const selector of [
      '[data-cdl-role="journey-line"]',
      '[data-cdl-role="journey-step"] > circle',
    ]) {
      const values = await presentationPaints(page, selector, "stroke");
      expect(values.length, `図面 ${tone} / ${selector}`).toBeGreaterThan(0);
      expect(values.map(({ actual }) => actual), `図面 ${tone} / ${selector}`)
        .toEqual(values.map(({ presentation }) => presentation));
    }
    await expect(page.locator('[data-cdl-role="journey-line-glow"]'), `図面 ${tone} / cdl は光の別要素を描かない`)
      .toHaveCount(0);
  }
});

const rolelessPaletteTargets = [
  {
    source: sourceYaml__parcelStatusPie,
    targets: [
      { selector: '[data-cdl-role="chart-pie-table-label"]', property: "fill" },
      { selector: '[data-cdl-role="chart-pie-table-value"]', property: "fill" },
    ],
  },
  {
    source: sourceYaml__parcelSizeWaffle,
    targets: [
      { selector: '[data-cdl-role="chart-waffle-item-label"]', property: "fill" },
      { selector: '[data-cdl-role="chart-waffle-item-share"]', property: "fill" },
    ],
  },
  {
    source: sourceYaml__onTimeShareGauge,
    targets: [
      { selector: '[data-cdl-role="chart-gauge-value"]', property: "fill" },
      { selector: '[data-cdl-role="chart-gauge-delta"]', property: "fill" },
      { selector: '[data-cdl-role="chart-gauge-scale-endpoint"]', property: "fill" },
    ],
  },
  {
    source: sourceYaml__measureEffortQuadrant,
    targets: [
      { selector: '[data-cdl-role="quadrant-axis-name"]', property: "fill" },
      { selector: '[data-cdl-role="quadrant-label"]', property: "fill" },
    ],
  },
  {
    source: sourceYaml__monthlyDeliveriesLine,
    targets: [
      { selector: '[data-cdl-role="chart-line-value"]', property: "fill", contrast: true },
    ],
  },
  {
    source: sourceYaml__onTimeRateSlope,
    targets: [
      { selector: '[data-cdl-role="chart-slope-period"]', property: "fill" },
      { selector: '[data-cdl-role="chart-slope-label"]', property: "fill" },
      {
        selector: '[data-cdl-role="chart-slope-line"][data-cdl-emphasis="primary"]',
        property: "stroke",
        nonNone: true,
      },
    ],
  },
  {
    source: sourceYaml__branchParcelsBar,
    targets: [
      { selector: '[data-cdl-role="chart-bar-value"]', property: "fill", contrast: true },
    ],
  },
] as const;

test("画面の色の図表は明暗とも cdl の属性色を計算後の塗りと線に使う", async ({ page }) => {
  for (const dark of [false, true]) {
    const label = `画面の色 / ${dark ? "暗" : "明"}`;
    for (const { source, targets } of rolelessPaletteTargets) {
      await openRolelessPalette(page, source, dark);
      for (const target of targets) {
        const measured = await presentationPaint(page, target.selector, target.property);
        expect(measured.actual, `${label} / ${target.selector} / ${target.property}`)
          .toBe(measured.presentation);
        if ("nonNone" in target) {
          expect(measured.actual, `${label} の傾き図の線`).not.toBe("none");
        }
        if ("contrast" in target) {
          expect(measured.actual, `${label} / ${target.selector} が黒へ崩れている`)
            .not.toBe("rgb(0, 0, 0)");
          expect(
            contrast(color(measured.actual), color(measured.background)),
            `${label} / ${target.selector} / ${JSON.stringify(measured)}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  }
});

test("沈んだ工程帯と電飾の工程帯は計算後の面と枠を使う", async ({ page }) => {
  for (const theme of ["blueprint", "letterpress"] as const) {
    await open(page, sourceYaml__sortingShelfGantt, theme);
    const bars = await page.locator('[data-cdl-role="gantt-bar"][data-cdl-tone="muted"]').evaluateAll(
      (elements) => elements.map((element) => {
        const style = getComputedStyle(element);
        return { fill: style.fill, stroke: style.stroke };
      }),
    );
    expect(bars.length, `${theme} の沈んだ帯`).toBeGreaterThan(0);
    expect(bars.every(({ fill, stroke }) => fill === "none" && stroke !== "none"), theme).toBe(true);
  }

  await open(page, sourceYaml__sortingShelfGantt, "neon");
  const bars = await page.locator('[data-cdl-role="gantt-bar"][data-cdl-tone]').evaluateAll(
    (elements) => elements.map((element) => {
      const style = getComputedStyle(element);
      return { fill: style.fill, stroke: style.stroke };
    }),
  );
  expect(bars.length, "電飾の工程帯").toBeGreaterThan(0);
  expect(bars.every(({ fill, stroke }) => fill !== "none" && stroke !== "none")).toBe(true);
});

test("既定配色の暗い図表は沈んだ面と系列色を計算後に使う", async ({ page }) => {
  await page.goto(`editor#s=${記法をURLに載せる(sourceYaml__sortingShelfGantt)}`);
  await page.reload();
  await page.waitForSelector('svg[data-cdl-stage]:not([data-cdl-palette])');
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await stopDiagram(page);
  const stage = page.locator("svg[data-cdl-stage]");
  const variables = await stage.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      sunken: style.getPropertyValue("--cdl-surface-sunken").trim(),
      ground: style.getPropertyValue("--d-bg").trim(),
    };
  });
  expect(variables.sunken).toBe(variables.ground);
  const bars = await page.locator('[data-cdl-role="gantt-bar"]').evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      return { fill: style.fill, opacity: Number(style.fillOpacity) };
    }));
  expect(bars.length).toBeGreaterThan(0);
  expect(bars.every(({ fill, opacity }) => fill !== "none" && opacity > 0)).toBe(true);
});

test("図表の枠・段札・分かれ道・折れ線終点は計算後の値で描く", async ({ page }) => {
  await open(page, sourceYaml__parcelStatusPie, "relief");
  const relief = await page.locator('[data-cdl-node]:has([data-cdl-role="figure-head"])').first().evaluate((node) => {
    const frame = node.querySelector<SVGElement>("[data-cdl-frame]");
    const body = node.querySelector<SVGElement>(':scope > [data-cdl-role="node-body"]');
    if (frame === null || body === null) throw new Error("浮彫の図表枠が無い");
    return { frame: getComputedStyle(frame).filter, body: getComputedStyle(body).filter };
  });
  expect(relief.frame).toBe('url("#dragon-relief-figure-frame")');
  expect(relief.body).toBe("none");

  for (const theme of ["blueprint", "letterpress", "catalog", "terminal", "sketch"] as const) {
    await open(page, sourceYaml__presetDeliveryStages, theme);
    const cards = await page.locator('[data-cdl-kind="card"] [data-cdl-role="node-body"]').evaluateAll(
      (elements) => elements.map((element) => {
        const style = getComputedStyle(element);
        return { stroke: style.stroke, width: style.strokeWidth, filter: style.filter };
      }),
    );
    expect(cards.length, `${theme} の段札`).toBeGreaterThan(0);
    if (theme === "catalog") {
      expect(cards.every(({ stroke }) => stroke === "none"), "図録の段札の枠").toBe(true);
    }
  }

  await open(page, sourceYaml__monthlyDeliveriesLine, "catalog");
  const endpoint = await page.locator('[data-cdl-role="chart-line-value"][data-cdl-series="1"]').last()
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return { size: style.fontSize, weight: style.fontWeight };
    });
  expect(endpoint).toEqual({ size: "22px", weight: "700" });
});

test("段の箱の線・札・凡例・戻る線は 7 意匠で計算後の表の値を使う", async ({ page }) => {
  for (const theme of fixedThemes) {
    await open(page, withoutAnimation(sourceYaml__presetDeliveryStages), theme);
    const measured = await page.locator("svg[data-cdl-stage]").evaluate((stage) => {
      const style = (selector: string): CSSStyleDeclaration => {
        const element = stage.querySelector<SVGElement>(selector);
        if (element === null) throw new Error(`${selector} が段の箱に無い`);
        return getComputedStyle(element);
      };
      const returnEdge = [...stage.querySelectorAll<SVGElement>("[data-cdl-edge]")]
        .find((element) => element.getAttribute("data-cdl-edge-label") === "翌日もう一度");
      const returnLine = returnEdge?.querySelector<SVGElement>('[data-cdl-role="edge-line"]');
      if (returnLine === null || returnLine === undefined) throw new Error("戻る線が段の箱に無い");
      const returnStyle = getComputedStyle(returnLine);
      return {
        mainWidth: style('[data-cdl-edge-role="main"] [data-cdl-role="edge-line"]').strokeWidth,
        returnWidth: returnStyle.strokeWidth,
        returnDash: returnStyle.strokeDasharray,
        returnCap: returnStyle.strokeLinecap,
        legendText: style('[data-cdl-role="legend-text"]').fill,
      };
    });
    expect(measured.mainWidth, theme).toBe(`${role(theme, "--dragon-stage-edge-width")}px`);
    expect(measured.returnWidth, theme).toBe(`${role(theme, "--dragon-stage-return-width")}px`);
    expect(measured.returnDash, theme).toMatch(/^0(?:px)?[, ]+9\.6(?:px)?$/u);
    expect(measured.returnCap, theme).toBe("round");
    expect(measured.legendText, theme).toBe(
      await computedStyleValue(page, "fill", role(theme, "--dragon-stage-legend-text")),
    );
  }
});

test("画面配色の線札は明暗とも計算後の色・大きさ・太さで WCAG AA を満たす", async ({ page }) => {
  for (const dark of [false, true]) {
    await openRolelessPalette(page, withoutAnimation(sourceYaml__presetDeliveryFlow), dark);
    const labels = await page.locator('[data-cdl-edge-label-for]').evaluateAll((groups) =>
      groups.flatMap((group) => {
        const background = group.querySelector<SVGElement>('[data-cdl-role="edge-label-bg"]');
        if (background === null) return [];
        const bg = getComputedStyle(background).fill;
        return [...group.querySelectorAll<SVGElement>('[data-cdl-role="edge-label"]')].map((label) => {
          const style = getComputedStyle(label);
          return {
            foreground: style.fill,
            background: bg,
            size: Number.parseFloat(style.fontSize),
            weight: Number.parseFloat(style.fontWeight),
            family: style.fontFamily,
          };
        });
      }),
    );
    expect(labels.length, `${dark ? "暗" : "明"}の線札`).toBeGreaterThan(0);
    for (const label of labels) {
      const required = label.size >= 24 || label.size >= 18.66 && label.weight >= 700 ? 3 : 4.5;
      expect(contrast(color(label.foreground), color(label.background)), JSON.stringify(label))
        .toBeGreaterThanOrEqual(required);
      expect(label.family).toContain("Inter");
    }
  }
});
