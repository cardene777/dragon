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
type 帯 = { left: number; right: number; top: number; bottom: number };

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
    // 見本帳の工程は ganttSize.tickCount: 6。6〜10月の5列を6本の境界線で挟む。
    expect(gridXs, `${theme}: 9月の列を挟む目盛り線を測れない`).toHaveLength(6);
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
    const milestoneShape = await milestone.evaluate((element) => {
      const path = element as SVGPathElement;
      const d = path.getAttribute("d") ?? "";
      const points = [...d.matchAll(/[ML]\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s+(-?(?:\d+(?:\.\d*)?|\.\d+))/gu)]
        .map((match) => ({ x: Number(match[1]), y: Number(match[2]) }));
      const box = path.getBBox();
      return { d, points, centerX: box.x + box.width / 2, centerY: box.y + box.height / 2 };
    });
    expect(
      milestoneShape.points,
      `${theme}: gantt-milestone が4頂点の path でない (${milestoneShape.d})`,
    ).toHaveLength(4);
    const milestoneDirections = milestoneShape.points.map(({ x, y }) => {
      if (Math.abs(x - milestoneShape.centerX) <= 0.01 && y < milestoneShape.centerY) return "top";
      if (x > milestoneShape.centerX && Math.abs(y - milestoneShape.centerY) <= 0.01) return "right";
      if (Math.abs(x - milestoneShape.centerX) <= 0.01 && y > milestoneShape.centerY) return "bottom";
      if (x < milestoneShape.centerX && Math.abs(y - milestoneShape.centerY) <= 0.01) return "left";
      return `off-axis(${x},${y})`;
    });
    expect(
      milestoneDirections.sort(),
      `${theme}: gantt-milestone の頂点が中心 (${milestoneShape.centerX}, ${milestoneShape.centerY}) の上下左右にない`,
    ).toEqual(["bottom", "left", "right", "top"]);

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

    const bars = await stage.evaluate((element) => {
      const names = ["棚を作る", "端末を入れる", "試す"] as const;
      // 字は工程名 3 つとの完全一致でだけ引くため、図の題が混ざっても数えない (#2749)
      const labels = [...element.querySelectorAll<SVGTextElement>("text")];
      const barElements = [...element.querySelectorAll<SVGRectElement>('[data-cdl-role="gantt-bar"]')];
      return Object.fromEntries(names.map((name) => {
        const label = labels.find((candidate) => candidate.textContent === name);
        if (!label) throw new Error(`工程名「${name}」が無い`);
        const labelBox = label.getBBox();
        const labelCenterY = labelBox.y + labelBox.height / 2;
        const bar = barElements.reduce<SVGRectElement | undefined>((nearest, candidate) => {
          const candidateBox = candidate.getBBox();
          const nearestBox = nearest?.getBBox();
          return nearestBox === undefined ||
              Math.abs(candidateBox.y + candidateBox.height / 2 - labelCenterY) <
                Math.abs(nearestBox.y + nearestBox.height / 2 - labelCenterY)
            ? candidate
            : nearest;
        }, undefined);
        if (!bar) throw new Error(`工程「${name}」の帯が無い`);
        const box = bar.getBBox();
        return [name, { left: box.x, right: box.x + box.width, top: box.y, bottom: box.y + box.height }];
      })) as Record<(typeof names)[number], 帯>;
    });

    /*
     * cdl は線を帯の右端 +4 から出し、横向き矢じりの手前で止める。帯高 30 に対して
     * 矢じり 17、手前 1、着地点 2 の計 20 なので、横 24 なら線 path の両端を帯へ結び付けられる。
     * 縦は両端とも帯の中心から出入りするため、帯の高さの範囲で判定する。
     */
    for (const from of ["棚を作る", "端末を入れる"] as const) {
      const source = bars[from];
      const target = bars["試す"];
      const matches = lines.filter((line) =>
        Math.abs(line.startX - source.right) <= 24 &&
        line.startY >= source.top && line.startY <= source.bottom &&
        Math.abs(line.endX - target.left) <= 24 &&
        line.endY >= target.top && line.endY <= target.bottom
      );
      expect(
        matches,
        `${theme}: ${from} → 試す の依存線が1本でない; ` +
          `from=${JSON.stringify(source)} target=${JSON.stringify(target)} lines=${JSON.stringify(lines)}`,
      ).toHaveLength(1);
    }
  });
}
