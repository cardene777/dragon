/**
 * 前処理が上限を超える見本の検査 (#3381)。上限の検査が、上限を下げて起こす。
 * 待つ長さは `FIXTURE_SLEEP_MS` が決める。
 */
import { beforeAll, describe, it } from "vitest";

const SLEEP = Number(process.env.FIXTURE_SLEEP_MS ?? "1500");

describe("前処理が上限を超える見本", () => {
  beforeAll(async () => {
    await new Promise((done) => setTimeout(done, SLEEP));
  });

  it("fixture-after-slow-hook", () => undefined);
});
