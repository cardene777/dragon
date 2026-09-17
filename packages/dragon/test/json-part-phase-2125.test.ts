/**
 * JSON の箱に書く「見本の段を使うか」 (`phase`) の検証 (#2125)。
 *
 * 記法は中括弧に書いた名前をすべて状態の上書きへ入れるため `{ kind: wave-gauge, phase: false }`
 * がそのまま組み立てへ届く。 JSON は欄ごとに型を宣言する形なので、同じ名前を欄として受けるまで
 * **入口で書き方が分かれていた** = 記法では 1 つの名前で書けるものが、JSON では
 * `"state": { "phase": false }` と書き換えないと「知らない項目です」 で弾かれていた。
 *
 * ## 何を測るか
 *
 * 値は 型 → 登録表 → 分岐 の 3 層を通る (`rules/quality.md § 多層 SSOT 経路の全 registration 保証`)。
 * どの層で落ちても 1 本は落ちる形にする。
 *
 * | 層 | 落ちる検査 |
 * |---|---|
 * | 型 (`JsonActor.phase`) | 型検査。 本 file は実行時の値だけを見る |
 * | 登録表 (`ACCEPTED_KEYS.actor` / `欄の型表` / `見本にしか効かない欄`) | 「欄として受ける」「真偽以外を弾く」「普通の箱では誤り」 |
 * | 分岐 (`段を含めた上書き`) | 「上書きへ届く」「書かない時は作らない」「記法と同じ図になる」 |
 */
import { describe, it, expect } from "vitest";

import { diagram, type PhaseBuilder } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

import { textDslToDiagram } from "../src/index";
import {
  jsonToDiagram,
  jsonToDoc,
  validateDragonJson,
  type DragonJson,
} from "../src/json-parser";

/** 段を 1 つ持ち、その段で値を動かす見本 */
const 見本 = diagram("parts-probe-gauge", { topic: "検査用の見本" })
  .lane("l", { x: 0, width: 400 })
  .state("lv", { initial: 0 })
  .node("gauge", {
    lane: "l",
    stack: 0,
    kind: "dyn-rect",
    title: "水位",
    subtitle: "{lv}%",
    w: 380,
    h: 300,
    shape: { kind: "rect", source: "{lv}", fillMax: 100, orient: "up", fill: "#4e9dc4" },
  })
  .phase("p", { duration: 3000, title: "満ちる", body: "" }, (p: PhaseBuilder) =>
    p.activate("gauge").tween("lv", 0, 90),
  )
  .build();

const 一覧: Record<string, CdlDiagram> = { "parts-probe-gauge": 見本, "probe-gauge": 見本 };

const 図 = (actor: Record<string, unknown>): DragonJson =>
  ({
    title: "段の指定",
    type: "flow",
    actors: [actor],
    flow: [],
  }) as unknown as DragonJson;

/** 段の中身 (点灯と値の動き) が空かどうか */
const 段が空か = (d: CdlDiagram): boolean[] =>
  d.phases.map((p) => p.activate.length === 0 && (p.tweens ?? []).length === 0);

describe("JSON の箱に書く見本の段の指定 (#2125)", () => {
  it("欄として受ける", () => {
    const r = validateDragonJson(図({ name: "g", kind: "probe-gauge", phase: false }));
    expect(r.ok, JSON.stringify(r.ok ? [] : r.errors)).toBe(true);
  });

  it("真偽でない値は欄を指して弾く", () => {
    const r = validateDragonJson(図({ name: "g", kind: "probe-gauge", phase: "no" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.path)).toContain("$.actors[0].phase");
  });

  it("普通の箱に書くと誤りになる", () => {
    const r = validateDragonJson(図({ name: "g", kind: "card", phase: false }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const 該当 = r.errors.filter((e) => e.path === "$.actors[0].phase");
    expect(該当, "普通の箱の phase を誤りにしていない").not.toHaveLength(0);
    expect(該当[0]?.hint, "代わりに何を書くかを案内していない").toBeTruthy();
  });

  it("状態の上書きへ届く", () => {
    const doc = jsonToDoc(図({ name: "g", kind: "probe-gauge", phase: false }));
    expect(doc.actors[0]?.stateOverride).toMatchObject({ phase: false });
  });

  it("書かない時は上書きに段の欄を作らない", () => {
    const doc = jsonToDoc(図({ name: "g", kind: "probe-gauge" }));
    expect(doc.actors[0]?.stateOverride ?? {}).not.toHaveProperty("phase");
  });

  it("状態の上書きに書いた値と混ざる", () => {
    const doc = jsonToDoc(
      図({ name: "g", kind: "probe-gauge", phase: false, state: { lv: 40 } }),
    );
    expect(doc.actors[0]?.stateOverride).toMatchObject({ lv: 40, phase: false });
  });
});

describe("記法と JSON が同じ図になる (#2125)", () => {
  const 記法で段を外す = textDslToDiagram(
    `title: "段の指定"
type: flow

actors:
  - g: { kind: probe-gauge, phase: false }
`,
    { partsCatalog: 一覧 },
  );
  const 記法で段を残す = textDslToDiagram(
    `title: "段の指定"
type: flow

actors:
  - g: { kind: probe-gauge }
`,
    { partsCatalog: 一覧 },
  );

  it("外した図と残した図が別物である (空振り防止)", () => {
    expect(段が空か(記法で段を外す)).toEqual([true]);
    expect(段が空か(記法で段を残す)).toEqual([false]);
  });

  it("欄で書いた JSON が記法と同じ図になる", () => {
    const 外した = jsonToDiagram(図({ name: "g", kind: "probe-gauge", phase: false }), {
      partsCatalog: 一覧,
    });
    expect(JSON.stringify(外した)).toBe(JSON.stringify(記法で段を外す));
  });

  it("書かない JSON も記法と同じ図になる", () => {
    const 残した = jsonToDiagram(図({ name: "g", kind: "probe-gauge" }), { partsCatalog: 一覧 });
    expect(JSON.stringify(残した)).toBe(JSON.stringify(記法で段を残す));
  });

  it("状態の中に書いた形と欄で書いた形が同じ上書きになる", () => {
    const 欄 = jsonToDoc(図({ name: "g", kind: "probe-gauge", phase: false }));
    const 中 = jsonToDoc(図({ name: "g", kind: "probe-gauge", state: { phase: false } }));
    expect(欄.actors[0]?.stateOverride).toEqual(中.actors[0]?.stateOverride);
  });
});
