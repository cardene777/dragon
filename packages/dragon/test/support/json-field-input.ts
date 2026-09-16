/**
 * JSON 入口の検査を、 **欄 1 つだけを差し替えた入力** で測るための組み立て役。
 *
 * 知らない項目の検査 (`#1295`) と値の型の検査 (`#1304`) は、 どちらも
 * 「`ACCEPTED_KEYS` の全欄に対して 1 欄ずつ値を置き、 誤りが出るか / 出ないか」 を見る。
 * 置き方 (どの階層のどこに埋めるか) を両方の検査が別々に持つと、 階層が増えた時に
 * 片方だけが古くなる。 組み立てはここ 1 箇所に置く。
 *
 * `.test.ts` ではないため vitest の収集対象にならない (`packages/**\/test\/**\/*.test.ts`)。
 */
import { type 階層, 見本にしか効かない欄 } from "../../src/json-parser";

/** 最小の図。 差し替えたい欄だけを上書きして使う */
export const 図 = (o: Record<string, unknown> = {}): Record<string, unknown> => ({
  title: "t",
  type: "flow",
  actors: [{ name: "A" }, { name: "B" }],
  flow: [{ from: "A", to: "B", label: "x" }],
  ...o,
});

/**
 * 箱の種類を欄から決める (#1308)。
 *
 * どちらの箱にしか効かないかで分かれる欄があり、**片方に固定できない**。
 *
 * | 欄 | 使う種類 | 固定すると |
 * |---|---|---|
 * | `state` / `scale` (見本にしか効かない) | 見本 (`arc-gauge`) | 普通の箱では #1294 の誤りが混ざる |
 * | `tone` / `owner` / `end` / `touchpoint` / `opportunity` (普通の箱にしか効かない) | 普通 (`card`) | 見本では #1308 の誤りが混ざる |
 * | それ以外 | 普通 (`card`) | どちらでも通る |
 *
 * 一覧は実装の表から導く = 表に欄が増えた時に、ここだけ古い種類を使い続ける形を作らない。
 */
function 箱の種類(key: string): string {
  return (見本にしか効かない欄 as readonly string[]).includes(key) ? "arc-gauge" : "card";
}

/** その階層の `key` に `v` を置いた入力を組む */
export function 欄に値を置く(層: 階層, key: string, v: unknown): Record<string, unknown> {
  switch (層) {
    case "root":
      return 図({ [key]: v });
    case "actor":
      return 図({ actors: [{ name: "A", kind: 箱の種類(key), [key]: v }, { name: "B" }] });
    case "step":
      return 図({ flow: [{ from: "A", to: "B", label: "x", [key]: v }] });
    case "phase":
      return 図({ states: { v: 0 }, animation: [{ step: "s1", [key]: v }] });
    case "viewport":
      return 図({ viewport: { [key]: v } });
    case "lane":
      return 図({ lanes: { L1: { [key]: v } } });
    case "group":
      return 図({ lanes: { L1: {} }, groups: { G1: { lanes: ["L1"], [key]: v } } });
    case "axes":
      return 図({ type: "quadrant", axes: { [key]: v } });
    case "axesX":
      return 図({ type: "quadrant", axes: { x: { [key]: v } } });
    case "axesY":
      return 図({ type: "quadrant", axes: { y: { [key]: v } } });
    case "layoutPos":
      return 図({ actors: [{ name: "A", pos: { x: 1, y: 2, [key]: v } }, { name: "B" }] });
    case "posRel": {
      // 相対で置く指定 (#2039)。 基準は 2 つ目の箱にする = 自分を基準にすると別の誤りが混ざる
      const rel = { anchor: "B", dir: "right", [key]: v };
      // **基準に置いた名前は実在させる**。 実在しない名前は「相手が居ない」 の誤りになり、
      // いま測りたい欄の型の誤りと混ざる。 型として読めない値 (数 / 空文字) はそのまま置く =
      // その形は型の側が誤りにするので、居ない相手としては数えられない
      const 足す = typeof v === "string" && v !== "" && key === "anchor" ? [{ name: v }] : [];
      return 図({ actors: [{ name: "A", posRel: rel }, { name: "B" }, ...足す] });
    }
  }
}

/** その階層の `key` に置いた値を指す誤りの path */
export function 欄のpath(層: 階層, key: string): string {
  switch (層) {
    case "root":
      return `$.${key}`;
    case "actor":
      return `$.actors[0].${key}`;
    case "step":
      return `$.flow[0].${key}`;
    case "phase":
      return `$.animation[0].${key}`;
    case "viewport":
      return `$.viewport.${key}`;
    case "lane":
      return `$.lanes.L1.${key}`;
    case "group":
      return `$.groups.G1.${key}`;
    case "axes":
      return `$.axes.${key}`;
    case "axesX":
      return `$.axes.x.${key}`;
    case "axesY":
      return `$.axes.y.${key}`;
    case "layoutPos":
      return `$.actors[0].pos.${key}`;
    case "posRel":
      return `$.actors[0].posRel.${key}`;
  }
}
