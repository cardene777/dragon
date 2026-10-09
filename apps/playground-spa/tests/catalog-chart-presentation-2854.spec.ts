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
  sourceYaml__sortingShelfGantt,
} from "../src/topics/catalog/charts.cdl";
import {
  sourceYaml__presetDeliveryMetro,
  sourceYaml__presetDeliveryStages,
  sourceYaml__presetDeliveryTimeline,
} from "../src/topics/catalog/presets.cdl";
import { openEditorTheme } from "./helpers/fixed-theme-checks";

const 意匠 = ["blueprint", "letterpress", "catalog", "terminal", "sketch", "neon", "relief"] as const;

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
  test(`${theme}: 円と升目の一覧の字を重ねず意匠へ合わせる`, async ({ page }) => {
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

    expect(styles[1].size).toBe("15px");
    expect(Number.parseFloat(styles[2].size)).toBeCloseTo(12.95, 1);
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

    await openEditorTheme(page, sourceYaml__parcelSizeWaffle, theme, false);
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

  test(`${theme}: ガントの帯・名前・節目を見本位置と札の中に収める`, async ({ page }) => {
    await openEditorTheme(page, sourceYaml__sortingShelfGantt, theme, false);
    const stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
    const diagram = page.locator(".v4-editor-preview [data-cdl-diagram]").filter({ has: stage });
    await expect(diagram).toHaveAttribute("data-cdl-phase-index", "1", { timeout: 5_000 });
    await page.waitForTimeout(1_300);
    const geometry = await stage.evaluate((element) => {
      const ticks = [...element.querySelectorAll<SVGTextElement>('[data-cdl-role="gantt-tick"]')]
        .map((tick) => tick.x.baseVal[0]?.value ?? Number.NaN);
      const bars = [...element.querySelectorAll<SVGRectElement>('[data-cdl-role="gantt-bar"]')]
        .map((bar) => ({ x: bar.x.baseVal.value, width: bar.width.baseVal.value }));
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
    await openEditorTheme(page, sourceYaml__shipperFeelingJourney, theme, false);
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
    const mind = stage.locator('[data-cdl-mind-form="outline"]');
    await expect(mind).toHaveCount(1);
    const mindNode = stage.locator('[data-cdl-node]:has([data-cdl-mind-form="outline"])');
    await expect(mindNode).toHaveAttribute("data-cdl-w", "1712");
    await expect(mindNode).toHaveAttribute("data-cdl-h", "528");
    await expect(stage.locator('[data-cdl-role="mind-root"]')).toHaveCount(1);
    await expect(stage.locator('[data-cdl-role="mind-box"]')).toHaveCount(4);
    await expect(stage.locator('[data-cdl-role="mind-leaf-underline"]')).toHaveCount(8);
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
  });
}

test("段の箱・時間軸・路線図の札と分かれ道を見本の枠と影で描く", async ({ page }) => {
  await openEditorTheme(page, sourceYaml__presetDeliveryStages, "blueprint", false);
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

  await openEditorTheme(page, sourceYaml__presetDeliveryTimeline, "blueprint", false);
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

  await openEditorTheme(page, sourceYaml__presetDeliveryMetro, "blueprint", false);
  stage = page.locator('svg[data-cdl-stage][data-cdl-palette="blueprint"]');
  const blueprintMetroDecision = await stage
    .locator('[data-cdl-kind="decision"] [data-cdl-role="node-body"] > path')
    .evaluate((path) => {
      const style = getComputedStyle(path);
      return { filter: style.filter, stroke: style.stroke, width: style.strokeWidth };
    });
  expect(blueprintMetroDecision, "図面の路線図の分かれ道")
    .toEqual({ filter: "none", stroke: "rgb(20, 58, 82)", width: "1.5px" });

  await openEditorTheme(page, sourceYaml__presetDeliveryStages, "catalog", false);
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

  // 最後の段では全札が active になる。段の箱と時間軸の両方で、active の太枠や影に
  // 戻らず見本帳の通常札を保つことを、残りの意匠も描画後の値で確かめる。
  const cardLooks = [
    { theme: "catalog", width: "0px", stroke: "none", filter: "drop-shadow" },
    { theme: "letterpress", width: "1.5px", stroke: "rgb(26, 21, 16)", filter: "none" },
    { theme: "sketch", width: "2px", stroke: "rgb(43, 38, 32)", filter: "dragon-sketch-wobble" },
    { theme: "terminal", width: "1px", stroke: "rgba(74, 222, 128, 0.3)", filter: "none" },
  ] as const;
  for (const source of [sourceYaml__presetDeliveryStages, sourceYaml__presetDeliveryTimeline]) {
    for (const expected of cardLooks) {
      await openEditorTheme(page, source, expected.theme, false);
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
    }
  }

  const decisions = [
    { theme: "catalog", width: "0px", stroke: "none" },
    { theme: "letterpress", width: "2px", stroke: "rgb(26, 21, 16)" },
    { theme: "sketch", width: "2.5px", stroke: "rgb(43, 38, 32)" },
    { theme: "terminal", width: "1px", stroke: "rgba(74, 222, 128, 0.3)" },
  ] as const;
  for (const source of [sourceYaml__presetDeliveryMetro, sourceYaml__presetDeliveryTimeline]) {
    for (const expected of decisions) {
      await openEditorTheme(page, source, expected.theme, false);
      stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${expected.theme}"]`);
      const style = await stage.locator('[data-cdl-kind="decision"] [data-cdl-role="node-body"] > path')
        .evaluate((path) => {
          const computed = getComputedStyle(path);
          return { filter: computed.filter, stroke: computed.stroke, width: computed.strokeWidth };
        });
      expect(style.width, `${expected.theme} の分かれ道の縁`).toBe(expected.width);
      expect(style.stroke, `${expected.theme} の分かれ道の縁色`).toBe(expected.stroke);
      expect(style.filter, `${expected.theme} の分かれ道の影`).toBe("none");
    }
  }
});
