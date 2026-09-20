/*
 * クラス図で同じ縦列に箱を 2 つ置き、段を書かないと図が描けなかった (#2396)。
 *
 * クラス図の組み立ては段を書いた箱にだけ段を渡し、書かない箱は描画側の既定 (0) のまま
 * 残していた。 同じ縦列の箱が全て段 0 に載るため、配置を計算する側が
 * `cdl layout: lane "l1" の stack=0 に node が重複` として投げる。
 *
 * 組み立てだけでは落ちない形もある = 縦列にずらしを書いた図は組み立ての途中で配置を 1 度
 * 計算するのでそこで落ち、書かない図は画面に描く時に落ちる。 **両方を見る**。
 *
 * 段の決め方は箱を並べる図種すべてで共通 (`縦列ごとの段を決める`)。 クラス図だけ
 * その決め方を持っていなかった。
 */
import { describe, expect, it } from "vitest";
import { layout } from "@cardenelabs/cdl";
import { compileToCdl } from "../src/compile";
import { PRESET_TYPES, parseTextDslV05 } from "../src/v05/parser";

/** 図種ごとに読める値。 値として読む図は語の形が決まっている */
const 読める値 = (図種: string): string =>
  図種 === "gantt" ? '"1月"' : 図種 === "journey" ? '"満足"' : 図種 === "quadrant" ? '"左上"' : "10";

/** 同じ縦列に箱を 2 つ置いた本文。 段を書くかを選べる */
function 本文(図種: string, 段を書く: boolean): string {
  const v = 読める値(図種);
  const s = (i: number) => (段を書く ? `, stack: ${i}` : "");
  return `title: "しらべ"
type: ${図種}

lanes:
  l1: { width: 300 }
  l2: { width: 300 }

actors:
  - あ: { lane: l1, value: ${v}${s(0)} }
  - い: { lane: l1, value: ${v}${s(1)} }
  - う: { lane: l2, value: ${v} }

flow:
  - あ -> い: "つなぐ"
`;
}

function 読む(src: string) {
  const p = parseTextDslV05(src);
  if (!p.ok) throw new Error(`読めない本文: ${p.errors.map((e) => e.message).join(" / ")}`);
  return p.doc;
}

/** 箱の段を名前つきで取り出す */
const 段の並び = (src: string): [string, number | undefined][] =>
  (compileToCdl(読む(src)).nodes as { id: string; stack?: number }[]).map((n) => [n.id, n.stack]);

describe("同じ縦列に箱を 2 つ置いた図が描ける (#2396)", () => {
  it("全ての図種で、組み立ても配置も例外で落ちない", () => {
    /*
     * **組み立てと配置の両方を見る**。 落ちる場所が書き方で分かれるため、片方だけだと
     * もう片方の経路が素通りする。 図種の一覧は記法から取る = 図種を足した日に追随する。
     */
    const 落ちた: string[] = [];
    let 走査 = 0;
    for (const 図種 of [...PRESET_TYPES].sort()) {
      for (const 段を書く of [false, true]) {
        走査 += 1;
        const doc = 読む(本文(図種, 段を書く));
        const 札 = `${図種}/段${段を書く ? "有" : "無"}`;
        let d;
        try {
          d = compileToCdl(doc, { onNotice: () => {} });
        } catch (e) {
          落ちた.push(`${札}/組み立て: ${(e as Error).message}`);
          continue;
        }
        try {
          layout(d);
        } catch (e) {
          落ちた.push(`${札}/配置: ${(e as Error).message}`);
        }
      }
    }
    expect(落ちた, "例外で落ちた組み合わせ").toEqual([]);
    // 空振り防止 = 図種 24 件 × 段の有無 2 通りを全て読めていること
    expect(走査, "走査した組み合わせ").toBe(PRESET_TYPES.size * 2);
  });

  it("縦列にずらしを書いたクラス図が組み上がる", () => {
    /*
     * ずらしを書いた図は組み立ての途中で配置を 1 度計算する (`applyLayoutOffsets`)。
     * 画面に描く前に落ちる経路なので、上の走査とは別に見る。
     */
    const src = `title: "しらべ"
type: class

lanes:
  l1: { width: 300, offsetX: 60 }
  l2: { width: 300 }

actors:
  - あ: { lane: l1 }
  - い: { lane: l1 }
  - う: { lane: l2 }
`;
    expect(() => compileToCdl(読む(src), { onNotice: () => {} })).not.toThrow();
  });

  it("段を書かない箱が縦列ごとに 0 から順に載る", () => {
    const src = `title: "しらべ"
type: class

lanes:
  l1: { width: 300 }
  l2: { width: 300 }

actors:
  - あ: { lane: l1 }
  - い: { lane: l1 }
  - う: { lane: l1 }
  - え: { lane: l2 }
`;
    expect(段の並び(src)).toEqual([
      ["あ", 0],
      ["い", 1],
      ["う", 2],
      ["え", 0],
    ]);
  });

  it("書いた段はその番号のまま載る", () => {
    /*
     * 書き順で 0 から詰め直すと `stack: 2` と書いた箱が 1 へ落ちる。
     * 書いた番号が意味を持つ図 (格子に置く形) が別の図になる。
     */
    const src = `title: "しらべ"
type: class

lanes:
  l1: { width: 300 }

actors:
  - あ: { lane: l1, stack: 0 }
  - い: { lane: l1, stack: 2 }
`;
    expect(段の並び(src)).toEqual([
      ["あ", 0],
      ["い", 2],
    ]);
  });

  it("書いた箱と書かない箱が混ざっても段が重ならない", () => {
    /*
     * 書いた番号を先に全て埋めてから空きを探す。 書き順だけで数えると、後から書いた
     * `stack: 0` と、先に書いた段なしの箱が同じ段に載る。
     */
    const src = `title: "しらべ"
type: class

lanes:
  l1: { width: 300 }

actors:
  - あ: { lane: l1 }
  - い: { lane: l1, stack: 0 }
  - う: { lane: l1 }
`;
    const 段 = 段の並び(src);
    expect(段).toEqual([
      ["あ", 1],
      ["い", 0],
      ["う", 2],
    ]);
    const 番号 = 段.map(([, s]) => s);
    expect(new Set(番号).size, "同じ段に 2 つ載っている").toBe(番号.length);
  });

  it("陰性対照: 縦列を書かないクラス図は箱ごとに列が分かれたまま", () => {
    /*
     * 縦列を書かない図は組み立て器が宣言した順に横 1 列へ並べる = 箱ごとに列が分かれ、
     * どの箱も段 0 に載る。 この 0 は組み立て器の既定で、記法の側は何も渡していない。
     *
     * 同じ列に 2 つ載らないので配置も落ちない。 **列が分かれていることまで見る** =
     * 段だけを見ると、列が 1 本にまとまった日に「段 0 が 3 つ」 のまま通る。
     */
    const src = `title: "しらべ"
type: class

actors:
  - あ
  - い
  - う
`;
    expect(段の並び(src)).toEqual([
      ["あ", 0],
      ["い", 0],
      ["う", 0],
    ]);
    const 列 = (compileToCdl(読む(src)).nodes as { lane?: string }[]).map((n) => n.lane);
    expect(new Set(列).size, `箱が同じ列に載っている (${列.join(" / ")})`).toBe(3);
  });

  it("縦列を書く他の図種の段の付き方が変わらない", () => {
    /*
     * 段の決め方を共通の組み立てから取り出して共有した。 取り出す前と同じ結果になることを、
     * 書いた段と書かない段が混ざった流れ図で見る。
     */
    const src = `title: "しらべ"
type: flow

lanes:
  l1: { width: 300 }

actors:
  - あ: { lane: l1 }
  - い: { lane: l1, stack: 0 }
  - う: { lane: l1, stack: 3 }
  - え: { lane: l1 }
`;
    expect(段の並び(src)).toEqual([
      ["あ", 1],
      ["い", 0],
      ["う", 3],
      ["え", 2],
    ]);
  });
});
