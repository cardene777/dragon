import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

import { 固定色を取り出す } from "./helpers/fixed-colors";
import {
  declarations,
  THEME_ROLE_TABLE_BASELINE,
  themeRuleAudit,
} from "./helpers/theme-role-table-final";

const css = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../src/styles/cdl-theme.css"),
  "utf8",
);

test("7 意匠の表と持ち越しを外した規則に色の直書きは 0 件", async ({ page }) => {
  const audit = themeRuleAudit(css);
  const values = audit.inspectedRules.flatMap(({ body }) =>
    declarations(body).map(({ value }) => value));
  const direct = await 固定色を取り出す(page, values);

  console.log(
    `値の表 ${audit.tableRules.length} 規則、持ち越し ${audit.carryoverMarkerCount} 規則、` +
      `検査対象 ${audit.inspectedRules.length} 規則、色の直書き ${direct.length} 件`,
  );
  expect(audit.tableRules).toHaveLength(THEME_ROLE_TABLE_BASELINE.tableRules);
  expect(audit.carryoverMarkerCount).toBe(THEME_ROLE_TABLE_BASELINE.carryoverMarkers);
  expect(audit.inspectedRules).toHaveLength(THEME_ROLE_TABLE_BASELINE.inspectedRules);
  expect(values.length, "宣言を 1 件も読まずに素通りしている").toBeGreaterThan(0);
  expect(direct).toEqual([]);
});
