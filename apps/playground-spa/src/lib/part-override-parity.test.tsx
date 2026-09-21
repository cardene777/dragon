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

  it("見本の頁の「部品を箱に使う」 の切替 14 つが、どれも見本の頁と同じ図になる", async () => {
    const 見本 = (await loadPartsItems()).find((i) => i.id === "部品を箱に置き何も書き換えない");
    const 並び = 見本?.patterns ?? [];
    expect(並び.length, "切替を 1 つも集められていない (検査が空振りしている)").toBe(14);
    let 重ねた数 = 0;
    for (const p of 並び) {
      const 分けた = await 分ける(p.sourceYaml!);
      if (分けた.parts.length === 0) {
        expect(JSON.stringify(分けた.built.diagram), `${p.名} が見本の頁と違う図になる`).toBe(
          JSON.stringify(p.diagram),
        );
        continue;
      }
      // 部品を重ねる切替 (流れの途中に置く、#1987) は、部品を抜いた図と見本の頁の図で、
      // 部品でない箱と矢印が揃うことを見る。 部品の要素は重ねる側が描く
      重ねた数 += 1;
      const 部品の頭 = 分けた.parts.map((x) => `${x.id}__`);
      const 部品でない = (d: CdlDiagram) => ({
        箱: d.nodes.filter((n) => !部品の頭.some((h) => n.id.startsWith(h))).map((n) => n.id),
        矢印: d.edges.map((e) => `${e.from} -> ${e.to}: ${e.label}`),
      });
      expect(部品でない(分けた.built.diagram), `${p.名} の箱か矢印が見本の頁と違う`).toEqual(
        部品でない(p.diagram),
      );
    }
    // 重ねる側の比べ方が空振りしていない
    expect(重ねた数, "部品を重ねる切替が無い (重ねる側の比べ方が空振りしている)").toBe(1);
  });
});

describe("部品へ矢印を引いた本文は、抜かずに組み立て側で描く (#1979)", () => {
  /*
   * 重ねた部品は図の外の層なので矢印の端にできない。 抜いた本文では矢印が居ない名前を指して
   * 落ちていた (実測 = 「actors に書かれていません」 で矢印が消えた)。
   */
  it.each([
    [
      "行き先が部品",
      `  - 受付: { kind: card }\n  - 印: { kind: state-indicator }\n`,
      `flow:\n  - 受付 -> 印: "送る"\n`,
      "受付 -> 印__ind",
    ],
    [
      "出どころが部品",
      `  - 印: { kind: state-indicator }\n  - 受付: { kind: card }\n`,
      `flow:\n  - 印 -> 受付: "知らせる"\n`,
      "印__ind -> 受付",
    ],
  ])("%s", async (_名, 登場人物, 流れ, 期待する端) => {
    // 縦列を共有する `flow` で見る。 `swimlane` の部品は矢印が無くても自分の縦列に入って抜かずに
    // 描くため (#1980)、矢印を見る判定を外しても通ってしまう。
    // `flow` は登場人物を書いた順に繋ぐので、矢印の向きに合わせて並べる
    const src = `title: "t"\ntype: flow\n\nactors:\n${登場人物}\n${流れ}`;
    const 分けた = await 分ける(src);
    const { 一覧 } = await 編集画面の部品();
    expect(分けた.parts, "部品を重ねる側に抜いた").toEqual([]);
    expect(分けた.built.diagram.edges.map((e) => `${e.from} -> ${e.to}`)).toEqual([期待する端]);
    expect(JSON.stringify(分けた.built.diagram)).toBe(
      JSON.stringify(textDslToDiagram(src, { partsCatalog: 一覧 })),
    );
    expect(分けた.lineMap).toEqual(src.split("\n").map((_, i) => i + 1));
  });

  it("部品へ矢印を引かない本文は、今までどおり部品を重ねる", async () => {
    // 陰性対照 = 矢印が部品でない箱どうしなら、部品は抜いて重ねる側に回る。
    // 縦列を共有する `flow` で見る。 `swimlane` の部品は自分の名前の縦列に入り、矢印の有無に依らず
    // 抜かずに描く (#1980)
    const src = `title: "t"\ntype: flow\n\nactors:\n  - 受付: { kind: card }\n  - 出荷: { kind: card }\n  - 印: { kind: state-indicator }\n\nflow:\n  - 受付 -> 出荷: "送る"\n`;
    const 分けた = await 分ける(src);
    expect(分けた.parts.map((p) => p.id)).toEqual(["印"]);
  });
});

describe("静止したフローの途中に部品を置いても、カタログと編集画面で同じ矢印になる (#1987)", () => {
  /*
   * 編集画面は部品を抜いてから鎖を作り、カタログは部品も鎖に入れていた。 部品が並びの途中にあると
   * カタログだけ前後の並び順の矢印が外れ、矢印が 0 本になっていた (実測)。
   */
  it.each([
    ["部品が途中、行なし", ["受付", "印", "出荷"], ""],
    ["部品が先頭、行なし", ["印", "受付", "出荷"], ""],
    ["部品が末尾、行なし", ["受付", "出荷", "印"], ""],
    ["部品が途中、部品を指さない行", ["受付", "印", "出荷"], `flow:\n  - 受付 -> 出荷: "出す"\n`],
  ])("%s", async (_名, 並び, 流れ) => {
    const 行 = (名: string) =>
      名 === "印" ? "  - 印: { kind: state-indicator }" : `  - ${名}: { kind: card }`;
    const src = `title: "t"\ntype: flow\n\nactors:\n${並び.map(行).join("\n")}\n\n${流れ}`;
    const { 一覧 } = await 編集画面の部品();
    const 知らせ: string[] = [];
    const カタログ = textDslToDiagram(src, {
      partsCatalog: 一覧,
      onNotice: (n) => 知らせ.push(n.kind),
    });
    const 分けた = await 分ける(src);
    const 矢印 = (d: CdlDiagram) => d.edges.map((e) => `${e.from} -> ${e.to}: ${e.label}`);
    // 編集画面は部品を重ねる側に回す = 抜いた本文の鎖と比べる
    expect(
      分けた.parts.map((p) => p.id),
      "部品を重ねる側に回していない (前提が崩れた)",
    ).toEqual(["印"]);
    expect(矢印(カタログ)).toEqual(矢印(分けた.built.diagram));
    expect(矢印(カタログ).map((e) => e.split(":")[0])).toEqual(["受付 -> 出荷"]);
    expect(知らせ.filter((k) => k === "flow-endpoint-not-honored")).toEqual([]);
  });
});
