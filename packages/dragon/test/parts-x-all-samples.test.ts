/**
 * 全 80 parts × 全 25 EDITOR_SAMPLES × 究極 cross matrix (iter19、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter19。
 * iter8 (5 sample types × 80 parts = 400) を「実 15 sample 全て」 に拡張。
 * 各 sample DSL の actors: 末尾に parts alias を append、 textDslToDiagram + compile で
 * throw なし + parts sub-node prefix 出力を assert する。
 *
 * 19 × 80 = 1520 test で「parts が任意の実 sample に inject 可能」 の invariant を保証。
 * cross-syntax portability + 実 sample の actor / flow 構造との共存性を verify。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";
import * as PartsMod from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { at } from "./support/at";

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

// sample DSL の actors: block の直後に parts alias 行を挿入
function injectPartsIntoSampleDsl(sampleDsl: string, alias: string, kind: string): string {
  const lines = sampleDsl.split("\n");
  const actorsIdx = lines.findIndex((l) => l.trim().startsWith("actors:"));
  if (actorsIdx === -1) {
    // actors: block なしの sample は末尾に追記
    return `${sampleDsl}\nactors:\n  - ${alias}: { kind: ${kind} }\n`;
  }
  // actors: block の末尾を検出 (次の top-level key or 空行 or EOF)
  let insertIdx = actorsIdx + 1;
  while (insertIdx < lines.length) {
    const line = at(lines, insertIdx, "lines");
    // 次の top-level key (行頭が文字で始まり : を含む) or 空行 で block 終了
    if (line.match(/^[a-zA-Z]/) || line.trim() === "") break;
    insertIdx++;
  }
  const before = lines.slice(0, insertIdx);
  const after = lines.slice(insertIdx);
  const injectLine = `  - ${alias}: { kind: ${kind} }`;
  return [...before, injectLine, ...after].join("\n");
}

describe("iter19: 全 80 parts × 全 25 EDITOR_SAMPLES cross matrix (1520 test)", () => {
  it(`parts count >= 60 + samples count = 25`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
    expect(EDITOR_SAMPLES.length).toBe(25);
  });

  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label} (${sample.slug})`, () => {
      for (const { name, diagram } of ALL_PARTS) {
        it(`inject parts ${name} → compile throw なし`, () => {
          const kindValue = diagram.id.startsWith("parts-") ? diagram.id.slice(6) : diagram.id;
          const injectedDsl = injectPartsIntoSampleDsl(sample.code, "pInj1", kindValue);
          const partsCatalog: Record<string, CdlDiagram> = { [diagram.id]: diagram };
          const compiled = textDslToDiagram(injectedDsl, { partsCatalog });
          expect(compiled.nodes.length, `${name} × ${sample.label}: nodes > 0`).toBeGreaterThan(0);
          const injectedSubs = compiled.nodes.filter((n) => n.id.startsWith("pInj1__"));
          expect(injectedSubs.length, `${name} × ${sample.label}: pInj1 sub-node が存在`).toBeGreaterThan(0);
        });
      }
    });
  }
});
