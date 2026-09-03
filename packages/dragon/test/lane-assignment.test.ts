import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05";
import { compileToCdl, type CompileNotice } from "../src/compile";

/**
 * 箱を書いた縦列へ入れられることの検証 (#1263)。
 *
 * 見本 4 件 (topology / infrastructure / flowchart / network) は「縦列が 2-4 本あり、
 * 箱がそこに 1-3 個ずつ散る」 形をしている。 記法には縦列を選ぶ書き方が無く、
 * 全部が 1 列に入っていた (実測 = presetTopology は Client に 1 個 / AWS に 3 個)。
 *
 * #1246 で「縦列は図種が決めるため箱からは選べない」 と決めたが、その根拠 (縦列が図種の
 * 骨格) は **順序図には当てはまるが topology には当てはまらない**。 前者は縦列がそのまま
 * 生命線として描かれ、後者の縦列は箱を並べるための入れ物にすぎない。
 *
 * そこで図種ごとに分けた。
 */

function 組み立てる(src: string) {
  const r = parseTextDslV05(src);
  if (!r.ok) throw new Error(r.errors.map((e) => `L${e.line}: ${e.message}`).join("\n"));
  const 知らせ: CompileNotice[] = [];
  return { 図: compileToCdl(r.doc, { onNotice: (n) => 知らせ.push(n) }), 知らせ };
}

const 記法 = (actors: string, type = "topology", 動き = true) =>
  `title: "T"\ntype: ${type}\n\nactors:\n${actors}\nflow:\n  - A -> B: "x"\n` +
  (動き ? `\nanimation:\n  - step: "s1" 1s\n    focus: [A]\n    body: "b"\n` : "");

const 三人 = "  - A: { lane: left }\n  - B: { lane: right }\n  - C: { lane: right }";

const 配置 = (src: string) => {
  const { 図 } = 組み立てる(src);
  return {
    縦列: (図.lanes ?? []).map((l) => l.id),
    箱: 図.nodes.map((n) => [n.id, n.lane, n.stack] as const),
  };
};

describe("箱を書いた縦列へ入れられる (#1263)", () => {
  it("書いた縦列に入る", () => {
    expect(配置(記法(三人)).箱).toEqual([
      ["a", "left", 0],
      ["b", "right", 0],
      ["c", "right", 1],
    ]);
  });

  it("縦列は書かれた順に作る", () => {
    // 並び順が入れ替わると図の左右が変わる
    expect(配置(記法(三人)).縦列).toEqual(["left", "right"]);
  });

  it("同じ縦列の箱は書かれた順に積む", () => {
    const 逆 = "  - A: { lane: left }\n  - C: { lane: right }\n  - B: { lane: right }";
    expect(配置(記法(逆)).箱.map(([id, , stack]) => [id, stack])).toEqual([
      ["a", 0],
      ["c", 0],
      ["b", 1],
    ]);
  });

  it("効く形では知らせない", () => {
    expect(組み立てる(記法(三人)).知らせ.filter((n) => n.kind === "lane-not-honored")).toEqual([]);
  });

  // 縦列を「箱を並べるための入れ物」 として使う 3 図種で効く
  for (const type of ["topology", "flow", "swimlane"]) {
    it(`${type} で効く (動きあり)`, () => {
      expect(配置(記法(三人, type)).縦列).toEqual(["left", "right"]);
    });

    it(`${type} で効く (動きなし)`, () => {
      // **動く図だけで効かせると、同じ記法でも静止図では指定が黙って消える**
      // (実測 = 縦列 3 本のはずが 1 本になり、知らせも出なかった)
      expect(配置(記法(三人, type, false)).縦列).toEqual(["left", "right"]);
    });

    it(`${type} は動きの有無で箱の行き先が変わらない`, () => {
      expect(配置(記法(三人, type, false)).箱).toEqual(配置(記法(三人, type)).箱);
    });
  }
});

describe("縦列が骨格の図種では効かない (陰性対照)", () => {
  // 順序図と solidity は縦列がそのまま生命線として描かれる。 選ばせると図が壊れる
  for (const type of ["sequence", "solidity"]) {
    it(`${type} では書いた縦列に入らない`, () => {
      const 縦列 = 配置(記法(三人, type)).縦列;
      expect(縦列, "書いた縦列が作られている").not.toContain("left");
    });

    it(`${type} では効かないことを伝える`, () => {
      const 出た = 組み立てる(記法(三人, type)).知らせ.filter((n) => n.kind === "lane-not-honored");
      expect(出た.length, "黙って捨てている").toBeGreaterThan(0);
      expect(出た[0]?.message).toContain("効きません");
    });
  }

  /*
   * **`er` は対象から外した** (#1571)。
   *
   * 変更前 = 1 縦列 1 箱が読み方そのものとみなし、書いた縦列に入れなかった。
   * 変更後 = 全ての箱が書けば書いたとおりに置く。
   *
   * 外したのは、1 列に並べると関係を 4 本持つ実体で 2 本が隣を飛び越すため
   * (意匠帳が 4 通りを実測、1 列は縦横比 7.0 / 最長の線 4068、格子は 3.5 / 836)。
   * 置ける形が `er-lane.test.ts` にある。
   *
   * 順序図と solidity は縦列がそのまま生命線として描かれるので、対象のまま残す。
   */
});

describe("書き方が混ざった形を伝える", () => {
  // 書かなかった箱の行き先を決める規則が要るが、既定の縦列に集めても自分の縦列を作っても
  // 書いた人の意図と一致する保証が無い
  const 混在 = "  - A: { lane: left }\n  - B: { lane: right }\n  - C";

  it("全部に書けと伝える", () => {
    const 出た = 組み立てる(記法(混在)).知らせ.filter((n) => n.kind === "lane-not-honored");
    expect(出た).toHaveLength(1);
    expect(出た[0]?.message).toContain("全ての箱に書きます");
  });

  it("書いていない箱の名前を挙げる", () => {
    const 出た = 組み立てる(記法(混在)).知らせ.filter((n) => n.kind === "lane-not-honored");
    expect(出た[0]?.message, "どれを直すか分からない").toContain("C");
  });

  it("混ざった形では従来の並びになる", () => {
    // 中途半端に一部だけ入れると、書いた人の意図と違う図が黙って出る
    expect(配置(記法(混在)).縦列, "書いた縦列に入れてしまっている").toEqual(["main"]);
  });

  it("1 つも書いていなければ知らせない (陰性対照)", () => {
    const なし = "  - A\n  - B\n  - C";
    expect(組み立てる(記法(なし)).知らせ.filter((n) => n.kind === "lane-not-honored")).toEqual([]);
  });

  // **知らせと配置は動きの有無で食い違ってはいけない** (Round 2 の指摘)。
  // 静止図で配置だけ直しても、知らせが動く図の判定のままだと
  // 「効いているのに知らせが出る」 / 「効いていないのに黙る」 が起きる
  describe("動きなしでも知らせと配置が一致する", () => {
    const 知らせ = (actors: string, type: string) =>
      組み立てる(記法(actors, type, false)).知らせ.filter((n) => n.kind === "lane-not-honored");
    const 従来の縦列: Record<string, string[]> = {
      topology: ["main"],
      flow: ["flow"],
      swimlane: ["a", "b", "c"],
    };

    for (const type of ["topology", "flow", "swimlane"]) {
      it(`${type} は全部書けば知らせず、書いた縦列に入る`, () => {
        expect(知らせ(三人, type), "効く形に知らせが出ている").toEqual([]);
        expect(配置(記法(三人, type, false)).縦列).toEqual(["left", "right"]);
      });

      it(`${type} は混ざれば知らせ、従来の並びになる`, () => {
        const 混在 = "  - A: { lane: left }\n  - B: { lane: right }\n  - C";
        const 出た = 知らせ(混在, type);
        expect(出た, "黙って捨てている").toHaveLength(1);
        expect(出た[0]?.message).toContain("全ての箱に書きます");
        expect(配置(記法(混在, type, false)).縦列, "従来の並びから変わっている").toEqual(
          従来の縦列[type],
        );
      });

      it(`${type} は 1 つも書かなければ知らせない`, () => {
        expect(知らせ("  - A\n  - B\n  - C", type)).toEqual([]);
      });
    }
  });
});

describe("見本 (parts) は判定から外す", () => {
  // 見本の縦列は張替え先の指定で、箱を並べる話ではない
  it("見本だけが縦列を書いていない形でも効く", () => {
    const src = `title: "T"\ntype: topology\n\nactors:\n  - A: { lane: left }\n  - B: { lane: right }\n` +
      `  - g: { kind: arc-gauge }\nflow:\n  - A -> B: "x"\n\n` +
      `animation:\n  - step: "s1" 1s\n    focus: [A]\n    body: "b"\n`;
    expect(配置(src).縦列, "見本のせいで混在と判定されている").toEqual(["left", "right"]);
  });
});
