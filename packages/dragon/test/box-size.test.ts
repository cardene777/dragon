import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05";
import { compileToCdl } from "../src/compile";

/**
 * 箱に書いた大きさが図に届くことの検証 (#1259)。
 *
 * 組立て API 側は箱ごとに幅を指定することがある。 記法から書けないと描画側の既定 (640) に
 * なり、**既定より狭い幅を指定した図では縦列ごと広がる**
 * (実測 = 拡張ステート図は箱 280 / 縦列 330。 既定 640 が縦列を押し広げ、
 * 描いた図の幅が 2439 対 2279 になった)。
 */

const 記法 = (欄: string, type = "state") =>
  `title: "T"\ntype: ${type}\n\nactors:\n  - A: { kind: card${欄} }\n  - B: { kind: card }\n` +
  `flow:\n  - A -> B: "x"\n\nanimation:\n  - step: "s1" 1s\n    focus: [A]\n    body: "b"\n`;

function 箱(src: string) {
  const r = parseTextDslV05(src);
  if (!r.ok) throw new Error(r.errors.map((e) => e.message).join(" / "));
  return compileToCdl(r.doc).nodes;
}

describe("箱に書いた大きさが図に届く (#1259)", () => {
  it("幅が届く", () => {
    expect(箱(記法(", posW: 280"))[0]?.w).toBe(280);
  });

  it("高さが届く", () => {
    expect(箱(記法(", posH: 120"))[0]?.h).toBe(120);
  });

  it("書いた箱にだけ付く", () => {
    // 1 つ書いたら全部に付く、という形にしない
    const n = 箱(記法(", posW: 280"));
    expect(n[0]?.w).toBe(280);
    expect(n[1]?.w, "書いていない箱にも付いている").toBeUndefined();
  });

  it("書かなければ項目ごと落とす (陰性対照)", () => {
    // `undefined` を明示して渡すと、描画側が「既定を使う」 と区別できなくなる
    const n = 箱(記法(""))[0];
    expect(n && "w" in n, "書いていないのに幅がある").toBe(false);
    expect(n && "h" in n, "書いていないのに高さがある").toBe(false);
  });

  // 箱ごとに縦列を作る図種と、1 縦列にまとめる図種の両方で効くことを見る
  for (const type of ["state", "swimlane", "er", "flow", "topology"]) {
    it(`${type} で幅が届く`, () => {
      expect(箱(記法(", posW: 280", type))[0]?.w).toBe(280);
    });
  }
});

describe("幅が図に出るかは縦列との大小で決まる (実測)", () => {
  // **1 件で確かめて「見た目に出ない」 と決めない**。 幅は縦列に収まれば図を変えず、
  // 縦列より広ければ縦列ごと押し広げる。 #1260 で 1 件だけ見て「出ない」 と判断し、
  // 配線を外してしまった (この検査はその再発を止める)
  const 縦列の幅 = (posW: string) => {
    const src = `title: "T"\ntype: state\n\nlanes:\n  lane-a: { width: 330 }\n  lane-b: { width: 330 }\n\n` +
      `actors:\n  - A: { kind: card${posW} }\n  - B: { kind: card }\n` +
      `flow:\n  - A -> B: "x"\n\nanimation:\n  - step: "s1" 1s\n    focus: [A]\n    body: "b"\n`;
    const r = parseTextDslV05(src);
    if (!r.ok) throw new Error(r.errors.map((e) => e.message).join(" / "));
    const d = compileToCdl(r.doc);
    return { 箱: d.nodes[0]?.w, 縦列: (d.lanes ?? [])[0]?.width };
  };

  it("縦列より狭い幅を書くと、箱だけが変わる", () => {
    expect(縦列の幅(", posW: 280")).toEqual({ 箱: 280, 縦列: 330 });
  });

  it("書かなければ箱の幅を持たない", () => {
    expect(縦列の幅("")).toEqual({ 箱: undefined, 縦列: 330 });
  });
});
