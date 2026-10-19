import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseCssRules } from "../../scripts/theme-css-equivalence-core.mjs";
import {
  directDimensionsAndEffects,
  FIXED_THEMES,
  sectionHeadings,
  tableDeclarations,
  THEME_ROLE_TABLE_BASELINE,
  themeRuleAudit,
} from "../../tests/helpers/theme-role-table-final";
import { missingThemeRoleReads } from "./theme-role-table-test-helpers";
import { NAMED_DIAGRAM_RULE } from "./theme-role-table-contract-data";

const css = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../styles/cdl-theme.css"),
  "utf8",
);

function sectionAfter(heading: string): string {
  const headingAt = css.indexOf(heading);
  if (headingAt < 0) throw new Error(`節の見出しが無い: ${heading}`);
  const bodyAt = css.indexOf("*/", headingAt) + 2;
  const endAt = css.indexOf("/* ─────────────────", bodyAt);
  return css.slice(bodyAt, endAt < 0 ? css.length : endAt);
}

const sectionGroups = {
  "値の表": ["図の配色 (#1553)"],
  "共通の決まり": [
    "文字に線を引かせない。",
    "箱",
    "線",
    "区画",
    "枝分かれの図 (tree / mind-map) の枝",
    "クラス図と表のつながりの図で、箱をつなぐ線 (#2535)",
    "共通の部品の決まり (#2874)",
  ],
  "図だけの規則": ["図だけの規則"],
  "持ち越し": ["持ち越しの規則"],
  "図種の組": [
    "役を持つ意匠の流れ図。見本 (`流れ-*.html`) の線・印・分岐札だけを図種で限定して読む。",
    "既存の図種ごとの規則",
    "宅配の図表を意匠帳の役割色へ揃える (#2837)",
    "時間軸。",
    "固定の意匠の箱の枠の濃さ (#2808)",
    "固定の意匠の日程の棒と漏斗の段 (#2801)",
    "日程の帯と帯の上の担当の字 (#2826)",
    "図面の作り (#2790)",
    "活版の作り (#2791)",
    "図録の作り (#2792)",
    "端末の作り (#2793)",
    "手描きの作り (#2794)",
    "電飾の作り (#2795)",
    "浮彫の作り (#2796)",
    "線の上を走る丸 (#2537 / #2770)",
    "路線図だけの色。",
    "見本帳の階層図とマインドマップ (#2854 6a)",
    "段の箱の列 (#2831)",
    "固定 7 意匠の時間軸。",
    "#2854 3段目b: 図表と数の見本を cdl 0.128.0 の role へ当てる。",
    "見本帳 3 段目 k: 図表の意匠だけを補正する。",
    "見本帳の階層図とマインドマップ (#2854 7c / round 5)",
    "宅配の 4 つの記法見本 (#2836)",
  ],
} as const;

describe("意匠の値表の最後の確かめ (#2883)", () => {
  it("表と持ち越しを外した規則に直書きの太さ・角・影は 0 件", () => {
    const audit = themeRuleAudit(css);
    const direct = directDimensionsAndEffects(audit.inspectedRules);
    console.log(
      `値の表 ${audit.tableRules.length} 規則、持ち越し ${audit.carryoverMarkerCount} 規則、` +
        `検査対象 ${audit.inspectedRules.length} 規則、太さ・角・影の直書き ${direct.length} 件`,
    );
    expect(audit.tableRules).toHaveLength(THEME_ROLE_TABLE_BASELINE.tableRules);
    expect(audit.carryoverMarkerCount).toBe(THEME_ROLE_TABLE_BASELINE.carryoverMarkers);
    expect(audit.inspectedRules).toHaveLength(THEME_ROLE_TABLE_BASELINE.inspectedRules);
    expect(direct).toEqual([]);
  });

  it("7 意匠の表は読む役を空値や fallback で補わず、不足は 0 件", () => {
    const tables = tableDeclarations(css);
    const empty = [...tables].flatMap(([theme, values]) =>
      [...values].filter(([, value]) => value.trim() === "").map(([role]) => `${theme}: ${role}`));
    const missing = missingThemeRoleReads(css, FIXED_THEMES);

    console.log(`意匠 ${tables.size} 件、空値 ${empty.length} 件、読む役の不足 ${missing.length} 件`);
    if (missing.length > 0) console.log(`不足:\n${missing.join("\n")}`);
    expect([...tables.keys()]).toEqual([...FIXED_THEMES]);
    for (const [theme, values] of tables) {
      expect(values.size, `${theme} の表が空`).toBeGreaterThan(0);
    }
    expect(empty).toEqual([]);
    expect(missing).toEqual([]);
  });

  it("図だけの名指し規則と持ち越しは仕上げ後の基準から増減 0 件", () => {
    const diagramRules = parseCssRules(
      sectionAfter(" * 図だけの規則"),
      "diagram-only-section",
    ).rules;
    const named = diagramRules.filter(({ selector }) => NAMED_DIAGRAM_RULE.test(selector));
    const carryoverMarkers = css.match(/\/\* 持ち越しの目印:/g) ?? [];

    console.log(
      `図だけ ${diagramRules.length} 規則（名指し ${named.length} 規則）、` +
        `持ち越し ${carryoverMarkers.length} 規則`,
    );
    expect(diagramRules).toHaveLength(THEME_ROLE_TABLE_BASELINE.diagramOnlyRules);
    expect(named).toHaveLength(THEME_ROLE_TABLE_BASELINE.namedDiagramOnlyRules);
    expect(carryoverMarkers).toHaveLength(THEME_ROLE_TABLE_BASELINE.carryoverMarkers);
  });

  it("全ての節は 5 区分のどれか 1 つに属する", () => {
    const actual = sectionHeadings(css);
    const classified = Object.values(sectionGroups).flat();
    const unclassified = actual.filter((heading) => !classified.includes(heading as never));
    const missing = classified.filter((heading) => !actual.includes(heading));

    console.log(
      Object.entries(sectionGroups)
        .map(([group, headings]) => `${group} ${headings.length} 節`)
        .join("、"),
    );
    expect(new Set(classified).size).toBe(classified.length);
    expect(unclassified).toEqual([]);
    expect(missing).toEqual([]);
    expect(classified).toHaveLength(actual.length);
  });
});
