import { describe, expect, it } from "vitest";

import {
  readCdlThemeRoleTable,
  resolveThemeRole,
} from "../../../apps/playground-spa/src/lib/theme-role-table-test-helpers";

const fixedPalettes = [
  "blueprint",
  "letterpress",
  "catalog",
  "terminal",
  "sketch",
  "neon",
  "relief",
] as const;

const table = (palette: string): ReadonlyMap<string, string> =>
  readCdlThemeRoleTable(palette).light;

const resolved = (palette: string, role: string): string | undefined =>
  resolveThemeRole(table(palette), role);

const timelineLabels = [
  ["blueprint", "#1f7a6b", "#a8431f", "#ebf0f0", "#e3e9ea", "none", "none", "0", "9px"],
  ["letterpress", "#1a1510", "#1a1510", "#f0eadc", "#f0eadc", "none", "none", "0", "9px"],
  ["catalog", "#4fae9a", "#e8705a", "#1b222c", "#1b222c", "none", "none", "0", "9px"],
  ["terminal", "#c792ea", "#f5c451", "#03110a", "#03110a", "none", "none", "0", "4px"],
  ["sketch", "#2f7d4f", "#2a5ca8", "#fffdf7", "#fffdf7", "none", "none", "0", "9px"],
  ["neon", "#07060c", "#07060c", "#00e5ff", "#ffd000", "#00e5ff", "#ffd000", "2.5px", "9px"],
  ["relief", "#2f7a6e", "#c99a35", "#ffffff", "#383838", "none", "none", "0", "20px"],
] as const;

describe("#2854 の値表", () => {
  it.each(fixedPalettes)("%s は傾き図の主役色を持つ", (palette) => {
    expect(table(palette).has("--theme-lead"), palette).toBe(true);
  });

  it("図表の帯・工程の棒・上下の棒は意匠別半径を持つ", () => {
    expect(table("catalog").get("--dragon-chart-band-radius")).toBe("4px");
    expect(table("sketch").get("--dragon-chart-band-radius")).toBe("10px");
    expect(table("neon").get("--dragon-chart-band-radius")).toBe("12px");
    expect(table("relief").get("--dragon-gantt-bar-radius")).toBe("12px");
    expect(table("neon").get("--dragon-chart-bar-top-radius")).toBe("10px");
    expect(table("neon").get("--dragon-chart-bar-bottom-radius")).toBe("3px");
  });

  it("図表・ジャーニー・段札の効果は元の filter ID を持つ", () => {
    expect(table("neon").get("--dragon-chart-frame-effect")).toBe("url(#dragon-neon-figure-frame)");
    expect(table("relief").get("--dragon-chart-frame-effect")).toBe("url(#dragon-relief-figure-frame)");
    expect(table("relief").get("--dragon-figure-inset-effect")).toBe("url(#dragon-relief-figure-inset)");
    expect(table("terminal").get("--dragon-chart-glow-effect")).toBe("url(#dragon-metro-terminal-glow)");
    expect(table("neon").get("--dragon-chart-glow-effect")).toBe("url(#dragon-metro-neon-glow)");
    expect(table("neon").get("--dragon-chart-line-effect")).toBe("url(#dragon-neon-tube)");
    expect(table("neon").get("--dragon-chart-title-effect")).toBe("url(#dragon-neon-title-cyan)");
    expect(table("neon").get("--dragon-stage-name-effect")).toBe("url(#dragon-neon-title-pink)");
    expect(table("neon").get("--dragon-stage-card-name-effect")).toBe("url(#dragon-neon-title-violet)");
  });

  it.each(timelineLabels)(
    "%s の時間軸は意匠帳の分岐札を持つ",
    (palette, successFill, errorFill, successText, errorText, successFrame, errorFrame, frameWidth, radius) => {
      const values = table(palette);
      expect(resolved(palette, "--theme-timeline-label-success-fill")).toBe(successFill);
      expect(resolved(palette, "--theme-timeline-label-error-fill")).toBe(errorFill);
      expect(resolved(palette, "--theme-timeline-label-success-text")).toBe(successText);
      expect(resolved(palette, "--theme-timeline-label-error-text")).toBe(errorText);
      expect(resolved(palette, "--theme-timeline-label-success-frame")).toBe(successFrame);
      expect(resolved(palette, "--theme-timeline-label-error-frame")).toBe(errorFrame);
      expect(values.get("--theme-timeline-label-frame-width")).toBe(frameWidth);
      expect(values.get("--theme-timeline-label-radius")).toBe(radius);
      expect(values.get("--theme-timeline-label-font-size")).toBe("21px");
      expect(values.get("--theme-timeline-label-font-weight")).toBe("700");
    },
  );

  it("階層図とマインドマップは移動前の値を持つ", () => {
    for (const palette of fixedPalettes) {
      expect(table(palette).get("--dragon-hierarchy-edge-width"), palette).toBe("4.5px");
    }

    expect(table("blueprint").get("--dragon-hierarchy-card-fill")).toBe("rgba(227, 233, 234, 0.82)");
    expect(table("blueprint").get("--dragon-hierarchy-card-radius")).toBe("12px");
    expect(table("terminal").get("--dragon-hierarchy-card-fill")).toBe("url(#dragon-terminal-card-gradient)");
    expect(table("terminal").get("--dragon-hierarchy-card-radius")).toBe("6px");
    expect(table("terminal").get("--dragon-hierarchy-title-effect")).toBe(
      "drop-shadow(0 0 10px rgb(74 222 128 / 35%))",
    );
    expect(table("catalog").get("--dragon-hierarchy-card-effect")).toBe("url(#dragon-catalog-tree-shadow)");
    expect(table("catalog").get("--dragon-mind-redelivery-ground-pattern")).toContain("ellipse at 50% 0%");
    expect(table("relief").get("--dragon-hierarchy-card-fill")).toBe("#e8e3da");
    expect(table("relief").get("--dragon-hierarchy-card-effect")).toBe("url(#dragon-relief-raised)");
    expect(table("neon").get("--dragon-hierarchy-card-fill")).toBe("rgb(10 8 18 / 94%)");
    expect(table("neon").get("--dragon-hierarchy-card-frame-width")).toBe("2px");
    expect(table("neon").get("--dragon-hierarchy-card-effect")).toContain(
      "drop-shadow(0 0 24px rgb(255 46 151 / 22%))",
    );
    expect(table("neon").get("--dragon-tree-sales-office-ground-pattern")).toContain("820px 560px at 18% 132px");
    expect(table("neon").get("--dragon-mind-redelivery-ground-pattern")).toContain("820px 560px at 18% -378px");
  });

  it("図別の補正と系列値を表に持つ", () => {
    expect(table("catalog").get("--dragon-tree-sales-office-card-effect")).toContain(
      "drop-shadow(0 22px 40px rgb(0 0 0 / 62%))",
    );
    expect(table("relief").get("--dragon-tree-sales-office-card-effect")).toBe(
      "url(#dragon-relief-raised-contained)",
    );
    expect(table("neon").get("--dragon-chart-stacked-bar-effect")).toBe(
      "drop-shadow(0 0 6px currentColor)",
    );
    expect(table("neon").get("--dragon-funnel-primary-effect")).toBe(
      "drop-shadow(0 0 6px var(--theme-lead))",
    );
    expect(table("terminal").get("--dragon-chart-figure-card-frame")).toBe("rgba(74, 222, 128, 0.3)");
    expect(table("terminal").get("--dragon-chart-figure-divider")).toBe("rgba(74, 222, 128, 0.16)");
    expect(table("catalog").get("--dragon-hierarchy-card-frame-width")).toBe("0");
    expect(table("relief").get("--dragon-hierarchy-card-frame-width")).toBe("0");
  });

  it("浮彫の系列・半径と手描きの段札は見本の値を持つ", () => {
    expect(table("relief").get("--dragon-chart-series-1-fill")).toBe("url(#dragon-relief-chart-1)");
    expect(table("relief").get("--dragon-chart-series-4-fill")).toBe("url(#dragon-relief-chart-4)");
    expect(table("relief").get("--dragon-gantt-bar-radius")).toBe("12px");
    expect(table("relief").get("--dragon-chart-bar-top-radius")).toBe("12px");
    expect(table("sketch").get("--dragon-stage-detail-card-radius")).toBe("13px");
    expect(table("sketch").get("--dragon-stage-detail-card-effect")).toBe(
      "drop-shadow(3px 4px 0 rgb(43 38 32 / 16%))",
    );
    expect(resolved("relief", "--dragon-theme-box-fill")).toBe("#e8e3da");
  });
});
