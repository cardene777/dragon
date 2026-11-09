/**
 * 1 回の実行の上限より先に終わって落ちる見本の検査 (#3386)。上限の検査が、上限で止まる見本と一緒に起こす。
 * 上限で止める段が、終わった file で落ちた検査の名前を書き残すかを確かめる。
 */
import { describe, expect, it } from "vitest";
import { leaveTmp } from "./leave-tmp";

describe("1 回の実行の上限の前に落ちる見本", () => {
  it("fixture-fails-before-run-limit", () => {
    leaveTmp();
    expect(1, "見本はわざと落ちる").toBe(2);
  });
});
