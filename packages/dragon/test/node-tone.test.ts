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
  "topology", "gantt", "class", "pie", "c4",
] as const;

describe("登場人物の色が箱に届く", () => {
  for (const type of TYPES) {
    it(`${type} で色が載る`, () => {
      const diagram = build(type, `- Client: { kind: service, tone: error }`);
      const toned = tonedNodes(diagram);
      expect(toned.length, `${type} で色の付いた箱がない`).toBeGreaterThan(0);
      for (const [, tone] of toned) expect(tone).toBe("error");
    });
  }

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

describe("parts に色を書いた時", () => {
  // parts は 1 件が複数の箱に展開される。 全部を同じ色に塗ると元の配色が壊れるため対象外にする。
  // 黙って無視すると「書いたのに何も起きない」 になるので警告を出す。
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

  const compileWithPart = (actorLine: string): { diagram: CdlDiagram; warnings: string[] } => {
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
    const warnings: string[] = [];
    const original = console.warn;
    console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(" ")); };
    try {
      return { diagram: compileToCdl(parsed.doc, { partsCatalog: { gauge: part } }), warnings };
    } finally {
      console.warn = original;
    }
  };

  it("色は載らず、 警告が出る", () => {
    const { diagram, warnings } = compileWithPart(`- g1: { kind: gauge, tone: error }`);
    expect(tonedNodes(diagram), "parts の箱には色を載せない").toEqual([]);
    expect(warnings.filter((w) => w.includes("parts には色を指定できません")), warnings.join(" / ")).toHaveLength(1);
  });

  it("色を書かなければ警告は出ない", () => {
    const { warnings } = compileWithPart(`- g1: { kind: gauge }`);
    expect(warnings.filter((w) => w.includes("parts には色を指定できません"))).toEqual([]);
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
});
