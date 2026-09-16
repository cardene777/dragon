import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * 名前の表の区切りが名乗る件数が、その区切りの中身と合っていることの検証 (#2085)。
 *
 * `i18n.ts` の名前の表は `// === … ===` の区切りで群に分かれ、区切りの多くが件数を名乗る
 * (「shape-driven hardware 6」 等)。 件数は中身を数えれば出るので、手で書いた側は群に名前を
 * 足した日にずれる。 実測では 35 の区切りのうち 1 つ (図表系) が 12 と名乗ったまま 15 件に
 * 増えていた。
 *
 * ## 名乗っている区切りだけを見る
 *
 * 件数を書かない区切り (「presets = 定番図テンプレート」) は直す対象ではない。
 * 数を書かない形は #2080 で選んだ既定で、ここで落とすと数を書く方向へ押し戻してしまう。
 *
 * ## 名乗りは「数 + 単位」 の形だけを拾う
 *
 * 単位を伴わない数は名乗りとみなさない。 群の件数なのか別の意味の数なのかが字面では決まらない
 * ため、拾うと正しい区切りまで落ちる。 実測では「parts catalog Round 2 (10 追加 widget…)」 の
 * 2 を件数と読み、中身 10 件と食い違う判定になった (その 2 は何回目かを指す番号)。
 */

const ROOT = join(import.meta.dirname, "../../../..");
const 表のfile = join(ROOT, "apps/playground-spa/src/lib/i18n.ts");

type 区切り = { 行: number; 題: string; 名乗り: number[]; 実際: number };

/** 区切りごとに、名乗った件数と中身の件数を数える */
function 区切りごとの件数(src: string): 区切り[] {
  const 出: 区切り[] = [];
  let 今: 区切り | null = null;
  src.split("\n").forEach((line, i) => {
    const t = line.trim();
    const m = /^\/\/\s*===\s*(.+?)\s*===/u.exec(t);
    if (m) {
      if (今) 出.push(今);
      const 題 = m[1] ?? "";
      今 = {
        行: i + 1,
        題,
        名乗り: [...題.matchAll(/(\d+)\s*(?:種|件|個)/gu)].flatMap((x) =>
          x[1] === undefined ? [] : [Number(x[1])],
        ),
        実際: 0,
      };
      return;
    }
    // 表の要素 (`key: "値",`)。 入れ子は持たないので 1 行 1 件で数えられる
    if (今 && /^["'A-Za-z0-9_][A-Za-z0-9_"']*\s*:/u.test(t)) 今.実際 += 1;
  });
  if (今) 出.push(今);
  return 出;
}

const 区切りら = 区切りごとの件数(readFileSync(表のfile, "utf8"));

describe("名前の表の区切りが名乗る件数が中身と合っている (#2085)", () => {
  it("区切りを集められている", () => {
    // 集められていなければ、以下の検査は通って当然になる
    expect(区切りら.length, "区切りを 1 件も集められていない").toBeGreaterThan(10);
  });

  it("件数を名乗る区切りを 1 件以上見つけられている (空振り防止)", () => {
    const 名乗る = 区切りら.filter((s) => s.名乗り.length > 0);
    expect(名乗る.length, "件数を名乗る区切りを 1 件も見ていない").toBeGreaterThan(0);
  });

  it("名乗った件数と中身が食い違う区切りが無い", () => {
    const 食い違い = 区切りら
      .filter((s) => s.名乗り.length > 0 && !s.名乗り.includes(s.実際))
      .map((s) => `${s.行}行目「${s.題}」 名乗り=${s.名乗り.join(" / ")} 中身=${s.実際}`);
    expect(食い違い, "区切りが名乗る件数と中身がずれている").toEqual([]);
  });

  it("食い違いを拾える (植え込み対照)", () => {
    // 拾えない判定だと、上の検査はずれていても通る
    const 偽 = ['  // === 図表系 12 種 ===', '  a: "あ",', '  b: "い",'].join("\n");
    const 出 = 区切りごとの件数(偽);
    expect(出, "区切りを拾えていない").toHaveLength(1);
    const 先頭 = 出[0];
    if (先頭 === undefined) return;
    expect(先頭.名乗り, "名乗りを読めていない").toEqual([12]);
    expect(先頭.実際, "中身を数えられていない").toBe(2);
  });

  it("件数を名乗らない区切りと、単位の無い数は名乗りにしない (陰性対照)", () => {
    // 何でも名乗りとみなすと、数を書かない区切りまで落ちる
    const 偽 = ['  // === presets = 定番図テンプレート ===', '  a: "あ",'].join("\n");
    expect(区切りごとの件数(偽)[0]?.名乗り, "名乗りの無い区切りを拾っている").toEqual([]);
    const 単位なし = ['  // === primitives = 基本要素種類5 ===', '  a: "あ",'].join("\n");
    expect(区切りごとの件数(単位なし)[0]?.名乗り, "単位の無い数を名乗りとみなしている").toEqual([]);
  });
});
