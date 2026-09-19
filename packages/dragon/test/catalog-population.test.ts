/**
 * カタログの群を数える所が、実物の dir と一致することを見る (#2004)。
 *
 * カタログの群 (`apps/playground-spa/src/topics/catalog/*.cdl.ts`) は 2 箇所から読まれる。
 * どちらも **手で並べる形** で、群を足した時に追記を忘れても何も落ちなかった。
 *
 * | 読む側 | 何に使うか |
 * |---|---|
 * | `test/support/responsive-accepted.ts` の `全図` | 走査の母集団 |
 * | `package.json` の `lint:notation` の引数 | 記法の検査の対象 |
 *
 * 実際に `parts-in-box.cdl.ts` (#1973 で足した 9 枚) が `全図` に入っておらず、
 * 4 つの検査が 1 度も見ていなかった。
 *
 * ## 突き合わせをここに閉じ込めない (#2314)
 *
 * この検査は `全図` を読む側を守るが、**自分で群を並べている走査** は守れない。
 * 実際に 6 本が手で並べたまま残り、同じ `parts-in-box` が 6 本すべてで抜けていた。
 *
 * その 6 本は走査で導く形に変わり、各自が `support/catalog-groups.ts` の `実在する群` と
 * 突き合わせる。 この検査はそれとは別に、記法の検査の対象を見る役目が残る。
 *
 * ## 件数ではなく名前で突き合わせる
 *
 * 数だけ合わせると、1 つ足して 1 つ落とした時に通る。 file 名の集合で比べる。
 *
 * ## 空振り防止
 *
 * dir を読めない / 1 件も見つからない形は、突き合わせが素通しになる。
 * 走査が 1 件以上あることを先に確かめる。
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { 全図, カタログの群の名 } from "./support/responsive-accepted";
import { 実在する群, カタログの置き場 } from "./support/catalog-groups";

const ここ = dirname(fileURLToPath(import.meta.url));
const 根 = join(ここ, "..", "..", "..");

/**
 * dir にあるカタログの群の file 名 (`*.cdl.ts` の `*` の部分)。
 *
 * 実体は `support/catalog-groups.ts` が持つ (#2314)。 同じ走査を 2 つ書くと、片方だけ
 * 直した日に 2 つの検査が違う答えを出す。
 */
const 置き場の群 = 実在する群;

describe("カタログの群を数える所が実物と一致する (#2004)", () => {
  const 実物 = 置き場の群();

  it("dir からカタログの群を 1 つ以上読めている (空振り防止)", () => {
    expect(実物.length, "カタログの群を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(
      0,
    );
  });

  it("検査の母集団が置き場の群と一致する", () => {
    /*
     * 件数ではなく名前で比べる。 数だけ合わせると、1 つ足して 1 つ落とした時に通る。
     */
    expect(カタログの群の名(), `カタログの置き場にある群 ${実物.length} 件と突き合わせた`).toEqual(
      実物,
    );
  });

  it("記法の検査の対象が置き場の群と一致する", () => {
    const script = (
      JSON.parse(readFileSync(join(根, "package.json"), "utf8")) as {
        scripts?: Record<string, string>;
      }
    ).scripts?.["lint:notation"];
    expect(script, "`lint:notation` が package.json に無い").toBeDefined();
    const 並べた = [...script!.matchAll(/catalog\/([\w-]+)\.cdl\.ts/g)].map((m) => m[1]!).sort();
    expect(並べた.length, "`lint:notation` の引数から群を 1 つも読めていない").toBeGreaterThan(0);
    expect(並べた, `カタログの置き場にある群 ${実物.length} 件と突き合わせた`).toEqual(実物);
  });

  it("探し方が食い違いを見つけられる (植え込み対照)", () => {
    /*
     * 上の 2 件は一致を期待する。 探し方が何も見つけない形だと永久に通るため、
     * 本番と同じ突き合わせに **1 件欠けた入力** を通して差が出ることを確かめる。
     */
    const 欠けた = 実物.slice(1);
    expect(欠けた).not.toEqual(実物);
    expect(実物.filter((x) => !欠けた.includes(x))).toEqual([実物[0]!]);
  });

  it("カタログでない file を群に数えない", () => {
    // dir には検査 (`*.test.ts`) と部品 (`relation-focus.ts`) も居る。 拾うと母集団が汚れる
    const 見つけたfile = readdirSync(カタログの置き場);
    expect(見つけたfile.length, "dir を読めていない").toBeGreaterThan(実物.length);
    expect(実物.filter((x) => x.endsWith(".test") || x.endsWith(".spec"))).toEqual([]);
  });

  it("母集団に部品を箱に使う見本が入っている", () => {
    // この Issue の発端。 名前で 1 枚以上入っていることを直接見る
    const 名 = new Set(全図.map((d) => d.id));
    expect(名.has("注文を受けてから出荷するまでの間に設備の稼働を置く")).toBe(true);
  });
});

/**
 * 群を手で並べる走査が、実体とずれた時に落ちる (#2328)。
 *
 * #2004 と #2314 は「群を並べている走査」 を **人が探して並べて** 直した。
 * その探し方の漏れがそのまま残り、突き合わせを持たない走査が 7 本あった
 * (#2326 では `import` 1 本だけの走査が 1 枚しか読んでいなかった)。
 *
 * 直す対象を手で並べる形では同じことが次も起きるので、**対象を走査で見つける**。
 *
 * ## 3 つ以上を並べる file だけを見る
 *
 * 1 群と 2 群だけを並べる file が 100 本以上あり、そのほとんどは主題が 1 つの群に
 * 閉じている (部品そのものの検査など)。 全件に宣言を課すと、宣言を埋めるための文が
 * その本数ぶん生まれる。
 *
 * `import.meta.glob` で読む file は群を並べていないので、そもそも対象に入らない
 * (ずれようが無い)。
 */
const 並べる境界 = 3;

/** 検査が置かれている木。 dir を並べるのではなく、根から拡張子で拾う */
const 検査の木 = [join(根, "packages"), join(根, "apps")];

/** 群を並べていても全群を見なくてよい file。 名前と理由の対で持つ */
const 全群を見ない検査: Record<string, string> = {
  "apps/playground-spa/src/lib/catalog-motion-render.test.tsx":
    "#1172 が名指しした 21 見本を描いて見る検査。 まだ動かしていない図と動かさないと決めた図の区別は `catalog-motion-coverage.test.ts` が持つ、と自分で書いている",
};

/** 検査の file を根から集める (`node_modules` と生成物は降りない) */
function 検査のfile(root: string): string[] {
  const out: string[] = [];
  const 降りる = (d: string): void => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name === "dist" || e.name.startsWith(".")) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) 降りる(p);
      else if (/\.(test\.tsx?|spec\.ts)$/.test(e.name)) out.push(p);
    }
  };
  降りる(root);
  return out;
}

/** file が並べているカタログの群 (重複を除いて並べ替え済) */
function 並べた群(path: string): string[] {
  const src = readFileSync(path, "utf8");
  const 名 = [...src.matchAll(/topics\/catalog\/([\w-]+)\.cdl/g)].map((m) => m[1]!);
  return [...new Set(名)].sort();
}

/**
 * 並びが同じか。
 *
 * **区切り文字で繋いで比べない** = 区切りに使った文字が source に残る。
 * 文字の番号で書いた区切りで繋ぐ形にしたところ、整形の段で実際の NUL byte になり
 * `source-greppable.test.ts` が落ちた (grep から外れる file を作らないための検査)。
 */
const 同じ並び = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i]);

describe("群を手で並べる走査が実体とずれない (#2328)", () => {
  const 調べた = 検査の木
    .flatMap(検査のfile)
    .map((p) => ({ path: relative(根, p), 群: 並べた群(p) }))
    .filter(({ 群 }) => 群.length > 0);
  const 対象 = 調べた.filter(({ 群 }) => 群.length >= 並べる境界);
  const 実物 = 実在する群();

  it("群を並べる検査を 1 本以上見つけている (空振り防止)", () => {
    expect(調べた.length, "群を並べる検査を 1 本も見つけていない").toBeGreaterThan(0);
    expect(
      対象.length,
      `群を並べる検査 ${調べた.length} 本のうち ${並べる境界} 群以上のものが 0 本`,
    ).toBeGreaterThan(0);
  });

  it("3 群以上を並べる検査が、置き場の群と 1 件も違わない", () => {
    const ずれ = 対象
      .filter(({ path }) => !(path in 全群を見ない検査))
      .filter(({ 群 }) => !同じ並び(群, 実物))
      .map(({ path, 群 }) => `${path}: ${群.length} 群 (置き場は ${実物.length} 群)`);
    expect(ずれ, `${並べる境界} 群以上を並べる検査 ${対象.length} 本を走査した`).toEqual([]);
  });

  it("宣言に理由が書かれている", () => {
    const 空 = Object.entries(全群を見ない検査)
      .filter(([, v]) => v.trim().length === 0)
      .map(([k]) => k);
    expect(空, "理由の無い宣言").toEqual([]);
  });

  it("宣言が実物の対象に含まれている (直った宣言を残さない)", () => {
    const 対象のpath = new Set(対象.map(({ path }) => path));
    const 外れた = Object.keys(全群を見ない検査).filter((p) => !対象のpath.has(p));
    expect(外れた, "宣言に在るのに、もう対象でない file。 宣言ごと外す").toEqual([]);
  });

  it("群が 1 つ欠けた並びを見つけられる (植え込み対照)", () => {
    /*
     * 上は一致を期待する。 突き合わせが何も見ていない形でも通るので、
     * 本番と同じ比べ方に 1 群欠けた並びを通して差が出ることを確かめる。
     */
    const 欠けた = 実物.slice(1);
    expect(同じ並び(欠けた, 実物), "欠けた並びを一致とみなす").toBe(false);
    // 並べ替えの違いだけでは落ちない (集合として同じなら通る)
    const 並べ替え = [...実物].reverse().sort();
    expect(同じ並び(並べ替え, 実物)).toBe(true);
  });
});
