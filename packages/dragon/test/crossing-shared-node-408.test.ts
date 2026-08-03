import { describe, expect, it } from "vitest";
import { visualValidateAll } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as patterns from "../../../apps/playground-spa/src/topics/catalog/patterns.cdl";
import * as interactive from "../../../apps/playground-spa/src/topics/catalog/interactive.cdl";

/**
 * 軸 11 が節を共有する辺の交差をどこまで見逃すか (cardene777/cdl#408)。
 *
 * 扇 (同じ節から出る) と合流 (同じ節へ入る) は、 交点から共有節側で経路が重なる。 それは描画の
 * 意図で交差ではない。 一方、 節を共有していても **重ならない場所で交わる** 形は本物の交差。
 *
 * 人工の図では判定の差が出にくい (端点の除外だけで捌けてしまう形がある)。 実際の見本を使う。
 */

const collect = (mod: Record<string, unknown>): CdlDiagram[] =>
  Object.values(mod).filter(
    (v): v is CdlDiagram =>
      typeof v === "object" &&
      v !== null &&
      typeof (v as { id?: unknown }).id === "string" &&
      Array.isArray((v as { edges?: unknown }).edges),
  );

/** 見本 1 件の `edge-crossing` の報告。 件数は閾値で打ち切られるので、 報告の有無で見る。 */
function crossingOf(mod: Record<string, unknown>, id: string): { fired: boolean; detail: string } {
  const d = collect(mod).find((x) => x.id === id);
  if (!d) return { fired: false, detail: "図が見つからない" };
  const r = visualValidateAll([d], { profile: "catalog" });
  const v = r.reports[0]?.violations.find((x) => x.axis === "edge-crossing");
  return { fired: v !== undefined, detail: v?.detail ?? "" };
}

describe("節を共有する辺の交差 (#408)", () => {
  it("扇状に出る辺どうしを数えない", () => {
    // `dist` から 3 本出て、 途中まで同じ水平線を通ってから折れる。 交点は折れる位置で、
    // そこより共有節側は 2 本が重なる。
    const r = crossingOf(patterns, "pattern-fan-out");
    expect(r.fired, `扇の根元を数えている: ${r.detail}`).toBe(false);
  });

  it("合流する辺どうしを数えない", () => {
    // 3 本が `agg` へ入り、 途中から同じ水平線に乗る。 合流点は端点から 222px / 126px 離れて
    // いるので、 端点からの距離では除けない。
    const r = crossingOf(patterns, "pattern-fan-in");
    expect(r.fired, `合流点を数えている: ${r.detail}`).toBe(false);
  });

  it("流入が集まる図も、 合流の区間なら数えない", () => {
    // `interactive-traffic-sankey` は流入 3 経路が 1 つの成果に集まる図。 経路が交わって見えるが、
    // 交点から共有節側は同じ道を通る = 合流。
    //
    // #385 では節を共有する対をまとめて除外していたため、 共有しない対の交差が 1 件出ていた。
    // 連続した重なりで判定すると、 それも合流の一部だと分かる。
    const r = crossingOf(interactive, "interactive-traffic-sankey");
    expect(r.fired, `合流を交差に数えている: ${r.detail}`).toBe(false);
  });

  it("見本で新たに発火する図が無い", () => {
    // 判定を緩めた時に気付ける。 発火した図の id を並べて比べる。
    const all = collect(interactive).concat(collect(patterns));
    const r = visualValidateAll(all, { profile: "catalog" });
    const fired = r.reports
      .filter((x) => x.violations.some((v) => v.axis === "edge-crossing"))
      .map((x) => x.diagramId);
    expect(fired, `発火した図: ${fired.join(", ")}`).toEqual([]);
  });
});
