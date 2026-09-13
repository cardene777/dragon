// @vitest-environment jsdom
/**
 * 見本帳の選択肢と切り替えが見せる名前を持ち、名前を書かない形も切替で見比べられること (#1920)。
 *
 * 描画側は選択肢の `label` と切り替えの `onLabel` / `offLabel` を、操作部の選択肢と箱の字の差し込みに
 * 描く (cdl#855)。 値は綴りのまま状態に入るので、綴りで読む読み出し (信号の色 / 優先度の札) は変わらない。
 *
 * ## 何を見るか
 *
 * | 問い | 相手 |
 * |---|---|
 * | 名前を書いた見本が、3 つの書き方 (組み立て関数 / `YAML` / `JSON`) で同じ名前を持つか | 名前を持つ見本の全部 |
 * | 画面が操作部の選択肢と箱に差し込む初期値を名前で描くか | 名前を持つ見本の全部 |
 * | 名前を書かない形を見比べられ、変種が値を描くか | `buildStatusTrafficLight` と `clickToggle` の変種 |
 *
 * **名前を持つ見本は見本帳から導く** = 手で並べると、組み立て関数にだけ名前を足した見本が
 * 記法の側で名前を落としたまま通る。
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { jsonToDiagram, textDslToDiagram } from "@cardenelabs/dragon";
import { CATALOG_ITEMS, 選んだ見本 } from "./catalog-items";

/** 名前を書かないことが見せる中身の変種。 名前を持たないのが正しい */
const 名前を書かない変種 = [
  "pattern__buildStatusTrafficLight__値のまま描く",
  "pattern__clickToggle__値のまま描く",
] as const;

/** 値を綴りで読む見本として名前を付けた図。 導いた集合がこれを含むことで取りこぼしを見る */
const 名前を付けた見本 = [
  "alertNotification",
  "deploySpinner",
  "issuePriorityBadge",
  "buildStatusTrafficLight",
  "clickToggle",
] as const;

type 見本 = { 鍵: string; 図: CdlDiagram; yaml?: string; json?: string };

/** 見本帳の図を、元の見本と変種を 1 件ずつに開いて並べる */
function 見本帳の見本(): 見本[] {
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
    );
}

/** 入力欄ごとに、名前に関わる項目だけを抜く (選択肢の並びと切り替えの名前) */
function 名前の項目(d: CdlDiagram): Record<string, unknown>[] {
  return (d.inputs ?? []).map((i) => {
    const x = i as unknown as Record<string, unknown>;
    return { id: x.id, options: x.options, onLabel: x.onLabel, offLabel: x.offLabel };
  });
}

/** 入力欄のどれかが名前を書いているか */
function 名前を持つ(d: CdlDiagram): boolean {
  return 名前の項目(d).some(
    (x) =>
      x.onLabel !== undefined ||
      x.offLabel !== undefined ||
      (Array.isArray(x.options) && x.options.some((o) => typeof o === "object" && o !== null)),
  );
}

function 三つの書き方(r: 見本): { 名: string; 図: CdlDiagram }[] {
  expect(r.yaml, `${r.鍵} に YAML が無い`).toBeDefined();
  expect(r.json, `${r.鍵} に JSON が無い`).toBeDefined();
  return [
    { 名: "組み立て関数", 図: r.図 },
    { 名: "YAML", 図: textDslToDiagram(r.yaml!) },
    { 名: "JSON", 図: jsonToDiagram(JSON.parse(r.json!)) },
  ];
}

/** 画面の字を読む。 操作部の選択肢と、箱に描いた字を分けて返す */
function 描いた字(d: CdlDiagram): { 選択肢: string[]; 全文: string } {
  const 器 = document.createElement("div");
  器.innerHTML = renderToStaticMarkup(
    <CdlDiagramView diagram={d} hideHeader hideMiniPhaseIndicator />,
  );
  return {
    選択肢: [...器.querySelectorAll("option")].map(
      (o) => `${o.getAttribute("value")}=${o.textContent}`,
    ),
    全文: 器.textContent ?? "",
  };
}

describe("見本帳の選択肢と切り替えの名前 (#1920)", () => {
  const 全部 = 見本帳の見本();
  const 名前つき = 全部.filter((r) => 名前を持つ(r.図));

  it("名前を持つ見本を見つけ、名前を付けた 5 図がその中にいる", () => {
    expect(名前つき.length, "名前を持つ見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(
      0,
    );
    expect(名前つき.map((r) => r.鍵)).toEqual(expect.arrayContaining([...名前を付けた見本]));
    console.log(`[名前を持つ見本] ${名前つき.length} 件 = ${名前つき.map((r) => r.鍵).join(" ")}`);
  });

  it("名前を持つ見本は、組み立て関数 / YAML / JSON の 3 つで同じ名前を持つ", () => {
    for (const r of 名前つき) {
      const [元, ...記法] = 三つの書き方(r);
      for (const { 名, 図 } of 記法) {
        expect(名前の項目(図), `${r.鍵} の ${名} の名前が組み立て関数と違う`).toEqual(
          名前の項目(元!.図),
        );
      }
    }
  });

  it("名前を持つ見本は、操作部の選択肢と箱に差し込む初期値を名前で描く", () => {
    // 見本帳の名前つきの入力欄は `dropdown` と `toggle` だけ。 別の種類が名前を持ち始めたら落として検査を足す
    const 見た: string[] = [];
    for (const r of 名前つき) {
      const 字 = 描いた字(r.図);
      const 箱の字 = JSON.stringify(r.図.nodes ?? []);
      for (const i of r.図.inputs ?? []) {
        const x = i as unknown as {
          id: string;
          kind: string;
          defaultValue?: unknown;
          options?: (string | { value: string; label: string })[];
          onLabel?: string;
          offLabel?: string;
        };
        const 組 = (x.options ?? []).filter(
          (o): o is { value: string; label: string } => typeof o === "object",
        );
        if (組.length === 0 && x.onLabel === undefined && x.offLabel === undefined) continue;
        expect(
          ["dropdown", "toggle"],
          `${r.鍵} の ${x.id} (${x.kind}) の描き方を見ていない`,
        ).toContain(x.kind);
        for (const o of 組)
          expect(字.選択肢, `${r.鍵} の ${x.id} の選択肢`).toContain(`${o.value}=${o.label}`);
        const 初期の名前 =
          x.kind === "toggle"
            ? x.defaultValue
              ? x.onLabel
              : x.offLabel
            : 組.find((o) => o.value === x.defaultValue)?.label;
        if (初期の名前 !== undefined && 箱の字.includes(`{${x.id}}`)) {
          expect(字.全文, `${r.鍵} の箱が ${x.id} の初期値を名前で描いていない`).toContain(
            初期の名前,
          );
        }
        見た.push(`${r.鍵}.${x.id}`);
      }
    }
    expect(
      見た.length,
      "名前つきの入力欄を 1 つも見ていない (検査が空振りしている)",
    ).toBeGreaterThanOrEqual(名前を付けた見本.length);
  });

  it("名前を書かない変種は、3 つの書き方とも名前を持たない", () => {
    for (const 鍵 of 名前を書かない変種) {
      const r = 全部.find((x) => x.鍵 === 鍵);
      expect(r, `${鍵} が見本帳に無い`).toBeDefined();
      for (const { 名, 図 } of 三つの書き方(r!)) {
        expect(名前を持つ(図), `${鍵} の ${名} が名前を持っている`).toBe(false);
      }
    }
  });
});

describe("`buildStatusTrafficLight` の名前の切替 (#1920)", () => {
  const item = CATALOG_ITEMS.interactive!.find((i) => i.title === "buildStatusTrafficLight")!;

  it("名前で描く元の見本と、値のまま描く変種を切り替えられる", () => {
    expect(item.patterns?.map((p) => p.名)).toEqual(["名前で描く", "値のまま描く"]);
  });

  it("元の見本は選択肢と箱の字を名前で描き、状態には値を入れる", () => {
    const 字 = 描いた字(選んだ見本(item, "名前で描く")!.diagram);
    expect(字.選択肢).toEqual(["red=失敗", "yellow=実行中", "green=成功"]);
    expect(字.全文).toContain("状態: 成功");
    expect(字.全文).not.toContain("状態: green");
  });

  it("変種は選択肢と箱の字を値のまま描く", () => {
    const 字 = 描いた字(選んだ見本(item, "値のまま描く")!.diagram);
    expect(字.選択肢).toEqual(["red=red", "yellow=yellow", "green=green"]);
    expect(字.全文).toContain("状態: green");
  });
});

describe("`clickToggle` の名前の切替 (#1920)", () => {
  const item = CATALOG_ITEMS.interactive!.find((i) => i.title === "clickToggle")!;

  it("名前で描く元の見本と、値のまま描く変種を切り替えられる", () => {
    expect(item.patterns?.map((p) => p.名)).toEqual(["名前で描く", "値のまま描く"]);
  });

  it("元の見本は箱の字を切り替えの名前で描く", () => {
    const 字 = 描いた字(選んだ見本(item, "名前で描く")!.diagram);
    expect(字.全文).toContain("押した状態 = 押していない");
    expect(字.全文).not.toContain("押した状態 = false");
  });

  it("変種は箱の字を真偽の値のまま描く", () => {
    expect(描いた字(選んだ見本(item, "値のまま描く")!.diagram).全文).toContain(
      "押した状態 = false",
    );
  });
});
