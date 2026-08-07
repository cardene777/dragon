import { describe, it, expect } from "vitest";
import { TONES } from "@cardenelabs/cdl";
import { parseTextDslV05 } from "../src/v05/parser";
import { compileToCdl } from "../src/compile";
import { TONE_ALIAS } from "../src/keywords";
import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * 登場人物に書いた色 (`tone`) が、 どの図種でも実際に箱に届くかを見る。
 *
 * 箱を作る経路は図種ごとに違う。 cdl の preset を経由する図種 (流れ図 / ER / 状態遷移 /
 * 構成図) は preset の入力型が色の項目を持たないため、 compile の後処理で id を突き合わせて
 * 載せている。 この対応付けが崩れると、 DSL に書いても黙って何も起きない状態になる。
 *
 * 測るのは「後処理が動いたか」 ではなく「対象の箱に色が載ったか」。
 */

/** 色が実際に載った箱の id と色。 */
const tonedNodes = (diagram: CdlDiagram): Array<[string, string]> =>
  diagram.nodes.filter((n) => n.tone).map((n) => [n.id, n.tone as string]);

const build = (type: string, actorLine: string): CdlDiagram => {
  const src = [
    `title: "t"`,
    `type: ${type}`,
    ``,
    `actors:`,
    `  ${actorLine}`,
    `  - API`,
    ``,
    `flow:`,
    `  - Client -> API: "call"`,
  ].join("\n");
  const parsed = parseTextDslV05(src);
  if (!parsed.ok) throw new Error(`parse 失敗: ${parsed.errors.map((e) => e.message).join(" / ")}`);
  return compileToCdl(parsed.doc);
};

/**
 * 対象の全図種。
 *
 * 図種を追加した時、 その図種が対応付けから漏れると下の test が落ちる。 漏れたまま
 * 出荷すると「書いても何も起きない」 になるため、 一覧を手書きして固定する。
 */
const TYPES = [
  "sequence", "flow", "swimlane", "er", "state",
  "topology", "solidity", "gantt", "class", "pie", "c4", "mind",
] as const;

describe("登場人物の色が箱に届く", () => {
  for (const type of TYPES) {
    // 円グラフとガントは図全体を 1 箱で描くので、 箱ごとの色を持たない。 下の専用 test で見る
    if (type === "pie" || type === "gantt") continue;
    it(`${type} で色が載る`, () => {
      const diagram = build(type, `- Client: { kind: service, tone: error }`);
      // 「1 つ以上に載った」 では、 意図しない箱だけが染まっても通る。 対象の登場人物を
      // 表示している箱すべてが指定色で、 かつ他方の登場人物の箱が無色であることを見る。
      const client = diagram.nodes.filter((n) => n.title === "Client");
      expect(client.length, `${type} で Client の箱がない`).toBeGreaterThan(0);
      for (const n of client) expect(n.tone, `${type} / ${n.id}`).toBe("error");
      for (const n of diagram.nodes.filter((n) => n.title === "API")) {
        expect(n.tone, `${type} / ${n.id} は無色`).toBeUndefined();
      }
    });
  }

  it("ガントでは帯に載る", () => {
    // ガントも箱を 1 つしか持たない (#1077)。 帯 1 本ずつに色が載ることを見る
    const diagram = build("gantt", `- Client: { kind: service, tone: error, subtitle: "Q1" }`);
    const chart = diagram.nodes.find((n) => n.kind === "gantt-timeline");
    expect(chart, "帯を描く箱がない").toBeDefined();
    expect(chart!.ganttData?.map((t) => [t.title, t.tone])).toEqual([["Client", "error"]]);
  });

  it("円グラフでは扇に載る", () => {
    // 円グラフは箱を 1 つしか持たない (#1076 で `chart-pie` に 1 node で渡す形に変えた)。
    // 箱ごとの色は付けられないので、 扇 1 枚ずつに載っていることを見る。
    // 見ないと、 色を書いても黙って消える状態に戻せてしまう
    const diagram = build("pie", `- Client: { kind: service, tone: error, value: "30%" }`);
    const chart = diagram.nodes.find((n) => n.kind === "chart-pie");
    expect(chart, "円を描く箱がない").toBeDefined();
    expect(chart!.chartData, "扇に色が載っていない").toEqual([
      { label: "Client", value: 30, tone: "error" },
    ]);
  });

  it("順序図では見える箱だけに載る", () => {
    // 1 人が header / spacer / footer / 手順ごとの anchor に分かれる。 間隔用と anchor は
    // 幅 2 の不可視要素なので色を持っても見えない。
    const diagram = build("sequence", `- Client: { kind: service, tone: error }`);
    expect(tonedNodes(diagram).map(([id]) => id).sort()).toEqual(["client-footer", "client-header"]);
  });

  it("色を書かなかった登場人物には載らない", () => {
    const diagram = build("flow", `- Client: { kind: service, tone: error }`);
    const api = diagram.nodes.find((n) => n.id === "api");
    expect(api, "api の箱がある").toBeDefined();
    expect(api!.tone).toBeUndefined();
  });

  it("誰も色を書かなければ 1 つも載らない", () => {
    const diagram = build("flow", `- Client: { kind: service }`);
    expect(tonedNodes(diagram)).toEqual([]);
  });

  it("記号を含む名前でも色が届く", () => {
    // id は名前を slug に変換して作るが、 変換規則が dragon と cdl で違う。 `A_B` は
    // dragon 側が `a_b`、 cdl 側が `a-b` になる。 id で対応付けると順序図で色が消えた。
    const diagram = build("sequence", `- A_B: { kind: service, tone: error }`);
    const toned = tonedNodes(diagram);
    expect(toned.length, "記号入りの名前で色が消えた").toBeGreaterThan(0);
    for (const [, tone] of toned) expect(tone).toBe("error");
  });

  it("生成した id と同じ名前の登場人物が居ても巻き込まない", () => {
    // 順序図は `{slug}-header` という id の箱を作る。 その名前を持つ登場人物が居る時、
    // id で対応付けると別人の箱まで染まった。
    const src = [
      `title: "t"`,
      `type: flow`,
      ``,
      `actors:`,
      `  - client: { kind: service, tone: error }`,
      `  - client-header: { kind: service }`,
      ``,
      `flow:`,
      `  - client -> client-header: "call"`,
    ].join("\n");
    const parsed = parseTextDslV05(src);
    if (!parsed.ok) throw new Error("parse 失敗");
    const diagram = compileToCdl(parsed.doc);
    expect(tonedNodes(diagram)).toEqual([["client", "error"]]);
  });

  it("別の登場人物の箱に漏れない", () => {
    // 名前が接尾で一致する組合せ。 開いた接頭 / 接尾一致で対応付けると漏れる
    const src = [
      `title: "t"`,
      `type: flow`,
      ``,
      `actors:`,
      `  - client: { kind: service, tone: error }`,
      `  - api-client: { kind: service }`,
      ``,
      `flow:`,
      `  - client -> api-client: "call"`,
    ].join("\n");
    const parsed = parseTextDslV05(src);
    if (!parsed.ok) throw new Error("parse 失敗");
    const diagram = compileToCdl(parsed.doc);
    expect(tonedNodes(diagram)).toEqual([["client", "error"]]);
  });
});

describe("parts に tone を書いた時", () => {
  // parts では `tone` は以前から「状態の上書き」 として使える名前で、 色ではない。
  // 色として横取りすると、 既に `tone` という状態を持つ parts を書いている DSL が壊れる。
  const part: CdlDiagram = {
    id: "gauge",
    topic: "gauge",
    lanes: [{ id: "l", x: 0, width: 300 }],
    nodes: [
      { id: "body", lane: "l", stack: 0, kind: "service", title: "本体" },
      { id: "label", lane: "l", stack: 1, kind: "card", title: "見出し" },
    ],
    edges: [],
    states: [],
    phases: [],
  };

  const compileWithPart = (actorLine: string) => {
    const src = [
      `title: "t"`,
      `type: flow`,
      ``,
      `actors:`,
      `  ${actorLine}`,
      `  - API`,
      ``,
      `flow:`,
      `  - g1 -> API: "call"`,
    ].join("\n");
    const parsed = parseTextDslV05(src);
    if (!parsed.ok) throw new Error("parse 失敗");
    return {
      actor: parsed.doc.actors[0]!,
      diagram: compileToCdl(parsed.doc, { partsCatalog: { gauge: part } }),
    };
  };

  it("色ではなく状態の上書きとして扱う", () => {
    const { actor, diagram } = compileWithPart(`- g1: { kind: gauge, tone: 1 }`);
    expect(actor.tone, "色としては解釈しない").toBeUndefined();
    expect(actor.stateOverride, "状態の上書きとして残る").toEqual({ tone: 1 });
    expect(tonedNodes(diagram), "parts の箱には色を載せない").toEqual([]);
  });

  it("色名を書いても状態の上書きになる", () => {
    const { actor } = compileWithPart(`- g1: { kind: gauge, tone: error }`);
    expect(actor.tone).toBeUndefined();
    expect(actor.stateOverride).toEqual({ tone: "error" });
  });
});

describe("色名の受理範囲", () => {
  const parseTone = (value: string): string | undefined => {
    const diagram = build("flow", `- Client: { kind: service, tone: ${value} }`);
    return diagram.nodes.find((n) => n.id === "client")?.tone;
  };

  it("cdl の色名をそのまま書ける", () => {
    for (const tone of TONES) expect(parseTone(tone), tone).toBe(tone);
  });

  it("別名でも書ける", () => {
    for (const [alias, resolved] of Object.entries(TONE_ALIAS)) {
      expect(parseTone(alias), alias).toBe(resolved);
    }
  });

  it("未知の色名は既定色に落とす", () => {
    // 矢印の色と同じ扱い。 描画側の検査は cdl が持つ
    expect(parseTone("purple")).toBeUndefined();
  });

  it("受理する色名は cdl の一覧と一致する", () => {
    // 手書きすると cdl に色が増えた時に取り残される
    for (const resolved of Object.values(TONE_ALIAS)) {
      expect(TONES as readonly string[]).toContain(resolved);
    }
  });

  it("JavaScript が既定で持つ名前を色として通さない", () => {
    // 別名表を素の添字で引くと、 どの object も持っている `toString` 等が引けてしまい、
    // 関数やオブジェクトが色として通る (実測 = `tone: toString` で関数が入った)。
    for (const name of ["toString", "constructor", "valueOf", "hasOwnProperty", "__proto__"]) {
      expect(parseTone(name), name).toBeUndefined();
    }
  });
});

describe("箱と矢印で同じ色名が使える", () => {
  const arrowTone = (value: string): string | undefined => {
    const src = [
      `title: "t"`,
      `type: flow`,
      ``,
      `actors:`,
      `  - A`,
      `  - B`,
      ``,
      `flow:`,
      `  - A -> B: "x" (${value})`,
    ].join("\n");
    const parsed = parseTextDslV05(src);
    if (!parsed.ok) throw new Error("parse 失敗");
    return parsed.doc.flow[0]?.tone;
  };

  const boxTone = (value: string): string | undefined => {
    const diagram = build("flow", `- Client: { kind: service, tone: ${value} }`);
    return diagram.nodes.find((n) => n.title === "Client")?.tone;
  };

  it("別名が両方で通る", () => {
    // 説明文が「矢印と同じ名前と別名」 と書いている以上、 受理範囲が食い違ってはいけない
    for (const [alias, resolved] of Object.entries(TONE_ALIAS)) {
      expect(arrowTone(alias), `矢印: ${alias}`).toBe(resolved);
      expect(boxTone(alias), `箱: ${alias}`).toBe(resolved);
    }
  });

  it("未知の名前は両方で既定色に落ちる", () => {
    expect(arrowTone("purple")).toBeUndefined();
    expect(boxTone("purple")).toBeUndefined();
  });

  it("線の種類の指定は色として拾わない", () => {
    // 末尾の括弧は色と線の種類の両方を受ける。 色として解決できない値を線の種類に回す
    const src = [
      `title: "t"`, `type: flow`, ``, `actors:`, `  - A`, `  - B`, ``,
      `flow:`, `  - A -> B: "x" (dotted-flow)`,
    ].join("\n");
    const parsed = parseTextDslV05(src);
    if (!parsed.ok) throw new Error("parse 失敗");
    expect(parsed.doc.flow[0]?.style).toBe("dotted-flow");
    expect(parsed.doc.flow[0]?.tone).toBeUndefined();
  });
});
