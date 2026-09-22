/**
 * 縦の矢印が箱の上の値の字を割る箇所を数える (#2509)。
 *
 * 同じ帯の上下に置いた箱を縦の矢印で繋ぐと、矢印が受け手の上端の中心に真下から入る。
 * 値の字 (`0 / 10` のような現在値と上限) は箱の上の中央に描かれるため、必ず交わる。
 *
 * **指摘は 1 件も出ない** = `validate` も `visualValidateAll` も 0 件を返し、
 * 板の大きさも変わらない。 画面で見た時にだけ分かる (#2200)。
 *
 * ## 直さずに数える
 *
 * 直すには `cdl` の描画側で値の字か矢印の取り付き位置を変える必要があり、
 * `cdl` は読み取り専用の依存で本 repo からは直せない (#2200 が 3 案を測って記録済)。
 *
 * だからここは **数えるところまで** を置く。 待っている間に新しい部品を足しても、
 * 同じ形が増えれば落ちる。 `cdl` 側が直れば件数が下がって、やはり落ちる。
 *
 * ## 天井は一致で見る
 *
 * `<=` にすると、直した人が天井を下げなくても通る。 天井が実態から離れていき、
 * 「あと何件か」 を誰も知らない状態に戻る (`typecheck-ratchet.test.ts` と同じ判断)。
 *
 * 件数だけでなく **中身** を並べるのは、「1 件直って 1 件増えた」 が通らないようにするため。
 *
 * ## 字の幅は見積もるが、判定を左右させない
 *
 * 描いた結果の `<text>` は座標と大きさを持つが、幅は持たない。
 * 単調な字送り (`font-family="monospace"`) の advance は 0.6em なので、それで見積もる。
 *
 * **幅を 0 と見積もっても同じ集合になることを別の 1 件で確かめる**。
 * 幅 0 の箱は字の中心だけの縦の帯になるので、幅に寄りかかった交わりは消える。
 * 消えないなら、拾った交わりは矢印が字の **中心** を通っている。
 *
 * 比を 0.5 と 0.7 に振る形では確かめたことにならない。 実測すると集合が動くのは比 30 で、
 * 現実の比を振っても常に通る = 何も確かめない検査になる (#2500 と同じ形)。
 *
 * | 比 | 件数 |
 * |---|---|
 * | 0 / 0.3 / 0.6 / 1 / 3 / 12 | 5 |
 * | 30 | 7 |
 */
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as PartsMod from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";

/** 部品を実物から集める。 名前を並べると、後から足した部品が検査を受けない */
function 部品たち(): Array<{ name: string; diagram: CdlDiagram }> {
  const out: Array<{ name: string; diagram: CdlDiagram }> = [];
  for (const [name, val] of Object.entries(PartsMod as Record<string, unknown>)) {
    if (!val || typeof val !== "object") continue;
    const d = val as Partial<CdlDiagram>;
    if (typeof d.id === "string" && Array.isArray(d.nodes)) out.push({ name, diagram: d as CdlDiagram });
  }
  return out;
}

interface 字の箱 {
  字: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/**
 * 描いた結果から値の字を拾う。
 *
 * 値の字は単調な字送りで描かれ、数を含む。 題や説明は別の字送りなので混ざらない。
 * 縦は上に伸びる分 (0.8em) と下に垂れる分 (0.25em) を足す = 描画で一般的な比。
 */
function 値の字たち(html: string, 幅の比: number): 字の箱[] {
  const out: 字の箱[] = [];
  for (const m of html.matchAll(/<text([^>]*)>([^<]*)<\/text>/g)) {
    const 属性 = m[1] ?? "";
    const 字 = m[2] ?? "";
    if (!/font-family="monospace"/.test(属性) || !/\d/.test(字)) continue;
    const x = Number(/x="(-?[\d.]+)"/.exec(属性)?.[1] ?? NaN);
    const y = Number(/y="(-?[\d.]+)"/.exec(属性)?.[1] ?? NaN);
    const 大 = Number(/font-size="([\d.]+)"/.exec(属性)?.[1] ?? 11);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const w = 字.length * 大 * 幅の比;
    out.push({ 字, x0: x - w / 2, x1: x + w / 2, y0: y - 大 * 0.8, y1: y + 大 * 0.25 });
  }
  return out;
}

/** 道筋を線分に割る。 部品の道筋は直交する折れ線 (`M` と `L` だけ) */
function 線分たち(d: string): Array<[number, number, number, number]> {
  const 点: Array<[number, number]> = [];
  for (const m of d.matchAll(/[ML]\s*(-?[\d.]+)\s+(-?[\d.]+)/g)) {
    点.push([Number(m[1]), Number(m[2])]);
  }
  const out: Array<[number, number, number, number]> = [];
  for (let i = 1; i < 点.length; i++) {
    const a = 点[i - 1]!;
    const b = 点[i]!;
    out.push([a[0], a[1], b[0], b[1]]);
  }
  return out;
}

/** 縦の線分と横の線分だけ見る (斜めの道筋は部品には出ない) */
function 交わる(箱: 字の箱, 線: [number, number, number, number]): boolean {
  const [x1, y1, x2, y2] = 線;
  if (x1 === x2) {
    return x1 >= 箱.x0 && x1 <= 箱.x1 && Math.max(y1, y2) >= 箱.y0 && Math.min(y1, y2) <= 箱.y1;
  }
  if (y1 === y2) {
    return y1 >= 箱.y0 && y1 <= 箱.y1 && Math.max(x1, x2) >= 箱.x0 && Math.min(x1, x2) <= 箱.x1;
  }
  return false;
}

function 走査(幅の比: number): { 枚数: number; 当たり: string[] } {
  const 部品 = 部品たち();
  const 当たり = new Set<string>();
  for (const { diagram } of 部品) {
    const html = renderToStaticMarkup(
      React.createElement(CdlDiagramView as never, { diagram, hideHeader: true } as never),
    );
    const 字 = 値の字たち(html, 幅の比);
    if (字.length === 0) continue;
    const laid = layout(diagram) as unknown as { edges?: Array<{ id: string; d?: string }> };
    for (const e of laid.edges ?? []) {
      for (const 線 of 線分たち(e.d ?? "")) {
        for (const v of 字) {
          if (交わる(v, 線)) 当たり.add(`${diagram.id} の矢印 ${e.id} が "${v.字}" を通る`);
        }
      }
    }
  }
  return { 枚数: 部品.length, 当たり: [...当たり].sort() };
}

/** 単調な字送りの advance。 判定を左右しないことを下の 1 件が確かめる */
const 幅の比 = 0.6;

/**
 * いま割れている箇所。 **直したらここも減らす**。
 *
 * 減らさないとこの検査が落ちて教えてくれる。 増えた時も落ちる。
 * 直すには `cdl` の描画側が要るため、この repo からは減らせない (#2200)。
 *
 * `parts-funnel-3` が 2 件なのは縦の線を 2 本持つため。
 */
const いま割れている = [
  'parts-backpressure の矢印 bp-out が "40 / 100" を通る',
  'parts-batch-collector の矢印 bt-in が "0 / 10" を通る',
  'parts-funnel-3 の矢印 fn-1 が "0 / 100" を通る',
  'parts-funnel-3 の矢印 fn-2 が "0 / 100" を通る',
  'parts-split-box の矢印 sp-tag が "0 / 24" を通る',
];

describe("縦の矢印が値の字を割る箇所 (#2509)", () => {
  const { 枚数, 当たり } = 走査(幅の比);

  it("部品を 1 枚以上走査している (走査の生存確認)", () => {
    // 0 枚だと、下の一致が「該当なし」 なのか「測っていない」 なのか分からない
    expect(枚数, "部品を 1 枚も集められていない").toBeGreaterThan(0);
  });

  it("割れている箇所が宣言した一覧とちょうど一致する", () => {
    expect(
      当たり,
      `割れている箇所が変わった (部品 ${枚数} 枚を走査)。` +
        " 増えたなら足した部品を見直し、減ったなら一覧からその行を外す",
    ).toEqual(いま割れている);
  });

  it("幅を 0 と見積もっても同じ集合になる (見積もりに寄りかかっていない)", () => {
    /*
     * 幅 0 の箱は字の中心だけの縦の帯。 幅に寄りかかった交わりはここで消える。
     * 消えないなら、拾った交わりは矢印が字の中心を通っている。
     */
    expect(
      走査(0).当たり,
      "幅を 0 にすると集合が変わる = 拾った交わりが幅の見積もりに寄りかかっている",
    ).toEqual(当たり);
  });
});
