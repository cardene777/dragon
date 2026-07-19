/**
 * parts node title length 網羅 (iter83、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter83。
 * 全 parts の node title / subtitle 長さ検証。
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

describe("iter83: 全 parts × node title/subtitle length", () => {
  it(`parts 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: node title <= 100 char (存在時)`, () => {
      for (const n of diagram.nodes) {
        const title = (n as unknown as { title?: string }).title;
        if (typeof title === "string") {
          expect(title.length).toBeLessThanOrEqual(100);
        }
      }
    });

    it(`${name}: node subtitle <= 500 char (存在時、 template placeholder 込)`, () => {
      for (const n of diagram.nodes) {
        const subtitle = (n as unknown as { subtitle?: string }).subtitle;
        if (typeof subtitle === "string") {
          expect(subtitle.length).toBeLessThanOrEqual(500);
        }
      }
    });

    it(`${name}: node id char <= 40`, () => {
      for (const n of diagram.nodes) {
        expect(n.id.length).toBeLessThanOrEqual(40);
      }
    });

    it(`${name}: 全 node が finite w if provided`, () => {
      for (const n of diagram.nodes) {
        if (typeof n.w === "number") {
          expect(Number.isFinite(n.w)).toBe(true);
        }
      }
    });

    it(`${name}: 全 node が finite h if provided`, () => {
      for (const n of diagram.nodes) {
        if (typeof n.h === "number") {
          expect(Number.isFinite(n.h)).toBe(true);
        }
      }
    });

    it(`${name}: node.kind 値 (存在時) <= 30 char`, () => {
      for (const n of diagram.nodes) {
        const kind = (n as unknown as { kind?: string }).kind;
        if (typeof kind === "string") {
          expect(kind.length).toBeLessThanOrEqual(30);
        }
      }
    });
  }
});
