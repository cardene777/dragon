import { describe, it, expect } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as presets from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";

/**
 * 見本ごとに段の長さを書けるようにした件 (#1353)。
 *
 * 段を組み直す `withSteps` は長さを 900ms で直書きしており、見本ごとに変えられなかった。
 * 起点から描く段はこれでは速すぎて、線が引かれる様子を追う前に引き終わる。
 *
 * 記法 (text DSL) は元から段ごとに秒数を書ける (`- step: "計画" 2.4s`)。 組み立て API 側
 * だけがその表現力を落としていた。
 *
 * **書かない段は既定のまま**。 既定を変えると全ての見本の速さが動く。
 */

/** 段の長さの既定 (`presets.cdl.ts` の `STEP_DURATION` と同じ値) */
const 既定の長さ = 900;

/** 描く段に与えた長さ */
const 描く段の長さ = 2400;

const 図の一覧 = (): { name: string; diagram: CdlDiagram }[] => {
  const out: { name: string; diagram: CdlDiagram }[] = [];
  for (const [name, v] of Object.entries(presets)) {
    if (v && typeof v === "object" && "id" in v && "phases" in v) out.push({ name, diagram: v });
  }
  return out;
};

const 折れ線 = (): CdlDiagram => {
  const d = 図の一覧().find((x) => x.diagram.id === "chart-line-demo");
  expect(d, "折れ線の見本 (chart-line-demo) が見つからない").toBeDefined();
  return d!.diagram;
};

describe("見本ごとに段の長さを書ける (#1353)", () => {
  it("折れ線の 1 段目は既定より長い", () => {
    const 段 = 折れ線().phases;
    expect(段.length, "段が 1 つも無い").toBeGreaterThan(0);
    expect(段[0]!.duration).toBe(描く段の長さ);
    // 既定と同じ値を入れても通る形にしない = 「伸ばした」 ことを直接見る
    expect(段[0]!.duration, "描く段が既定より長くない").toBeGreaterThan(既定の長さ);
  });

  it("長さを書いていない段は既定のまま", () => {
    const 段 = 折れ線().phases;
    expect(段.length, "2 段目が無い").toBeGreaterThan(1);
    expect(段[1]!.duration).toBe(既定の長さ);
  });

  it("長さを書いていない見本は、どの段も既定のまま (陰性対照)", () => {
    const 図 = 図の一覧().filter((x) => x.diagram.id !== "chart-line-demo");
    expect(図.length, "比べる見本が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);

    let 見た段 = 0;
    for (const { name, diagram } of 図) {
      for (const p of diagram.phases) {
        見た段 += 1;
        expect(p.duration, `${name} の段 "${p.id}" の長さが既定でない`).toBe(既定の長さ);
      }
    }
    expect(見た段, "段を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("長さを伸ばしたのは、起点から描く段だけ", () => {
    // 描かない段まで伸ばすと、値が動くだけの段で待たされる。
    // 見本全体で「既定より長い段」 と「描く段」 が一致することを見る
    const 長い: string[] = [];
    const 描く: string[] = [];
    for (const { name, diagram } of 図の一覧()) {
      for (const p of diagram.phases) {
        if (p.duration > 既定の長さ) 長い.push(`${name}:${p.id}`);
        if ((p.draw ?? []).length > 0) 描く.push(`${name}:${p.id}`);
      }
    }
    expect(描く.length, "描く段が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    expect(長い.sort()).toEqual(描く.sort());
  });
});
