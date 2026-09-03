/**
 * 公開 schemaの語の一覧が実装と一致していることの検証 (#1559)。
 *
 * 記法の語は 2 か所に書いてある。 実装の一覧 (`EDGE_HEAD_VALUES` / `PALETTES` 等) と、
 * LLM に渡す公開 schema (`src/schemas/diagram.json`) の `enum`。 突き合わせる経路が無いと、
 * 片方に語を足した時に **記法では通るのに JSON では弾かれる** (逆も) 形が黙って生まれる。
 *
 * 先例は 1 件だけあった (`json-unknown-keys.test.ts` が `side` を手で照合している) が、
 * 残る 21 件は無防備だった。 手で 1 件ずつ並べる形は、次に足す語で同じ抜けを作る。
 *
 * ## 母集団は schema から導く
 *
 * 対象を手で挙げない。 schema を歩いて `enum` を全部集め、その全てが下の対応表に載って
 * いることを見る。 **schema に語の一覧を足すと、対応表に書くまで検査が落ちる**。
 *
 * ## 分岐の目印は構造で外す
 *
 * `oneOf` の枝が自分を名乗るために置く `enum` (`readouts[].oneOf[16].kind` 等) は、実装の
 * 一覧に対応しない。 これを手で除くと、枝が増えるたびに取り残される。
 *
 * **親に同じ名前の `enum` があるか** で機械的に判定する = 枝の目印は必ず、その union 全体を
 * 表す `enum` (`readouts[].kind`) と対になっている。
 */
import { describe, it, expect } from "vitest";
import schema from "../src/schemas/diagram.json" with { type: "json" };
import {
  PRESET_TYPES,
  STYLE_VALID,
  EDGE_SIDE_VALUES,
  EDGE_HEAD_VALUES,
  EDGE_HEAD_FILL_VALUES,
  EDGE_ROLE_VALUES,
  CLASS_RELATION_VALUES,
  SEQ_MESSAGE_VALUES,
  EVENT_KINDS,
  DRAW_WORDS,
  図形の表,
  部品の表,
  つまみの表,
  書ける色名,
} from "../src/v05/parser";
import { PALETTES, DIRECTIONS, DIRECTION_ALIAS } from "../src/keywords";
import { EDGE_REVEALS } from "@cardenelabs/cdl";

/** schema の中の 1 つの語の一覧 */
interface 語の一覧 {
  readonly path: string;
  readonly values: readonly string[];
}

/**
 * schema を歩いて `enum` を全部集める。
 *
 * path は読みやすさのために `properties` と `items` を畳む (`$.properties.flow.items` →
 * `flow[]`)。 対応表の鍵と同じ形にすることで、落ちた時に「どれを足せばよいか」 が読める。
 */
function schemaの語の一覧(): 語の一覧[] {
  const out: 語の一覧[] = [];
  const 歩く = (node: unknown, path: string): void => {
    if (Array.isArray(node)) {
      node.forEach((v, i) => 歩く(v, `${path}[${i}]`));
      return;
    }
    if (typeof node !== "object" || node === null) return;
    const o = node as Record<string, unknown>;
    if (Array.isArray(o.enum) && o.enum.every((v) => typeof v === "string")) {
      out.push({ path, values: o.enum as string[] });
    }
    for (const [k, v] of Object.entries(o)) {
      if (k === "enum") continue;
      歩く(v, `${path}.${k}`);
    }
  };
  歩く(schema, "$");
  return out.map((e) => ({
    ...e,
    path: e.path.replace(/\.properties/g, "").replace(/\.items/g, "[]").replace(/^\$\./, ""),
  }));
}

/**
 * `oneOf` の枝が自分を名乗る目印か。
 *
 * 親に同じ名前の `enum` があれば目印とみなす。 実装の一覧に対応しないので照合の対象外。
 */
function 分岐の目印か(path: string, 全部: ReadonlySet<string>): boolean {
  const m = /^(.*)\.oneOf\[\d+\]\.([A-Za-z0-9_]+)$/.exec(path);
  return m !== null && 全部.has(`${m[1]!}.${m[2]!}`);
}

/**
 * schemaの語の一覧と、それを決めている実装の一覧の対応。
 *
 * `実装` を書いた行は値まで突き合わせる。 `理由` を書いた行は照合しない = 対応する一覧が
 * 実装に無いことを明示する逃げ道で、**理由を書かせることで無自覚な素通りを止める**。
 */
type 対応 = { readonly 実装: readonly string[] } | { readonly 理由: string };

const 対応表: Record<string, 対応> = {
  type: { 実装: [...PRESET_TYPES] },
  direction: {
    // JSON は英語で書く。 正規の語 (`縦` / `横`) を除いた別名がそのまま JSON の語になる
    実装: Object.keys(DIRECTION_ALIAS).filter((k) => !(DIRECTIONS as readonly string[]).includes(k)),
  },
  palette: { 実装: [...PALETTES] },
  reveal: { 実装: [...EDGE_REVEALS] },
  "flow[].tone": { 実装: 書ける色名() },
  "flow[].style": { 実装: [...STYLE_VALID] },
  "flow[].side": { 実装: [...EDGE_SIDE_VALUES] },
  "flow[].head": { 実装: [...EDGE_HEAD_VALUES] },
  "flow[].tailHead": { 実装: [...EDGE_HEAD_VALUES] },
  "flow[].headFill": { 実装: [...EDGE_HEAD_FILL_VALUES] },
  "flow[].tailHeadFill": { 実装: [...EDGE_HEAD_FILL_VALUES] },
  "flow[].relation": { 実装: [...CLASS_RELATION_VALUES] },
  "flow[].kind": { 実装: [...SEQ_MESSAGE_VALUES] },
  "flow[].role": { 実装: [...EDGE_ROLE_VALUES] },
  "animation[].draw": { 実装: [...DRAW_WORDS] },
  "events[].on": { 実装: [...EVENT_KINDS] },
  "readouts[].kind": { 実装: Object.keys(部品の表) },
  "inputs[].kind": { 実装: Object.keys(つまみの表) },
  "actors[].oneOf[1].tone": { 実装: 書ける色名() },
  "actors[].oneOf[1].color.anyOf[0]": { 実装: 書ける色名() },
  "actors[].oneOf[1].shape.kind": { 実装: Object.keys(図形の表) },
  "actors[].oneOf[1].shape.orient": {
    理由:
      "図形の向き 4 値。 記法側に読み手が無く (`図形の表` は欄の名前だけを持つ)、" +
      "描画側の型が持つ値を schema が直に書いている。 突き合わせる一覧が実装に無い",
  },
};

const 並べ = (x: Iterable<string>): string[] => [...new Set(x)].sort();

describe("公開 schemaの語の一覧が実装と一致する (#1559)", () => {
  const 全部 = schemaの語の一覧();
  const path集合 = new Set(全部.map((e) => e.path));
  const 対象 = 全部.filter((e) => !分岐の目印か(e.path, path集合));

  it("schema から語の一覧を読めている", () => {
    // 0 件だと下の照合が「対象なし」 で素通りする
    expect(全部.length, "schema から語の一覧を 1 つも読めていない").toBeGreaterThan(0);
    expect(対象.length, "照合する語の一覧が 1 つも無い (分岐の判定が広すぎる)").toBeGreaterThan(0);
    // 内訳を出す。 数だけ見ると、分岐の判定が壊れて全部が外れても気付けない
    expect(
      全部.length - 対象.length,
      "分岐の目印を 1 つも外せていない (判定が噛み合っていない)",
    ).toBeGreaterThan(0);
  });

  it("全ての語の一覧が対応表に載っている", () => {
    const 載っていない = 対象.map((e) => e.path).filter((p) => !Object.hasOwn(対応表, p));
    expect(
      載っていない,
      "schema に語の一覧を足したら、実装のどの一覧が決めているかを対応表に書く",
    ).toEqual([]);
  });

  it("対応表に schema に無い行が残っていない", () => {
    // 使われない行が溜まると、対応表が実物と離れていく
    const 余り = Object.keys(対応表).filter((p) => !対象.some((e) => e.path === p));
    expect(余り, "schema から消えた語の一覧が対応表に残っている").toEqual([]);
  });

  it("語が実装と一致している", () => {
    const ずれ: string[] = [];
    let 照合した = 0;
    for (const e of 対象) {
      const 対応 = 対応表[e.path];
      if (対応 === undefined || "理由" in 対応) continue; // 別の検査が落とす / 照合しない行
      照合した += 1;
      const 帳 = 並べ(e.values);
      const 実 = 並べ(対応.実装);
      const schemaにだけ = 帳.filter((v) => !実.includes(v));
      const 実装にだけ = 実.filter((v) => !帳.includes(v));
      if (schemaにだけ.length > 0 || 実装にだけ.length > 0) {
        ずれ.push(
          `${e.path}: schemaにだけ [${schemaにだけ.join(", ")}] / 実装にだけ [${実装にだけ.join(", ")}]`,
        );
      }
    }
    // 照合した数を必ず見る。 0 件は「一致した」 ではなく「測っていない」
    const 照合するはず = Object.values(対応表).filter((v) => "実装" in v).length;
    expect(照合した, "1 件も照合していない (検査が空振りしている)").toBe(照合するはず);
    expect(ずれ, "公開 schema と実装で語が食い違う").toEqual([]);
  });
});
