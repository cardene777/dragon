/**
 * 実装の配色が設計 (`docs/design/app.pen`) と一致していることの検証 (#1124)。
 *
 * `globals.css` の冒頭は「値の出どころは `docs/design/app.pen` の variables」 と宣言している。
 * それが本当かを誰も確かめていなかったため、 実装だけが動いて 14 箇所ずれていた
 * (`#1112` / `#1113` の暗い側の作り直しと `#1116` の薄い文字)。
 *
 * ## `.pen` を直接読めない
 *
 * `.pen` は暗号化されていて `Read` も `grep` も通らない。 Pencil の MCP 経由でしか読めず、
 * 検査から呼べない。 そこで **書き出した写し** (`docs/design/palette.tsv`) と突き合わせる。
 *
 * 写しが古いと検査は嘘をつく。 それを防ぐため、 写しの更新手順を `docs/design/README.md` に
 * 置き、 写し自体が `.pen` の全変数を持つことを本検査で確かめる (件数と名前の双方向)。
 *
 * ## 双方向で見る
 *
 * 値の一致だけでは、 片方にしか無い変数を見逃す。 名前の集合が両側で同じことも見る。
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const 読む = (rel: string): string => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

/** 設計側の写し。 `名前 \t 明 \t 暗` の 3 列。 */
function penPalette(): Map<string, { light: string; dark: string }> {
  const out = new Map<string, { light: string; dark: string }>();
  for (const line of 読む("../../../docs/design/palette.tsv").split("\n")) {
    const s = line.trim();
    if (s === "" || s.startsWith("#!")) continue;
    const [名, l, d] = s.split("\t");
    expect(名, `写しの行を読めない: ${line}`).toBeTruthy();
    expect(l, `${名} の明が無い`).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/);
    expect(d, `${名} の暗が無い`).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/);
    out.set(名!, { light: l!, dark: d! });
  }
  return out;
}

/** 実装側。 `:root` と `html.dark` の `--d-*` を読む。 */
function cssPalette(): Map<string, { light: string; dark: string }> {
  const css = 読む("../src/styles/globals.css");
  const 塊 = (start: string): Map<string, string> => {
    const i = css.indexOf(start);
    expect(i, `${start} が見つからない`).toBeGreaterThanOrEqual(0);
    const j = css.indexOf("}", i);
    const m = new Map<string, string>();
    for (const x of css.slice(i, j).matchAll(/--d-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
      m.set(x[1]!, x[2]!.toLowerCase());
    }
    return m;
  };
  const light = 塊(":root {");
  const dark = 塊("html.dark {");
  const out = new Map<string, { light: string; dark: string }>();
  for (const [k, v] of light) {
    // `html.dark` で上書きしない変数は、 明の値がそのまま暗でも効く
    out.set(k, { light: v, dark: dark.get(k) ?? v });
  }
  return out;
}

test("設計と実装の色の名前が両側で揃っている", () => {
  const pen = penPalette();
  const css = cssPalette();
  expect(pen.size, "写しが空 (書き出しに失敗している)").toBeGreaterThan(20);

  const 設計のみ = [...pen.keys()].filter((k) => !css.has(k)).sort();
  const 実装のみ = [...css.keys()].filter((k) => !pen.has(k)).sort();
  expect(設計のみ, "設計にあって実装に無い色").toEqual([]);
  expect(実装のみ, "実装にあって設計に無い色").toEqual([]);
});

test("設計と実装の色の値が明暗とも一致している", () => {
  const pen = penPalette();
  const css = cssPalette();
  const ずれ: string[] = [];
  for (const [k, p] of pen) {
    const c = css.get(k);
    if (c === undefined) continue; // 名前の検査が別に落とす
    if (p.light !== c.light) ずれ.push(`${k} 明: 設計 ${p.light} / 実装 ${c.light}`);
    if (p.dark !== c.dark) ずれ.push(`${k} 暗: 設計 ${p.dark} / 実装 ${c.dark}`);
  }
  expect(ずれ, "設計と実装の色が食い違う").toEqual([]);
});
