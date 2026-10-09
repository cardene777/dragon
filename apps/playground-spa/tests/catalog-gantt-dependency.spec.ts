/**
 * 宅配の工程の依存線を、見本を持つ 7 意匠の実画面で測る (#2854 C14)。
 *
 * 0.128.0 は前工程の線を直角にし、帯が短い時も終点が始点より左へ戻らないようにする。
 */
import { expect, test } from "@playwright/test";

import { sourceYaml__sortingShelfGantt } from "../src/topics/catalog/charts.cdl";
import { openEditorTheme } from "./helpers/fixed-theme-checks";

const 意匠 = ["blueprint", "letterpress", "catalog", "terminal", "sketch", "neon", "relief"] as const;

type 線 = { d: string; startX: number; startY: number; endX: number; endY: number };

for (const theme of 意匠) {
  test(`${theme}: 工程の節目・今日・主役と依存線を見本どおり描く (#2854 C14)`, async ({ page }) => {
    await openEditorTheme(page, sourceYaml__sortingShelfGantt, theme, false);
    const stage = page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);
    await expect(stage).toBeVisible();

    const ticks = await stage.locator('[data-cdl-role="gantt-tick"]').allTextContents();
    expect(ticks, `${theme}: 9月の目盛り名が消えている`).toContain("9月");

    const gridXs = await stage.locator('[data-cdl-role="gantt-grid"]').evaluateAll((elements) =>
      elements.map((element) => Number(element.getAttribute("x1"))),
    );
    expect(gridXs, `${theme}: 9月の列を挟む目盛り線を測れない`).toHaveLength(5);
    const today = stage.locator('[data-cdl-role="gantt-today"]');
    await expect(today).toHaveCount(1);
    await expect(stage.locator('[data-cdl-role="gantt-today-label"]')).toHaveText("今日");
    const todayX = Number(await today.getAttribute("x1"));
    const septemberStart = gridXs[3]!;
    const septemberEnd = gridXs[4]!;
    expect(todayX, `${theme}: 今日の線が9月の列の30%にない`).toBeCloseTo(
      septemberStart + (septemberEnd - septemberStart) * 0.3,
      5,
    );

    const milestone = stage.locator('[data-cdl-role="gantt-milestone"]');
    await expect(milestone).toHaveCount(1, { timeout: 15_000 });
    await expect(stage.locator('[data-cdl-role="gantt-milestone-label"]')).toHaveText("10月半ば");
    const milestoneFill = await milestone.evaluate((element) => getComputedStyle(element).fill);
    expect(milestoneFill, `${theme}: 節目が枠だけになっている`).not.toBe("none");

    if (theme === "blueprint" || theme === "letterpress") {
      const mutedFills = await stage
        .locator('[data-cdl-role="gantt-bar"][data-cdl-tone="muted"]')
        .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).fill));
      expect(mutedFills, `${theme}: 沈んだ帯 2 本を測れていない`).toHaveLength(2);
      expect(mutedFills, `${theme}: 沈んだ帯が枠だけでない`).toEqual(["none", "none"]);
    }

    const hatches = stage.locator('[data-cdl-role="gantt-bar-hatch"]');
    await expect(hatches).toHaveCount(3);
    if (theme === "blueprint" || theme === "sketch") {
      const expectedPattern = theme === "blueprint" ? "dragon-bp-hatch" : "dragon-sketch-pen-primary";
      const fills = await hatches.evaluateAll((elements) =>
        elements.map((element) => getComputedStyle(element).fill),
      );
      expect(fills, `${theme}: 主役3本が意匠の模様を使っていない`).toHaveLength(3);
      for (const fill of fills) expect(fill).toContain(expectedPattern);
    } else {
      const displays = await hatches.evaluateAll((elements) =>
        elements.map((element) => getComputedStyle(element).display),
      );
      expect(displays, `${theme}: 斜線を描かない意匠に主役の重ねが見えている`).toEqual([
        "none",
        "none",
        "none",
      ]);
    }

    const paths = stage.locator('[data-cdl-role="gantt-arrow"] path:not([d*="Z"])');
    await expect(paths).toHaveCount(4, { timeout: 15_000 });
    const lines = await paths.evaluateAll((elements): 線[] =>
      elements.map((element) => {
        const path = element as SVGPathElement;
        const start = path.getPointAtLength(0);
        const end = path.getPointAtLength(path.getTotalLength());
        return {
          d: path.getAttribute("d") ?? "",
          startX: start.x,
          startY: start.y,
          endX: end.x,
          endY: end.y,
        };
      }),
    );

    expect(lines, `${theme}: 線を 4 本とも測れていない`).toHaveLength(4);
    for (const line of lines) {
      expect(line.d, `${theme}: M/H/V だけの直角経路でない`).toMatch(
        /^M\s-?[\d.]+\s-?[\d.]+(?:\s[HV]\s-?[\d.]+)+$/u,
      );
      expect(line.endY, `${theme}: 依存線が下へ進んでいない (${line.d})`).toBeGreaterThan(line.startY);
      expect(line.endX, `${theme}: 終点 x が始点 x より左 (${line.d})`).toBeGreaterThanOrEqual(line.startX);
    }
  });
}
