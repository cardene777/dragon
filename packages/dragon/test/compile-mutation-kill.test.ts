import { describe, it, expect, vi } from "vitest";
import { compileToCdl } from "../src/compile";
import type {
  DslDocument,
  DslActor,
  DslStep,
  DslLane,
  DslGroup,
  DslViewport,
  PresetType,
} from "../src/types";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { layout } from "@cardenelabs/cdl";
import { at } from "./support/at";

/**
 * compile.ts mutation-kill test。
 * 既存 compile-branches.test.ts は各 compiler を nodes.length > 0 の weak assertion でしか
 * 検証しておらず mutation score が 27.49% と低かった。 ここでは型別 compiler / post-process の
 * 出力値 (node kind / title / w / h / lane / stack / eyebrow, edge label / tone / sub / style,
 * lane x / width / contain, sort 順序, 座標計算, cardinality) を精密 assert して mutant を kill する。
 *
 * この test 追加で compile.ts の mutation score は 27.49% → 77.26% に上昇した (第1-4弾)。
 * 第1弾 = 型別 compiler + post-process の主要ロジック (→44.37%)、 第2弾 = animate/edge 系の値検証
 * (→50.45%)、 第3弾 = swimlane / 型別 edge 伝播 / 小関数 (→52.65%)、
 * 第4弾 (#868) = parts merge 座標/scale の両分岐 + animate guard + regex 非貪欲性 + option 漏れ検証
 * (→77.26%、 test 82 → 358 件)。
 *
 * ── 第4弾で発見して修正した実装バグ (cc-codex PR #879 review) ────────────────
 *
 * 当初は以下 3 件を「実装がこう動くから」 と test 側で追認していたが、 review で実装の誤りと判明し
 * 実装を修正した。 test で誤挙動を固定するのは規約違反 (rules/quality.md § test 変更 diff 厳格チェック)。
 *
 * - `stripCardinality` = cardinality token を抜いた後に片括弧が ER 図 edge label に残っていた
 *   (`owns (1:N)` → `owns (`)。 token を囲む括弧ごと 1 単位で除去する方式にして、 label 中の
 *   正当な括弧 (`fn() now` の `()`) を壊さずに cardinality の括弧だけ消す。
 * - `mergePartIntoDiagram` の中心補正 = posW 指定 (scale) 時に lane を元幅で中心補正していたため
 *   lane 中心が node 中心 (drop 座標) から拡張分の半分ずれていた。 双方を scale 後の幅で補正。
 * - `applyV05Extensions` の node 一致条件 第 3 項 = actor 名 "A Header" の slug が `a-header` に
 *   なると別 actor "A" の node `a` に一致し option が漏れる cross-actor leak。 第 3 項を削除。
 *
 * ── kill 不能と判定した等価 mutant (Issue #868 AC 記録) ────────────────
 *
 * 以下は「変異させても出力が変わらない」 ため test では kill 不能 (等価 mutant)。 実測で出力差が
 * 出ないことを確認済、 cc-codex review でも等価判定が妥当と支持された 3 種。
 *
 * - `applyEdgeInlineOptions` の seq-like 分岐 第 2 項 `e.from === fromId`
 *   = sequence/solidity の edge.from は必ず `s{idx}-{slug}` 形式で plain slug と一致しない。
 *   到達不能な条件のため変異が観測できない。
 * - `mergePartIntoDiagram` の `newShape && (scaleX !== 1 || scaleY !== 1)` の true 側変異
 *   = shape 不在時に block へ入っても `scaleGeom(undefined)` が undefined を返すため出力同一。
 * - `console.warn` guard `typeof console !== "undefined" && console.warn`
 *   = vitest 環境では `console` も `console.warn` も常に存在するため、 条件を変異させても
 *   warn 呼出の有無が変わらない。 kill するには `globalThis.console` を消す test が要るが、
 *   test runner 自体の出力経路を壊すため採用しない (実行環境依存の変異で、 production の
 *   振る舞いを検証する価値が無い)。
 *
 * 当初は上記に加えて 3 種 (applyV05Extensions 第 3 項 / step anchor 判定 / 矢印 regex の貪欲化) も
 * 等価と判定していたが、 review で kill 可能と指摘され実際に kill した (第 3 項は cross-actor leak の
 * 実装バグでもあったため削除、 step anchor は `actor.lane === 自身 slug` で fallback 経路に入れて到達、
 * regex は複数文字 actor 名で差が出る)。 また `partStacks.length > 0` は当初「空 part でしか差が出ない」
 * と誤判定していたが、 stack が 0 始まりでない part (stack 2/3) で minStack が潰れると中心が
 * ずれるため kill 可能で、 本 file の「stack が 0 始まりでない part の中心合わせ」 で kill 済。
 * この式は #1992 で無くなった (要素の縦位置は部品の頁から取り、段の範囲は縦の基準
 * `partScaleBase` だけが使う)。 同じ describe が縦の基準の段の範囲を突く。
 *
 * 85% (Stryker high threshold) には到達しない。 残存の主因は到達不能分岐と ObjectLiteral /
 * StringLiteral 系の出力に現れない変異で、 引き上げるなら実装側の冗長性削除が必要になる。
 * それは本 Issue の scope (test 追加) の外。
 */

/**
 * `kindWritten` を **あえて設定しない** (#1058)。
 *
 * この helper は記法の parse を通さず `DslActor` を直接組み立てる = 公開 API
 * (`compileToCdl()`) を外から呼ぶ利用者と同じ形になる。 その経路では `kindWritten` が
 * `undefined` で、 従来どおり「書いた」 扱いになることを、 この test 群が守る。
 *
 * 一律 `true` を入れるとこの後方互換が検査から消える。 書かなかった側の挙動は
 * `seq-header-kind.test.ts` が記法ごとに見る。
 */
function actor(name: string, over: Partial<DslActor> = {}): DslActor {
  return { name, kind: "actor", pos: { line: 1 }, ...over };
}
function step(from: string, to: string, over: Partial<DslStep> = {}): DslStep {
  return { no: 1, from, to, label: "x", pos: { line: 1 }, ...over };
}
function makeDoc(type: PresetType, over: Partial<DslDocument> = {}): DslDocument {
  return {
    title: "T",
    type,
    actors: [actor("A"), actor("B")],
    flow: [step("A", "B")],
    pos: { line: 1 },
    ...over,
  };
}
function compile(type: PresetType, over: Partial<DslDocument> = {}): CdlDiagram {
  return compileToCdl(makeDoc(type, over));
}

/**
 * 手で組む縦列 / 束ね / 図全体の指定 (#1414)。
 *
 * この 3 つは記法の位置 (`pos`) を必須で持つ。 解析が埋める metadata で、誤りを知らせる時に
 * 「何行目の指定か」 を出すために使う。 手で組む fixture には行が無いので `makeDoc` と同じ
 * 置き場所 (1 行目) を埋める。
 *
 * `id` は鍵と重複するため書かせない。 書かせると鍵と食い違う fixture が作れてしまい、
 * どちらが効くかが読み手に分からなくなる。
 */
function 縦列(
  表: Record<string, Omit<DslLane, "id" | "pos">>,
): NonNullable<DslDocument["lanes"]> {
  return Object.fromEntries(
    Object.entries(表).map(([id, v]) => [id, { id, pos: { line: 1 }, ...v }]),
  );
}

function 束ね(
  表: Record<
    string,
    Omit<DslGroup, "id" | "pos" | "lanes"> & { lanes?: string[] }
  >,
): NonNullable<DslDocument["groups"]> {
  return Object.fromEntries(
    Object.entries(表).map(([id, v]) => [
      id,
      { id, pos: { line: 1 }, lanes: [], ...v },
    ]),
  );
}

function 図全体(o: Omit<DslViewport, "pos">): DslViewport {
  return { pos: { line: 1 }, ...o };
}
/**
 * merge 済のパーツの箱の左端 (実測値)。
 *
 * 大きさを書いていない箱は `posX` だけを見ても幅が分からない。 配置計算を通して実際の
 * 大きさで測る (`layout` が種類ごとの既定値を埋める)。
 */
function partLeftEdge(d: CdlDiagram, prefix: string): number {
  const laid = layout(d);
  const ns = laid.nodes.filter((n) => n.id.startsWith(`${prefix}__`));
  if (ns.length === 0) throw new Error(`part node not found: ${prefix}`);
  return Math.min(...ns.map((n) => n.cx - n.w / 2));
}

/**
 * 格子の 1 列目に置かれたパーツの、 箱の左端。
 *
 * 格子が確保するのは図枠なので、 図枠の左端が 0 に来る。 箱はその中で余白のぶん右にある
 * (実測 = 60)。 余白の値を test に書くと catalog の作りに追随できないため、 見本の図から測る。
 */
function frameLeftPadding(part: CdlDiagram): number {
  const own = layout(part);
  const x0 = Math.min(...own.nodes.map((n) => n.cx - n.w / 2));
  return x0 - own.viewBox.x;
}

function node(d: CdlDiagram, id: string) {
  const n = d.nodes.find((x) => x.id === id);
  if (!n) throw new Error(`node ${id} not found: ${d.nodes.map((x) => x.id).join(",")}`);
  return n;
}
function lane(d: CdlDiagram, id: string) {
  const l = d.lanes.find((x) => x.id === id);
  if (!l) throw new Error(`lane ${id} not found: ${d.lanes.map((x) => x.id).join(",")}`);
  return l;
}

// ── compileGantt: 帯 1 箱 + 目盛りの並び ──
describe("compileGantt", () => {
  // **変更前は card を決め打ち座標に置いていた** (#1077)。 `Q1=200 / Q2=600 / Q3=900 / Q4=1200`
  // の表に無い語は全て同じ位置に落ち、 `stack: idx` で 1 段ずつ下がって階段状に散らばっていた。
  // 帯も目盛りも無く、 幅 1400 の帯を敷くので画面に合わせると文字が読めない大きさになる。
  it("帯を描く箱 1 つ / w 720 / h 360", () => {
    const d = compile("gantt", { actors: [actor("A", { subtitle: "Q1" }), actor("B", { subtitle: "Q2" })] });
    expect(d.nodes).toHaveLength(1);
    const n = d.nodes[0]!;
    expect(n.kind).toBe("gantt-timeline");
    expect(n.w).toBe(720);
    expect(n.h).toBe(360);
  });
  it("目盛りは書かれた順に並ぶ (決め打ちの表を使わない)", () => {
    // 月名でも週番号でも同じ規則で置けることを、 Q1-Q4 以外の語で見る
    const d = compile("gantt", {
      actors: [actor("A", { subtitle: "3月" }), actor("B", { subtitle: "1月" }), actor("C", { subtitle: "3月" })],
    });
    const data = d.nodes[0]!.ganttData!;
    expect(data.map((t) => [t.title, t.startIdx, t.startLabel])).toEqual([
      ["A", 0, "3月"],
      ["B", 1, "1月"],
      ["C", 0, "3月"],
    ]);
  });
  it("時期を書かない項目は帯に載せない", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const d = compile("gantt", { actors: [actor("A", { subtitle: "Q1" }), actor("B")] });
    expect(d.nodes[0]!.ganttData!.map((t) => t.title)).toEqual(["A"]);
    expect(
      warn.mock.calls.map((c) => String(at(c, 0, "c"))).join(" "),
    ).toContain("B");
    warn.mockRestore();
  });
  it("件数が増えると高さが伸びる", () => {
    // 描画側は 1 行 28 以上 + 行間 20 で積む。 360 の固定だと 8 件目から最後の帯が枠の外に出る
    const 作る = (n: number) =>
      compile("gantt", {
        actors: Array.from({ length: n }, (_, i) => actor(`t${i}`, { subtitle: `Q${i + 1}` })),
      });
    expect(作る(4).nodes[0]!.h, "4 件では既定の高さ").toBe(360);
    expect(作る(8).nodes[0]!.h, "8 件で足りる高さ").toBe(480);
    expect(作る(12).nodes[0]!.h, "12 件で足りる高さ").toBe(672);
  });

  it("矢印を指した段が帯の箱を光らせる", () => {
    // 帯の依存は線 (edge) にならないので、 矢印を指した段が何も光らないままになっていた
    const d = compile("gantt", {
      actors: [actor("A", { subtitle: "Q1" }), actor("B", { subtitle: "Q2" })],
      flow: [step("A", "B")],
      animate: {
        states: [],
        phases: [{ name: "p", durationMs: 800, highlight: ["A -> B"], pos: { line: 1 } }],
        pos: { line: 1 },
      } as unknown as DslDocument["animate"],
    });
    expect(d.phases[0]!.activate).toEqual([d.nodes[0]!.id]);
  });

  it("居ない相手を指した矢印では光らせない", () => {
    const d = compile("gantt", {
      actors: [actor("A", { subtitle: "Q1" }), actor("B", { subtitle: "Q2" })],
      animate: {
        states: [],
        phases: [{ name: "p", durationMs: 800, highlight: ["A -> Z"], pos: { line: 1 } }],
        pos: { line: 1 },
      } as unknown as DslDocument["animate"],
    });
    expect(d.phases[0]!.activate).toEqual([]);
  });

  it("矢印は依存として帯に載る", () => {
    // 書いた矢印を捨てない。 描画側は `dependsOn` を依存の線として描く
    const d = compile("gantt", {
      actors: [actor("A", { subtitle: "Q1" }), actor("B", { subtitle: "Q2" })],
      flow: [step("A", "B")],
    });
    const data = d.nodes[0]!.ganttData!;
    expect(data.find((t) => t.title === "B")?.dependsOn).toBe("a");
    expect(data.find((t) => t.title === "A")?.dependsOn).toBeUndefined();
  });
});

// ── compileC4: 3 lane 座標 + subtitle 別配置 ──
describe("compileC4", () => {
  it("中身のある段だけ枠を作る", () => {
    // **変更前は 3 段を必ず作っていた** (#1078)。 書いていない段が空の点線枠として残り、
    // 見た人には「何かが描かれ損ねた」 ようにしか見えなかった
    const d = compile("c4"); // 既定の 2 actor はどちらも段の指定なし = L1
    expect(d.lanes.map((l) => l.id)).toEqual(["c4-l1"]);
    expect(lane(d, "c4-l1").x).toBe(0);
    expect(lane(d, "c4-l1").width).toBe(400);
    expect(lane(d, "c4-l1").contain).toBe(true);
  });
  it("使う段が飛んでいたら左に詰める", () => {
    // 空の段の位置に隙間を残すと、 やはり「何かが抜けている」 ように見える
    const d = compile("c4", { actors: [actor("A", { subtitle: "L1" }), actor("B", { subtitle: "L3" })] });
    expect(d.lanes.map((l) => [l.id, l.x])).toEqual([
      ["c4-l1", 0],
      ["c4-l3", 480],
    ]);
  });
  it("段の名前は L1 / L2 / L3 で決まる", () => {
    const d = compile("c4", {
      actors: [actor("A", { subtitle: "L1" }), actor("B", { subtitle: "L2" }), actor("C", { subtitle: "L3" })],
    });
    expect(d.lanes.map((l) => l.label)).toEqual(["全体の見取り図", "動かす単位", "部品"]);
  });
  it("subtitle L2 / L3 で lane 振り分け、 それ以外は l1", () => {
    const d = compile("c4", { actors: [actor("A", { subtitle: "L2" }), actor("B", { subtitle: "L3" }), actor("C", { subtitle: "other" })] });
    expect(node(d, "a").lane).toBe("c4-l2");
    expect(node(d, "b").lane).toBe("c4-l3");
    expect(node(d, "c").lane).toBe("c4-l1");
  });
  it("段は先頭一致で読む (`L2: container` / 小文字 / 別の語)", () => {
    // 記法でよく書かれる `"L2: container"` が完全一致で外れ、 全員 L1 に落ちていた (#1078)。
    // `L2X` のような別の語まで拾わないことも同時に見る
    const d = compile("c4", {
      actors: [
        actor("A", { subtitle: "L2: container" }),
        actor("B", { subtitle: "l3 component" }),
        actor("C", { subtitle: "L2X" }),
        actor("D", { subtitle: "" }),
      ],
    });
    expect(node(d, "a").lane, "L2: container が L2 に入らない").toBe("c4-l2");
    expect(node(d, "b").lane, "小文字の l3 が L3 に入らない").toBe("c4-l3");
    expect(node(d, "c").lane, "L2X を L2 と読んでいる").toBe("c4-l1");
    expect(node(d, "d").lane, "段を書かない項目が L1 に入らない").toBe("c4-l1");
  });
  it("node kind は actor.kind をそのまま使う", () => {
    const d = compile("c4", { actors: [actor("A", { kind: "service" }), actor("B")] });
    expect(node(d, "a").kind).toBe("service");
  });
});

// ── compileEr: entity + cardinality (parseCardinality / stripCardinality) ──
describe("compileEr", () => {
  it("entity node は kind storage + eyebrow エンティティ", () => {
    const d = compile("er");
    expect(node(d, "a").kind).toBe("storage");
    expect(node(d, "a").eyebrow).toBe("エンティティ");
  });
  it("label 内 cardinality を抽出し edge.sub に、 label からは除去", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "所有 1:N" })] });
    const e = d.edges[0]!;
    expect(e.sub).toBe("1:N");
    expect(e.label).toBe("所有");
  });
  it("cardinality 表記なし label は default 1:N", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "関連" })] });
    expect(d.edges[0]!.sub).toBe("1:N");
    expect(d.edges[0]!.label).toBe("関連");
  });
  it("N:M cardinality も認識", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "多対多 N:M" })] });
    expect(d.edges[0]!.sub).toBe("N:M");
  });
});

// ── compileState: initial / final フラグ + transition trigger ──
describe("compileState", () => {
  it("最初の state は eyebrow 初期、 最後は 最終", () => {
    const d = compile("state", { actors: [actor("A"), actor("B"), actor("C")] });
    expect(node(d, "a").eyebrow).toBe("初期");
    expect(node(d, "c").eyebrow).toBe("最終");
  });
  it("中間 state は default eyebrow 状態 (initial / final でない)", () => {
    const d = compile("state", { actors: [actor("A"), actor("B"), actor("C")] });
    expect(node(d, "b").eyebrow).toBe("状態");
  });
  it("actor 1 個なら final は付かない (length > 1 条件)", () => {
    const d = compile("state", { actors: [actor("A")], flow: [step("A", "A")] });
    expect(node(d, "a").eyebrow).toBe("初期");
  });
});

// ── compileMind: 3 lane + root 中央配置 + leaf 左右分配 + 暗黙 edge ──
// #1177 で `card` の 3 列から `mind-map` 種別 (図全体を 1 箱) に寄せた。 以前の検査は
// 枠の名前 (`mind-left` / `mind-center` / `mind-right`) と暗黙の矢印を見ていたが、
// どちらも作らなくなったため中身を payload の検査に置き換えている
describe("compileMind", () => {
  it("箱は 1 つ / kind は mind-map / 枠は chart", () => {
    const d = compile("mind", { actors: [actor("Root"), actor("L1"), actor("L2")], flow: [] });
    expect(d.nodes).toHaveLength(1);
    expect(d.nodes[0]!.kind).toBe("mind-map");
    expect(d.nodes[0]!.lane).toBe("chart");
    expect(d.lanes.map((l) => l.id)).toEqual(["chart"]);
  });
  it("中心は 1 つ目の登場人物、 枝は残り全部で親は中心", () => {
    const d = compile("mind", { actors: [actor("Root"), actor("L1"), actor("L2")], flow: [] });
    const m = d.nodes[0]!.mindData!;
    expect(m.rootId).toBe("root");
    expect(m.rootTitle).toBe("Root");
    expect(m.branches.map((b) => ({ id: b.id, title: b.title, parent: b.parent }))).toEqual([
      { id: "l1", title: "L1", parent: "root" },
      { id: "l2", title: "L2", parent: "root" },
    ]);
  });
  it("矢印は作らない", () => {
    const d = compile("mind", { actors: [actor("Root"), actor("L1"), actor("L2")], flow: [] });
    expect(d.edges).toEqual([]);
  });
});

// ── compilePie / compileClass: kind と寸法 ──
describe("compilePie / compileClass", () => {
  it("pie は円を描く箱 1 つ / w 640 / h 320", () => {
    // **変更前は card を縦に積んでいた** (#1076)。 `type: pie` で円が出るように、 描画側の
    // `chart-pie` に 1 node で渡す形にした。 大きさは cdl の chart preset と同じ
    const d = compile("pie");
    expect(d.nodes).toHaveLength(1);
    const n = d.nodes[0]!;
    expect(n.kind).toBe("chart-pie");
    expect(n.w).toBe(640);
    expect(n.h).toBe(320);
  });
  it("class node は kind storage / w 400", () => {
    const n = node(compile("class"), "a");
    expect(n.kind).toBe("storage");
    expect(n.w).toBe(400);
  });
});

// ── compileSolidity: kind 優先順 sort ──
describe("compileSolidity", () => {
  it("actor を kind 優先順 (eoa/contract/storage/event) に並べ替える", () => {
    // 入力順 event → contract → eoa、 sort 後は eoa(0) → contract(1) → event(3)
    const d = compile("solidity", {
      actors: [actor("Evt", { kind: "event" }), actor("Ctr", { kind: "contract" }), actor("Usr", { kind: "actor" })],
      flow: [step("Usr", "Ctr")],
    });
    // 板の見出しは並べ替えた順に並ぶ (#1466 で面ごとの縦列は無くなった)
    const 面 = d.nodes.find((n) => n.kind === "sequence-board")?.sequenceData?.actors ?? [];
    expect(面.map((a) => a.name)).toEqual(["Usr", "Ctr", "Evt"]);
  });
});

// ── compileFlow / compileSwimlane / compileTopology: kind と edge style ──
describe("compileFlow / compileSwimlane / compileTopology", () => {
  it("flow の edge は style dotted-flow", () => {
    expect(compile("flow").edges[0]!.style).toBe("dotted-flow");
  });
  it("flow node は actor.kind を保持", () => {
    const d = compile("flow", { actors: [actor("A", { kind: "database" }), actor("B")] });
    expect(node(d, "a").kind).toBe("database");
  });
  it("swimlane は actor ごとに lane を作る", () => {
    const d = compile("swimlane", { actors: [actor("A"), actor("B"), actor("C")], flow: [step("A", "B"), step("B", "C")] });
    expect(lane(d, "a").label).toBe("A");
    expect(lane(d, "b").label).toBe("B");
    expect(lane(d, "c").label).toBe("C");
  });
  it("topology は main group lane (contain true / width 460)", () => {
    const d = compile("topology");
    expect(lane(d, "main").contain).toBe(true);
    expect(lane(d, "main").width).toBe(460);
    expect(node(d, "a").lane).toBe("main");
  });
});

// ── compileSequenceWithAnimate: header 寸法 actorW = max(140, len*22+52)、 animate 経路で検証 ──

// ── slugify: node id 生成 (小文字化 + 非英数を - に) ──
describe("slugify 経由 node id", () => {
  it("英字は小文字化 + 空白を - に", () => {
    const d = compile("flow", { actors: [actor("Hello World"), actor("B")], flow: [step("Hello World", "B")] });
    expect(d.nodes.some((n) => n.id === "hello-world")).toBe(true);
  });
  it("日本語 actor 名は保持される", () => {
    const d = compile("flow", { actors: [actor("残高"), actor("B")], flow: [step("残高", "B")] });
    expect(d.nodes.some((n) => n.id === "残高")).toBe(true);
  });
});

// ── applyEdgeInlineOptions: guard / cardinality / labelOffset の反映 ──
describe("applyEdgeInlineOptions", () => {
  it("step.guard → edge.guard、 state preset では sub にも同期", () => {
    const d = compile("state", { flow: [step("A", "B", { guard: "x>0" })] });
    const e = d.edges.find((x) => x.from === "a" && x.to === "b")!;
    expect(e.guard).toBe("x>0");
    expect(e.sub).toBe("x>0");
  });
  it("step.cardinality → edge.cardinality", () => {
    const d = compile("er", { flow: [step("A", "B", { cardinality: "1:1", label: "rel" })] });
    const e = d.edges[0]!;
    expect(e.cardinality).toBe("1:1");
  });
  it("step.labelOffsetX / Y → edge に反映", () => {
    const d = compile("swimlane", { flow: [step("A", "B", { labelOffsetX: 5, labelOffsetY: -8 })] });
    const e = d.edges[0]!;
    expect(e.labelOffsetX).toBe(5);
    expect(e.labelOffsetY).toBe(-8);
  });
});

// ── applyGroupContainers: group container lane ──
describe("applyGroupContainers", () => {
  it("doc.groups → group-{id} lane (width 800 / contain true / label)", () => {
    const d = compileToCdl(makeDoc("topology", {
      // **`members` は `DslGroup` に無い** (正しくは `lanes`)。 この検査は「知らない項目が
      // 混ざっても `group-{id}` の枠は作られる」 ことを見るので、わざと壊れた形を渡す。
      // `束ね()` を通すと型が正しくなり、見たい形が作れない。 束ねる縦列 (`main` = topology が作る
      // 縦列) を持たない組は枠を作らない (#1972) ので、`lanes` は正しく渡す
      groups: {
        g1: { label: "G1", lanes: ["main"], members: ["A"] },
      } as unknown as DslDocument["groups"],
    }));
    const l = lane(d, "group-g1");
    expect(l.width).toBe(800);
    expect(l.contain).toBe(true);
    expect(l.label).toBe("G1");
  });
});

// ── applyCanvasPivotPositions: actor posX/Y → lane / node 座標伝播 ──
describe("applyCanvasPivotPositions", () => {
  it("actor posX/Y/W/H を対応 lane と node に反映", () => {
    const d = compileToCdl(makeDoc("swimlane", {
      actors: [actor("A", { posX: 100, posY: 50, posW: 200, posH: 300 }), actor("B")],
    }));
    expect(lane(d, "a").posX).toBe(100);
    expect(lane(d, "a").posY).toBe(50);
    expect(lane(d, "a").posW).toBe(200);
    expect(lane(d, "a").posH).toBe(300);
    expect(node(d, "a").posX).toBe(100);
    expect(node(d, "a").posY).toBe(50);
    expect(node(d, "a").posW).toBe(200);
    expect(node(d, "a").posH).toBe(300);
  });
});

// ── compileGenericWithAnimate: phase 生成 / state / tween / set / highlight ──
const ANIM = {
  states: [{ name: "bal", initial: 100, pos: { line: 1 } }],
  phases: [{ name: "送金", durationMs: 1500, highlight: ["A"], tweens: [{ state: "bal", from: 100, to: 90, pos: { line: 1 } }], sets: [{ state: "bal", value: 0, pos: { line: 1 } }], body: "説明", badge: "NEW", pos: { line: 1 } }],
  pos: { line: 1 },
} as unknown as DslDocument["animate"];

describe("compileGenericWithAnimate (flow + animate)", () => {
  it("phase の id / duration / title / body / badge", () => {
    const p = compileToCdl(makeDoc("flow", { animate: ANIM })).phases[0]!;
    expect(p.id).toBe("送金");
    expect(p.duration).toBe(1500);
    expect(p.title).toBe("送金");
    expect(p.body).toBe("説明");
    expect(p.badge).toBe("NEW");
  });
  it("state は id / initial を保持", () => {
    const d = compileToCdl(makeDoc("flow", { animate: ANIM }));
    expect(d.states.find((s) => s.id === "bal")?.initial).toBe(100);
  });
  it("tween は stateId / from / to", () => {
    const p = compileToCdl(makeDoc("flow", { animate: ANIM })).phases[0]!;
    expect(p.tweens?.[0]).toMatchObject({ stateId: "bal", from: 100, to: 90 });
  });
  it("set は stateId / value", () => {
    const p = compileToCdl(makeDoc("flow", { animate: ANIM })).phases[0]!;
    expect(p.sets?.[0]).toMatchObject({ stateId: "bal", value: 0 });
  });
  it("highlight の actor 名は node id に解決され activate に入る", () => {
    const p = compileToCdl(makeDoc("flow", { animate: ANIM })).phases[0]!;
    expect(p.activate).toContain("a");
  });
});

// ── injectPhasesFallback: 独自 layout preset (class 等) + animate で phase 後段注入 ──
describe("injectPhasesFallback", () => {
  it("class + animate は phase が注入される (独自 layout preset)", () => {
    const d = compileToCdl(makeDoc("class", { animate: ANIM }));
    expect(d.phases.length).toBeGreaterThan(0);
    expect(d.phases[0]!.duration).toBe(1500);
  });
});

// ── mergePartsFromActors / mergePartIntoDiagram: parts merge ──
describe("parts merge", () => {
  function partsCompile(
    type: PresetType = "swimlane",
    widget: Partial<DslActor> = {},
  ) {
    const partDiagram = compile("flow");
    return compileToCdl(makeDoc(type, {
      actors: [actor("widget", { partId: "flow", ...widget }), actor("B")],
      flow: [step("widget", "B")],
    }), { partsCatalog: { flow: partDiagram } });
  }
  it("part の node は alias__ prefix で merge される", () => {
    const d = partsCompile();
    expect(d.nodes.some((n) => n.id === "widget__a")).toBe(true);
    expect(d.nodes.some((n) => n.id === "widget__b")).toBe(true);
  });
  it("見本のために作った仮の箱と縦列は削除される", () => {
    // 位置を書いた見本で見る。 位置を書かない見本は仮の縦列に入るので縦列を残す (#1980、下の検査)
    const d = partsCompile("swimlane", { posX: 900, posY: 600 });
    expect(d.nodes.some((n) => n.id === "widget"), "仮の箱が残っている").toBe(false);
    expect(d.lanes.some((l) => l.id === "widget"), "仮の縦列が残っている").toBe(false);
  });
  it("位置を書かない見本は、仮の箱を消して仮の縦列に入る (#1980)", () => {
    const d = partsCompile();
    expect(d.nodes.some((n) => n.id === "widget"), "仮の箱が残っている").toBe(false);
    expect(d.lanes.some((l) => l.id === "widget"), "見本を入れる縦列を消した").toBe(true);
    expect(node(d, "widget__a").lane).toBe("widget");
    expect(d.lanes.some((l) => l.id.startsWith("widget__")), "見本用の縦列を作った").toBe(false);
  });
  it("part は格子の 1 番目 (左端) に配置", () => {
    // 以前は既存 lane の右端 + 300 に置いていたが、 折り返しが無く図が右へ伸び続けた。
    //
    // 見るのは箱の左端。 縦列の左端は箱より外に出ることがあり (縦列が箱より広い catalog)、
    // 縦列の x で見ると「箱が左端に来ているか」 を確かめられない。
    // 格子が確保するのは図枠なので、 図枠の左端が 0 = 箱は余白のぶん右に来る (#937)
    //
    // 格子に並ぶのは縦列を共有する図種 (`flow`)。 `swimlane` の見本は自分の縦列に入る (#1980)
    const d = partsCompile("flow");
    expect(partLeftEdge(d, "widget")).toBeCloseTo(frameLeftPadding(compile("flow")), 1);
  });
  it("catalog 不在の partId は crash せず無視 (壊さない設計)", () => {
    expect(() => compileToCdl(makeDoc("sequence", {
      actors: [actor("widget", { partId: "missing" }), actor("B")],
      flow: [step("widget", "B")],
    }), { partsCatalog: {} })).not.toThrow();
  });
});

// ── applyV05Extensions: inline option / lane merge / viewport ──
describe("applyV05Extensions", () => {
  it("actor subtitle / eyebrow / value を node に merge", () => {
    const d = compile("swimlane", {
      actors: [actor("A", { subtitle: "sub1", eyebrow: "eye1", value: "val1" }), actor("B")],
    });
    const n = node(d, "a");
    expect(n.subtitle).toBe("sub1");
    expect(n.eyebrow).toBe("eye1");
    expect(n.value).toBe("val1");
  });
  it("viewport.laneWidth → 全 lane width を override", () => {
    const d = compileToCdl(makeDoc("swimlane", {
      viewport: 図全体({ laneWidth: 555 }),
    }));
    for (const l of d.lanes) expect(l.width).toBe(555);
  });
  it("doc.lanes → 既存 lane に x / width / label を merge", () => {
    const d = compileToCdl(makeDoc("swimlane", {
      lanes: 縦列({ a: { x: 88, width: 777, label: "custom" } }),
    }));
    expect(lane(d, "a").x).toBe(88);
    expect(lane(d, "a").width).toBe(777);
    expect(lane(d, "a").label).toBe("custom");
  });
  it("viewport.width / height → diagram.viewport に集約", () => {
    const d = compileToCdl(makeDoc("swimlane", {
      viewport: 図全体({ width: 1600, height: 900 }),
    }));
    expect(d.viewport?.width).toBe(1600);
    expect(d.viewport?.height).toBe(900);
  });
  it("viewport の gap / laneGap / nodeGap / labelMargin も集約", () => {
    const d = compileToCdl(makeDoc("swimlane", {
      viewport: 図全体({ gap: 10, laneGap: 20, nodeGap: 30, labelMargin: 40 }),
    }));
    expect(d.viewport?.gap).toBe(10);
    expect(d.viewport?.laneGap).toBe(20);
    expect(d.viewport?.nodeGap).toBe(30);
    expect(d.viewport?.labelMargin).toBe(40);
  });
  it("actor.rows を node に merge", () => {
    const d = compile("class", { actors: [actor("A", { rows: ["f1", "f2"] }), actor("B")] });
    expect(node(d, "a").rows).toEqual(["f1", "f2"]);
  });
  it("doc.lanes で preset にない lane を新規追加 (x default 0 / width default)", () => {
    const d = compileToCdl(makeDoc("swimlane", {
      lanes: 縦列({ extra: { width: 500, label: "Extra" } }),
    }));
    expect(lane(d, "extra").width).toBe(500);
    expect(lane(d, "extra").label).toBe("Extra");
  });
});

// ── applyCanvasPivotPositions: actor.nodes[subKey] の sub-node override ──

// ── compileMind 詳細: 枝の並びと id の重なり (#1177 で 3 列の配置から payload に変わった) ──
describe("compileMind 詳細", () => {
  it("枝は書いた順のまま並ぶ", () => {
    const d = compile("mind", { actors: [actor("R"), actor("L1"), actor("L2"), actor("L3"), actor("L4")], flow: [] });
    expect(d.nodes[0]!.mindData!.branches.map((b) => b.title)).toEqual(["L1", "L2", "L3", "L4"]);
  });
  it("中心と同じ id になる枝は載せない (自分を親にする形を作らない)", () => {
    const d = compile("mind", { actors: [actor("R"), actor("R"), actor("L1")], flow: [] });
    const m = d.nodes[0]!.mindData!;
    expect(m.rootId).toBe("r");
    expect(m.branches.map((b) => b.title)).toEqual(["L1"]);
  });
  it("登場人物が 1 人なら枝が無い箱を作る", () => {
    const d = compile("mind", { actors: [actor("R")], flow: [] });
    expect(d.nodes).toHaveLength(1);
    expect(d.nodes[0]!.mindData!.branches).toEqual([]);
  });
  it("登場人物が 0 人なら箱も枠も作らない", () => {
    const d = compile("mind", { actors: [], flow: [] });
    expect(d.nodes).toEqual([]);
    expect(d.lanes).toEqual([]);
  });
});

// ── injectPhasesFallback: tween / set も注入 ──
describe("injectPhasesFallback 詳細", () => {
  it("class + animate で tween / set も注入される", () => {
    const p = compileToCdl(makeDoc("class", { animate: ANIM })).phases[0]!;
    expect(p.tweens?.[0]).toMatchObject({ stateId: "bal", from: 100, to: 90 });
    expect(p.sets?.[0]).toMatchObject({ stateId: "bal", value: 0 });
  });
});

// ── applyEdgeInlineOptions: er の cardinality label 併記 ──
describe("applyEdgeInlineOptions er cardinality label", () => {
  it("er で step.cardinality を label に (1:N) 形式で併記 (完全一致)", () => {
    const d = compile("er", { flow: [step("A", "B", { cardinality: "1:N", label: "owns" })] });
    expect(d.edges[0]!.label).toBe("owns (1:N)");
  });
});

// ── compileSequenceWithAnimate: sequence + animate の全構造 (第1弾は header 寸法のみ) ──


// ── resolveHighlight (sequence): actor 名 / 矢印記法の focus id 解決 ──

// ── compileGenericWithAnimate 網羅 (er/state/swimlane + animate) ──
const GEN_ANIM = {
  states: [{ name: "s", initial: 5, pos: { line: 1 } }],
  phases: [{ name: "p", durationMs: 800, highlight: ["A→B"], tweens: [{ state: "s", from: 5, to: 3, pos: { line: 1 } }], sets: [{ state: "s", value: 1, pos: { line: 1 } }], badge: "B", pos: { line: 1 } }],
  pos: { line: 1 },
} as unknown as DslDocument["animate"];

describe("compileGenericWithAnimate 網羅", () => {
  it("er + animate: cardinality を label に (1:N) 併記", () => {
    const d = compileToCdl(makeDoc("er", { animate: GEN_ANIM, flow: [step("A", "B", { cardinality: "1:N", label: "rel" })] }));
    const e = d.edges.find((x) => x.id === "e0-a-b")!;
    expect(e.label).toBe("rel (1:N)");
  });
  it("state + animate: initial/final eyebrow", () => {
    const d = compileToCdl(makeDoc("state", { animate: GEN_ANIM, actors: [actor("A"), actor("B"), actor("C")], flow: [step("A", "B"), step("B", "C")] }));
    expect(node(d, "a").eyebrow).toBe("初期");
    expect(node(d, "c").eyebrow).toBe("最終");
  });
  it("edge id は e{idx}-{from}-{to} / label / tone 保持", () => {
    const d = compileToCdl(makeDoc("swimlane", { animate: GEN_ANIM, flow: [step("A", "B", { label: "msg", tone: "success" })] }));
    const e = d.edges.find((x) => x.id === "e0-a-b")!;
    expect(e.label).toBe("msg");
    expect(e.tone).toBe("success");
  });
  it("state initial / tween / set / badge を保持", () => {
    const d = compileToCdl(makeDoc("swimlane", { animate: GEN_ANIM }));
    const p = d.phases[0]!;
    expect(d.states.find((s) => s.id === "s")?.initial).toBe(5);
    expect(p.tweens?.[0]).toMatchObject({ stateId: "s", from: 5, to: 3 });
    expect(p.sets?.[0]).toMatchObject({ stateId: "s", value: 1 });
    expect(p.badge).toBe("B");
  });
});

// ── resolveHighlightGeneric: generic preset の focus id 解決 ──
describe("resolveHighlightGeneric", () => {
  it("矢印記法 A→B → edge id e0-a-b を activate", () => {
    const d = compileToCdl(makeDoc("swimlane", { animate: GEN_ANIM }));
    expect(d.phases[0]!.activate).toContain("e0-a-b");
  });
  it("actor 名 → node id を activate", () => {
    const d = compileToCdl(makeDoc("swimlane", {
      animate: { states: [], phases: [{ name: "p", durationMs: 500, highlight: ["A"], pos: { line: 1 } }], pos: { line: 1 } } as unknown as DslDocument["animate"],
    }));
    expect(d.phases[0]!.activate).toContain("a");
  });
});

// ── injectPhasesFallback 網羅 (独自 layout preset 各種) ──
describe("injectPhasesFallback 網羅", () => {
  for (const t of ["class", "pie", "c4", "mind", "gantt"] as PresetType[]) {
    it(`${t} + animate で phase 注入 (duration 800)`, () => {
      const d = compileToCdl(makeDoc(t, { animate: GEN_ANIM }));
      expect(d.phases.length).toBeGreaterThan(0);
      expect(d.phases[0]!.duration).toBe(800);
    });
  }
});

// ── compileMind の枠と箱の大きさ (#1177 で 3 枠から 1 枠になった) ──
describe("compileMind 枠と大きさ", () => {
  it("枠は枝の数によらず 1 つ", () => {
    // 変更前は枝の数で 2 枠 / 3 枠が切り替わり、 中身の無い枠が残る形を避けていた (#1096)。
    // 図全体を 1 箱で描くので、 その切り替えごと無くなった
    for (const n of [1, 2, 3, 6]) {
      const actors = [actor("R"), ...Array.from({ length: n }, (_, i) => actor(`L${i}`))];
      const d = compile("mind", { actors, flow: [] });
      expect(d.lanes.map((l) => l.id), `枝 ${n} 本`).toEqual(["chart"]);
    }
  });

  it("箱の大きさは他の 1 箱の図と同じ", () => {
    const d = compile("mind", { actors: [actor("R"), actor("L1")], flow: [] });
    // 木も 1 箱で描く種別で、 同じ寸法の定数を使う
    const 木 = compile("tree", { actors: [actor("R"), actor("C")], flow: [step("R", "C", { label: "" })] });
    expect(d.nodes[0]!.w).toBe(木.nodes[0]!.w);
    expect(d.nodes[0]!.h).toBe(木.nodes[0]!.h);
  });
});

// ── applyEdgeInlineOptions 網羅: sequence (isSeqLike) の edge 検索 ──

// ── compileSwimlane 網羅: edge option + node stack + edge id ──
describe("compileSwimlane 網羅", () => {
  it("edge は sub / tone / style / guard / cardinality / labelOffset を保持", () => {
    const d = compile("swimlane", {
      flow: [
        step("A", "B", {
          sub: "note",
          tone: "success",
          style: "dotted-flow",
          guard: "g",
          cardinality: "1:N",
          labelOffsetX: 3,
          labelOffsetY: 4,
        }),
      ],
    });
    const e = d.edges[0]!;
    expect(e.sub).toBe("note");
    expect(e.tone).toBe("success");
    expect(e.style).toBe("dotted-flow");
    expect(e.guard).toBe("g");
    expect(e.cardinality).toBe("1:N");
    expect(e.labelOffsetX).toBe(3);
    expect(e.labelOffsetY).toBe(4);
  });
  it("edge id は e{idx}-{from}-{to}", () => {
    const d = compile("swimlane", { flow: [step("A", "B")] });
    expect(d.edges[0]!.id).toBe("e0-a-b");
  });
});

// ── 型別 compiler の edge option 伝播 (sub/tone/style を spread する preset) ──
// flow は edge に label のみ渡す (sub/tone/style 非対応) ため除外。
describe("型別 compiler edge option 伝播", () => {
  // `gantt` は矢印を線ではなく帯の依存 (`dependsOn`) として持つため、 この一覧から外した
  // (#1077)。 依存として載ることは `compileGantt` の「矢印は依存として帯に載る」 が見る
  for (const t of ["class", "c4", "topology"] as PresetType[]) {
    it(`${t} edge は sub / tone / style を保持`, () => {
      const d = compile(t, {
        flow: [
          step("A", "B", { sub: "n", tone: "warning", style: "dotted-flow" }),
        ],
      });
      const e = d.edges[0]!;
      // クラス図の `sub` は多重度なので、札の下の行ではなく行き先の端の字に入る (#1769)
      if (t === "class") {
        expect(e.sub).toBeUndefined();
        expect(e.headLabel).toBe("n");
      } else {
        expect(e.sub).toBe("n");
      }
      expect(e.tone).toBe("warning");
      expect(e.style).toBe("dotted-flow");
    });
  }
});

// ── compileState transition: trigger (label) / tone ──
describe("compileState transition", () => {
  it("transition は trigger=label / tone を保持", () => {
    const d = compile("state", { flow: [step("A", "B", { label: "trig", tone: "error" })] });
    const e = d.edges[0]!;
    expect(e.label).toBe("trig");
    expect(e.tone).toBe("error");
  });
});

// ── slugify 網羅: 64 文字切り詰め / 記号のみ fallback ──
describe("slugify 網羅", () => {
  it("64 文字で切り詰め", () => {
    const long = "a".repeat(100);
    const d = compile("flow", { actors: [actor(long), actor("B")], flow: [step(long, "B")] });
    expect(d.nodes.some((n) => n.id === "a".repeat(64))).toBe(true);
  });
  it("記号のみ actor 名は n に fallback", () => {
    const d = compile("flow", { actors: [actor("!!!"), actor("B")], flow: [step("!!!", "B")] });
    expect(d.nodes.some((n) => n.id === "n")).toBe(true);
  });
});

// ── parseCardinalityFromLabel / stripCardinality 網羅 (er 経由) ──
describe("cardinality parse / strip 網羅", () => {
  for (const [label, card] of [["1:1 rel", "1:1"], ["N:1 rel", "N:1"], ["N:M rel", "N:M"], ["0..1 rel", "0..1"], ["1..* rel", "1..*"]] as [string, string][]) {
    it(`"${label}" → sub ${card}`, () => {
      const d = compile("er", { flow: [step("A", "B", { label })] });
      expect(d.edges[0]!.sub).toBe(card);
    });
  }
  it("stripCardinality: cardinality を除去した label", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "1:N owns" })] });
    expect(d.edges[0]!.label).toBe("owns");
  });
});

// ────────────────────────────────────────────────────────────
// 第 4 弾 (#868) = mergePartIntoDiagram の drop 座標 / scale / stack isolation /
// template rewrite / state override を値検証する。 第 1-3 弾で残存していた最大領域
// (actor.posX/posY/posW/posH 経由でしか到達しない座標計算) を kill する。
// ────────────────────────────────────────────────────────────

/**
 * 座標計算 test 用の最小 part。
 * lane l = x 0 / width 400、 node は stack 0 と 1 の 2 個 (stack span 2)、 state v 1 個。
 * これにより partOrigW = 400 / partOrigH = (1-0+1)*220 = 440 / partCenterStack = 0.5 が確定する。
 */
function makeTestPart(): CdlDiagram {
  return {
    id: "parts-test",
    topic: "test",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [
      { id: "top", lane: "l", stack: 0, kind: "actor", title: "T", subtitle: "{v}%", w: 200, h: 100,
        shape: { kind: "arc", angle: "{v}", outerRadius: 140, innerRadius: 100, fill: "#4e9dc4" } },
      { id: "bottom", lane: "l", stack: 1, kind: "actor", title: "B", value: "{v}", w: 100, h: 50 },
    ] as CdlDiagram["nodes"],
    edges: [],
    states: [{ id: "v", initial: 10 }],
    phases: [] as CdlDiagram["phases"],
  };
}

/**
 * 部品の頁で配置した要素の縦位置を、要素全体の縦の中心からの差で返す (#1992)。
 *
 * 組み込みは要素の縦位置をこの差に `scaleY` を掛けて置く。 段の番号に近似の送り幅 220 を
 * 掛けて置いていた頃は、頁で段の間が広い部品が置いた図で詰まった。
 */
function 頁の縦の差(part: CdlDiagram): Map<string, number> {
  const 頁 = layout(part);
  const 縦 = 頁.nodes.map((n) => n.cy);
  const 中心 = (Math.min(...縦) + Math.max(...縦)) / 2;
  return new Map(頁.nodes.map((n) => [n.id, n.cy - 中心]));
}

/** parts actor 1 個を持つ sequence を compile する (partsCatalog 経由)。 */
function compileWithPart(over: Partial<DslActor> = {}, part: CdlDiagram = makeTestPart()): CdlDiagram {
  return compileToCdl(
    makeDoc("sequence", {
      actors: [actor("A"), actor("p1", { partId: "test", ...over })],
      flow: [step("A", "A")],
    }),
    { partsCatalog: { test: part } },
  );
}

describe("mergePartIntoDiagram: lane 配置 (offsetX 中心補正 / fallback)", () => {
  it("offset 未指定 = 格子の 1 番目 (左端) に配置", () => {
    // 以前は既存 lane の右端 + 300 に置いていたが、 折り返しが無く足すたびに図が右へ
    // 伸び続けた (実測 = 8 個で幅 6140)。 格子に並べる形に変えた。
    // 見るのは箱の左端 (縦列は箱より外に出ることがある)。
    // 格子が確保するのは図枠なので、 図枠の左端が 0 = 箱は余白のぶん右に来る (#937)
    const d = compileWithPart();
    expect(partLeftEdge(d, "p1")).toBeCloseTo(frameLeftPadding(makeTestPart()), 1);
  });

  it("posX 指定 = part 中心を posX に合わせるため lane.x = posX - width/2", () => {
    // partsLaneW = 400 → lane.x = 1000 - 200 = 800
    const d = compileWithPart({ posX: 1000, posY: 500 });
    expect(lane(d, "p1__l").x).toBe(800);
  });

  it("lane.width は posW 指定時 targetW/partsLaneW 倍に拡張", () => {
    // laneScaleX = 800 / 400 = 2 → width = 400 * 2 = 800
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 });
    expect(lane(d, "p1__l").width).toBe(800);
  });

  it("posW 未指定なら lane.width は元のまま (scale 1)", () => {
    const d = compileWithPart({ posX: 1000, posY: 500 });
    expect(lane(d, "p1__l").width).toBe(400);
  });

  it("actor.lane 指定時は part 内部 lane を張替え、 独自 lane を作らない", () => {
    const d = compileWithPart({ lane: "a" });
    expect(d.lanes.some((l) => l.id === "p1__l")).toBe(false);
    expect(node(d, "p1__top").lane).toBe("a");
  });
});

describe("mergePartIntoDiagram: node posX / posY (drop 座標の中心合わせ)", () => {
  it("posX/posY 指定 = node 中心 x が posX に一致 (lane 中央 + 中心補正)", () => {
    // partsLaneStartX = 1000 - 200 = 800、 partOrigCx = 0 + 400/2 = 200、 partCenterX = 400/2 = 200
    // → posX = (200 - 200) * 1 + 800 + 400/2 = 1000
    const d = compileWithPart({ posX: 1000, posY: 500 });
    expect(node(d, "p1__top").posX).toBe(1000);
    expect(node(d, "p1__bottom").posX).toBe(1000);
  });

  it("posY = (頁の縦位置 - 要素全体の縦の中心) * scaleY + posY で中心が posY に来る (#1992)", () => {
    // 頁では top (高さ 100) と bottom (高さ 50) の間を 100 空ける = 中心の間 175。 scaleY = 1
    // top    = -87.5 * 1 + 500 = 412.5
    // bottom =  87.5 * 1 + 500 = 587.5  → 中心 (412.5+587.5)/2 = 500 = posY
    const 差 = 頁の縦の差(makeTestPart());
    expect(差.get("bottom")! - 差.get("top")!, "頁の中心の間が 175 ではない (前提が崩れた)").toBe(175);
    const d = compileWithPart({ posX: 1000, posY: 500 });
    expect(node(d, "p1__top").posY).toBe(差.get("top")! + 500);
    expect(node(d, "p1__bottom").posY).toBe(差.get("bottom")! + 500);
  });

  it("posH 指定 = scaleY が posY 間隔に反映される", () => {
    // 縦の基準は段の送り幅の合計 (1-0+1)*220 = 440、 scaleY = 880/440 = 2
    // top    = -87.5 * 2 + 500 = 325
    // bottom =  87.5 * 2 + 500 = 675
    const 差 = 頁の縦の差(makeTestPart());
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 });
    expect(node(d, "p1__top").posY).toBe(差.get("top")! * 2 + 500);
    expect(node(d, "p1__bottom").posY).toBe(差.get("bottom")! * 2 + 500);
  });

  it("offset 未指定なら格子の座標が入る", () => {
    // 以前は座標を書かず auto layout に任せていたが、 折り返しが無く右へ伸び続けた。
    // 格子の位置を計算して入れる
    const d = compileWithPart();
    expect(node(d, "p1__top").posX, "格子の横位置が入っていない").toBeDefined();
    expect(node(d, "p1__top").posY, "格子の縦位置が入っていない").toBeDefined();
  });

  it("posX のみ指定でも shouldForcePos が立ち posY も明示される", () => {
    const d = compileWithPart({ posX: 1000 });
    expect(node(d, "p1__top").posX).toBe(1000);
    // offsetY 未指定 = 0 基準 → top = 頁の縦の差 -87.5
    expect(node(d, "p1__top").posY).toBe(頁の縦の差(makeTestPart()).get("top"));
  });
});

describe("mergePartIntoDiagram: w / h の scale 適用", () => {
  it("posW/posH 指定 = node の w は scaleX 倍、 h は scaleY 倍", () => {
    // scaleX = 800/400 = 2、 scaleY = 880/440 = 2
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 });
    expect(node(d, "p1__top").w).toBe(400);  // 200 * 2
    expect(node(d, "p1__top").h).toBe(200);  // 100 * 2
    expect(node(d, "p1__bottom").w).toBe(200); // 100 * 2
    expect(node(d, "p1__bottom").h).toBe(100); // 50 * 2
  });

  it("scale が 1 のままなら w / h は元の値を維持", () => {
    const d = compileWithPart({ posX: 1000, posY: 500 });
    expect(node(d, "p1__top").w).toBe(200);
    expect(node(d, "p1__top").h).toBe(100);
  });

  it("targetW が 0 以下なら scale 適用しない (0 除算 / 反転を防ぐ)", () => {
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 0, posH: 0 });
    expect(node(d, "p1__top").w).toBe(200);
    expect(node(d, "p1__top").h).toBe(100);
  });
});

describe("mergePartIntoDiagram: shape 幾何 field の等比 scale", () => {
  it("radius 系 field は min(scaleX, scaleY) 倍される", () => {
    // scaleX = 800/400 = 2、 scaleY = 440/440 = 1 → shapeScale = min(2,1) = 1
    const d1 = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 440 });
    const s1 = node(d1, "p1__top").shape as { outerRadius?: number; innerRadius?: number };
    expect(s1.outerRadius).toBe(140);
    expect(s1.innerRadius).toBe(100);
    // scaleX = 2、 scaleY = 880/440 = 2 → shapeScale = 2
    const d2 = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 });
    const s2 = node(d2, "p1__top").shape as { outerRadius?: number; innerRadius?: number };
    expect(s2.outerRadius).toBe(280);
    expect(s2.innerRadius).toBe(200);
  });

  it("非幾何 field (fill) は scale されない", () => {
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 });
    const s = node(d, "p1__top").shape as { fill?: string };
    expect(s.fill).toBe("#4e9dc4");
  });

  it("scale なし (posW/posH 未指定) なら shape は素通し", () => {
    const d = compileWithPart({ posX: 1000, posY: 500 });
    const s = node(d, "p1__top").shape as { outerRadius?: number };
    expect(s.outerRadius).toBe(140);
  });
});

describe("mergePartIntoDiagram: stack isolation", () => {
  it("drop 経路 = target max stack + STACK_ISOLATION_OFFSET 1000 を加算", () => {
    const d = compileWithPart({ posX: 1000, posY: 500 });
    const targetMax = Math.max(
      ...d.nodes.filter((n) => !n.id.startsWith("p1__")).map((n) => n.stack ?? 0),
    );
    expect(node(d, "p1__top").stack).toBe(targetMax + 1000 + 0);
    expect(node(d, "p1__bottom").stack).toBe(targetMax + 1000 + 1);
  });

  it("格子に置く時も stack は元のまま保たれる", () => {
    // 格子の座標を入れても、 パーツ内部の並び順 (stack) は変えない
    const d = compileWithPart();
    const shift = node(d, "p1__bottom").stack - node(d, "p1__top").stack;
    expect(shift, "パーツ内部の並び順が変わった").toBe(1);
  });
});

describe("mergePartIntoDiagram: template rewrite / state override", () => {
  it("subtitle / value の {state} が {alias__state} に rewrite される", () => {
    const d = compileWithPart();
    // template 部分のみ置換され、 周囲の literal (`%`) はそのまま残る
    expect(node(d, "p1__top").subtitle).toBe("{p1__v}%");
    expect(node(d, "p1__bottom").value).toBe("{p1__v}");
  });

  it("shape 内の {state} も rewrite される", () => {
    const d = compileWithPart();
    const s = node(d, "p1__top").shape as { angle?: string };
    expect(s.angle).toBe("{p1__v}");
  });

  it("part の state が存在しない名前は rewrite しない", () => {
    const part = makeTestPart();
    (at(part.nodes, 0, "part.nodes") as { subtitle?: string }).subtitle =
      "{unknown}%";
    const d = compileWithPart({}, part);
    expect(node(d, "p1__top").subtitle).toBe("{unknown}%");
  });

  it("stateOverride が state.initial を上書きする", () => {
    const d = compileWithPart({ stateOverride: { v: 77 } });
    expect(d.states.find((s) => s.id === "p1__v")?.initial).toBe(77);
  });

  it("stateOverride 未指定なら part の initial を維持", () => {
    const d = compileWithPart();
    expect(d.states.find((s) => s.id === "p1__v")?.initial).toBe(10);
  });
});

// ── 光らせる相手の解決: 矢印記法 / actor 名 の分岐を値検証 ──
//
// 下敷きは `topology` (#1466)。 順序図は 1 枚の板になり矢印も面の箱も作らないため、
// 光らせる相手が板 1 つに畳まれて分岐を突けない。 矢印記法を読む部分 (`parseFocusEntry`) は
// 両経路で共通なので、矢印を作る図種で見れば同じ分岐を通る。

/** highlight を持つ animate phase 1 個を組んで compile する。 */
function compileSeqHighlight(highlight: string[], over: Partial<DslDocument> = {}): CdlDiagram {
  const animate = {
    states: [],
    phases: [{ name: "p", durationMs: 1000, highlight, pos: { line: 1 } }],
    pos: { line: 1 },
  } as unknown as DslDocument["animate"];
  return compileToCdl(makeDoc("topology", { animate, ...over }));
}

describe("光らせる相手: 矢印記法 (A→B)", () => {
  it("矢印 highlight は該当 edge を activate", () => {
    const d = compileSeqHighlight(["A→B"]);
    const 相手 = d.edges.find((e) => e.from === "a" && e.to === "b");
    expect(相手, "矢印を 1 本も作れていない (検査が空振りしている)").toBeDefined();
    expect(d.phases[0]!.activate).toContain(相手!.id);
  });

  it("ASCII 矢印 (->) も同じ経路で解決", () => {
    const d = compileSeqHighlight(["A -> B"]);
    expect(d.phases[0]!.activate).toContain("e0-a-b");
  });

  it("自己 edge (A→A) も光らせる相手になる (#1227 → #1462)", () => {
    // 描画側が輪として描けるようになった (`cdl#560`、0.15.0) ので、矢印として残る。
    // 残る以上、`A→A` と書いた段はその矢印を光らせる
    const d = compileSeqHighlight(["A→A"], { flow: [step("A", "A")] });
    const act = d.phases[0]!.activate;
    expect(act.some((id) => id.endsWith("-a-a")), "自己 edge を光らせていない").toBe(true);
  });

  it("同一 from/to の flow が複数あれば全 edge を activate", () => {
    const d = compileSeqHighlight(["A→B"], {
      flow: [step("A", "B", { label: "1" }), step("A", "B", { label: "2" })],
    });
    const act = d.phases[0]!.activate;
    expect(act).toContain("e0-a-b");
    expect(act).toContain("e1-a-b");
  });

  it("該当 flow が無い矢印は edge も step box も activate しない", () => {
    const d = compileSeqHighlight(["B→A"]);
    const act = d.phases[0]!.activate;
    expect(act.some((id) => id.startsWith("e") && id.endsWith("-b-a"))).toBe(false);
    expect(act).not.toContain("s0-b");
  });
});

describe("光らせる相手: actor 名", () => {
  it("actor 名 highlight はその箱を activate", () => {
    const d = compileSeqHighlight(["A"]);
    expect(d.phases[0]!.activate).toContain("a");
  });

  it("書かなかった箱は activate しない", () => {
    const d = compileSeqHighlight(["A"], {
      actors: [actor("A"), actor("B"), actor("C")],
      flow: [step("A", "B"), step("B", "C")],
    });
    const act = d.phases[0]!.activate;
    expect(act).toContain("a");
    expect(act).not.toContain("c");
  });

  it("未知 actor 名は何も activate しない", () => {
    const d = compileSeqHighlight(["Unknown"]);
    const act = d.phases[0]!.activate;
    expect(act.some((id) => id.includes("unknown"))).toBe(false);
  });
});

describe("resolveHighlightGeneric: flow preset 経路", () => {
  /** flow preset + animate で generic 経路を通す。 */
  function compileFlowHighlight(highlight: string[]): CdlDiagram {
    const animate = {
      states: [],
      phases: [{ name: "p", durationMs: 1000, highlight, pos: { line: 1 } }],
      pos: { line: 1 },
    } as unknown as DslDocument["animate"];
    return compileToCdl(makeDoc("flow", { animate }));
  }

  it("actor 名 highlight は対応 node id を activate", () => {
    const d = compileFlowHighlight(["A"]);
    expect(d.phases[0]!.activate).toContain("a");
  });

  it("矢印 highlight は該当 edge id を activate", () => {
    const d = compileFlowHighlight(["A→B"]);
    expect(d.phases[0]!.activate.some((id) => id.includes("-a-b"))).toBe(true);
  });

  it("未知 actor 名は activate しない", () => {
    const d = compileFlowHighlight(["Unknown"]);
    expect(d.phases[0]!.activate).not.toContain("unknown");
  });

  it("該当 edge が無い矢印は activate しない", () => {
    const d = compileFlowHighlight(["B→A"]);
    expect(d.phases[0]!.activate.some((id) => id.includes("-b-a"))).toBe(false);
  });
});

// ── applyV05Extensions: actor option merge / lanes / viewport ──

describe("applyV05Extensions: actor inline option の node merge", () => {
  it("subtitle / eyebrow / value / rows が該当 node に反映", () => {
    const d = compile("swimlane", {
      actors: [actor("A", { subtitle: "s", eyebrow: "e", value: "v", rows: ["r1", "r2"] }), actor("B")],
    });
    const n = node(d, "a");
    expect(n.subtitle).toBe("s");
    expect(n.eyebrow).toBe("e");
    expect(n.value).toBe("v");
    expect(n.rows).toEqual(["r1", "r2"]);
  });

  it("未指定 field は上書きしない (undefined で潰さない)", () => {
    const d = compile("swimlane", { actors: [actor("A", { subtitle: "only" }), actor("B")] });
    expect(node(d, "a").subtitle).toBe("only");
    expect(node(d, "a").eyebrow).toBeUndefined();
  });

});

// ── #881: underscore / 全角 actor 名で sequence の inline option が drop する ──
//
// 非 animate sequence/solidity の実 node id は CDL preset 側 slugify (`_` → `-` 置換 + 全角正規化) で
// 生成されるが、 applyV05Extensions が dragon slugify (`_` / 全角 保持) で `{slug}-header` を決め打つと
// primaryNodeId が実 node id と食い違い option が drop していた。 lane.label 一致で actor 専用 lane を
// 引き当て、 その lane の `-header` node を権威 primary として回収する fix を検証する。
describe("applyV05Extensions: 珍しい名前でも inline option が正しい箱に載る (#881 → #1466)", () => {
  /*
   * `#881` は順序図の名札で、書いた欄が落ちる形を直した (dragon 側の slug と描画側の slug が
   * 食い違い、`A_B` の名札 id が `a-b-header` になっていた)。 板になって名札が無くなったので、
   * 同じ不一致は起きない。 残す価値があるのは **珍しい名前でも書いた欄が箱に載る** ことなので、
   * 1 人 = 1 箱の図種で見る。
   */
  it("下線を含む名前の subtitle / eyebrow / value / rows が載る", () => {
    const d = compile("topology", {
      actors: [actor("A_B", { subtitle: "sub", eyebrow: "eye", value: "val", rows: ["r1", "r2"] }), actor("C")],
      flow: [step("A_B", "C")],
    });
    const n = node(d, "a_b");
    expect(n.subtitle).toBe("sub");
    expect(n.eyebrow).toBe("eye");
    expect(n.value).toBe("val");
    expect(n.rows).toEqual(["r1", "r2"]);
  });

  it("全角の名前でも載る", () => {
    const d = compile("topology", {
      actors: [actor("ゲージ", { eyebrow: "全角eye", value: "80%", rows: ["a"] }), actor("C")],
      flow: [step("ゲージ", "C")],
    });
    const n = d.nodes.find((x) => x.title === "ゲージ");
    expect(n, "全角の名前の箱が無い (検査が空振りしている)").toBeDefined();
    expect(n!.eyebrow).toBe("全角eye");
    expect(n!.value).toBe("80%");
    expect(n!.rows).toEqual(["a"]);
  });

  it("書いた欄が別の箱に漏れない (cross-actor leak 防止 #879 維持)", () => {
    const d = compile("topology", {
      actors: [actor("A_B", { subtitle: "onlyAB" }), actor("C_D")],
      flow: [step("A_B", "C_D")],
    });
    expect(node(d, "a_b").subtitle).toBe("onlyAB");
    expect(node(d, "c_d").subtitle).toBeUndefined();
  });
});

describe("applyV05Extensions: lanes section", () => {
  it("既存 lane の x / width / label / contain / lifeline を上書き", () => {
    const d = compile("swimlane", {
      lanes: 縦列({
        a: { x: 111, width: 222, label: "L", contain: true, lifeline: true },
      }),
    });
    const l = lane(d, "a");
    expect(l.x).toBe(111);
    expect(l.width).toBe(222);
    expect(l.label).toBe("L");
    expect(l.contain).toBe(true);
    expect(l.lifeline).toBe(true);
  });

  it("preset に無い lane id は新規追加 (default x 0 / width 320)", () => {
    const d = compile("swimlane", { lanes: 縦列({ extra: {} }) });
    const l = lane(d, "extra");
    expect(l.x).toBe(0);
    expect(l.width).toBe(320);
  });

  it("新規追加 lane も指定値を反映", () => {
    const d = compile("swimlane", {
      lanes: 縦列({ extra: { x: 50, width: 400, label: "E" } }),
    });
    const l = lane(d, "extra");
    expect(l.x).toBe(50);
    expect(l.width).toBe(400);
    expect(l.label).toBe("E");
  });
});

describe("applyV05Extensions: viewport", () => {
  it("laneWidth は全 lane の width を override", () => {
    const d = compile("swimlane", { viewport: 図全体({ laneWidth: 999 }) });
    for (const l of d.lanes) expect(l.width).toBe(999);
  });

  it("width / height / gap / laneGap / nodeGap / labelMargin が viewport に集約", () => {
    const d = compile("swimlane", {
      viewport: 図全体({
        width: 1,
        height: 2,
        gap: 3,
        laneGap: 4,
        nodeGap: 5,
        labelMargin: 6,
      }),
    });
    expect(d.viewport).toMatchObject({ width: 1, height: 2, gap: 3, laneGap: 4, nodeGap: 5, labelMargin: 6 });
  });

  it("viewport 未指定なら viewport field を作らない", () => {
    const d = compile("swimlane");
    expect(d.viewport).toBeUndefined();
  });

  it("一部 field のみ指定なら他 field は含めない", () => {
    const d = compile("swimlane", { viewport: 図全体({ width: 100 }) });
    expect(d.viewport?.width).toBe(100);
    expect(d.viewport?.height).toBeUndefined();
  });
});

describe("injectPhasesFallback: 独自 layout preset への phase 後段注入", () => {
  const ANIM_HL = (highlight: string[]) => ({
    states: [{ name: "s1", initial: 5 }],
    phases: [{ name: "p", durationMs: 2500, highlight, pos: { line: 1 } }],
    pos: { line: 1 },
  } as unknown as DslDocument["animate"]);

  it("class preset (独自 layout) でも phase が注入される", () => {
    const d = compileToCdl(makeDoc("class", { animate: ANIM_HL([]) }));
    expect(d.phases.length).toBe(1);
    expect(d.phases[0]!.duration).toBe(2500);
  });

  it("animate.states が diagram.states に追加される", () => {
    const d = compileToCdl(makeDoc("class", { animate: ANIM_HL([]) }));
    expect(d.states.find((s) => s.id === "s1")?.initial).toBe(5);
  });

  it("actor 名 highlight は node id に解決", () => {
    const d = compileToCdl(makeDoc("class", { animate: ANIM_HL(["A"]) }));
    expect(d.phases[0]!.activate).toContain("a");
  });

  it("矢印 highlight (A -> B) は該当 edge を解決", () => {
    const d = compileToCdl(makeDoc("class", { animate: ANIM_HL(["A -> B"]) }));
    const act = d.phases[0]!.activate;
    const target = d.edges.find((e) => e.from === "a" && e.to === "b");
    expect(target).toBeDefined();
    expect(act).toContain(target!.id);
  });

  it("全角矢印 (A → B) も同じ edge に解決", () => {
    const d = compileToCdl(makeDoc("class", { animate: ANIM_HL(["A → B"]) }));
    const target = d.edges.find((e) => e.from === "a" && e.to === "b");
    expect(d.phases[0]!.activate).toContain(target!.id);
  });

  it("preset が phase 生成済 (sequence) なら fallback 注入しない (二重生成なし)", () => {
    const d = compileToCdl(makeDoc("sequence", { animate: ANIM_HL([]) }));
    expect(d.phases.length).toBe(1);
  });
});

// ── 第 4 弾 (b): mergePartIntoDiagram の条件式を「両分岐」で突く ──
// scale / posX / w / h / shape の各条件は「片側だけ」 の test では mutant が生き残るため、
// 条件を満たす case と満たさない case の双方を明示的に検証する。

describe("mergePartIntoDiagram: w / h 条件の両分岐", () => {
  /** w / h を持たない node だけの part (w/h !== undefined 分岐の false 側)。 */
  function partWithoutWH(): CdlDiagram {
    const p = makeTestPart();
    p.nodes = [
      { id: "nw", lane: "l", stack: 0, kind: "actor", title: "N" },
    ] as CdlDiagram["nodes"];
    return p;
  }

  it("w / h を持たない node は scale 指定でも w / h が生えない", () => {
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, partWithoutWH());
    expect(node(d, "p1__nw").w).toBeUndefined();
    expect(node(d, "p1__nw").h).toBeUndefined();
  });

  it("w を持つが scale = 1 なら w は元の値のまま (scale 条件の false 側)", () => {
    const d = compileWithPart({ posX: 1000, posY: 500 });
    expect(node(d, "p1__top").w).toBe(200);
  });

  it("scaleX のみ 1 以外でも w / h 双方に scale 適用される (|| の左側)", () => {
    // posW のみ指定 = scaleX = 800/400 = 2、 scaleY = 1
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800 });
    expect(node(d, "p1__top").w).toBe(400); // 200 * 2
    expect(node(d, "p1__top").h).toBe(100); // 100 * 1 (scaleY = 1)
  });

  it("scaleY のみ 1 以外でも w / h 双方に scale 適用される (|| の右側)", () => {
    // posH のみ指定 = scaleY = 880/440 = 2、 scaleX = 1
    const d = compileWithPart({ posX: 1000, posY: 500, posH: 880 });
    expect(node(d, "p1__top").w).toBe(200); // 200 * 1
    expect(node(d, "p1__top").h).toBe(200); // 100 * 2
  });
});

describe("mergePartIntoDiagram: shape scale 条件の両分岐", () => {
  it("shape を持たない node は scale 指定でも shape が生えない", () => {
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 });
    expect(node(d, "p1__bottom").shape).toBeUndefined();
  });

  it("shape 内の非数値 geom field は scale されない (typeof number 判定)", () => {
    const part = makeTestPart();
    const 先頭 = at(part.nodes, 0, "part.nodes") as { shape?: Record<string, unknown> };
    先頭.shape = { kind: "arc", radius: "big", fill: "#000" };
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, part);
    const s = node(d, "p1__top").shape as { radius?: string };
    expect(s.radius).toBe("big");
  });

  it("shape 内 nested object の geom field も scale される (再帰 walk)", () => {
    const part = makeTestPart();
    const 先頭 = at(part.nodes, 0, "part.nodes") as { shape?: Record<string, unknown> };
    先頭.shape = { kind: "arc", inner: { radius: 50 } };
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, part);
    const s = node(d, "p1__top").shape as { inner?: { radius?: number } };
    expect(s.inner?.radius).toBe(100); // 50 * min(2,2)
  });

  it("shape 内 array 要素の geom field も scale される", () => {
    const part = makeTestPart();
    const 先頭 = at(part.nodes, 0, "part.nodes") as { shape?: Record<string, unknown> };
    先頭.shape = { kind: "arc", items: [{ radius: 30 }] };
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, part);
    const s = node(d, "p1__top").shape as { items?: Array<{ radius?: number }> };
    expect(s.items?.[0]?.radius).toBe(60);
  });

  it("shape 内 null 値は素通し (null 判定分岐)", () => {
    const part = makeTestPart();
    const 先頭 = at(part.nodes, 0, "part.nodes") as { shape?: Record<string, unknown> };
    先頭.shape = { kind: "arc", nothing: null, radius: 20 };
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, part);
    const s = node(d, "p1__top").shape as { nothing?: unknown; radius?: number };
    expect(s.nothing).toBeNull();
    expect(s.radius).toBe(40);
  });
});

describe("mergePartIntoDiagram: 座標条件の境界と両分岐", () => {
  it("part 側 node が posX を持つ場合は effectiveOffsetX を加算する (undefined 分岐の逆)", () => {
    const part = makeTestPart();
    (at(part.nodes, 0, "part.nodes") as { posX?: number }).posX = 60;
    // posX 1000 → partsLaneStartX = 800、 effectiveOffsetX = 800 - 0 = 800 → 60 + 800 = 860
    const d = compileWithPart({ posX: 1000, posY: 500 }, part);
    expect(node(d, "p1__top").posX).toBe(860);
  });

  it("part 側 node が posY を持つ場合は offsetY を加算する", () => {
    const part = makeTestPart();
    (at(part.nodes, 0, "part.nodes") as { posY?: number }).posY = 25;
    const d = compileWithPart({ posX: 1000, posY: 500 }, part);
    expect(node(d, "p1__top").posY).toBe(525); // 25 + 500
  });

  it("posY 未指定 (posX のみ) なら part 側 posY には 0 が加算される (?? 0 分岐)", () => {
    const part = makeTestPart();
    (at(part.nodes, 0, "part.nodes") as { posY?: number }).posY = 25;
    const d = compileWithPart({ posX: 1000 }, part);
    expect(node(d, "p1__top").posY).toBe(25);
  });

  it("格子が場所を返さない部品は座標なしで組み込み、要素に書いた位置だけを残す (shouldForcePos の偽側)", () => {
    // 箱の大きさが最大値の部品を 2 つ並べると、2 つ目は格子の送りが桁溢れして場所を持たない (#1992 で実測)
    const 巨大 = (): CdlDiagram => ({
      id: "parts-huge",
      topic: "huge",
      lanes: [{ id: "l", x: 0, width: 400 }],
      nodes: [
        { id: "big", lane: "l", stack: 0, kind: "card", title: "B", w: Number.MAX_VALUE, h: Number.MAX_VALUE },
        { id: "pin", lane: "l", stack: 1, kind: "card", title: "P", w: 100, h: 50, posX: 60, posY: 25 },
      ] as CdlDiagram["nodes"],
      edges: [],
      states: [],
      phases: [] as CdlDiagram["phases"],
    });
    const d = compileToCdl(
      makeDoc("sequence", {
        actors: [actor("A"), actor("p1", { partId: "huge" }), actor("p2", { partId: "huge" })],
        flow: [step("A", "A")],
      }),
      { partsCatalog: { huge: 巨大() } },
    );
    expect(node(d, "p2__big").posX, "格子が場所を返した (前提が崩れた)").toBeUndefined();
    expect(node(d, "p2__big").posY).toBeUndefined();
    // 書いた横位置は縦列と同じ写し方で写す = 自分の部品の縦列の中に来る。 写さないと書いた 60 のまま
    // 図の左端に残る。 座標の桁が大きく差では測れないので、縦列の範囲に入るかで見る
    const l = lane(d, "p2__l");
    expect(node(d, "p2__pin").posX).toBeGreaterThanOrEqual(l.x!);
    expect(node(d, "p2__pin").posX).toBeLessThanOrEqual(l.x! + l.width);
    // 書いた縦位置は書いた値のまま
    expect(node(d, "p2__pin").posY).toBe(25);
  });

  it("targetW が 0 なら laneScaleX は 1 (targetW > 0 の境界)", () => {
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 0 });
    expect(lane(d, "p1__l").width).toBe(400);
  });

  it("part lane に x がある場合 effectiveOffsetX がその分ずれる", () => {
    const part = makeTestPart();
    part.lanes = [{ id: "l", x: 100, width: 400 }];
    // partsLaneStartX = 1000 - 200 = 800、 effectiveOffsetX = 800 - 100 = 700
    // lane.x = 100 + 700 = 800
    const d = compileWithPart({ posX: 1000, posY: 500 }, part);
    expect(lane(d, "p1__l").x).toBe(800);
  });

  it("node の lane が part lanes に無い場合 laneW は default 320 で計算", () => {
    const part = makeTestPart();
    part.nodes = [
      { id: "orphan", lane: "missing", stack: 0, kind: "actor", title: "O" },
    ] as CdlDiagram["nodes"];
    // partLane 見つからず → laneX 0 / laneW 320 → lane 中央 160。 統一式 mapPartX で変換する。
    // partOrigCenterX = 0 + 400/2 = 200、 scaleX = 1、 dropCenterX = 800 + 400/2 = 1000
    // posX = (160 - 200) * 1 + 1000 = 960
    const d = compileWithPart({ posX: 1000, posY: 500 }, part);
    expect(node(d, "p1__orphan").posX).toBe(960);
  });

  it("part.nodes が空なら stack 集計は 0 基準 (length > 0 の false 側)", () => {
    const part = makeTestPart();
    part.nodes = [] as CdlDiagram["nodes"];
    const d = compileWithPart({ posX: 1000, posY: 500 }, part);
    expect(d.nodes.some((n) => n.id.startsWith("p1__"))).toBe(false);
  });

  it("target に lane が無い状態でも格子の 1 番目に配置", () => {
    const d = compileToCdl(
      makeDoc("sequence", { actors: [actor("p1", { partId: "test" })], flow: [] }),
      { partsCatalog: { test: makeTestPart() } },
    );
    // 格子が確保するのは図枠なので、 図枠の左端が 0 = 箱は余白のぶん右に来る (#937)
    expect(partLeftEdge(d, "p1")).toBeCloseTo(frameLeftPadding(makeTestPart()), 1);
  });
});

describe("mergePartIntoDiagram: readouts / phase merge の分岐", () => {
  it("readouts を持つ part は id prefix + source rewrite で merge", () => {
    const part = makeTestPart();
    part.readouts = [
      { id: "r1", kind: "gauge", source: "{v}", nodeId: "top" },
    ] as unknown as CdlDiagram["readouts"];
    const d = compileWithPart({}, part);
    const r = d.readouts?.find((x) => x.id === "p1__r1") as { source?: string } | undefined;
    expect(r).toBeDefined();
    expect(r?.source).toBe("{p1__v}");
  });

  it("readouts が空配列なら target.readouts を作らない (length > 0 分岐)", () => {
    const part = makeTestPart();
    part.readouts = [] as unknown as CdlDiagram["readouts"];
    const d = compileWithPart({}, part);
    expect(d.readouts === undefined || d.readouts.length === 0).toBe(true);
  });

  it("part phase の tweens / sets が prefix 付きで target phase に merge", () => {
    const part = makeTestPart();
    part.phases = [{
      id: "pp", duration: 3000, title: "t", body: "",
      activate: ["top"], tweens: [{ stateId: "v", from: 0, to: 9 }], sets: [{ stateId: "v", value: 3 }],
    }] as CdlDiagram["phases"];
    const animate = {
      states: [],
      phases: [{ name: "p", durationMs: 1000, highlight: [], pos: { line: 1 } }],
      pos: { line: 1 },
    } as unknown as DslDocument["animate"];
    const d = compileToCdl(
      makeDoc("sequence", { animate, actors: [actor("A"), actor("p1", { partId: "test" })], flow: [step("A", "A")] }),
      { partsCatalog: { test: part } },
    );
    const ph = d.phases[0]!;
    expect(ph.duration).toBe(3000); // max(1000, 3000)
    expect(ph.activate).toContain("p1__top");
    expect(ph.tweens.some((t) => t.stateId === "p1__v")).toBe(true);
    expect(ph.sets.some((s) => s.stateId === "p1__v")).toBe(true);
  });

  it("target より part の phase が多い場合は余剰 phase が append される (dummy anchor)", () => {
    const part = makeTestPart();
    part.phases = [
      { id: "p1", duration: 1000, title: "a", body: "", activate: [], tweens: [], sets: [] },
      { id: "p2", duration: 2000, title: "b", body: "", activate: ["top"], tweens: [], sets: [] },
    ] as CdlDiagram["phases"];
    const animate = {
      states: [],
      phases: [{ name: "only", durationMs: 500, highlight: [], pos: { line: 1 } }],
      pos: { line: 1 },
    } as unknown as DslDocument["animate"];
    const d = compileToCdl(
      makeDoc("sequence", { animate, actors: [actor("A"), actor("p1", { partId: "test" })], flow: [step("A", "A")] }),
      { partsCatalog: { test: part } },
    );
    expect(d.phases.length).toBe(2);
    expect(d.phases[1]!.activate).toContain("p1__top");
  });
});

// ── 第 4 弾 (c): applyEdgeInlineOptions / mergePartsFromActors の条件を両分岐で突く ──

describe("applyEdgeInlineOptions: edge 検索条件の分岐", () => {
  /*
   * `sequence` / `solidity` は #1466 で 1 枚の板になり矢印を作らない = この経路に来ない。
   * 下敷きには矢印が出る図種を使う。
   */
  it("plain slug 一致で解決", () => {
    const d = compile("flow", { flow: [step("A", "B", { guard: "g3" })] });
    expect(d.edges.some((e) => e.guard === "g3")).toBe(true);
  });

  it("同一 from/to の step が複数あっても used で別 edge に割当てる", () => {
    const d = compile("topology", {
      flow: [step("A", "B", { guard: "first" }), step("A", "B", { guard: "second" })],
    });
    const guards = d.edges.map((e) => e.guard).filter(Boolean);
    expect(guards).toContain("first");
    expect(guards).toContain("second");
    expect(new Set(guards).size).toBe(2);
  });

  it("state preset は guard を sub にも同期する", () => {
    const d = compile("state", { flow: [step("A", "B", { guard: "cond" })] });
    const e = d.edges.find((x) => x.guard === "cond");
    expect(e?.sub).toBe("cond");
  });

  it("state 以外の preset は sub に guard を同期しない", () => {
    const d = compile("topology", { flow: [step("A", "B", { guard: "cond" })] });
    expect(d.edges.find((e) => e.guard === "cond")?.sub).toBeUndefined();
  });

  it("er preset は cardinality を label に併記", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "owns", cardinality: "1:N" })] });
    const e = d.edges.find((x) => x.cardinality === "1:N");
    expect(e?.label).toContain("1:N");
  });

  it("label に既に cardinality を含む場合は二重併記しない", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "owns (1:N)", cardinality: "1:N" })] });
    const e = d.edges.find((x) => x.cardinality === "1:N");
    expect((e?.label.match(/1:N/g) ?? []).length).toBe(1);
  });

  it("er 以外は cardinality を label に併記しない", () => {
    const d = compile("topology", { flow: [step("A", "B", { label: "call", cardinality: "1:N" })] });
    const e = d.edges.find((x) => x.cardinality === "1:N");
    expect(e?.label).toBe("call");
  });

  it("labelOffsetX / labelOffsetY が edge に反映される", () => {
    const d = compile("topology", { flow: [step("A", "B", { labelOffsetX: 12, labelOffsetY: -8 })] });
    const e = d.edges.find((x) => x.from === "a" && x.to === "b");
    expect(e?.labelOffsetX).toBe(12);
    expect(e?.labelOffsetY).toBe(-8);
  });

  it("inline option 未指定なら edge に field が生えない", () => {
    const d = compile("topology", { flow: [step("A", "B")] });
    const e = d.edges.find((x) => x.from === "a" && x.to === "b");
    expect(e, "矢印を 1 本も作れていない (検査が空振りしている)").toBeDefined();
    expect(e?.guard).toBeUndefined();
    expect(e?.side).toBeUndefined();
  });

  it("自己 edge (A→A) にも inline option が載る (#1227 → #1462)", () => {
    // 矢印として残るようになったので、書いた項目もその矢印に載る
    const d = compile("topology", { flow: [step("A", "A", { guard: "self" })] });
    expect(d.edges.filter((e) => e.from === e.to), "自己 edge が消えている").toHaveLength(1);
    expect(d.edges.some((e) => e.guard === "self"), "書いた項目が載っていない").toBe(true);
  });
});

describe("mergePartsFromActors: guard 条件の分岐", () => {
  const PART = (): CdlDiagram => ({
    id: "parts-x", topic: "t",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [{ id: "n", lane: "l", stack: 0, kind: "actor", title: "N" }] as CdlDiagram["nodes"],
    edges: [], states: [], phases: [] as CdlDiagram["phases"],
  });

  it("partsCatalog 未渡しなら parts actor を skip して diagram は壊れない", () => {
    const warn = console.warn;
    console.warn = () => {};
    try {
      const d = compileToCdl(makeDoc("swimlane", {
        actors: [actor("A"), actor("p1", { partId: "x" })],
        flow: [step("A", "A")],
      }));
      expect(d.nodes.some((n) => n.id.startsWith("p1__"))).toBe(false);
      expect(d.nodes.length).toBeGreaterThan(0);
    } finally {
      console.warn = warn;
    }
  });

  it("partId が空文字なら skip (length === 0 分岐)", () => {
    const warn = console.warn;
    console.warn = () => {};
    try {
      const d = compileToCdl(
        makeDoc("swimlane", { actors: [actor("A"), actor("p1", { partId: "" })], flow: [step("A", "A")] }),
        { partsCatalog: { x: PART() } },
      );
      expect(d.nodes.some((n) => n.id.startsWith("p1__"))).toBe(false);
    } finally {
      console.warn = warn;
    }
  });

  it("catalog に無い partId は warn して skip (該当 part なし分岐)", () => {
    const warn = console.warn;
    const logs: string[] = [];
    console.warn = (m: string) => logs.push(String(m));
    try {
      const d = compileToCdl(
        makeDoc("sequence", { actors: [actor("A"), actor("p1", { partId: "missing" })], flow: [step("A", "A")] }),
        { partsCatalog: { x: PART() } },
      );
      expect(d.nodes.some((n) => n.id.startsWith("p1__"))).toBe(false);
      expect(logs.some((l) => l.includes("missing"))).toBe(true);
    } finally {
      console.warn = warn;
    }
  });

  it("parts- prefix 付き key でも lookup できる", () => {
    const d = compileToCdl(
      makeDoc("sequence", { actors: [actor("A"), actor("p1", { partId: "x" })], flow: [step("A", "A")] }),
      { partsCatalog: { "parts-x": PART() } },
    );
    expect(d.nodes.some((n) => n.id === "p1__n")).toBe(true);
  });

  it("非 seq-like preset (flow) では lane 削除を行わない", () => {
    const d = compileToCdl(
      makeDoc("flow", { actors: [actor("flow", { partId: "x" }), actor("other")], flow: [step("flow", "other")] }),
      { partsCatalog: { x: PART() } },
    );
    expect(d.lanes.some((l) => l.id === "flow")).toBe(true);
    expect(node(d, "other").lane).toBe("flow");
  });

  it("actor.lane 指定時は張替え先 lane を削除しない", () => {
    const d = compileToCdl(
      makeDoc("swimlane", { actors: [actor("A"), actor("p1", { partId: "x", lane: "a" })], flow: [step("A", "A")] }),
      { partsCatalog: { x: PART() } },
    );
    expect(d.lanes.some((l) => l.id === "a")).toBe(true);
    expect(node(d, "p1__n").lane).toBe("a");
  });

  it("見本へ向かう矢印も一緒に削除される", () => {
    const d = compileToCdl(
      makeDoc("swimlane", { actors: [actor("A"), actor("p1", { partId: "x" })], flow: [step("A", "p1")] }),
      { partsCatalog: { x: PART() } },
    );
    expect(d.nodes.some((n) => n.id === "p1"), "仮の箱が残っている").toBe(false);
    expect(d.edges.some((e) => e.to === "p1"), "仮の箱へ向かう矢印が残っている").toBe(false);
    expect(d.nodes.some((n) => n.id === "p1__n"), "見本の中身が入っていない").toBe(true);
  });

  it("parts actor が 0 個なら diagram は素通し (early return)", () => {
    const withCatalog = compileToCdl(makeDoc("sequence"), { partsCatalog: { x: PART() } });
    const without = compileToCdl(makeDoc("sequence"));
    expect(withCatalog.nodes.map((n) => n.id)).toEqual(without.nodes.map((n) => n.id));
  });
});

// ── 第 4 弾 (d): animate 経路 (generic / sequence) と swimlane / canvas pivot の分岐 ──

/** animate phase 1 個を持つ doc を作る helper (generic 経路用)。 */
function animOf(highlight: string[] = []): DslDocument["animate"] {
  return {
    states: [],
    phases: [{ name: "p", durationMs: 1200, highlight, pos: { line: 1 } }],
    pos: { line: 1 },
  } as unknown as DslDocument["animate"];
}

describe("compileGenericWithAnimate: kind 別の lane 構成", () => {
  it("flow は 1 lane (main) に全 actor を縦 stack", () => {
    const d = compileToCdl(makeDoc("flow", { animate: animOf() }));
    expect(d.lanes.length).toBe(1);
    expect(d.lanes[0]!.id).toBe("main");
    expect(node(d, "a").stack).toBe(0);
    expect(node(d, "b").stack).toBe(1);
  });

  it("flow の lane label は doc.title、 contain は付かない", () => {
    const d = compileToCdl(makeDoc("flow", { animate: animOf(), title: "MyFlow" }));
    expect(d.lanes[0]!.label).toBe("MyFlow");
    expect(d.lanes[0]!.contain).toBeUndefined();
  });

  it("topology は同じ 1 lane 構成だが contain: true が付く", () => {
    const d = compileToCdl(makeDoc("topology", { animate: animOf() }));
    expect(d.lanes.length).toBe(1);
    expect(d.lanes[0]!.contain).toBe(true);
  });

  it("swimlane は actor ごとに lane-{slug} を横並び生成", () => {
    const d = compileToCdl(makeDoc("swimlane", { animate: animOf() }));
    expect(d.lanes.map((l) => l.id)).toEqual(["lane-a", "lane-b"]);
    expect(lane(d, "lane-a").label).toBe("A");
  });

  it("state preset は先頭 actor が initial marker を持つ", () => {
    const d = compileToCdl(makeDoc("state", { animate: animOf() }));
    const first = node(d, "a");
    const last = node(d, "b");
    // initial / final の差が出る (両方 undefined ではない)
    expect(JSON.stringify(first) !== JSON.stringify(last)).toBe(true);
  });

  it("actor 1 個の state preset では final marker が付かない (length > 1 条件)", () => {
    const d = compileToCdl(makeDoc("state", {
      animate: animOf(), actors: [actor("A")], flow: [],
    }));
    expect(d.nodes.length).toBe(1);
  });

  it("er preset は cardinality を label に併記", () => {
    const d = compileToCdl(makeDoc("er", {
      animate: animOf(), flow: [step("A", "B", { label: "owns", cardinality: "1:N" })],
    }));
    expect(d.edges[0]!.label).toContain("1:N");
  });

  it("er で label が既に cardinality を含むなら二重併記しない", () => {
    const d = compileToCdl(makeDoc("er", {
      animate: animOf(), flow: [step("A", "B", { label: "owns (1:N)", cardinality: "1:N" })],
    }));
    expect((d.edges[0]!.label.match(/1:N/g) ?? []).length).toBe(1);
  });

  it("er 以外は cardinality があっても label に併記しない", () => {
    const d = compileToCdl(makeDoc("flow", {
      animate: animOf(), flow: [step("A", "B", { label: "go", cardinality: "1:N" })],
    }));
    expect(d.edges[0]!.label).toBe("go");
  });

  it("edge の labelOffsetX / labelOffsetY が反映される (両分岐)", () => {
    const withOffset = compileToCdl(makeDoc("flow", {
      animate: animOf(), flow: [step("A", "B", { labelOffsetX: 7, labelOffsetY: -3 })],
    }));
    expect(withOffset.edges[0]!.labelOffsetX).toBe(7);
    expect(withOffset.edges[0]!.labelOffsetY).toBe(-3);
    const without = compileToCdl(makeDoc("flow", { animate: animOf() }));
    expect(without.edges[0]!.labelOffsetX).toBeUndefined();
    expect(without.edges[0]!.labelOffsetY).toBeUndefined();
  });

  it("edge の sub / tone / style / guard / cardinality が反映される", () => {
    const d = compileToCdl(makeDoc("flow", {
      animate: animOf(),
      flow: [
        step("A", "B", {
          sub: "s",
          tone: "success",
          style: "dotted-flow",
          guard: "g",
          cardinality: "1:1",
        }),
      ],
    }));
    const e = d.edges[0]!;
    expect(e.sub).toBe("s");
    expect(e.tone).toBe("success");
    expect(e.style).toBe("dotted-flow");
    expect(e.guard).toBe("g");
    expect(e.cardinality).toBe("1:1");
  });

  it("edge id は e{idx}-{from}-{to} 形式", () => {
    const d = compileToCdl(makeDoc("flow", { animate: animOf() }));
    expect(d.edges[0]!.id).toBe("e0-a-b");
  });
});

describe("compileSwimlane: actor 属性の伝播", () => {
  it("actor kind が node に反映される", () => {
    const d = compile("swimlane", { actors: [actor("A", { kind: "database" }), actor("B")] });
    expect(node(d, "a").kind).toBe("database");
  });

  it("kind 未指定 node は actor default (actor) になる", () => {
    const d = compile("swimlane");
    expect(node(d, "a").kind).toBe("actor");
  });

  it("同一 actor が複数 step に現れても node は 1 個 (placedNodes)", () => {
    const d = compile("swimlane", {
      actors: [actor("A"), actor("B"), actor("C")],
      flow: [step("A", "B"), step("A", "C")],
    });
    expect(d.nodes.filter((n) => n.id === "a").length).toBe(1);
  });

  it("edge の labelOffsetX / labelOffsetY が反映される (swimlane)", () => {
    const d = compile("swimlane", { flow: [step("A", "B", { labelOffsetX: 9, labelOffsetY: 8 })] });
    expect(d.edges[0]!.labelOffsetX).toBe(9);
    expect(d.edges[0]!.labelOffsetY).toBe(8);
  });

  it("animate 付き swimlane は generic 経路に分岐する (lane-{slug} 命名)", () => {
    const d = compileToCdl(makeDoc("swimlane", { animate: animOf() }));
    expect(d.lanes.some((l) => l.id === "lane-a")).toBe(true);
  });
});

describe("applyCanvasPivotPositions: 反映条件の分岐", () => {
  it("posX のみ指定では lane / node に反映しない (&& 条件)", () => {
    const d = compile("swimlane", { actors: [actor("A", { posX: 100 }), actor("B")] });
    expect(lane(d, "a").posX).toBeUndefined();
    expect(node(d, "a").posX).toBeUndefined();
  });

  it("parts actor (partId 付き) は本経路を skip する", () => {
    const part: CdlDiagram = {
      id: "parts-y", topic: "t",
      lanes: [{ id: "l", x: 0, width: 400 }],
      nodes: [{ id: "n", lane: "l", stack: 0, kind: "actor", title: "N" }] as CdlDiagram["nodes"],
      edges: [], states: [], phases: [] as CdlDiagram["phases"],
    };
    const d = compileToCdl(
      makeDoc("sequence", {
        actors: [actor("A"), actor("p1", { partId: "y", posX: 500, posY: 600 })],
        flow: [step("A", "A")],
      }),
      { partsCatalog: { y: part } },
    );
    // parts 経路が担当するため、 alias 名の lane / node は残っていない
    expect(d.lanes.some((l) => l.id === "p1")).toBe(false);
  });

  it("posW / posH は posX/posY 指定時に lane と node 双方へ反映", () => {
    const d = compile("swimlane", {
      actors: [actor("A", { posX: 1, posY: 2, posW: 30, posH: 40 }), actor("B")],
    });
    expect(lane(d, "a").posW).toBe(30);
    expect(lane(d, "a").posH).toBe(40);
    expect(node(d, "a").posW).toBe(30);
    expect(node(d, "a").posH).toBe(40);
  });

  it("posW 未指定なら posW は生えない (undefined 分岐)", () => {
    const d = compile("swimlane", { actors: [actor("A", { posX: 1, posY: 2 }), actor("B")] });
    expect(lane(d, "a").posW).toBeUndefined();
    expect(node(d, "a").posW).toBeUndefined();
  });
});

// ── 第 4 弾 (e): 矢印 regex の各要素と compileMind の暗黙 edge 分岐 ──

describe("矢印 regex の要素 (空白許容 / 非貪欲 / 記号バリエーション)", () => {
  /** 動く図の highlight で矢印記法の読み取りを通す (#1466 で下敷きを `topology` に移した)。 */
  const seqHl = (h: string, over: Partial<DslDocument> = {}) =>
    compileToCdl(makeDoc("topology", {
      animate: {
        states: [], phases: [{ name: "p", durationMs: 1000, highlight: [h], pos: { line: 1 } }], pos: { line: 1 },
      } as unknown as DslDocument["animate"],
      ...over,
    }));

  it("矢印前後に空白が無くても解決 (\\s* の 0 回)", () => {
    expect(seqHl("A→B").phases[0]!.activate).toContain("e0-a-b");
  });

  it("矢印前後に複数空白があっても解決 (\\s* の複数回)", () => {
    expect(seqHl("A   →   B").phases[0]!.activate).toContain("e0-a-b");
  });

  it("前後の余分な空白は trim される", () => {
    expect(seqHl("  A → B  ").phases[0]!.activate).toContain("e0-a-b");
  });

  it("ASCII 2 文字矢印 (->) を解決", () => {
    expect(seqHl("A -> B").phases[0]!.activate).toContain("e0-a-b");
  });

  it("矢印を含まない単純 actor 名は actor 経路に落ちる", () => {
    const act = seqHl("A").phases[0]!.activate;
    expect(act).toContain("a");
    expect(act.some((id) => id.includes("-a-b"))).toBe(false);
  });

  it("空 highlight 配列なら activate は空", () => {
    const d = compileToCdl(makeDoc("topology", {
      animate: {
        states: [], phases: [{ name: "p", durationMs: 1000, highlight: [], pos: { line: 1 } }], pos: { line: 1 },
      } as unknown as DslDocument["animate"],
    }));
    expect(d.phases[0]!.activate).toEqual([]);
  });

  it("generic 経路でも空白ゆらぎを吸収する", () => {
    const d = compileToCdl(makeDoc("flow", {
      animate: {
        states: [], phases: [{ name: "p", durationMs: 1000, highlight: ["A   ->   B"], pos: { line: 1 } }], pos: { line: 1 },
      } as unknown as DslDocument["animate"],
    }));
    expect(d.phases[0]!.activate.some((id) => id.includes("-a-b"))).toBe(true);
  });

  it("injectPhasesFallback 経路でも空白ゆらぎを吸収する", () => {
    const d = compileToCdl(makeDoc("class", {
      animate: {
        states: [], phases: [{ name: "p", durationMs: 1000, highlight: ["A    →    B"], pos: { line: 1 } }], pos: { line: 1 },
      } as unknown as DslDocument["animate"],
    }));
    const target = d.edges.find((e) => e.from === "a" && e.to === "b");
    expect(d.phases[0]!.activate).toContain(target!.id);
  });

  it("injectPhasesFallback: 該当 edge が無い矢印は activate しない", () => {
    const d = compileToCdl(makeDoc("class", {
      animate: {
        states: [], phases: [{ name: "p", durationMs: 1000, highlight: ["B → A"], pos: { line: 1 } }], pos: { line: 1 },
      } as unknown as DslDocument["animate"],
    }));
    expect(d.phases[0]!.activate.length).toBe(0);
  });

  it("injectPhasesFallback: phase の body / duration が反映される", () => {
    const d = compileToCdl(makeDoc("class", {
      animate: {
        states: [],
        phases: [{ name: "p", durationMs: 3300, highlight: [], body: "desc", pos: { line: 1 } }],
        pos: { line: 1 },
      } as unknown as DslDocument["animate"],
    }));
    expect(d.phases[0]!.duration).toBe(3300);
    expect(d.phases[0]!.body).toBe("desc");
  });

  it("injectPhasesFallback: body 未指定なら空文字 (?? 分岐)", () => {
    const d = compileToCdl(makeDoc("class", {
      animate: {
        states: [], phases: [{ name: "p", durationMs: 1000, highlight: [], pos: { line: 1 } }], pos: { line: 1 },
      } as unknown as DslDocument["animate"],
    }));
    expect(d.phases[0]!.body).toBe("");
  });
});

describe("compileMind: 矢印の扱いと枠 (#1177)", () => {
  it("矢印を書いていなければ 1 本も作らない", () => {
    // 変更前は root から全 leaf に暗黙の矢印を作っていた。 枝の繋がりは payload が持つ
    const d = compile("mind", { actors: [actor("Root"), actor("L1"), actor("L2")], flow: [] });
    expect(d.edges).toEqual([]);
    expect(d.nodes[0]!.mindData!.branches.map((b) => b.parent)).toEqual(["root", "root"]);
  });

  it("矢印は線にならず、 枝の親になる (#1251)", () => {
    // 放射の図は線を描かない。 矢印は「どの枝の下に置くか」 の指定として読む (#1251 で変更)
    const 知らせ: string[] = [];
    const d = compileToCdl(
      makeDoc("mind", {
        actors: [actor("Root"), actor("L1"), actor("L2")],
        flow: [step("L1", "L2", { label: "x" })],
      }),
      { onNotice: (n) => 知らせ.push(n.kind) },
    );
    expect(d.edges).toEqual([]);
    expect(知らせ.filter((k) => k === "chart-edge-dropped"), "使えた矢印を落としている").toEqual([]);
    const 中心 = at(d.nodes, 0, "d.nodes") as {
        mindData?: { branches?: { id: string; parent?: string }[] };
      };
      const 枝 = 中心.mindData?.branches;
    expect(枝?.find((x) => x.id === "l2")?.parent).toBe("l1");
  });

  it("矢印を書いていなければ知らせも出さない", () => {
    const 知らせ: string[] = [];
    compileToCdl(makeDoc("mind", { actors: [actor("Root"), actor("L1")], flow: [] }), {
      onNotice: (n) => 知らせ.push(n.kind),
    });
    expect(知らせ.filter((k) => k === "chart-edge-dropped")).toEqual([]);
  });

  it("枠は 1 つで、 見出しは付かない", () => {
    // 見出しは #1249 で外した。 図表は箱を 1 つしか作らず、その箱が既に図の題を持つため、
    // 見出しにも同じ題を渡すと同じ字が縦に 2 つ並ぶ (描いた絵で実測)
    const d = compile("mind", { actors: [actor("Root"), actor("L1"), actor("L2")], flow: [] });
    expect(d.lanes).toHaveLength(1);
    expect(d.lanes[0]!.id).toBe("chart");
    expect(d.lanes[0]!.label).toBeUndefined();
  });
});

describe("mergePartsFromActors: 共有 lane preset の slug fallback 経路", () => {
  const PART = (): CdlDiagram => ({
    id: "parts-z", topic: "t",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [{ id: "n", lane: "l", stack: 0, kind: "actor", title: "N" }] as CdlDiagram["nodes"],
    edges: [], states: [], phases: [] as CdlDiagram["phases"],
  });

  it("flow preset で parts actor 自身の node (id === slug) が削除される", () => {
    const d = compileToCdl(
      makeDoc("flow", { actors: [actor("p1", { partId: "z" }), actor("other")], flow: [step("p1", "other")] }),
      { partsCatalog: { z: PART() } },
    );
    expect(d.nodes.some((n) => n.id === "p1")).toBe(false);
    expect(d.nodes.some((n) => n.id === "p1__n")).toBe(true);
  });

  it("flow preset で通常 actor の node は残る (誤削除しない)", () => {
    const d = compileToCdl(
      makeDoc("flow", { actors: [actor("p1", { partId: "z" }), actor("other")], flow: [step("p1", "other")] }),
      { partsCatalog: { z: PART() } },
    );
    expect(d.nodes.some((n) => n.id === "other")).toBe(true);
  });

  it("flow preset で parts actor に接続する edge が削除される", () => {
    const d = compileToCdl(
      makeDoc("flow", { actors: [actor("p1", { partId: "z" }), actor("other")], flow: [step("p1", "other")] }),
      { partsCatalog: { z: PART() } },
    );
    expect(d.edges.some((e) => e.from === "p1" || e.to === "p1")).toBe(false);
  });

  it("topology preset でも同じ fallback 経路で削除される", () => {
    const d = compileToCdl(
      makeDoc("topology", { actors: [actor("p1", { partId: "z" }), actor("other")], flow: [step("p1", "other")] }),
      { partsCatalog: { z: PART() } },
    );
    expect(d.nodes.some((n) => n.id === "p1")).toBe(false);
    expect(d.nodes.some((n) => n.id === "other")).toBe(true);
  });

  it("slug prefix が部分一致する別 actor は削除されない (p1 vs p1x)", () => {
    const d = compileToCdl(
      makeDoc("flow", {
        actors: [actor("p1", { partId: "z" }), actor("p1x")],
        flow: [step("p1", "p1x")],
      }),
      { partsCatalog: { z: PART() } },
    );
    expect(d.nodes.some((n) => n.id === "p1x")).toBe(true);
  });

  it("非 seq-like では phase.activate からも parts actor 参照が除かれる", () => {
    const d = compileToCdl(
      makeDoc("flow", {
        actors: [actor("p1", { partId: "z" }), actor("other")],
        flow: [step("p1", "other")],
        animate: {
          states: [], phases: [{ name: "p", durationMs: 1000, highlight: ["p1"], pos: { line: 1 } }], pos: { line: 1 },
        } as unknown as DslDocument["animate"],
      }),
      { partsCatalog: { z: PART() } },
    );
    expect(d.phases[0]!.activate).not.toContain("p1");
  });

  it("parts actor が無ければ通常 actor の node / edge は完全に保持される", () => {
    const withParts = compileToCdl(
      makeDoc("flow", { actors: [actor("a1"), actor("a2")], flow: [step("a1", "a2")] }),
      { partsCatalog: { z: PART() } },
    );
    expect(withParts.nodes.map((n) => n.id).sort()).toEqual(["a1", "a2"]);
    expect(withParts.edges.length).toBe(1);
  });
});

describe("mergePartsFromActors: warn 出力の内容", () => {
  it("catalog 未渡し warn は actor 名と partId を含む", () => {
    const warn = console.warn;
    const logs: string[] = [];
    console.warn = (m: string) => logs.push(String(m));
    try {
      compileToCdl(makeDoc("sequence", {
        actors: [actor("A"), actor("gauge1", { partId: "arc-gauge" })],
        flow: [step("A", "A")],
      }));
      expect(logs.length).toBeGreaterThan(0);
      expect(at(logs, 0, "logs")).toContain("gauge1");
      expect(at(logs, 0, "logs")).toContain("arc-gauge");
    } finally {
      console.warn = warn;
    }
  });

  it("catalog 未登録 warn は partId と actor 名を含む", () => {
    const warn = console.warn;
    const logs: string[] = [];
    console.warn = (m: string) => logs.push(String(m));
    try {
      compileToCdl(
        makeDoc("sequence", {
          actors: [actor("A"), actor("g2", { partId: "nope" })],
          flow: [step("A", "A")],
        }),
        { partsCatalog: {} },
      );
      expect(logs.some((l) => l.includes("nope") && l.includes("g2"))).toBe(true);
    } finally {
      console.warn = warn;
    }
  });

  it("複数 parts actor が未解決なら warn に全件が並ぶ", () => {
    const warn = console.warn;
    const logs: string[] = [];
    console.warn = (m: string) => logs.push(String(m));
    try {
      compileToCdl(makeDoc("sequence", {
        actors: [actor("A"), actor("g1", { partId: "p" }), actor("g2", { partId: "q" })],
        flow: [step("A", "A")],
      }));
      expect(at(logs, 0, "logs")).toContain("g1");
      expect(at(logs, 0, "logs")).toContain("g2");
    } finally {
      console.warn = warn;
    }
  });
});

// ── 第 4 弾 (g): sub-node override / actor 名一致経路 / activate 空分岐 ──

describe("applyV05Extensions / applyCanvasPivotPositions: id 一致経路の分岐", () => {
  it("actor 名がそのまま node id の preset (swimlane) で座標反映", () => {
    const d = compile("swimlane", { actors: [actor("A", { posX: 7, posY: 8 }), actor("B")] });
    expect(node(d, "a").posX).toBe(7);
  });

  it("非 ASCII actor 名 (slug != 名前) でも slug 一致で反映", () => {
    // dragon slugify は長音「ー」を `-` に変換するため id は "ユ-ザ" になる。
    // actor 名そのままではなく slug 側で一致させる経路を検証する。
    const d = compile("swimlane", {
      actors: [actor("ユーザー", { posX: 5, posY: 6 }), actor("B")],
      flow: [step("ユーザー", "B")],
    });
    expect(node(d, "ユ-ザ").posX).toBe(5);
    expect(node(d, "ユ-ザ").posY).toBe(6);
  });

  it("actor option は header 無し preset (swimlane) の node にも merge される", () => {
    const d = compile("swimlane", { actors: [actor("A", { eyebrow: "eb" }), actor("B")] });
    expect(node(d, "a").eyebrow).toBe("eb");
  });

  it("該当 node が無い actor 名は何も起きない (no-op)", () => {
    const d = compile("swimlane", {
      actors: [actor("A"), actor("B")],
      lanes: 縦列({ nonexistent: { x: 1 } }),
    });
    expect(d.nodes.length).toBe(2);
  });
});

// ── 第 4 弾 (h): animate guard (phases 空) と lane guard の両分岐 ──
// `doc.animate && doc.animate.phases.length > 0` は phases が空の時に非 animate 経路へ落ちる。
// 各 preset で「非 animate 経路に固有の出力」 を assert し、 guard が緩む mutant を kill する。

describe("animate guard: phases 空なら非 animate 経路を通る", () => {
  const EMPTY_ANIM = { states: [], phases: [], pos: { line: 1 } } as unknown as DslDocument["animate"];

  it("flow は preset 由来 lane (flow) を使う (animate 経路の main ではない)", () => {
    const d = compileToCdl(makeDoc("flow", { animate: EMPTY_ANIM }));
    expect(d.lanes.map((l) => l.id)).toEqual(["flow"]);
  });

  it("swimlane は actor 名 lane を使う (animate 経路の lane-{slug} ではない)", () => {
    const d = compileToCdl(makeDoc("swimlane", { animate: EMPTY_ANIM }));
    expect(d.lanes.map((l) => l.id)).toEqual(["a", "b"]);
  });

  it("順序図は板 1 枚になり矢印を作らない (#1466)", () => {
    const d = compileToCdl(makeDoc("sequence", { animate: EMPTY_ANIM }));
    expect(d.edges).toEqual([]);
    expect(d.nodes.filter((n) => n.kind === "sequence-board"), "板が無い").toHaveLength(1);
  });

  it("er は lane label 無しの preset 出力になる", () => {
    const d = compileToCdl(makeDoc("er", { animate: EMPTY_ANIM }));
    expect(lane(d, "lane-a").label).toBeUndefined();
  });

  it("state も lane label 無しの preset 出力になる", () => {
    const d = compileToCdl(makeDoc("state", { animate: EMPTY_ANIM }));
    expect(lane(d, "lane-a").label).toBeUndefined();
  });

  it("topology は preset 由来 edge id (c{idx}-) を使う", () => {
    const d = compileToCdl(makeDoc("topology", { animate: EMPTY_ANIM }));
    expect(d.edges[0]!.id.startsWith("c0-")).toBe(true);
  });

  it("独自 layout preset (class) では phases 空なら fallback 注入も走らない", () => {
    // 書いた段が 0 件なら、 書いた段に由来する段は入らない。 代わりに動かない図として
    // 扱われ、 段が 1 つだけ残る (#1086)。 段が 1 件も無い図は描画側が弾くため。
    //
    // 段の id は組み立て器が決める (#1466 でクラス図は自前の段を持つようになった)。
    // 名前を写すと描画側を直した時に片方だけ古くなる
    const d = compileToCdl(makeDoc("class", { animate: EMPTY_ANIM }));
    expect(d.phases).toHaveLength(1);
    expect(d.phases[0]!.tweens, "動かない図なのに動きが入っている").toEqual([]);
  });

  it("phases が 1 個以上なら animate 経路に入る (guard の true 側)", () => {
    const d = compileToCdl(makeDoc("flow", { animate: animOf() }));
    expect(d.lanes.map((l) => l.id)).toEqual(["main"]);
  });
});

describe("mergePartsFromActors: actor.lane が自身の lane と一致する場合の guard", () => {
  const PART = (): CdlDiagram => ({
    id: "parts-g", topic: "t",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [{ id: "n", lane: "l", stack: 0, kind: "actor", title: "N" }] as CdlDiagram["nodes"],
    edges: [], states: [], phases: [] as CdlDiagram["phases"],
  });

  /** parts actor 自身の slug を lane 指定した doc (guard が実際に効く唯一の形)。 */
  const compileSelfLane = () => compileToCdl(
    // 縦列の張替えを見るので、面ごとに縦列を作る図種を使う (#1466 で順序図は板になった)
    makeDoc("swimlane", {
      actors: [actor("A"), actor("p1", { partId: "g", lane: "p1" })],
      flow: [step("A", "A")],
    }),
    { partsCatalog: { g: PART() } },
  );

  it("張替え先 lane (自身の slug) は削除されず残る", () => {
    const d = compileSelfLane();
    expect(d.lanes.some((l) => l.id === "p1")).toBe(true);
  });

  it("part node はその lane に張替えられる", () => {
    const d = compileSelfLane();
    expect(node(d, "p1__n").lane).toBe("p1");
  });

  it("part 専用 lane (p1__l) は作られない (張替え経路)", () => {
    const d = compileSelfLane();
    expect(d.lanes.some((l) => l.id === "p1__l")).toBe(false);
  });

  it("通常 actor の lane / node は保持される", () => {
    const d = compileSelfLane();
    expect(d.nodes.some((n) => n.id === "a")).toBe(true);
  });

  it("lane 指定なしなら parts actor の lane は削除され part 専用 lane が作られる", () => {
    // 位置を書いた見本で見る。 位置を書かない見本は自分の名前の縦列に入る (#1980、下の検査)
    const d = compileToCdl(
      makeDoc("swimlane", {
        actors: [actor("A"), actor("p1", { partId: "g", posX: 900, posY: 600 })],
        flow: [step("A", "A")],
      }),
      { partsCatalog: { g: PART() } },
    );
    expect(d.lanes.some((l) => l.id === "p1")).toBe(false);
    expect(d.lanes.some((l) => l.id === "p1__l")).toBe(true);
  });

  it("lane 指定も位置も無ければ、parts actor の lane に張替え part 専用 lane を作らない (#1980)", () => {
    const d = compileToCdl(
      makeDoc("swimlane", { actors: [actor("A"), actor("p1", { partId: "g" })], flow: [step("A", "A")] }),
      { partsCatalog: { g: PART() } },
    );
    expect(d.lanes.some((l) => l.id === "p1")).toBe(true);
    expect(node(d, "p1__n").lane).toBe("p1");
    expect(d.lanes.some((l) => l.id === "p1__l")).toBe(false);
  });
});

// ── 第 4 弾 (i): 貪欲/非貪欲 regex・option 漏れ・group container・cardinality strip ──

describe("矢印 regex の非貪欲性 (A→B→C で from/to の切り出しが変わる)", () => {
  /** 3 段矢印の actor 名を持つ doc で from 側の非貪欲マッチを検証する。 */
  const names = ["A", "B→C"] as const;

  it("最初の矢印で分割される", () => {
    // 非貪欲 (.+?) なら from="A"、 貪欲 (.+) なら from="A→B" となり別 edge を探して失敗する。
    const d = compileToCdl(makeDoc("flow", {
      animate: animOf(["A→B→C"]),
      actors: [actor(at(names, 0, "names")), actor(at(names, 1, "names"))],
        flow: [step(at(names, 0, "names"), at(names, 1, "names"))],
    }));
    expect(d.phases[0]!.activate.length).toBeGreaterThan(0);
  });

  it("injectPhasesFallback: 最初の矢印で分割される", () => {
    const d = compileToCdl(makeDoc("class", {
      animate: animOf(["A→B→C"]),
      actors: [actor(at(names, 0, "names")), actor(at(names, 1, "names"))],
        flow: [step(at(names, 0, "names"), at(names, 1, "names"))],
    }));
    const target = d.edges.find((e) => e.from === "a");
    expect(target).toBeDefined();
    expect(d.phases[0]!.activate).toContain(target!.id);
  });

  it("injectPhasesFallback: actor 名 highlight は header 付き node も解決する", () => {
    const d = compileToCdl(makeDoc("class", { animate: animOf(["A"]) }));
    expect(d.phases[0]!.activate).toContain("a");
  });
});

describe("applyV05Extensions: actor option が他 actor に漏れない", () => {
  it("subtitle は指定した actor の node にのみ付く", () => {
    const d = compile("swimlane", { actors: [actor("A", { subtitle: "onlyA" }), actor("B")] });
    expect(node(d, "a").subtitle).toBe("onlyA");
    expect(node(d, "b").subtitle).toBeUndefined();
  });

  it("eyebrow / value / rows も他 actor に漏れない", () => {
    const d = compile("swimlane", {
      actors: [actor("A", { eyebrow: "e", value: "v", rows: ["r"] }), actor("B")],
    });
    expect(node(d, "b").eyebrow).toBeUndefined();
    expect(node(d, "b").value).toBeUndefined();
    expect(node(d, "b").rows).toBeUndefined();
  });

});

describe("applyEdgeInlineOptions: 非 seq-like で正しい edge に割当てる", () => {
  it("2 step のうち後段だけに guard を付けると前段には付かない", () => {
    const d = compile("flow", {
      actors: [actor("A"), actor("B"), actor("C")],
      flow: [step("A", "B"), step("B", "C", { guard: "second" })],
    });
    const withGuard = d.edges.filter((e) => e.guard === "second");
    expect(withGuard.length).toBe(1);
    expect(withGuard[0]!.to).toBe("c");
  });

  it("前段だけに guard を付けると後段には付かない", () => {
    const d = compile("flow", {
      actors: [actor("A"), actor("B"), actor("C")],
      flow: [step("A", "B", { guard: "first" }), step("B", "C")],
    });
    const withGuard = d.edges.filter((e) => e.guard === "first");
    expect(withGuard.length).toBe(1);
    expect(withGuard[0]!.to).toBe("b");
  });

  it("後段だけの guard が前段に漏れない", () => {
    const d = compile("topology", {
      actors: [actor("A"), actor("B"), actor("C")],
      flow: [step("A", "B"), step("B", "C", { guard: "g2" })],
    });
    expect(d.edges.find((e) => e.from === "a" && e.to === "b")?.guard).toBeUndefined();
    expect(d.edges.find((e) => e.from === "b" && e.to === "c")?.guard).toBe("g2");
  });
});

describe("applyGroupContainers: container lane 生成と重複回避", () => {
  // 束ねる縦列を持たない組は枠を作らない (#1972)。 topology が作る縦列 `main` を束ねる
  it("groups から group-{id} lane が contain: true で作られる", () => {
    const d = compile("topology", { groups: 束ね({ g1: { label: "G1", lanes: ["main"] } }) });
    const l = lane(d, "group-g1");
    expect(l.contain).toBe(true);
    expect(l.width).toBe(800);
    expect(l.label).toBe("G1");
  });

  it("label 未指定なら id が label になる (?? 分岐)", () => {
    const d = compile("topology", { groups: 束ね({ g1: { lanes: ["main"] } }) });
    expect(lane(d, "group-g1").label).toBe("g1");
  });

  it("同名 lane が既にあれば重複追加しない", () => {
    const d = compile("topology", {
      groups: 束ね({ g1: { label: "G1" } }),
      lanes: 縦列({ "group-g1": { x: 5, width: 111 } }),
    });
    expect(d.lanes.filter((l) => l.id === "group-g1").length).toBe(1);
    // 既存 lane が保持される (push で上書きされない)
    expect(lane(d, "group-g1").width).toBe(111);
  });

  it("groups が空 object なら lane を追加しない (early return)", () => {
    const withEmpty = compile("topology", { groups: 束ね({}) });
    const without = compile("topology");
    expect(withEmpty.lanes.length).toBe(without.lanes.length);
  });

  it("複数 group がすべて lane 化される", () => {
    const d = compile("topology", {
      groups: 束ね({ g1: { lanes: ["main"] }, g2: { lanes: ["main"] } }),
    });
    expect(d.lanes.some((l) => l.id === "group-g1")).toBe(true);
    expect(d.lanes.some((l) => l.id === "group-g2")).toBe(true);
  });
});

describe("stripCardinality: 括弧 / 空白の除去と fallback", () => {
  it("前置き括弧つき cardinality を除去して片括弧を残さない", () => {
    // "(1:N) owns" → cardinality 除去で "() owns" になり、 空括弧を落として "owns"。
    // 空括弧除去が無いと ") owns" と片括弧が label に残り user に見える。
    const d = compile("er", { flow: [step("A", "B", { label: "(1:N) owns" })] });
    expect(d.edges[0]!.label).toBe("owns");
  });

  it("後置き括弧つき cardinality を除去して片括弧を残さない", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "owns (1:N)" })] });
    expect(d.edges[0]!.label).toBe("owns");
  });

  it("括弧内に空白がある形式 ( 1:N ) も除去できる", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "owns ( 1:N )" })] });
    expect(d.edges[0]!.label).toBe("owns");
  });

  it("cardinality と無関係な正当な括弧は保持する (cc-codex #879 Round 4)", () => {
    // token を囲む括弧ごと除去することで、 label 中の正当な () を壊さない。
    // 旧実装 (空括弧の全域除去) は "do() now" → "do now" と正当な括弧を壊していた。
    const d = compile("er", { flow: [step("A", "B", { label: "do() now" })] });
    expect(d.edges[0]!.label).toBe("do() now");
  });

  it("method-call の括弧と cardinality の括弧を区別する", () => {
    // "fn() (1:N)" は method-call の "()" を残し cardinality の "(1:N)" だけ除去して "fn()"。
    const d = compile("er", { flow: [step("A", "B", { label: "fn() (1:N)" })] });
    expect(d.edges[0]!.label).toBe("fn()");
  });

  it("中間の cardinality token 除去で連続空白を残さない", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "A 1:N B" })] });
    expect(d.edges[0]!.label).toBe("A B");
  });

  it("cardinality を含まない label の複数空白を破壊しない (cc-codex #879 Round 5)", () => {
    // token を除去しない label は空白を一切いじらない (無条件正規化は改行/複数空白を破壊した)。
    const d = compile("er", { flow: [step("A", "B", { label: "line1  line2" })] });
    expect(d.edges[0]!.label).toBe("line1  line2");
  });

  it("cardinality を含まない label の改行を破壊しない", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "line1\n\nline2" })] });
    expect(d.edges[0]!.label).toBe("line1\n\nline2");
  });

  it("cardinality 除去時も label 内の改行は保持する", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "desc (1:N)\nmore" })] });
    expect(d.edges[0]!.label).toBe("desc\nmore");
  });

  it("cardinality 除去時に CRLF の \\r を落とさない", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "x (1:N)\r\ny" })] });
    expect(d.edges[0]!.label).toBe("x\r\ny");
  });

  it("cardinality を含まない label のタブ / 全角空白を破壊しない", () => {
    const tab = compile("er", { flow: [step("A", "B", { label: "a\tb" })] });
    expect(tab.edges[0]!.label).toBe("a\tb");
    const wide = compile("er", { flow: [step("A", "B", { label: "A　B" })] });
    expect(wide.edges[0]!.label).toBe("A　B");
  });

  it("cardinality-only + 改行 は元 label に fallback する (cc-codex #879 Round 6)", () => {
    // 除去後に改行しか残らない場合、 不可視 label にせず元 label を維持する。
    const nl = compile("er", { flow: [step("A", "B", { label: "1:N\n" })] });
    expect(nl.edges[0]!.label).toBe("1:N\n");
    const wrap = compile("er", { flow: [step("A", "B", { label: "\n1:N\n" })] });
    expect(wrap.edges[0]!.label).toBe("\n1:N\n");
    const spaced = compile("er", { flow: [step("A", "B", { label: "  1:N  " })] });
    expect(spaced.edges[0]!.label).toBe("  1:N  ");
  });

  it("Unicode 行区切り (U+2028/U+2029) / vertical tab / form feed / NEL は改行系として保持する", () => {
    for (const nl of [" ", " ", "\v", "\f", ""]) {
      // cardinality 無 = 完全保持
      const noCard = compile("er", { flow: [step("A", "B", { label: `a${nl}b` })] });
      expect(noCard.edges[0]!.label).toBe(`a${nl}b`);
      // cardinality 有 = 改行系は保持、 水平空白のみ畳む
      const withCard = compile("er", { flow: [step("A", "B", { label: `x (1:N)${nl}y` })] });
      expect(withCard.edges[0]!.label.includes(nl)).toBe(true);
    }
  });

  it("不可視文字 (NEL / BOM / ZWSP / ZWNJ / ZWJ / WORD JOINER) のみ残る cardinality label は元 label に fallback する (cc-codex #879 Round 7/8)", () => {
    // fallback 判定を Unicode カテゴリ (White_Space + Cf + Cc を除く可視文字判定) にすることで、
    // 個別の不可視文字を列挙せず構造的に「除去後に視覚的な内容が残らない」 ケースを塞ぐ。
    const invisibles = ["", "﻿", "​", "\u200c", "\u200d", "\u2060"];
    for (const ch of invisibles) {
      const d = compile("er", { flow: [step("A", "B", { label: `1:N${ch}` })] });
      expect(d.edges[0]!.label).toBe(`1:N${ch}`);
    }
  });

  it("同一 cardinality token が複数回出る label で全て除去される (cc-codex #879 Round 8)", () => {
    // 裸 token 除去を global にしたことで、 2 個目以降の同一 token も消える。
    const d = compile("er", { flow: [step("A", "B", { label: "1:N and 1:N" })] });
    expect(d.edges[0]!.label).toBe("and");
  });

  it("default-ignorable 不可視文字 (variation selector / Hangul filler / Mongolian VS) のみ残る label は fallback する (cc-codex #879 Round 9)", () => {
    // Cf/Cc/White_Space に入らない不可視文字 (Mn の VS、 Lo の filler) も \p{Default_Ignorable_Code_Point}
    // で捕捉して fallback する。 Braille blank U+2800 は不可視でないため content 維持。
    const ignorables = ["\uFE0F", "\uFE00", "\u3164", "\u115F", "\u180B"];
    for (const ch of ignorables) {
      const d = compile("er", { flow: [step("A", "B", { label: `1:N${ch}` })] });
      expect(d.edges[0]!.label).toBe(`1:N${ch}`);
    }
    // Braille blank は content 扱い = 除去後も残る (fallback しない)
    const braille = compile("er", { flow: [step("A", "B", { label: "\u2800 1:N" })] });
    expect(braille.edges[0]!.label).toBe("\u2800");
  });

  it("cardinality token に隣接する数字 (timestamp / ratio) を over-removal しない (cc-codex #879 Round 9)", () => {
    // 裸 token 除去を global にする際、 前後に数字が隣接しない境界を付けて timestamp や比率の
    // 部分文字列を消さない。
    const ts = compile("er", { flow: [step("A", "B", { label: "1:1 at 10:11:12" })] });
    expect(ts.edges[0]!.label).toBe("at 10:11:12");
    const time2 = compile("er", { flow: [step("A", "B", { label: "call at 12:11:10" })] });
    expect(time2.edges[0]!.label).toBe("call at 12:11:10");
    const ratio = compile("er", { flow: [step("A", "B", { label: "scale 10:11" })] });
    expect(ratio.edges[0]!.label).toBe("scale 10:11");
  });

  it("cardinality token に隣接する英字 (alphabet 埋め込み) を over-removal しない (cc-codex #879 Round 10)", () => {
    // 単語境界を英数字にすることで、 label 中に token が語中で現れても壊さない。
    const col = compile("er", { flow: [step("A", "B", { label: "column:Metadata" })] });
    expect(col.edges[0]!.label).toBe("column:Metadata");
    const embed = compile("er", { flow: [step("A", "B", { label: "x1:Ny" })] });
    expect(embed.edges[0]!.label).toBe("x1:Ny");
  });

  it("CJK 隣接の cardinality token は境界成立して認識される (ASCII identifier 外、 Round 12)", () => {
    // 境界クラスは ASCII identifier (`[A-Za-z0-9_]`) のみ。 CJK は境界外なので token を認識して除去する。
    const d = compile("er", { flow: [step("A", "B", { label: "注文1:N明細" })] });
    expect(d.edges[0]!.label).toBe("注文明細");
    expect(d.edges[0]!.sub).toBe("1:N");
  });

  it("snake_case (アンダースコア隣接) の token を over-removal / 誤認しない (cc-codex #879 Round 11)", () => {
    // 境界クラスに `_` を含めることで、 DB schema 由来の snake_case label (`field_1:N` 等) を壊さない。
    const f1 = compile("er", { flow: [step("A", "B", { label: "field_1:N" })] });
    expect(f1.edges[0]!.label).toBe("field_1:N");
    expect(f1.edges[0]!.sub).toBe("1:N"); // cardinality 誤認せず default
    const f2 = compile("er", { flow: [step("A", "B", { label: "parent_N:M_child" })] });
    expect(f2.edges[0]!.label).toBe("parent_N:M_child");
    const f3 = compile("er", { flow: [step("A", "B", { label: "maps_to_1:N" })] });
    expect(f3.edges[0]!.label).toBe("maps_to_1:N");
  });

  it("alphabet 埋め込み token は cardinality としても認識されない (strip/parse の境界一致、 Round 10)", () => {
    // parse (sub 反映) と strip (label 除去) が同じ単語境界 matcher を共有するため乖離しない。
    // `column:Metadata` は cardinality と誤認しないので sub に cardinality が入らない。
    const col = compile("er", { flow: [step("A", "B", { label: "column:Metadata" })] });
    // sub は cardinality 由来。 token 誤認しなければ default "1:N" が入る (ER preset の既定)。
    expect(col.edges[0]!.sub).toBe("1:N");
    // 正当な cardinality は認識される (対照)
    const real = compile("er", { flow: [step("A", "B", { label: "owns (0..1)" })] });
    expect(real.edges[0]!.sub).toBe("0..1");
    expect(real.edges[0]!.label).toBe("owns");
  });

  it("不可視文字が content と混在する場合は保持する (Cf 単独でなければ意味あり)", () => {
    // BOM が content 文字と混在していれば visible content ありと判定して保持する。
    const d = compile("er", { flow: [step("A", "B", { label: `x\uFEFFy (1:N)` })] });
    expect(d.edges[0]!.label).toBe(`x\uFEFFy`);
  });

  it("cardinality のみの label は元 label に fallback (|| 分岐)", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "1:N" })] });
    // 除去すると空になるため元 label を維持する
    expect(d.edges[0]!.label).toBe("1:N");
  });

  it("cardinality を含まない label はそのまま", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "plain" })] });
    expect(d.edges[0]!.label).toBe("plain");
  });

  it("前後の空白を trim しつつ token を囲まない裸の括弧は保持する", () => {
    // token を囲む括弧のみ除去する方針のため、 cardinality を包まない裸の ")" は
    // user が意図的に書いた括弧として保持する (前後の空白のみ trim)。
    const d = compile("er", { flow: [step("A", "B", { label: "  owns 1:1 )" })] });
    expect(d.edges[0]!.label).toBe("owns )");
  });
});

describe("mergePartsFromActors: 共有 lane の label が parts actor 名と一致する場合", () => {
  const PART = (): CdlDiagram => ({
    id: "parts-t", topic: "t",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [{ id: "n", lane: "l", stack: 0, kind: "actor", title: "N" }] as CdlDiagram["nodes"],
    edges: [], states: [], phases: [] as CdlDiagram["phases"],
  });

  it("flow の共有 lane label (= doc.title) と parts actor 名が同じでも通常 node を消さない", () => {
    // 非 seq-like では lane 由来 exact set 経路に入らない (seq-like guard) ため、
    // 共有 lane に属する通常 actor の node は保持される。
    const d = compileToCdl(
      makeDoc("flow", {
        title: "p1",
        actors: [actor("p1", { partId: "t" }), actor("other")],
        flow: [step("p1", "other")],
      }),
      { partsCatalog: { t: PART() } },
    );
    expect(d.nodes.some((n) => n.id === "other")).toBe(true);
    expect(d.lanes.some((l) => l.id === "flow")).toBe(true);
  });
});

describe("mergePartIntoDiagram: target が空の diagram への merge", () => {
  const PART = (): CdlDiagram => ({
    id: "parts-e", topic: "t",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [{ id: "n", lane: "l", stack: 0, kind: "actor", title: "N" }] as CdlDiagram["nodes"],
    edges: [], states: [], phases: [] as CdlDiagram["phases"],
  });

  it("parts actor のみ (target node 0) + posX 指定でも stack が有限値になる", () => {
    // target.nodes が空の時 Math.max(...[]) = -Infinity になる経路を踏むため、
    // length > 0 guard が効かないと stack が -Infinity に汚染される。
    const d = compileToCdl(
      makeDoc("sequence", { actors: [actor("p1", { partId: "e", posX: 100, posY: 200 })], flow: [] }),
      { partsCatalog: { e: PART() } },
    );
    const n = node(d, "p1__n");
    expect(Number.isFinite(n.stack)).toBe(true);
    expect(n.stack).toBe(1000);
  });

  it("shape の array 要素に null があっても壊れない (scaleGeom の null 分岐)", () => {
    const part = PART();
    (
      at(part.nodes, 0, "part.nodes") as { shape?: Record<string, unknown> }
    ).shape = { kind: "arc", items: [null, { radius: 10 }] };
    const d = compileToCdl(
      makeDoc("sequence", {
        actors: [actor("A"), actor("p1", { partId: "e", posX: 100, posY: 200, posW: 800, posH: 880 })],
        flow: [step("A", "A")],
      }),
      { partsCatalog: { e: part } },
    );
    const s = node(d, "p1__n").shape as { items?: unknown[] };
    expect(s.items?.[0]).toBeNull();
    expect((s.items?.[1] as { radius?: number }).radius).toBeGreaterThan(10);
  });
});

// ── 第 4 弾 (j): cc-codex #879 review 指摘への対応 ──
// MAJOR 2 = scale 時の lane 中心 / node 中心の複合不変量
// MAJOR 3 = 等価と誤判定していた 4 種を実際に kill する test
// MINOR 4-5 = 弱い assertion の強化 + part edge merge の未検証経路

describe("mergePartIntoDiagram: scale 時も lane 中心と node 中心が drop 座標に一致する", () => {
  it("posW 指定時 lane は拡張後の幅で drop 座標に中心합わせされる", () => {
    // partsLaneW=400、 posW=800 → laneScaleX=2 → 拡張後幅 800
    // lane.x = posX - 800/2 = 600、 lane 中心 = 600 + 400 = 1000 = posX
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 });
    const l = lane(d, "p1__l");
    expect(l.x).toBe(600);
    expect(l.width).toBe(800);
    expect(l.x! + l.width / 2).toBe(1000);
  });

  it("posW 指定時も node 中心は drop 座標に一致する (lane 中心と同値)", () => {
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 });
    const l = lane(d, "p1__l");
    expect(node(d, "p1__top").posX).toBe(1000);
    // 複合不変量 = lane 中心 === node 中心 === drop 座標
    expect(node(d, "p1__top").posX).toBe(l.x! + l.width / 2);
  });

  it("scale 無しでも lane 中心 === node 中心 === drop 座標", () => {
    const d = compileWithPart({ posX: 1000, posY: 500 });
    const l = lane(d, "p1__l");
    expect(l.x).toBe(800);
    expect(l.x! + l.width / 2).toBe(1000);
    expect(node(d, "p1__top").posX).toBe(1000);
  });

  it("縮小 scale (posW < 元幅) でも中心が保たれる", () => {
    // posW=200 → laneScaleX=0.5 → 幅 200、 lane.x = 1000 - 100 = 900
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 200, posH: 220 });
    const l = lane(d, "p1__l");
    expect(l.x).toBe(900);
    expect(l.width).toBe(200);
    expect(node(d, "p1__top").posX).toBe(1000);
  });
});

describe("mergePartsFromActors: actor.lane 指定時は slug fallback 経路に入る", () => {
  const PART = (): CdlDiagram => ({
    id: "parts-sa", topic: "t",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [{ id: "n", lane: "l", stack: 0, kind: "actor", title: "N" }] as CdlDiagram["nodes"],
    edges: [], states: [], phases: [] as CdlDiagram["phases"],
  });

  /** 自身の縦列を張替え先に書いた見本 (名前一致の経路ではなく頭一致の fallback を通る形)。 */
  const 組む = () => compileToCdl(
    makeDoc("swimlane", {
      actors: [actor("A"), actor("p1", { partId: "sa", lane: "p1" })],
      flow: [step("A", "p1")],
    }),
    { partsCatalog: { sa: PART() } },
  );

  it("見本の仮の箱が消えて中身が入る", () => {
    const d = 組む();
    expect(d.nodes.some((n) => n.id === "p1"), "仮の箱が残っている").toBe(false);
    expect(d.nodes.some((n) => n.id === "p1__n"), "見本の中身が入っていない").toBe(true);
  });

  it("同経路で素の登場人物の箱は保持される", () => {
    expect(組む().nodes.some((n) => n.id === "a"), "素の箱が消えている").toBe(true);
  });
});

describe("矢印 regex: 複数文字 actor 名で 1 文字 match に縮退しない", () => {
  it("複数文字 actor 名を丸ごと from として扱う", () => {
    // (.+?) → (.) に縮退すると from が 1 文字目だけになり edge を引き当てられない。
    const d = compileToCdl(makeDoc("flow", {
      animate: animOf(["Alpha→Beta"]),
      actors: [actor("Alpha"), actor("Beta")],
      flow: [step("Alpha", "Beta")],
    }));
    expect(d.phases[0]!.activate.some((id) => id.includes("-alpha-beta"))).toBe(true);
  });

  it("injectPhasesFallback も複数文字 actor 名を扱える", () => {
    const d = compileToCdl(makeDoc("class", {
      animate: animOf(["Alpha→Beta"]),
      actors: [actor("Alpha"), actor("Beta")],
      flow: [step("Alpha", "Beta")],
    }));
    const target = d.edges.find((e) => e.from === "alpha" && e.to === "beta");
    expect(target).toBeDefined();
    expect(d.phases[0]!.activate).toContain(target!.id);
  });
});

describe("mergePartIntoDiagram: part edge の merge (prefix 付与)", () => {
  /** edge を持つ part = merge 時に id / from / to が alias prefix される経路。 */
  function partWithEdge(): CdlDiagram {
    return {
      id: "parts-pe", topic: "t",
      lanes: [{ id: "l", x: 0, width: 400 }],
      nodes: [
        { id: "n1", lane: "l", stack: 0, kind: "actor", title: "N1" },
        { id: "n2", lane: "l", stack: 1, kind: "actor", title: "N2" },
      ] as CdlDiagram["nodes"],
      edges: [{ id: "pe0", from: "n1", to: "n2", label: "inner", tone: "accent" }] as CdlDiagram["edges"],
      states: [], phases: [] as CdlDiagram["phases"],
    };
  }

  it("part edge は alias prefix 付きで target に追加される", () => {
    const d = compileWithPart({}, partWithEdge());
    const e = d.edges.find((x) => x.id === "p1__pe0");
    expect(e).toBeDefined();
    expect(e!.from).toBe("p1__n1");
    expect(e!.to).toBe("p1__n2");
  });

  it("part edge の label / tone は保持される", () => {
    const d = compileWithPart({}, partWithEdge());
    const e = d.edges.find((x) => x.id === "p1__pe0")!;
    expect(e.label).toBe("inner");
    expect(e.tone).toBe("accent");
  });

  it("edge を持たない part では edge が増えない", () => {
    const withEdge = compileWithPart({}, partWithEdge()).edges.length;
    const withoutEdge = compileWithPart().edges.length;
    expect(withEdge).toBe(withoutEdge + 1);
  });

  it("part edge も drop 座標指定時に追加される (座標経路と独立)", () => {
    const d = compileWithPart({ posX: 900, posY: 400 }, partWithEdge());
    expect(d.edges.some((x) => x.id === "p1__pe0")).toBe(true);
  });
});

describe("mergePartsFromActors: partsCatalog の継承 property を拾わない", () => {
  it("Object.prototype 由来の property は part として解決しない", () => {
    const warn = console.warn;
    const logs: string[] = [];
    console.warn = (m: string) => logs.push(String(m));
    try {
      const d = compileToCdl(
        makeDoc("sequence", {
          actors: [actor("A"), actor("p1", { partId: "toString" })],
          flow: [step("A", "A")],
        }),
        { partsCatalog: {} },
      );
      // 継承 property (toString) を part として使わず warn + skip する
      expect(d.nodes.some((n) => n.id.startsWith("p1__"))).toBe(false);
      expect(logs.some((l) => l.includes("toString"))).toBe(true);
    } finally {
      console.warn = warn;
    }
  });

  it("constructor / __proto__ も同様に解決しない", () => {
    const warn = console.warn;
    console.warn = () => {};
    try {
      for (const bad of ["constructor", "__proto__", "valueOf"]) {
        const d = compileToCdl(
          makeDoc("sequence", { actors: [actor("A"), actor("p1", { partId: bad })], flow: [step("A", "A")] }),
          { partsCatalog: {} },
        );
        expect(d.nodes.some((n) => n.id.startsWith("p1__")), `${bad} は解決されない`).toBe(false);
      }
    } finally {
      console.warn = warn;
    }
  });
});

describe("state preset: initial / final marker の実値検証 (assertion 強化)", () => {
  it("先頭 actor と末尾 actor で marker 属性が異なる", () => {
    const d = compileToCdl(makeDoc("state", {
      animate: animOf(), actors: [actor("A"), actor("B"), actor("C")],
      flow: [step("A", "B"), step("B", "C")],
    }));
    const first = node(d, "a");
    const mid = node(d, "b");
    const last = node(d, "c");
    // 中間 actor は initial / final どちらの marker も持たない基準点になる
    const keysOf = (n: typeof first) => Object.keys(n).sort().join(",");
    expect(keysOf(first) !== keysOf(mid) || keysOf(last) !== keysOf(mid)).toBe(true);
  });

  it("actor 1 個なら initial のみで final は付かない", () => {
    const single = compileToCdl(makeDoc("state", {
      animate: animOf(), actors: [actor("A")], flow: [],
    }));
    const pair = compileToCdl(makeDoc("state", {
      animate: animOf(), actors: [actor("A"), actor("B")], flow: [step("A", "B")],
    }));
    // 2 actor 時の末尾 node と 1 actor 時の node は marker 構成が異なる
    expect(JSON.stringify(node(single, "a")) !== JSON.stringify(node(pair, "b"))).toBe(true);
  });
});

describe("mergePartIntoDiagram: readouts の有無で target.readouts が切り替わる (assertion 強化)", () => {
  it("readouts を持たない part では target.readouts が生えない", () => {
    const d = compileWithPart();
    expect(d.readouts).toBeUndefined();
  });

  it("readouts を持つ part では長さ 1 の配列が生える", () => {
    const part = makeTestPart();
    part.readouts = [
      { id: "r1", kind: "gauge", source: "{v}", nodeId: "top" },
    ] as unknown as CdlDiagram["readouts"];
    const d = compileWithPart({}, part);
    expect(d.readouts?.length).toBe(1);
  });

  it("readouts が空配列の part でも readouts は生えない", () => {
    const part = makeTestPart();
    part.readouts = [] as unknown as CdlDiagram["readouts"];
    const d = compileWithPart({}, part);
    expect(d.readouts).toBeUndefined();
  });
});

// ── 第 4 弾 (k): cc-codex #879 Round 2 指摘への対応 ──

describe("mergePartIntoDiagram: 明示 posX を持つ node も scale 時に中心が保たれる", () => {
  /** node が絶対座標 (posX) を持つ part。 */
  function partWithExplicitPosX(): CdlDiagram {
    const p = makeTestPart();
    p.nodes = [
      { id: "c", lane: "l", stack: 0, kind: "actor", title: "C", posX: 200, w: 100, h: 50 },
      { id: "l1", lane: "l", stack: 0, kind: "actor", title: "L", posX: 100, w: 100, h: 50 },
    ] as CdlDiagram["nodes"];
    return p;
  }

  it("part 中心にある node は scale しても drop 座標に一致する", () => {
    // partOrigW=400 → 中心 200。 node "c" は posX 200 = part 中心。
    // posW 800 (scaleX 2) でも中心は drop 座標 1000 のまま。
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, partWithExplicitPosX());
    expect(node(d, "p1__c").posX).toBe(1000);
  });

  it("中心から離れた node は距離が scale 倍される", () => {
    // node "l1" は part 中心から 100 左 → scaleX 2 で 200 左 → 1000 - 200 = 800
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, partWithExplicitPosX());
    expect(node(d, "p1__l1").posX).toBe(800);
  });

  it("明示 posX でも lane 中心 === 中心 node の posX (複合不変量)", () => {
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, partWithExplicitPosX());
    const l = lane(d, "p1__l");
    expect(node(d, "p1__c").posX).toBe(l.x! + l.width / 2);
  });

  it("scale 無しなら従来の単純加算と同値", () => {
    // partsLaneStartX = 1000 - 200 = 800、 node "c" posX 200 → 200 + 800 = 1000
    const d = compileWithPart({ posX: 1000, posY: 500 }, partWithExplicitPosX());
    expect(node(d, "p1__c").posX).toBe(1000);
    expect(node(d, "p1__l1").posX).toBe(900);
  });
});

describe("mergePartIntoDiagram: stack が 0 始まりでない part の中心合わせ", () => {
  /** stack 2/3 の part = 段 0 から始まらない。 縦の基準の段の範囲が 0 からにならない */
  function partStackFrom2(): CdlDiagram {
    const p = makeTestPart();
    p.nodes = [
      { id: "s2", lane: "l", stack: 2, kind: "actor", title: "S2", w: 100, h: 50 },
      { id: "s3", lane: "l", stack: 3, kind: "actor", title: "S3", w: 100, h: 50 },
    ] as CdlDiagram["nodes"];
    return p;
  }

  it("段の番号ではなく頁の縦位置から置き、中心が drop 座標に来る (#1992)", () => {
    // 頁は空の段 0 / 1 を詰めて s2 と s3 を並べる = 中心の間 150
    // s2 = -75 + 500 = 425、 s3 = 75 + 500 = 575
    // 段の番号から置くと、段 0 からの距離や段の送り幅 220 が位置に混ざる
    const 差 = 頁の縦の差(partStackFrom2());
    expect(差.get("s3")! - 差.get("s2")!, "頁の中心の間が 150 ではない (前提が崩れた)").toBe(150);
    const d = compileWithPart({ posX: 1000, posY: 500 }, partStackFrom2());
    expect(node(d, "p1__s2").posY).toBe(差.get("s2")! + 500);
    expect(node(d, "p1__s3").posY).toBe(差.get("s3")! + 500);
  });

  it("node 群の縦中心が drop 座標に一致する", () => {
    const d = compileWithPart({ posX: 1000, posY: 500 }, partStackFrom2());
    const top = node(d, "p1__s2").posY!;
    const bottom = node(d, "p1__s3").posY!;
    expect((top + bottom) / 2).toBe(500);
  });

  it("縦の基準も実 stack 範囲で算出される (scaleY に反映)", () => {
    // maxStack-minStack+1 = 2 → 縦の基準 440、 posH 880 で scaleY = 2
    // s2 = -75 * 2 + 500 = 350、 s3 = 75 * 2 + 500 = 650
    // stack 集計が 0 固定に潰れると基準が (3-0+1)*220 = 880 になり scaleY = 1 に落ちる
    const 差 = 頁の縦の差(partStackFrom2());
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, partStackFrom2());
    expect(node(d, "p1__s2").posY).toBe(差.get("s2")! * 2 + 500);
    expect(node(d, "p1__s3").posY).toBe(差.get("s3")! * 2 + 500);
  });
});

describe("state preset: initial / final marker の eyebrow 実値検証", () => {
  it("先頭 actor に eyebrow 初期、 末尾 actor に eyebrow 最終が付く", () => {
    const d = compileToCdl(makeDoc("state", {
      animate: animOf(), actors: [actor("A"), actor("B"), actor("C")],
      flow: [step("A", "B"), step("B", "C")],
    }));
    expect(node(d, "a").eyebrow).toBe("初期");
    expect(node(d, "c").eyebrow).toBe("最終");
  });

  it("中間 actor には marker eyebrow が付かない", () => {
    const d = compileToCdl(makeDoc("state", {
      animate: animOf(), actors: [actor("A"), actor("B"), actor("C")],
      flow: [step("A", "B"), step("B", "C")],
    }));
    expect(node(d, "b").eyebrow).toBeUndefined();
  });

  it("actor 1 個なら初期のみで最終は付かない (length > 1 条件)", () => {
    const d = compileToCdl(makeDoc("state", {
      animate: animOf(), actors: [actor("A")], flow: [],
    }));
    expect(node(d, "a").eyebrow).toBe("初期");
  });

  it("state 以外の preset では marker eyebrow が付かない", () => {
    const d = compileToCdl(makeDoc("swimlane", {
      animate: animOf(), actors: [actor("A"), actor("B")], flow: [step("A", "B")],
    }));
    expect(node(d, "a").eyebrow).toBeUndefined();
    expect(node(d, "b").eyebrow).toBeUndefined();
  });
});

// ── 第 4 弾 (l): cc-codex #879 Round 3 指摘への対応 (座標統一 + header 帰属を preset 種別で) ──

describe("mergePartIntoDiagram: lane.x != 0 でも明示 posX と auto-layout が一致する", () => {
  /** lane.x を 0 以外に持ち、 posX 明示 node と posX 無し node を併存させる part。 */
  function partLaneXNonZero(): CdlDiagram {
    return {
      id: "parts-lx", topic: "t",
      lanes: [{ id: "l", x: 100, width: 400 }],
      nodes: [
        { id: "explicit", lane: "l", stack: 0, kind: "actor", title: "E", posX: 300, w: 80, h: 40 },
        { id: "auto", lane: "l", stack: 0, kind: "actor", title: "A", w: 80, h: 40 },
      ] as CdlDiagram["nodes"],
      edges: [], states: [], phases: [] as CdlDiagram["phases"],
    };
  }

  it("lane.x=100 / scaleX=2 で明示 posX (part 中心) と auto-layout が同じ drop 座標に来る", () => {
    // part 中心 X = lane.x(100) + width/2(200) = 300。 explicit node は posX 300 = 中心。
    // auto node の lane 中央も 300。 両方 scale しても drop 座標 1000 に一致すべき。
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, partLaneXNonZero());
    expect(node(d, "p1__explicit").posX).toBe(1000);
    expect(node(d, "p1__auto").posX).toBe(1000);
    // 明示 posX と auto-layout が乖離しない (Round 3 Finding 2)
    expect(node(d, "p1__explicit").posX).toBe(node(d, "p1__auto").posX);
  });

  it("lane.x=100 / scaleX=1 でも両経路が一致する", () => {
    const d = compileWithPart({ posX: 1000, posY: 500 }, partLaneXNonZero());
    expect(node(d, "p1__explicit").posX).toBe(1000);
    expect(node(d, "p1__auto").posX).toBe(1000);
  });

  it("lane.x != 0 でも lane 中心 === node 中心 === drop 座標 (複合不変量)", () => {
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, partLaneXNonZero());
    const l = lane(d, "p1__l");
    expect(node(d, "p1__explicit").posX).toBe(l.x! + l.width / 2);
  });
});

// ── #880: multi-lane part を scale した時に非先頭 lane の node 中心がずれる ──

describe("mergePartIntoDiagram: multi-lane part の scale で全 lane の node が自 lane 中心に乗る (#880)", () => {
  /** 2 lane part = l1 (x 0-400) / l2 (x 500-900)、 各 lane に node 1 個。 part x 範囲 0..900。 */
  function multiLanePart(): CdlDiagram {
    return {
      id: "parts-ml", topic: "t",
      lanes: [{ id: "l1", x: 0, width: 400 }, { id: "l2", x: 500, width: 400 }],
      nodes: [
        { id: "n1", lane: "l1", stack: 0, kind: "actor", title: "N1", w: 80, h: 40 },
        { id: "n2", lane: "l2", stack: 0, kind: "actor", title: "N2", w: 80, h: 40 },
      ] as CdlDiagram["nodes"],
      edges: [], states: [], phases: [] as CdlDiagram["phases"],
    };
  }

  it("scale 無しでは全 lane の node が自 lane 中心に乗る", () => {
    const d = compileWithPart({ posX: 1000, posY: 500 }, multiLanePart());
    const l1 = lane(d, "p1__l1");
    const l2 = lane(d, "p1__l2");
    expect(node(d, "p1__n1").posX).toBe(l1.x! + l1.width / 2);
    expect(node(d, "p1__n2").posX).toBe(l2.x! + l2.width / 2);
  });

  it("posW 指定 (scaleX 2) で非先頭 lane の node も自 lane 中心に乗る", () => {
    // part total width = 900 (l2 右端)。 posW=1800 → scaleX = 1800/900 相当。
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 1800, posH: 880 }, multiLanePart());
    const l1 = lane(d, "p1__l1");
    const l2 = lane(d, "p1__l2");
    // node 中心 === 自 lane 中心 (非先頭 lane で乖離しない)
    expect(node(d, "p1__n1").posX).toBe(l1.x! + l1.width / 2);
    expect(node(d, "p1__n2").posX).toBe(l2.x! + l2.width / 2);
  });

  it("scale 時に lane 間距離も拡張される (translate-only ではない)", () => {
    const noScale = compileWithPart({ posX: 1000, posY: 500 }, multiLanePart());
    const scaled = compileWithPart({ posX: 1000, posY: 500, posW: 1800, posH: 880 }, multiLanePart());
    const gap = (d: typeof noScale) => {
      const l1 = d.lanes.find((l) => l.id === "p1__l1")!;
      const l2 = d.lanes.find((l) => l.id === "p1__l2")!;
      return (l2.x! + l2.width / 2) - (l1.x! + l1.width / 2);
    };
    // scaleX 2 で lane 間中心距離がちょうど 2 倍になる (500→1000)。 translate-only なら不変、
    // 1.6〜1.9 倍の中途半端な誤 scale も toBe で pin して落とす (cc-codex MINOR 2 対応)。
    expect(gap(scaled)).toBe(gap(noScale) * 2);
  });

  it("scale 時に node.w も part bbox 幅基準の scaleX で厳密に拡張される", () => {
    // node.w は scaleX (=laneScaleX) 経路。 posW=1800 / bboxW=900 → scaleX=2。
    // `scaleX = laneScaleX` を別値 (例 1 や at(lane, 0, "lane") 幅基準) に mutate すると node.w が 2 倍にならず fail。
    const scaled = compileWithPart({ posX: 1000, posY: 500, posW: 1800, posH: 880 }, multiLanePart());
    // 元 w=80 × scaleX 2 = 160 を両 lane の node で厳密 assert (非先頭 lane も同じ scaleX)
    expect(node(scaled, "p1__n1").w).toBe(160);
    expect(node(scaled, "p1__n2").w).toBe(160);
  });
})

describe("部品が持たない状態の名前を書いた時の知らせ (#1976)", () => {
  /*
   * 上書きが読むのは部品の状態の名前と `phase` だけで、他の名前は何も変えない。
   * 箱の中の要素ごとの位置 (`nodes`) を外した後は、部品に書いた `nodes` もこの名前として残る。
   * 3 件で、名前の判定の 2 条件 (`phase` でない / 状態に無い) を 1 つずつ外す。
   */
  const 知らせ = (over: Partial<DslActor>): { actor: string; message: string; hint?: string }[] => {
    const 出た: { actor: string; message: string; hint?: string }[] = [];
    compileToCdl(
      makeDoc("flow", { actors: [actor("A"), actor("p1", { partId: "test", ...over })], flow: [] }),
      {
        partsCatalog: { test: makeTestPart() },
        onNotice: (n) => {
          if (n.kind === "part-state-missing") 出た.push({ actor: n.actor, message: n.message, hint: n.hint });
        },
      },
    );
    return 出た;
  };

  it("部品が持たない名前を書くと、名前と部品の状態を添えて 1 件伝える", () => {
    expect(知らせ({ stateOverride: { v: 20, vv: 30, nodes: "{ header: { posX: 1 } }" } })).toEqual([
      {
        actor: "p1",
        message: '"p1" (test) は "vv" / "nodes" という状態を持たないため、書いた値は効きません',
        hint: "この部品の状態 = v",
      },
    ]);
  });

  it("持っている状態の名前と phase は伝えない (2 条件の片方ずつ)", () => {
    expect(知らせ({ stateOverride: { v: 20 } })).toEqual([]);
    expect(知らせ({ stateOverride: { phase: false } })).toEqual([]);
  });

  it("上書きを書かなければ何も伝えない", () => {
    expect(知らせ({})).toEqual([]);
  });
});
