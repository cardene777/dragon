/**
 * 箱の項目と図の項目が記法と JSON で揃っていることの検証 (#1294)。
 *
 * 記法では効くのに JSON では **書いても何も起きない** 項目が 13 個あった。 検査を通り、
 * 図に差が出ず、知らせも出ない。 `jsonToDoc` がその項目を読まなかったため。
 *
 * ## 期待値は記法側を解いた結果から取る
 *
 * `#1293` で踏んだ形を繰り返さないため、期待値に **自分が書いた入力値** を使わない。
 * 入力を変換する層 (読み替え表 / 色名の解決 / 数への変換) があると、その食い違いが
 * 検査を通り抜ける。 記法側の `parseTextDslV05` を解いた結果と突き合わせる。
 *
 * ## 網羅は `INLINE_ACTOR_KEYS` から導く
 *
 * 項目名を手で並べると、記法に項目が増えた時に検査だけが古くなる。 記法側の一覧を出どころに
 * して、対応表が全項目を覆っていることを先に確かめる。
 */
import { describe, it, expect } from "vitest";
import { jsonToDoc, type DragonJson, type JsonActor } from "../src/json-parser";
import { validateDragonJson } from "@cardenelabs/dragon";
import { parseTextDslV05, INLINE_ACTOR_KEYS } from "../src/v05/parser";
import type { DslActor } from "../src/types";

/** 記法の 1 行 (中括弧の中身) と、同じ意味の JSON の項目 */
type 対応 = { 記法: string; json: Record<string, unknown> };

/**
 * 記法の項目名 → 同じ意味を書く 2 通り。
 *
 * `倍率` は `scale` の別名で、JSON は英語名だけを持つ (記法の別名を JSON に写さない)。
 * 見本 (parts) でしか意味を持たない項目は下の別 describe で見る。
 */
const 対応表: Record<string, 対応> = {
  kind: { 記法: "kind: storage", json: { kind: "storage" } },
  subtitle: { 記法: 'subtitle: "補足"', json: { subtitle: "補足" } },
  eyebrow: { 記法: 'eyebrow: "分類"', json: { eyebrow: "分類" } },
  value: { 記法: 'value: "42"', json: { value: "42" } },
  rows: { 記法: "rows: [ア, イ]", json: { rows: ["ア", "イ"] } },
  lane: { 記法: "lane: L1", json: { lane: "L1" } },
  stack: { 記法: "stack: 2", json: { stack: 2 } },
  initial: { 記法: "initial: true", json: { initial: true } },
  final: { 記法: "final: true", json: { final: true } },
  tone: { 記法: "tone: success", json: { tone: "success" } },
  nodes: {
    記法: "nodes: { header: { posX: 10, posY: 20 } }",
    json: { nodes: { header: { posX: 10, posY: 20 } } },
  },
  touchpoint: { 記法: 'touchpoint: "店頭"', json: { touchpoint: "店頭" } },
  opportunity: { 記法: 'opportunity: "改善"', json: { opportunity: "改善" } },
  owner: { 記法: 'owner: "私"', json: { owner: "私" } },
  end: { 記法: 'end: "Q2"', json: { end: "Q2" } },
  posX: { 記法: "posX: 100", json: { posX: 100 } },
  posY: { 記法: "posY: 200", json: { posY: 200 } },
  posW: { 記法: "posW: 300", json: { posW: 300 } },
  posH: { 記法: "posH: 80", json: { posH: 80 } },
  // 倍率は見本にしか効かない。 見本でない箱に書くと記法は誤りを返す (下の describe で見る)
  scale: { 記法: "kind: arc-gauge, scale: 2", json: { kind: "arc-gauge", scale: 2 } },
};

/**
 * 記法にしかない別名。 JSON は英語名だけを持つ。
 *
 * 別名は書かれた名前そのものを `scaleKeys` に残す (見本が同じ名前の状態を持つ時の知らせに使う)
 * ため、JSON に写すと名前が変わってしまう。 意味が同じことは別の検査で確かめる。
 */
const 記法だけの別名: Record<string, string> = { 倍率: "scale" };

/** 記法の 1 行から図を組み、最初の箱を返す */
function 記法の箱(中身: string): DslActor {
  const src = `title: "t"\ntype: flow\nactors:\n  - A: { ${中身} }\n  - B\nflow:\n  - A -> B: "x"\n`;
  const r = parseTextDslV05(src);
  if (!r.ok)
    throw new Error(`記法を読めない (${中身}): ${r.errors.map((e) => e.message).join(" / ")}`);
  const a = r.doc.actors[0];
  if (a === undefined) throw new Error(`箱が無い (${中身})`);
  return a;
}

/** JSON から図を組み、最初の箱を返す */
function JSONの箱(extra: Record<string, unknown>): DslActor {
  const json = {
    title: "t",
    type: "flow",
    actors: [{ name: "A", ...extra }, { name: "B" }],
    flow: [{ from: "A", to: "B", label: "x" }],
  } as unknown as DragonJson;
  const a = jsonToDoc(json).actors[0];
  if (a === undefined) throw new Error("箱が無い");
  return a;
}

/** 行番号を落として比べる (記法は書いた行、JSON は常に 0 なので必ず違う) */
function 行番号を落とす(a: DslActor): Omit<DslActor, "pos"> {
  const { pos: _pos, ...残り } = a;
  return 残り;
}

/**
 * 項目の並び順を揃えて文字列にする。
 *
 * 素の `JSON.stringify` は書いた順を保つため、**中身が同じでも並びが違うだけで違いとして出る**
 * (実測 = `partId` を書く位置が記法と JSON で違うだけの箱が食い違い扱いになった)。
 * 値が `undefined` の項目は `JSON.stringify` と同じく落とす (書かなかったのと同じ)。
 */
function 並びを揃えた文字列(o: object): string {
  return JSON.stringify(o, (_k, v: unknown) => {
    if (v === null || typeof v !== "object" || Array.isArray(v)) return v;
    const entries = Object.entries(v as Record<string, unknown>)
      .filter(([, x]) => x !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return Object.fromEntries(entries);
  });
}

describe("箱の項目が記法と JSON で揃っている (#1294)", () => {
  it("対応表が記法の項目を全て覆っている", () => {
    // 覆えていなければ、以下の走査はその項目を見ないまま通る
    expect(INLINE_ACTOR_KEYS.size, "記法の項目が空 (検査が空振りしている)").toBeGreaterThan(0);
    const 覆えていない = [...INLINE_ACTOR_KEYS].filter(
      (k) => !(k in 対応表) && !(k in 記法だけの別名),
    );
    expect(覆えていない, "記法にあって対応表に無い項目がある").toEqual([]);
    // 別名の指す先が対応表に無いと、別名を書いただけで覆えたことになる
    const 指す先が無い = Object.values(記法だけの別名).filter((k) => !(k in 対応表));
    expect(指す先が無い, "別名の指す先が対応表に無い").toEqual([]);
  });

  it("記法の別名は同じ倍率になる", () => {
    // JSON は英語名だけを持つため、別名が同じ意味であることは記法側で確かめる
    expect(記法の箱("kind: arc-gauge, 倍率: 2").scale).toBe(
      記法の箱("kind: arc-gauge, scale: 2").scale,
    );
    expect(記法の箱("kind: arc-gauge, 倍率: 2").scaleKeys).toEqual(["倍率"]);
  });

  it("同じ意味を書くと同じ箱になる", () => {
    const 対象 = [...INLINE_ACTOR_KEYS].filter((k) => !(k in 記法だけの別名));
    let 測れた = 0;
    const 食い違い: string[] = [];
    for (const key of 対象) {
      const 対 = 対応表[key];
      if (対 === undefined) continue;
      測れた += 1;
      const 記法 = 並びを揃えた文字列(行番号を落とす(記法の箱(対.記法)));
      const json = 並びを揃えた文字列(行番号を落とす(JSONの箱(対.json)));
      if (記法 !== json) 食い違い.push(`${key} (記法: ${記法}, JSON: ${json})`);
    }
    expect(測れた, "項目を 1 つも測れていない (検査が空振りしている)").toBe(対象.length);
    expect(食い違い, "記法と JSON で別の箱になる項目がある").toEqual([]);
  });

  it("書かない時と書いた時で図が変わる", () => {
    // 「同じ箱になる」 だけでは、両方が同じように無視していても通る
    const 何も起きない: string[] = [];
    for (const [key, 対] of Object.entries(対応表)) {
      const 素 = 並びを揃えた文字列(
        行番号を落とす(JSONの箱(key === "scale" ? { kind: "arc-gauge" } : {})),
      );
      const 書いた = 並びを揃えた文字列(行番号を落とす(JSONの箱(対.json)));
      if (素 === 書いた) 何も起きない.push(key);
    }
    expect(何も起きない, "JSON に書いても箱が変わらない項目がある").toEqual([]);
  });
});

describe("見本 (parts) でだけ意味を持つ項目 (#1294)", () => {
  it("見本の状態を上書きできる", () => {
    const 箱 = JSONの箱({ kind: "arc-gauge", state: { v: 50 } });
    expect(箱.stateOverride).toEqual({ v: 50 });
  });

  it("見本の色番号を渡せる", () => {
    const 箱 = JSONの箱({ kind: "arc-gauge", color: "#ff0000" });
    expect(箱.colorHex).toBe("#ff0000");
  });

  it("色の名前を書いた時は色番号ではなく色として読む", () => {
    // 記法の `color:` は番号と名前の両方を受ける (`splitColorValue`)。 JSON も同じにする
    const 箱 = JSONの箱({ color: "success" });
    expect(箱.colorHex).toBeUndefined();
    expect(箱.tone).toBe("success");
  });

  it("見本でない箱に状態を書くと誤りになる", () => {
    // 記法は読めない項目名として誤りを返す。 黙って捨てると「書いたのに効かない」 が残る
    const r = validateDragonJson({
      title: "t",
      type: "flow",
      actors: [{ name: "A", kind: "storage", state: { v: 50 } }, { name: "B" }],
      flow: [{ from: "A", to: "B", label: "x" }],
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.path)).toContain("$.actors[0].state");
  });

  it("見本でない箱に倍率を書くと誤りになる", () => {
    const r = validateDragonJson({
      title: "t",
      type: "flow",
      actors: [{ name: "A", scale: 2 }, { name: "B" }],
      flow: [{ from: "A", to: "B", label: "x" }],
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.path)).toContain("$.actors[0].scale");
  });
});

describe("2 軸で仕分ける図の軸の名前 (#1294)", () => {
  const 軸 = { x: { left: "低", right: "高" }, y: { bottom: "小", top: "大" } };

  it("記法と JSON が同じ軸になる", () => {
    const src = `title: "t"\ntype: quadrant\naxes:\n  x: { left: "低", right: "高" }\n  y: { bottom: "小", top: "大" }\nactors:\n  - A: "左上"\n`;
    const r = parseTextDslV05(src);
    if (!r.ok) throw new Error(r.errors.map((e) => e.message).join(" / "));
    const json = jsonToDoc({
      title: "t",
      type: "quadrant",
      actors: [{ name: "A", value: "左上" }],
      flow: [],
      axes: 軸,
    } as unknown as DragonJson);
    expect(json.axes).toEqual(r.doc.axes);
  });

  it("書かない時と書いた時で図が変わる", () => {
    const 素 = jsonToDoc({
      title: "t",
      type: "quadrant",
      actors: [{ name: "A", value: "左上" }],
      flow: [],
    } as unknown as DragonJson);
    expect(素.axes).toBeUndefined();
  });

  it("形が違う軸は誤りになる", () => {
    const r = validateDragonJson({
      title: "t",
      type: "quadrant",
      actors: [{ name: "A", value: "左上" }],
      flow: [],
      axes: { x: { left: 1 } },
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.path)).toContain("$.axes.x.left");
  });
});

describe("型が違う値は誤りになる (#1294)", () => {
  const 図 = (extra: Partial<JsonActor> & Record<string, unknown>) => ({
    title: "t",
    type: "flow",
    actors: [{ name: "A", ...extra }, { name: "B" }],
    flow: [{ from: "A", to: "B", label: "x" }],
  });

  const 誤り = [
    { name: "tone が文字列でない", input: { tone: 1 }, path: "$.actors[0].tone" },
    { name: "owner が文字列でない", input: { owner: 1 }, path: "$.actors[0].owner" },
    { name: "posX が数でない", input: { posX: "x" }, path: "$.actors[0].posX" },
    { name: "posX が有限でない", input: { posX: Number.NaN }, path: "$.actors[0].posX" },
    { name: "nodes が object でない", input: { nodes: 1 }, path: "$.actors[0].nodes" },
    {
      name: "nodes の中身が object でない",
      input: { nodes: { header: 1 } },
      path: "$.actors[0].nodes.header",
    },
    {
      name: "nodes の座標が数でない",
      input: { nodes: { header: { posX: "x" } } },
      path: "$.actors[0].nodes.header.posX",
    },
    {
      name: "scale が数でない",
      input: { kind: "arc-gauge", scale: "x" },
      path: "$.actors[0].scale",
    },
    { name: "color が文字列でない", input: { color: 1 }, path: "$.actors[0].color" },
  ];

  for (const c of 誤り) {
    it(c.name, () => {
      const r = validateDragonJson(図(c.input));
      expect(r.ok, `${c.name} が通ってしまう`).toBe(false);
      if (r.ok) return;
      expect(r.errors.map((e) => e.path)).toContain(c.path);
    });
  }
});
