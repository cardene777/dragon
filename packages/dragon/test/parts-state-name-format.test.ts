/**
 * parts state name format 網羅 (iter49、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter49。
 * 全 parts の全 state.id が識別子 format (英数字 + _) を満たすか verify。
 * typo で reserved word / 記号混入時の regression 検知。
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

const RESERVED = new Set(["kind", "posX", "posY", "posW", "posH", "id", "type", "flow", "actors", "phases", "animation"]);

describe("iter49: 全 parts × state name format", () => {
  it(`parts 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: 状態を 1 つ以上持つ (空振り防止)`, () => {
      // 下の検査は状態を回して 1 件ずつ見る。 状態が無いと 1 度も判定へ入らずに通る
      const states = (diagram as unknown as { states?: unknown[] }).states ?? [];
      expect(states.length, `${name} に状態が 1 つも無い`).toBeGreaterThan(0);
    });

    it(`${name}: 全 state.id が [a-zA-Z_][a-zA-Z0-9_]* format`, () => {
      const states = ((diagram as unknown as { states?: Array<{ id: string }> }).states ?? []);
      for (const s of states) {
        expect(/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s.id), `state id "${s.id}"`).toBe(true);
      }
    });

    it(`${name}: state.id が予約語と重複しない`, () => {
      const states = ((diagram as unknown as { states?: Array<{ id: string }> }).states ?? []);
      for (const s of states) {
        expect(RESERVED.has(s.id), `state id "${s.id}" is reserved`).toBe(false);
      }
    });

    it(`${name}: state.id が 30 char 以下 (可読性)`, () => {
      const states = ((diagram as unknown as { states?: Array<{ id: string }> }).states ?? []);
      for (const s of states) {
        expect(s.id.length, `state ${s.id} len ${s.id.length}`).toBeLessThanOrEqual(30);
      }
    });

    it(`${name}: state.id が unique`, () => {
      const states = ((diagram as unknown as { states?: Array<{ id: string }> }).states ?? []);
      const ids = states.map((s) => s.id);
      expect(new Set(ids).size, `dup state ids in ${name}`).toBe(ids.length);
    });
  }
});
