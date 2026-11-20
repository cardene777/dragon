/**
 * file の前処理 (`beforeAll`) で落ちる見本の検査 (#3800)。上限の検査が、上限で止まる見本と一緒に起こす。
 * 前処理で落ちた file は、file 自身の状態が `fail` になり、中の件は全て飛ばされる (`skip`)。#3798 の検査がこの形で落ちた。
 * 上限で止める段が、この file の名前を落ちた物として続きの実行へ渡すかを確かめる。
 */
import { beforeAll, describe, it } from "vitest";

beforeAll(() => {
  throw new Error("見本はわざと前処理で落ちる");
});

describe("前処理で落ちる見本", () => {
  it("fixture-skipped-after-hook-failure", () => undefined);
  it("fixture-also-skipped-after-hook-failure", () => undefined);
});
