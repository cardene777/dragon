/**
 * 添字の厳しさが効いていることを固定する (#1418 → #1426)。
 *
 * `noUncheckedIndexedAccess` は添字で取り出した値を `T | undefined` として扱う設定。
 * `packages/dragon` だけが持っていた間、こちら側では「配列の外を引いた」 形が型検査を
 * 素通りし、**137 件** 溜まっていた。
 *
 * ## なぜ「誤り 0 件」 では守れないのか
 *
 * 3 群 (#1427 / #1428 / #1426) を片付けて 0 件になったので、天井を固定する検査は
 * 役目を終えた。 ただし **0 件は設定の有無を区別しない** = 設定を外しても誤りは 0 件の
 * ままで、`tsc -b` も `pnpm build` も通る。
 *
 * 実測でも、設定の行を消して `tsc -b --force` を回すと誤りは 0 件のままだった。
 * 件数を見る検査では外されたことを検知できない。
 *
 * **したがって見るのは件数ではなく設定そのもの**。 `tsc --showConfig` は `extends` を
 * 解決した後の実効値を返すため、継承の形が変わっても読める。
 *
 * ## 誤りの件数はここでは見ない
 *
 * 設定が本体の `tsconfig.json` に入ったので、誤りは `tsc -b` (`pnpm run typecheck`) が
 * 直接見る。 ここで二重に回すと 1 回 9 秒ぶん遅くなるだけで、守る対象が増えない。
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, it, expect } from "vitest";

const ここ = dirname(fileURLToPath(import.meta.url));
const REPO = join(ここ, "..", "..", "..", "..");
const 設定 = join(ここ, "..", "..", "tsconfig.json");
const TSC = join(REPO, "node_modules", ".bin", "tsc");

describe("添字の厳しさが効いている (#1426)", () => {
  it("型検査を実際に回せている", () => {
    /*
     * 空振り防止。 `tsc` を起動できていないと下の 1 件が読む値を得られず、
     * 「設定が無い」 と「起動できていない」 が同じ形で落ちる。
     */
    expect(existsSync(TSC), `tsc が見つからない: ${TSC}`).toBe(true);
    expect(existsSync(設定), `設定が見つからない: ${設定}`).toBe(true);
  });

  it("noUncheckedIndexedAccess が実効値で有効になっている", () => {
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
      "noUncheckedIndexedAccess が外れている (添字の外を引く形が型検査を素通りする)",
    ).toBe(true);
  }, 60_000);
});
