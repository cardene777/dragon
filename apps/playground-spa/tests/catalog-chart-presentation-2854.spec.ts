import { expect, test } from "@playwright/test";

import {
  deliveryOfficeTree,
  redeliveryIdeasMind,
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
  sourceYaml__presetDeliveryMetro,
  sourceYaml__presetDeliveryStages,
  sourceYaml__presetDeliveryTimeline,
} from "../src/topics/catalog/presets.cdl";
import { openEditorTheme } from "./helpers/fixed-theme-checks";

const 意匠 = ["blueprint", "letterpress", "catalog", "terminal", "sketch", "neon", "relief"] as const;

function 色の成分(value: string): [red: number, green: number, blue: number, alpha: number] | undefined {
  const values = value.match(/\d+(?:\.\d+)?/gu)?.map(Number) ?? [];
  if (values.length < 3 || values.some((component) => !Number.isFinite(component))) {
    return undefined;
  }
  return [values[0]!, values[1]!, values[2]!, values[3] ?? 1];
}

function 色を成分ごとに比べる(actual: string, expected: string, message: string): void {
  const actualComponents = 色の成分(actual);
  const expectedComponents = 色の成分(expected);
  if (actualComponents === undefined || expectedComponents === undefined) {
    expect(actual, message).toBe(expected);
    return;
  }
  for (let index = 0; index < 3; index += 1) {
    expect(
      Math.abs(actualComponents[index]! - expectedComponents[index]!),
      `${message}の RGB ${index + 1} 成分`,
    ).toBeLessThanOrEqual(0.5);
  }
  expect(
    Math.abs(actualComponents[3] - expectedComponents[3]),
    `${message}の alpha 成分`,
  ).toBeLessThanOrEqual(0.005);
}

const 傾きの主役色 = {
  blueprint: ["rgb(20, 58, 82)", "rgb(168, 67, 31)"],
  letterpress: ["rgb(200, 67, 31)", "rgb(26, 21, 16)"],
  catalog: ["rgb(220, 164, 67)", "rgb(232, 112, 90)"],
  terminal: ["rgb(74, 222, 128)", "rgb(245, 196, 81)"],
  sketch: ["rgb(210, 73, 31)", "rgb(42, 92, 168)"],
  neon: ["rgb(255, 46, 151)", "rgb(255, 208, 0)"],
  relief: ["rgb(196, 87, 60)", "rgb(201, 154, 53)"],
} as const;

const 路線の駅面 = {
  blueprint: "rgb(227, 233, 234)",
  letterpress: "rgb(240, 234, 220)",
  catalog: "rgb(244, 238, 226)",
  terminal: "rgb(8, 17, 11)",
  sketch: "rgb(255, 253, 247)",
  neon: "rgb(9, 7, 15)",
  relief: "rgb(232, 227, 218)",
} as const;

const 固定尺の沈んだ色 = {
  blueprint: "rgb(138, 163, 177)",
  letterpress: "rgb(157, 147, 130)",
  catalog: "rgb(156, 147, 129)",
  terminal: "rgb(53, 85, 66)",
  sketch: "rgb(154, 144, 128)",
  neon: "rgb(143, 134, 179)",
  relief: "rgb(169, 158, 142)",
} as const;

const 放射の枠 = {
  blueprint: { rootWidth: "2.25px", boxWidth: "1px", radius: "12px" },
  letterpress: { rootWidth: "3px", boxWidth: "1.5px", radius: "12px" },
  catalog: { rootWidth: "0px", boxWidth: "0px", radius: "12px" },
  terminal: { rootWidth: "1px", boxWidth: "1px", radius: "6px" },
  sketch: { rootWidth: "3px", boxWidth: "2px", radius: "19px" },
  neon: { rootWidth: "2px", boxWidth: "2px", radius: "16px" },
  relief: { rootWidth: "0px", boxWidth: "0px", radius: "22px" },
} as const;

test("図表8種へ #2854 3段目b の欄を描き、枠を他の図形へ漏らさない", async ({ page }) => {
  await openEditorTheme(page, sourceYaml__monthlyDeliveriesLine, "blueprint");
  let stage = page.locator('svg[data-cdl-stage][data-cdl-palette="blueprint"]');
  await expect(stage.locator('[data-cdl-role="chart-line"]')).toHaveCount(2);
  await expect(stage.locator('[data-cdl-role="chart-line-point"][data-cdl-series="0"]')).toHaveCount(0);
  await expect(stage.locator('[data-cdl-role="chart-line-point"][data-cdl-series="1"]')).toHaveCount(5);
  await expect(stage.locator('[data-cdl-role="chart-line-value"][data-cdl-series="0"]')).toHaveText(["計画 1,600"]);
  await expect(stage.locator('[data-cdl-role="chart-line-value"][data-cdl-series="1"]')).toHaveText(["900", "1,750"]);

  await openEditorTheme(page, sourceYaml__parcelStatusPie, "blueprint");
  stage = page.locator('svg[data-cdl-stage][data-cdl-palette="blueprint"]');
  await expect(stage.getByText("件", { exact: true })).toHaveCount(1);
  await expect(stage.locator('[data-cdl-role="chart-pie-table-mark"]')).toHaveCount(4);
  const pieRight = await stage.locator('[data-cdl-role="chart-pie-slice"]').evaluateAll((nodes) =>
    Math.max(...nodes.map((node) => (node as SVGGraphicsElement).getBBox().x + (node as SVGGraphicsElement).getBBox().width)),
  );
  const pieTableLeft = await stage.locator('[data-cdl-role="chart-pie-table-mark"]').first().evaluate(
    (node) => (node as SVGGraphicsElement).getBBox().x,
  );
  expect(pieTableLeft, "円の一覧は円の右に置く").toBeGreaterThan(pieRight);
  const pieSliceFills = await stage.locator('[data-cdl-role="chart-pie-slice"]').evaluateAll((nodes) =>
    nodes.map((node) => getComputedStyle(node).fill),
  );
  expect(pieSliceFills.every((fill) => fill !== "none"), "円の扇を枠にしていない").toBe(true);

  await openEditorTheme(page, sourceYaml__orderToDeliveryFunnel, "blueprint");
  stage = page.locator('svg[data-cdl-stage][data-cdl-palette="blueprint"]');
  await expect(stage.locator('[data-cdl-role="funnel-proportional-bar"]')).toHaveCount(4);
  await expect(stage.getByText(/^(28|85|95)%$/u)).toHaveText(["28%", "85%", "95%"]);
  const funnelFills = await stage.locator('[data-cdl-role="funnel-proportional-bar"]').evaluateAll((nodes) =>
    nodes.map((node) => getComputedStyle(node).fill),
  );
  expect(funnelFills).toEqual(["none", "none", "none", "none"]);

  await openEditorTheme(page, sourceYaml__measureEffortQuadrant, "blueprint");
  stage = page.locator('svg[data-cdl-stage][data-cdl-palette="blueprint"]');
  const axisNames = stage.locator('[data-cdl-role="quadrant-axis-name"]');
  await expect(axisNames).toHaveText([/手間\s*→/u, /効き目\s*→/u]);
  expect(await axisNames.nth(1).getAttribute("transform"), "縦軸の → を上向きの ↑ として描く").toContain("rotate(-90");

  await openEditorTheme(page, sourceYaml__onTimeRateSlope, "blueprint");
  stage = page.locator('svg[data-cdl-stage][data-cdl-palette="blueprint"]');
  await expect(stage.locator('[data-cdl-role="chart-slope-period"]')).toHaveText(["先月", "今月"]);
  await expect(stage.locator('[data-cdl-role="chart-slope-line"][data-cdl-emphasis="primary"]')).toHaveCount(2);
  // cdl 0.132.0 は左右の名札を一体の chart-slope-label role で描く。
  await expect(stage.locator('[data-cdl-role="chart-slope-label"][data-cdl-emphasis="primary"]')).toContainText([
    "名古屋",
    "名古屋",
    "大阪",
    "大阪",
  ]);

  await openEditorTheme(page, sourceYaml__parcelSizeWaffle, "blueprint");
  stage = page.locator('svg[data-cdl-stage][data-cdl-palette="blueprint"]');
  const waffleRight = await stage.locator('[data-cdl-role="chart-waffle-cell"]').evaluateAll((nodes) =>
    Math.max(...nodes.map((node) => (node as SVGGraphicsElement).getBBox().x + (node as SVGGraphicsElement).getBBox().width)),
  );
  const waffleLegendLeft = await stage.locator('[data-cdl-role="chart-waffle-item"]').first().evaluate(
    (node) => (node as SVGGraphicsElement).getBBox().x,
  );
  expect(waffleLegendLeft, "升目の一覧は升目の右に置く").toBeGreaterThan(waffleRight);
  const waffleMarkFills = await stage.locator('[data-cdl-role="chart-waffle-item-mark"]').evaluateAll((nodes) =>
    nodes.map((node) => getComputedStyle(node).fill),
  );
  expect(waffleMarkFills.every((fill) => fill !== "none"), "升目の一覧の印を枠にしていない").toBe(true);

  await openEditorTheme(page, sourceYaml__deliveryResultStacked, "blueprint");
  stage = page.locator('svg[data-cdl-stage][data-cdl-palette="blueprint"]');
  await expect(stage.locator('[data-cdl-role="chart-stacked-bar-row"]')).toHaveCount(5);
  const stackedLegendBottom = await stage.locator('[data-cdl-role="chart-stacked-bar-legend"]').evaluateAll((nodes) =>
    Math.max(...nodes.map((node) => (node as SVGGraphicsElement).getBBox().y + (node as SVGGraphicsElement).getBBox().height)),
  );
  const stackedRowsTop = await stage.locator('[data-cdl-role="chart-stacked-bar-row"]').evaluateAll((nodes) =>
    Math.min(...nodes.map((node) => (node as SVGGraphicsElement).getBBox().y)),
  );
  expect(stackedLegendBottom, "内訳の凡例は帯より上に置く").toBeLessThan(stackedRowsTop);
  const stackedFills = await stage.locator('[data-cdl-role="chart-stacked-bar-slice"]').evaluateAll((nodes) =>
    nodes.map((node) => getComputedStyle(node).fill),
  );
  expect(stackedFills).toHaveLength(15);
  expect(stackedFills.every((fill) => fill === "none"), "図面の帯を全区画とも枠で描く").toBe(true);
  const legendFills = await stage.locator('[data-cdl-role="chart-stacked-bar-legend"] rect').evaluateAll((nodes) =>
    nodes.map((node) => getComputedStyle(node).fill),
  );
  expect(legendFills.every((fill) => fill !== "none"), "凡例の色見本は塗りのまま").toBe(true);

  await openEditorTheme(page, sourceYaml__onTimeShareGauge, "blueprint");
  stage = page.locator('svg[data-cdl-stage][data-cdl-palette="blueprint"]');
  await expect(stage.locator('[data-cdl-role="chart-gauge-value"]')).toHaveText("78%");
  await expect(stage.locator('[data-cdl-role="chart-gauge-delta"]')).toHaveText("先月より +6");
  await expect(stage.locator('[data-cdl-role="chart-gauge-target"]')).toHaveCount(1);
  const muted = await stage.evaluate((node) => {
    const probe = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    probe.style.fill = "var(--cdl-tone-muted)";
    node.append(probe);
    const fill = getComputedStyle(probe).fill;
    probe.remove();
    return fill;
  });
  const remaining = await stage.locator('[data-cdl-role="chart-gauge-fixed-scale"]').evaluate(
    (node) => getComputedStyle(node).fill,
  );
  expect(remaining, "固定尺の残りの弧は意匠の沈んだ色").toBe(muted);
});

for (const theme of 意匠) {
  test(`${theme}: 固定尺の半円の残りを意匠の沈んだ色で描く`, async ({ page }) => {
    await openEditorTheme(page, sourceYaml__onTimeShareGauge, theme);
    const stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
    const remaining = stage.locator('[data-cdl-role="chart-gauge-fixed-scale"]');
    await expect(remaining).toHaveCount(1);
    expect(await remaining.evaluate((node) => getComputedStyle(node).fill)).toBe(固定尺の沈んだ色[theme]);
  });

  test(`${theme}: 円と升目の一覧の字を重ねず意匠へ合わせる`, async ({ page }) => {
    await openEditorTheme(page, sourceYaml__parcelStatusPie, theme);
    const stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
    const mark = stage.locator('[data-cdl-role="chart-pie-table-mark"]').first();
    const label = stage.locator('[data-cdl-role="chart-pie-table-label"]').first();
    const value = stage.locator('[data-cdl-role="chart-pie-table-value"]').first();
    const rule = stage.locator('[data-cdl-role="chart-pie-table-rule"]').first();
    const styles = await Promise.all([
      mark.evaluate((node) => ({ rx: getComputedStyle(node).rx, transform: getComputedStyle(node).transform })),
      label.evaluate((node) => ({ family: getComputedStyle(node).fontFamily, size: getComputedStyle(node).fontSize })),
      value.evaluate((node) => ({ family: getComputedStyle(node).fontFamily, size: getComputedStyle(node).fontSize })),
      rule.evaluate((node) => ({ display: getComputedStyle(node).display, dash: getComputedStyle(node).strokeDasharray })),
    ]);

    // 図表の見本頁は円の一覧名を `.nm` 22px、値を `.ty` 19px で描く。
    expect(styles[1].size).toBe("22px");
    expect(styles[2].size).toBe("19px");
    expect(styles[2].family).toContain("JetBrains Mono");
    if (theme === "terminal") expect(styles[1].family).toContain("JetBrains Mono");
    else expect(styles[1].family).toContain("Noto Sans JP");

    if (theme === "blueprint") expect(styles[0].transform).not.toBe("none");
    else expect(styles[0].transform).toBe("none");
    if (theme === "blueprint" || theme === "letterpress" || theme === "terminal" || theme === "sketch")
      expect(styles[3].display).not.toBe("none");
    else expect(styles[3].display).toBe("none");

    const pieRows = await stage.evaluate((element) => {
      const labels = [...element.querySelectorAll<SVGTextElement>('[data-cdl-role="chart-pie-table-label"]')];
      const values = [...element.querySelectorAll<SVGTextElement>('[data-cdl-role="chart-pie-table-value"]')];
      return labels.map((label, index) => {
        const value = values[index];
        if (!value) throw new Error("円の一覧値が足りない");
        const l = label.getBBox();
        const v = value.getBBox();
        return { gap: v.x - (l.x + l.width), labelY: l.y + l.height / 2, valueY: v.y + v.height / 2 };
      });
    });
    expect(pieRows.every((row) => row.gap > 0), "円の一覧名と値が重ならない").toBe(true);
    expect(pieRows.every((row) => Math.abs(row.labelY - row.valueY) < 1), "円の一覧名と値が同じ行").toBe(true);

    await openEditorTheme(page, sourceYaml__parcelSizeWaffle, theme);
    const waffleStage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
    const waffleRows = await waffleStage.evaluate((element) => {
      const labels = [...element.querySelectorAll<SVGTextElement>('[data-cdl-role="chart-waffle-item-label"]')];
      const values = [...element.querySelectorAll<SVGTextElement>('[data-cdl-role="chart-waffle-item-share"]')];
      return labels.map((label, index) => {
        const value = values[index];
        if (!value) throw new Error("升目の一覧値が足りない");
        const l = label.getBBox();
        const v = value.getBBox();
        return {
          gap: v.x - (l.x + l.width),
          labelSize: Number.parseFloat(getComputedStyle(label).fontSize),
          labelSvgSize: Number.parseFloat(label.getAttribute("font-size") ?? "NaN"),
          valueSize: Number.parseFloat(getComputedStyle(value).fontSize),
          valueSvgSize: Number.parseFloat(value.getAttribute("font-size") ?? "NaN"),
        };
      });
    });
    expect(waffleRows.every((row) => row.gap > 0), "升目の一覧名と値が重ならない").toBe(true);
    expect(
      waffleRows.every(
        (row) => Number.isFinite(row.labelSvgSize) && Math.abs(row.labelSize - row.labelSvgSize) <= 0.01,
      ),
      "升目の一覧名は cdl の級",
    ).toBe(true);
    expect(
      waffleRows.every(
        (row) => Number.isFinite(row.valueSvgSize) && Math.abs(row.valueSize - row.valueSvgSize) <= 0.01,
      ),
      "升目の一覧値は cdl の級",
    ).toBe(true);
  });

  test(`${theme}: 漏斗・円・内訳の帯・折れ線を最終画面の値で描く`, async ({ page }) => {
    await openEditorTheme(page, sourceYaml__orderToDeliveryFunnel, theme);
    let stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
    const funnelBars = stage.locator('[data-cdl-role="funnel-proportional-bar"]');
    await expect(funnelBars, `${theme}: 漏斗の4段を測れない`).toHaveCount(4);
    const funnelPaint = await stage.evaluate((element) => {
      const probe = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      probe.style.fill = "var(--cdl-tone-muted)";
      element.append(probe);
      const muted = getComputedStyle(probe).fill;
      probe.style.fill = "var(--er-ink)";
      const ink = getComputedStyle(probe).fill;
      probe.style.fill = "color-mix(in srgb, var(--cdl-chart-4) 18%, var(--theme-neon-chart-ground))";
      const neonFill = getComputedStyle(probe).fill;
      probe.style.stroke = "color-mix(in srgb, var(--cdl-chart-4) 35%, white 65%)";
      const neonStroke = getComputedStyle(probe).stroke;
      probe.remove();
      const bars = [...element.querySelectorAll<SVGElement>('[data-cdl-role="funnel-proportional-bar"]')]
        .map((bar) => {
          const style = getComputedStyle(bar);
          return {
            emphasis: bar.getAttribute("data-cdl-emphasis"),
            fill: style.fill,
            stroke: style.stroke,
            tone: bar.getAttribute("data-cdl-tone"),
          };
        });
      return { ink, muted, neonFill, neonStroke, bars };
    });
    // cdl の proportional-bars は tone を DOM 属性へ写さない。charts.cdl.ts の記法と計算後の絵を別々に測る。
    const sourceTones = [...sourceYaml__orderToDeliveryFunnel.matchAll(
      /^\s*-\s+[^:]+:\s+\{(.+)\}\s*$/gmu,
    )].slice(0, 4).map(([, fields]) => /\btone:\s*([a-z-]+)/u.exec(fields ?? "")?.[1] ?? null);
    expect.soft(sourceTones, `${theme}: 漏斗の記法の沈んだ3段と主役段`).toEqual([
      "muted",
      "muted",
      "muted",
      null,
    ]);
    expect.soft(
      funnelPaint.bars.map(({ tone }) => tone),
      `${theme}: proportional-bars は tone 属性を描かない; paints=${JSON.stringify(funnelPaint.bars)}`,
    ).toEqual([null, null, null, null]);
    const mutedPairs = funnelPaint.bars.slice(0, 3).map(({ fill, stroke }) => ({ fill, stroke }));
    expect.soft(
      new Set(mutedPairs.map(({ fill, stroke }) => `${fill}|${stroke}`)).size,
      `${theme}: 漏斗1〜3段の塗りと枠が揃わない; paints=${JSON.stringify(funnelPaint.bars)}`,
    ).toBe(1);
    expect.soft(
      mutedPairs[0],
      `${theme}: 漏斗1〜3段が4段目と同じ; paints=${JSON.stringify(funnelPaint.bars)}`,
    ).not.toEqual(funnelPaint.bars[3] === undefined
      ? undefined
      : { fill: funnelPaint.bars[3].fill, stroke: funnelPaint.bars[3].stroke });
    // figs-more.mjs の c.淡 / c.一を、各意匠の CSS が次の計算後の面と枠へ写す。
    const expectedMuted = theme === "blueprint"
      ? { fill: "none", stroke: funnelPaint.muted }
      : theme === "letterpress"
      ? { fill: "none", stroke: funnelPaint.ink }
      : theme === "sketch"
      ? { fill: 'url("#dragon-sketch-pen")', stroke: "rgb(43, 38, 32)" }
      : theme === "neon"
      ? { fill: funnelPaint.neonFill, stroke: funnelPaint.neonStroke }
      : theme === "relief"
      ? { fill: 'url("#dragon-relief-chart-4")', stroke: "none" }
      : { fill: funnelPaint.muted, stroke: "none" };
    expect.soft(mutedPairs[0], `${theme}: 漏斗1〜3段の意匠別の面と枠`).toEqual(expectedMuted);

    await openEditorTheme(page, sourceYaml__parcelStatusPie, theme);
    stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
    const pieCenter = await stage.locator('[data-cdl-kind="chart-pie"]').evaluate((element) => {
      const total = element.querySelector<SVGTextElement>('text:not([data-cdl-role])[font-weight="600"]');
      const unit = [...element.querySelectorAll<SVGTextElement>("text")]
        .find((text) => text.textContent === "件");
      if (!total || !unit) throw new Error("円の中心の合計か「件」が無い");
      const totalBox = total.getBBox();
      const unitBox = unit.getBBox();
      return {
        total: {
          text: total.textContent,
          x: totalBox.x,
          y: totalBox.y,
          width: totalBox.width,
          height: totalBox.height,
        },
        unit: {
          text: unit.textContent,
          x: unitBox.x,
          y: unitBox.y,
          width: unitBox.width,
          height: unitBox.height,
        },
      };
    });
    expect.soft(
      pieCenter.unit.y,
      `${theme}: 「件」の上端が合計の下端以下でない; center=${JSON.stringify(pieCenter)}`,
    ).toBeGreaterThan(pieCenter.total.y + pieCenter.total.height);
    expect.soft(
      Math.abs(
        pieCenter.unit.x + pieCenter.unit.width / 2 -
          (pieCenter.total.x + pieCenter.total.width / 2),
      ),
      `${theme}: 「件」と合計の横中心が4を超えてずれている; center=${JSON.stringify(pieCenter)}`,
    ).toBeLessThanOrEqual(4);

    await openEditorTheme(page, sourceYaml__deliveryResultStacked, theme);
    stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
    const stackedSlices = stage.locator('[data-cdl-role="chart-stacked-bar-slice"]');
    await expect(stackedSlices, `${theme}: 内訳の帯15区画を測れない`).toHaveCount(15);
    const slicePaints = await stackedSlices.evaluateAll((slices) => slices.map((slice) => {
      const style = getComputedStyle(slice);
      return { fill: style.fill, stroke: style.stroke };
    }));
    if (theme === "blueprint") {
      expect.soft(
        slicePaints.every(({ fill }) => fill === "none"),
        `${theme}: 内訳の帯に塗られた区画がある; paints=${JSON.stringify(slicePaints)}`,
      ).toBe(true);
      expect.soft(
        slicePaints.every(({ stroke }) => stroke !== "none"),
        `${theme}: 内訳の帯に枠の無い区画がある; paints=${JSON.stringify(slicePaints)}`,
      ).toBe(true);
    } else if (theme === "letterpress") {
      const primary = await stackedSlices.evaluateAll((slices) => slices.map((slice) => ({
        fill: getComputedStyle(slice).fill,
        primary: slice.getAttribute("data-cdl-emphasis") === "primary",
        stroke: getComputedStyle(slice).stroke,
      })));
      expect.soft(primary.filter(({ primary: value }) => value).every(({ fill }) => fill !== "none"),
        "活版の内訳は主役の区画だけを赤で塗る").toBe(true);
      expect.soft(primary.filter(({ primary: value }) => !value).every(({ fill, stroke }) =>
        fill === "none" && stroke !== "none"), "活版の内訳は主役以外を墨の枠で描く").toBe(true);
    } else {
      expect.soft(
        slicePaints.every(({ fill }) => fill !== "none"),
        `${theme}: 内訳の帯に塗りの無い区画がある; paints=${JSON.stringify(slicePaints)}`,
      ).toBe(true);
    }
    // figs-more.mjs の帯の凡例は7意匠とも系列色の塗りを残す。
    const legendFills = await stage
      .locator('[data-cdl-role="chart-stacked-bar-legend"] rect')
      .evaluateAll((marks) => marks.map((mark) => getComputedStyle(mark).fill));
    expect.soft(legendFills.length, `${theme}: 内訳の凡例の色見本を測れない`).toBeGreaterThan(0);
    expect.soft(
      legendFills.every((fill) => fill !== "none"),
      `${theme}: 内訳の凡例の色見本が塗られていない; fills=${JSON.stringify(legendFills)}`,
    ).toBe(true);

    await openEditorTheme(page, sourceYaml__monthlyDeliveriesLine, theme);
    stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
    const planLine = stage.locator('[data-cdl-role="chart-line"][data-cdl-series="0"]');
    const actualLine = stage.locator('[data-cdl-role="chart-line"][data-cdl-series="1"]');
    await expect(planLine, `${theme}: 計画の線を1本に特定できない`).toHaveCount(1);
    await expect(actualLine, `${theme}: 実績の線を1本に特定できない`).toHaveCount(1);
    const [planStroke, actualStroke] = await Promise.all([
      planLine.evaluate((line) => ({
        dash: getComputedStyle(line).strokeDasharray,
        pathLength: line.getAttribute("pathLength"),
      })),
      actualLine.evaluate((line) => ({
        dash: getComputedStyle(line).strokeDasharray,
        pathLength: line.getAttribute("pathLength"),
      })),
    ]);
    expect.soft(
      planStroke.dash !== "" && planStroke.dash !== "none" && planStroke.dash !== "1px" &&
        planStroke.pathLength === null,
      `${theme}: 計画の線が意味上の点線でない; stroke=${JSON.stringify(planStroke)}`,
    ).toBe(true);
    // cdl は実線を pathLength=1 / dasharray=1 で描き伸ばす。点線は mask で伸ばすため両者を区別できる。
    expect.soft(
      actualStroke.pathLength === "1" && actualStroke.dash === "1px",
      `${theme}: 実績の線が描き伸ばす実線でない; stroke=${JSON.stringify(actualStroke)}`,
    ).toBe(true);
    await expect(
      stage.locator('[data-cdl-role="chart-line-point"][data-cdl-series="0"]'),
      `${theme}: 計画の線に点の印がある`,
    ).toHaveCount(0);
    const actualPoints = stage.locator('[data-cdl-role="chart-line-point"][data-cdl-series="1"]');
    await expect(actualPoints, `${theme}: 実績の中空点5個を測れない`).toHaveCount(5);
    const actualPointPaint = await stage.evaluate((element) => {
      const probe = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      probe.style.fill = "var(--cdl-node-fill, #ffffff)";
      element.append(probe);
      const ground = getComputedStyle(probe).fill;
      probe.remove();
      const fills = [...element.querySelectorAll<SVGElement>(
        '[data-cdl-role="chart-line-point"][data-cdl-series="1"]',
      )].map((point) => getComputedStyle(point).fill);
      return { ground, fills };
    });
    expect.soft(
      actualPointPaint.fills.every((fill) => fill === "none" || fill === actualPointPaint.ground),
      `${theme}: 実績の点が中空でない; ground=${actualPointPaint.ground} ` +
        `fills=${JSON.stringify(actualPointPaint.fills)}`,
    ).toBe(true);
  });

  test(`${theme}: ガントの帯・名前・節目を見本位置と札の中に収める`, async ({ page }) => {
    await openEditorTheme(page, sourceYaml__sortingShelfGantt, theme);
    const stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
    const diagram = page.locator(".v4-editor-preview [data-cdl-diagram]").filter({ has: stage });
    await expect(diagram).toHaveAttribute("data-cdl-phase-index", "1", { timeout: 5_000 });
    await page.waitForTimeout(1_300);
    const geometry = await stage.evaluate((element) => {
      const ticks = [...element.querySelectorAll<SVGTextElement>('[data-cdl-role="gantt-tick"]')]
        .map((tick) => tick.x.baseVal[0]?.value ?? Number.NaN);
      const bars = [...element.querySelectorAll<SVGGraphicsElement>('[data-cdl-role="gantt-bar"]')]
        .map((bar) => {
          const box = bar.getBBox();
          return { x: box.x, width: box.width };
        });
      const cell = ticks[1]! - ticks[0]!;
      const origin = ticks[0]! - cell / 2;
      const positions = bars.map((bar) => [
        (bar.x - origin) / cell,
        (bar.x + bar.width - origin) / cell,
      ]);
      const head = element.querySelector<SVGLineElement>('[data-cdl-role="figure-head-divider"]');
      const footer = element.querySelector<SVGLineElement>('[data-cdl-role="figure-footer-divider"]');
      if (!head || !footer) throw new Error("図の札の境が無い");
      const top = head.getBoundingClientRect().top;
      const bottom = footer.getBoundingClientRect().top;
      const names = new Set(["調べる", "設計する", "棚を作る", "端末を入れる", "試す", "本番"]);
      const items = [
        ...element.querySelectorAll<SVGGraphicsElement>('[data-cdl-role="gantt-bar"], [data-cdl-role="gantt-milestone"], [data-cdl-role="gantt-milestone-label"]'),
        ...[...element.querySelectorAll<SVGTextElement>("text")].filter((text) => names.has(text.textContent ?? "")),
      ];
      return {
        positions,
        inside: items.map((item) => {
          const box = item.getBoundingClientRect();
          return box.top >= top && box.bottom <= bottom;
        }),
      };
    });
    const expected = [[0, 0.75], [0.55, 1.8], [2, 3.2], [2.3, 3.25], [3.6, 4.2]];
    expect(geometry.positions).toHaveLength(expected.length);
    for (const [index, position] of geometry.positions.entries()) {
      expect(Math.abs(position[0]! - expected[index]![0]!), `${index + 1} 本目の始まり`).toBeLessThanOrEqual(0.05);
      expect(Math.abs(position[1]! - expected[index]![1]!), `${index + 1} 本目の終わり`).toBeLessThanOrEqual(0.05);
    }
    expect(geometry.inside.every(Boolean), "全行の名前・帯・節目が見出しの下、足の上").toBe(true);
  });

  test(`${theme}: 3段目c の木・放射・ジャーニー・図の札を見本どおり描く`, async ({ page }) => {
    await openEditorTheme(page, sourceYaml__shipperFeelingJourney, theme);
    let stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
    const opportunity = stage.locator('[data-cdl-role="journey-opportunity"] text');
    await expect(opportunity).toHaveText("不在票に気づかなかった", { timeout: 5_000 });
    const annotationFits = await opportunity.evaluate((text) => {
      const frame = text.closest("[data-cdl-node]")?.querySelector<SVGGraphicsElement>('[data-cdl-role="node-body"]');
      if (!frame) return false;
      const textBox = (text as SVGGraphicsElement).getBBox();
      const frameBox = frame.getBBox();
      return textBox.x >= frameBox.x && textBox.x + textBox.width <= frameBox.x + frameBox.width
        && textBox.y >= frameBox.y && textBox.y + textBox.height <= frameBox.y + frameBox.height;
    });
    expect(annotationFits, "谷の注記が札の中に収まる").toBe(true);
    await expect(stage.locator('[data-cdl-role="journey-level-name"]')).toHaveText([
      "最高", "満足", "普通", "不満", "怒り",
    ]);
    await expect(stage.locator('[data-cdl-role="journey-step"]')).toHaveCount(6, { timeout: 5_000 });
    const [ruleColor, mutedColor] = await stage.evaluate((element) => {
      const rule = element.querySelector('[data-cdl-role="journey-level-rule"]');
      if (!rule) throw new Error("ジャーニーの段罫が無い");
      const probe = document.createElementNS("http://www.w3.org/2000/svg", "line");
      probe.style.stroke = "var(--cdl-tone-muted)";
      element.append(probe);
      const colors = [getComputedStyle(rule).stroke, getComputedStyle(probe).stroke];
      probe.remove();
      return colors;
    });
    expect(ruleColor, "段罫は意匠の沈んだ色").toBe(mutedColor);
    // 段名・横名・注記という role の付いた字だけを測り、図の題は集めない (#2749)。
    const journeyGeometry = await stage.evaluate((element) => {
      const line = element.querySelector<SVGPathElement>('[data-cdl-role="journey-line"]');
      const levelNames = [...element.querySelectorAll<SVGTextElement>('[data-cdl-role="journey-level-name"]')];
      const actorNames = [...element.querySelectorAll<SVGTextElement>('[data-cdl-role="journey-step"] > text')];
      const points = [...element.querySelectorAll<SVGCircleElement>('[data-cdl-role="journey-step"] > circle:first-of-type')];
      const note = element.querySelector<SVGTextElement>('[data-cdl-role="journey-opportunity"] text');
      if (!line || !note) throw new Error("ジャーニーの主線か注記が無い");
      const noteBox = note.getBBox();
      const overlaps = actorNames.some((name) => {
        const box = name.getBBox();
        return noteBox.x < box.x + box.width && noteBox.x + noteBox.width > box.x
          && noteBox.y < box.y + box.height && noteBox.y + noteBox.height > box.y;
      });
      const lineStyle = getComputedStyle(line);
      return {
        actorSizes: actorNames.map((name) => getComputedStyle(name).fontSize),
        levelSizes: levelNames.map((name) => getComputedStyle(name).fontSize),
        lineFill: lineStyle.fill,
        lineStroke: lineStyle.stroke,
        lineWidth: lineStyle.strokeWidth,
        noteSize: getComputedStyle(note).fontSize,
        overlaps,
        pointStrokes: points.map((point) => getComputedStyle(point).stroke),
        pointWidths: points.map((point) => getComputedStyle(point).strokeWidth),
      };
    });
    expect(journeyGeometry.levelSizes).toEqual(Array.from({ length: 5 }, () => "19px"));
    expect(journeyGeometry.actorSizes).toEqual(Array.from({ length: 6 }, () => "20px"));
    expect(journeyGeometry.noteSize).toBe("18px");
    expect(journeyGeometry.lineFill, "主線を始点と終点の間で塗り潰さない").toBe("none");
    expect(journeyGeometry.lineWidth).toBe("5px");
    expect(journeyGeometry.pointWidths).toEqual(Array.from({ length: 6 }, () => "3.5px"));
    expect(journeyGeometry.pointStrokes).toEqual(
      Array.from({ length: 6 }, () => journeyGeometry.lineStroke),
    );
    expect(journeyGeometry.overlaps, "谷の注記が横の名前と重ならない").toBe(false);
    await expect(stage.locator('[data-cdl-role="figure-footer-label"]')).toHaveText("ジャーニー");
    await expect(stage.locator('[data-cdl-role="figure-footer-note"]')).toHaveText("最高 から 怒り の 5 段");
    expect(await stage.locator('[data-cdl-role="figure-title"]').evaluate((node) => getComputedStyle(node).fontSize))
      .toBe(theme === "terminal" ? "25px" : "29px");

    await openEditorTheme(page, sourceYaml__onTimeRateSlope, theme);
    stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
    // cdl 0.132.0 は左右の名札を各系列1枚の chart-slope-label として描く。
    const slopeNames = stage.locator('[data-cdl-role="chart-slope-label"]');
    await expect(slopeNames).toHaveCount(8, { timeout: 5_000 });
    const slopeNameStrokes = await slopeNames
      .evaluateAll((names) => names.map((name) => getComputedStyle(name).stroke));
    expect(slopeNameStrokes, "傾きの名前は輪郭線を重ねず塗りだけで描く")
      .toEqual(Array.from({ length: 8 }, () => "none"));
    const primarySlopeLineElements = stage
      .locator('[data-cdl-role="chart-slope-line"][data-cdl-emphasis="primary"]');
    await expect(primarySlopeLineElements).toHaveCount(2, { timeout: 5_000 });
    const primarySlopeLines = await primarySlopeLineElements
      .evaluateAll((lines) => lines.map((line) => {
        const style = getComputedStyle(line);
        return { stroke: style.stroke, width: Number.parseFloat(style.strokeWidth) };
      }));
    expect(primarySlopeLines.map(({ stroke }) => stroke).sort(), `${theme} の大阪と名古屋の線色`)
      .toEqual([...傾きの主役色[theme]].sort());
    expect(primarySlopeLines.every(({ width }) => width > 0), `${theme} の主役線を消さない`).toBe(true);

    await openEditorTheme(page, sourceYaml__deliveryOfficeTree, theme);
    stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
    const tree = stage.locator('[data-cdl-kind="tree-hierarchy"]');
    // 見本の板は 1800 幅。CDL が左右に 60 ずつ余白を足すため、図の指定幅は 1680。
    expect(deliveryOfficeTree.nodes[0]).toMatchObject({
      title: "営業所の階層",
      w: 1680,
      h: 392,
      treeEdgeHead: "triangle",
      treeSize: {
        nodeWidths: [260, 240, 220],
        nodeHeight: 91.891,
        titleFontSize: 29,
        subtitleFontSize: 19,
        siblingGap: 180,
        levelGap: 58.109,
      },
    });
    await expect(tree).toHaveAttribute("data-cdl-w", "1680");
    await expect(tree).toHaveAttribute("data-cdl-h", "392");
    const treeNodes = stage.locator('[data-cdl-role="tree-node"]');
    await expect(treeNodes).toHaveCount(7, { timeout: 5_000 });
    expect(await treeNodes.evaluateAll((nodes) =>
      nodes.map((node) => Number(node.getAttribute("width"))).sort((a, b) => a - b),
    )).toEqual([220, 220, 220, 220, 240, 240, 260]);
    expect(await treeNodes.evaluateAll((nodes) =>
      nodes.map((node) => Number(node.getAttribute("height"))),
    )).toEqual(Array.from({ length: 7 }, () => 91.891));
    await expect(stage.locator('[data-cdl-role="tree-edge"][marker-end]')).toHaveCount(6);
    await expect(stage.locator('[data-cdl-role="tree-edge-head"]')).toHaveCount(2);
    await expect(stage.locator('[data-cdl-role="figure-title"]')).toHaveCount(1);
    await expect(stage.locator('[data-cdl-role="figure-title"]')).toBeHidden();
    expect(await stage.locator('[data-cdl-role="tree-edge"]').evaluateAll((edges) =>
      new Set(edges.map((edge) => getComputedStyle(edge).stroke)).size,
    )).toBe(2);

    await openEditorTheme(page, sourceYaml__redeliveryIdeasMind, theme);
    stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
    const mind = stage.locator('[data-cdl-mind-form="outline"]');
    await expect(mind).toHaveCount(1);
    const mindNode = stage.locator('[data-cdl-node]:has([data-cdl-mind-form="outline"])');
    // 高さ 470 と各箱・間隔は、見本から測った放射の寸法をそのまま記法へ渡した値。
    expect(redeliveryIdeasMind.nodes[0]).toMatchObject({
      title: "再配達を減らす",
      w: 1680,
      h: 470,
      mindSize: {
        root: { width: 330, height: 61.891, fontSize: 29 },
        branch: { width: 220, height: 62.891, fontSize: 29 },
        leaf: { fontSize: 23 },
        rootBranchGap: 155,
        branchLeafGap: 70,
        branchRowGap: 290,
        branchRowOffset: 10,
        leafRowGap: 92,
        leafRowOffset: 6,
      },
    });
    await expect(mindNode).toHaveAttribute("data-cdl-w", "1680");
    await expect(mindNode).toHaveAttribute("data-cdl-h", "470");
    await expect(stage.locator('[data-cdl-role="mind-root"]')).toHaveCount(1);
    await expect(stage.locator('[data-cdl-role="mind-box"]')).toHaveCount(4);
    await expect(stage.locator('[data-cdl-role="mind-leaf-underline"]')).toHaveCount(8);
    await expect(stage.locator('[data-cdl-role="mind-root"]')).toHaveAttribute("width", "330");
    await expect(stage.locator('[data-cdl-role="mind-root"]')).toHaveAttribute("height", "61.891");
    expect(await stage.locator('[data-cdl-role="mind-box"]').evaluateAll((boxes) =>
      boxes.map((box) => ({ width: box.getAttribute("width"), height: box.getAttribute("height") })),
    )).toEqual(Array.from({ length: 4 }, () => ({ width: "220", height: "62.891" })));
    await expect(stage.locator('[data-cdl-role="figure-title"]')).toHaveCount(1);
    await expect(stage.locator('[data-cdl-role="figure-title"]')).toBeHidden();
    const [rootStyle, boxStyle] = await Promise.all([
      stage.locator('[data-cdl-role="mind-root"]').evaluate((root) => ({
        radius: getComputedStyle(root).rx,
        rootWidth: getComputedStyle(root).strokeWidth,
      })),
      stage.locator('[data-cdl-role="mind-box"]').first().evaluate((box) => ({
        radius: getComputedStyle(box).rx,
        boxWidth: getComputedStyle(box).strokeWidth,
      })),
    ]);
    expect(rootStyle).toEqual({ radius: 放射の枠[theme].radius, rootWidth: 放射の枠[theme].rootWidth });
    expect(boxStyle).toEqual({ radius: 放射の枠[theme].radius, boxWidth: 放射の枠[theme].boxWidth });
    const opaqueBranches = await stage.locator(
      '[data-cdl-role="mind-edge"], [data-cdl-role="mind-leaf-underline"]',
    ).evaluateAll((branches) => branches.every((branch) => getComputedStyle(branch).strokeOpacity === "1"));
    expect(opaqueBranches, "放射の枝と葉の下線を透かさない").toBe(true);
    const matchingMindStrokes = await stage.evaluate((element) => {
      const edges = [...element.querySelectorAll<SVGElement>('[data-cdl-role="mind-edge"]')];
      const underlines = [...element.querySelectorAll<SVGElement>('[data-cdl-role="mind-leaf-underline"]')];
      return underlines.every((underline) => {
        const tone = underline.getAttribute("stroke");
        const edge = edges.find((candidate) => candidate.getAttribute("stroke") === tone);
        return edge !== undefined && getComputedStyle(edge).stroke === getComputedStyle(underline).stroke;
      });
    });
    expect(matchingMindStrokes, "放射の葉の下線は同じ系列の枝と同色").toBe(true);
  });

  test(`${theme}: 時間軸の持ち戻るを左寄せし、3形の凡例を21pxで描く`, async ({ page }) => {
    await openEditorTheme(page, sourceYaml__presetDeliveryTimeline, theme);
    let stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
    const returnCard = stage.locator('[data-cdl-title="持ち戻る"][data-cdl-kind="card"]');
    await expect(returnCard, `${theme}: 時間軸の「持ち戻る」の札を1枚に特定できない`).toHaveCount(1);
    const returnTitle = await returnCard.evaluate((card) => {
      const body = card.querySelector<SVGGraphicsElement>('[data-cdl-role="node-body"]');
      const label = card.querySelector<SVGTextElement>('[data-cdl-role="node-label"]');
      if (!body || !label) throw new Error("持ち戻るの札の面か題が無い");
      const bodyBox = body.getBBox();
      const labelBox = label.getBBox();
      return {
        card: { left: bodyBox.x, width: bodyBox.width, center: bodyBox.x + bodyBox.width / 2 },
        label: { left: labelBox.x, width: labelBox.width, center: labelBox.x + labelBox.width / 2 },
      };
    });
    const leftInset = returnTitle.label.left - returnTitle.card.left;
    expect.soft(
      leftInset,
      `${theme}: 「持ち戻る」の題が札の左外へ出ている; geometry=${JSON.stringify(returnTitle)}`,
    ).toBeGreaterThanOrEqual(0);
    expect.soft(
      leftInset,
      `${theme}: 「持ち戻る」の題の左端が札幅の1/4より右; geometry=${JSON.stringify(returnTitle)}`,
    ).toBeLessThanOrEqual(returnTitle.card.width / 4);
    expect.soft(
      returnTitle.card.center - returnTitle.label.center,
      `${theme}: 「持ち戻る」の題の中心が札の中心から左へ8以上離れていない; ` +
        `geometry=${JSON.stringify(returnTitle)}`,
    ).toBeGreaterThanOrEqual(8);

    for (const [figure, source] of [
      ["段の箱", sourceYaml__presetDeliveryStages],
      ["路線図", sourceYaml__presetDeliveryMetro],
      ["時間軸", sourceYaml__presetDeliveryTimeline],
    ] as const) {
      await openEditorTheme(page, source, theme);
      stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
      const legendTexts = stage.locator('[data-cdl-role="legend-text"]');
      const count = await legendTexts.count();
      expect.soft(count, `${theme}: ${figure}の凡例の字を測れない`).toBeGreaterThan(0);
      const sizes = await legendTexts.evaluateAll((texts) =>
        texts.map((text) => getComputedStyle(text).fontSize),
      );
      expect.soft(
        sizes.every((size) => size === "21px"),
        `${theme}: ${figure}の凡例の字が21pxでない; sizes=${JSON.stringify(sizes)}`,
      ).toBe(true);
    }
  });
}

test("段の箱・時間軸・路線図の札と分かれ道を見本の枠と影で描く", async ({ page }) => {
  await openEditorTheme(page, sourceYaml__presetDeliveryStages, "blueprint");
  let stage = page.locator('svg[data-cdl-stage][data-cdl-palette="blueprint"]');
  let cardStyles = await stage
    .locator('[data-cdl-kind="card"] [data-cdl-role="node-body"]')
    .evaluateAll((cards) => cards.map((card) => {
      const style = getComputedStyle(card);
      return { filter: style.filter, stroke: style.stroke, width: style.strokeWidth };
    }));
  expect(cardStyles.length, "図面の段の札を測れていない").toBeGreaterThan(0);
  expect(
    cardStyles.every(({ filter, stroke, width }) =>
      width === "1px" && stroke === "rgb(20, 58, 82)" && filter === "none"),
    "図面の段の札は紺の枠 1、影なし",
  ).toBe(true);

  await openEditorTheme(page, sourceYaml__presetDeliveryTimeline, "blueprint");
  stage = page.locator('svg[data-cdl-stage][data-cdl-palette="blueprint"]');
  cardStyles = await stage
    .locator('[data-cdl-lane="timeline-steps"][data-cdl-kind="card"] [data-cdl-role="node-body"]')
    .evaluateAll((cards) => cards.map((card) => {
      const style = getComputedStyle(card);
      return { filter: style.filter, stroke: style.stroke, width: style.strokeWidth };
    }));
  expect(cardStyles.length, "図面の時間軸の札を測れていない").toBeGreaterThan(0);
  expect(
    cardStyles.every(({ filter, stroke, width }) =>
      width === "1px" && stroke === "rgb(20, 58, 82)" && filter === "none"),
    "図面の時間軸の札は紺の枠 1、影なし",
  ).toBe(true);
  const blueprintTimelineDecision = await stage
    .locator('[data-cdl-kind="decision"] [data-cdl-role="node-body"] > path')
    .evaluate((path) => {
      const style = getComputedStyle(path);
      return { filter: style.filter, stroke: style.stroke, width: style.strokeWidth };
    });
  expect(blueprintTimelineDecision, "図面の時間軸の分かれ道")
    .toEqual({ filter: "none", stroke: "rgb(20, 58, 82)", width: "1.5px" });

  await openEditorTheme(page, sourceYaml__presetDeliveryMetro, "blueprint");
  stage = page.locator('svg[data-cdl-stage][data-cdl-palette="blueprint"]');
  const blueprintMetroDecision = await stage
    .locator('[data-cdl-kind="decision"] [data-cdl-role="node-body"] > path')
    .evaluate((path) => {
      const style = getComputedStyle(path);
      return { filter: style.filter, stroke: style.stroke, width: style.strokeWidth };
    });
  expect(blueprintMetroDecision, "図面の路線図の分かれ道")
    .toEqual({ filter: "none", stroke: "rgb(20, 58, 82)", width: "1.5px" });

  await openEditorTheme(page, sourceYaml__presetDeliveryStages, "catalog");
  stage = page.locator('svg[data-cdl-stage][data-cdl-palette="catalog"]');
  const catalogCards = await stage
    .locator('[data-cdl-kind="card"] [data-cdl-role="node-body"]')
    .evaluateAll((cards) => cards.map((card) => {
      const style = getComputedStyle(card);
      return { stroke: style.stroke, width: style.strokeWidth, filter: style.filter };
    }));
  expect(catalogCards.length, "図録の段の札を測れていない").toBeGreaterThan(0);
  expect(
    catalogCards.every(({ stroke, width, filter }) =>
      stroke === "none" && width === "0px" && filter.includes("drop-shadow")),
    "図録の段の札は枠なしで影だけ",
  ).toBe(true);

  // 最後の段では全札が active になる。段の箱は各意匠の札を保つ。
  const stageCardLooks = [
    { theme: "catalog", width: "0px", stroke: "none", filter: "drop-shadow" },
    { theme: "letterpress", width: "1.5px", stroke: "rgb(26, 21, 16)", filter: "none" },
    // 段の箱の手描きの札は見本どおり揺らさず影も付けない (#2831、sketch/note.md の段階の列)。
    { theme: "sketch", width: "2px", stroke: "rgb(43, 38, 32)", filter: "none" },
    { theme: "terminal", width: "1px", stroke: "rgba(74, 222, 128, 0.3)", filter: "none" },
    // neon/note.md「段の箱の札」は広がりと内光を持つ violet-frame を正とする。
    { theme: "neon", width: "2px", stroke: "rgb(228, 203, 255)", filter: "dragon-neon-violet-frame" },
  ] as const;
  // 時間軸だけは、活版の右下の影と手描きの滑らかな影を残す。
  const timelineCardLooks = [
    { theme: "catalog", width: "0px", stroke: "none", filter: "drop-shadow" },
    { theme: "letterpress", width: "1.5px", stroke: "rgb(26, 21, 16)", filter: "drop-shadow" },
    { theme: "sketch", width: "2px", stroke: "rgb(43, 38, 32)", filter: "drop-shadow" },
    { theme: "terminal", width: "1px", stroke: "rgba(74, 222, 128, 0.3)", filter: "none" },
  ] as const;
  for (const [source, expectedLooks] of [
    [sourceYaml__presetDeliveryStages, stageCardLooks],
    [sourceYaml__presetDeliveryTimeline, timelineCardLooks],
  ] as const) {
    for (const expected of expectedLooks) {
      await openEditorTheme(page, source, expected.theme);
      stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${expected.theme}"]`);
      const styles = await stage.locator('[data-cdl-kind="card"] [data-cdl-role="node-body"]')
        .evaluateAll((cards) => cards.map((card) => {
          const style = getComputedStyle(card);
          return { filter: style.filter, stroke: style.stroke, width: style.strokeWidth };
        }));
      expect(styles.length, `${expected.theme} の札を測れていない`).toBeGreaterThan(0);
      expect(styles.every((style) =>
        style.width === expected.width && style.stroke === expected.stroke &&
        (expected.filter === "none" ? style.filter === "none" : style.filter.includes(expected.filter))),
      `${expected.theme} の札が見本の縁と影を保つ`).toBe(true);
      if (source === sourceYaml__presetDeliveryTimeline && expected.theme === "sketch") {
        expect(styles.every((style) => !style.filter.includes("dragon-sketch-wobble")), "手描き時間軸は揺らさない")
          .toBe(true);
      }
    }
  }

  const decisions = [
    { theme: "catalog", width: "0px", stroke: "none" },
    { theme: "letterpress", width: "2px", stroke: "rgb(26, 21, 16)" },
    { theme: "sketch", width: "2.5px", stroke: "rgb(43, 38, 32)" },
    // 見本の菱形は罫より強い 50% / 1.5。実装も同じ専用規則へ直した値を固定する。
    { theme: "terminal", width: "1.5px", stroke: "rgba(74, 222, 128, 0.5)" },
  ] as const;
  for (const source of [sourceYaml__presetDeliveryMetro, sourceYaml__presetDeliveryTimeline]) {
    for (const expected of decisions) {
      await openEditorTheme(page, source, expected.theme);
      stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${expected.theme}"]`);
      const style = await stage.locator('[data-cdl-kind="decision"] [data-cdl-role="node-body"] > path')
        .evaluate((path) => {
          const computed = getComputedStyle(path);
          return { filter: computed.filter, stroke: computed.stroke, width: computed.strokeWidth };
        });
      expect(style.width, `${expected.theme} の分かれ道の縁`).toBe(expected.width);
      色を成分ごとに比べる(style.stroke, expected.stroke, `${expected.theme} の分かれ道の縁色`);
      expect(style.filter, `${expected.theme} の分かれ道の影`).toBe("none");
    }
  }


  for (const theme of 意匠) {
    await openEditorTheme(page, sourceYaml__presetDeliveryMetro, theme);
    stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
    const stationFace = await stage.locator('[data-cdl-legend-mark="station"] > circle')
      .evaluate((circle) => getComputedStyle(circle).fill);
    expect(stationFace, `${theme} の凡例駅の面`).toBe(路線の駅面[theme]);
  }
});
