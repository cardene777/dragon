/**
 * 添字の型の誤りを減らす方向にだけ動かす (#1418)。
 *
 * `apps/playground-spa` は `noUncheckedIndexedAccess` を持たず、`packages/dragon` だけが
 * 持っていた。 この設定は添字で取り出した値を `T | undefined` として扱うもので、
 * 無い側では **「配列の外を引いた」 形が型検査を素通りする**。
 *
 * 素通りしていた間に 137 件溜まった。
 *
 * ## なぜ天井を固定するのか
 *
 * 137 件を 1 PR で直すと、型注釈の追加が数百行になって「どの変更がどの誤りに効いたか」 が
 * 読めなくなる。 かといって放置すると増え続ける。
 *
 * **今の件数を天井として固定する**。 増えれば落ち、減らしても落ちる (天井を下げろと言う)。
 * どちらの向きにも気付ける形にして、follow-up が減らしていく。
 *
 * ## 設定を build 側に入れない理由
 *
 * root の `tsconfig.json` は `references` で本 project を含むため、本体の設定に足すと
 * `tsc -b` と `pnpm build` がその瞬間に 137 件で落ちる。 読む設定を
 * `tsconfig.strict.json` に分け、build は本体の設定を読み続ける。
 *
 * **天井が 0 になったら設定を本体へ移し、`tsconfig.strict.json` と本 file を消す**。
 * それが本 file の役目の終わり方で、0 になっても残すものではない。
 *
 * ## 一致で見る (以下ではなく)
 *
 * `<=` にすると、直した人が天井を下げなくても通る。 天井が実態から離れていき、
 * 「あと何件か」 を誰も知らない状態に戻る。
 *
 * ## 内訳は数えない
 *
 * 誤りの種類別 / file 別の件数は書かない。 直す順序で細かく動くため、書くと本質でない
 * 更新が毎回発生する (`rules/quality.md § 導出可能記述は人手で書かない`)。
 *
 * 内訳が要る時は同じ command を手で回す。
 *
 * ```
 * npx tsc --noEmit -p apps/playground-spa/tsconfig.strict.json
 * ```
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, it, expect } from "vitest";

const ここ = dirname(fileURLToPath(import.meta.url));
const REPO = join(ここ, "..", "..", "..", "..");
const 設定 = join(ここ, "..", "..", "tsconfig.strict.json");
const TSC = join(REPO, "node_modules", ".bin", "tsc");

/**
 * いま残っている型の誤りの件数。
 *
 * **減らしたらこの数も下げる**。 下げないとこの検査が落ちて教えてくれる。
 */
const 天井 = 86;

/** 型検査を回して誤りの行だけを返す */
function 誤りの行(): string[] {
  let 出力 = "";
  try {
    出力 = execFileSync(TSC, ["--noEmit", "-p", 設定], {
      cwd: REPO,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    // 誤りがあると `tsc` は非 0 で終わる。 その時の出力が本体
    const err = e as { stdout?: string; stderr?: string };
    出力 = `${err.stdout ?? ""}${err.stderr ?? ""}`;
    // 型の誤りを 1 件も返さない非 0 終了 (起動失敗 / 設定の誤り / 内部 error) は
    // 数に変換せず、検査自体を失敗させる。 天井が 0 に達すると「0 件」 と
    // 見分けが付かなくなるため (検査 code 側で review の指摘、 #1428)
    if (!/ error TS\d+: /.test(出力)) throw e;
  }
  return 出力.split("\n").filter((l) => / error TS\d+: /.test(l));
}

describe("添字の型の誤りを減らす方向にだけ動かす (#1418)", () => {
  it("型検査を実際に回せている", () => {
    /*
     * 空振り防止。 `tsc` を起動できていないと下の 1 件が「0 件」 を見て、
     * **誤りが 137 件あるのに天井を下回った** と誤って落ちる = 直したように見える。
     *
     * 起動できたかは、`tsc` の実体と設定 file の実在で見る。 出力の件数では見ない
     * (件数 0 は「起動できなかった」 と「全部直った」 のどちらでも起こる)。
     */
    expect(existsSync(TSC), `tsc が見つからない: ${TSC}`).toBe(true);
    expect(existsSync(設定), `設定が見つからない: ${設定}`).toBe(true);
  });

  it("設定が実際に厳しい側を向いている", () => {
    /*
     * 空振り防止その 2。 設定 file は在るのに `noUncheckedIndexedAccess` が外れていると、
     * 誤りが 0 件になって「全部直った」 と読める。 上の 1 件は file の実在しか見ないので
     * この形を捕まえられない。
     *
     * `tsc --showConfig` は `extends` を解決した後の実効値を返すため、
     * 本体の設定から継承した形でも読める。
     */
    const 実効 = execFileSync(TSC, ["--showConfig", "-p", 設定], {
      cwd: REPO,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const 設定値 = JSON.parse(実効) as {
      compilerOptions?: { noUncheckedIndexedAccess?: boolean };
    };
    expect(
      設定値.compilerOptions?.noUncheckedIndexedAccess,
      "noUncheckedIndexedAccess が効いていない (この検査は空振りしている)",
    ).toBe(true);
  }, 60_000);

  /*
   * **待ち時間を明示する**。 既定は 5 秒で、この project の `tsc` は単独でも 10 秒前後
   * かかる (`packages/dragon` 側より file 数が多い)。 全件を並列で回すと負荷でその倍以上に
   * なりうる。
   *
   * 待ち時間で落ちると「誤りが増えた」 と読めない形で失敗し、原因が天井から離れる。
   * 120 秒は実測 (約 11 秒) の 10 倍で、負荷の振れ幅を吸収する。
   */
  it("残っている誤りが天井と一致する", () => {
    const 件数 = 誤りの行().length;
    expect(
      件数,
      件数 < 天井
        ? `誤りが ${天井 - 件数} 件減った。 この file の 天井 を ${件数} に下げる`
        : `誤りが ${件数 - 天井} 件増えた。 型注釈を足して直す`,
    ).toBe(天井);
  }, 120_000);
});
