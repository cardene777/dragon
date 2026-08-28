/**
 * CAR-1657 unified `actors:` syntax で parts identifier 対応 の assert test。
 *
 * cover 対象:
 * - parser: parts kind 認識 (partId 格納 + stateOverride 拾い)
 * - compile: partsCatalog 経由 merge (id prefix / lane rename / state override / template rewrite / phase parallel)
 * - LLM JSON DSL 側同等 assert
 * - backward compat: 既存 SAMPLES (28 kind 内) は影響なし
 */
import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05/parser";
import { textDslToDiagram, jsonToDiagram } from "../src/index";
import type { CdlDiagram } from "@cardenelabs/cdl";

// テスト用最小 parts (arc-gauge 相当) = 1 lane + 1 dyn-arc node + 1 state (v) + 1 phase (sweep)
const TEST_PART_ARC_GAUGE: CdlDiagram = {
  id: "parts-arc-gauge",
  topic: "アークゲージ",
  lanes: [{ id: "l", x: 0, width: 380 }],
  nodes: [{
    id: "arc",
    lane: "l",
    stack: 0,
    kind: "actor",
    title: "アークゲージ",
    subtitle: "{v}%",
    w: 360,
    h: 380,
    shape: { kind: "arc", angle: "{v}", sweepMax: 100, outerRadius: 140, innerRadius: 100, fill: "#4e9dc4" },
  }] as CdlDiagram["nodes"],
  edges: [],
  states: [{ id: "v", initial: 0 }],
  phases: [{
    id: "p",
    duration: 4000,
    title: "sweep 進行",
    body: "",
    activate: ["arc"],
    tweens: [{ stateId: "v", from: 0, to: 95 }],
    sets: [],
  }] as CdlDiagram["phases"],
};

const CATALOG: Record<string, CdlDiagram> = {
  "arc-gauge": TEST_PART_ARC_GAUGE,
  "parts-arc-gauge": TEST_PART_ARC_GAUGE,  // parts-prefix key でも lookup 可
};

describe("CAR-1657 parts as actor kind (unified syntax)", () => {
  describe("Human YAML DSL parser", () => {
    it("既存 kind (function) は従来通り、 partId は set されない", () => {
      const src = `title: "test"
type: sequence

actors:
  - API: { kind: function, subtitle: "API server" }

flow:
  - API -> API: "self"
`;
      const r = parseTextDslV05(src);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const api = r.doc.actors.find((a) => a.name === "API");
      expect(api?.kind).toBe("function");
      expect(api?.partId).toBeUndefined();
      expect(api?.subtitle).toBe("API server");
    });

    it("parts kind (arc-gauge) は partId に格納、 kind = actor default fallback", () => {
      const src = `title: "test"
type: sequence

actors:
  - arc1: { kind: arc-gauge, v: 50 }
  - API

flow:
  - API -> arc1: "trigger"
`;
      const r = parseTextDslV05(src);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const arc = r.doc.actors.find((a) => a.name === "arc1");
      expect(arc?.partId).toBe("arc-gauge");
      expect(arc?.kind).toBe("actor");  // fallback
      expect(arc?.stateOverride).toEqual({ v: 50 });
    });

    it("inline stateOverride で予約語以外の inline field を state map に集約", () => {
      const src = `title: "test"
type: sequence

actors:
  - gauge1: { kind: multi-gauge, v: 30, count: 5, level: 80, lane: main }
`;
      const r = parseTextDslV05(src);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const g = r.doc.actors.find((a) => a.name === "gauge1");
      expect(g?.partId).toBe("multi-gauge");
      // lane は予約語なので stateOverride に含めない
      expect(g?.lane).toBe("main");
      // v / count / level は state override
      expect(g?.stateOverride).toEqual({ v: 30, count: 5, level: 80 });
    });

    it("state: {} 明示 fallback で予約語衝突を回避", () => {
      const src = `title: "test"
type: sequence

actors:
  - obj1: { kind: some-part, lane: l1, state: { value: 100, initial: 5 } }
`;
      const r = parseTextDslV05(src);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const obj = r.doc.actors.find((a) => a.name === "obj1");
      expect(obj?.partId).toBe("some-part");
      expect(obj?.lane).toBe("l1");
      // state: {} 経由で value / initial (予約語) を state override として拾える
      expect(obj?.stateOverride).toEqual({ value: 100, initial: 5 });
    });

    it("short form (kind 略記) でも parts kind 対応", () => {
      const src = `title: "test"
type: sequence

actors:
  - arc1: arc-gauge
`;
      const r = parseTextDslV05(src);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const arc = r.doc.actors.find((a) => a.name === "arc1");
      expect(arc?.partId).toBe("arc-gauge");
      expect(arc?.kind).toBe("actor");  // fallback
    });
  });

  describe("compile with partsCatalog", () => {
    it("partsCatalog 未渡し = parts kind actor は warn skip + diagram render 継続", () => {
      const src = `title: "test"
type: sequence

actors:
  - ユーザー
  - arc1: { kind: arc-gauge, v: 50 }

flow:
  - ユーザー -> arc1: "trigger"
`;
      const originalWarn = console.warn;
      const warnings: string[] = [];
      console.warn = (msg: string) => warnings.push(msg);
      try {
        const diagram = textDslToDiagram(src);  // partsCatalog なし
        expect(diagram).toBeDefined();
        expect(warnings.some((w) => w.includes("arc1") || w.includes("arc-gauge"))).toBe(true);
      } finally {
        console.warn = originalWarn;
      }
    });

    it("partsCatalog 渡し = parts が merge されて node / state 追加 + phase parallel merge", () => {
      const src = `title: "test"
type: sequence

actors:
  - ユーザー
  - arc1: { kind: arc-gauge, v: 75 }

flow:
  - ユーザー -> arc1: "trigger"

animation:
  - step: "base" 1s
    focus: [ユーザー]
`;
      const diagram = textDslToDiagram(src, { partsCatalog: CATALOG });
      // arc1 の parts node が prefix 付きで追加
      const arcNode = diagram.nodes.find((n) => n.id === "arc1__arc");
      expect(arcNode).toBeDefined();
      // state initial が override 反映 (v: 75)
      const vState = diagram.states.find((s) => s.id === "arc1__v");
      expect(vState?.initial).toBe(75);
      // codex-review MAJOR fix (§ phase parallel merge) = parts phase は target 側の既存 phase に
      // merge される (別 phase として append されない)、 activate に arc1__arc が含まれ、
      // tweens.stateId に arc1__v が含まれる。 duration は max。
      const firstPhase = diagram.phases[0]!;
      expect(firstPhase.activate).toContain("arc1__arc");
      const arcTween = firstPhase.tweens.find((t) => t.stateId === "arc1__v");
      expect(arcTween).toBeDefined();
      // parts phase duration = 4000ms、 base = 1000ms、 max = 4000
      expect(firstPhase.duration).toBe(4000);
    });

    it("複数 parts 同時 = alias prefix で衝突排除 (lane l が 2 個の parts で衝突しない)", () => {
      const src = `title: "test"
type: sequence

actors:
  - arc1: { kind: arc-gauge, v: 30 }
  - arc2: { kind: arc-gauge, v: 60 }
`;
      const diagram = textDslToDiagram(src, { partsCatalog: CATALOG });
      // 2 個の arc-gauge が独立 lane / node / state / phase で存在
      expect(diagram.lanes.filter((l) => l.id.startsWith("arc1__")).length).toBe(1);
      expect(diagram.lanes.filter((l) => l.id.startsWith("arc2__")).length).toBe(1);
      expect(diagram.states.find((s) => s.id === "arc1__v")?.initial).toBe(30);
      expect(diagram.states.find((s) => s.id === "arc2__v")?.initial).toBe(60);
      // node が別 lane に配置される (衝突なし)
      const arc1Node = diagram.nodes.find((n) => n.id === "arc1__arc");
      const arc2Node = diagram.nodes.find((n) => n.id === "arc2__arc");
      expect(arc1Node?.lane).not.toBe(arc2Node?.lane);
    });

    it("template rewrite = shape / subtitle 内の {v} → {arc1__v} に prefix 適用", () => {
      const src = `title: "test"
type: sequence

actors:
  - arc1: { kind: arc-gauge }
`;
      const diagram = textDslToDiagram(src, { partsCatalog: CATALOG });
      const arcNode = diagram.nodes.find((n) => n.id === "arc1__arc");
      expect(arcNode?.subtitle).toBe("{arc1__v}%");  // state template rewrite
      const shape = arcNode?.shape as { angle?: string } | undefined;
      expect(shape?.angle).toBe("{arc1__v}");  // shape.angle 内 template rewrite
    });

    it("lane 指定あり = parts の内部 lane を target lane に張替え", () => {
      const src = `title: "test"
type: sequence

actors:
  - ユーザー
  - arc1: { kind: arc-gauge, lane: ユーザー, v: 50 }

flow:
  - ユーザー -> arc1: "trigger"
`;
      const diagram = textDslToDiagram(src, { partsCatalog: CATALOG });
      const arcNode = diagram.nodes.find((n) => n.id === "arc1__arc");
      // arc1 の lane = ユーザー (parts 内部 lane 'l' を張替え)
      expect(arcNode?.lane).toBe("ユーザー");
    });
  });

  describe("LLM JSON DSL parser (parallel 実装)", () => {
    it("JSON actors[] object で kind = parts identifier + state override が partId 経路", () => {
      const diagram = jsonToDiagram({
        title: "json test",
        type: "sequence",
        actors: [
          "ユーザー",
          { name: "arc1", kind: "arc-gauge", state: { v: 65 } },
        ],
        flow: [{ from: "ユーザー", to: "arc1", label: "trigger" }],
      }, { partsCatalog: CATALOG });
      expect(diagram.states.find((s) => s.id === "arc1__v")?.initial).toBe(65);
      const arcNode = diagram.nodes.find((n) => n.id === "arc1__arc");
      expect(arcNode).toBeDefined();
    });
  });

  describe("codex-review fix lock (CRITICAL 1 + MAJOR 5)", () => {
    it("CRITICAL fix = readouts field 統合 (percent-ring 等の readout parts)", () => {
      const readoutPart: CdlDiagram = {
        id: "parts-percent-ring",
        topic: "test",
        lanes: [{ id: "l", x: 0, width: 400 }],
        nodes: [{ id: "hidden", lane: "l", stack: 0, kind: "actor", w: 1, h: 1 }] as CdlDiagram["nodes"],
        edges: [],
        states: [{ id: "v", initial: 50 }],
        phases: [{ id: "p", duration: 1000, title: "static", body: "", activate: [], tweens: [], sets: [] }] as CdlDiagram["phases"],
        readouts: [
          { id: "ring", kind: "gauge", source: "{v}", min: 0, max: 100 },
        ],
      };
      const src = `title: "test"
type: sequence

actors:
  - ring1: { kind: percent-ring, v: 80 }
`;
      const diagram = textDslToDiagram(src, { partsCatalog: { "percent-ring": readoutPart } });
      // readouts が merge + id prefix
      const readout = diagram.readouts?.find((r) => r.id === "ring1__ring");
      expect(readout).toBeDefined();
      // source template rewrite
      expect((readout as { source?: string } | undefined)?.source).toBe("{ring1__v}");
    });

    it("MAJOR fix = 英語 v0.4 (step \"...\" 1s = colon なし) が v0.5 誤 route されない", () => {
      const src = `title: "legacy"
type: sequence

actors:
  - A
  - B

flow:
  - A -> B: "call"

animate:
  step "old" 1s:
    highlight: [A]
`;
      // v0.4 negative marker (step "..." Xs) が detect されて v0.5 route されないこと
      // (isV05Source は private だが、 実 route は v0.4 parser で失敗 or warn するので indirect assert)
      const originalWarn = console.warn;
      const warns: string[] = [];
      console.warn = (msg: string) => warns.push(String(msg));
      try {
        // v0.4 経路に流れて deprecated 警告出るはず
        void textDslToDiagram(src);
      } catch {
        // v0.4 parser error でも OK、 v0.5 に誤 route されなければ良い
      } finally {
        console.warn = originalWarn;
      }
      expect(warns.some((w) => w.includes("v0.4") || w.includes("deprecated"))).toBe(true);
    });

    it("MAJOR fix = sequence preset で parts actor の header/spacer/footer/step-anchor が削除", () => {
      const src = `title: "test"
type: sequence

actors:
  - ユーザー
  - arc1: { kind: arc-gauge, v: 50 }
`;
      const diagram = textDslToDiagram(src, { partsCatalog: CATALOG });
      // arc1 alias slug の header/spacer/footer/step が全 sweep
      const remaining = diagram.nodes.filter((n) => n.id === "arc1" || n.id.startsWith("arc1-"));
      expect(remaining.length).toBe(0);
      // parts merge 由来 (arc1__ prefix) の node は存在する
      const partsNodes = diagram.nodes.filter((n) => n.id.startsWith("arc1__"));
      expect(partsNodes.length).toBeGreaterThan(0);
    });

    it("actor label 二重表示 fix = parts actor 由来の sequence lane も削除される", () => {
      const src = `title: "test"
type: sequence

actors:
  - ユーザー
  - arc1: { kind: arc-gauge, v: 50 }
`;
      const diagram = textDslToDiagram(src, { partsCatalog: CATALOG });
      // sequence preset が生成した parts actor 用 lane (id = aliasSlug "arc1") は削除される。
      // 残っていると part 側 lane (arc1__l、 label = alias "arc1") と 2 本が同じ label を
      // lane-label として描画し二重表示 (alarmclock1 が右下で重なる bug の root cause)。
      const leftoverLane = diagram.lanes.filter((l) => l.id === "arc1" || l.id.startsWith("arc1-"));
      expect(leftoverLane.length).toBe(0);
      // part 由来 lane (arc1__ prefix) は 1 本だけ存在する
      const partsLanes = diagram.lanes.filter((l) => l.id.startsWith("arc1__"));
      expect(partsLanes.length).toBe(1);
      // alias "arc1" を label に持つ lane は高々 1 本 (part lane のみ、 二重表示なし)
      const aliasLabelLanes = diagram.lanes.filter((l) => l.label === "arc1");
      expect(aliasLabelLanes.length).toBeLessThanOrEqual(1);
    });

    it("drop 座標尊重 = posX 指定時は既存 lane 右端に強制せず posX 位置に配置 (auto-adjust 廃止)", () => {
      // 2026-07-21 user 決定 = parts は drop / click した位置にそのまま配置し、 既存 lane 右端 + gap への
      // 強制右寄せ (auto-adjust) を廃止する。 posX が既存 lane 右端より左でも offsetX をそのまま使う。
      const src = `title: "test"
type: sequence

actors:
  - ユーザー
  - API
  - arc1: { kind: arc-gauge, posX: 100, posY: 50, v: 50 }
`;
      const diagram = textDslToDiagram(src, { partsCatalog: CATALOG });
      const partNode = diagram.nodes.find((n) => n.id === "arc1__arc");
      expect(partNode).toBeDefined();
      // 前提 = 既存 lane (ユーザー / API) の右端は posX (100) より右に広がる
      const existingMaxRight = Math.max(
        ...diagram.lanes
          .filter((l) => !l.id.startsWith("arc1__"))
          .map((l) => (l.x ?? 0) + l.width),
      );
      expect(existingMaxRight).toBeGreaterThan(100);
      // auto-adjust 廃止 + 中心補正 = part node 中心 (posX) が offsetX (100) に一致 = 置いた位置に
      // parts 中心が来る。 従来は Math.max(100, existingMaxRight + 300) で右へクランプされ posX >> 100。
      expect(partNode!.posX).toBe(100);
    });

    it("underscore を含む parts actor 名でも header/footer/spacer が消し残らない (#873 slug 不一致)", () => {
      // dragon slugify は `_` を保持 (arc_one)、 cdl preset slugify は `-` に置換 (arc-one) するため、
      // dragon 側 aliasSlug と実 node id (arc-one-header 等) が不一致で sweep を取りこぼしていた。
      // header / footer は title = actor 名を描画するため、 消し残ると actor 名が多重表示される。
      const src = `title: "test"
type: sequence

actors:
  - ユーザー
  - arc_one: { kind: arc-gauge, v: 50 }
`;
      const diagram = textDslToDiagram(src, { partsCatalog: CATALOG });
      // parts actor 由来の sequence node (header / footer / spacer / step) が 0 件
      const leftover = diagram.nodes.filter(
        (n) => n.id === "arc-one" || n.id.startsWith("arc-one-") || n.id === "arc_one" || n.id.startsWith("arc_one-"),
      );
      expect(leftover.map((n) => n.id)).toEqual([]);
      // actor 名 (arc_one) を title に持つ node は part merge 由来のみ = 多重表示なし
      const titled = diagram.nodes.filter((n) => n.title === "arc_one");
      expect(titled.length).toBeLessThanOrEqual(1);
      // part merge 由来 node は存在する (削除しすぎていない)
      expect(diagram.nodes.some((n) => n.id.startsWith("arc_one__"))).toBe(true);
    });

    it("全角を含む parts actor 名でも header/footer/spacer が消し残らない (#873 slug 不一致)", () => {
      const src = `title: "test"
type: sequence

actors:
  - ユーザー
  - ゲージ１: { kind: arc-gauge, v: 50 }
`;
      const diagram = textDslToDiagram(src, { partsCatalog: CATALOG });
      // actor 名を title に持つ node は part merge 由来のみ (header / footer が消し残ると 2 件以上)
      const titled = diagram.nodes.filter((n) => n.title === "ゲージ１");
      expect(titled.length).toBeLessThanOrEqual(1);
      // 残存 lane も 0 (label 特定経路)
      expect(diagram.lanes.filter((l) => l.label === "ゲージ１").length).toBeLessThanOrEqual(1);
    });

    it("slug が prefix 関係にある別 actor を巻き込まない (cc-codex MAJOR fix、 a_b vs a-b-c)", () => {
      // parts actor `a_b` の lane id は `a-b` (cdl slug)。 prefix match で sweep すると通常 actor
      // `a-b-c` の `a-b-c-header` / `-footer` / step anchor / edge まで誤削除し、 activate に dangling
      // 参照が残る。 exact set (node.lane 由来) 方式で巻き込みゼロを保証する。
      // 図種は `swimlane`。 順序図は #1466 で 1 枚の板になり、面ごとの箱と縦列を作らない
      const src = `title: "test"
type: swimlane

actors:
  - Client
  - a_b: { kind: arc-gauge, v: 50 }
  - a-b-c

flow:
  - Client -> a-b-c: "呼出"
`;
      const diagram = textDslToDiagram(src, { partsCatalog: CATALOG });
      // 通常 actor a-b-c の箱が残る
      expect(diagram.nodes.some((n) => n.id === "a-b-c"), "素の箱が消えている").toBe(true);
      // a-b-c lane も残る
      expect(diagram.lanes.some((l) => l.id === "a-b-c")).toBe(true);
      // Client -> a-b-c の edge が残る (parts actor と無関係な flow)
      expect(diagram.edges.some((e) => e.from === "client" && e.to === "a-b-c")).toBe(true);
      // parts actor a_b 由来 node は削除される
      expect(diagram.nodes.some((n) => n.id === "a-b-header" || n.id === "a-b-footer")).toBe(false);
      // phase.activate に存在しない id (dangling) が残らない
      const validIds = new Set<string>([
        ...diagram.nodes.map((n) => n.id),
        ...diagram.edges.map((e) => e.id),
      ]);
      for (const phase of diagram.phases) {
        for (const id of phase.activate) {
          expect(validIds.has(id), `activate id "${id}" が存在する node/edge を指す`).toBe(true);
        }
      }
    });

    it("非 seq-like preset (flow) の共有 lane は削除しない (cc-codex MAJOR fix)", () => {
      // flow preset は全 actor を共有 lane "flow" の step node にする (sequence の 1 actor = 1 lane と
      // 異なる)。 parts actor 名が共有 lane id "flow" と一致しても lane を消してはいけない、
      // 消すと通常 actor "other" の node が削除済 lane を参照する不正 diagram になる。
      const src = `title: "flow test"
type: flow

actors:
  - flow: { kind: arc-gauge, v: 50 }
  - other

flow:
  - flow -> other: "go"
`;
      const diagram = textDslToDiagram(src, { partsCatalog: CATALOG });
      // 共有 lane "flow" は parts actor 名と一致するが seq-like でないので保持される
      const sharedLane = diagram.lanes.find((l) => l.id === "flow");
      expect(sharedLane).toBeDefined();
      // 通常 actor "other" の node は共有 lane "flow" を参照し続ける (orphan 化しない)
      const otherNode = diagram.nodes.find((n) => n.id === "other");
      expect(otherNode?.lane).toBe("flow");
    });

    it("MAJOR fix = phase parallel merge (append ではなく既存 phase に union)", () => {
      const src = `title: "test"
type: sequence

actors:
  - A
  - arc1: { kind: arc-gauge, v: 50 }

flow:
  - A -> arc1: "trigger"

animation:
  - step: "step-1" 2s
    focus: [A]
`;
      const diagram = textDslToDiagram(src, { partsCatalog: CATALOG });
      // target 側 1 phase + parts 側 1 phase = parallel merge で 1 phase (union)、 append で 2 phase になっていない
      expect(diagram.phases.length).toBe(1);
      const merged = diagram.phases[0]!;
      // duration = max(2000, 4000) = 4000
      expect(merged.duration).toBe(4000);
      // activate に parts side (arc1__arc) が union で含まれる
      expect(merged.activate.includes("arc1__arc")).toBe(true);
    });

    it("MAJOR fix = phase: false opt-out で parts phase 破棄", () => {
      const src = `title: "test"
type: sequence

actors:
  - A
  - arc1: { kind: arc-gauge, v: 50, state: { phase: false } }

flow:
  - A -> arc1: "trigger"

animation:
  - step: "step-1" 2s
    focus: [A]
`;
      const diagram = textDslToDiagram(src, { partsCatalog: CATALOG });
      const p = diagram.phases[0]!;
      // opt-out で parts phase (arc, v tween) は含まれない
      expect(p.activate.includes("arc1__arc")).toBe(false);
      expect(p.tweens.find((t) => t.stateId === "arc1__v")).toBeUndefined();
    });

    it("MAJOR fix = 再帰 template rewrite (nested shape / readout object 対応)", () => {
      const nestedPart: CdlDiagram = {
        id: "parts-nested",
        topic: "test",
        lanes: [{ id: "l", x: 0, width: 400 }],
        nodes: [{
          id: "n1",
          lane: "l",
          stack: 0,
          kind: "actor",
          shape: { kind: "rect", source: "{v}", fill: { gradient: "{v}" } } as unknown as CdlDiagram["nodes"][number]["shape"],
        }] as CdlDiagram["nodes"],
        edges: [],
        states: [{ id: "v", initial: 30 }],
        phases: [] as CdlDiagram["phases"],
      };
      const src = `title: "test"
type: sequence

actors:
  - obj1: { kind: nested, v: 50 }
`;
      const diagram = textDslToDiagram(src, { partsCatalog: { "nested": nestedPart } });
      const node = diagram.nodes.find((n) => n.id === "obj1__n1");
      expect(node).toBeDefined();
      const shape = node?.shape as { source?: string; fill?: { gradient?: string } } | undefined;
      // 1 depth string = "{v}" → "{obj1__v}"
      expect(shape?.source).toBe("{obj1__v}");
      // nested string (shape.fill.gradient) も rewrite される
      expect(shape?.fill?.gradient).toBe("{obj1__v}");
    });

    it("MAJOR fix = partsCatalog Object.hasOwn で prototype pollution 対策", () => {
      const src = `title: "test"
type: sequence

actors:
  - A
  - x: { kind: __proto__ }
`;
      // 悪意 kind = __proto__ を渡しても partsCatalog[__proto__] の inherited property を拾わない
      const originalWarn = console.warn;
      const warns: string[] = [];
      console.warn = (msg: string) => warns.push(String(msg));
      try {
        const diagram = textDslToDiagram(src, { partsCatalog: {} });
        expect(diagram).toBeDefined();
        expect(warns.some((w) => w.includes("__proto__"))).toBe(true);
      } finally {
        console.warn = originalWarn;
      }
    });

    it("MAJOR fix = LLM JSON DSL state validation (nested object / null で reject)", () => {
      // LLM が state に不正 value (nested object) を返した場合、 validation error で reject
      expect(() =>
        jsonToDiagram({
          title: "bad",
          type: "sequence",
          actors: [
            "A",
            { name: "arc1", kind: "arc-gauge", state: { v: { nested: "invalid" } as unknown as number } },
          ],
          flow: [{ from: "A", to: "arc1", label: "x" }],
        }, { partsCatalog: CATALOG }),
      ).toThrow(/state/);
    });
  });

  describe("backward compat = 既存 SAMPLES 影響なし", () => {
    it("既存 kind (function / service / database 等) は partId なし + 従来通り compile", () => {
      const src = `title: "既存 sample"
type: sequence

actors:
  - ユーザー
  - API: { kind: function }
  - DB: { kind: database, subtitle: "Postgres" }

flow:
  - ユーザー -> API: "req"
  - API -> DB: "query"
`;
      const diagram = textDslToDiagram(src);  // partsCatalog 未渡しでも既存 kind は影響なし
      expect(diagram).toBeDefined();
      expect(diagram.nodes.length).toBeGreaterThan(0);
    });
  });
});
