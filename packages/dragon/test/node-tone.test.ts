import { describe, it, expect } from "vitest";
import { TONES } from "@cardenelabs/cdl";
import { parseTextDslV05 } from "../src/v05/parser";
import { compileToCdl } from "../src/compile";
import { TONE_ALIAS } from "../src/keywords";
import type { DslError } from "../src/types";
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

/** 順序図系は #1466 で 1 枚の板になり、面ごとの箱を持たない = 色を載せる先が無い。 */
const 板になる図種 = new Set(["sequence", "solidity"]);

describe("登場人物の色が箱に届く", () => {
  for (const type of TYPES) {
    // 円グラフ / ガント / 放射は図全体を 1 箱で描くので、 箱ごとの色を持たない。
    // 放射は #1177 で `mind-map` 種別に寄せた時にこちら側へ移った (枝の色は下の専用 test で見る)
    if (type === "pie" || type === "gantt" || type === "mind") continue;
    if (板になる図種.has(type)) continue;
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

  it("順序図の板は色を受けず、効かないことを伝える", () => {
    /*
     * #1466 で順序図は 1 枚の板になり、面ごとの箱が消えた = 色を載せる先が無い。
     * 板そのものを染めると図全体の色が変わるので、書いた面の色は落とし、落ちたことを伝える。
     */
    const src = [
      `title: "t"`,
      `type: sequence`,
      ``,
      `actors:`,
      `  - Client: { kind: service, tone: error }`,
      `  - API`,
      ``,
      `flow:`,
      `  - Client -> API: "call"`,
    ].join("\n");
    const parsed = parseTextDslV05(src);
    if (!parsed.ok) throw new Error("parse 失敗");
    const 出た: string[] = [];
    const diagram = compileToCdl(parsed.doc, {
      onNotice: (n) => {
        if (n.kind === "actor-kind-not-honored") 出た.push(n.message);
      },
    });
    // 板は組み立てが決めた色のまま = 書いた色に染まらない
    expect(tonedNodes(diagram).map(([, t]) => t), "書いた色が板に載っている").not.toContain("error");
    expect(出た.length, "色が黙って落ちている").toBe(1);
    expect(出た[0]).toContain("色");
  });

  it("色を書かなかった登場人物には載らない", () => {
    const diagram = build("flow", `- Client: { kind: service, tone: error }`);
    const api = diagram.nodes.find((n) => n.id === "api");
    expect(api, "api の箱がある").toBeDefined();
    expect(api!.tone).toBeUndefined();
  });

  it("放射は枝の色を payload に載せる (#1177)", () => {
    // 図全体を 1 箱で描くので `node.tone` には載らない。 枝ごとの色は `mindData` が持つ
    const diagram = build("mind", `- Client: { kind: service, tone: error }`);
    expect(tonedNodes(diagram), "箱そのものに色が載っている").toEqual([]);
    const 箱 = diagram.nodes.find((n) => n.kind === "mind-map");
    expect(箱, "mind-map の箱がない").toBeDefined();
    const 枝 = 箱!.mindData!.branches;
    // `build` の 1 件目が中心、 2 件目 (API) 以降が枝になる。 色を書いた Client が中心のため、
    // 中心を色付きにできないことも併せて見る
    expect(箱!.mindData!.rootTitle).toBe("Client");
    expect(枝.every((b) => b.tone === undefined), "色を書いていない枝に色が載った").toBe(true);
  });

  it("放射の枝に書いた色が payload に載る (#1177)", () => {
    const src = [
      `title: "t"`,
      `type: mind`,
      ``,
      `actors:`,
      `  - Center`,
      `  - Client: { kind: service, tone: error }`,
      `  - API`,
    ].join("\n");
    const parsed = parseTextDslV05(src);
    if (!parsed.ok) throw new Error("parse 失敗");
    const diagram = compileToCdl(parsed.doc);
    const 枝 = diagram.nodes.find((n) => n.kind === "mind-map")!.mindData!.branches;
    expect(枝.find((b) => b.title === "Client")?.tone, "枝に色が届いていない").toBe("error");
    expect(枝.find((b) => b.title === "API")?.tone, "書いていない枝に色が載った").toBeUndefined();
  });

  it("誰も色を書かなければ 1 つも載らない", () => {
    const diagram = build("flow", `- Client: { kind: service }`);
    expect(tonedNodes(diagram)).toEqual([]);
  });

  it("記号を含む名前でも色が届く", () => {
    // id は名前を slug に変換して作るが、 変換規則が dragon と cdl で違う。 `A_B` は
    // dragon 側が `a_b`、 cdl 側が `a-b` になる。 id で対応付けると色が消えた。
    const diagram = build("topology", `- A_B: { kind: service, tone: error }`);
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

/** 箱に色を書いた時の parse 結果 (誤りも見られる形)。 #1304 で読めない色名を知らせるようにした */
const parseBoxTone = (
  value: string,
): { tone: string | undefined; errors: DslError[] } => {
  const src = [
    `title: "t"`,
    `type: flow`,
    ``,
    `actors:`,
    `  - Client: { kind: service, tone: ${value} }`,
    `  - API`,
    ``,
    `flow:`,
    `  - Client -> API: "call"`,
  ].join("\n");
  const parsed = parseTextDslV05(src);
  if (!parsed.ok) return { tone: undefined, errors: parsed.errors };
  return { tone: parsed.doc.actors[0]?.tone, errors: [] };
};

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

  it("未知の色名は誤りとして知らせる (#1304)", () => {
    // 既定色に落として黙る形だと「書いたのに色が変わらない」 が手掛かりなしで起きる。
    // 矢印の色と同じ扱いにする (どちらも読めない値を行番号付きで知らせる)
    const { tone, errors } = parseBoxTone("purple");
    expect(tone, "色としては載せない").toBeUndefined();
    expect(errors.map((e) => e.message)).toContain('色の名前が読めません: "purple"');
    expect(errors[0]?.line, "書いた行を指す").toBe(5);
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
      const { tone, errors } = parseBoxTone(name);
      expect(tone, name).toBeUndefined();
      // 通さないだけでなく、 読めない色名として知らせる (#1304)
      expect(errors.map((e) => e.message), name).toContain(`色の名前が読めません: "${name}"`);
    }
  });
});

describe("箱と矢印で同じ色名が使える", () => {
  const arrowParse = (
    value: string,
  ): { tone: string | undefined; errors: DslError[] } => {
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
    if (!parsed.ok) return { tone: undefined, errors: parsed.errors };
    return { tone: parsed.doc.flow[0]?.tone, errors: [] };
  };

  const arrowTone = (value: string): string | undefined => {
    const { tone, errors } = arrowParse(value);
    if (errors.length > 0) throw new Error(`parse 失敗: ${errors.map((e) => e.message).join(" / ")}`);
    return tone;
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

  it("未知の名前は両方で誤りになる (#1304)", () => {
    // 受理範囲が食い違ってはいけないのと同じ理由で、 読めない値の扱いも揃える。
    // 矢印は線種も受けるため知らせの文が違う (箱に `solid` と書いても効かない)
    const 矢印 = arrowParse("purple");
    expect(矢印.tone, "矢印: 色としては載せない").toBeUndefined();
    expect(矢印.errors.map((e) => e.message)).toContain('色名か線種が読めません: "purple"');
    const 箱 = parseBoxTone("purple");
    expect(箱.tone, "箱: 色としては載せない").toBeUndefined();
    expect(箱.errors.map((e) => e.message)).toContain('色の名前が読めません: "purple"');
  });

  it("説明文の括弧が消える形も知らせ、引用符で囲む道を案内する (#1304)", () => {
    // 引用符なしの説明文に括弧を書くと、丸括弧は色 / 線種の欄として読まれる。 これまでは
    // 読めない語を黙って捨てていたため、**説明文から括弧の中だけが消えた図**が出ていた
    const { tone, errors } = arrowParse("非同期");
    expect(tone).toBeUndefined();
    const e = errors.find((x) => x.message.includes("非同期"));
    expect(e?.message).toBe('色名か線種が読めません: "非同期"');
    expect(e?.hint, "直し方が「別の語に変える」 しか案内されない").toContain('`"…"` で囲む');
  });

  it("箱の知らせには線種を案内しない", () => {
    // 箱に `solid` と書いても効かない。 使える語として並べると、書いても何も起きない値を
    // 勧めることになる
    const { errors } = parseBoxTone("purple");
    const e = errors.find((x) => x.message.includes("purple"));
    expect(e?.hint).toContain("使える値 = ");
    expect(e?.hint, "箱に効かない線種を勧めている").not.toContain("dotted-flow");
  });

  it("中括弧の箱に `color` で書いた色が載る (#1969)", () => {
    // 縦に並べた形と JSON は `color` を受けるのに、中括弧の形だけが知らない項目名として
    // 図ごと読めなくしていた
    const diagram = build("flow", `- Client: { kind: service, color: 成功 }`);
    expect(tonedNodes(diagram)).toEqual([["client", "success"]]);
  });

  it("中括弧の `color` と縦に並べた `color` が同じ色になる (#1969)", () => {
    const 縦 = parseTextDslV05(
      [`title: "t"`, `type: flow`, ``, `actors:`, `  - Client:`, `      color: 成功`, `  - API`, ``, `flow:`, `  - Client -> API: "call"`].join("\n"),
    );
    const 中括弧 = parseTextDslV05(
      [`title: "t"`, `type: flow`, ``, `actors:`, `  - Client: { color: 成功 }`, `  - API`, ``, `flow:`, `  - Client -> API: "call"`].join("\n"),
    );
    if (!縦.ok || !中括弧.ok) throw new Error("parse 失敗");
    expect(縦.doc.actors[0]?.tone, "縦に並べた形で色が読めていない (比べる相手が空)").toBe("success");
    expect(中括弧.doc.actors[0]?.tone).toBe(縦.doc.actors[0]?.tone);
  });

  it("`tone` と `color` を両方書くと `tone` を採る (#1969)", () => {
    const diagram = build("flow", `- Client: { kind: service, tone: error, color: 成功 }`);
    expect(tonedNodes(diagram)).toEqual([["client", "error"]]);
  });

  it("`color` の読めない値は行番号付きで知らせる (#1969)", () => {
    const parsed = parseTextDslV05(
      [`title: "t"`, `type: flow`, ``, `actors:`, `  - Client: { color: purple }`, `  - API`, ``, `flow:`, `  - Client -> API: "call"`].join("\n"),
    );
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    const e = parsed.errors.find((x) => x.message.includes("purple"));
    expect(e?.message).toBe('色の名前が読めません: "purple"');
    expect(e?.line).toBe(5);
  });

  it("見本の `color` は従来どおり状態の上書きになる (#1969)", () => {
    const parsed = parseTextDslV05(
      [`title: "t"`, `type: flow`, ``, `actors:`, `  - g1: { kind: gauge, color: 成功 }`, `  - API`, ``, `flow:`, `  - g1 -> API: "call"`].join("\n"),
    );
    if (!parsed.ok) throw new Error(`parse 失敗: ${parsed.errors.map((e) => e.message).join(" / ")}`);
    expect(parsed.doc.actors[0]?.tone, "見本の色としては読まない").toBeUndefined();
    expect(parsed.doc.actors[0]?.stateOverride).toEqual({ color: "成功" });
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
