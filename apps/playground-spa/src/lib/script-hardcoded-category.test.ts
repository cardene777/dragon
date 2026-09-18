// @vitest-environment node
/**
 * 撮影の道具が分類の一覧を書き写していないことの検証 (#2244)。
 *
 * `shoot-zoom.mjs` は図の識別子を画面から拾う形に直してあったが、**分類は書き写したまま**
 * だった。 書き写した一覧は 8 件で、実物の `CATEGORIES` は 11 件。
 * 増えた 3 分類 (`ethereum` / `charts` / `parts`) を一度も撮っていなかった。
 *
 * **欠けが出力に現れない**。 一覧に無い分類はそもそも回らないので、撮れなかった記録にも
 * 出ない。 走り終わりの合計だけを見ても気付けない。
 *
 * ## 何を止めるか
 *
 * 止めるのは **分類の綴りを 2 つ以上並べた形** だけ。 1 つだけを名指しする形
 * (`/catalog/patterns` を開く道具) は、その分類だけを見る道具として正しい。
 *
 * 2 つ以上並ぶのは「一覧を持とうとした」 形で、実物が増えた日に必ず古くなる。
 *
 * ## 分類の綴りは実物から引く
 *
 * 綴りを手で並べると、分類を足した日にこの検査の側が古くなる
 * (`rules/quality.md § 導出可能記述は人手で書かない`)。 `CATEGORIES` の `slug` を使う。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, join } from "node:path";
import { CATEGORIES } from "./catalog";
import { 走査するfile, 絶対path } from "../../../../test-support/scan-targets";

/** この file から見た repo の根 (`apps/playground-spa/src/lib/` の 4 つ上) */
const 根 = fileURLToPath(new URL("../../../../", import.meta.url));

/** repo から見た path を絶対 path に直す */
const 新しいpath = (相対: string): string => join(根, 相対);

/**
 * この検査そのもの。
 *
 * 下の判定は「分類の綴りが 2 つ以上並ぶ」 形を拾うので、綴りを説明に書いたこの file 自身が
 * 当たる。 走査の母数には入れたまま、判定の対象から名前で外す
 * (母数から外すと、走査が空振りしていないかを確かめられなくなる)。
 */
const この検査 = "script-hardcoded-category.test.ts";

/**
 * 分類を 2 つ以上名指ししてよい道具と、その理由。
 *
 * **宣言と理由を同じ表に置く**。 別の場所に書くと片方だけ直って食い違う。
 */
const 例外: Record<string, string> = {
  "shoot-3vp.mjs":
    "分類の頁ではなく画面の種類を 3 通りの見え方で撮る道具で、分類の頁は見え方の代表として数件だけ載せている。 全分類に広げると撮る枚数が分類の数 x 3 倍になり、目視用の道具の長さを超える",
};

/** 走査する道具 (`scripts/` の下にある `.mjs`) */
function 道具の一覧(): string[] {
  return 絶対path(根, 走査するfile(根, "*.mjs")).filter((p) => p.includes("/scripts/"));
}

/**
 * 分類の綴りをいくつ名指ししているか。 本番と植え込み対照が同じ関数を使う。
 *
 * 綴りだけを見ると別の語の一部を拾う (`parts` は `parts-arc-gauge` にも含まれる) ので、
 * 引用符か `/` で囲まれた形に限る。
 */
export function 名指しした分類(中身: string, slug一覧: readonly string[]): string[] {
  return slug一覧.filter((s) =>
    new RegExp(`["'\`/]${s}["'\`/]|["'\`]${s}["'\`]`, "u").test(中身),
  );
}

describe("撮影の道具が分類の一覧を書き写していない (#2244)", () => {
  const slug一覧 = CATEGORIES.map((c) => c.slug);

  it("分類の綴りを実物から引けている", () => {
    // 引けていなければ、下の 0 件は「該当なし」 ではなく「測っていない」 になる
    expect(slug一覧.length, "分類を 1 件も引けていない (検査が空振りしている)").toBeGreaterThan(10);
  });

  it("走査する道具を集められている", () => {
    const 道具 = 道具の一覧();
    console.log(`[分類の書き写し] 道具=${道具.length} 分類=${slug一覧.length}`);
    expect(道具.length, "道具を 1 つも集められていない (検査が空振りしている)").toBeGreaterThan(5);
    expect(
      道具.some((p) => basename(p) === "shoot-zoom.mjs"),
      "撮影の道具を走査していない",
    ).toBe(true);
  });

  it("宣言した道具が実在し、理由を持つ", () => {
    // 消えた道具の宣言が残ると、同じ形が別の道具に出た時に黙って通る
    const 名前 = 道具の一覧().map((p) => basename(p));
    for (const [p, 理由] of Object.entries(例外)) {
      expect(名前, `宣言した道具が走査対象に無い: ${p}`).toContain(p);
      expect(理由.length, `宣言に理由が無い: ${p}`).toBeGreaterThan(20);
    }
  });

  it("宣言した道具が実際に分類を 2 つ以上名指ししている (空振り防止)", () => {
    // 名指ししていない道具を宣言していると、宣言が効いているかを確かめられない
    for (const p of 道具の一覧().filter((q) => basename(q) in 例外)) {
      expect(
        名指しした分類(readFileSync(p, "utf8"), slug一覧).length,
        `宣言した道具が分類を並べていない: ${basename(p)}`,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it("宣言していない道具が分類の綴りを 2 つ以上並べていない", () => {
    const 残る: string[] = [];
    for (const p of 道具の一覧()) {
      if (basename(p) in 例外) continue;
      const 名指し = 名指しした分類(readFileSync(p, "utf8"), slug一覧);
      if (名指し.length >= 2) 残る.push(`${p.slice(根.length)}: ${名指し.join(" ")}`);
    }
    expect(
      残る,
      "分類の一覧を書き写している (分類を足した日に、足した分を撮らないまま黙って通る)",
    ).toEqual([]);
  });

  it("書き写した形を拾える (植え込み対照)", () => {
    // 拾えない判定だと、上の 0 件は書いてあっても通る。 直す前の形をそのまま通す
    const 元 = `const category = [\n  "presets",\n  "patterns",\n  "cookbook",\n];`;
    expect(名指しした分類(元, slug一覧).length, "書き写した形を拾えていない").toBeGreaterThanOrEqual(3);
  });

  it("1 つだけ名指しする形と、別の語の一部は拾わない (陰性対照)", () => {
    // その分類だけを見る道具は正しい形なので止めない
    expect(名指しした分類(`await page.goto("/catalog/patterns");`, slug一覧)).toEqual(["patterns"]);
    // 綴りが別の語に含まれるだけの形を数えると、部品の名前で誤って止まる
    expect(名指しした分類(`const 部品 = "parts-arc-gauge";`, slug一覧)).toEqual([]);
  });

  it("道具が拾う札の綴りが、分類の頁が描く綴りと一致する", () => {
    // **拾う側と描く側を突き合わせる** = 画面の class 名を変えた日に、道具は 0 件を拾って
    // 静かに止まる。 止まること自体は正しいが、原因が画面側にあることは出力から読めない
    const 道具 = readFileSync(
      新しいpath("apps/playground-spa/scripts/shoot-zoom.mjs"),
      "utf8",
    );
    const 頁 = readFileSync(新しいpath("apps/playground-spa/src/pages/CatalogIndexPage.tsx"), "utf8");
    const 札 = "catalog-index-card";
    expect(道具.includes(札), "道具が札の綴りを持たない (判定が空振りしている)").toBe(true);
    expect(頁.includes(`className="${札}"`), "分類の頁が札の綴りを描いていない").toBe(true);
  });

  it("この検査自身が判定の対象から外れている理由を持つ", () => {
    // 外した名前が実物と食い違うと、外したつもりの file が判定に戻る
    const 自分 = 道具の一覧().filter((p) => basename(p) === この検査);
    expect(自分, "この検査は道具ではないので、走査に入っていないのが正しい").toEqual([]);
  });
});
