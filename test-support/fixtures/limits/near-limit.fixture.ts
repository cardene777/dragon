/**
 * 1 件の上限に近い件の見本 (#3740)。上限に近い件の一覧の検査 (`packages/dragon/test/near-limit-report.test.ts`) が、上限を下げて起こす。
 * 長い件は `FIXTURE_SLEEP_MS` だけ待ち、短い件はその 4 分の 3 だけ待つ。
 * 短い件を先に書くのは、一覧が file の順でなく秒数の長い順に並ぶかを確かめるため。
 */
import { describe, it } from "vitest";

const SLEEP = Number(process.env.FIXTURE_SLEEP_MS ?? "100");
const sleep = (ms: number): Promise<void> => new Promise((done) => setTimeout(done, ms));

describe("上限に近い見本", () => {
  it("fixture-near-limit-short", async () => {
    await sleep(SLEEP * 0.75);
  });

  it("fixture-near-limit-long", async () => {
    await sleep(SLEEP);
  });
});
