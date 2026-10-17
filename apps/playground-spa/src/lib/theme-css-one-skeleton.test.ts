import { describe, expect, it } from "vitest";

import { THEME_SHAPE_DECLARATION_ALLOWLIST } from "./theme-role-table-contract-data";
import {
  readCdlThemeCssRules,
  themeSpecificShapeDeclarations,
} from "./theme-role-table-test-helpers";

const key = ({ selector, property, value }: { selector: string; property: string; value: string }): string =>
  `${selector.replace(/\s+/gu, " ").trim()} { ${property}: ${value.replace(/\s+/gu, " ").trim()} }`;

describe("意匠の CSS は図ごとの骨組みを変えない (#2909)", () => {
  it("配色で分かれる形の宣言は許した選択子と宣言の組だけ", () => {
    const actual = themeSpecificShapeDeclarations(readCdlThemeCssRules()).map(key).sort();
    const allowed = THEME_SHAPE_DECLARATION_ALLOWLIST.map(key).sort();

    expect(new Set(allowed).size, "許可一覧に重複がある").toBe(allowed.length);
    expect(actual, `検出 ${actual.length} 件、許可 ${allowed.length} 件`).toEqual(allowed);
  });
});
