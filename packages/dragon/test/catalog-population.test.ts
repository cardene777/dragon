/**
 * カタログの群を数える所が、実物の dir と一致することを見る (#2004)。
 *
 * カタログの群 (`apps/playground-spa/src/topics/catalog/*.cdl.ts`) は 2 箇所から読まれる。
 * どちらも **手で並べる形** で、群を足した時に追記を忘れても何も落ちなかった。
 *
 * | 読む側 | 何に使うか |
 * |---|---|
 * | `test/support/responsive-accepted.ts` の `全図` | 4 つの検査の母集団 |
 * | `package.json` の `lint:notation` の引数 | 記法の検査の対象 |
 *
 * 実際に `parts-in-box.cdl.ts` (#1973 で足した 9 枚) が `全図` に入っておらず、
 * 4 つの検査が 1 度も見ていなかった。
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
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { 全図, カタログの群の名 } from "./support/responsive-accepted";

const ここ = dirname(fileURLToPath(import.meta.url));
const 根 = join(ここ, "..", "..", "..");
const カタログの置き場 = join(根, "apps", "playground-spa", "src", "topics", "catalog");

/** dir にあるカタログの群の file 名 (`*.cdl.ts` の `*` の部分)。 */
const 置き場の群 = (): string[] =>
  readdirSync(カタログの置き場)
    .filter((f) => f.endsWith(".cdl.ts"))
    .map((f) => f.slice(0, -".cdl.ts".length))
    .sort();

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
