/**
 * 見本 1 件ごとの英語が実物ぶん揃っていることの検証 (#2461)。
 *
 * **母数は実物の見本から導く**。 表の側だけを見ると、見本を足した日に表が取り残されても
 * 緑のまま通る。 カタログを実際に読み込んで、説明と変種の名前が 2 言語とも埋まっているかを見る。
 *
 * 英語が無い時に日本語へ落とす経路を持たないので、抜けはそのまま空欄として画面に出る。
 * ここが落ちることが唯一の歯止めになる。
 */
import { describe, expect, it } from "vitest";
import {
  CATALOG_ITEMS,
  loadPartsItems,
  itemSubtitle,
  patternName,
  type CatalogItem,
} from "./catalog-items";
import { PATTERN_NAME_EN } from "./catalog-item-en";
import { 日本語を含む } from "./catalog-phase-en";

async function 全部の見本(): Promise<CatalogItem[]> {
  return [...Object.values(CATALOG_ITEMS).flat(), ...(await loadPartsItems())];
}

describe("カタログの見本の英語 (#2461)", () => {
  it("見本と変種を走査できる", async () => {
    const 見本 = await 全部の見本();
    const 変種 = 見本.flatMap((x) => x.patterns ?? []);
    expect(見本.length, "見本を 1 件も読めていない (検査が空振りしている)").toBeGreaterThan(400);
    expect(変種.length, "変種を 1 件も読めていない (検査が空振りしている)").toBeGreaterThan(100);
  });

  it("英語の説明に日本語が残っていない", async () => {
    const 残る = (await 全部の見本())
      .filter((x) => 日本語を含む(x.subtitleEn))
      .map((x) => `${x.title}: ${x.subtitleEn.slice(0, 60)}`);
    expect(
      残る,
      `英語の説明に日本語が残る (直す場所 = catalog-item-en.ts の ITEM_SUBTITLE_EN):\n${残る.join("\n")}`,
    ).toEqual([]);
  });

  it("日本語の名前を持つ変種は英語の名前も持つ", async () => {
    const 抜け = (await 全部の見本())
      .flatMap((x) => (x.patterns ?? []).map((p) => ({ 見本: x.title, p })))
      .filter((v) => 日本語を含む(v.p.名) && v.p.名En.trim() === "")
      .map((v) => `${v.見本}: ${v.p.名}`);
    expect(
      抜け,
      `英語の名前が無い変種 (書く場所 = catalog-item-en.ts の PATTERN_NAME_EN):\n${抜け.join("\n")}`,
    ).toEqual([]);
  });

  it("英語の名前に日本語が残っていない", async () => {
    const 残る = (await 全部の見本())
      .flatMap((x) => x.patterns ?? [])
      .filter((p) => 日本語を含む(p.名En))
      .map((p) => `${p.鍵}: ${p.名En}`);
    expect(
      残る,
      `英語の名前に日本語が残る (直す場所 = catalog-item-en.ts の PATTERN_NAME_EN):\n${残る.join("\n")}`,
    ).toEqual([]);
  });

  it("引く側が言語を見ている", async () => {
    const 見本 = (await 全部の見本()).find((x) => x.subtitleEn !== "")!;
    expect(itemSubtitle(見本, "ja")).toBe(見本.subtitle);
    expect(itemSubtitle(見本, "en")).toBe(見本.subtitleEn);
    const p = (await 全部の見本()).flatMap((x) => x.patterns ?? []).find((x) => x.名En !== "")!;
    expect(patternName(p, "ja")).toBe(p.名);
    expect(patternName(p, "en")).toBe(p.名En);
  });

  it("英語が無い時に日本語へ落とさない (植え込み対照)", () => {
    // 落とす実装にすると、表の抜けが「そういう見本だ」 と読める形で画面に残る
    const 抜けた見本 = {
      id: "x",
      title: "x",
      subtitle: "日本語の説明",
      subtitleEn: "",
      motionNote: "",
      diagram: { id: "x", nodes: [], phases: [] },
    } as unknown as CatalogItem;
    expect(itemSubtitle(抜けた見本, "en")).toBe("");
    expect(itemSubtitle(抜けた見本, "ja")).toBe("日本語の説明");
    expect(patternName({ 名: "あ", 名En: "", 鍵: "k", diagram: 抜けた見本.diagram }, "en")).toBe("");
  });

  it("変種名の表に実物へ無い鍵が残っていない", async () => {
    // 説明の英訳表は 4 表をまとめて見る `catalog-name-parity.test.ts` が担う
    const 名 = new Set((await 全部の見本()).flatMap((x) => (x.patterns ?? []).map((p) => p.名)));
    const 名の余り = Object.keys(PATTERN_NAME_EN).filter((k) => !名.has(k));
    expect(名の余り, `実物に無い名前の訳が残る:\n${名の余り.join("\n")}`).toEqual([]);
  });
});
