import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05";
import { compileToCdl, type CompileNotice } from "../src/compile";

/**
 * 2 軸で仕分ける図に軸の名前を書けることの検証 (#1251)。
 *
 * 組み立て側が「小さい / 大きい」 を直接書き込んでおり、記法から変える経路が無かった。
 * 軸の名前が書けないと **何を判断する図か読めない** = 図の意味そのものが消える。
 *
 * 区画の名前は軸の名前から決める。 組立て API 側が同じ規則で導いているため
 * (実測 = 左 L / 右 R / 下 B / 上 T で 左上が「T × L」)、別の規則にすると図が食い違う。
 */

function 組み立てる(src: string) {
  const r = parseTextDslV05(src);
  if (!r.ok) throw new Error(r.errors.map((e) => `L${e.line}: ${e.message}`).join("\n"));
  const 知らせ: CompileNotice[] = [];
  return { 図: compileToCdl(r.doc, { onNotice: (n) => 知らせ.push(n) }), 知らせ };
}

type 区画データ = {
  xAxis: { left: string; right: string };
  yAxis: { bottom: string; top: string };
  quadrantLabels: { topLeft: string; topRight: string; bottomLeft: string; bottomRight: string };
};

const 区画 = (src: string) =>
  (組み立てる(src).図.nodes[0] as { quadrantData?: 区画データ }).quadrantData;

const 効かない知らせ = (src: string) =>
  組み立てる(src).知らせ.filter((n) => n.message.includes("axes は効きません"));

const 仕分け = (軸 = "") =>
  `title: "T"\ntype: quadrant\n${軸}\nactors:\n  - 重複削除: "左上"\n`;

const 両軸 = `axes:\n  x: { left: "手間 小", right: "手間 大" }\n  y: { bottom: "効き 小", top: "効き 大" }\n`;

describe("軸の名前を書ける (#1251)", () => {
  it("軸の名前が図に届く", () => {
    const q = 区画(仕分け(両軸));
    expect(q?.xAxis).toEqual({ left: "手間 小", right: "手間 大" });
    expect(q?.yAxis).toEqual({ bottom: "効き 小", top: "効き 大" });
  });

  it("区画の名前が軸から決まる", () => {
    // 組立て API と同じ規則。 別の規則にすると同じ内容を書いても図が食い違う
    expect(区画(仕分け(両軸))?.quadrantLabels).toEqual({
      topLeft: "効き 大 × 手間 小",
      topRight: "効き 大 × 手間 大",
      bottomLeft: "効き 小 × 手間 小",
      bottomRight: "効き 小 × 手間 大",
    });
  });

  it("片側だけ書いたら残りは既定のまま", () => {
    // 空文字を渡すと名前の無い軸が描かれる
    const q = 区画(仕分け(`axes:\n  x: { left: "手間 小", right: "手間 大" }\n`));
    expect(q?.xAxis).toEqual({ left: "手間 小", right: "手間 大" });
    expect(q?.yAxis, "書いていない軸が消えている").toEqual({ bottom: "小さい", top: "大きい" });
  });

  it("知らせは出ない", () => {
    expect(効かない知らせ(仕分け(両軸))).toEqual([]);
  });
});

describe("書かなければ従来どおり (陰性対照)", () => {
  it("位置の名前が出る", () => {
    // 既に描いてある図が動かないことを固定する
    const q = 区画(仕分け());
    expect(q?.xAxis).toEqual({ left: "小さい", right: "大きい" });
    expect(q?.yAxis).toEqual({ bottom: "小さい", top: "大きい" });
    expect(q?.quadrantLabels).toEqual({
      topLeft: "左上",
      topRight: "右上",
      bottomLeft: "左下",
      bottomRight: "右下",
    });
  });

  it("中身の無い axes は書かなかったのと同じ", () => {
    // 1 本も読めなかった形で空の軸を渡すと、名前の無い軸が描かれる
    const q = 区画(仕分け(`axes:\n  読めない行\n`));
    expect(q?.quadrantLabels.topLeft).toBe("左上");
  });
});

describe("軸を持たない図種では伝える", () => {
  const 他図種 = (type: string) =>
    `title: "T"\ntype: ${type}\n${両軸}\nactors:\n  - A\n  - B\nflow:\n  - A -> B: "x"\n`;

  for (const type of ["sequence", "flow", "swimlane", "er", "state", "topology", "pie", "bar", "funnel", "tree", "journey", "mind", "gantt"]) {
    it(`${type} で知らせが出る`, () => {
      expect(効かない知らせ(他図種(type))).toHaveLength(1);
    });
  }

  it("知らせに図種の名前と行番号と直し方が入る", () => {
    const n = 効かない知らせ(他図種("flow"))[0];
    expect(n?.message, "図種の名前が無い").toContain("type: flow");
    expect(n?.line, "行番号が違う").toBe(3);
    expect(n?.hint, "直し方が無い").toContain("type: quadrant");
  });

  it("書かなければ知らせない (陰性対照)", () => {
    const src = `title: "T"\ntype: flow\n\nactors:\n  - A\n  - B\nflow:\n  - A -> B: "x"\n`;
    expect(効かない知らせ(src)).toEqual([]);
  });
});

describe("書き方の誤りを伝える", () => {
  it("読めない行を知らせる", () => {
    const r = parseTextDslV05(仕分け(`axes:\n  z: { left: "x" }\n`));
    expect(r.ok, "誤りを通している").toBe(false);
    const 本文 = r.ok ? [] : r.errors.map((e) => e.message);
    expect(本文.some((m) => m.startsWith("invalid axes entry")), 本文.join(" / ")).toBe(true);
  });
});
