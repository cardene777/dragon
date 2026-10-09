import { expect, test } from "@playwright/test";

import {
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
} from "../src/topics/catalog/charts.cdl";
import { openEditorTheme } from "./helpers/fixed-theme-checks";

const 意匠 = ["blueprint", "letterpress", "catalog", "terminal", "sketch", "neon", "relief"] as const;

const 放射の枠 = {
  blueprint: { width: "2.25px", radius: "12px" },
  letterpress: { width: "3px", radius: "12px" },
  catalog: { width: "0px", radius: "12px" },
  terminal: { width: "1.5px", radius: "6px" },
  sketch: { width: "3px", radius: "22px" },
  neon: { width: "2px", radius: "16px" },
  relief: { width: "0px", radius: "22px" },
} as const;

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

  test(`${theme}: 3段目c の木・放射・ジャーニー・図の札を見本どおり描く`, async ({ page }) => {
    await openEditorTheme(page, sourceYaml__shipperFeelingJourney, theme, false);
    let stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
    const opportunity = stage.locator('[data-cdl-role="journey-opportunity"] text');
    await expect(opportunity).toHaveText("不在票に気づかなかった", { timeout: 5_000 });
    const annotationFits = await opportunity.evaluate((text) => {
      const frame = text.closest("[data-cdl-node]")?.querySelector<SVGGraphicsElement>('[data-cdl-role="node-body"]');
      if (!frame) return false;
      const textBox = (text as SVGGraphicsElement).getBBox();
      const frameBox = frame.getBBox();
      return textBox.x >= frameBox.x && textBox.x + textBox.width <= frameBox.x + frameBox.width;
    });
    expect(annotationFits, "谷の注記が札の横幅に収まる").toBe(true);
    await expect(stage.locator('[data-cdl-role="journey-level-name"]')).toHaveText([
      "最高", "満足", "普通", "不満", "怒り",
    ]);
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
    await expect(stage.locator('[data-cdl-role="figure-footer-label"]')).toHaveText("ジャーニー");
    await expect(stage.locator('[data-cdl-role="figure-footer-note"]')).toHaveText("最高 から 怒り の 5 段");
    expect(await stage.locator('[data-cdl-role="figure-title"]').evaluate((node) => getComputedStyle(node).fontSize))
      .toBe(theme === "terminal" ? "25px" : "29px");

    await openEditorTheme(page, sourceYaml__deliveryOfficeTree, theme, false);
    stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
    const tree = stage.locator('[data-cdl-kind="tree-hierarchy"]');
    await expect(tree).toHaveAttribute("data-cdl-w", "1712");
    await expect(tree).toHaveAttribute("data-cdl-h", "416");
    await expect(stage.locator('[data-cdl-role="tree-edge"][marker-end]')).toHaveCount(6);
    expect(await stage.locator('[data-cdl-role="tree-edge"]').evaluateAll((edges) =>
      new Set(edges.map((edge) => getComputedStyle(edge).stroke)).size,
    )).toBe(2);

    await openEditorTheme(page, sourceYaml__redeliveryIdeasMind, theme, false);
    stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
    await expect(stage.locator('[data-cdl-mind-form="outline"]')).toHaveCount(1);
    await expect(stage.locator('[data-cdl-role="mind-leaf-underline"]')).toHaveCount(8);
    const rootStyle = await stage.locator('[data-cdl-role="mind-root"]').evaluate((root) => ({
      radius: getComputedStyle(root).rx,
      width: getComputedStyle(root).strokeWidth,
    }));
    expect(rootStyle).toEqual(放射の枠[theme]);
    const opaqueBranches = await stage.locator(
      '[data-cdl-role="mind-edge"], [data-cdl-role="mind-leaf-underline"]',
    ).evaluateAll((branches) => branches.every((branch) => getComputedStyle(branch).strokeOpacity === "1"));
    expect(opaqueBranches, "放射の枝と葉の下線を透かさない").toBe(true);
  });
}
