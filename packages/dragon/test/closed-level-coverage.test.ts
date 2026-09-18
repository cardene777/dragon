import { describe, it, expect } from "vitest";
import schema from "../src/schemas/diagram.json" with { type: "json" };
import { validateDragonJson, type JsonDslError } from "@cardenelabs/dragon";
import { 帯の項目 } from "../src/json-parser";

/**
 * 公開 schema が閉じた階層すべてが、知らない項目を誤りとして返すことの検証 (#2262)。
 *
 * ## 母数を実装の並びで決めていた
 *
 * 知らない項目の検査 (`json-unknown-keys.test.ts`) は `ACCEPTED_KEYS` の階層を回す。
 * schema が `additionalProperties: false` で閉じた階層のほうが多く (数える先は下の
 * `閉じた階層たち()`)、**残りがその検査の外に居た**。
 *
 * 外に居た階層のうち、素通りしていたのは帯 (`$.bands[]`) だけだった。
 * 残りはたまたま別の経路で弾いていた。 帯は `{ actor, from, to, ぬけ }` を渡すと
 * 誤り 0 件で返る一方、同じ入力を公開 schema で検証すると `additionalProperties` 違反で落ちる。
 *
 * **たまたま弾いていたことは、次も弾く根拠にならない**。 母数を schema から導き、
 * 閉じた階層を足したら確かめる入力を書くまで落ちる形にする。
 *
 * ## 入力は手で書く
 *
 * 階層に届く「正しい図」 は機械で作れない。 帯は順序図にしか無く、部品は種類ごとに
 * 必須の項目が違い、式の組は他の項目から参照される。 **母数だけを導き、入力は手で書く**。
 *
 * 書き忘れは下の「確かめる入力が全ての階層にある」 が落とす = 手で書くのは入力であって、
 * 何を確かめるかの一覧ではない。
 *
 * ## 閉じていない階層は対象外
 *
 * `oneOf` の枝が自分を名乗るために置く階層 (`readouts[]<oneOf>[16]` 等) は
 * schema が開いていると宣言している。 **弾かないことが正しい**ので母数に入れない。
 * 判定は `additionalProperties === false` だけを見る。
 */

/** schema の中の 1 つの閉じた階層 */
interface 閉じた階層 {
  readonly path: string;
  readonly keys: readonly string[];
}

/**
 * schema を歩いて `additionalProperties: false` の階層を全部集める。
 *
 * path は読みやすさのために `properties` と `items` を畳む
 * (`$.properties.bands.items` → `$.bands[]`)。 下の入力表の鍵と同じ形にすることで、
 * 落ちた時に「どれを足せばよいか」 が読める。
 */
function 閉じた階層たち(): 閉じた階層[] {
  const out: 閉じた階層[] = [];
  const 歩く = (node: unknown, path: string): void => {
    if (Array.isArray(node)) {
      node.forEach((v, i) => 歩く(v, `${path}[${i}]`));
      return;
    }
    if (typeof node !== "object" || node === null) return;
    const o = node as Record<string, unknown>;
    if (o.additionalProperties === false && typeof o.properties === "object" && o.properties !== null) {
      out.push({ path, keys: Object.keys(o.properties).sort() });
    }
    for (const [k, v] of Object.entries(o)) {
      if (k === "properties") {
        for (const [pk, pv] of Object.entries(v as Record<string, unknown>)) 歩く(pv, `${path}.${pk}`);
        continue;
      }
      歩く(v, k === "items" ? `${path}[]` : `${path}.${k}`);
    }
  };
  歩く(schema, "$");
  return out;
}

const 階層 = 閉じた階層たち();

/** どの階層にも足す、実装が受けない綴り。 日本語にして、実在の項目と紛れないようにする */
const 知らない項目 = "ぬけ";

/** 検査が通る最小の図。 各入力はこれに 1 つだけ足す */
const 基本 = {
  type: "sequence",
  title: "t",
  actors: [{ name: "A" }, { name: "B" }],
  flow: [{ from: "A", to: "B", label: "x" }],
  formulas: { src: { expression: "1" } },
};

type 図 = Record<string, unknown>;

/**
 * 階層ごとの「知らない項目を 1 つ足した入力」。
 *
 * 鍵は `閉じた階層たち()` が返す path と同じ形。
 * 全ての階層に入力があることを下の検査が見るので、schema に階層が増えたらここが落ちる。
 */
const 入力: Record<string, 図> = {
  $: { ...基本, [知らない項目]: 1 },
  "$.axes": { ...基本, type: "quadrant", axes: { [知らない項目]: {} } },
  "$.axes.x": { ...基本, type: "quadrant", axes: { x: { left: "低", right: "高", [知らない項目]: 1 } } },
  "$.axes.y": { ...基本, type: "quadrant", axes: { y: { top: "上", bottom: "下", [知らない項目]: 1 } } },
  "$.actors[].oneOf[1]": {
    ...基本,
    actors: [{ name: "A", [知らない項目]: 1 }, { name: "B" }],
  },
  "$.actors[].oneOf[1].pos": {
    ...基本,
    actors: [{ name: "A", pos: { x: 1, y: 2, [知らない項目]: 3 } }, { name: "B" }],
  },
  "$.actors[].oneOf[1].posRel": {
    ...基本,
    actors: [{ name: "A" }, { name: "B", posRel: { anchor: "A", dir: "right", [知らない項目]: 1 } }],
  },
  "$.actors[].oneOf[1].shape": {
    ...基本,
    actors: [{ name: "A", shape: { kind: "rect", [知らない項目]: 1 } }, { name: "B" }],
  },
  "$.flow[]": { ...基本, flow: [{ from: "A", to: "B", label: "x", [知らない項目]: 1 }] },
  "$.flow[].pos": {
    ...基本,
    flow: [{ from: "A", to: "B", label: "x", pos: { x: 1, y: 2, [知らない項目]: 3 } }],
  },
  "$.animation[]": { ...基本, animation: [{ step: "s1", [知らない項目]: 1 }] },
  "$.viewport": { ...基本, viewport: { width: 800, [知らない項目]: 1 } },
  "$.lanes.additionalProperties": { ...基本, lanes: { L1: { width: 300, [知らない項目]: 1 } } },
  "$.lanes.additionalProperties.pos": {
    ...基本,
    lanes: { L1: { pos: { x: 1, y: 2, [知らない項目]: 3 } } },
  },
  "$.groups.additionalProperties": {
    ...基本,
    lanes: { L1: {} },
    groups: { G1: { lanes: ["L1"], [知らない項目]: 1 } },
  },
  "$.readouts[]": {
    ...基本,
    readouts: [{ id: "r1", kind: "bar", source: "src", [知らない項目]: 1 }],
  },
  "$.readouts[].map[]": {
    ...基本,
    readouts: [
      { id: "r1", kind: "status-dot", source: "src", map: [{ value: "a", color: "accent", [知らない項目]: 1 }] },
    ],
  },
  "$.readouts[].colorMap[]": {
    ...基本,
    readouts: [
      {
        id: "r1",
        kind: "status-timeline",
        source: "src",
        colorMap: [{ status: "ok", color: "accent", [知らない項目]: 1 }],
      },
    ],
  },
  "$.readouts[].oneOf[17].map[]": {
    ...基本,
    readouts: [
      { id: "r1", kind: "badge", source: "src", map: [{ value: "a", color: "accent", [知らない項目]: 1 }] },
    ],
  },
  "$.inputs[]": { ...基本, inputs: [{ id: "i1", kind: "toggle", [知らない項目]: 1 }] },
  "$.inputs[].options[].oneOf[1]": {
    ...基本,
    inputs: [{ id: "i1", kind: "dropdown", options: [{ value: "a", label: "A", [知らない項目]: 1 }] }],
  },
  "$.formulas.additionalProperties.oneOf[1]": {
    ...基本,
    formulas: { f: { expression: "1", label: "x", [知らない項目]: 1 } },
  },
  "$.bands[]": { ...基本, bands: [{ actor: "A", from: 0, to: 1, [知らない項目]: 1 }] },
  "$.events[]": { ...基本, events: [{ on: "click", handler: "h", box: "A", [知らない項目]: 1 }] },
  "$.scrolls.additionalProperties": {
    ...基本,
    scrolls: { s: { start: 0, end: 1, scrub: true, label: "x", [知らない項目]: 1 } },
  },
};

/** 検証の結果から誤りの並びを取り出す。 通った時は空 */
function 誤り(図: 図): JsonDslError[] {
  const r = validateDragonJson(図);
  return r.ok ? [] : r.errors;
}

/** その入力を渡した時、知らない項目を名指しした誤りが返るか */
function 弾くか(図: 図): boolean {
  return 誤り(図).some((e) => JSON.stringify(e).includes(知らない項目));
}

describe("閉じた階層が知らない項目を弾く (#2262)", () => {
  it("閉じた階層を集められている", () => {
    // 0 件が「該当なし」 か「集められていない」 かを分けるための母数
    expect(階層.length, "閉じた階層を 1 件も集められていない").toBeGreaterThan(20);
  });

  it("確かめる入力が全ての階層にある", () => {
    const 無い = 階層.map((l) => l.path).filter((p) => !(p in 入力));
    expect(無い, "schema が閉じた階層に、確かめる入力が無い").toEqual([]);
  });

  it("使われない入力が無い", () => {
    // schema から階層が消えたのに入力だけ残ると、何も確かめない行が溜まる
    const path集合 = new Set(階層.map((l) => l.path));
    const 余り = Object.keys(入力).filter((p) => !path集合.has(p));
    expect(余り, "schema に無い階層の入力が残っている").toEqual([]);
  });

  it("どの階層も知らない項目を誤りとして返す", () => {
    const 素通り = 階層.map((l) => l.path).filter((p) => p in 入力 && !弾くか(入力[p]!));
    expect(素通り, "閉じた階層が知らない項目を素通りさせている").toEqual([]);
  });

  it("帯の受ける項目が schema の宣言と一致する (#2262)", () => {
    const 帯 = 階層.find((l) => l.path === "$.bands[]");
    expect(帯, "schema に帯の階層が無い").toBeDefined();
    expect([...帯の項目].sort(), "帯の受ける項目が schema とずれている").toEqual([...帯!.keys]);
  });

  it("正しい形は誤りにならない (陰性対照)", () => {
    // 何でも誤りにする判定だと、上の検査は弾いていなくても通る
    const 正しい = { ...基本, bands: [{ actor: "A", from: 0, to: 1 }] };
    expect(誤り(正しい), "正しい帯を誤りにしている").toEqual([]);
  });

  it("開いた階層を母数に入れない (陰性対照)", () => {
    // `oneOf` の枝が自分を名乗るために置く階層は、弾かないことが正しい
    const 枝 = 階層.filter((l) => l.keys.length === 1 && l.keys[0] === "kind");
    expect(枝.map((l) => l.path), "枝の目印を閉じた階層として数えている").toEqual([]);
  });
});
