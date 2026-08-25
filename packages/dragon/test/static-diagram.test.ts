import { describe, it, expect } from "vitest";
import { compileToCdl } from "../src/compile";
import type {
  DslActor,
  DslDocument,
  DslPhase,
  DslStep,
  PresetType,
} from "../src/types";

/**
 * 動かない図が種類を問わず描けることの検証 (#1086)。
 *
 * 描画側は段 (`phase`) が 1 件以上あることを要求する。 一方で段を作るかどうかは種類ごとに
 * ばらけており、 `animation:` を書かない同じ記法を 12 種に与えると 6 種だけが描かれ、 残り
 * 6 種は「phase が 0 件です」 で弾かれていた。
 *
 * ## 段の数を見る
 *
 * 「描けたか」 は実 render 側 (`apps/playground-spa/tests/static-diagram.spec.ts`) が見る。
 * ここでは段の数と中身を見る = 段が 1 件入ること、 既にある図では増えないこと、 入れた段が
 * 全要素を光らせること。
 */

const TYPES: readonly PresetType[] = [
  "sequence",
  "flow",
  "swimlane",
  "er",
  "state",
  "topology",
  "solidity",
  "gantt",
  "class",
  "pie",
  "c4",
  "mind",
];

/**
 * 手で組む fixture の既定 (#1415)。
 *
 * `DslActor` / `DslStep` / `DslPhase` / `DslDocument` は記法の位置 (`pos`) を必須で持つ。
 * 解析が埋める metadata で、誤りを知らせる時に「何行目の指定か」 を出すために使う。
 * 手で組む fixture には行が無いので置き場所だけ埋める。
 *
 * `kind` と `no` も同じ。 記法では省ける (解析が既定を入れる) が、型としては必須。
 *
 * **`as` で潰さない**。 潰すと本当に必要な項目を書き忘れた時も通ってしまう。
 */
const 箱 = (name: string, o: Partial<Omit<DslActor, "name" | "pos">> = {}): DslActor => ({
  kind: "actor",
  ...o,
  name,
  pos: { line: 1 },
});

const 矢印 = (
  from: string,
  to: string,
  label: string,
  o: Partial<Omit<DslStep, "from" | "to" | "no" | "pos" | "label">> = {},
): DslStep => ({ ...o, no: 1, from, to, label, pos: { line: 1 } });

const 段 = (o: Omit<DslPhase, "pos"> & Partial<DslPhase>): DslPhase => ({ pos: { line: 1 }, ...o });

const 静止図 = (type: PresetType): DslDocument => ({
  title: `静止 ${type}`,
  type,
  pos: { line: 1 },
  actors: [箱("A", { subtitle: "Q1" }), 箱("B", { subtitle: "Q2" })],
  flow: [矢印("A", "B", "進む")],
});

describe("動かない図に段が 1 つ入る (#1086)", () => {
  for (const type of TYPES) {
    it(`type: ${type} で段が 1 件以上になる`, () => {
      const d = compileToCdl(静止図(type));
      expect(d.phases.length, `段が 0 件 (描画側に弾かれる): ${type}`).toBeGreaterThan(0);
    });
  }

  it("入れた段が節点と線の両方を光らせる", () => {
    // 光らせない段を入れても描かれはするが、 全要素が主役でない状態 (薄い表示) になり
    // 動かない図として読めない
    const d = compileToCdl(静止図("swimlane"));
    expect(d.phases).toHaveLength(1);
    const activate = new Set(d.phases[0]!.activate);
    expect(d.nodes.length, "節点が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    expect(d.edges.length, "線が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    for (const n of d.nodes) expect(activate.has(n.id), `節点が光らない: ${n.id}`).toBe(true);
    for (const e of d.edges) expect(activate.has(e.id), `線が光らない: ${e.id}`).toBe(true);
  });

  it("段の見出しは図の題になる", () => {
    const d = compileToCdl(静止図("pie"));
    expect(d.phases[0]!.title).toBe("静止 pie");
  });

  it("要素が 1 つも無い図でも段は入る", () => {
    // 描画側が要求するのは段の存在であって中身ではない。 ここで諦めると「空の図は描けない」
    // という別の欠落になる
    const d = compileToCdl({
      title: "空",
      type: "swimlane",
      pos: { line: 1 },
      actors: [],
      flow: [],
    });
    expect(d.phases).toHaveLength(1);
    expect(d.phases[0]!.activate).toEqual([]);
  });
});

describe("既に段がある図には入れない (#1086)", () => {
  it("animation を書いた図で段が増えない", () => {
    const doc: DslDocument = {
      ...静止図("swimlane"),
      animate: {
        pos: { line: 1 },
        states: [],
        phases: [
          段({ name: "いち", durationMs: 1000, highlight: ["A"] }),
          段({ name: "に", durationMs: 1000, highlight: ["B"] }),
        ],
      },
    };
    const d = compileToCdl(doc);
    expect(d.phases.map((p) => p.title), "書いた段と違う").toEqual(["いち", "に"]);
  });

  it("描画側が段を作る種類でも段が増えない", () => {
    // `type: flow` の描画は中で段を 1 つ作る。 ここに更に足すと 2 件になる
    const d = compileToCdl(静止図("flow"));
    expect(d.phases).toHaveLength(1);
    expect(d.phases[0]!.id, "入れた段が既存の段を押しのけている").not.toBe("static");
  });

  it("段を 1 つだけ書いた図でも増えない", () => {
    const doc: DslDocument = {
      ...静止図("pie"),
      animate: {
        pos: { line: 1 },
        states: [],
        phases: [段({ name: "ひとつ", durationMs: 800, highlight: ["A"] })],
      },
    };
    const d = compileToCdl(doc);
    expect(d.phases).toHaveLength(1);
    expect(d.phases[0]!.title).toBe("ひとつ");
  });
});
