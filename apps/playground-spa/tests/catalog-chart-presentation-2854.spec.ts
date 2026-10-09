import { expect, test } from "@playwright/test";

import {
  sourceYaml__deliveryResultStacked,
  sourceYaml__measureEffortQuadrant,
  sourceYaml__monthlyDeliveriesLine,
  sourceYaml__onTimeRateSlope,
  sourceYaml__onTimeShareGauge,
  sourceYaml__orderToDeliveryFunnel,
  sourceYaml__parcelSizeWaffle,
  sourceYaml__parcelStatusPie,
} from "../src/topics/catalog/charts.cdl";
import { openEditorTheme } from "./helpers/fixed-theme-checks";

const 意匠 = ["blueprint", "letterpress", "catalog", "terminal", "sketch", "neon", "relief"] as const;

test("図表8種へ #2854 3段目b の欄を描き、枠を他の図形へ漏らさない", async ({ page }) => {
  await openEditorTheme(page, sourceYaml__monthlyDeliveriesLine, "blueprint", false);
  let stage = page.locator('svg[data-cdl-stage][data-cdl-palette="blueprint"]');
  await expect(stage.locator('[data-cdl-role="chart-line"]')).toHaveCount(2);
  await expect(stage.locator('[data-cdl-role="chart-line-point"][data-cdl-series="0"]')).toHaveCount(0);
  await expect(stage.locator('[data-cdl-role="chart-line-point"][data-cdl-series="1"]')).toHaveCount(5);
  await expect(stage.locator('[data-cdl-role="chart-line-value"][data-cdl-series="0"]')).toHaveText(["計画 1,600"]);
  await expect(stage.locator('[data-cdl-role="chart-line-value"][data-cdl-series="1"]')).toHaveText(["900", "1,750"]);

  await openEditorTheme(page, sourceYaml__parcelStatusPie, "blueprint", false);
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

  await openEditorTheme(page, sourceYaml__orderToDeliveryFunnel, "blueprint", false);
  stage = page.locator('svg[data-cdl-stage][data-cdl-palette="blueprint"]');
  await expect(stage.locator('[data-cdl-role="funnel-proportional-bar"]')).toHaveCount(4);
  await expect(stage.getByText(/^(28|85|95)%$/u)).toHaveText(["28%", "85%", "95%"]);
  const funnelFills = await stage.locator('[data-cdl-role="funnel-proportional-bar"]').evaluateAll((nodes) =>
    nodes.map((node) => getComputedStyle(node).fill),
  );
  expect(funnelFills).toEqual(["none", "none", "none", "none"]);

  await openEditorTheme(page, sourceYaml__measureEffortQuadrant, "blueprint", false);
  stage = page.locator('svg[data-cdl-stage][data-cdl-palette="blueprint"]');
  const axisNames = stage.locator('[data-cdl-role="quadrant-axis-name"]');
  await expect(axisNames).toHaveText([/手間\s*→/u, /効き目\s*→/u]);
  expect(await axisNames.nth(1).getAttribute("transform"), "縦軸の → を上向きの ↑ として描く").toContain("rotate(-90");

  await openEditorTheme(page, sourceYaml__onTimeRateSlope, "blueprint", false);
  stage = page.locator('svg[data-cdl-stage][data-cdl-palette="blueprint"]');
  await expect(stage.locator('[data-cdl-role="chart-slope-period"]')).toHaveText(["先月", "今月"]);
  await expect(stage.locator('[data-cdl-role="chart-slope-line"][data-cdl-emphasis="primary"]')).toHaveCount(2);
  await expect(stage.locator('[data-cdl-role="chart-slope-name"][data-cdl-emphasis="primary"]')).toContainText(["名古屋", "名古屋", "大阪", "大阪"]);

  await openEditorTheme(page, sourceYaml__parcelSizeWaffle, "blueprint", false);
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

  await openEditorTheme(page, sourceYaml__deliveryResultStacked, "blueprint", false);
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

  await openEditorTheme(page, sourceYaml__onTimeShareGauge, "blueprint", false);
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
  test(`${theme}: 円の表の印・罫・字体を意匠へ合わせる`, async ({ page }) => {
    await openEditorTheme(page, sourceYaml__parcelStatusPie, theme, false);
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
  });
}
