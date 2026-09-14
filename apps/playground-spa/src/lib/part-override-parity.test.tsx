/**
 * 編集画面の本文欄で、部品の状態の上書きと色番号が組み立て側と同じ絵になることの検証 (#1973)。
 *
 * 本文欄は部品を本文から抜き、図の上に重ねて描く (`extractPartsFromSrc`)。 重ねる側が部品の図を
 * そのまま描いていたため、2 つの形が編集画面だけで壊れていた。
 *
 * | 形 | 壊れ方 (実測) |
 * |---|---|
 * | 箱と部品を並べ、部品に `state:` や `color:` を書く | 部品が既定の値で描かれる。 見本の頁の絵と違う |
 * | 部品だけの本文 (見本の頁の「編集画面で開く」 で開く形) | 抜いた後の図が空で組み立てに落ち、「読み込み中」 のまま止まる |
 *
 * 見るのは **描いた絵の円** で、状態の値だけでは見ない。 値を当てても描く側が別の図を
 * 読んでいれば絵は変わらない。
 */
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { textDslToDiagram } from "@cardenelabs/dragon";
import { CdlDiagramView, type CdlDiagram } from "@cardenelabs/cdl";
import { loadPartsItems, type CatalogItem } from "./catalog-items";
import { 部品の一覧を作る, 部品の図か } from "./parts-catalog";
import { 図と重ねる部品に分ける } from "./overlay-dsl";

/** 編集画面と同じく、部品の頁の見本から部品だけを残す (`CdlEditor.tsx`) */
async function 編集画面の部品(): Promise<{
  項目: CatalogItem[];
  一覧: Record<string, CdlDiagram>;
}> {
  const 項目 = (await loadPartsItems()).filter((i) => 部品の図か(i.id));
  return { 項目, 一覧: 部品の一覧を作る(項目.map((i) => i.diagram)) };
}

/** 描いた絵の円を、外枠 (塗り無し) と塗りに分けて返す */
function 円(d: CdlDiagram): { 外枠: number[]; 塗り: { r: number; fill: string }[] } {
  const s = renderToStaticMarkup(
    <CdlDiagramView hideMiniPhaseIndicator diagram={d} hideHeader emitGeometryWarn={false} />,
  );
  const 円たち = [...s.matchAll(/<circle [^>]*r="([\d.]+)" fill="([^"]+)"/g)].map((m) => ({
    r: Number(m[1]),
    fill: m[2]!,
  }));
  return {
    外枠: 円たち.filter((c) => c.fill === "none").map((c) => c.r),
    塗り: 円たち.filter((c) => c.fill !== "none"),
  };
}

const 本文 = (actors: string): string => `title: "t"\ntype: flow\n\nactors:\n${actors}`;

async function 分ける(src: string) {
  const { 項目, 一覧 } = await 編集画面の部品();
  return 図と重ねる部品に分ける(src, 一覧, 項目, (s) => ({
    diagram: textDslToDiagram(s, { partsCatalog: 一覧 }),
  }));
}

describe("箱と並べた部品に書いた上書きを、重ねる部品にも当てる (#1973)", () => {
  it.each([
    [
      "中括弧の状態の上書き",
      `  - 印: { kind: state-indicator, state: { lvl: 0.4, phase: false } }\n`,
      { 外枠: [140], 塗り: [{ r: 56, fill: "#22c55e" }] },
    ],
    // 段が値を動かす部品は、段を外さないと最初の段の値で描く (見本の頁と同じ決まり)
    [
      "平たく書いた状態",
      `  - 印: { kind: state-indicator, lvl: 0.4, phase: false }\n`,
      { 外枠: [140], 塗り: [{ r: 56, fill: "#22c55e" }] },
    ],
    [
      "段を外さない状態の上書き",
      `  - 印: { kind: state-indicator, lvl: 0.4 }\n`,
      { 外枠: [140], 塗り: [{ r: 0, fill: "#22c55e" }] },
    ],
    [
      "中括弧の色番号",
      `  - 印: { kind: state-indicator, color: "#d9534f" }\n`,
      { 外枠: [140], 塗り: [{ r: 0, fill: "#d9534f" }] },
    ],
    [
      "縦に並べた色番号",
      `  - 印:\n      kind: state-indicator\n      color: "#d9534f"\n`,
      { 外枠: [140], 塗り: [{ r: 0, fill: "#d9534f" }] },
    ],
    [
      "空白を含む名前",
      `  - "設備 1": { kind: state-indicator, lvl: 0.4, phase: false }\n`,
      { 外枠: [140], 塗り: [{ r: 56, fill: "#22c55e" }] },
    ],
  ])("%s", async (_名, 部品の行, 期待) => {
    const src = 本文(`  - 受付: { kind: card }\n${部品の行}`);
    const 分けた = await 分ける(src);
    expect(分けた.parts.length, "部品を重ねる側に抜けていない (検査が空振りしている)").toBe(1);
    expect(
      分けた.built.diagram.nodes.some((n) => n.title === "受付"),
      "箱が図に残っていない (前提が崩れた)",
    ).toBe(true);
    const 重ねた絵 = 円(分けた.parts[0]!.item.diagram);
    expect(重ねた絵).toEqual(期待);
    // 組み立て側で部品ごと描いた絵と同じ円になる
    const { 一覧 } = await 編集画面の部品();
    expect(重ねた絵).toEqual(円(textDslToDiagram(src, { partsCatalog: 一覧 })));
  });

  it("上書きを書かない部品は、見本の図をそのまま重ねる", async () => {
    const 分けた = await 分ける(
      本文(`  - 受付: { kind: card }\n  - 印: { kind: state-indicator }\n`),
    );
    const { 項目 } = await 編集画面の部品();
    expect(分けた.parts.length, "部品を重ねる側に抜けていない (検査が空振りしている)").toBe(1);
    expect(分けた.parts[0]!.item.diagram).toBe(
      項目.find((i) => i.id === "parts-state-indicator")!.diagram,
    );
  });

  it("上書きを当てても、見本の頁の部品の図は書き換えない", async () => {
    await 分ける(
      本文(
        `  - 受付: { kind: card }\n  - 印: { kind: state-indicator, color: "#d9534f", lvl: 0.4 }\n`,
      ),
    );
    const { 項目 } = await 編集画面の部品();
    const 元 = 項目.find((i) => i.id === "parts-state-indicator")!.diagram;
    expect(元.states.find((s) => s.id === "stFill")?.initial).toBe("#22c55e");
    expect(元.states.find((s) => s.id === "lvl")?.initial).toBe(0);
  });
});

describe("部品だけの本文は、抜かずに組み立て側で描く (#1973)", () => {
  it("重ねる部品は 0 件になり、図は部品ごと組み立てた図と同じになる", async () => {
    const src = 本文(`  - 印: { kind: state-indicator, state: { lvl: 0.4, phase: false } }\n`);
    const 分けた = await 分ける(src);
    const { 一覧 } = await 編集画面の部品();
    expect(分けた.parts).toEqual([]);
    expect(分けた.built.diagram.nodes.length, "部品の箱が図に入っていない").toBeGreaterThan(0);
    expect(JSON.stringify(分けた.built.diagram)).toBe(
      JSON.stringify(textDslToDiagram(src, { partsCatalog: 一覧 })),
    );
    // 行の対応は元の本文そのまま (矢印の行を書き換える側が別の行を指さない)
    expect(分けた.lineMap).toEqual(src.split("\n").map((_, i) => i + 1));
  });

  it("見本の頁の「部品を箱に使う」 の切替 4 つが、どれも見本の頁と同じ図になる", async () => {
    const 見本 = (await loadPartsItems()).find((i) => i.id === "部品を箱に置き何も書き換えない");
    const 並び = 見本?.patterns ?? [];
    expect(並び.length, "切替を 1 つも集められていない (検査が空振りしている)").toBe(4);
    for (const p of 並び) {
      const 分けた = await 分ける(p.sourceYaml!);
      expect(分けた.parts, `${p.名} で部品を重ねる側に回した`).toEqual([]);
      expect(JSON.stringify(分けた.built.diagram), `${p.名} が見本の頁と違う図になる`).toBe(
        JSON.stringify(p.diagram),
      );
    }
  });
});
