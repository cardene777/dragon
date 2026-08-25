/**
 * 縦列の並びと段の番号の検査 (#1394)。
 *
 * 記法から作った図が組み立て API の図と一致しない最後の 2 件が、どちらもこの 2 つに
 * 由来していた。
 *
 * | 見本 | ずれ |
 * |---|---|
 * | `radialHubAndSpoke` | 縦列の並びが箱の書き順で入れ替わる |
 * | `decisionTree` | 段の番号が書き順で 0 から詰め直される |
 *
 * ## なぜ書いたとおりに持つのか
 *
 * どちらも **書いた形がそのまま図の意味になる**。 縦列は左から右への並びが読む順で、
 * 段は「同じ高さに並ぶか」 が枝分かれの意味そのもの。 詰めたり入れ替えたりした瞬間に
 * 別の図になる。
 */
import { describe, it, expect } from "vitest";

import { textDslToDiagram } from "../src";

type 図 = {
  lanes?: { id: string; x?: number }[];
  nodes: { title: string; lane: string; stack: number }[];
};

const 記法 = (中身: string) => textDslToDiagram(中身) as unknown as 図;

const 縦列 = (d: 図) => (d.lanes ?? []).map((l) => l.id);
const 箱 = (d: 図) => d.nodes.map((n) => [n.title, n.lane, n.stack]);

describe("縦列は `lanes:` に書いた順に並ぶ (#1394)", () => {
  it("箱の書き順が縦列の書き順と違っても、書いた順で並ぶ", () => {
    // 中心を先に書いた放射の図で踏んだ形。 箱の書き順で並べると左端が中心の右へ回る
    const d = 記法(`title: "t"
type: flow

lanes:
  left: { x: -300, width: 200 }
  center: { x: 0, width: 200 }
  right: { x: 300, width: 200 }

actors:
  - Hub: { kind: card, lane: center, stack: 0 }
  - L: { kind: card, lane: left, stack: 0 }
  - R: { kind: card, lane: right, stack: 0 }
`);
    expect(縦列(d)).toEqual(["left", "center", "right"]);
  });

  it("`lanes:` に無い縦列は箱が使った順で後ろに続く", () => {
    // 書いた縦列だけを並べ替える。 書いていない縦列まで動かすと、宣言しない図の並びが変わる
    const d = 記法(`title: "t"
type: flow

lanes:
  declared: { x: 300, width: 200 }

actors:
  - A: { kind: card, lane: first, stack: 0 }
  - B: { kind: card, lane: declared, stack: 0 }
  - C: { kind: card, lane: last, stack: 0 }
`);
    expect(縦列(d)).toEqual(["declared", "first", "last"]);
  });

  it("`lanes:` を書かなければ箱が使った順のまま", () => {
    // 0 件を見る検査ではないが、並べ替えが「書いた時だけ」 効くことを固定する
    const d = 記法(`title: "t"
type: flow

actors:
  - A: { kind: card, lane: b, stack: 0 }
  - B: { kind: card, lane: a, stack: 0 }
`);
    expect(縦列(d)).toEqual(["b", "a"]);
  });
});

describe("段は書いた番号をそのまま持つ (#1394)", () => {
  const 元 = `title: "t"
type: flow

lanes:
  root: { x: 0, width: 200 }
  mid: { x: 240, width: 200 }

actors:
`;

  it("飛び番号を詰めない", () => {
    // 決定木の根が 1 段目にいる形。 詰めると根が上へ上がって別の木になる
    const d = 記法(
      `${元}  - A: { kind: card, lane: root, stack: 1 }
  - B: { kind: card, lane: mid, stack: 0 }
  - C: { kind: card, lane: mid, stack: 2 }
`,
    );
    expect(箱(d)).toEqual([
      ["A", "root", 1],
      ["B", "mid", 0],
      ["C", "mid", 2],
    ]);
  });

  it("書いた順と段の順が食い違っても書いた番号を持つ", () => {
    const d = 記法(
      `${元}  - A: { kind: card, lane: root, stack: 2 }
  - B: { kind: card, lane: root, stack: 0 }
`,
    );
    expect(箱(d)).toEqual([
      ["A", "root", 2],
      ["B", "root", 0],
    ]);
  });

  it("書かなければ、その縦列で空いている一番小さい段に置く", () => {
    /*
     * **単に数え上げてはいけない**。 書いた番号と重なり、2 つの箱が同じ段に載る
     * (実測 = 数え上げると 2 件目が 0 に落ちて 1 件目と重なった)。
     */
    const d = 記法(
      `${元}  - A: { kind: card, lane: root, stack: 1 }
  - B: { kind: card, lane: root }
  - C: { kind: card, lane: root }
`,
    );
    expect(箱(d)).toEqual([
      ["A", "root", 1],
      ["B", "root", 0],
      ["C", "root", 2],
    ]);
  });

  it("誰も書かなければ 0 から順に積む", () => {
    // 書いた番号を持つ形にしても、書かない図の並びは変わらない
    const d = 記法(
      `${元}  - A: { kind: card, lane: root }
  - B: { kind: card, lane: root }
  - C: { kind: card, lane: mid }
`,
    );
    expect(箱(d)).toEqual([
      ["A", "root", 0],
      ["B", "root", 1],
      ["C", "mid", 0],
    ]);
  });
});
