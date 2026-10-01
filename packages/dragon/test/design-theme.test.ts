import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// @ts-expect-error -- 検査対象は .mjs で型宣言を持たない
import { findNestedAtRules, scopeThemeCss } from "../scripts/design-theme-css.mjs";

type Scoped = { css: string; dropped: number; count: number; keyframes: number };

const ここ = dirname(fileURLToPath(import.meta.url));
const THEME = join(ここ, "..", "..", "..", "apps", "playground-spa", "src", "styles", "cdl-theme.css");

describe("色の規則を面の下に閉じ込める", () => {
  it("選択子に面の class を付ける", () => {
    const r = scopeThemeCss('[data-cdl-role="node-body"] { fill: red !important; }', ".light-face") as Scoped;

    expect(r.count).toBe(1);
    expect(r.css).toContain('.light-face [data-cdl-role="node-body"]');
    expect(r.css, "!important が落ちている").toContain("fill: red !important");
  });

  it("並べて書いた選択子を 1 つずつ包む", () => {
    const r = scopeThemeCss('[data-cdl-role="a"],\n[data-cdl-role="b"] > rect { fill: red; }', ".dark-face") as Scoped;

    expect(r.css).toContain('.dark-face [data-cdl-role="a"]');
    expect(r.css).toContain('.dark-face [data-cdl-role="b"] > rect');
    expect(r.css, "包み忘れた選択子がある").not.toMatch(/(^|\n)\[data-cdl-role/);
  });

  it(":root の宣言は落とす", () => {
    const r = scopeThemeCss(":root { --cdl-text: red; }\n[data-cdl-role=\"x\"] { fill: red; }", ".light-face") as Scoped;

    expect(r.dropped).toBe(1);
    expect(r.count).toBe(1);
    expect(r.css, "面の変数を上書きしてしまう").not.toContain("--cdl-text");
  });

  it("波括弧を含む注釈があっても壊れない", () => {
    const css = '/* 例 { fill: blue } は書かない */\n[data-cdl-role="x"] { fill: red; }';
    const r = scopeThemeCss(css, ".light-face") as Scoped;

    expect(r.count).toBe(1);
    expect(r.css).toContain('.light-face [data-cdl-role="x"]');
    expect(r.css, "注釈の中身が規則として出ている").not.toContain("blue");
  });

  it("中身が空の規則は数えない", () => {
    const r = scopeThemeCss('[data-cdl-role="x"] { }', ".light-face") as Scoped;
    expect(r.count).toBe(0);
  });

  it("動きの定義は面を付けずそのまま出す", () => {
    const css = "@keyframes wave {\n  from { r: 8px; }\n  to { r: 20px; }\n}\n"
      + '[data-cdl-role="x"] { fill: red; }';
    const r = scopeThemeCss(css, ".light-face") as Scoped;

    expect(r.keyframes, "動きの定義を取り出していない").toBe(1);
    expect(r.css).toContain("@keyframes wave");
    expect(r.css).toContain("from { r: 8px; }");
    // 名前で引く決まりなので、面を付けると規則から引けなくなる
    expect(r.css, "動きの定義に面が付いている").not.toContain(".light-face @keyframes");
    // 平らな走査が内側だけを拾うと、この形の規則が出る
    expect(r.css, "動きの中身が規則として漏れている").not.toContain(".light-face from");
    expect(r.count, "色の規則の数に動きが混ざっている").toBe(1);
  });

  it("動きの定義が 2 つ続いても両方取り出す", () => {
    const css = "@keyframes a { from { r: 1px; } to { r: 2px; } }\n"
      + "@keyframes b { from { r: 3px; } to { r: 4px; } }";
    const r = scopeThemeCss(css, ".dark-face") as Scoped;

    expect(r.keyframes).toBe(2);
    expect(r.css).toContain("@keyframes a");
    expect(r.css).toContain("@keyframes b");
  });
});

describe("入れ子の規則の検知", () => {
  it("@media を見つける", () => {
    const found = findNestedAtRules("@media (min-width: 40rem) { [data-cdl-role=\"x\"] { fill: red; } }") as string[];

    expect(found.length, "入れ子を 1 つも見つけていない").toBeGreaterThan(0);
    expect(found[0]).toContain("@media");
  });

  it("入れ子が無ければ空を返す", () => {
    expect(findNestedAtRules('[data-cdl-role="x"] { fill: red; }')).toEqual([]);
  });

  it("注釈の中の @media は数えない", () => {
    expect(findNestedAtRules("/* @media を使わない { */\n[data-cdl-role=\"x\"] { fill: red; }")).toEqual([]);
  });

  it("@keyframes は数えない", () => {
    // 変換が丸ごと取り出して面を付けずに出すので、落ちる入れ子ではない (#2770)
    expect(findNestedAtRules("@keyframes wave { from { r: 8px; } to { r: 20px; } }")).toEqual([]);
  });
});

describe("実物の色の規則", () => {
  const css = readFileSync(THEME, "utf8");

  it("読めて、規則が 1 件以上ある", () => {
    const r = scopeThemeCss(css, ".light-face") as Scoped;
    expect(r.count, "色の規則を 1 件も読めていない (file の場所が変わった可能性)").toBeGreaterThan(0);
  });

  it("箱の塗りを当てる規則が含まれる", () => {
    const r = scopeThemeCss(css, ".light-face") as Scoped;
    expect(r.css).toContain('.light-face [data-cdl-role="node-body"]');
  });

  it("扱えない入れ子をいまは持たない", () => {
    // 持つようになったら、閉じ込める変換が中身を落とす。 その時にここが落ちて気付ける
    expect(findNestedAtRules(css)).toEqual([]);
  });

  it("走る丸の動きが意匠帳にも出る", () => {
    // 動きの定義が落ちると、意匠帳では丸が止まったまま並ぶ (#2770)
    const r = scopeThemeCss(css, ".light-face") as Scoped;
    expect(r.keyframes, "動きの定義を 1 つも取り出していない").toBeGreaterThan(0);
    expect(r.css).toContain("@keyframes running-dot-wave-outer");
    expect(r.css, "動きの中身が規則として漏れている").not.toContain(".light-face from");
  });
});
