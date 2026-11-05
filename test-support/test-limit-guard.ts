/**
 * 検査が自分で書いた上限も、repo の 1 件の上限 (`TEST_LIMIT_MS`) を超えさせない (#3381)。
 *
 * vitest は `it(name, fn, 600_000)` のように検査ごとに書いた上限を、設定の `testTimeout` より優先する。
 * そのままでは、遅い検査が自分の上限を書くだけで repo の上限を外れる。
 * 書いた上限が repo の上限より長い検査は、走らせる前に名前と上限を出して落とす。
 */
import { beforeEach } from "vitest";
import { testLimitMs } from "./limits";

const limit = testLimitMs();

beforeEach(({ task }) => {
  if (task.timeout > limit) {
    throw new Error(`検査 ${task.name} が自分で ${task.timeout}ms の上限を書いている。repo の上限は ${limit}ms で、それより長くは待たない (#3381)。上限を書かずに ${limit}ms の中で終わる形にする`);
  }
});
