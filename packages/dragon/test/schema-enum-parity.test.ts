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
  SHAPE_ORIENT_VALUES,
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
import { EDGE_REVEALS, RELATION_FOCUSES } from "@cardenelabs/cdl";
import { RELATIVE_DIRECTIONS } from "../src/relative-pos";

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
      out.push({ path, values: o.enum });
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
 * **逃げ道を置かない** (#1561)。 初版は「対応する一覧が実装に無い」 を理由付きで外せる欄を
 * 持っていたが、外した 1 件 (`shape.orient`) を調べると読み手は在り、値を 2 か所に直に
 * 書いていただけだった。 理由の欄は「調べずに外す」 を許す形なので消す。
 *
 * 突き合わせる一覧が本当に無い語が出たら、まず実装側に定数を切り出す。 切り出せないなら
 * その語は記法として受けていないので、schema から外す。
 */
const 対応表: Record<string, readonly string[]> = {
  type: [...PRESET_TYPES],
  // JSON は英語で書く。 正規の語 (`縦` / `横`) を除いた別名がそのまま JSON の語になる
  direction: Object.keys(DIRECTION_ALIAS).filter(
    (k) => !(DIRECTIONS as readonly string[]).includes(k),
  ),
  palette: [...PALETTES],
  reveal: [...EDGE_REVEALS],
  relations: [...RELATION_FOCUSES],
  "flow[].tone": 書ける色名(),
  "flow[].style": [...STYLE_VALID],
  "flow[].side": [...EDGE_SIDE_VALUES],
  "flow[].head": [...EDGE_HEAD_VALUES],
  "flow[].tailHead": [...EDGE_HEAD_VALUES],
  "flow[].headFill": [...EDGE_HEAD_FILL_VALUES],
  "flow[].tailHeadFill": [...EDGE_HEAD_FILL_VALUES],
  "flow[].relation": [...CLASS_RELATION_VALUES],
  "flow[].kind": [...SEQ_MESSAGE_VALUES],
  "flow[].role": [...EDGE_ROLE_VALUES],
  "animation[].draw": [...DRAW_WORDS],
  "events[].on": [...EVENT_KINDS],
  "readouts[].kind": Object.keys(部品の表),
  "inputs[].kind": Object.keys(つまみの表),
  "actors[].oneOf[1].tone": 書ける色名(),
  "actors[].oneOf[1].color.anyOf[0]": 書ける色名(),
  "actors[].oneOf[1].shape.kind": Object.keys(図形の表),
  "actors[].oneOf[1].shape.orient": [...SHAPE_ORIENT_VALUES],
  // 相対で置く時の向き (#2039)。 本文側と同じ一覧から取る
  "actors[].oneOf[1].posRel.dir": [...RELATIVE_DIRECTIONS],
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
      if (対応 === undefined) continue; // 載っていない行は別の検査が落とす
      照合した += 1;
      const 帳 = 並べ(e.values);
      const 実 = 並べ(対応);
      const schemaにだけ = 帳.filter((v) => !実.includes(v));
      const 実装にだけ = 実.filter((v) => !帳.includes(v));
      if (schemaにだけ.length > 0 || 実装にだけ.length > 0) {
        ずれ.push(
          `${e.path}: schemaにだけ [${schemaにだけ.join(", ")}] / 実装にだけ [${実装にだけ.join(", ")}]`,
        );
      }
    }
    // 照合した数を必ず見る。 0 件は「一致した」 ではなく「測っていない」
    const 照合するはず = Object.keys(対応表).length;
    expect(照合した, "1 件も照合していない (検査が空振りしている)").toBe(照合するはず);
    expect(ずれ, "公開 schema と実装で語が食い違う").toEqual([]);
  });
});
