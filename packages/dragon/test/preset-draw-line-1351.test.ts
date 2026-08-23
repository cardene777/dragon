import { describe, it, expect } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as presets from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";

/**
 * 見本帳の「プリセット」 で、折れ線が左から伸びるようにした件 (#1351)。
 *
 * 描画側は段に `draw` があると起点から伸ばす。 折れ線は左端から右へ伸びる。
 * 段を組み直す `withSteps` が `draw` を運ぶ経路を持っていなかったため、このページの見本は
 * 1 件も伸びず、開いた瞬間に全長で出ていた。
 *
 * 段に `draw` を **書かない時は欄ごと置かない**。 置くと `draw` を使わない見本の JSON の形が
 * 変わる (描画側の `builder.ts` も同じ扱いをしている)。
 */

const 図の一覧 = (): { name: string; diagram: CdlDiagram }[] => {
  const out: { name: string; diagram: CdlDiagram }[] = [];
  for (const [name, v] of Object.entries(presets)) {
    if (v && typeof v === "object" && "id" in (v as object) && "phases" in (v as object)) {
      out.push({ name, diagram: v as CdlDiagram });
    }
  }
  return out;
};

const 折れ線 = (): CdlDiagram => {
  const d = 図の一覧().find((x) => x.diagram.id === "chart-line-demo");
  expect(d, "折れ線の見本 (chart-line-demo) が見つからない").toBeDefined();
  return d!.diagram;
};

describe("プリセットの折れ線は左から伸びる (#1351)", () => {
  it("1 段目で折れ線の箱を起点から描く", () => {
    const 段 = 折れ線().phases;
    expect(段.length, "段が 1 つも無い").toBeGreaterThan(0);
    expect(段[0]!.draw).toEqual(["chart-line-demo-chart"]);
  });

  it("描く箱は、その段で光らせている箱と同じものを指す", () => {
    // 実在しない id を書くと描画側は何も描かず、検査も気付けない。
    // 図の中の箱の id と突き合わせる。
    const d = 折れ線();
    const 箱 = new Set(d.nodes.map((n) => n.id));
    expect(箱.size, "箱が 1 つも無い").toBeGreaterThan(0);
    for (const id of d.phases[0]!.draw ?? []) {
      expect(箱.has(id), `draw の "${id}" が図の箱に無い`).toBe(true);
    }
  });

  it("2 段目には draw の欄が付かない (書いていない段は全長で出る)", () => {
    const 段 = 折れ線().phases;
    expect(段.length, "2 段目が無い").toBeGreaterThan(1);
    expect(Object.prototype.hasOwnProperty.call(段[1]!, "draw")).toBe(false);
  });

  it("draw を書いていない見本には、どの段にも欄が付かない (陰性対照)", () => {
    const 図 = 図の一覧().filter((x) => x.diagram.id !== "chart-line-demo");
    expect(図.length, "比べる見本が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);

    let 見た段 = 0;
    for (const { name, diagram } of 図) {
      for (const p of diagram.phases) {
        見た段 += 1;
        expect(
          Object.prototype.hasOwnProperty.call(p, "draw"),
          `${name} の段 "${p.id}" に draw の欄が付いている`,
        ).toBe(false);
      }
    }
    expect(見た段, "段を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(0);
  });
});
