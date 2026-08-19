import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05";
import { compileToCdl, type CompileNotice } from "../src/compile";

/**
 * 工程の並びに担当と終わる時期を書けることの検証 (#1251)。
 *
 * 組み立て API の帯は担当を持ち、終わりを状態から取って段で伸び縮みさせられるが、
 * 記法には書く場所が無かった。 記法で書き直すと担当が消え、帯は常に 1 コマになる。
 *
 * 他の図種には相手が無いため、書かれていたら伝える (#1026 / #1090 / #1246 / #1247 と同じ)。
 */

function 組み立てる(src: string) {
  const r = parseTextDslV05(src);
  if (!r.ok) throw new Error(r.errors.map((e) => `L${e.line}: ${e.message}`).join("\n"));
  const 知らせ: CompileNotice[] = [];
  return { 図: compileToCdl(r.doc, { onNotice: (n) => 知らせ.push(n) }), 知らせ };
}

type 帯 = { id: string; startIdx: number | string; endIdx: number | string; startLabel: string; endLabel: string; owner?: string };

const 帯一覧 = (src: string) =>
  (組み立てる(src).図.nodes[0] as { ganttData?: 帯[] }).ganttData;

const 効かない知らせ = (src: string) =>
  組み立てる(src).知らせ.filter((n) => n.message.includes("工程の並びの欄がありません"));

const 工程 = (欄 = "") =>
  `title: "T"\ntype: gantt\n\nactors:\n  - 設計: { value: "Q1" }\n  - 実装: { value: "Q2"${欄} }\n  - 検証: { value: "Q3" }\n`;

describe("工程の並びに担当と終わる時期を書ける (#1251)", () => {
  it("担当が帯に届く", () => {
    expect(帯一覧(工程(', owner: "Eng"'))?.[1]?.owner).toBe("Eng");
  });

  it("終わる時期を書くと帯が伸びる", () => {
    const t = 帯一覧(工程(', end: "Q3"'))?.[1];
    expect(t?.startIdx, "始まりが動いている").toBe(1);
    expect(t?.endIdx, "終わりが伸びていない").toBe(2);
    expect(t?.endLabel, "終わりの字が変わっていない").toBe("Q3");
  });

  it("終わる時期を状態から取れる", () => {
    // 描画側が状態を解いて位置に直すため、段で帯が伸び縮みする
    const t = 帯一覧(工程(', end: "{build_end}"'))?.[1];
    expect(t?.endIdx).toBe("{build_end}");
    // 状態が指すのは位置であって時期の名前ではないので、字は始まりのものを使う
    expect(t?.endLabel, "字まで状態にしている").toBe("Q2");
  });

  it("書かなければ始まりと同じ (陰性対照)", () => {
    const t = 帯一覧(工程())?.[1];
    expect(t?.endIdx, "帯が勝手に伸びている").toBe(1);
    expect(t?.endLabel).toBe("Q2");
    expect(t && "owner" in t, "書いていないのに担当がある").toBe(false);
  });

  it("目盛りに無い時期を書いたら始まりと同じに倒す", () => {
    // 目盛りは書かれた順に作るため、載っていない名前は位置を持たない
    expect(帯一覧(工程(', end: "Q9"'))?.[1]?.endIdx).toBe(1);
  });

  it("知らせは出ない", () => {
    expect(効かない知らせ(工程(', owner: "Eng", end: "Q3"'))).toEqual([]);
  });
});

describe("工程の並びでない図種では伝える", () => {
  const 他図種 = (type: string, 欄: string) =>
    `title: "T"\ntype: ${type}\n\nactors:\n  - A: { ${欄} }\n  - B\nflow:\n  - A -> B: "x"\n`;

  for (const type of ["sequence", "flow", "swimlane", "er", "state", "topology", "pie", "bar", "funnel", "tree", "journey", "quadrant"]) {
    it(`${type} で知らせが出る`, () => {
      expect(効かない知らせ(他図種(type, 'owner: "Eng"'))).toHaveLength(1);
    });
  }

  it("2 つ書いたら両方を並べて伝える", () => {
    expect(効かない知らせ(他図種("flow", 'owner: "Eng", end: "Q3"'))[0]?.message).toContain("owner / end");
  });

  it("知らせに行番号と直し方が入る", () => {
    const n = 効かない知らせ(他図種("flow", 'owner: "Eng"'))[0];
    expect(n?.line, "行番号が違う").toBe(5);
    expect(n?.hint).toContain("type: gantt");
  });

  it("書かなければ知らせない (陰性対照)", () => {
    expect(効かない知らせ(他図種("flow", 'kind: storage'))).toEqual([]);
  });

  it("体験の道筋の欄とは別に伝える", () => {
    // 2 種類の欄を同時に書いたら、それぞれの直し方で 2 件出る = 片方だけ直しても残りが分かる
    const { 知らせ } = 組み立てる(他図種("flow", 'owner: "Eng", touchpoint: "x"'));
    expect(知らせ.filter((n) => n.message.includes("工程の並びの欄がありません"))).toHaveLength(1);
    expect(知らせ.filter((n) => n.message.includes("体験の道筋の欄がありません"))).toHaveLength(1);
  });

  it("放射の図では二重に知らせない", () => {
    const src = `title: "T"\ntype: mind\n\nactors:\n  - 中心\n  - A: { owner: "Eng" }\n`;
    const { 知らせ } = 組み立てる(src);
    expect(知らせ.filter((n) => n.message.includes("工程の並びの欄がありません"))).toEqual([]);
    expect(知らせ.some((n) => n.message.includes("担当 (工程の並びの欄)")), "放射の図の知らせから落ちている").toBe(true);
  });
});

describe("見本 (parts) の状態を横取りしない", () => {
  it("状態として残る", () => {
    const r = parseTextDslV05(`title: "T"\ntype: flow\n\nactors:\n  - g: { kind: arc-gauge, owner: 5, end: 9 }\n`);
    expect(r.ok, "解析に失敗した").toBe(true);
    expect(r.ok ? r.doc.actors[0]?.stateOverride : undefined).toEqual({ owner: 5, end: 9 });
  });

  it("見本では工程の欄にしない", () => {
    // 状態に残ることだけを見ると、欄にも同時に入れる実装を通してしまう (変異試験で判明)。
    // 見本の箱が工程の欄を持つと、帯を描かない図種で知らせが出る側にも回る
    const r = parseTextDslV05(`title: "T"\ntype: flow\n\nactors:\n  - g: { kind: arc-gauge, owner: 5, end: 9 }\n`);
    const a = r.ok ? r.doc.actors[0] : undefined;
    expect(a?.owner, "工程の欄に入れている").toBeUndefined();
    expect(a?.end, "工程の欄に入れている").toBeUndefined();
  });

  it("見本に書いても知らせない", () => {
    // 欄に入れてしまうと、ここで知らせが出る = 正しい見本が警告だらけになる
    expect(効かない知らせ(`title: "T"\ntype: flow\n\nactors:\n  - g: { kind: arc-gauge, owner: 5 }\n`)).toEqual([]);
  });

  it("縦に並べた形でも状態として残る", () => {
    const r = parseTextDslV05(
      `title: "T"\ntype: flow\n\nactors:\n  - g:\n      owner: 5\n      kind: arc-gauge\n`,
    );
    expect(r.ok, "解析に失敗した").toBe(true);
    expect(r.ok ? r.doc.actors[0]?.stateOverride : undefined).toEqual({ owner: 5 });
  });
});
