import { describe, expect, it } from "vitest";

import {
  sourceJson__pattern__sortingShelfGantt__強調なし,
  sourceJson__pattern__sortingShelfGantt__帯だけ,
  sourceJson__sortingShelfGantt,
  sourceYaml__pattern__sortingShelfGantt__強調なし,
  sourceYaml__pattern__sortingShelfGantt__帯だけ,
  sourceYaml__sortingShelfGantt,
} from "@/topics/catalog/charts.cdl";

import { readCdlThemeRoleTable } from "./theme-role-table-test-helpers";

const 意匠 = ["blueprint", "letterpress", "catalog", "terminal", "sketch", "neon", "relief"] as const;
const 沈んだ色 = {
  blueprint: "#8aa3b1",
  letterpress: "#9d9382",
  catalog: "#9c9381",
  terminal: "#355542",
  sketch: "#9a9080",
  neon: "#8f86b3",
  relief: "#a99e8e",
} as const;
const 工程の沈んだ字 = {
  blueprint: "#4d7187",
  letterpress: "#6b6253",
  catalog: "#6f6757",
  terminal: "#8a9b90",
  sketch: "#6d6456",
  neon: "#c4bce0",
  relief: "#7a7062",
} as const;

describe("工程の図の 7 意匠", () => {
  it.each(意匠)("%s の沈んだ色と工程専用色を見本の口へ当てる", (name) => {
    const declarations = readCdlThemeRoleTable(name);
    expect(declarations.get("--cdl-tone-muted"), `${name} の沈んだ色`).toBe(沈んだ色[name]);
    expect(declarations.get("--dragon-chart-axis-text"), `${name} の沈んだ字`).toBe(工程の沈んだ字[name]);
    expect(declarations.get("--cdl-gantt-arrow"), `${name} の依存の線`).toBe("var(--cdl-chart-2)");
    expect(declarations.get("--cdl-gantt-milestone"), `${name} の節目`).toBe("var(--cdl-chart-1)");
    expect(declarations.get("--cdl-gantt-today"), `${name} の今日`).toBe("var(--er-own)");
  });

  it("沈んだ帯と電飾の管の枠の値を表に持つ", () => {
    for (const name of ["blueprint", "letterpress"] as const) {
      expect(readCdlThemeRoleTable(name).get("--dragon-chart-band-frame")).toBe("currentColor");
    }
    expect(readCdlThemeRoleTable("neon").get("--dragon-chart-band-frame")).toBe(
      "color-mix(in srgb, currentColor 35%, white 65%)",
    );
  });
});

describe("工程の図の見本の値", () => {
  const 全記法 = [
    sourceYaml__sortingShelfGantt,
    sourceJson__sortingShelfGantt,
    sourceYaml__pattern__sortingShelfGantt__帯だけ,
    sourceJson__pattern__sortingShelfGantt__帯だけ,
    sourceYaml__pattern__sortingShelfGantt__強調なし,
    sourceJson__pattern__sortingShelfGantt__強調なし,
  ];
  const 主役つき記法 = 全記法.slice(0, 4);

  it.each(全記法)("帯の始まりと最後を position の見本位置で渡す", (source) => {
    expect(source).toMatch(/試す[\s\S]*?9月\+0\.60/gu);
    expect(source).toMatch(/survey_end["']?\s*:\s*0\.75/gu);
    expect(source).toMatch(/design_end["']?\s*:\s*1\.80/gu);
    expect(source).toMatch(/shelf_end["']?\s*:\s*3\.20/gu);
    expect(source).toMatch(/terminal_end["']?\s*:\s*3\.25/gu);
    expect(source).toMatch(/trial_end["']?\s*:\s*4\.20/gu);
  });

  it.each(主役つき記法)("主役 3 件・沈んだ帯 2 件・節目と今日を主役つき記法で渡す", (source) => {
    expect(source.match(/emphasis["']?\s*:\s*["']?primary/gu)).toHaveLength(3);
    expect(source.match(/tone["']?\s*:\s*["']?muted/gu)).toHaveLength(2);
    expect(source).toMatch(/milestone["']?\s*:\s*true/gu);
    expect(source).toMatch(/ganttToday/gu);
    expect(source).toMatch(/ganttTickLabels/gu);
    expect(source).toMatch(/ganttBarEnd["']?\s*:\s*["']?position/gu);
    expect(source).toMatch(/ganttBarThickness["']?\s*:\s*["']?thin/gu);
  });
});
