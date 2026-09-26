/**
 * JSON を読む経路が、書いた場所ごとの行を受け取って知らせに載せる (#2117)。
 *
 * JSON そのものは書いた場所を持たないため、`jsonToDoc` は全ての要素に `{ line: 0 }` を渡して
 * いた。 画面は `line > 0` の時だけ `L{行}` を添えるため、この経路 (編集画面の YAML 欄) の
 * 知らせはどの行の話か分からなかった。
 *
 * 本文の行が分かる入口だけが場所ごとの行を集めて渡す。 渡さない呼出 (LLM が作った JSON を
 * 直に渡す経路) は今までどおり 0 行になる = 「行が分からない」 ことを 0 で表す。
 *
 * 場所の鍵は RFC 6901 (JSON Pointer) と同じ形で、作る側 (画面の YAML 欄) と引く側
 * (`jsonToDoc`) が同じ関数 (`書いた場所の鍵`) を呼ぶ。
 */
import { describe, expect, it } from "vitest";
import { jsonToDiagram, 書いた場所の鍵, type CompileNotice } from "../src/index";
import { jsonToDoc, type DragonJson } from "../src/json-parser";

/** 知らせを集めながら組み立てる。 `console.warn` は同じ文を出すので黙らせる */
function 知らせを集める(組み立て: (onNotice: (n: CompileNotice) => void) => unknown): CompileNotice[] {
  const 知らせ: CompileNotice[] = [];
  const もとの = console.warn;
  console.warn = () => {};
  try {
    組み立て((n) => 知らせ.push(n));
    return 知らせ;
  } finally {
    console.warn = もとの;
  }
}

/**
 * 文書の中の位置 (`{ line: N }` だけを持つ object) を全て集める。
 *
 * 欄を手で並べると、欄が増えた時に検査が追いつかない。 実物を辿って数える = 新しい欄に
 * 行を載せ忘れたら、この検査が 0 行の場所を名指しで落とす。
 */
function 位置を集める(値: unknown, 道 = "$"): { 道: string; line: number }[] {
  if (Array.isArray(値)) return 値.flatMap((v, i) => 位置を集める(v, `${道}[${i}]`));
  if (値 !== null && typeof 値 === "object") {
    const o = 値 as Record<string, unknown>;
    // 位置は `line` 1 つだけを持つ。 `layoutPos` (`{ x, y }`) と取り違えない
    if (typeof o.line === "number" && Object.keys(o).length === 1) {
      return [{ 道, line: o.line }];
    }
    return Object.entries(o).flatMap(([k, v]) => 位置を集める(v, `${道}.${k}`));
  }
  return [];
}

/** 行を載せる欄を全て含む JSON。 欄ごとに別の行を与えて、取り違えを見つけられるようにする */
const 全部入り: DragonJson = {
  title: "t",
  type: "flow",
  eyebrow: "小見出し",
  direction: "horizontal",
  axes: { x: "横", y: "縦" },
  viewport: { width: 400, height: 300 },
  actors: ["素の名前", { name: "二つ目", kind: "storage", lane: "左" }],
  flow: [{ from: "素の名前", to: "二つ目", label: "運ぶ" }],
  lanes: { 左: { label: "左の枠" } },
  groups: { 組: { label: "組", lanes: ["左"] } },
  values: { sales: "1 + 2" },
  formulas: { total: "sales * 2" },
  states: { 開き: 0 },
  events: [{ on: "press", box: "素の名前", handler: "開き = 1" }],
  animation: [
    {
      step: "始め",
      draw: "素の名前 -> 二つ目",
      tween: { 開き: [0, 1] },
      set: { 開き: 1 },
    },
  ],
} as DragonJson;

/** 全部入りの JSON で行を載せる場所と、検査で与える行番号 */
const 場所と行: readonly (readonly [readonly (string | number)[], number])[] = [
  [[], 1],
  [["eyebrow"], 2],
  [["axes"], 3],
  [["direction"], 4],
  [["viewport"], 5],
  [["actors", 0], 6],
  [["actors", 1], 7],
  [["flow", 0], 8],
  [["lanes", "左"], 9],
  [["groups", "組"], 10],
  [["values", "sales"], 11],
  [["formulas", "total"], 12],
  [["states", "開き"], 13],
  [["events", 0], 14],
  [["animation"], 15],
  [["animation", 0], 16],
  [["animation", 0, "draw"], 17],
  [["animation", 0, "tween", "開き"], 18],
  [["animation", 0, "set", "開き"], 19],
];

const 全部の表 = new Map(場所と行.map(([道, line]) => [書いた場所の鍵(...道), line]));

describe("書いた場所の鍵", () => {
  it("文書そのものは空文字、欄と番号は `/` で繋ぐ", () => {
    expect(書いた場所の鍵()).toBe("");
    expect(書いた場所の鍵("actors", 1)).toBe("/actors/1");
    expect(書いた場所の鍵("animation", 0, "tween", "開き")).toBe("/animation/0/tween/開き");
  });

  it("1 つずつ足した形と、まとめて渡した形が同じになる", () => {
    expect(書いた場所の鍵("actors") + 書いた場所の鍵(1)).toBe(書いた場所の鍵("actors", 1));
  });

  it("名前の `/` と `~` を書き換えるので、入れ子の欄と重ならない", () => {
    expect(書いた場所の鍵("values", "a/b")).toBe("/values/a~1b");
    expect(書いた場所の鍵("values", "a~b")).toBe("/values/a~0b");
    expect(書いた場所の鍵("values", "a/b")).not.toBe(書いた場所の鍵("values", "a", "b"));
  });
});

describe("jsonToDoc が行を載せる", () => {
  it("表を渡すと、位置を持つ場所が全て書いた行を指す", () => {
    const doc = jsonToDoc(全部入り, 全部の表);
    const 位置 = 位置を集める(doc);
    // 空振りの確認 = 数えた場所が 19 件の欄を網羅している
    expect(位置.length).toBeGreaterThanOrEqual(場所と行.length);
    expect(位置.filter((p) => p.line === 0).map((p) => p.道)).toEqual([]);
    // 場所ごとに別の行を与えてあるので、引く場所を取り違えると行が重なって欠ける
    expect(位置.map((p) => p.line).sort((a, b) => a - b)).toEqual(
      場所と行.map(([, line]) => line).sort((a, b) => a - b),
    );
  });

  it("表を渡さないと、位置を持つ場所が全て 0 行になる", () => {
    const doc = jsonToDoc(全部入り);
    const 位置 = 位置を集める(doc);
    expect(位置.length).toBeGreaterThanOrEqual(場所と行.length);
    expect(位置.filter((p) => p.line !== 0).map((p) => p.道)).toEqual([]);
  });

  it.each([
    ["箱", (d: ReturnType<typeof jsonToDoc>) => d.actors[1]?.pos?.line, 7],
    ["矢印", (d: ReturnType<typeof jsonToDoc>) => d.flow[0]?.pos?.line, 8],
    ["値", (d: ReturnType<typeof jsonToDoc>) => d.values?.[0]?.pos?.line, 11],
    ["段", (d: ReturnType<typeof jsonToDoc>) => d.animate?.phases[0]?.pos?.line, 16],
    ["小見出し", (d: ReturnType<typeof jsonToDoc>) => d.eyebrowPos?.line, 2],
    ["向き", (d: ReturnType<typeof jsonToDoc>) => d.directionPos?.line, 4],
  ])("%s: 書いた場所の行がそのまま入る", (_名, 引く, 期待) => {
    expect(引く(jsonToDoc(全部入り, 全部の表))).toBe(期待);
  });

  it("表に無い場所は 0 行のままになる", () => {
    const 一部 = new Map([[書いた場所の鍵("actors", 1), 7]]);
    const doc = jsonToDoc(全部入り, 一部);
    expect(doc.actors[1]?.pos?.line).toBe(7);
    expect(doc.actors[0]?.pos?.line).toBe(0);
    expect(doc.flow[0]?.pos?.line).toBe(0);
  });
});

describe("jsonToDiagram の知らせ", () => {
  /** 画面の YAML 欄に貼る本文と同じ形。 行番号は本文の行に合わせてある */
  const ガントチャート = {
    title: "t",
    type: "gantt",
    actors: [{ name: "設計", value: "Q1" }, { name: "実装" }],
    flow: [{ from: "設計", to: "試験", label: "" }],
    values: { sales: "1 +" },
  };
  const ガントチャートの表 = new Map([
    [書いた場所の鍵("actors", 1), 5],
    [書いた場所の鍵("flow", 0), 7],
    [書いた場所の鍵("values", "sales"), 9],
  ]);

  it("表を渡すと、3 件の知らせが書いた行を指す", () => {
    const 知らせ = 知らせを集める((onNotice) =>
      jsonToDiagram(ガントチャート, { onNotice, 行の表: ガントチャートの表 }),
    );
    expect(知らせ.map((n) => [n.kind, n.line])).toEqual([
      ["chart-value-unreadable", 5],
      ["flow-actor-missing", 7],
      ["value-unresolved", 9],
    ]);
  });

  it("表を渡さないと、同じ 3 件が 0 行のままになる", () => {
    const 知らせ = 知らせを集める((onNotice) => jsonToDiagram(ガントチャート, { onNotice }));
    expect(知らせ.map((n) => [n.kind, n.line])).toEqual([
      ["chart-value-unreadable", 0],
      ["flow-actor-missing", 0],
      ["value-unresolved", 0],
    ]);
  });

  it("行を渡しても図は 1 文字も変わらない", () => {
    const 行あり = jsonToDiagram(ガントチャート, { 行の表: ガントチャートの表 });
    const 行なし = jsonToDiagram(ガントチャート);
    expect(JSON.stringify(行あり)).toBe(JSON.stringify(行なし));
  });

  it("行を持つと、同じ行に重ねないための取り下げ (#2111) が矢印ごとに効く", () => {
    // 値の図は捨てた矢印を最初の矢印の行でまとめて伝える。 行を持たない文書では、その知らせと
    // 2 本目の多重度の知らせが同じ 0 行に並ぶため、多重度の側が出ない
    const 円 = {
      title: "t",
      type: "pie",
      actors: [
        { name: "設計", value: "3" },
        { name: "実装", value: "5" },
      ],
      flow: [
        { from: "設計", to: "実装", label: "" },
        { from: "実装", to: "設計", label: "", cardinality: "N:N" },
      ],
    };
    const 表 = new Map([
      [書いた場所の鍵("flow", 0), 7],
      [書いた場所の鍵("flow", 1), 8],
    ]);
    const 行あり = 知らせを集める((onNotice) => jsonToDiagram(円, { onNotice, 行の表: 表 }));
    expect(行あり.map((n) => [n.kind, n.line])).toEqual([
      ["chart-edge-dropped", 7],
      ["cardinality-not-honored", 8],
    ]);
    const 行なし = 知らせを集める((onNotice) => jsonToDiagram(円, { onNotice }));
    expect(行なし.map((n) => n.kind)).toEqual(["chart-edge-dropped"]);
  });
});
