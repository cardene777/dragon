/**
 * 図の題と頁の説明行に同じ字が 2 か所出ないことを見る検査 (#2691)。
 *
 * engine の 0.96.0 で図表が図の題を描くようになった。 頁の説明行は専用の説明が無い時に
 * 図の説明 (`topic`) へ落ちるため、題を描く図では必ず同じ字が並ぶ。
 *
 * `showsSubtitleLine` が「題を描く図で、説明行が題と同じ字の時だけ出さない」 を決める。
 * ここは その判定が見本の全件で成り立つことと、判定が寄りかかっている前提
 * (図が描く題は `topic` である) の両方を見る。
 *
 * **前提を描いて確かめる** = 題の出どころを読まずに決め打つと、engine が題の出どころを
 * 変えた日に判定だけが古くなり、同じ字がまた 2 か所に並ぶ。
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, drawsFigureTitle, layout } from "@cardenelabs/cdl";
import type { CatalogItem } from "./catalog-items";
import { CATALOG_ITEMS, itemSubtitle, loadPartsItems, showsSubtitleLine } from "./catalog-items";

const 全見本 = async (): Promise<CatalogItem[]> => [
  ...Object.values(CATALOG_ITEMS).flat(),
  ...(await loadPartsItems()),
];

/** その図が自分で題を描くか */
const 題を描く = (item: CatalogItem): boolean =>
  item.diagram.nodes.some((n) => drawsFigureTitle(n.kind));

/** 描いた SVG の、文字として出ている部分 */
function 絵の文字(item: CatalogItem): string[] {
  const svg = renderToStaticMarkup(<CdlDiagramView diagram={layout(item.diagram)} hideHeader />);
  return [...svg.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((m) =>
    (m[1] ?? "").replace(/<[^>]*>/g, ""),
  );
}

describe("図の題と頁の説明行が重ならない (#2691)", () => {
  it("題を描く図で、説明行が題と同じ字のまま出るものが無い", async () => {
    const 見本 = await 全見本();
    const 重なる = 見本.filter(
      (item) =>
        題を描く(item) &&
        showsSubtitleLine(item, "ja") &&
        itemSubtitle(item, "ja") === item.diagram.topic,
    );
    // 母数を併記する = 0 件が「該当なし」 か「走っていない」 かを読み手が分けられる
    expect(
      重なる.map((i) => i.id),
      `走査 ${見本.length} 件 / 題を描く図 ${見本.filter(題を描く).length} 件`,
    ).toEqual([]);
  });

  it("題を描かない図の説明行は、説明がある限り出る", async () => {
    const 見本 = await 全見本();
    const 対象 = 見本.filter((item) => !題を描く(item));
    const 消えた = 対象.filter(
      (item) => itemSubtitle(item, "ja") !== "" && !showsSubtitleLine(item, "ja"),
    );
    expect(消えた.map((i) => i.id), `走査 ${対象.length} 件`).toEqual([]);
  });

  it("説明行を出さない図でも、説明の値は残っている", async () => {
    // 横の一覧の絞り込みは `item.subtitle` を読む。 値を消すと説明の字で引けなくなる
    const 見本 = await 全見本();
    const 出さない = 見本.filter((item) => 題を描く(item) && !showsSubtitleLine(item, "ja"));
    expect(出さない.length, "題を描く図が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);
    expect(出さない.filter((item) => item.subtitle === "").map((i) => i.id)).toEqual([]);
  });

  it("題を描く図に専用の説明が書いてあれば、その行は出す (対照)", async () => {
    const 見本 = await 全見本();
    const 元 = 見本.find(題を描く);
    expect(元, "題を描く図が 1 件も無い").toBeDefined();
    const 専用の説明を持つ: CatalogItem = { ...元!, subtitle: "この図の読み方を別に書いた文" };
    expect(showsSubtitleLine(専用の説明を持つ, "ja")).toBe(true);
  });

  it("図が描く題は図の説明 (topic) と同じ字になっている (前提)", async () => {
    const 見本 = await 全見本();
    const 題あり = 見本.filter((item) => 題を描く(item) && item.diagram.topic !== "");
    expect(題あり.length, "題を描く図が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);
    const 描かれない = 題あり.filter((item) => !絵の文字(item).includes(item.diagram.topic));
    expect(
      描かれない.map((i) => i.id),
      `走査 ${題あり.length} 件`,
    ).toEqual([]);
  });
});
