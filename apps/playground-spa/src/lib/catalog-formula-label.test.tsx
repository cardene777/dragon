// @vitest-environment jsdom
/**
 * カタログの式が名札を持ち、名札を書かない形も切替で見比べられること (#1916)。
 *
 * 描画側は式の `label` を操作部の名前に描き、中身の名前も名札を持つ入力欄と式だけ名札に置き換える
 * (cdl#853)。 名札を書かない式は名前 (`doubled` など) を英語のまま描く。
 *
 * ## 何を見るか
 *
 * | 問い | 相手 |
 * |---|---|
 * | カタログの式が 3 つの書き方 (組み立て関数 / `YAML` / `JSON`) で名札を持つか | 式を持つ見本の全部 |
 * | 名札を書かない形を見比べられるか | `formulaTextBind` の変種 |
 *
 * **式を持つ見本はカタログから導く** = 手で並べると、式を足した見本が名札を持たないまま通る。
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { jsonToDiagram, textDslToDiagram } from "@cardenelabs/dragon";
import { CATALOG_ITEMS, 選んだ見本 } from "./catalog-items";

/** 名札を書かないことが見せる中身の変種。 名札を持たないのが正しい */
const 名札を書かない変種 = "pattern__formulaTextBind__名前のまま描く";

type 書き方 = { 名: string; 図: CdlDiagram };

/** カタログの図のうち、式を持つもの。 元の見本と変種を 1 件ずつ並べる */
function 式を持つ見本(): { 鍵: string; 図: CdlDiagram; yaml?: string; json?: string }[] {
  return Object.values(CATALOG_ITEMS)
    .flat()
    .flatMap((item) =>
      item.patterns
        ? item.patterns.map((p) => ({
            鍵: p.鍵,
            図: p.diagram,
            yaml: p.sourceYaml,
            json: p.sourceJson,
          }))
        : [{ 鍵: item.title, 図: item.diagram, yaml: item.sourceYaml, json: item.sourceJson }],
    )
    .filter((r) => (r.図.formulas ?? []).length > 0);
}

/** 操作部の式の行ごとに、目印と名前と中身を読む */
function 式の行(d: CdlDiagram): { 目印: string; 名前: string; 中身: string }[] {
  const 器 = document.createElement("div");
  器.innerHTML = renderToStaticMarkup(
    <CdlDiagramView diagram={d} hideHeader hideMiniPhaseIndicator />,
  );
  return [...器.querySelectorAll("[data-cdl-formula]")].map((el) => ({
    目印: el.getAttribute("data-cdl-formula") ?? "",
    名前: el.querySelector(".cdl-ip-label")?.textContent ?? "",
    中身: el.querySelector(".cdl-ip-formula-expr")?.textContent ?? "",
  }));
}

describe("カタログの式の名札 (#1916)", () => {
  const 見本 = 式を持つ見本();

  it("式を持つ見本を見つけ、名札を書かない変種もその中にいる", () => {
    expect(見本.length, "式を持つ見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(1);
    expect(見本.map((r) => r.鍵)).toContain(名札を書かない変種);
    console.log(`[式を持つ見本] ${見本.length} 件 = ${見本.map((r) => r.鍵).join(" ")}`);
  });

  it("変種を除く全ての式が、組み立て関数 / YAML / JSON の 3 つで名札を持つ", () => {
    const 名札の無い式: string[] = [];
    for (const r of 見本.filter((r) => r.鍵 !== 名札を書かない変種)) {
      expect(r.yaml, `${r.鍵} に YAML が無い`).toBeDefined();
      expect(r.json, `${r.鍵} に JSON が無い`).toBeDefined();
      const 書き方たち: 書き方[] = [
        { 名: "組み立て関数", 図: r.図 },
        { 名: "YAML", 図: textDslToDiagram(r.yaml!) },
        { 名: "JSON", 図: jsonToDiagram(JSON.parse(r.json!)) },
      ];
      for (const { 名, 図 } of 書き方たち) {
        const 式 = 図.formulas ?? [];
        expect(式.length, `${r.鍵} の ${名} が式を持たない`).toBeGreaterThan(0);
        for (const f of 式) if (!f.label) 名札の無い式.push(`${r.鍵} の ${名} の ${f.id}`);
      }
    }
    expect(名札の無い式).toEqual([]);
  });

  it("名札を書かない変種は、3 つの書き方とも式に名札を持たない", () => {
    const r = 見本.find((r) => r.鍵 === 名札を書かない変種)!;
    for (const 図 of [r.図, textDslToDiagram(r.yaml!), jsonToDiagram(JSON.parse(r.json!))]) {
      expect((図.formulas ?? []).map((f) => [f.id, f.label])).toEqual([
        ["doubled", undefined],
        ["halved", undefined],
      ]);
    }
  });
});

describe("`formulaTextBind` の名札の切替 (#1916)", () => {
  const item = CATALOG_ITEMS.interactive!.find((i) => i.title === "formulaTextBind")!;

  it("名札で描く元の見本と、名前のまま描く変種を切り替えられる", () => {
    expect(item.patterns?.map((p) => p.名)).toEqual(["名札で描く", "名前のまま描く"]);
  });

  it("元の見本は式の名前と中身を名札で描く", () => {
    expect(式の行(選んだ見本(item, "名札で描く")!.diagram)).toEqual([
      { 目印: "doubled", 名前: "2 倍", 中身: "= 元の値 * 2" },
      { 目印: "halved", 名前: "半分", 中身: "= 元の値 / 2" },
    ]);
  });

  it("変種は式の名前も中身も書いたまま描く", () => {
    // 中身の置き換えは名札を持つ式にだけ効く (cdl#853)。 名札を書かない式は中身も書いたまま
    expect(式の行(選んだ見本(item, "名前のまま描く")!.diagram)).toEqual([
      { 目印: "doubled", 名前: "doubled", 中身: "= input * 2" },
      { 目印: "halved", 名前: "halved", 中身: "= input / 2" },
    ]);
  });
});
