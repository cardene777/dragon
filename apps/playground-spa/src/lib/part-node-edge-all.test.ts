import { describe, expect, it } from "vitest";
import { textDslToDiagram, type CompileNotice } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";

import { 部品の一覧を作る } from "@/lib/parts-catalog";
import * as 部品 from "@/topics/catalog/parts.cdl";

/**
 * 要素を 2 つ以上持つ部品は、どの要素にも矢印を繋げること (#2129)。
 *
 * 要素が 1 つの部品は矢印が自動でそこに付く。 2 つ以上ある部品は繋ぎ先を名指ししないと
 * 矢印が落ち、`part-edge-dropped` の知らせが出る (#1979)。
 *
 * ## なぜ部品ごとに数えるか
 *
 * 名指しの書き方を確かめていたのは #2125 の見本 1 枚だけで、**部品を足しても検査の対象が
 * 増えなかった**。 その 1 枚が使う部品 (3 層の棒) の要素の名前を変えなければ、他の部品の
 * 要素がどう壊れても落ちない。
 *
 * ここでは部品の一覧を走査して対象を導く。 要素を 2 つ以上持つ部品が増えれば、その部品も
 * 自動で検査される。
 *
 * ## 知らせは呼び出しの合図で受け取る
 *
 * 組み立てた図に `notices` の欄は無く、`onNotice` で渡ってくる。 図の欄を読む形で書くと
 * 常に空になり、知らせが何件出ていても通る検査になる (#2125 で実際に踏んだ)。
 */

const 一覧 = 部品の一覧を作る(Object.values(部品));

/** 部品の名前 (`parts-` を外した形) と図の組。 要素を 2 つ以上持つものだけ */
function 要素を選べる部品(): { 名: string; 図: CdlDiagram }[] {
  const out: { 名: string; 図: CdlDiagram }[] = [];
  for (const [鍵, 図] of Object.entries(一覧)) {
    // 一覧は「頭付き」 と「頭なし」 の 2 通りで引ける。 記法に書く形 (頭なし) だけを使う
    if (鍵.startsWith("parts-")) continue;
    if (図.nodes.length < 2) continue;
    out.push({ 名: 鍵, 図 });
  }
  return out.sort((a, b) => a.名.localeCompare(b.名));
}

const 対象 = 要素を選べる部品();

/** 部品を 1 枚置いて、その要素を名指しした矢印を 1 本引く記法 */
function 名指しの記法(部品名: string, 要素: string, 向き: "to" | "from"): string {
  const 矢印 =
    向き === "to"
      ? `  - 元 -> p: "繋ぐ" { toPartNode: ${要素} }`
      : `  - p -> 先: "繋ぐ" { fromPartNode: ${要素} }`;
  return [
    `title: "要素を名指しして繋ぐ"`,
    "type: swimlane",
    "",
    "actors:",
    `  - 元: { kind: card }`,
    `  - p: { kind: ${部品名}, phase: false }`,
    `  - 先: { kind: card }`,
    "",
    "flow:",
    矢印,
    "",
  ].join("\n");
}

/** 記法を組み立て、出た知らせと図を返す */
function 組み立てる(yaml: string): { 図: CdlDiagram; 知らせ: CompileNotice[] } {
  const 知らせ: CompileNotice[] = [];
  const 図 = textDslToDiagram(yaml, {
    partsCatalog: 一覧,
    onNotice: (n) => 知らせ.push(n),
  });
  return { 図, 知らせ };
}

describe("要素を 2 つ以上持つ部品は、どの要素にも繋げる (#2129)", () => {
  it("対象を実物から数えられている", () => {
    // 0 件なら以下の走査は 1 件も回らずに通る
    expect(対象.length, "要素を 2 つ以上持つ部品を 1 枚も数えられていない").toBeGreaterThan(10);
  });

  for (const { 名, 図 } of 対象) {
    it(`${名} の ${図.nodes.length} 要素すべてを繋ぎ先に指せる`, () => {
      const 落ちた: string[] = [];
      for (const n of 図.nodes) {
        const { 図: 組, 知らせ } = 組み立てる(名指しの記法(名, n.id, "to"));
        const 落ちる知らせ = 知らせ.filter((k) => k.kind === "part-edge-dropped");
        if (落ちる知らせ.length > 0) {
          落ちた.push(`${n.id}: ${落ちる知らせ.map((k) => k.message).join(" / ")}`);
          continue;
        }
        const 繋いだ先 = 組.edges.find((e) => e.from === "元")?.to;
        if (繋いだ先 !== `p__${n.id}`) {
          落ちた.push(`${n.id}: 繋ぎ先が p__${n.id} ではなく ${String(繋いだ先)}`);
        }
      }
      expect(落ちた, `${名} で繋げない要素がある`).toEqual([]);
    });

    it(`${名} の ${図.nodes.length} 要素すべてを繋ぎ元に指せる`, () => {
      const 落ちた: string[] = [];
      for (const n of 図.nodes) {
        const { 図: 組, 知らせ } = 組み立てる(名指しの記法(名, n.id, "from"));
        const 落ちる知らせ = 知らせ.filter((k) => k.kind === "part-edge-dropped");
        if (落ちる知らせ.length > 0) {
          落ちた.push(`${n.id}: ${落ちる知らせ.map((k) => k.message).join(" / ")}`);
          continue;
        }
        const 繋いだ元 = 組.edges.find((e) => e.to === "先")?.from;
        if (繋いだ元 !== `p__${n.id}`) {
          落ちた.push(`${n.id}: 繋ぎ元が p__${n.id} ではなく ${String(繋いだ元)}`);
        }
      }
      expect(落ちた, `${名} で繋げない要素がある`).toEqual([]);
    });
  }

  it("名指ししないと矢印が落ちる (検査が空振りしていない)", () => {
    // 上の検査が「知らせ 0 件」 を見るため、知らせが出る形も 1 つ確かめる
    const 名 = 対象[0]?.名;
    expect(名, "対象が無い").toBeDefined();
    const yaml = [
      `title: "名指ししない"`,
      "type: swimlane",
      "",
      "actors:",
      `  - 元: { kind: card }`,
      `  - p: { kind: ${名}, phase: false }`,
      "",
      "flow:",
      `  - 元 -> p: "繋ぐ"`,
      "",
    ].join("\n");
    const { 知らせ } = 組み立てる(yaml);
    expect(
      知らせ.map((k) => k.kind),
      "名指し無しでも知らせが出ない (判定が効いていない)",
    ).toContain("part-edge-dropped");
  });
});
