/**
 * 編集画面に出す指摘の選び方の検証。
 *
 * 実際の図と実際の検証結果で確かめる。 作り物の violation だけで見ると、 cdl が本当に
 * その軸を返すかが分からず、 軸名を書き間違えても気付けない。
 */
import { describe, it, expect } from "vitest";
import { visualValidate } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";
import {
  visibleWarnings,
  hasExplicitPositions,
  violationTargets,
  AUTO_LAYOUT_ALIGNMENT_AXES,
} from "./editor-warnings";

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

  it("隠す軸でも error なら出す", () => {
    // 隠す理由は「書く人が直せない滲み」 で、 図の破綻を伏せる意図ではない。 軸だけで
    // 隠すと、 その軸が将来 `error` を出すようになった時に「位置関係 NG」 の badge ごと
    // 黙って消える。
    for (const src of [auto, manual]) {
      const d = textDslToDiagram(src);
      const fake = [
        { axis: "subpixel-precision" as const, diagramId: d.id, detail: "x", severity: "error" as const },
      ];
      expect(visibleWarnings(fake, d)).toHaveLength(1);
    }
  });

  it("同じ軸で warn と error が混ざれば error だけ残す", () => {
    const d = textDslToDiagram(auto);
    const fake = [
      { axis: "subpixel-precision" as const, diagramId: d.id, detail: "warn 側", severity: "warn" as const },
      { axis: "subpixel-precision" as const, diagramId: d.id, detail: "error 側", severity: "error" as const },
    ];
    expect(visibleWarnings(fake, d).map((v) => v.detail)).toEqual(["error 側"]);
  });
});

describe("整列の指摘を外す範囲", () => {
  /** 3 箱のうち 1 箱だけ手で置いた図。 触っていない箱の指摘は残ってほしい */
  const oneManual = `title: "t"
type: flow
actors:
  - Web: service
  - API: service
  - DB:
      kind: database
      位置: 900,900
flow:
  - Web -> API: "a"
  - API -> DB: "b"
`;

  it("指摘の文面から対象の箱と縦列を読める (文面が変わったら気付く)", () => {
    // 対象を読めなくなると隠す範囲がずれる。 実際の検証結果に対して読めることを確かめる
    const d = textDslToDiagram(oneManual);
    const raw = visualValidate(d).violations.filter((v) => AUTO_LAYOUT_ALIGNMENT_AXES.has(v.axis));
    expect(raw.length, "整列の指摘が出ていない").toBeGreaterThan(0);
    const named = raw.filter((v) => violationTargets(v.detail).node !== undefined);
    expect(named.length, "箱を名指しする指摘が読めない").toBeGreaterThan(0);
    for (const v of raw) {
      const t = violationTargets(v.detail);
      expect(t.node !== undefined || t.lane !== undefined, `対象が読めない: ${v.detail}`).toBe(true);
    }
  });

  it("手で置いた箱を名指しする指摘は外す", () => {
    const d = textDslToDiagram(oneManual);
    const shown = visibleWarnings(visualValidate(d).violations, d);
    const dbNamed = shown.filter(
      (v) => AUTO_LAYOUT_ALIGNMENT_AXES.has(v.axis) && violationTargets(v.detail).node === "db",
    );
    expect(dbNamed).toEqual([]);
  });

  it("触っていない箱を名指しする指摘は残す", () => {
    const d = textDslToDiagram(oneManual);
    const fake = [
      { axis: "alignment" as const, diagramId: d.id, detail: 'lane "other" 内 node "web" cx=1 が不一致', severity: "error" as const },
    ];
    expect(visibleWarnings(fake, d), "手で置いていない箱の指摘まで隠している").toHaveLength(1);
  });

  it("対象が読み取れない指摘は残す", () => {
    const d = textDslToDiagram(oneManual);
    const fake = [
      { axis: "alignment" as const, diagramId: d.id, detail: "対象を書いていない文面", severity: "error" as const },
    ];
    expect(visibleWarnings(fake, d)).toHaveLength(1);
  });

  it("手で置いた箱と同じ縦列の間隔の指摘は外す", () => {
    const d = textDslToDiagram(oneManual);
    const lane = d.nodes.find((n) => n.posX !== undefined)?.lane;
    expect(lane, "手で置いた箱の縦列が取れない").toBeDefined();
    const fake = [
      { axis: "column-gap-uniform" as const, diagramId: d.id, detail: `lane "${lane}" 内 node 間の gap variance`, severity: "warn" as const },
    ];
    expect(visibleWarnings(fake, d)).toEqual([]);
  });

  it("別の縦列の間隔の指摘は残す", () => {
    const d = textDslToDiagram(oneManual);
    const fake = [
      { axis: "column-gap-uniform" as const, diagramId: d.id, detail: 'lane "untouched" 内 node 間の gap variance', severity: "warn" as const },
    ];
    expect(visibleWarnings(fake, d)).toHaveLength(1);
  });
});
