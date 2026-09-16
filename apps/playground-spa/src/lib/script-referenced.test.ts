import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

/**
 * 追跡している script が、どこかから名指しされていることの検証 (#2079)。
 *
 * `apps/playground-spa/scripts/` には調べるためだけに書いた script が溜まる。 その大半は
 * `.gitignore` に載っていて repo に入らないが、追跡してしまった 1 本が誰からも呼ばれないまま
 * 残り、file 名と説明文が名乗る件数も実物とずれていた。
 *
 * `script-targets.test.ts` は「script が名指しする検査が実在するか」 を見る。 本検査はその
 * 逆向きで、「script を名指しする側が居るか」 を見る。 どちらが欠けても、打っても意味の無い
 * 組み合わせが残る。
 *
 * ## 名指し元は追跡している file だけを見る
 *
 * 追跡外の使い捨て script から呼ばれていても、それは repo の外の話なので名指しとは数えない。
 * 探すのに `git grep` を使うのはこのため (追跡していない file を見ない)。
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

/** 追跡している script の一覧 (repo 相対 path) */
const 追跡しているscript: string[] = git("ls-files", "--", SCRIPT_DIR)
  .split("\n")
  .filter((p) => p !== "");

/** file 名を本文に持つ追跡 file (自分自身は除く) */
function 名指し元(path: string): string[] {
  const 名 = path.slice(SCRIPT_DIR.length + 1);
  let 出力 = "";
  try {
    出力 = git("grep", "-l", "-F", "-e", 名);
  } catch {
    // git grep は 1 件も当たらないと終了コード 1 を返す
    return [];
  }
  return 出力.split("\n").filter((p) => p !== "" && p !== path);
}

/** 型の宣言 (`X.d.mts`) は、対になる実体 (`X.mjs`) が追跡されていれば名指し不要 */
function 対になる実体がある(path: string): boolean {
  if (!path.endsWith(".d.mts")) return false;
  return 追跡しているscript.includes(`${path.slice(0, -".d.mts".length)}.mjs`);
}

/** 対照に使う、実在しない script の名前 (この file 自身が名指し元に数えられないよう繋いで作る) */
const 架空の名前 = ["no", "such", "script", "2079"].join("-");

describe("追跡している script が名指しされている (#2079)", () => {
  it("走査対象を集められている", () => {
    // 集められていなければ、以下の検査は通って当然になる
    expect(追跡しているscript.length, "追跡している script を 1 件も集められていない").toBeGreaterThan(0);
  });

  it("名指しを 1 件以上見つけられている (空振り防止)", () => {
    const 名指しあり = 追跡しているscript.filter((p) => 名指し元(p).length > 0);
    expect(名指しあり.length, "どの script についても名指し元を見つけられていない").toBeGreaterThan(0);
  });

  it("どこからも名指しされていない script が無い", () => {
    const 孤立 = 追跡しているscript.filter(
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
