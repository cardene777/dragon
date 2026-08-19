import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05";
import { compileToCdl, type CompileNotice } from "../src/compile";

/**
 * 体験の道筋に場所と改善の余地を書けることの検証 (#1251)。
 *
 * 組み立て API の段は `touchpoint` (どこで起きたか) と `opportunity` (何を直せるか) を
 * 持つが、記法には書く場所が無かった。 記法で書き直すと 2 つとも落ちていた。
 *
 * 他の図種には相手が無いため、書かれていたら伝える (#1026 / #1090 / #1246 / #1247 と
 * 同じ「書いたのに効かない状態を黙って作らない」)。
 */

function 組み立てる(src: string) {
  const r = parseTextDslV05(src);
  if (!r.ok) throw new Error(r.errors.map((e) => `L${e.line}: ${e.message}`).join("\n"));
  const 知らせ: CompileNotice[] = [];
  return { 図: compileToCdl(r.doc, { onNotice: (n) => 知らせ.push(n) }), 知らせ };
}

const 段 = (src: string) =>
  (組み立てる(src).図.nodes[0] as { journeyData?: { touchpoint?: string; opportunity?: string }[] })
    .journeyData;

const 効かない知らせ = (src: string) =>
  組み立てる(src).知らせ.filter((n) => n.message.includes("体験の道筋の欄がありません"));

const 道筋 = (欄: string) =>
  `title: "T"\ntype: journey\n\nactors:\n  - 登録: { value: "不満"${欄} }\n`;

describe("体験の道筋に場所と改善の余地を書ける (#1251)", () => {
  it("場所が段に届く", () => {
    expect(段(道筋(', touchpoint: "申込み画面"'))?.[0]?.touchpoint).toBe("申込み画面");
  });

  it("改善の余地が段に届く", () => {
    expect(段(道筋(', opportunity: "入力を減らす"'))?.[0]?.opportunity).toBe("入力を減らす");
  });

  it("縦に並べた形でも届く", () => {
    // 書き方によって届いたり届かなかったりする状態を作らない (#1090 と同じ理由)
    const src = `title: "T"\ntype: journey\n\nactors:\n  - 登録:\n      value: "不満"\n` +
      `      touchpoint: "申込み画面"\n      opportunity: "入力を減らす"\n`;
    expect(段(src)?.[0]).toMatchObject({ touchpoint: "申込み画面", opportunity: "入力を減らす" });
  });

  it("書かなければ項目ごと落とす (陰性対照)", () => {
    // `undefined` を明示して渡すと、組立て側が「空を書いた」 と区別できなくなる
    const s = 段(道筋(""))?.[0];
    expect(s && "touchpoint" in s, "書いていないのに項目がある").toBe(false);
    expect(s && "opportunity" in s, "書いていないのに項目がある").toBe(false);
  });

  it("体験の道筋では知らせない", () => {
    expect(効かない知らせ(道筋(', touchpoint: "申込み画面"'))).toEqual([]);
  });
});

describe("描けない図種では伝える", () => {
  const 他図種 = (type: string, 欄: string) =>
    `title: "T"\ntype: ${type}\n\nactors:\n  - A: { ${欄} }\n  - B\nflow:\n  - A -> B: "x"\n`;

  for (const type of ["sequence", "flow", "swimlane", "er", "state", "topology", "pie", "bar", "tree", "gantt", "quadrant"]) {
    it(`${type} で知らせが出る`, () => {
      expect(効かない知らせ(他図種(type, 'touchpoint: "x"'))).toHaveLength(1);
    });
  }

  it("2 つ書いたら両方を並べて伝える", () => {
    const n = 効かない知らせ(他図種("flow", 'touchpoint: "x", opportunity: "y"'))[0];
    expect(n?.message).toContain("touchpoint / opportunity");
  });

  it("知らせに行番号と直し方が入る", () => {
    const n = 効かない知らせ(他図種("flow", 'touchpoint: "x"'))[0];
    expect(n?.line, "行番号が違う").toBe(5);
    expect(n?.hint).toContain("type: journey");
  });

  it("書かなければ知らせない (陰性対照)", () => {
    expect(効かない知らせ(他図種("flow", 'kind: storage'))).toEqual([]);
  });

  it("放射の図では二重に知らせない", () => {
    // `compileMind` が描けない欄をまとめて 1 件で伝えており、そこに 2 つとも入っている
    const src = `title: "T"\ntype: mind\n\nactors:\n  - 中心\n  - A: { touchpoint: "x" }\n`;
    const { 知らせ } = 組み立てる(src);
    expect(知らせ.filter((n) => n.message.includes("体験の道筋の欄がありません")), "二重に伝えている").toEqual([]);
    expect(
      知らせ.some((n) => n.message.includes("場所 (体験の道筋の欄)")),
      "放射の図の知らせから落ちている",
    ).toBe(true);
  });
});
