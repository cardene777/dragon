import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { readCdlThemeRoleTable } from "./theme-role-table-test-helpers";

const fixedThemes = [
  "blueprint",
  "letterpress",
  "catalog",
  "terminal",
  "sketch",
  "neon",
  "relief",
] as const;

const table = (palette: string): ReadonlyMap<string, string> =>
  readCdlThemeRoleTable(palette);

type 札の値 = { 見本: string; dragon: string };

function 段の箱の札を読む(palette: "catalog" | "neon"): Map<string, 札の値> {
  const note = readFileSync(resolve(process.cwd(), `docs/design/${palette}/note.md`), "utf8");
  const section = /^### 段の箱の札\n([\s\S]*?)(?=^###? )/mu.exec(note)?.[1];
  if (section === undefined) throw new Error(`${palette} の「段の箱の札」が無い`);
  const rows = new Map<string, 札の値>();
  for (const line of section.split("\n")) {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim().replaceAll("`", ""));
    if (cells.length !== 3 || cells[0] === "項目" || /^-+$/u.test(cells[0] ?? "")) continue;
    const [項目, 見本, dragon] = cells;
    if (項目 !== undefined && 見本 !== undefined && dragon !== undefined) {
      rows.set(項目, { 見本, dragon });
    }
  }
  return rows;
}

describe("固定の 7 意匠の段の箱を見本の線で描く (#2831)", () => {
  it("手描きの棒と電飾の主役の枠を表に持つ", () => {
    expect(table("sketch").get("--dragon-chart-bar-secondary-frame-width")).toBe("2.5px");
    expect(table("neon").get("--dragon-chart-bar-primary-frame")).toBe("#ffb6db");
  });

  it("全図の線と段の箱の線の太さを 7 意匠の表に持つ", () => {
    for (const palette of fixedThemes) {
      expect(table(palette).get("--dragon-theme-line-width"), palette).toBe("7");
      expect(table(palette).get("--dragon-stage-edge-width"), palette).toBe("5");
    }
  });

  it.each([
    ["blueprint", "12px", "1", "2.25", "1"],
    ["letterpress", "12px", "1.5", "3", "2.5"],
    ["catalog", "12px", "1", "2", "1"],
    ["terminal", "6px", "1", "1.5", "1"],
    ["sketch", "16px", "2", "3", "1"],
    ["neon", "16px", "2", "3", "1"],
    ["relief", "22px", "0", "0", "1"],
  ] as const)(
    "%s の角・箱の枠・強調中の枠・項目の区切り線の太さを表に持つ",
    (palette, radius, frame, selectedFrame, divider) => {
      expect(table(palette).get("--dragon-theme-box-radius")).toBe(radius);
      expect(table(palette).get("--dragon-theme-box-frame-width")).toBe(frame);
      expect(table(palette).get("--dragon-theme-selected-box-frame-width")).toBe(selectedFrame);
      expect(table(palette).get("--dragon-theme-row-divider-width")).toBe(divider);
    },
  );

  it.each([
    ["blueprint", "12px", "8px", "#e3e9ea", "#143a52", "1", "#143a52", "1", "#3f6479", "#143a52", "#3f6479", "none", "none"],
    ["letterpress", "12px", "8px", "#f0eadc", "#1a1510", "1.5", "#1a1510", "2.5", "#6b6253", "#1a1510", "#6b6253", "drop-shadow(2px 2px 0 color-mix(in srgb, var(--er-ink) 14%, transparent))", "none"],
    ["catalog", "12px", "8px", "#f4eee2", "none", "1.5", "#e2d9c7", "1", "#6f6757", "#1d242e", "#6f6757", "drop-shadow(0 3px 2px rgb(0 0 0 / 28%)) drop-shadow(0 12px 16px rgb(0 0 0 / 45%))", "none"],
    ["terminal", "6px", "5px", "#0a150e", "#287544", "1", "#143520", "1", "#8a9b90", "#9ef0b4", "#8a9b90", "none", "drop-shadow(0 0 10px color-mix(in srgb, var(--theme-lead) 35%, transparent))"],
    ["sketch", "12px", "12px", "#fffdf7", "#2b2620", "2", "#2b2620", "2", "#6d6456", "#2b2620", "#6d6456", "drop-shadow(3px 4px 0 color-mix(in srgb, var(--er-ink) 16%, transparent))", "none"],
    ["neon", "16px", "16px", "rgb(10 8 18 / 94%)", "#ffb6db", "2", "#58143d", "1", "#c4bce0", "#ffffff", "#c4bce0", "url(#dragon-neon-pink-frame)", "none"],
    ["relief", "22px", "14px", "#e8e3da", "none", "1.5", "none", "1", "#685e51", "#463e33", "#685e51", "url(#dragon-relief-raised)", "none"],
  ] as const)(
    "%s の段階列・見出し・担当の値を表に持つ",
    (palette, columnRadius, cardRadius, face, frame, frameWidth, divider, dividerWidth, number, name, note, shadow, nameGlow) => {
      const values = table(palette);
      expect(values.get("--theme-stage-column-radius")).toBe(columnRadius);
      expect(values.get("--theme-stage-card-radius")).toBe(cardRadius);
      expect(values.get("--theme-stage-face")).toBe(face);
      expect(values.get("--theme-stage-frame")).toBe(frame);
      expect(values.get("--theme-stage-frame-width")).toBe(frameWidth);
      expect(values.get("--theme-stage-divider")).toBe(divider);
      expect(values.get("--theme-stage-divider-width")).toBe(dividerWidth);
      expect(values.get("--theme-stage-number")).toBe(number);
      expect(values.get("--theme-stage-name")).toBe(name);
      expect(values.get("--theme-stage-note")).toBe(note);
      expect(values.get("--theme-stage-shadow")).toBe(shadow);
      expect(values.get("--theme-stage-name-glow")).toBe(nameGlow);
    },
  );

  it("戻る点線と凡例の形を 7 意匠の表に持つ", () => {
    for (const palette of fixedThemes) {
      const values = table(palette);
      expect(values.get("--dragon-stage-return-width"), palette).toBe("6");
      expect(values.get("--dragon-stage-return-dash"), palette).toBe("0 9.6");
      expect(values.get("--dragon-stage-return-cap"), palette).toBe("round");
      expect(values.get("--dragon-stage-legend-label-fill"), palette).toBe("none");
      expect(values.get("--dragon-stage-legend-curve-width"), palette).toBe("3");
      expect(values.has("--dragon-stage-legend-mark"), palette).toBe(true);
      expect(values.has("--dragon-stage-return-legend"), palette).toBe(true);
      expect(values.has("--dragon-stage-legend-text"), palette).toBe(true);
    }
    expect(table("relief").get("--dragon-stage-return-legend")).toBe("#c99a35");
  });

  it.each([
    ["blueprint", "var(--er-link)", "var(--er-own)", "var(--er-stripe)", "var(--er-stripe)", "none", "none", "9px", "0"],
    ["letterpress", "var(--er-link)", "var(--er-own)", "var(--er-ground)", "var(--er-ground)", "none", "none", "9px", "0"],
    ["catalog", "var(--er-link)", "var(--er-own)", "var(--er-ground)", "var(--er-ground)", "none", "none", "9px", "0"],
    ["terminal", "var(--er-link)", "var(--er-own)", "var(--er-ground)", "var(--er-ground)", "none", "none", "4px", "0"],
    ["sketch", "var(--er-link)", "var(--er-own)", "var(--er-face)", "var(--er-face)", "none", "none", "9px", "0"],
    ["neon", "var(--er-ground)", "var(--er-ground)", "var(--er-link)", "var(--er-own)", "var(--er-link)", "var(--er-own)", "9px", "2.5px"],
    ["relief", "var(--er-link)", "#c99a35", "#ffffff", "#383838", "none", "none", "20px", "0"],
  ] as const)(
    "%s の線札の値を表に持つ",
    (palette, successFill, errorFill, successText, errorText, successFrame, errorFrame, radius, frameWidth) => {
      const values = table(palette);
      expect(values.get("--theme-stage-label-success-fill")).toBe(successFill);
      expect(values.get("--theme-stage-label-error-fill")).toBe(errorFill);
      expect(values.get("--theme-stage-label-success-text")).toBe(successText);
      expect(values.get("--theme-stage-label-error-text")).toBe(errorText);
      expect(values.get("--theme-stage-label-success-frame")).toBe(successFrame);
      expect(values.get("--theme-stage-label-error-frame")).toBe(errorFrame);
      expect(values.get("--theme-stage-label-radius")).toBe(radius);
      expect(values.get("--theme-stage-label-frame-width")).toBe(frameWidth);
      expect(values.get("--theme-stage-label-font-weight")).toBe("700");
    },
  );

  it.each([
    {
      palette: "catalog" as const,
      expected: {
        面: { 見本: "#fbf7ee", dragon: "#fbf7ee" },
        枠: { 見本: "none", dragon: "none" },
        太さ: { 見本: "0", dragon: "0" },
        影: { 見本: "0 8px 18px -6px rgba(0,0,0,.34)", dragon: "drop-shadow(0 8px 6px rgb(0 0 0 / 34%))" },
      },
    },
    {
      palette: "neon" as const,
      expected: {
        面: { 見本: "rgba(10,8,18,.94)", dragon: "rgb(10 8 18 / 94%)" },
        枠: { 見本: "color-mix(in srgb, #b26bff 35%, white)", dragon: "#e4cbff" },
        太さ: { 見本: "2px", dragon: "2" },
        影: { 見本: "0 0 2px 1px #b26bff, 0 0 10px 2px color-mix(in srgb, #b26bff 60%, transparent), inset 0 0 12px 1px color-mix(in srgb, #b26bff 32%, transparent)", dragon: "url(#dragon-neon-violet-frame)" },
      },
    },
  ])("$palette の光っていない札を見本の面・枠・太さ・影へ揃える", ({ palette, expected }) => {
    expect(Object.fromEntries(段の箱の札を読む(palette))).toEqual(expected);
    const values = table(palette);
    expect(values.get("--theme-stage-card-face")).toBe(expected.面.dragon);
    if (palette === "neon") expect(values.get("--theme-stage-card-frame")).toBe(expected.枠.dragon);
    expect(values.get("--theme-stage-card-frame-width")).toBe(expected.太さ.dragon);
    expect(values.get("--theme-stage-card-shadow")?.replace(/\s+/gu, " ")).toBe(expected.影.dragon);
  });

  it("浮彫の段の箱の線と主役色を同じ朱にする", () => {
    expect(table("relief").get("--er-line")).toBe("#c4573c");
    expect(table("relief").get("--theme-lead")).toBe("#c4573c");
    expect(table("relief").get("--dragon-theme-line")).toBe("var(--er-line)");
  });
});
