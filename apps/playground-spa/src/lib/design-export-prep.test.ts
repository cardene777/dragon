import { describe, expect, it } from "vitest";

const SVG_WITH_ONE_ASPECT_RATIO = '<svg width="640" height="480" preserveAspectRatio="xMidYMid meet" viewBox="0 0 640 480" />';
const SVG_WITHOUT_ASPECT_RATIO = '<svg width="640" height="480" viewBox="0 0 640 480" />';
const SVG_WITH_TWO_ASPECT_RATIOS = '<svg width="640" height="480" preserveAspectRatio="xMidYMid meet" preserveAspectRatio="xMaxYMax meet" viewBox="0 0 640 480" />';
const SVG_WITH_CUSTOM_ASPECT_RATIO = '<svg width="640" height="480" preserveAspectRatio="xMinYMin slice" viewBox="0 0 640 480" />';
const SVG_WITH_OTHER_ATTRIBUTES = '<svg width="640" height="480" preserveAspectRatio="xMidYMid meet" viewBox="0 0 640 480" data-diagram="sequence" aria-label="注文処理" />';

async function prepを読む() {
  return import("../../scripts/design-export-prep.mjs");
}

describe("書き出し SVG の下ごしらえ (#1616)", () => {
  it("Given preserveAspectRatio が 1 個の SVG When prep Then 属性は 1 個のまま返す", async () => {
    // Given
    const { prep } = await prepを読む();

    // When
    const result = prep(SVG_WITH_ONE_ASPECT_RATIO);

    // Then
    expect(result.match(/\spreserveAspectRatio=/gu)).toHaveLength(1);
  });

  it("Given preserveAspectRatio がない SVG When prep Then 投げる", async () => {
    // Given
    const { prep } = await prepを読む();

    // When / Then
    expect(() => prep(SVG_WITHOUT_ASPECT_RATIO)).toThrow(/preserveAspectRatio/u);
  });

  it("Given preserveAspectRatio が 2 個の SVG When prep Then 投げる", async () => {
    // Given
    const { prep } = await prepを読む();

    // When / Then
    expect(() => prep(SVG_WITH_TWO_ASPECT_RATIOS)).toThrow(/preserveAspectRatio/u);
  });

  it("Given 幅と高さを持つ SVG When prep Then 幅と高さを落とす", async () => {
    // Given
    const { prep } = await prepを読む();

    // When
    const result = prep(SVG_WITH_ONE_ASPECT_RATIO);

    // Then
    expect(result).toBe('<svg preserveAspectRatio="xMidYMid meet" viewBox="0 0 640 480" />');
  });

  it("Given xMinYMin slice の preserveAspectRatio を 1 個持つ SVG When prep Then 通す", async () => {
    // Given
    const { prep } = await prepを読む();

    // When
    const result = prep(SVG_WITH_CUSTOM_ASPECT_RATIO);

    // Then
    expect(result).toBe('<svg preserveAspectRatio="xMinYMin slice" viewBox="0 0 640 480" />');
  });

  it("Given 幅と高さ以外の属性を持つ SVG When prep Then それらを残す", async () => {
    // Given
    const { prep } = await prepを読む();

    // When
    const result = prep(SVG_WITH_OTHER_ATTRIBUTES);

    // Then
    expect(result).toBe('<svg preserveAspectRatio="xMidYMid meet" viewBox="0 0 640 480" data-diagram="sequence" aria-label="注文処理" />');
  });
});
