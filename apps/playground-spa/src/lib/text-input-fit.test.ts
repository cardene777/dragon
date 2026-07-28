import { describe, it, expect } from "vitest";
import {
  textInputWidth,
  TEXT_INPUT_PADDING,
  TEXT_INPUT_MIN_WIDTH,
  TEXT_INPUT_MAX_WIDTH,
} from "./text-input-fit";

/**
 * 文字編集の入力欄の幅。
 *
 * 以前は `input.scrollWidth` を使っていたが、 `input` は内容に関係なく既定幅
 * (`size` 属性、 既定 20 文字相当) を持ち、 `width: auto` にしてもその幅に解決する。
 * そのため中身が 6 文字でも 256px になり、 短い文字を編集する時に入力欄だけが
 * 間延びしていた。 文字そのものを測る形に変えた。
 */

describe("textInputWidth", () => {
  it("測った文字幅に余白を足す", () => {
    expect(textInputWidth(200)).toBe(200 + TEXT_INPUT_PADDING);
    expect(textInputWidth(500)).toBe(500 + TEXT_INPUT_PADDING);
  });

  it("短い文字でも最小幅を下回らない", () => {
    // 空にしても掴める大きさを残す
    expect(textInputWidth(0)).toBe(TEXT_INPUT_MIN_WIDTH);
    expect(textInputWidth(5)).toBe(TEXT_INPUT_MIN_WIDTH);
  });

  it("長すぎる入力でも上限で止まる", () => {
    expect(textInputWidth(5000)).toBe(TEXT_INPUT_MAX_WIDTH);
  });

  it("短い文字で既定幅 (256px 相当) まで広がらない", () => {
    // 欠陥の再現。 6 文字程度の実測幅が 24px 前後なので、 そこから 256px は出てこない
    expect(textInputWidth(24)).toBeLessThan(100);
  });

  it("不正値は最小幅に倒す", () => {
    for (const bad of [NaN, Infinity, -Infinity, -100]) {
      expect(textInputWidth(bad), String(bad)).toBe(TEXT_INPUT_MIN_WIDTH);
    }
  });

  it("文字幅が増えれば単調に増える", () => {
    let prev = 0;
    for (const w of [0, 30, 60, 120, 300, 600]) {
      const cur = textInputWidth(w);
      expect(cur).toBeGreaterThanOrEqual(prev);
      prev = cur;
    }
  });
});
