/**
 * 別の段にある部品の縦列の境目に、矢印の説明文が掛かったと数えないことの検証 (#1993)。
 *
 * 部品用の縦列は部品の位置と高さに固定される (#1990)。 描画側の検査 `lane-border-clearance` は
 * 説明文の横の範囲と縦列の横の範囲だけを比べており、縦列を「図の上下いっぱいの列」 として扱って
 * いたため、2 段目の説明文が 1 段目の縦列の境目に掛かったと数えられていた。 絵の上では 1 段目の
 * 縦列は 2 段目まで伸びておらず、何にも掛かっていない。
 *
 * | 組み立て | 誤りが出る並べ方 (部品 80 種) |
 * |---|---|
 * | #1992 の前 | 12 通り |
 * | #1992 の後 (描画側 0.64.0) | 51 通り |
 * | 描画側 0.64.1 (cdl#863) | 0 通り |
 *
 * 矢印に説明文を持つ部品は `edge-chain` の 1 種だけなので、2 段目はこれに固定して 1 段目の
 * 2 つ目を部品の全種類に入れ替える。
 */
import { describe, it, expect } from "vitest";
import { layout, visualValidateAll } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram } from "../src/index";
import { 部品の一覧を作る } from "../../../apps/playground-spa/src/lib/parts-catalog";
import * as 部品 from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";

const 一覧 = 部品の一覧を作る(Object.values(部品));
/** 部品の種類。 一覧は同じ部品を `parts-` で始まる名前でも引けるので、そちらを除く */
const 種類 = Object.keys(一覧)
  .filter((k) => !k.startsWith("parts-"))
  .sort();

/** 1 段目に 4 つ、2 段目に矢印の説明文を持つ `edge-chain` を置く。 `二` を入れ替えて数える */
const 本文 = (二の種類: string) =>
  `title: "製造ラインの設備と部品の繋がりを並べる"
type: flow

actors:
  - 一: { kind: state-indicator }
  - 二: { kind: ${二の種類} }
  - 三: { kind: state-indicator }
  - 四: { kind: thermometer }
  - 五: { kind: edge-chain }
`;

const 並べる図 = (二の種類: string) =>
  textDslToDiagram(本文(二の種類), { partsCatalog: 一覧 });

/**
 * 縦列の境目の指摘。 **重大度で絞らない** = 編集画面の位置関係の警告の帯は重大度を問わず全て出すので、
 * 誤り (`error`) だけを数えると帯に残る警告を見落とす
 */
const 境目の指摘 = (図: CdlDiagram) =>
  visualValidateAll([図], { profile: "catalog" })
    .reports.flatMap((r) => r.violations)
    .filter((v) => v.axis === "lane-border-clearance");

describe("別の段の部品の縦列の境目 (#1993)", () => {
  it("どの部品を並べても、別の段の縦列の境目の指摘が出ない", () => {
    expect(種類.length).toBeGreaterThan(0);
    const 出た: string[] = [];
    for (const kind of 種類) {
      if (境目の指摘(並べる図(kind)).length > 0) 出た.push(kind);
    }
    expect(出た, `別の段の縦列の境目の指摘が残っている部品 (${種類.length} 種中)`).toEqual([]);
  });

  it("並べた図は 2 段に分かれ、2 段目の部品が説明文付きの矢印を持つ (前提)", () => {
    // 前提が崩れると上の検査は「掛かりようがない図」 を数えるだけの空振りになる
    const 配置 = layout(並べる図("state-indicator"));
    const 部品の縦列 = 配置.lanes.filter((l) => l.posY !== undefined && l.posH !== undefined);
    expect(部品の縦列.length).toBeGreaterThan(0);
    const 段 = new Set(部品の縦列.map((l) => l.posY));
    expect(段.size, "部品の縦列が 1 段しかない").toBeGreaterThan(1);
    const 説明文 = 配置.edges.filter((e) => e.id.startsWith("五__") && (e.label ?? "") !== "");
    expect(説明文.length, "2 段目の部品が説明文付きの矢印を持たない").toBeGreaterThan(0);
  });

  it("同じ段に縦列を移すと、境目の指摘が出る (植え込み対照)", () => {
    const 図 = 並べる図("achievement");
    const 配置 = layout(図);
    const 説明文 = 配置.edges.find((e) => e.id === "五__e12");
    expect(説明文, "2 段目の説明文 五__e12 が無い").toBeDefined();
    const 縦列 = 配置.lanes.find((l) => l.id === "二__l");
    expect(縦列, "1 段目の縦列 二__l が無い").toBeDefined();
    // 前提 = 説明文は 二__l の境目の延長上にあり、縦には重なっていない
    const 境目 = [縦列!.x, 縦列!.x + 縦列!.width];
    const 端 = [説明文!.labelX - 40, 説明文!.labelX + 40];
    expect(
      境目.some((x) => 端[0]! < x && 端[1]! > x),
      "説明文が 二__l の境目の延長上に無い (植え込みの前提が崩れている)",
    ).toBe(true);
    expect(説明文!.labelY).toBeGreaterThan(縦列!.y + 縦列!.height);
    expect(境目の指摘(図)).toEqual([]);

    // 二__l を説明文の段まで下ろす。 縦に重なるので、境目に掛かったと数えられる
    const 移した: CdlDiagram = {
      ...図,
      lanes: 図.lanes.map((l) =>
        l.id === "二__l" ? { ...l, posY: 説明文!.labelY - 50, posH: 100 } : l,
      ),
    };
    const 指摘 = 境目の指摘(移した);
    expect(指摘.length).toBeGreaterThanOrEqual(1);
    expect(指摘.map((v) => v.detail).join("\n")).toContain('lane "二__l"');
  });
});
