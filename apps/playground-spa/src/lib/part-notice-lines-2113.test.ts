/**
 * 編集画面の本文欄で、部品の行を抜いて組み立てても知らせが元の本文の行を指すことの検証 (#2113)。
 *
 * 本文欄は部品の行を抜いた本文を組み立てる (`図と重ねる部品に分ける`)。 組み立てが返す行番号は
 * 抜いた後の本文の座標で、矢印の行は元の本文へ戻していた (#998) が、知らせの行は戻していなかった。
 * 部品の行より後ろの行の知らせが 1 行ずつ手前を指していた (実測 = 11 行目の知らせが `L10`)。
 *
 * 一覧に無い部品の名前の知らせ (`part-not-found`) は抜かれない行に出るため、同じずれを受ける。
 * 部品は編集画面と同じく部品の頁の見本から読み込む。
 */
import { describe, expect, it } from "vitest";
import { textDslToDiagram, type CompileNotice } from "@cardenelabs/dragon";
import { loadPartsItems } from "./catalog-items";
import { 部品の一覧を作る, 部品の図か } from "./parts-catalog";
import { 図と重ねる部品に分ける } from "./overlay-dsl";
import { 知らせの行を元の本文へ戻す } from "./auto-fix-dsl";

/** 編集画面の本文欄と同じ手順で組み立て、知らせを元の本文の行へ戻して返す */
async function 本文欄で組み立てる(src: string, 部品を読み込んだ: boolean) {
  const 項目 = 部品を読み込んだ ? (await loadPartsItems()).filter((i) => 部品の図か(i.id)) : [];
  const 一覧 = 部品の一覧を作る(項目.map((i) => i.diagram));
  const もとの = console.warn;
  console.warn = () => {};
  try {
    const 分けた = 図と重ねる部品に分ける(src, 一覧, 項目, (本文) => {
      const notices: CompileNotice[] = [];
      const diagram = textDslToDiagram(本文, { partsCatalog: 一覧, onNotice: (n) => notices.push(n) });
      return { diagram, notices };
    });
    return { 分けた, 知らせ: 知らせの行を元の本文へ戻す(分けた.built.notices, 分けた.lineMap) };
  } finally {
    console.warn = もとの;
  }
}

/** `印` を含む最初の行の番号 (1 始まり) */
const 行番号 = (src: string, 印: string): number => src.split("\n").findIndex((l) => l.includes(印)) + 1;

const 本文 = [
  'title: "t"',
  "type: flow",
  "",
  "actors:",
  "  - 印: state-indicator",
  "  - 受付: { kind: state-indicatr }",
  "  - 開始: evnet",
  "  - 処理: function",
  "",
  "flow:",
  '  - 処理 -> 無い箱: "渡す"',
].join("\n");

describe("部品の行を抜いて組み立てても、知らせが元の本文の行を指す (#2113)", () => {
  it("部品の行を抜いている (抜かないと行番号のずれが起きず、検査が空振りする)", async () => {
    const { 分けた } = await 本文欄で組み立てる(本文, true);
    expect(分けた.parts.map((p) => p.id)).toEqual(["印"]);
    expect(分けた.lineMap).not.toEqual(本文.split("\n").map((_, i) => i + 1));
  });

  it("一覧に無い名前の知らせと、部品の行より後ろの矢印の知らせが、書いた行を指す", async () => {
    const { 知らせ } = await 本文欄で組み立てる(本文, true);
    expect(知らせ.map((n) => [n.kind, n.actor, n.line])).toEqual(
      expect.arrayContaining([
        ["part-not-found", "受付", 行番号(本文, "受付")],
        ["part-not-found", "開始", 行番号(本文, "開始")],
        ["flow-actor-missing", "無い箱", 行番号(本文, "無い箱")],
      ]),
    );
    expect(知らせ.filter((n) => n.kind === "part-not-found")).toHaveLength(2);
  });

  it("部品を読み込む前 (空の一覧) の組み立てでは、一覧に無い名前を知らせない", async () => {
    const { 知らせ } = await 本文欄で組み立てる(本文, false);
    expect(知らせ.filter((n) => n.kind === "part-not-found")).toEqual([]);
  });
});

describe("知らせの行を元の本文へ戻す (#2113)", () => {
  const 知らせ = (line: number): CompileNotice => ({ kind: "flow-actor-missing", actor: "a", line, message: "m" });

  it("表にある行は元の本文の行へ戻し、行を持たない知らせはそのまま残す", () => {
    expect(知らせの行を元の本文へ戻す([知らせ(1), 知らせ(3), 知らせ(0)], [1, 2, 4]).map((n) => n.line)).toEqual([1, 4, 0]);
  });

  it("表に無い行は行を外して残す (知らせは捨てない)", () => {
    const 戻した = 知らせの行を元の本文へ戻す([知らせ(9)], [1, 2, 4]);
    expect(戻した.map((n) => [n.line, n.message])).toEqual([[0, "m"]]);
  });

  it("渡した知らせを書き換えない", () => {
    const 元 = [知らせ(3)];
    知らせの行を元の本文へ戻す(元, [1, 2, 4]);
    expect(元[0]!.line).toBe(3);
  });
});
