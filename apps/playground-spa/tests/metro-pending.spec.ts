/**
 * 見本帳の路線図について、4 段の線が消えず、未来の線だけが薄いことを画面で確かめる (#2833)。
 *
 * 実行は port 4324 を使う全画面検査に含まれる。
 * この課題では `playwright test --list` による読込だけを行う。
 */
import { expect, test } from "@playwright/test";

import { MetroMapPage } from "./metro-map-page";

// 8 段を約 3.1 秒ずつ待ち、測定中に進んだ時は次の周回で 1 回だけ測り直すため、既定の 60 秒を延ばす。
test.setTimeout(120_000);

test("路線図は生成りと図面の全 4 段で 10 本を残し、まだの線だけを薄くする (#2833)", async ({
  page,
}) => {
  const metro = new MetroMapPage(page);
  await metro.open();

  for (const palette of ["生成りに茶", "図面"]) {
    await metro.choosePalette(palette);
    for (let phase = 0; phase < 4; phase += 1) {
      const lines = await metro.measurePhase(phase);
      expect(lines, `${palette} の ${phase + 1} 段目の路線`).toHaveLength(10);
      for (const [index, line] of lines.entries()) {
        expect(line.opacity, `${palette} ${phase + 1} 段目 ${index + 1} 本目の濃さ`).toBeGreaterThan(0);
        expect(
          line.width > 0 || line.height > 0,
          `${palette} ${phase + 1} 段目 ${index + 1} 本目が大きさを持たない`,
        ).toBe(true);
      }

      const pending = lines.filter((line) => line.pending);
      const arrived = lines.filter((line) => !line.pending);
      expect(arrived.length, `${palette} の ${phase + 1} 段目に到着済みの線が無い`).toBeGreaterThan(0);
      if (pending.length > 0) {
        expect(Math.max(...pending.map((line) => line.opacity))).toBeLessThan(
          Math.min(...arrived.map((line) => line.opacity)),
        );
      }
      if (phase === 0) expect(pending.length, `${palette} の最初の段に「まだ」の線が無い`).toBeGreaterThan(0);
      if (phase === 3) {
        expect(pending, `${palette} の最後の段に「まだ」の線が残る`).toHaveLength(0);
        const returning = lines.filter((line) => line.strokeDasharray !== "none");
        const solid = lines.filter((line) => line.strokeDasharray === "none");
        expect(returning, `${palette} の戻る点線`).toHaveLength(1);
        expect(returning[0]?.strokeWidth, `${palette} の戻る点線の太さ`).toBe("6px");
        expect(returning[0]?.markerEnd, `${palette} の戻る点線の矢印`).not.toBeNull();
        expect(solid, `${palette} の実線`).toHaveLength(9);
        expect(
          solid.every((line) => line.strokeDasharray === "none"),
          `${palette} の実線に刻みが残る`,
        ).toBe(true);
        expect(
          solid.every((line) => line.strokeWidth === "10px"),
          `${palette} の実線の太さが 10px でない`,
        ).toBe(true);
        expect(
          solid.every((line) => line.markerEnd === null),
          `${palette} の実線に矢じりが残る`,
        ).toBe(true);
      }
    }
  }
});
