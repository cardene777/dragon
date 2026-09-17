/**
 * C4 の図の見本が 3 つの段 (全体の見取り図 / 動かす単位 / 部品) を全て使うこと (#2135)。
 *
 * C4 の図は、箱の説明の先頭に書いた目印 (`L1` / `L2` / `L3`) で箱を段に分ける。 目印を
 * 書かない箱は全て「全体の見取り図」 に入る。 読み方そのものは組み立て側の検査が見ている。
 * ここで見るのは **カタログの見本がその読み方を使っているか**。
 *
 * 以前の見本は目印を 1 つも書かず、4 つの箱が 1 列に縦積みになっていた。 読み方の検査は
 * 手書きの記法で通るため、見本の不備は素通りした (#2131 と同じ形)。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram, jsonToDiagram } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";

import * as TextDsl from "@/topics/catalog/text-dsl.cdl";

const 記法 = TextDsl.sourceYaml__textDslC4;
const JSON記法 = TextDsl.sourceJson__textDslC4;

/** 縦列の見出しごとに、入った箱の題を並べる */
function 段ごとの箱(図: CdlDiagram): Record<string, string[]> {
  const 段: Record<string, string[]> = {};
  for (const lane of 図.lanes) {
    段[lane.label ?? lane.id] = 図.nodes.filter((n) => n.lane === lane.id).map((n) => n.title ?? n.id);
  }
  return 段;
}

describe("C4 の見本が 3 つの段を全て使う (#2135)", () => {
  it("縦列が 全体の見取り図 / 動かす単位 / 部品 の 3 本で、それぞれに箱が 2 つ以上入る", () => {
    const 段 = 段ごとの箱(textDslToDiagram(記法));
    expect(Object.keys(段)).toEqual(["全体の見取り図", "動かす単位", "部品"]);
    for (const [名, 箱] of Object.entries(段)) {
      expect(箱.length, `${名} の箱が 2 つ未満`).toBeGreaterThanOrEqual(2);
    }
  });

  it("JSON も同じ段に同じ箱が入る", () => {
    expect(段ごとの箱(jsonToDiagram(JSON.parse(JSON記法)))).toEqual(段ごとの箱(textDslToDiagram(記法)));
  });

  it("段をまたぐ「中を開く」 矢印が、上の段の箱から下の段の箱へ向かう", () => {
    const 図 = textDslToDiagram(記法);
    const 段の番号 = new Map(図.lanes.map((l, i) => [l.id, i]));
    const 箱の段 = new Map(図.nodes.map((n) => [n.id, 段の番号.get(n.lane)!]));
    const 開く = 図.edges.filter((e) => e.label === "中を開く");
    expect(開く.length, "「中を開く」 矢印が無い (見本の書き方が変わった)").toBe(2);
    for (const e of 開く) {
      expect(箱の段.get(e.to)! - 箱の段.get(e.from)!, `${e.id} が 1 つ下の段へ向かっていない`).toBe(1);
    }
  });

  it("目印を外すと縦列が 1 本に戻る (検査が空振りしていない)", () => {
    // 見本の不備 (目印を書かない) を再現し、上の検査が区別できることを確かめる
    const 目印なし = 記法.replace(/subtitle: "L[123] /g, 'subtitle: "');
    expect(目印なし, "目印を外せていない (置き換えが効いていない)").not.toMatch(/"L[123] /);
    expect(Object.keys(段ごとの箱(textDslToDiagram(目印なし)))).toEqual(["全体の見取り図"]);
  });
});
