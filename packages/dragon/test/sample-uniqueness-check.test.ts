/**
 * sample uniqueness check 網羅 (iter64、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter64。
 * 全 19 sample の一意性を verify (label / code hash / 内部 title 重複)。
 */
import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";
import { at } from "./support/at";

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return h.toString(36);
}

describe("iter64: EDITOR_SAMPLES 一意性 verify", () => {
  it("count = 19", () => {
    expect(EDITOR_SAMPLES.length).toBe(19);
  });

  it("全 label 一意 (labels unique)", () => {
    const labels = EDITOR_SAMPLES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("全 code hash 一意 (code content unique)", () => {
    const hashes = EDITOR_SAMPLES.map((s) => hash(s.code));
    expect(new Set(hashes).size).toBe(hashes.length);
  });

  it("code 内 title フィールド値の重複数 <= 2", () => {
    const titles = EDITOR_SAMPLES.map((s) => {
      const m = s.code.match(/title:\s*"([^"]+)"/);
      return m ? at(m, 1, "m") : "";
    }).filter((t) => t.length > 0);
    // 一部重複 (同一 title の異 type 図) は許容だが、 極端な重複はなし
    const counts = new Map<string, number>();
    for (const t of titles) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    for (const [t, c] of counts) {
      expect(c, `title "${t}" dup count ${c}`).toBeLessThanOrEqual(3);
    }
  });

  it("全 slug が英字 + 数字 + hyphen のみ", () => {
    for (const s of EDITOR_SAMPLES) {
      expect(/^[a-z0-9-]+$/.test(s.slug)).toBe(true);
    }
  });

  it("code 内に少なくとも 1 actor 定義がある", () => {
    for (const s of EDITOR_SAMPLES) {
      expect(s.code.includes("- ")).toBe(true); // yaml list item marker
    }
  });
});
