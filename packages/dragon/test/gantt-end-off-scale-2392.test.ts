/*
 * ガントチャートの箱に書いた終わる時期が、目盛りに無い語だと黙って消えていた (#2392)。
 *
 * 目盛りは箱に書いた時期 (`value:`) から **書かれた順に** 作る。 終わる時期はその目盛りと
 * 突き合わせるので、どの箱も書いていない語は位置を持たない。 始まりと同じに倒すだけで
 * 知らせが出ず、書いた人には「書いたのに 1 コマのまま」 としか見えなかった。
 *
 * 隣の分岐 (始まりより前の語) は既に伝えていた = 同じ関数の中で、片方だけが黙っていた。
 */
import { describe, expect, it } from "vitest";
import { compileToCdl, type CompileNotice } from "../src/compile";
import { parseTextDslV05 } from "../src/v05";

function 組む(src: string): { 知: CompileNotice[]; 図: string; 帯: 帯[] } {
  const p = parseTextDslV05(src);
  if (!p.ok) throw new Error(`読めない本文: ${p.errors.map((e) => e.message).join(" / ")}`);
  const 知: CompileNotice[] = [];
  const 図 = compileToCdl(p.doc, { onNotice: (n) => 知.push(n) });
  return { 知, 図: JSON.stringify(図), 帯: (図.nodes[0] as { ganttData?: 帯[] }).ganttData ?? [] };
}

type 帯 = { id: string; startIdx: number | string; endIdx: number | string; endLabel: string };

/** 目盛りを 3 つ持つガントチャート。 測る箱 `実装` を先頭にも末尾にも置かない */
const 工程 = (欄 = "") =>
  `title: "し"
type: gantt

actors:
  - 設計: { value: "Q1" }
  - 実装: { value: "Q2"${欄} }
  - 検証: { value: "Q3" }
`;

/** 帯を伸ばす側の知らせだけを取る */
const 終わりの知らせ = (src: string): CompileNotice[] =>
  組む(src).知.filter((n) => n.kind === "chart-value-unreadable" && n.message.includes("終わり"));

describe("ガントチャートの終わる時期が目盛りに無い時に伝える (#2392)", () => {
  it("目盛りにある語では鳴らず、帯が伸びる", () => {
    const 知 = 終わりの知らせ(工程(', end: "Q3"'));
    expect(知.map((n) => n.message), "目盛りにある語で鳴っている").toEqual([]);
    const 帯 = 組む(工程(', end: "Q3"')).帯[1];
    expect(帯?.endIdx, "帯が伸びていない (空振り)").toBe(2);
    expect(帯?.endLabel, "終わりの字が変わっていない").toBe("Q3");
  });

  it("目盛りに無い語では 1 件鳴り、帯は伸びない", () => {
    /*
     * **2 通りを見る** = 時期の形をした語 (`Q9`) と、数の語 (`20`)。
     * 片方だけだと「時期の形かどうか」 で分ける実装に変わっても通る。
     */
    const 違う: string[] = [];
    for (const 語 of ["Q9", "20", "来年度"]) {
      const 知 = 終わりの知らせ(工程(`, end: "${語}"`));
      if (知.length !== 1) 違う.push(`${語}: ${知.length} 件`);
      const 帯 = 組む(工程(`, end: "${語}"`)).帯[1];
      if (帯?.endIdx !== 1) 違う.push(`${語}: 帯が ${String(帯?.endIdx)} まで伸びている`);
    }
    expect(違う, "語 3 通り").toEqual([]);
  });

  it("知らせの文がその図の目盛りを並べる", () => {
    /*
     * 目盛りは図ごとに変わるので、**固定の一覧を文に書かない**。
     * 目盛りを 2 つにした図では 2 つだけが並び、書いていない語は並ばないことを見る。
     */
    const 二つ = `title: "し"
type: gantt

actors:
  - 設計: { value: "Q1" }
  - 実装: { value: "Q2", end: "Q9" }
`;
    const 文 = 終わりの知らせ(二つ)[0]?.message ?? "";
    expect(文, `文 "${文}"`).toContain("Q1");
    expect(文, `文 "${文}"`).toContain("Q2");
    expect(文, `文 "${文}" に書いていない目盛りが並ぶ`).not.toContain("Q3");
  });

  it("終わる時期を書かない箱では鳴らない (陰性対照)", () => {
    expect(終わりの知らせ(工程()).map((n) => n.message)).toEqual([]);
  });

  it("始まりより前の語は今までどおり別の知らせで伝える", () => {
    /*
     * 同じ関数の別の分岐。 目盛りに無い語の知らせを足したことで、こちらが消えたり
     * 2 件並んだりしないことを見る。
     */
    const 逆 = `title: "し"
type: gantt

actors:
  - 設計: { value: "Q1" }
  - 実装: { value: "Q3", end: "Q1" }
`;
    const 知 = 組む(逆).知;
    expect(
      知.filter((n) => n.kind === "gantt-end-before-start").length,
      "始まりより前の知らせが消えている",
    ).toBe(1);
    expect(終わりの知らせ(逆).map((n) => n.message), "目盛りに無い側も鳴っている").toEqual([]);
  });

  it("同じ行に知らせが 2 件以上並ばない", () => {
    const 並んだ: string[] = [];
    for (const 語 of ["Q9", "20"]) {
      const 行ごと = new Map<number, string[]>();
      for (const n of 組む(工程(`, end: "${語}"`)).知) {
        行ごと.set(n.line, [...(行ごと.get(n.line) ?? []), n.kind]);
      }
      for (const [行, 種] of 行ごと) {
        if (種.length > 1) 並んだ.push(`${語}: 行 ${行} に ${種.join(" + ")}`);
      }
    }
    expect(並んだ, "語 2 通り").toEqual([]);
  });

  it("知らせはその箱を書いた行を指す", () => {
    const 知 = 終わりの知らせ(工程(', end: "Q9"'))[0];
    const p = parseTextDslV05(工程(', end: "Q9"'));
    const 行 = p.ok ? (p.doc.actors[1]?.pos?.line ?? -1) : -1;
    expect(行, "測る箱の行を取れていない (空振り)").toBeGreaterThan(0);
    expect(知?.line, `知らせが指す行 ${String(知?.line)}`).toBe(行);
  });
});
