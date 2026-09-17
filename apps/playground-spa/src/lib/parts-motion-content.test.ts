import { describe, expect, it } from "vitest";
import { textDslToDiagram, type CompileNotice } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";

import { 部品の一覧を作る } from "@/lib/parts-catalog";
import * as 部品 from "@/topics/catalog/parts.cdl";
import * as 見本 from "@/topics/catalog/parts-motion.cdl";

/**
 * 「部品を繋いだまま動かす」 頁が教えていることを数える (#2125)。
 *
 * この頁が在るのは、繋ぎ方の頁 (`parts-in-box.cdl.ts`) が段を 1 つも持たず、部品の頁
 * (`parts.cdl.ts`) が矢印を 1 本も持たないため。 **どちらか片方に戻ったら落とす** のが本 file の役目で、
 * 見本の題や本文が変わっても落ちないように、数えるのは中身の性質だけにする。
 *
 * 数える性質は 4 つ。
 *
 * | 性質 | なぜ要るか |
 * |---|---|
 * | 矢印と段を両方持つ | 片方だけなら既存の 2 頁と同じで、この頁が在る意味が消える |
 * | 宿主の段が部品の中の値を動かす | 部品が自分の段で動くだけなら「繋いだ先へ渡る」 が見えない |
 * | 要素を名指しして繋ぐ | 要素を 2 つ以上持つ部品の繋ぎ方はこの書き方でしか見せられない |
 * | 知らせが 0 件 | 見本が書き方の手本になるため、警告が出る形を置かない |
 *
 * **知らせは呼び出しの合図で受け取る**。 組み立てた図に `notices` の欄は無く、
 * `onNotice` で渡ってくる (`packages/dragon/src/index.ts`)。 図の欄を読む形で書くと
 * 常に空になり、知らせが何件出ていても通る検査になる。
 */

const 一覧 = 部品の一覧を作る(Object.values(部品));

/** `sourceYaml__<key>` と、それに対応する図の export を組にする */
function 見本たち(): { key: string; yaml: string; 図: CdlDiagram }[] {
  const out: { key: string; yaml: string; 図: CdlDiagram }[] = [];
  for (const [k, v] of Object.entries(見本)) {
    if (!k.startsWith("sourceYaml__") || typeof v !== "string") continue;
    const key = k.slice("sourceYaml__".length);
    const 図 = (見本 as Record<string, unknown>)[key];
    if (!図 || typeof 図 !== "object") throw new Error(`${key} に対応する図の export が無い`);
    out.push({ key, yaml: v, 図: 図 as CdlDiagram });
  }
  return out;
}

/** 宿主の段が動かす、部品の中の値の名前 (`{部品の名前}__{値の名前}`) */
function 部品の値を動かす段(図: CdlDiagram): string[] {
  return 図.phases.flatMap((p) => (p.tweens ?? []).map((t) => t.stateId).filter((s) => s.includes("__")));
}

const 一覧の見本 = 見本たち();

describe("部品を繋いだまま動かす頁 (#2125)", () => {
  it("部品の頁の最後に並び、5 つの切替を持つ", async () => {
    const { loadPartsItems } = await import("@/lib/catalog-items");
    const items = await loadPartsItems();
    // 並びは「部品そのもの → 箱として置く → 繋いで動かす」。 置き方を読んでから動かし方を読む
    expect(items.at(-1)?.id).toBe(見本.partsMotion.id);
    expect(items.at(-1)?.patterns?.map((p) => p.名)).toEqual([
      "流れに沿って動かす",
      "要素ごとに繋ぐ",
      "分ける",
      "集める",
      "部品の段を残す",
    ]);
  });

  it("見本が 5 件ある", () => {
    // 空振り防止。 0 件なら下の it.each が 1 件も走らず、全部通ったように見える
    expect(一覧の見本.map((x) => x.key)).toHaveLength(5);
  });

  it.each(一覧の見本)("$key は矢印と段を両方持つ", ({ 図 }) => {
    expect(図.edges.length, "矢印が 1 本も無い").toBeGreaterThan(0);
    expect(図.phases.length, "段が 2 つ以上無い").toBeGreaterThan(1);
  });

  it.each(一覧の見本)("$key は宿主の段が部品の中の値を動かす", ({ 図 }) => {
    expect(部品の値を動かす段(図), "宿主の段が部品の値を 1 つも動かしていない").not.toHaveLength(0);
  });

  it.each(一覧の見本)("$key は動かす値が実在する", ({ 図 }) => {
    const 実在 = new Set(図.states.map((s) => s.id));
    const 無い = 部品の値を動かす段(図).filter((s) => !実在.has(s));
    expect(無い, "段が指す値が図に無い (部品の名前か値の名前の綴り違い)").toEqual([]);
  });

  it.each(一覧の見本)("$key は組み立ての知らせが 0 件", ({ yaml }) => {
    const 知らせ: CompileNotice[] = [];
    textDslToDiagram(yaml, { partsCatalog: 一覧, onNotice: (n) => 知らせ.push(n) });
    expect(知らせ.map((n) => `${n.kind} ${n.message}`)).toEqual([]);
  });

  it("要素を名指しして繋ぐ見本がある", () => {
    const 名指し = 一覧の見本.filter(
      (x) => x.yaml.includes("toPartNode") && x.yaml.includes("fromPartNode"),
    );
    expect(名指し.map((x) => x.key), "toPartNode と fromPartNode を両方書いた見本が無い").not.toHaveLength(0);
  });

  it("名指しした矢印が部品の中の要素に繋がる", () => {
    const 名指し = 一覧の見本.find(
      (x) => x.yaml.includes("toPartNode") && x.yaml.includes("fromPartNode"),
    );
    if (!名指し) throw new Error("名指しの見本が無い (前の検査が落ちているはず)");
    // 仮の箱のままなら端は `stock` になる。 繋ぎ直されていれば `stock__topL` の形になる
    const 端 = 名指し.図.edges.flatMap((e) => [e.from, e.to]);
    expect(端.filter((n) => n.includes("__")), "部品の中の要素に繋がっていない").not.toHaveLength(0);
  });
});
