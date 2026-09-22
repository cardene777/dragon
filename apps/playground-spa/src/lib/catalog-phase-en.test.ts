/**
 * 段の題の対訳が、実物の見本を全部覆っているかを見る (#2469)。
 *
 * ## この検査が `catalog-phase-en.ts` を引き受ける
 *
 * 対訳の鍵は外した置き場 (`topics/`) の字を写したものなので、
 * `screen-words.ts` の `外す材料` がこの file を画面の字の母集団から外す。
 * 外した分の照合をここが担う (対訳の抜けと、英語側に残る日本語)。
 *
 * ## 母集団は実物から導く
 *
 * 表の側だけを見ると、見本を 1 枚足した日も検査は緑のまま通り、
 * 英語の画面だけが段の題を失う。 `CATALOG_ITEMS` を走査して、
 * 出てきた日本語の題が 1 件でも表に無ければ落とす。
 *
 * **変種 (`patterns`) も走らせる**。 切替で中身が入れ替わる見本は別の図を持つので、
 * 元の図だけ見ると変種の段の題が母集団から落ちる。
 *
 * ## 遅れて読み込む分類も走らせる
 *
 * `parts` 分類は開いた時に読み込む経路が別で、`CATALOG_ITEMS` に載っていない。
 * `loadPartsItems()` を待って母集団へ入れる。
 *
 * **外すとその分類だけ英語で題が消える**。 引けない時に日本語へ落とさない設計なので、
 * 表に無い題は空になる。 日本語が出るより悪いので、静的な分類と同じ表で覆う。
 */
import { describe, expect, it } from "vitest";
import { CATALOG_ITEMS, loadPartsItems, type CatalogItem } from "./catalog-items";
import { PHASE_TITLE_EN, phaseTitle, 日本語を含む } from "./catalog-phase-en";

/** 実物の見本に出る段の題を全部集める (変種の図と、遅れて読み込む分類も含む) */
async function 実物の題(): Promise<{ 題: string; 出どころ: string }[]> {
  const out: { 題: string; 出どころ: string }[] = [];
  const 分類ごと: [string, CatalogItem[]][] = [
    ...Object.entries(CATALOG_ITEMS),
    ["parts", await loadPartsItems()],
  ];
  for (const [分類, items] of 分類ごと) {
    for (const item of items) {
      const 図たち = [item.diagram, ...(item.patterns ?? []).map((p) => p.diagram)];
      for (const d of 図たち) {
        for (const p of d.phases ?? []) {
          const t = (p.title ?? "").trim();
          if (t === "") continue;
          out.push({ 題: t, 出どころ: `${分類}/${item.id}` });
        }
      }
    }
  }
  return out;
}

describe("段の題の対訳 (#2469)", () => {
  it("実物の見本を 1 枚以上走らせている (検査の空振り検知)", async () => {
    const 全件 = await 実物の題();
    expect(全件.length, "段の題を 1 件も集められていない").toBeGreaterThan(100);
    expect(
      全件.filter((x) => 日本語を含む(x.題)).length,
      "日本語の題が 1 件も無い (走査が届いていない)",
    ).toBeGreaterThan(100);
    // 遅れて読み込む分類が母集団に入っているか (`await` を外すと黙って落ちる)
    expect(
      全件.filter((x) => x.出どころ.startsWith("parts/")).length,
      "parts 分類の段の題が 1 件も入っていない",
    ).toBeGreaterThan(0);
  });

  it("日本語を含む題が全て表に載っている", async () => {
    const 抜け = [
      ...new Map(
        (await 実物の題())
          .filter((x) => 日本語を含む(x.題))
          .filter((x) => PHASE_TITLE_EN[x.題] === undefined)
          .map((x) => [x.題, x]),
      ).values(),
    ];
    expect(
      抜け.map((x) => `${x.題} (${x.出どころ})`),
      "対訳の無い段の題がある (英語で開くと題が消える)",
    ).toEqual([]);
  });

  it("英語の側に日本語が残っていない", () => {
    const 混ざり = Object.entries(PHASE_TITLE_EN).filter(([, en]) => 日本語を含む(en));
    expect(混ざり.map(([ja, en]) => `${ja} → ${en}`), "訳したはずの側に日本語が残っている").toEqual(
      [],
    );
  });

  it("表に実物へ出てこない鍵が残っていない", async () => {
    const 実在 = new Set((await 実物の題()).map((x) => x.題));
    const 余り = Object.keys(PHASE_TITLE_EN).filter((k) => !実在.has(k));
    expect(余り, "実物に出ない段の題が表に残っている (見本を消した時の取り残し)").toEqual([]);
  });

  it("日本語では題をそのまま返す", async () => {
    for (const { 題 } of await 実物の題()) {
      expect(phaseTitle(題, "ja"), "日本語の題が訳す前と変わっている").toBe(題);
    }
  });

  it("日本語を含まない題は英語でもそのまま出す", async () => {
    // 実物の `2. ALB` や `solid / accent` のような題。 訳す対象ではないので素通しする
    const そのまま = [...new Set((await 実物の題()).map((x) => x.題))].filter((t) => !日本語を含む(t));
    expect(そのまま.length, "日本語を含まない題が 1 件も無い (素通しの経路を確かめられない)")
      .toBeGreaterThan(0);
    for (const t of そのまま) {
      expect(phaseTitle(t, "en"), "英数字だけの題が落ちている").toBe(t);
    }
  });

  it("引けない題は日本語へ落とさず空にする", () => {
    // 植え込み対照。 表に無い日本語の題を渡すと空が返る
    expect(phaseTitle("見たことのない段の題", "en"), "日本語がそのまま英語の画面へ出ている").toBe(
      "",
    );
  });
});
