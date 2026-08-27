/**
 * Editor SAMPLES 21 diagram の cdl validate check (CAR-1659)。
 *
 * user report = 「サンプルで cdl validate failed: phase が 0 件です」 error が出るものがある。
 * 15 sample の text DSL を textDslToDiagram + compile で machine check、 error 出す sample を
 * 特定する。 fix 後は「全 21 sample が validate pass」 assert で regression 検知。
 *
 * codex-review CAR-1659 MINOR fix = SAMPLES を `apps/playground-spa/src/data/editor-samples.ts`
 * (shared SSOT) から import し、 CdlEditor.tsx と本 test の drift を構造的に排除。 sample 追加 /
 * 変更 / 削除は 1 file 更新のみで両方に反映される。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "@cardenelabs/dragon";
import { compile } from "@cardenelabs/cdl";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("editor SAMPLES 21 diagram validate", () => {
  it("SAMPLES count が 24 (期待値、 CdlEditor.tsx 側と drift しない SSOT check)", () => {
    expect(EDITOR_SAMPLES.length).toBe(24);
  });

  for (const s of EDITOR_SAMPLES) {
    it(`${s.label} が textDslToDiagram + compile で throw しない`, () => {
      const diagram = textDslToDiagram(s.code);
      expect(diagram).toBeDefined();
      expect(diagram.phases).toBeDefined();
      expect(diagram.phases.length).toBeGreaterThan(0);
      expect(() => compile(diagram)).not.toThrow();
    });
  }
});
