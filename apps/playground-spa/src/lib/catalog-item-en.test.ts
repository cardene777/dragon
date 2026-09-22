/**
 * 見本 1 件ごとの英語が実物ぶん揃っていることの検証 (#2461)。
 *
 * **母数は実物の見本から導く**。 表の側だけを見ると、見本を足した日に表が取り残されても
 * 緑のまま通る。 カタログを実際に読み込んで、説明と変種の名前が 2 言語とも埋まっているかを見る。
 *
 * 英語が無い時に日本語へ落とす経路を持たないので、抜けはそのまま空欄として画面に出る。
 * ここが落ちることが唯一の歯止めになる。
 */
import { describe, it, expect } from "vitest";
import {
  CATALOG_ITEMS,
  loadPartsItems,
  itemSubtitle,
  patternName,
  type CatalogItem,
} from "./catalog-items";
import { ITEM_SUBTITLE_EN, PATTERN_NAME_EN } from "./catalog-item-en";

const 日本語の字 =
  /[\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}\p{Script_Extensions=Han}]/u;

async function 全部の見本(): Promise<CatalogItem[]> {
  return [...Object.values(CATALOG_ITEMS).flat(), ...(await loadPartsItems())];
}

describe("カタログの見本の英語 (#2461)", () => {
  it("走査した件数を出す", async () => {
    const 見本 = await 全部の見本();
    const 変種 = 見本.flatMap((x) => x.patterns ?? []);
    console.log(
      `[見本の英語] 見本=${見本.length} 変種=${変種.length}` +
        ` 説明の表=${Object.keys(ITEM_SUBTITLE_EN).length} 名前の表=${Object.keys(PATTERN_NAME_EN).length}`,
    );
    expect(見本.length, "見本を 1 件も読めていない (検査が空振りしている)").toBeGreaterThan(400);
    expect(変種.length, "変種を 1 件も読めていない (検査が空振りしている)").toBeGreaterThan(100);
  });

  it("日本語の説明を持つ見本は英語の説明も持つ", async () => {
    const 抜け = (await 全部の見本())
      .filter((x) => 日本語の字.test(x.subtitle) && x.subtitleEn.trim() === "")
      .map((x) => `${x.title}: ${x.subtitle.slice(0, 40)}`);
    expect(抜け, `英語の説明が無い見本:\n${抜け.join("\n")}`).toEqual([]);
  });

  it("英語の説明に日本語が残っていない", async () => {
    const 残る = (await 全部の見本())
      .filter((x) => 日本語の字.test(x.subtitleEn))
      .map((x) => `${x.title}: ${x.subtitleEn.slice(0, 60)}`);
    expect(残る, `英語の説明に日本語が残る:\n${残る.join("\n")}`).toEqual([]);
  });

  it("日本語の名前を持つ変種は英語の名前も持つ", async () => {
    const 抜け = (await 全部の見本())
      .flatMap((x) => (x.patterns ?? []).map((p) => ({ 見本: x.title, p })))
      .filter((v) => 日本語の字.test(v.p.名) && v.p.名En.trim() === "")
      .map((v) => `${v.見本}: ${v.p.名}`);
    expect(抜け, `英語の名前が無い変種:\n${抜け.join("\n")}`).toEqual([]);
  });

  it("英語の名前に日本語が残っていない", async () => {
    const 残る = (await 全部の見本())
      .flatMap((x) => x.patterns ?? [])
      .filter((p) => 日本語の字.test(p.名En))
      .map((p) => `${p.鍵}: ${p.名En}`);
    expect(残る, `英語の名前に日本語が残る:\n${残る.join("\n")}`).toEqual([]);
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

  it("表に実物へ無い鍵が残っていない", async () => {
    // 見本を消した時に訳だけが残ると、次に同じ鍵を足した人が古い訳に当たる
    const 鍵 = new Set((await 全部の見本()).map((x) => x.title));
    const 余り = Object.keys(ITEM_SUBTITLE_EN).filter((k) => !鍵.has(k));
    expect(余り, `実物に無い説明の訳が残る:\n${余り.join("\n")}`).toEqual([]);

    const 名 = new Set((await 全部の見本()).flatMap((x) => (x.patterns ?? []).map((p) => p.名)));
    const 名の余り = Object.keys(PATTERN_NAME_EN).filter((k) => !名.has(k));
    expect(名の余り, `実物に無い名前の訳が残る:\n${名の余り.join("\n")}`).toEqual([]);
  });
});
