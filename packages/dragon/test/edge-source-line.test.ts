import { describe, expect, it } from "vitest";

import { textDslToDiagram } from "../src/index";

/**
 * edge から DSL の行を辿れることを固定する (#998)。
 *
 * preset によっては書いた step と生成される edge が一致しない。 `type: flow` は actor を宣言順に
 * 一直線に並べ、 隣り合う actor の間に edge を引く = `a -> c` と書いても `a -> b` になる。
 * この対応が無いと、 edge を起点に本文を直す機能 (自動修正の書き戻し等) が別の行を書き換える。
 */

/** DSL を組み立て、 受け取り口への呼び出しを順に記録する。 */
function callsOf(dsl: string): Array<[string, number]> {
  const out: Array<[string, number]> = [];
  textDslToDiagram(dsl, { onEdgeSource: (id, line) => out.push([id, line]) });
  return out;
}

/** DSL を組み立て、 edge の id から行番号を引く表を返す。 */
function linesOf(dsl: string): Map<string, number> {
  return new Map(callsOf(dsl));
}

/** edge の id と label の対応。 */
function labelsOf(dsl: string): Map<string, string> {
  const d = textDslToDiagram(dsl);
  return new Map(d.edges.map((e) => [e.id, e.label]));
}

describe("行と edge の対応 (#998)", () => {
  it("`type: flow` で行順と edge 順が食い違っても対応が取れる", () => {
    // `compileFlow` は actor を宣言順に鎖状に繋ぎ、 label は「その actor を to に持つ step」 から
    // 拾う。 そのため `a -> c` / `c -> b` と書くと edge は `a -> b` / `b -> c` になる。
    const dsl = `title: "行順と edge 順が違う"
type: flow
actors:
  - a: service
  - b: service
  - c: service
flow:
  - a -> c: いち
  - c -> b: に
`;
    const labels = labelsOf(dsl);
    const lines = linesOf(dsl);

    // 前提の確認。 これが崩れたら本 test の意味が変わる。
    expect([...labels.values()], "preset の鎖の作り方が変わった").toEqual(["に", "いち"]);

    // `いち` を載せた edge は 8 行目 (`- a -> c: いち`)、 `に` は 9 行目。
    for (const [id, label] of labels) {
      const line = lines.get(id);
      expect(line, `${id} (${label}) の行が取れない`).toBeDefined();
      expect(dsl.split("\n")[line! - 1], `${id} の行がずれている`).toContain(label);
    }
  });

  it("step から直接 edge を作る preset でも対応が取れる", () => {
    const dsl = `title: "順序図"
type: sequence
actors:
  - user: actor
  - api: service
flow:
  - user -> api: 呼ぶ
  - api -> user: 返す
`;
    const labels = labelsOf(dsl);
    const lines = linesOf(dsl);
    expect(labels.size).toBe(2);
    for (const [id, label] of labels) {
      const line = lines.get(id);
      expect(line, `${id} (${label}) の行が取れない`).toBeDefined();
      expect(dsl.split("\n")[line! - 1]).toContain(label);
    }
  });

  it("対応が取れない edge は呼ばれない (行 0 で潰さない)", () => {
    // `type: flow` は actor の数だけ鎖を作るので、 step より edge が多くなる形がある。
    const dsl = `title: "step より edge が多い"
type: flow
actors:
  - a: service
  - b: service
  - c: service
flow:
  - a -> b: いち
`;
    const d = textDslToDiagram(dsl);
    const lines = linesOf(dsl);
    expect(d.edges.length, "鎖が 2 本にならない").toBe(2);
    // 対応が取れるのは step のある 1 本だけ。 残りは呼ばれない。
    expect(lines.size).toBe(1);
    for (const line of lines.values()) expect(line).toBeGreaterThan(0);
  });

  it("同じ相手への step が複数あっても別々の行に対応する", () => {
    const dsl = `title: "順序図で 2 回"
type: sequence
actors:
  - user: actor
  - api: service
flow:
  - user -> api: いち
  - user -> api: に
`;
    const lines = linesOf(dsl);
    expect(lines.size).toBe(2);
    expect(new Set(lines.values()).size, "同じ行を 2 度返している").toBe(2);
  });

  it("同じ edge に 2 度知らせない", () => {
    // 経路ごとにその場で呼ぶと、 同じ edge に別の行を 2 度知らせることになる
    // (codex review Round 1 の指摘)。
    const dsl = `title: "2 経路が当たる"
type: flow
actors:
  - a: service
  - b: service
flow:
  - c -> b: いち
  - a -> b: に
`;
    const calls = callsOf(dsl);
    expect(new Set(calls.map(([id]) => id)).size, "同じ edge を 2 度知らせている").toBe(calls.length);

    // 回数だけでなく **どちらの行を返すか** も見る。 `type: flow` では label の出どころが
    // preset の規則で決まるので、 汎用の (from, to) 照合が入れた値は上書きされる必要がある。
    const d = textDslToDiagram(dsl);
    for (const [id, line] of calls) {
      const label = d.edges.find((e) => e.id === id)?.label;
      if (label === undefined || label === "") continue;
      expect(dsl.split("\n")[line - 1], `${id} の行が label と食い違う`).toContain(label);
    }
  });

  it("名前が同じ slug になる形でも label の出どころと一致する", () => {
    // `slugify` を挟んだ照合にすると、 別の名前が同じ slug になる形で違う step を返す。
    const dsl = `title: "slug が衝突する"
type: flow
actors:
  - a: service
  - "API Gateway": service
flow:
  - a -> "API Gateway": ほんもの
`;
    const d = textDslToDiagram(dsl);
    const lines = linesOf(dsl);
    for (const e of d.edges) {
      const line = lines.get(e.id);
      if (line === undefined) continue;
      expect(dsl.split("\n")[line - 1], `${e.id} の行が label と食い違う`).toContain(e.label);
    }
  });

  it("受け取り口を渡さなければ何も変わらない", () => {
    const dsl = `title: "見本"
type: flow
actors:
  - a: service
  - b: service
flow:
  - a -> b: いち
`;
    expect(textDslToDiagram(dsl)).toEqual(textDslToDiagram(dsl, { onEdgeSource: () => undefined }));
  });
});
