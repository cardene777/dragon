import { describe, expect, it } from "vitest";

import { readCdlThemeRoleTable } from "./theme-role-table-test-helpers";

const table = (palette: string): ReadonlyMap<string, string> =>
  readCdlThemeRoleTable(palette).light;

describe("#2854 3 段目 l の意匠表", () => {
  it("名前の字体を意匠ごとの Noto Sans JP に保ち、値だけ同梱 mono にする", () => {
    for (const palette of ["blueprint", "letterpress", "catalog", "sketch", "neon", "relief"] as const) {
      expect(table(palette).get("--dragon-chart-name-font"), `${palette} の名前`).toContain("Noto Sans JP");
      expect(table(palette).get("--dragon-chart-value-font"), `${palette} の値`).toBe("var(--d-mono)");
    }
  });

  it("浮彫の実寸枠と図表の面は別の filter を表に持つ", () => {
    expect(table("relief").get("--dragon-chart-frame-effect")).toBe(
      "url(#dragon-relief-figure-frame)",
    );
    expect(table("relief").get("--dragon-chart-node-effect")).toBe(
      "url(#dragon-relief-well)",
    );
  });

  it("段札と時間軸札の縁・影を 5 意匠の表に持つ", () => {
    for (const [palette, width, frame] of [
      ["blueprint", "1", "#143a52"],
      ["letterpress", "1.5", "#1a1510"],
      ["terminal", "1", "rgb(74 222 128 / 30%)"],
      ["sketch", "2", "#2b2620"],
    ] as const) {
      expect(table(palette).get("--dragon-stage-detail-card-frame-width"), palette).toBe(
        "var(--theme-stage-frame-width)",
      );
      expect(table(palette).get("--theme-stage-frame-width"), palette).toBe(width);
      expect(table(palette).get("--dragon-hierarchy-card-frame"), palette).toBe(frame);
    }
    expect(table("sketch").get("--dragon-stage-detail-card-effect")).toBe(
      "drop-shadow(3px 4px 0 rgb(43 38 32 / 16%))",
    );
    expect(table("catalog").get("--dragon-stage-detail-card-frame-width")).toBe("0");
  });

  it("分かれ道の枠の太さと図録の枠なしを表に持つ", () => {
    for (const [palette, width] of [
      ["blueprint", "1.5px"],
      ["letterpress", "2px"],
      ["sketch", "2.5px"],
      ["terminal", "1.5px"],
    ] as const) {
      expect(table(palette).get("--dragon-chart-decision-frame-width"), palette).toBe(width);
    }
    expect(table("catalog").get("--dragon-chart-decision-frame")).toBe("none");
    expect(table("catalog").get("--dragon-chart-decision-frame-width")).toBe("0");
  });

  it("浮彫の札の題色を表に持つ", () => {
    expect(table("relief").get("--dragon-hierarchy-title-text")).toBe("#463e33");
  });
});
