import { describe, it, expect } from "vitest";

import { textDslToDiagram } from "../src/index";

/**
 * 放射と木で、名前と補足を分けて渡すことの検証 (#1332)。
 *
 * 連結して 1 つの `title` にすると、描画側は 1 行の経路を通って箱幅を超え、末尾が切られる
 * (実測 = 箱 120px に対し文字 163px)。 分ければ 1 行あたりが短くなり、同じ箱幅で 2 行に
 * 収まる。
 *
 * 木は補足を **渡していなかった** = 書いた文字が図に出ない状態だった。
 */

const 放射 = (中心の補足: string, 枝の補足: string): string => `title: "t"
type: mind

actors:
  - 図を速くする: "${中心の補足}"
  - 描く量を減らす: "${枝の補足}"

animation:
  - step: "s" 1.2s
    draw: mind
`;

const 木 = (補足: string): string => `title: "t"
type: tree

actors:
  - dragon: "${補足}"
  - 記法

flow:
  - dragon -> 記法: ""

animation:
  - step: "s" 1.2s
    draw: tree
`;

/** 図から放射の payload を取る */
const 放射のpayload = (src: string) => {
  const d = textDslToDiagram(src);
  const n = d.nodes.find((x) => x.mindData !== undefined);
  expect(n, "放射の payload を持つ箱が無い").toBeDefined();
  return n!.mindData!;
};

/** 図から木の payload を取る */
const 木のpayload = (src: string) => {
  const d = textDslToDiagram(src);
  const n = d.nodes.find((x) => x.treeData !== undefined);
  expect(n, "木の payload を持つ箱が無い").toBeDefined();
  return n!.treeData!;
};

describe("放射と木の名前と補足 (#1332)", () => {
  it("放射の中心が名前と補足に分かれる", () => {
    const p = 放射のpayload(放射("300 ms 短縮", "80 ms"));
    expect(p.rootTitle, "中心の名前に補足が混ざっている").toBe("図を速くする");
    expect(p.rootSubtitle, "中心の補足が渡っていない").toBe("300 ms 短縮");
  });

  it("放射の枝が名前と補足に分かれる", () => {
    const p = 放射のpayload(放射("300 ms 短縮", "80 ms"));
    const 枝 = p.branches[0];
    expect(枝, "枝が無い").toBeDefined();
    expect(枝!.title, "枝の名前に補足が混ざっている").toBe("描く量を減らす");
    expect(枝!.subtitle, "枝の補足が渡っていない").toBe("80 ms");
  });

  it("木の箱が名前と補足に分かれる", () => {
    const p = 木のpayload(木("記法から図を作る"));
    const 根 = p.find((x) => x.title === "dragon");
    expect(根, "根が無い").toBeDefined();
    expect(根!.subtitle, "木の補足が渡っていない").toBe("記法から図を作る");
  });

  it("補足を書かない箱では補足が空 (陰性対照)", () => {
    // 上の検査だけだと、常に補足を付ける実装でも通る
    const p = 放射のpayload(放射("", ""));
    expect(p.rootSubtitle, "書いていない補足が付いている").toBeUndefined();
    expect(p.branches[0]!.subtitle, "書いていない補足が付いている").toBeUndefined();
  });

  it("補足に値の参照を書くとそのまま渡る", () => {
    // 解決は描画側が行う。 組み立ては参照の形を保つ
    const src = `title: "t"
type: mind

actors:
  - 図を速くする: "{total} ms 短縮"
  - 描く量を減らす: "{paint} ms"

states:
  total: 0
  paint: 0

animation:
  - step: "s" 1.2s
    draw: mind
`;
    const p = 放射のpayload(src);
    expect(p.rootSubtitle, "中心の補足の参照が壊れている").toBe("{total} ms 短縮");
    expect(p.branches[0]!.subtitle, "枝の補足の参照が壊れている").toBe("{paint} ms");
  });

  it("補足と値の両方を書くと 1 つの補足に繋ぐ", () => {
    // 描画側の補足は 1 行なので、2 つを別々の行にはできない
    const src = `title: "t"
type: mind

actors:
  - 図を速くする:
      subtitle: "短縮"
      value: "300 ms"
  - 描く量を減らす: "80 ms"

animation:
  - step: "s" 1.2s
    draw: mind
`;
    const p = 放射のpayload(src);
    expect(p.rootTitle, "名前に補足が混ざっている").toBe("図を速くする");
    expect(p.rootSubtitle, "補足と値が繋がっていない").toBe("短縮 300 ms");
  });
});
