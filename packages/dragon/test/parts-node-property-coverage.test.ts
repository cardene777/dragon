/**
 * 部品の頁に並ぶ図の、箱の名前が満たすことの検査 (#2326)。
 *
 * ## 読む頁を dir から導く
 *
 * 部品の頁は `loadPartsItems()` が複数の file から組み立てる。 この検査は長らく
 * `parts.cdl.ts` の 1 枚だけを読んでおり、**図 38 枚 / 箱 178 個が 1 度も判定を通って
 * いなかった** (`parts-in-box` #1973 と `parts-motion` #2125)。
 *
 * 群は dir から導き、`loadPartsItems()` が読み込む file と **別の経路で** 突き合わせる。
 * 同じ経路で 2 度数えても、経路そのものが壊れた時に両方が同じだけ壊れる (#2314 と同じ理由)。
 *
 * ## 箱の名前の形を ASCII に縛らない
 *
 * 以前は `/^[a-zA-Z_][a-zA-Z0-9_\-.]*$/` を要求していた。 広げると 44 箱が落ちるが、
 * 落ちるのは `設備の稼働__ind` / `検査` のような **日本語の箱の名前** で、記法として正しい。
 * カタログ全体では 1735 箱のうち 307 箱がこの形 (`compile.ts` も「id の形は図種で違う」 と書く)。
 *
 * `parts.cdl.ts` の箱がたまたま全て ASCII なので、**1 枚しか読まないことで判定が通っていた**。
 * その頁に日本語の箱を 1 つ足すと、正しい記法なのに落ちる形だった。
 *
 * ## 代わりに実物から導いた 3 つを見る
 *
 * カタログ 584 図 1735 箱を走査して、例外が 0 件だったものだけを不変として置く。
 *
 * | 見るもの | 走査した時の例外 |
 * |---|---|
 * | 名前が空でない | 0 件 |
 * | 名前に空白を含まない | 0 件 |
 * | 同じ図の中で名前が重複しない | 0 件 |
 *
 * 3 つとも 0 件を期待する形なので、**植え込み対照** で判定が効くことを併せて見る。
 * 期待する数を手で書かない = 図の数は走査して出し、1 件以上あることだけを見る。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CdlDiagram } from "@cardenelabs/cdl";

import { 実在する群, カタログの置き場 } from "./support/catalog-groups";

/** 部品の頁を組み立てる側。 群の一覧をここから別経路で読む */
const 組み立てる側 = join(カタログの置き場, "..", "..", "lib", "catalog-items.ts");

/**
 * 部品の頁に並ぶ群 (dir から導く)。
 *
 * `parts` そのものと `parts-` で始まる群。 どの群が実際に頁へ並ぶかは
 * `loadPartsItems()` が決めるので、下の検査が両方向で突き合わせる。
 */
const 部品の群 = (): string[] =>
  実在する群()
    .filter((g) => g === "parts" || g.startsWith("parts-"))
    .sort();

/** `catalog-items.ts` の `loadPartsItems` が読み込む群 (source から読む) */
const 組み立てが読む群 = (): string[] => {
  const src = readFileSync(組み立てる側, "utf8");
  const 始 = src.indexOf("export async function loadPartsItems");
  if (始 < 0) throw new Error("`loadPartsItems` が `catalog-items.ts` に無い");
  const 終 = src.indexOf("\n}", 始);
  const 本体 = src.slice(始, 終 < 0 ? undefined : 終);
  return [...本体.matchAll(/@\/topics\/catalog\/([\w-]+)\.cdl/g)].map((m) => m[1]!).sort();
};

/** 図の形をした export を集める */
function 図を集める(mod: unknown): Array<{ 名: string; 図: CdlDiagram }> {
  const out: Array<{ 名: string; 図: CdlDiagram }> = [];
  for (const [名, val] of Object.entries(mod as Record<string, unknown>)) {
    if (!val || typeof val !== "object") continue;
    const d = val as Partial<CdlDiagram>;
    if (typeof d.id === "string" && Array.isArray(d.nodes)) out.push({ 名, 図: d as CdlDiagram });
  }
  return out;
}

/**
 * 群の中身を読む。
 *
 * **`import.meta.glob(...)` の形のまま書く** = 括弧で包んだり変数に入れたりすると Vite が
 * 走査の対象と見なさない。 群の名前を変数にした `import()` は解決できない (実測)。
 * 型は `support/responsive-accepted.ts` が `declare global` で置いている。
 */
const 群の中身: Record<string, unknown> = import.meta.glob(
  "../../../apps/playground-spa/src/topics/catalog/*.cdl.ts",
  { eager: true },
);

const 群の名 = (path: string): string => path.slice(path.lastIndexOf("/") + 1, -".cdl.ts".length);

const 読んだ = 部品の群().map((群) => {
  const 見つけた = Object.entries(群の中身).find(([p]) => 群の名(p) === 群);
  if (!見つけた) throw new Error(`群 ${群} を走査から引けない`);
  return { 群, 図: 図を集める(見つけた[1]) };
});

const 全図 = 読んだ.flatMap(({ 群, 図 }) => 図.map((x) => ({ ...x, 群 })));
const 全箱 = 全図.flatMap(({ 群, 名, 図 }) => 図.nodes.map((n) => ({ 群, 図の名: 名, 箱: n })));

describe("部品の頁の箱の名前 (#2326)", () => {
  it("部品の群を dir から 1 つ以上読めている (空振り防止)", () => {
    expect(部品の群().length, "部品の群を 1 つも読めていない").toBeGreaterThan(0);
    expect(全図.length, `群 ${部品の群().join(" / ")} から図を 1 枚も読めていない`).toBeGreaterThan(
      0,
    );
    expect(全箱.length, `図 ${全図.length} 枚から箱を 1 つも読めていない`).toBeGreaterThan(0);
  });

  it("走査した群が、頁を組み立てる側の読み込みと 1 件も違わない", () => {
    /*
     * dir を走査する経路と `catalog-items.ts` の source を読む経路の 2 つで数える。
     * 4 枚目を足して片方だけ直した日に落ちる。
     */
    const 組み立て = 組み立てが読む群();
    expect(組み立て.length, "`loadPartsItems` から群を 1 つも読めていない").toBeGreaterThan(0);
    expect(部品の群(), `頁を組み立てる側が読む群 ${組み立て.length} 件と突き合わせた`).toEqual(
      組み立て,
    );
  });

  it("箱の名前が空でない", () => {
    const 空 = 全箱
      .filter(({ 箱 }) => typeof 箱.id !== "string" || 箱.id.length === 0)
      .map(({ 図の名 }) => 図の名);
    expect(空, `図 ${全図.length} 枚 / 箱 ${全箱.length} 個を走査した`).toEqual([]);
  });

  it("箱の名前に空白が入っていない", () => {
    // 空白が入ると `A -> B` の書き方でどこまでが名前か決まらない
    const 空白 = 全箱
      .filter(({ 箱 }) => typeof 箱.id === "string" && /\s/.test(箱.id))
      .map(({ 図の名, 箱 }) => `${図の名}:${箱.id}`);
    expect(空白, `図 ${全図.length} 枚 / 箱 ${全箱.length} 個を走査した`).toEqual([]);
  });

  it("同じ図の中で箱の名前が重複していない", () => {
    // 重複すると矢印と光らせる指定がどちらの箱を指すか決まらない
    const 重複: string[] = [];
    for (const { 名, 図 } of 全図) {
      const 見た = new Set<string>();
      for (const n of 図.nodes) {
        if (見た.has(n.id)) 重複.push(`${名}:${n.id}`);
        見た.add(n.id);
      }
    }
    expect(重複, `図 ${全図.length} 枚 / 箱 ${全箱.length} 個を走査した`).toEqual([]);
  });

  it("種別を書いた箱は、空でない文字列を書いている", () => {
    const 空 = 全箱
      .filter(({ 箱 }) => {
        const k = (箱 as unknown as { kind?: unknown }).kind;
        return k !== undefined && (typeof k !== "string" || k.length === 0);
      })
      .map(({ 図の名, 箱 }) => `${図の名}:${箱.id}`);
    expect(空, `図 ${全図.length} 枚 / 箱 ${全箱.length} 個を走査した`).toEqual([]);
  });

  it("3 つの判定が、壊した入力で落ちる (植え込み対照)", () => {
    /*
     * 上の 3 件は 0 件を期待する。 判定が何も見ていない形でも通るので、
     * 本番と同じ探し方に壊した箱を通して差が出ることを確かめる。
     */
    const 壊した = [{ id: "" }, { id: "空白 入り" }, { id: "同じ" }, { id: "同じ" }];

    expect(壊した.filter((n) => n.id.length === 0).length, "空の名前を見つけられない").toBe(1);
    expect(壊した.filter((n) => /\s/.test(n.id)).length, "空白を見つけられない").toBe(1);

    const 見た = new Set<string>();
    const 重複 = 壊した.filter((n) => {
      const あった = 見た.has(n.id);
      見た.add(n.id);
      return あった;
    });
    expect(
      重複.map((n) => n.id),
      "重複を見つけられない",
    ).toEqual(["同じ"]);
  });

  it("日本語の箱の名前を違反として数えない", () => {
    /*
     * 以前は名前を ASCII に縛っており、広げると 44 箱が落ちた。 落ちていたのは
     * 記法として正しい日本語の名前で、カタログ全体では 1735 箱のうち 307 箱がこの形。
     * 縛りを戻したら落ちるように、実在する日本語の名前を名指しで固定する。
     */
    const 名前 = new Set(全箱.map(({ 箱 }) => 箱.id));
    const 英数字でない = [...名前].filter((n) => !/^[\x20-\x7e]*$/.test(n));
    expect(英数字でない.length, `箱の名前 ${名前.size} 種を走査した`).toBeGreaterThan(0);
    expect(名前.has("設備の稼働__ind"), "部品を箱に使う見本の箱が母集団に居ない").toBe(true);
  });
});
