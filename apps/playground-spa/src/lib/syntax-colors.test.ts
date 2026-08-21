/**
 * 記述の色が読める明るさであることの検証 (#1310)。
 *
 * 色を足すまで、**記述の文字の対比を測る検査が 1 件も無かった**
 * (`rendered-contrast.spec.ts` は図の名札しか測らない)。 色分けは読みやすくするための
 * 変更なので、読めることを機械で確かめる。
 *
 * ## 地は `--d-code-bg` 1 つ
 *
 * 色が付く区間は必ず code の地の上に置く (`styles/syntax.css` § 行の中に置く短い記述)。
 * 記法一覧の周りは `--d-surface-2` で、そのまま置くと暗い側で 3 色が基準を割る。
 *
 * ## 色の一覧は CSS から導く
 *
 * 手で並べると色を足した時に検査だけが古くなる。 `syntax.css` と `globals.css` を読んで
 * `tok-*` に当たっている色を集める。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

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

/** `globals.css` / `cdl-theme.css` の変数を明暗で読む */
function 変数表(): Map<string, { 明: string; 暗: string }> {
  const out = new Map<string, { 明: string; 暗: string }>();
  const src = 読む("../styles/globals.css");
  const 区間 = (開始: string): string => {
    const i = src.indexOf(開始);
    expect(i, `${開始} が globals.css に無い`).toBeGreaterThanOrEqual(0);
    return src.slice(i, src.indexOf("}", i));
  };
  for (const m of 区間(":root {").matchAll(/--d-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    const 名 = m[1] ?? "";
    const 値 = m[2] ?? "";
    out.set(名, { 明: 値, 暗: 値 });
  }
  for (const m of 区間("html.dark {").matchAll(/--d-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    const 名 = m[1] ?? "";
    const 既 = out.get(名);
    if (既) out.set(名, { 明: 既.明, 暗: m[2] ?? "" });
  }
  return out;
}

/** `cdl-theme.css` の `--cdl-tone-*` が指す `--d-*` の名前 */
function 色名の対応(): Map<string, string> {
  const out = new Map<string, string>();
  const src = 読む("../styles/cdl-theme.css");
  for (const m of src.matchAll(/--cdl-tone-([a-z]+):\s*var\(--d-([a-z0-9-]+)\)/g)) {
    const tone = m[1] ?? "";
    if (!out.has(tone)) out.set(tone, m[2] ?? "");
  }
  return out;
}

/** `syntax.css` が `tok-*` に当てている `--d-*` の名前 */
function 構文色の対応(): Map<string, string> {
  const out = new Map<string, string>();
  const src = 読む("../styles/syntax.css");
  for (const m of src.matchAll(/\.tok-([^\s{:[]+)[^{]*\{\s*color:\s*var\(--d-([a-z0-9-]+)\)/g)) {
    const 種類 = m[1] ?? "";
    if (!out.has(種類)) out.set(種類, m[2] ?? "");
  }
  return out;
}

/**
 * `syntax.css` が `warning` に当てている暗くする割合を読む。
 *
 * **検査の中に数を書かない**。 書くと CSS 側で派生をやめても検査が通る (実測で
 * 変異が生き残った)。 CSS を読んで、実際に当たっている割合で測る。
 */
function 暗くする割合(): number | undefined {
  const src = 読む("../styles/syntax.css");
  const m = src.match(
    /\.tok-色名\[data-tone="warning"\][^{]*\{[^}]*color-mix\(in srgb,\s*var\(--cdl-tone-warning\)\s*(\d+)%,\s*black\)/,
  );
  return m === null ? undefined : Number(m[1]) / 100;
}

const 表 = 変数表();
const 地 = 表.get("code-bg");

describe("記述の色が読める明るさになっている (#1310)", () => {
  it("地の色を読めている", () => {
    expect(地, "--d-code-bg を読めていない (検査が空振りしている)").toBeDefined();
  });

  it("`tok-*` に当てた色を CSS から 1 つ以上導けている", () => {
    // 手で並べると色を足した時に検査だけが古くなる
    expect(構文色の対応().size, "tok-* の色を 1 つも導けていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("`tok-*` の色がすべて明暗とも対比 4.5 以上", () => {
    const 落ちた: string[] = [];
    let 測れた = 0;
    for (const [種類, 変数] of 構文色の対応()) {
      const c = 表.get(変数);
      expect(c, `--d-${変数} を読めていない`).toBeDefined();
      測れた += 1;
      const 明 = 対比(c!.明, 地!.明);
      const 暗 = 対比(c!.暗, 地!.暗);
      if (明 < 4.5 || 暗 < 4.5) 落ちた.push(`${種類} (--d-${変数}): 明 ${明.toFixed(2)} / 暗 ${暗.toFixed(2)}`);
    }
    expect(測れた, "色を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(落ちた, "地の上で読めない構文色がある").toEqual([]);
  });

  it("色名がすべて明暗とも対比 4.5 以上 (`warning` は暗く派生させた分を見る)", () => {
    const 対応 = 色名の対応();
    expect(対応.size, "色名の対応を 1 つも導けていない (検査が空振りしている)").toBeGreaterThan(0);
    const 落ちた: string[] = [];
    for (const [tone, 変数] of 対応) {
      const c = 表.get(変数);
      if (c === undefined) continue;
      // `warning` だけ構文色で暗く派生させている。 割合は CSS から読む
      const 割合 = 暗くする割合();
      const 明の色 = tone === "warning" && 割合 !== undefined ? 暗くする(c.明, 割合) : c.明;
      const 明 = 対比(明の色, 地!.明);
      const 暗 = 対比(c.暗, 地!.暗);
      if (明 < 4.5 || 暗 < 4.5) 落ちた.push(`${tone} (--d-${変数}): 明 ${明.toFixed(2)} / 暗 ${暗.toFixed(2)}`);
    }
    expect(落ちた, "地の上で読めない色名がある").toEqual([]);
  });

  it("`warning` の派生が CSS に書かれている", () => {
    // 割合を検査の中に書くと、CSS 側で派生をやめても通ってしまう (実測で変異が生き残った)
    const 割合 = 暗くする割合();
    expect(割合, "syntax.css に warning の派生が無い").toBeDefined();
    expect(割合!, "派生の割合が 1 以上 (暗くなっていない)").toBeLessThan(1);
  });

  it("`warning` は派生させないと基準を割る (派生が要ることの裏取り)", () => {
    // 派生なしで通るなら、そもそも派生が要らない = 記述と実装が食い違っている
    const 変数 = 色名の対応().get("warning");
    expect(変数, "warning の対応を導けていない").toBeDefined();
    const c = 表.get(変数!);
    expect(対比(c!.明, 地!.明), "派生なしで基準を満たしている (記述が古い)").toBeLessThan(4.5);
  });
});

/** `color-mix(in srgb, <色> N%, black)` と同じ計算 */
function 暗くする(hex: string, 割合: number): string {
  const h = hex.replace("#", "");
  return `#${[0, 2, 4]
    .map((i) => Math.round(parseInt(h.slice(i, i + 2), 16) * 割合).toString(16).padStart(2, "0"))
    .join("")}`;
}
