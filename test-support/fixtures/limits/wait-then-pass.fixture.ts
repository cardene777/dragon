/**
 * 1 回目の実行では 1 回の実行の上限を超えて待ち、続きの実行では待たずに通る見本の検査 (#3800)。
 * 待つ長さは `FIXTURE_SLEEP_MS` が決め、渡さない時は待たない。
 * 上限の検査が、上限で止まった後の続きの実行が全て通る場合を作るために起こす。
 */
import { it } from "vitest";

const SLEEP = Number(process.env.FIXTURE_SLEEP_MS ?? "0");

it("fixture-waits-then-passes", async () => {
  await new Promise((done) => setTimeout(done, SLEEP));
});
