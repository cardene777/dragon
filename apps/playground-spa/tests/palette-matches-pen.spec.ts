/**
 * 実装の配色が設計 (`docs/design/app.pen`) と一致していることの検証 (#1124)。
 *
 * `globals.css` の冒頭は「値の出どころは `docs/design/app.pen` の variables」 と宣言している。
 * それを確かめる経路が無かったため、 実装だけが動いて 14 箇所ずれていた
 * (`#1112` / `#1113` の暗い側の作り直しと `#1116` の薄い文字)。
 *
 * ## `.pen` を直接読む
 *
 * 初版は「`.pen` は暗号化されていて読めない」 という前提で写し (`palette.tsv`) を経由して
 * いた。 **前提が誤りだった** = `.pen` は素の UTF-8 JSON で `JSON.parse` がそのまま通る。
 *
 * 写しを経由すると、 `.pen` だけを直した時に検査が通ってしまう (review 指摘)。 設計と実装の
 * どちらが取り残されても落ちる、 という本検査の目的を満たさない。 直接読む。
 *
 * ## 双方向で見る
 *
 * 値の一致だけでは、 片方にしか無い変数を見逃す。 名前の集合が両側で同じことも見る。
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const 読む = (rel: string): string => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

type 色 = { light: string; dark: string };

/** 設計側。 `.pen` の `variables` から色だけを取る。 */
function penPalette(): Map<string, 色> {
  const doc = JSON.parse(読む("../../../docs/design/app.pen")) as {
    variables?: Record<string, { type: string; value: unknown }>;
  };
  const vars = doc.variables;
  expect(vars, "`.pen` に variables が無い").toBeTruthy();

  const out = new Map<string, 色>();
  for (const [名, d] of Object.entries(vars!)) {
    if (d.type !== "color") continue;
    // 明暗を持つ色は `{value, theme}` の配列。 1 値だけの色は明暗とも同じ値になる。
    const v = d.value;
    if (typeof v === "string") {
      out.set(名, { light: v.toLowerCase(), dark: v.toLowerCase() });
      continue;
    }
    expect(Array.isArray(v), `${名} の value を読めない`).toBe(true);
    const m: Record<string, string> = {};
    for (const x of v as { value: string; theme?: { mode?: string } }[]) {
      const mode = x.theme?.mode;
      if (mode !== undefined) m[mode] = String(x.value).toLowerCase();
    }
    expect(m.light, `${名} に light の値が無い`).toBeTruthy();
    expect(m.dark, `${名} に dark の値が無い`).toBeTruthy();
    out.set(名, { light: m.light!, dark: m.dark! });
  }
  return out;
}

/** 実装側。 `:root` と `html.dark` の `--d-*` を読む。 */
function cssPalette(): Map<string, 色> {
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
  const out = new Map<string, 色>();
  for (const [k, v] of light) {
    // `html.dark` で上書きしない変数は、 明の値がそのまま暗でも効く
    out.set(k, { light: v, dark: dark.get(k) ?? v });
  }
  return out;
}

test("設計と実装の色の名前が両側で揃っている", () => {
  const pen = penPalette();
  const css = cssPalette();
  // 0 件だと下の値の検査が「対象なし」 で素通りする
  expect(pen.size, "`.pen` から色を 1 つも読めていない").toBeGreaterThan(20);
  expect(css.size, "`globals.css` から色を 1 つも読めていない").toBeGreaterThan(20);

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
