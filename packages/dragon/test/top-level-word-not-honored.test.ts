/**
 * 最上位の語が効かない図種に書かれた時に伝える (#2655 / #2657)。
 *
 * 図の型を語へ移すと、**その語を読む図種と読まない図種**が生まれる。 読まない図種に
 * 書かれた語を黙って捨てると、書き手には「書いたのに何も変わらない」 だけが残る。
 *
 * 向きの語 (`direction:`、#1494) が先にこの形を持っており、並べ替え (`order:`) と
 * 形 (`shape:`) も同じ形にした。
 *
 * ## 何を見るか
 *
 * | 見ること | 落ちる形 |
 * |---|---|
 * | 読まない図種に書くと知らせが 1 件出る | 黙って捨てている |
 * | 知らせが書いた行を指す | どこを直すか分からない |
 * | 知らせが書ける図種を案内する | 直し方が分からない |
 * | 読む図種に書くと知らせが 0 件 | 効いている形まで咎めている |
 * | 書かない図では知らせが 0 件 | 書いていない語を咎めている |
 *
 * **効かない形は図も変えない**。 知らせだけ出して図が変わると、捨てたつもりの語が
 * どこかで効いていることになる。 語を外した図と同じになることまで見る。
 */
import { describe, it, expect } from "vitest";

import { textDslToDiagram } from "../src";
import type { CompileNotice } from "../src/compile";

/** その記法を組み立てて、指定した種類の知らせだけを取り出す */
const 知らせ = (src: string, kind: string): CompileNotice[] => {
  const 出た: CompileNotice[] = [];
  textDslToDiagram(src, { onNotice: (n) => 出た.push(n) });
  return 出た.filter((n) => n.kind === kind);
};

/** 知らせを黙らせて図だけを取る */
const 図 = (src: string): unknown => {
  const d = textDslToDiagram(src, { onNotice: () => {} });
  // 図の id は題から作るので、比べる前に落とす必要は無い (題を揃えて呼ぶ)
  return JSON.parse(JSON.stringify(d)) as unknown;
};

describe("並べ替えの語が効かない図種で知らせる (#2655)", () => {
  const 効かない図 = `title: "t"\ntype: flow\norder: 種類\n\nactors:\n  - A: { kind: eoa }\n  - B: { kind: contract }\n\nflow:\n  - A -> B: "x"\n`;
  const 語を外した図 = `title: "t"\ntype: flow\n\nactors:\n  - A: { kind: eoa }\n  - B: { kind: contract }\n\nflow:\n  - A -> B: "x"\n`;

  it("読まない図種に書くと知らせが 1 件出る", () => {
    expect(知らせ(効かない図, "order-not-honored")).toHaveLength(1);
  });

  it("知らせが書いた行を指す", () => {
    expect(知らせ(効かない図, "order-not-honored")[0]!.line, "`order:` の行").toBe(3);
  });

  it("知らせが書ける図種を案内する", () => {
    expect(知らせ(効かない図, "order-not-honored")[0]!.hint).toContain("sequence");
  });

  it("読む図種に書くと知らせが出ない (効いている形を咎めない)", () => {
    const 効く図 = `title: "t"\ntype: sequence\norder: 種類\n\nactors:\n  - A: { kind: contract }\n  - B: { kind: eoa }\n\nflow:\n  - B -> A: "x"\n`;
    expect(知らせ(効く図, "order-not-honored")).toHaveLength(0);
  });

  it("書かない図では知らせが出ない", () => {
    expect(知らせ(語を外した図, "order-not-honored")).toHaveLength(0);
  });

  it("効かない語は図を変えない", () => {
    // 知らせだけ出して図が変わると、捨てたつもりの語がどこかで効いている
    expect(図(効かない図)).toEqual(図(語を外した図));
  });
});

describe("形の語が効かない図種で知らせる (#2657)", () => {
  const 効かない図 = `title: "t"\ntype: flow\nshape: pie\n\nactors:\n  - A\n  - B\n\nflow:\n  - A -> B: "x"\n`;
  const 語を外した図 = `title: "t"\ntype: flow\n\nactors:\n  - A\n  - B\n\nflow:\n  - A -> B: "x"\n`;

  it("読まない図種に書くと知らせが 1 件出る", () => {
    expect(知らせ(効かない図, "shape-not-honored")).toHaveLength(1);
  });

  it("知らせが書いた行を指す", () => {
    expect(知らせ(効かない図, "shape-not-honored")[0]!.line, "`shape:` の行").toBe(3);
  });

  it("知らせが書ける図種を案内する", () => {
    expect(知らせ(効かない図, "shape-not-honored")[0]!.hint).toContain("type: chart");
  });

  it("読む図種に書くと知らせが出ない (効いている形を咎めない)", () => {
    const 効く図 = `title: "t"\ntype: chart\nshape: pie\n\nactors:\n  - A: "45"\n  - B: "55"\n`;
    expect(知らせ(効く図, "shape-not-honored")).toHaveLength(0);
  });

  it("書かない図では知らせが出ない", () => {
    expect(知らせ(語を外した図, "shape-not-honored")).toHaveLength(0);
  });

  it("効かない語は図を変えない", () => {
    expect(図(効かない図)).toEqual(図(語を外した図));
  });

  it("古い綴りで書いた図には出ない (読み替えが型と形を揃える)", () => {
    // `type: pie` は 数を描く図 + 円の形 に読み替わる。 読み替えた先は形を読む図種なので
    // 咎める相手ではない = 読み替えが型だけを入れて形を落とすと、ここが落ちる
    const 古い綴り = `title: "t"\ntype: pie\n\nactors:\n  - A: "45"\n  - B: "55"\n`;
    expect(知らせ(古い綴り, "shape-not-honored")).toHaveLength(0);
  });
});

describe("形を書かない数を描く図は棒になる (#2657)", () => {
  it("形を書かない図が棒の箱を作る", () => {
    const d = textDslToDiagram(`title: "t"\ntype: chart\n\nactors:\n  - A: "45"\n  - B: "55"\n`);
    expect(d.nodes.map((n) => String(n.kind))).toEqual(["chart-bar"]);
  });

  it("形に棒を書いた図と同じになる", () => {
    // 書かない時の形を変えた日に、ここが「同じ」 を主張し続けないよう図ごと比べる
    expect(図(`title: "t"\ntype: chart\n\nactors:\n  - A: "45"\n`)).toEqual(
      図(`title: "t"\ntype: chart\nshape: bar\n\nactors:\n  - A: "45"\n`),
    );
  });
});
