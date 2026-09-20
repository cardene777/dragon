/*
 * 流れ図で書いた端どおりに繋ぐ書き方を、実装が持つ条件から導いて案内する (#2374)。
 *
 * 流れ図は箱を書いた順に鎖状に繋ぐため、`A -> C` と書いても `A -> B` と `B -> C` になる。
 * この形は #1269 で知らせるようにした。
 *
 * 判定 (`鎖でつなぐ形か`) は **3 つ** の書き方で鎖をやめるが、案内は手で並べた 2 つだった。
 * 動き (`animation:`) を書く経路が案内に無く、読み手はその道を知れない。
 */
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import { 鎖にしない書き方 } from "../src/compile/chain";
import { parseTextDslV05 } from "../src/v05/parser";

/** 鎖をやめる書き方。 一覧は `鎖にしない書き方` (実装が SSOT) から導き、本文だけここで持つ */
const 書き方: Record<string, string> = {
  動き: '\nanimation:\n  - step: "うごき" 1.2s\n    focus: [A]\n',
  向き: "\ndirection: 縦\n",
  縦列: "",
};

function 本文(足す: string, 箱: string = "  - A\n  - B\n  - C"): string {
  return `title: "とばす"
type: flow

actors:
${箱}

flow:
  - A -> C: "とばす"
${足す}`;
}

/** 縦列を書く形は箱の側に書くので、本文の作りが他と違う */
function 縦列の本文(): string {
  return `title: "とばす"
type: flow

lanes:
  main: { label: "まとめ" }

actors:
  - A: { lane: main }
  - B: { lane: main }
  - C: { lane: main }

flow:
  - A -> C: "とばす"
`;
}

type 結果 = { 矢印: string[]; 知: { kind: string; hint?: string }[] };

function 組む(src: string): 結果 {
  const p = parseTextDslV05(src);
  if (!p.ok) throw new Error(`読めない本文: ${p.errors.map((e) => e.message).join(" / ")}`);
  const 知: { kind: string; hint?: string }[] = [];
  const d = compileToCdl(p.doc, {
    onNotice: (n) => 知.push({ kind: n.kind, ...(n.hint === undefined ? {} : { hint: n.hint }) }),
  });
  return { 矢印: d.edges.map((e) => `${e.from}->${e.to}`), 知 };
}

describe("流れ図で書いた端を使う書き方を実装から導いて案内する (#2374)", () => {
  it("鎖をやめる書き方を走査できている (空振り防止)", () => {
    expect(鎖にしない書き方.length, "書き方を 1 件も拾えていない").toBeGreaterThan(0);
  });

  it("走査する書き方すべてに本文を用意している", () => {
    const 無い = 鎖にしない書き方.filter((x) => !(x.名 in 書き方)).map((x) => x.名);
    expect(無い, `書き方 ${鎖にしない書き方.length} 件`).toEqual([]);
  });

  it("どの書き方でも、書いた端どおりに繋がる", () => {
    const 繋がらない = 鎖にしない書き方
      .map((x) => ({
        名: x.名,
        結果: 組む(x.名 === "縦列" ? 縦列の本文() : 本文(書き方[x.名]!)),
      }))
      .filter(({ 結果 }) => !isDeepEqual(結果.矢印, ["a->c"]))
      .map(({ 名, 結果 }) => `${名}: ${結果.矢印.join(" / ")}`);
    expect(繋がらない, `書き方 ${鎖にしない書き方.length} 件`).toEqual([]);
  });

  it("どの書き方でも、端の知らせが出ない", () => {
    const 出た = 鎖にしない書き方
      .map((x) => ({
        名: x.名,
        知: 組む(x.名 === "縦列" ? 縦列の本文() : 本文(書き方[x.名]!)).知,
      }))
      .filter(({ 知 }) => 知.some((n) => n.kind === "flow-endpoint-not-honored"))
      .map(({ 名 }) => 名);
    expect(出た, `書き方 ${鎖にしない書き方.length} 件`).toEqual([]);
  });

  it("どれも書かない形では、端の知らせが出る (植え込み対照)", () => {
    // 判定を緩めすぎると、上の 2 件は何を書いても通る
    const 知 = 組む(本文("")).知;
    expect(知.map((n) => n.kind), "鎖の形で知らせが消えた").toContain("flow-endpoint-not-honored");
  });

  it("案内に、鎖をやめる書き方が全て出る", () => {
    /*
     * 案内を手で並べていると、条件を足した日に 1 つだけ漏れる
     * (実測 = 実装が 3 つ見るのに案内は 2 つだった)。
     */
    const hint = 組む(本文("")).知.find((n) => n.kind === "flow-endpoint-not-honored")?.hint ?? "";
    const 出ない = 鎖にしない書き方.filter((x) => !hint.includes(x.案内)).map((x) => x.名);
    expect(出ない, `書き方 ${鎖にしない書き方.length} 件 / 案内 "${hint}"`).toEqual([]);
  });
});

/** 配列の中身が同じか。 `isDeepStrictEqual` を使わずに済む小さな比べ */
function isDeepEqual(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}
