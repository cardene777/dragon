/**
 * 1 つの隙間に名札を 2 枚以上置く図が、帯 (lane) の間隔を自分で書いて確保していることを見る
 * (#1741)。
 *
 * 描画エンジンが確保するのは **1 つの対につき最も広い名札 1 枚分** の隙間だけ
 * (`名札の幅 + 箱と名札の余白 32 × 2 + 経路の突き出し 40 × 2`)。 2 枚以上を同じ隙間に
 * 置く図は元から足りていない。
 *
 * `0.42.0` まではその不足が隠れていた。 engine が式の合計を **帯の縁** から測っており、
 * `(帯の幅 − 箱の幅) / 2` を 2 枚分 余計に空けていたため (`cdl#789` で箱の縁へ移した)。
 *
 * 余分が無くなったので、必要な間隔は記法の `x` に書く。 この検査は
 * **書いた値が今も足りている** ことを見る。 名札の幅の測り方が変わって足りなくなったら落ちる。
 */
import { describe, it, expect } from "vitest";
import { visualValidate, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

import * as cookbook from "../../../apps/playground-spa/src/topics/catalog/cookbook.cdl";
import * as patterns from "../../../apps/playground-spa/src/topics/catalog/patterns.cdl";
import * as presets from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import * as primitives from "../../../apps/playground-spa/src/topics/catalog/primitives.cdl";
import * as primitivesExtra from "../../../apps/playground-spa/src/topics/catalog/primitives-extra.cdl";
import * as textDsl from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import * as animation from "../../../apps/playground-spa/src/topics/catalog/animation.cdl";
import * as styles from "../../../apps/playground-spa/src/topics/catalog/styles.cdl";
import * as interactive from "../../../apps/playground-spa/src/topics/catalog/interactive.cdl";
import * as ethereum from "../../../apps/playground-spa/src/topics/catalog/ethereum.cdl";
import * as parts from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import * as charts from "../../../apps/playground-spa/src/topics/catalog/charts.cdl";

const 図か = (v: unknown): v is CdlDiagram =>
  typeof v === "object" &&
  v !== null &&
  Array.isArray((v as CdlDiagram).nodes) &&
  Array.isArray((v as CdlDiagram).lanes);

/** 見本帳の全図。 枚数は増えるので書かない。 */
const 全図: CdlDiagram[] = [
  cookbook,
  patterns,
  presets,
  primitives,
  primitivesExtra,
  textDsl,
  animation,
  styles,
  interactive,
  ethereum,
  parts,
  charts,
].flatMap((m) => Object.values(m as Record<string, unknown>).filter(図か));

/** 隙間の足りなさが出る軸。 名札どうし / 名札と経路 / 経路どうし の 3 通り。 */
const 隙間の軸 = ["edge-label-overlap", "edge-label-proximity", "edge-crossing"] as const;

/**
 * 帯の間隔を書いて確保した図と、書く前の `x` の刻み。
 *
 * 刻みは **植え込み対照の入力** で、期待値ではない。 `#1741` より前はこの値で、
 * その時に上の 3 軸が出ていた。
 */
const 間隔を書いた図: ReadonlyArray<{ id: string; 書く前の刻み: number }> = [
  { id: "interactive-traffic-sankey", 書く前の刻み: 260 },
  { id: "animation-rich-order-status-flow", 書く前の刻み: 210 },
];

const 探す = (d: CdlDiagram): string[] =>
  visualValidate(d)
    .violations.filter((v) => (隙間の軸 as readonly string[]).includes(v.axis))
    .map((v) => `${v.axis}: ${v.detail}`);

describe("帯の間隔を書いて確保した図 (#1741)", () => {
  it("対象の図が見本帳にある", () => {
    // 空振り防止 = id を書き換えた時に「0 件だから通る」 にならないようにする。
    for (const { id } of 間隔を書いた図) {
      expect(全図.some((d) => d.id === id), `${id} が見本帳に無い`).toBe(true);
    }
    expect(間隔を書いた図.length, "対象が 0 件 (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("対象の図は 1 つの隙間に名札を 2 枚以上置いている", () => {
    // この検査が守りたい形そのもの。 名札が 1 枚しか無い図なら engine の確保で足りるため、
    // 間隔を書く理由が無くなる。
    for (const { id } of 間隔を書いた図) {
      const d = 全図.find((x) => x.id === id)!;
      const 帯 = new Map(d.nodes.map((n) => [n.id, n.lane]));
      const 対ごとの名札 = new Map<string, number>();
      for (const e of d.edges) {
        if (!e.label) continue;
        const f = 帯.get(e.from);
        const t = 帯.get(e.to);
        if (f === undefined || t === undefined || f === t) continue;
        const 鍵 = [f, t].sort().join("|");
        対ごとの名札.set(鍵, (対ごとの名札.get(鍵) ?? 0) + 1);
      }
      const 最大 = Math.max(0, ...対ごとの名札.values());
      expect(最大, `${id} の 1 対あたりの名札の最大枚数`).toBeGreaterThanOrEqual(2);
    }
  });

  it("書いた間隔で隙間の軸が 0 件", () => {
    for (const { id } of 間隔を書いた図) {
      const d = 全図.find((x) => x.id === id)!;
      const 見つけた = 探す(d);
      expect(見つけた, `${id} の隙間の軸`).toEqual([]);
    }
  });

  it("植え込み対照 = 間隔を書く前の刻みに戻すと出る", () => {
    // 「0 件」 を期待する検査なので、探し方が何かを見つけられることを別に示す。
    // 本番の走査 (上の検査) の判定は変えない。
    for (const { id, 書く前の刻み } of 間隔を書いた図) {
      const d = 全図.find((x) => x.id === id)!;
      const 詰めた: CdlDiagram = {
        ...d,
        lanes: d.lanes.map((l, i) => ({ ...l, x: i * 書く前の刻み })),
      };
      expect(探す(詰めた).length, `${id} を刻み ${書く前の刻み} に戻した時`).toBeGreaterThan(0);
    }
  });

  it("書いた間隔にしても図は元より広がらない", () => {
    // 間隔を広げる直し方なので、広げすぎると 軸 23 `responsive-viewport` を新たに踏む。
    // `0.42.0` まで engine が実際に取っていた間隔に戻してあるため、幅は当時と同じになる。
    const 元の幅: Record<string, number> = {
      "interactive-traffic-sankey": 1656,
      "animation-rich-order-status-flow": 687,
    };
    for (const { id } of 間隔を書いた図) {
      const d = 全図.find((x) => x.id === id)!;
      expect(layout(d).viewBox.w, `${id} の viewBox 幅`).toBeLessThanOrEqual(元の幅[id]!);
    }
  });

  it("見本帳の全図で 名札どうしの重なりと 経路の交差が 0 件", () => {
    const 出た = 全図.flatMap((d) =>
      visualValidate(d)
        .violations.filter((v) => v.axis === "edge-label-overlap" || v.axis === "edge-crossing")
        .map((v) => `${d.id}: ${v.axis}`),
    );
    // 0 件を報告する時は母数を併記する。
    expect(全図.length, "見本帳が空 (検査が空振りしている)").toBeGreaterThan(400);
    expect(出た, `${全図.length} 枚を走査`).toEqual([]);
  });
});
