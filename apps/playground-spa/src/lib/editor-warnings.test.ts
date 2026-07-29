/**
 * 編集画面に出す指摘の選び方の検証。
 *
 * 実際の図と実際の検証結果で確かめる。 作り物の violation だけで見ると、 cdl が本当に
 * その軸を返すかが分からず、 軸名を書き間違えても気付けない。
 */
import { describe, it, expect } from "vitest";
import { visualValidate } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";
import { visibleWarnings, hasExplicitPositions, AUTO_LAYOUT_ALIGNMENT_AXES } from "./editor-warnings";

const auto = `title: "t"
type: flow
actors:
  - Web: service
  - API: service
flow:
  - Web -> API: "a"
`;

const manual = `title: "t"
type: flow
actors:
  - Web: service
  - API:
      kind: service
      位置: 700,498
flow:
  - Web -> API: "a"
`;

const relative = `title: "t"
type: flow
actors:
  - Web: service
  - API:
      kind: service
      位置: Web の右 200
flow:
  - Web -> API: "a"
`;

const axesOf = (src: string): string[] => {
  const d = textDslToDiagram(src);
  return [...new Set(visibleWarnings(visualValidate(d).violations, d).map((v) => v.axis))];
};

describe("編集画面の指摘の選び方", () => {
  it("自動配置の図には位置を書いた印が無い", () => {
    expect(hasExplicitPositions(textDslToDiagram(auto))).toBe(false);
  });

  it("座標を書いた図には印が付く", () => {
    expect(hasExplicitPositions(textDslToDiagram(manual))).toBe(true);
  });

  it("相対で書いた図にも印が付く (解決後は座標なので)", () => {
    expect(hasExplicitPositions(textDslToDiagram(relative))).toBe(true);
  });

  it("座標を書くと整列の軸が出る (外さないと画面が常時 NG になる)", () => {
    // 外す判断の前提。 cdl が実際にこれらを返すことを確かめる
    const d = textDslToDiagram(manual);
    const raw = [...new Set(visualValidate(d).violations.map((v) => v.axis))];
    expect(raw.filter((a) => AUTO_LAYOUT_ALIGNMENT_AXES.has(a)).length).toBeGreaterThan(0);
  });

  it("座標を書いた図では整列の軸を出さない", () => {
    expect(axesOf(manual).filter((a) => AUTO_LAYOUT_ALIGNMENT_AXES.has(a))).toEqual([]);
  });

  it("相対で書いた図でも整列の軸を出さない", () => {
    expect(axesOf(relative).filter((a) => AUTO_LAYOUT_ALIGNMENT_AXES.has(a))).toEqual([]);
  });

  it("自動配置の図では整列の軸を外さない (指摘を握り潰さない)", () => {
    const d = textDslToDiagram(auto);
    const fake = [
      { axis: "alignment" as const, diagramId: d.id, detail: "x", severity: "error" as const },
    ];
    expect(visibleWarnings(fake, d)).toHaveLength(1);
  });

  it("整列以外の指摘は位置を書いても残す", () => {
    const d = textDslToDiagram(manual);
    const fake = [
      { axis: "node-overlap" as const, diagramId: d.id, detail: "x", severity: "error" as const },
      { axis: "clearance" as const, diagramId: d.id, detail: "y", severity: "warn" as const },
    ];
    expect(visibleWarnings(fake, d)).toHaveLength(2);
  });

  it("描画の滲みはどちらでも出さない", () => {
    for (const src of [auto, manual]) {
      const d = textDslToDiagram(src);
      const fake = [
        { axis: "subpixel-precision" as const, diagramId: d.id, detail: "x", severity: "warn" as const },
      ];
      expect(visibleWarnings(fake, d)).toEqual([]);
    }
  });
});
