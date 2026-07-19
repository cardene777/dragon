/**
 * parts subtitle template format 網羅 (iter33、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter33。
 * parts.cdl.ts の 全 node で subtitle 内 `{stateName}` template 参照が
 * (a) state.id と一致 (b) 対応 state が存在 (c) 参照 format が閉じる 3 invariant を verify。
 * 存在しない state 参照 (typo) を検知する gate。
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

function extractTemplateRefs(str: string): string[] {
  const out: string[] = [];
  // {stateName} pattern を抽出
  const re = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(str)) !== null) {
    out.push(m[1]!);
  }
  return out;
}

describe("iter33: 全 parts × subtitle template format 網羅", () => {
  it(`parts export 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`parts ${name} の subtitle template 参照が state.id と対応`, () => {
      const stateIds = new Set(((diagram as unknown as { states?: Array<{ id: string }> }).states ?? []).map((s) => s.id));
      const missing: Array<{ nodeId: string; ref: string }> = [];
      for (const node of diagram.nodes) {
        const subtitle = (node as unknown as { subtitle?: string }).subtitle;
        if (typeof subtitle !== "string") continue;
        const refs = extractTemplateRefs(subtitle);
        for (const ref of refs) {
          if (!stateIds.has(ref)) {
            missing.push({ nodeId: node.id, ref });
          }
        }
      }
      expect(
        missing,
        `${name}: dangling template refs (states=[${[...stateIds].join(",")}]): ${JSON.stringify(missing)}`,
      ).toEqual([]);
    });

    it(`parts ${name} の title template 参照が state.id と対応`, () => {
      const stateIds = new Set(((diagram as unknown as { states?: Array<{ id: string }> }).states ?? []).map((s) => s.id));
      const missing: Array<{ nodeId: string; ref: string }> = [];
      for (const node of diagram.nodes) {
        const title = (node as unknown as { title?: string }).title;
        if (typeof title !== "string") continue;
        const refs = extractTemplateRefs(title);
        for (const ref of refs) {
          if (!stateIds.has(ref)) {
            missing.push({ nodeId: node.id, ref });
          }
        }
      }
      expect(
        missing,
        `${name}: dangling title template refs: ${JSON.stringify(missing)}`,
      ).toEqual([]);
    });

    it(`parts ${name} の subtitle / title が balanced brace ({...})`, () => {
      const violations: Array<{ nodeId: string; field: string; value: string }> = [];
      for (const node of diagram.nodes) {
        for (const field of ["title", "subtitle"] as const) {
          const value = (node as unknown as Record<string, unknown>)[field];
          if (typeof value !== "string") continue;
          const openCount = (value.match(/\{/g) ?? []).length;
          const closeCount = (value.match(/\}/g) ?? []).length;
          if (openCount !== closeCount) {
            violations.push({ nodeId: node.id, field, value });
          }
        }
      }
      expect(violations, `unbalanced brace in ${name}`).toEqual([]);
    });
  }
});
