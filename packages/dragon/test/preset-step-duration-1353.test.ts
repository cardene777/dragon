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
 *
 * ## #1440 で一度広げ、#1444 で戻した
 *
 * 当初は「伸ばすのは描く段だけ」 だった。 描かない段まで伸ばすと、値が動くだけの段で
 * 待たされるためである。
 *
 * `描き直す` (#1359) が入って前提が崩れた。 その切替は 1 段目の `draw` を 2 段目以降へ
 * 写すため、**2 段目も描く段になる**。 ところが伸び具合は段の進みそのもので決まるので、
 * 2 段目が既定のままだと同じ絵が 2.4 秒の後 0.9 秒で描き直され、約 2.7 倍速くなる。
 *
 * #1440 は「描く見本は全段を描く段の長さに揃える」 と見本側に書いて塞いだが、**書いた長さは
 * 既定の「動かすだけ」 でも効く** ため、値が移るだけの段まで長くなっていた。
 *
 * #1444 で揃える処理を写す側 (`redraw-mode.ts`) へ移し、見本は元の「伸ばすのは描く段だけ」 に
 * 戻した。 切替が入の時だけ揃うので、両方が立つ。
 *
 * 下の 2 件はその戻しに合わせて書き換えてある (削除ではなく、主張の載せ替え)。
 * 切替が入の時に揃うことは `preset-draw-duration.test.ts` が全見本で見る。
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

  it("折れ線の 2 段目は既定のまま (#1444 で戻した)", () => {
    // #1440 は 2 段目にも `描く段の長さ` を書いていたが、その値は「動かすだけ」 でも効き、
    // 値が移るだけの段まで長くなっていた。 揃えるのは写す側 (`redraw-mode.ts`) の役目
    const 段 = 折れ線().phases;
    expect(段.length, "2 段目が無い").toBeGreaterThan(1);
    expect(段[1]!.duration).toBe(既定の長さ);
    // 1 段目と違うことを直接見る = 同じ値だと「戻した」 ことにならない
    expect(段[1]!.duration, "2 段目が 1 段目と同じ長さのまま").toBeLessThan(段[0]!.duration);
  });

  it("描く段を持たない見本は、どの段も既定のまま (陰性対照)", () => {
    /*
     * #1357 で 6 件の見本にも描く段が入ったため、「折れ線以外は全て既定」 という形の対照は
     * 成立しなくなった。 **描く段を持たない見本** で取り直す = 起点から描けない種別
     * (順序図 / 関係図 等) の見本は長さを触らない。
     */
    const 図 = 図の一覧().filter((x) =>
      x.diagram.phases.every((p) => (p.draw ?? []).length === 0),
    );
    expect(図.length, "描く段を持たない見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);

    let 見た段 = 0;
    for (const { name, diagram } of 図) {
      for (const p of diagram.phases) {
        見た段 += 1;
        expect(p.duration, `${name} の段 "${p.id}" の長さが既定でない`).toBe(既定の長さ);
      }
    }
    expect(見た段, "段を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("描く段を持つ見本は 1 件ではない (#1357 で 7 件、#2177 から #2191 で 14 件、#2549 で 15 件に増えた)", () => {
    /*
     * 「描く段だけが長い」 の検査は、描く段が 1 件しか無くても通る。 見本を増やした後に
     * **1 件へ戻っていないこと** をここで見る = 増やした分が黙って外れたら落ちる。
     */
    const 描く見本 = 図の一覧().filter((x) =>
      x.diagram.phases.some((p) => (p.draw ?? []).length > 0),
    );
    expect(描く見本.map((x) => x.diagram.id).sort()).toEqual(
      [
        // 折れ線の複雑な版も左端から引く (#2177)
        "chart-line-complex-demo",
        "chart-line-demo",
        // 円グラフの複雑な版も起点から描く (#2179)
        "chart-pie-complex-demo",
        "chart-pie-demo",
        // 漏斗の複雑な版も起点から描く (#2185)
        "funnel-complex-demo",
        "funnel-demo",
        // 進捗図の複雑な版も起点から描く (#2181)
        "gantt-complex-demo",
        "gantt-demo",
        // 担当者を書かない版も起点から描く (#2549)
        "gantt-noowner-demo",
        // ユーザージャーニーの複雑な版も起点から描く (#2183)
        "journey-complex-demo",
        "journey-demo",
        // マインドマップの複雑な版も起点から描く (#2191)
        "mind-complex-demo",
        "mind-demo",
        // 階層図の複雑な版も起点から描く (#2189)
        "tree-complex-demo",
        "tree-demo",
      ].sort(),
    );
  });

  it("長さを伸ばしたのは、起点から描く段だけ (#1444 で戻した)", () => {
    // 伸ばす対象を「描く見本の全段」 から「描く段」 へ戻す。 2 段目を揃えるのは切替が
    // 入の時だけで、見本に書いた長さは既定の見え方を決める
    const 長い: string[] = [];
    const 描く段: string[] = [];
    for (const { name, diagram } of 図の一覧()) {
      for (const p of diagram.phases) {
        if (p.duration > 既定の長さ) 長い.push(`${name}:${p.id}`);
        if ((p.draw ?? []).length > 0) 描く段.push(`${name}:${p.id}`);
      }
    }
    expect(描く段.length, "描く段が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    expect(長い.sort()).toEqual(描く段.sort());
  });
});
