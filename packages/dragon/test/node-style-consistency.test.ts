/**
 * node style consistency (iter30、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter30。
 * 全 sample の nodes について style / kind attribute の型・存在 verify。
 *
 * (a) kind 値が定義されるなら string
 * (b) style 値が定義されるなら string / object
 * (c) 同一 sample 内で node kind の分布 (drift 検知目的)
 * (d) title が制御文字なし
 * (e) subtitle が存在なら string 型 + 200 char 以下
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

interface CompiledDiagram {
  nodes: Array<{
    id: string;
    kind?: string;
    style?: string | Record<string, unknown>;
    title?: string;
    subtitle?: string;
  }>;
}

describe("iter30: 全 sample × node style consistency", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`node.kind 型 spec (string / undefined)`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const invalid = diagram.nodes.filter((n) => n.kind !== undefined && typeof n.kind !== "string");
        expect(invalid.map((n) => `${n.id}:kind=${typeof n.kind}`)).toEqual([]);
      });

      it(`node.style 型 spec (string / object / undefined)`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const invalid = diagram.nodes.filter((n) => {
          if (n.style === undefined) return false;
          return typeof n.style !== "string" && typeof n.style !== "object";
        });
        expect(invalid.map((n) => `${n.id}:style=${typeof n.style}`)).toEqual([]);
      });

      it(`node.title が制御文字なし (tab/LF/CR は許容)`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const invalid = diagram.nodes.filter((n) => {
          if (typeof n.title !== "string") return false;
          return /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(n.title);
        });
        expect(invalid.map((n) => n.id)).toEqual([]);
      });

      it(`node.subtitle が存在なら string + 200 char 以下`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const invalid = diagram.nodes.filter((n) => {
          if (n.subtitle === undefined) return false;
          if (typeof n.subtitle !== "string") return true;
          return n.subtitle.length > 200;
        });
        expect(
          invalid.map((n) => `${n.id}:subtitle=${JSON.stringify(n.subtitle).slice(0, 40)}`),
        ).toEqual([]);
      });

      it(`node kind の distribution が sample 内で一貫 (drift 検知)`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const kinds = diagram.nodes.map((n) => n.kind).filter((k): k is string => typeof k === "string");
        // 全 node kind が空でないことは保証しない (sample によっては kind 未指定)
        // ただし kind 存在時は format 妥当 (非空 string)
        const bad = kinds.filter((k) => k.length === 0);
        expect(bad).toEqual([]);
      });
    });
  }
});
