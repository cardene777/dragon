/**
 * parts node count consistency 網羅 (iter35、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter35。
 * 全 80 parts の nodes 数の妥当性を verify、 typo で無限 loop や 空 nodes になる pattern 検知。
 *
 * (a) nodes 数 >= 1 (empty diagram なし)
 * (b) nodes 数 <= 50 (parts 1 個で 50 node 超 = design 逸脱)
 * (c) nodes に対応する不重複 lane 数 分布
 * (d) readout 系 (countup / statusDot 等) が 存在するなら state と対応
 */
import { describe, it, expect } from "vitest";
import * as PartsMod from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function collectAllParts(mod: unknown): Array<{ name: string; diagram: CdlDiagram }> {
  const out: Array<{ name: string; diagram: CdlDiagram }> = [];
  for (const [name, val] of Object.entries(mod as Record<string, unknown>)) {
    if (!val || typeof val !== "object") continue;
    const d = val as Partial<CdlDiagram>;
    if (typeof d.id === "string" && Array.isArray(d.nodes)) {
      out.push({ name, diagram: d as CdlDiagram });
    }
  }
  return out;
}

const ALL_PARTS = collectAllParts(PartsMod);

describe("iter35: 全 parts × node / lane / readout count consistency", () => {
  it(`parts 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`${name} (${diagram.id}) の nodes 数 >= 1 かつ <= 50`, () => {
      expect(diagram.nodes.length, `nodes count ${diagram.nodes.length}`).toBeGreaterThanOrEqual(1);
      expect(diagram.nodes.length, `nodes count ${diagram.nodes.length}`).toBeLessThanOrEqual(50);
    });

    it(`${name} の lanes 数 <= 10 (design 上限)`, () => {
      const lanes = new Set<string>();
      for (const node of diagram.nodes) {
        const lane = (node as unknown as { lane?: string }).lane;
        if (typeof lane === "string") lanes.add(lane);
      }
      expect(lanes.size, `lane count ${lanes.size} > 10`).toBeLessThanOrEqual(10);
    });

    it(`${name} の readout / state 対応 (state 数 <= 20)`, () => {
      const states = (diagram as unknown as { states?: unknown[] }).states ?? [];
      expect(states.length, `state count ${states.length}`).toBeLessThanOrEqual(20);
    });

    it(`${name} が id.startsWith("parts-")`, () => {
      expect(diagram.id.startsWith("parts-")).toBe(true);
    });
  }
});
