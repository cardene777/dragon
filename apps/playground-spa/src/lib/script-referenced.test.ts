import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { 走査するfile, 未追跡のfile } from "../../../../test-support/scan-targets";

/**
 * script が、どこかから名指しされていることの検証 (#2079)。
 *
 * `apps/playground-spa/scripts/` には調べるためだけに書いた script が溜まる。 その大半は
 * `.gitignore` に載っていて repo に入らないが、追跡してしまった 1 本が誰からも呼ばれないまま
 * 残り、file 名と説明文が名乗る件数も実物とずれていた。
 *
 * `script-targets.test.ts` は「script が名指しする検査が実在するか」 を見る。 本検査はその
 * 逆向きで、「script を名指しする側が居るか」 を見る。 どちらが欠けても、打っても意味の無い
 * 組み合わせが残る。
 *
 * ## 両側に未追跡を入れる (#2095)
 *
 * script の一覧も名指し元も、追跡している file と未追跡だが無視されていない file の両方を見る。
 * 無視設定に載った使い捨ての script は どちらにも入らない。
 *
 * **片側だけ広げてはいけない**。 script の一覧だけ広げると、書いたばかりの script を同じく
 * 書いたばかりの file が呼んでいる時に「名指し元が居ない」 と誤って落ちる。
 * `git grep` は追跡している file しか読まないので、未追跡の分は自分で読んで足す。
 *
 * ## 型の宣言だけは対になる実体で足りる
 *
 * `deploy-pages.d.mts` のような型の宣言は、`import` する側が `deploy-pages.mjs` と書くので
 * 名前が出てこない。 TypeScript が拡張子で対を解決するため、実体が追跡されていれば足りる。
 */

const ROOT = join(import.meta.dirname, "../../../..");
const SCRIPT_DIR = "apps/playground-spa/scripts";

const git = (...args: string[]): string =>
  execFileSync("git", ["-C", ROOT, ...args], { encoding: "utf8" });

/** 走査する script の一覧 (repo 相対 path) */
const 走査するscript: string[] = 走査するfile(ROOT, SCRIPT_DIR);

/** 未追跡だが無視されていない file (名指し元として読む分) */
const 未追跡: string[] = 未追跡のfile(ROOT);

/** file の中身。 読めない file (binary 等) は空として扱う */
function 中身(path: string): string {
  try {
    return readFileSync(join(ROOT, path), "utf8");
  } catch {
    return "";
  }
}

/** file 名を本文に持つ file (自分自身は除く) */
function 名指し元(path: string): string[] {
  const 名 = path.slice(SCRIPT_DIR.length + 1);
  let 追跡側: string[] = [];
  try {
    追跡側 = git("grep", "-l", "-F", "-e", 名).split("\n");
  } catch {
    // git grep は 1 件も当たらないと終了コード 1 を返す
    追跡側 = [];
  }
  const 未追跡側 = 未追跡.filter((p) => 中身(p).includes(名));
  return [...new Set([...追跡側, ...未追跡側])].filter((p) => p !== "" && p !== path);
}

/** 型の宣言 (`X.d.mts`) は、対になる実体 (`X.mjs`) が追跡されていれば名指し不要 */
function 対になる実体がある(path: string): boolean {
  if (!path.endsWith(".d.mts")) return false;
  return 走査するscript.includes(`${path.slice(0, -".d.mts".length)}.mjs`);
}

/** 対照に使う、実在しない script の名前 (この file 自身が名指し元に数えられないよう繋いで作る) */
const 架空の名前 = ["no", "such", "script", "2079"].join("-");

describe("script が名指しされている (#2079)", () => {
  it("走査対象を集められている", () => {
    // 集められていなければ、以下の検査は通って当然になる
    expect(走査するscript.length, "script を 1 件も集められていない").toBeGreaterThan(0);
  });

  it("名指しを 1 件以上見つけられている (空振り防止)", () => {
    const 名指しあり = 走査するscript.filter((p) => 名指し元(p).length > 0);
    expect(名指しあり.length, "どの script についても名指し元を見つけられていない").toBeGreaterThan(0);
  });

  it("どこからも名指しされていない script が無い", () => {
    const 孤立 = 走査するscript.filter(
      (p) => 名指し元(p).length === 0 && !対になる実体がある(p),
    );
    expect(孤立, "追跡しているのに誰も呼ばない script が残っている").toEqual([]);
  });

  it("実在しない名前では名指し元が見つからない (陽性対照)", () => {
    // 何にでも当たる探し方だと、上の検査は孤立があっても通る。
    // 名前を繋いで作るのは、この file 自身が名指し元に数えられないようにするため
    expect(名指し元(`${SCRIPT_DIR}/${架空の名前}.mjs`), "実在しない名前に当たっている").toEqual([]);
  });

  it("型の宣言の扱いが対になる実体で決まる (陰性対照)", () => {
    expect(対になる実体がある(`${SCRIPT_DIR}/${架空の名前}.d.mts`), "実体が無いのに免除している").toBe(
      false,
    );
    expect(対になる実体がある(`${SCRIPT_DIR}/copy-404.mjs`), "実体そのものを免除している").toBe(false);
  });
});
