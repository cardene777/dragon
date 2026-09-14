/**
 * 部品を箱に使う見本の検証 (#1973)。
 *
 * 部品の状態の上書き (`state`)・描画倍率 (`scale`)・色番号 (`color: "#..."`) を書いた見本が、
 * **描いた絵** で書いたとおりに変わることを見る。 組み立てた図の値だけを見ると、描画側が
 * その値を読まなくても通る。
 *
 * `state-indicator` は円の外枠 (半径 140) と、状態 `lvl` の割合で半径が決まる塗りの円を描く。
 *
 * | 切替 | 塗りの円の半径 | 塗りの色 | 外枠の半径 |
 * |---|---|---|---|
 * | 書かない | 0 (段で 140 まで伸びる) | `#22c55e` | 140 |
 * | 状態を上書き (`lvl: 0.4` と `phase: false`) | 56 (140 の 4 割) | `#22c55e` | 140 |
 * | 倍率を変える (`scale: 0.6`) | 0 | `#22c55e` | 84 |
 * | 色番号を変える (`#d9534f`) | 0 | `#d9534f` | 140 |
 */
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { textDslToDiagram } from "@cardenelabs/dragon";
import { CdlDiagramView, type CdlDiagram } from "@cardenelabs/cdl";
import { loadPartsItems, type CatalogItem } from "./catalog-items";
import { 部品の一覧を作る, 部品の図か } from "./parts-catalog";

const 見本のid = "部品を箱に置き何も書き換えない";

async function 見本(): Promise<CatalogItem> {
  const item = (await loadPartsItems()).find((i) => i.id === 見本のid);
  if (!item) throw new Error(`部品の頁に ${見本のid} が無い`);
  return item;
}

/** 描いた絵の円 (外枠と塗り) を `[半径, 塗り]` で返す */
function 円(d: CdlDiagram): { 外枠: number; 塗り: number; 色: string }[] {
  const s = renderToStaticMarkup(<CdlDiagramView diagram={d} hideHeader />);
  const 円たち = [...s.matchAll(/<circle [^>]*r="([\d.]+)" fill="([^"]+)"/g)].map((m) => ({
    r: Number(m[1]),
    fill: m[2]!,
  }));
  const 外枠 = 円たち.filter((c) => c.fill === "none");
  const 塗り = 円たち.filter((c) => c.fill !== "none");
  return 外枠.map((o, i) => ({
    外枠: o.r,
    塗り: 塗り[i]?.r ?? Number.NaN,
    色: 塗り[i]?.fill ?? "",
  }));
}

describe("部品を箱に使う見本 (#1973)", () => {
  it("部品の頁の最後に並び、4 つの切替を持つ", async () => {
    const items = await loadPartsItems();
    expect(items.at(-1)?.id).toBe(見本のid);
    expect((await 見本()).patterns?.map((p) => p.名)).toEqual([
      "書かない",
      "状態を上書き",
      "倍率を変える",
      "色番号を変える",
    ]);
  });

  it("切替ごとに、描いた円の半径と塗りの色が書いた欄のとおりに変わる", async () => {
    const 並び = (await 見本()).patterns ?? [];
    const 描いた = Object.fromEntries(並び.map((p) => [p.名, 円(p.diagram)]));
    for (const [名, 絵] of Object.entries(描いた)) {
      expect(絵, `${名} で部品の円を 1 つも描いていない (検査が空振りしている)`).toHaveLength(1);
    }
    expect(描いた["書かない"]).toEqual([{ 外枠: 140, 塗り: 0, 色: "#22c55e" }]);
    expect(描いた["状態を上書き"]).toEqual([{ 外枠: 140, 塗り: 56, 色: "#22c55e" }]);
    expect(描いた["倍率を変える"]).toEqual([{ 外枠: 84, 塗り: 0, 色: "#22c55e" }]);
    expect(描いた["色番号を変える"]).toEqual([{ 外枠: 140, 塗り: 0, 色: "#d9534f" }]);
  });

  it("状態を上書きした切替は部品の段を外し、上書きした値のまま止まる", async () => {
    const 並び = (await 見本()).patterns ?? [];
    const 値が動く = (名: string) =>
      並び.find((p) => p.名 === 名)!.diagram.phases.some((ph) => (ph.tweens?.length ?? 0) > 0);
    expect(値が動く("書かない"), "部品の段が動いていない (前提が崩れた)").toBe(true);
    expect(値が動く("状態を上書き")).toBe(false);
  });

  it("編集画面と同じ部品の一覧で記法を組み立てると、カタログに出す図と同じ図になる", async () => {
    const items = await loadPartsItems();
    // 編集画面は部品の頁の見本から部品だけを残して一覧を作る (`CdlEditor.tsx`)
    const 編集画面の一覧 = 部品の一覧を作る(
      items.filter((i) => 部品の図か(i.id)).map((i) => i.diagram),
    );
    const 並び = (await 見本()).patterns ?? [];
    expect(並び.length, "切替を 1 つも集められていない (検査が空振りしている)").toBe(4);
    for (const p of 並び) {
      const 組み直し = textDslToDiagram(p.sourceYaml!, { partsCatalog: 編集画面の一覧 });
      expect(JSON.stringify(組み直し), `${p.名} が編集画面と違う図になる`).toBe(
        JSON.stringify(p.diagram),
      );
    }
  });

  it("部品の一覧には部品そのものだけが入り、部品を箱に使う見本は入らない", async () => {
    const items = await loadPartsItems();
    const 一覧 = 部品の一覧を作る(items.map((i) => i.diagram));
    const 部品の数 = items.filter((i) => 部品の図か(i.id)).length;
    expect(部品の数, "部品を 1 つも数えられていない (検査が空振りしている)").toBe(80);
    // 頭付きと頭なしの 2 通りで引ける
    expect(Object.keys(一覧)).toHaveLength(部品の数 * 2);
    expect(一覧["state-indicator"]?.id).toBe("parts-state-indicator");
    expect(Object.values(一覧).some((d) => d.id === 見本のid)).toBe(false);
  });
});
