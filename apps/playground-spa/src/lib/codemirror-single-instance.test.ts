import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

/**
 * 編集画面の土台 (`codemirror`) が **1 つの版だけ** 入っていることの検証 (#1709)。
 *
 * ## 何が起きたか
 *
 * `@codemirror/state` が 2 つの版で入り、編集画面が起動時に落ちていた。
 *
 * ```
 * Unrecognized extension value in extension set ([object Object]).
 * This sometimes happens because multiple instances of @codemirror/state are loaded,
 * breaking instanceof checks.
 * ```
 *
 * 土台は「拡張」 を `instanceof` で見分ける。 版が 2 つ入ると、片方が作った拡張を
 * もう片方が自分のものと認めない = 組み立ての最初で例外になり、**画面が 1 つも出ない**。
 * 実測では編集画面の枠 (`editor-preview-stage`) 自体が現れず、そこを見る検査が
 * 21 件落ちたまま積み上がっていた。
 *
 * ## なぜ file の一覧を見るのか
 *
 * 落ちるのは画面を開いた時だが、原因は **依存の解決** にある。 画面の検査は全件で 30 分
 * かかるため気付くのが遅れる。 依存の一覧は取り込みのたびに 1 秒で読めるので、
 * 同じ壊れ方を早い側で捕まえる。
 *
 * 見るのは `pnpm-lock.yaml`。 `node_modules` には取り込みが済んだ後も参照されない古い dir が
 * 残るため、実際に使う版とは一致しない (実測 = 一覧は 1 版なのに dir は 2 つ残っていた)。
 */

/** 土台のうち、2 つ入ると壊れるもの。 `instanceof` で見分けをする層 */
const 一つだけ入る土台 = ["@codemirror/state", "@codemirror/view"] as const;

const lockのpath = join(import.meta.dirname, "../../../../pnpm-lock.yaml");

/**
 * 依存の一覧から、その package が何版入っているかを読む。
 *
 * 一覧は `packages:` と `snapshots:` の 2 箇所に同じ鍵を書くので、版だけを集めて重複を外す。
 * 引数で受けるのは、**わざと 2 版にした一覧** を同じ読み手に通して裏を取るため (植え込み対照)。
 */
export function 入っている版(lock: string, pkg: string): string[] {
  const 鍵 = new RegExp(`^\\s+'${pkg.replace("/", "\\/")}@([^']+)':`, "gm");
  return [...new Set([...lock.matchAll(鍵)].map((m) => m[1]!))].sort();
}

describe("編集画面の土台が 1 版だけ入っている (#1709)", () => {
  const lock = readFileSync(lockのpath, "utf8");

  it("依存の一覧が読めている (検査の空振り検知)", () => {
    expect(lock.length, "依存の一覧が空").toBeGreaterThan(0);
    for (const pkg of 一つだけ入る土台) {
      expect(入っている版(lock, pkg).length, `${pkg} が一覧に無い`).toBeGreaterThan(0);
    }
  });

  for (const pkg of 一つだけ入る土台) {
    it(`${pkg} が 1 版だけ`, () => {
      const 版 = 入っている版(lock, pkg);
      expect(
        版,
        `${pkg} が ${版.length} 版入っている (${版.join(" / ")})。` +
          " 版が分かれると編集画面が起動時に落ちる。 root の `pnpm.overrides` で 1 版に寄せる",
      ).toHaveLength(1);
    });
  }

  it("2 版になった一覧はちゃんと 2 版と読める (植え込み対照)", () => {
    // 「1 版だけ」 を期待する検査なので、正しい一覧を通しても読み手が壊れているか判らない。
    // わざと 2 版にした一覧を同じ読み手に通して、見つけることを確かめる。
    const 植えた = [
      "packages:",
      "  '@codemirror/state@6.7.1':",
      "    resolution: {integrity: sha512-dummy}",
      "  '@codemirror/state@6.7.4':",
      "    resolution: {integrity: sha512-dummy}",
    ].join("\n");
    expect(入っている版(植えた, "@codemirror/state")).toEqual(["6.7.1", "6.7.4"]);
  });
});
