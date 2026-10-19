/**
 * 記述の色が読める明るさであることの検証 (#1310 / #2962)。
 *
 * 色を足すまで、**記述の文字の対比を測る検査が 1 件も無かった**
 * (`rendered-contrast.spec.ts` は図の名札しか測らない)。 色分けは読みやすくするための
 * 変更なので、読めることを機械で確かめる。
 *
 * ## 地は `--d-code-bg` 1 つ
 *
 * 色が付く区間は必ず code の地の上に置く (`styles/syntax.css` § 行の中に置く短い記述)。
 * 編集画面の記述欄も同じ地に描く (`CdlEditor.tsx` の `CODE_THEME_RULES`)。
 *
 * ## 意匠ごとに測る (#2962)
 *
 * 画面の変数は意匠ごとの表 (`site-theme.css`) が決める。 明暗の 2 組ではなく、7 意匠の表それぞれの
 * 地の上で測る。
 *
 * ## 色の一覧は CSS と編集画面から導く
 *
 * 手で並べると色を足した時に検査だけが古くなる。 `syntax.css` の `tok-*` と、編集画面の
 * 色分け (`CODE_TAG_COLORS`) が読む変数を集める。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { THEMES } from "@cardenelabs/dragon";

const 読む = (rel: string): string =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

/** `#rrggbb` を相対輝度に */
function 輝度(hex: string): number {
  const h = hex.replace("#", "");
  const [r = 0, g = 0, b = 0] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function 対比(a: string, b: string): number {
  const x = 輝度(a);
  const y = 輝度(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** `site-theme.css` の意匠ごとの表から 6 桁の色だけを読む */
function 意匠の表(): Map<string, Map<string, string>> {
  const src = 読む("../styles/site-theme.css").replace(/\/\*[\s\S]*?\*\//g, "");
  return new Map(
    THEMES.map((意匠) => {
      const 開始 = src.indexOf(`html[data-site-theme="${意匠}"] {`);
      const 中身 = 開始 < 0 ? "" : src.slice(開始, src.indexOf("}", 開始));
      const 値 = new Map(
        [...中身.matchAll(/--d-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1]!, m[2]!]),
      );
      return [意匠, 値] as const;
    }),
  );
}

/** `syntax.css` が `tok-*` に当てている `--d-*` の名前 (色名を含む) */
function 構文色の対応(): Map<string, string> {
  const out = new Map<string, string>();
  const src = 読む("../styles/syntax.css");
  for (const m of src.matchAll(/\.(tok-[^\s{:]+(?:\[[^\]]+\])?)[^{]*\{\s*color:\s*var\(--d-([a-z0-9-]+)\)/g)) {
    const 種類 = m[1] ?? "";
    if (!out.has(種類)) out.set(種類, m[2] ?? "");
  }
  return out;
}

/** 編集画面の色分けが読む `--d-*` の名前 */
function 編集画面の色(): Map<string, string> {
  const src = 読む("../components/CdlEditor.tsx");
  const 区間 = src.slice(src.indexOf("const CODE_TAG_COLORS"), src.indexOf("];", src.indexOf("const CODE_TAG_COLORS")));
  return new Map(
    [...区間.matchAll(/color:\s*"var\(--d-([a-z0-9-]+)\)"/g)].map((m) => [`編集画面 --d-${m[1]}`, m[1]!]),
  );
}

const 表 = 意匠の表();
const 測る色 = new Map([...構文色の対応(), ...編集画面の色()]);

describe("記述の色が 7 意匠それぞれの地の上で読める (#1310 / #2962)", () => {
  it("7 意匠の表から地の色を読めている", () => {
    const 地が無い = THEMES.filter((意匠) => 表.get(意匠)?.get("code-bg") === undefined);
    expect(地が無い, "--d-code-bg を読めていない (検査が空振りしている)").toEqual([]);
  });

  it("色分けの色を CSS と編集画面から導けている", () => {
    expect(構文色の対応().size, "tok-* の色を 1 つも導けていない").toBeGreaterThan(0);
    expect(編集画面の色().size, "編集画面の色を 1 つも導けていない").toBeGreaterThan(0);
    expect([...構文色の対応().keys()].some((k) => k.includes("data-tone")), "色名を導けていない").toBe(true);
  });

  it.each(THEMES.map((意匠) => [意匠]))("%s の地の上で、色分けの色がすべて対比 4.5 以上", (意匠) => {
    const 値 = 表.get(意匠) ?? new Map<string, string>();
    const 地 = 値.get("code-bg") ?? "#000000";
    const 落ちた: string[] = [];
    const 読めない: string[] = [];
    let 最小 = Infinity;
    for (const [種類, 変数] of 測る色) {
      const 色 = 値.get(変数);
      if (色 === undefined) {
        読めない.push(`${種類} (--d-${変数})`);
        continue;
      }
      const 比 = 対比(色, 地);
      最小 = Math.min(最小, 比);
      if (比 < 4.5) 落ちた.push(`${種類} (--d-${変数} ${色} on ${地}): ${比.toFixed(2)}`);
    }
    console.log(`${意匠}: 色 ${測る色.size} 種、最小の対比 ${最小.toFixed(2)}`);
    expect(読めない, `${意匠} の表に色分けの変数が無い`).toEqual([]);
    expect(落ちた, `${意匠} の地の上で読めない色がある`).toEqual([]);
  });
});
