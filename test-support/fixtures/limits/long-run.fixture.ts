/**
 * 1 回の実行の上限を超える見本の検査 (#3381)。上限の検査が、1 回の実行の上限を下げて起こす。
 * 1 件の上限より短く待つので、止めるのは 1 回の実行の上限だけになる。
 */
import { describe, it } from "vitest";
import { leaveTmp } from "./leave-tmp";

describe("1 回の実行の上限を超える見本", () => {
  it("fixture-runs-past-run-limit", async () => {
    leaveTmp();
    await new Promise((done) => setTimeout(done, 7_000));
  });
});
