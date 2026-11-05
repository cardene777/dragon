/**
 * 1 件の上限を超える見本の検査 (#3381)。上限の検査が、上限を下げて起こす。
 * 待つ長さは `FIXTURE_SLEEP_MS` が決める。
 */
import { describe, it } from "vitest";

const SLEEP = Number(process.env.FIXTURE_SLEEP_MS ?? "1500");
const sleep = (ms: number): Promise<void> => new Promise((done) => setTimeout(done, ms));

describe("上限を超える見本", () => {
  it("fixture-sleeps-past-test-limit", async () => {
    await sleep(SLEEP);
  });

  // 自分で長い上限を書いた検査も、repo の上限より長くは待たない
  it(
    "fixture-raises-its-own-limit",
    async () => {
      await sleep(SLEEP);
    },
    600_000,
  );
});
