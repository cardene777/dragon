/**
 * 図の 7 意匠の値の表は画面の変数を読まない (#2962)。
 *
 * サイトの見た目は意匠ごとの表で替わる (`site-theme.css`)。 図の表が画面の変数 (`--d-*`) を
 * 読んだままだと、図とヘッダーの意匠が違う時に画面の色と字体が図へ漏れる。
 *
 * 図の中の規則は今も `--d-*` を読む (箱の面 / 枠 / 字体 等)。 それが画面の値にならないよう、
 * 舞台 (意匠を問わず舞台に当てる塊) が自分で同じ名前を宣言し直す。 確かめるのは 3 つ。
 *
 * 1. 7 意匠の値の表に `var(--d-` が 0 件
 * 2. 図の CSS が読む `--d-*` を、舞台の共通の塊か意匠の表が全部宣言している
 * 3. 意匠を持たない舞台だけに当てる規則が 0 件 (舞台は必ず意匠を持つ)
 *
 * 選択子で規則を探す処理は共有の helper が持つ (`theme-css-test-shape.test.ts` の決まり)。
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import { THEMES } from "@cardenelabs/dragon";

import {
  allRuleBodies,
  commonStageBodies,
  paletteLessStageSelectors,
  themeTableBodies,
} from "./theme-role-table-test-helpers";

const styles = resolve(dirname(fileURLToPath(import.meta.url)), "../styles");
const 図のCSS = ["cdl-theme.css", "theme-motion.css"].map((name) => readFileSync(resolve(styles, name), "utf8"));

const 読む名前 = (中身: string): string[] => [...中身.matchAll(/var\(\s*(--d-[a-z0-9-]+)/g)].map((m) => m[1]!);
const 宣言した名前 = (中身: string): string[] =>
  [...中身.matchAll(/(?:^|;)\s*(--d-[a-z0-9-]+)\s*:/g)].map((m) => m[1]!);
const 表の中身 = (意匠: string): string[] => 図のCSS.flatMap((css) => themeTableBodies(css, 意匠));

describe("図の値の表から画面の変数への参照を断つ (#2962)", () => {
  it.each(THEMES.map((意匠) => [意匠]))("%s の値の表で `var(--d-` を読む箇所が 0 件", (意匠) => {
    const 表 = 表の中身(意匠);
    expect(表.length, `${意匠} の値の表が無い (検査が空振りしている)`).toBeGreaterThan(0);
    expect(表.flatMap(読む名前)).toEqual([]);
  });

  it("図の CSS が読む画面の変数を、どの意匠の舞台も全部宣言し直している", () => {
    const 共通 = 図のCSS.flatMap(commonStageBodies).flatMap(宣言した名前);
    const 読む = [...new Set(図のCSS.flatMap(allRuleBodies).flatMap(読む名前))].sort();
    const 漏れる = THEMES.flatMap((意匠) => {
      const 宣言 = new Set([...共通, ...表の中身(意匠).flatMap(宣言した名前)]);
      return 読む.filter((名前) => !宣言.has(名前)).map((名前) => `${意匠}: ${名前}`);
    });
    console.log(`図の CSS が読む画面の変数 ${読む.length} 個、舞台が宣言し直さない組 ${漏れる.length} 件`);
    expect(読む.length, "読む名前を 1 つも導けていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(漏れる).toEqual([]);
  });

  it("意匠を書かない図だけに当てる規則が 0 件 (意匠を書かない図はサイトの意匠で描く)", () => {
    expect(図のCSS.flatMap(paletteLessStageSelectors)).toEqual([]);
  });
});
