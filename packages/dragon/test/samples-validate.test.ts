/**
 * Editor SAMPLES の cdl validate check (CAR-1659)。
 *
 * user report = 「サンプルで cdl validate failed: phase が 0 件です」 error が出るものがある。
 * 全 sample の text DSL を textDslToDiagram + compile で machine check、 error 出す sample を
 * 特定する。 fix 後は「全 sample が validate pass」 assert で regression 検知。
 *
 * **件数を文で書かない** = 見本が増えた日にここだけ古くなる (実測で 21 と書いたまま
 * 25 件になっていた)。 件数は下の assert が実物から見る。
 *
 * **件数を数字と比べるのはこの 1 か所だけにする** (#2060)。 同じ比べ方が 5 file にあった間、
 * 見本を足すたびに比べる行だけが直され、題と説明の数字は書いた時点のまま残った。 他の検査は
 * 走査が空振りしていないこと (1 件以上) だけを見る。
 *
 * 見本の実体は `apps/playground-spa/src/data/editor-samples.ts` の 1 か所が持ち、
 * 編集画面と本検査の両方がそこから読む。 2 か所が別々に配列を持つと片方だけ直って食い違う。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "@cardenelabs/dragon";
import { compile } from "@cardenelabs/cdl";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("editor SAMPLES validate", () => {
  it("SAMPLES count が 26 (期待値、 CdlEditor.tsx 側と drift しない SSOT check)", () => {
    expect(EDITOR_SAMPLES.length).toBe(26);
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
