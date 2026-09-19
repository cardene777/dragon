import { describe, it, expect } from "vitest";
import { TONES } from "@cardenelabs/cdl";
import { parseTextDslV05, PRESET_TYPES } from "../src/v05/parser";
import { compileToCdl } from "../src/compile";
import { TONE_ALIAS } from "../src/keywords";
import type { DslError } from "../src/types";
import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * 登場人物に書いた色 (`tone`) が、 どの図種でも実際に箱に届くかを見る。
 *
 * 箱を作る経路は図種ごとに違う。 cdl の preset を経由する図種 (流れ図 / ER / 状態遷移 /
 * 構成図) は preset の入力型が色の項目を持たないため、 compile の後処理で **箱に出る題を**
 * 突き合わせて載せている。 この対応付けが崩れると、 DSL に書いても黙って何も起きない状態になる。
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
 * 対象の全図種は実装 (`PRESET_TYPES`) から導く (#2333)。
 *
 * 以前はここに 12 件を手で並べていたが、実装は 24 件を受け付けていた = 手で並べた側に
 * 入らなかった 12 図種は、色が届くかを 1 度も見られていなかった。 図種を足した日に
 * 一覧を直し忘れると、その図種だけ「書いても何も起きない」 が素通りする。
 */
const 全図種 = [...PRESET_TYPES];

/**
 * 題と色の書き方を変えて 1 枚組み立て、対象の箱に載った色を返す (#2333)。
 *
 * 題を書いた時は箱に出る字が題に変わるので、探す相手も題に変える。 返す値は 3 通りで、
 * 「箱なし」 (その図種は登場人物 1 人を 1 箱にしない) と「色なし」 (箱はあるが色が載って
 * いない) を分ける = 2 つを同じ値に潰すと、色が消えた図種が「箱が無いだけ」 に見える。
 */
const 箱の色 = (type: string, 書く: { 題?: boolean; 色?: boolean }): string => {
  const 欄 = ["kind: service"];
  if (書く.色 === true) 欄.push("tone: error");
  if (書く.題 === true) 欄.push(`title: "だい"`);
  const src = [
    `title: "t"`,
    `type: ${type}`,
    ``,
    `actors:`,
    `  - Client: { ${欄.join(", ")} }`,
    `  - API`,
    ``,
    `flow:`,
    `  - Client -> API: "call"`,
  ].join("\n");
  const parsed = parseTextDslV05(src);
  if (!parsed.ok) throw new Error(`parse 失敗: ${parsed.errors.map((e) => e.message).join(" / ")}`);
  // 知らせは受け口を渡して黙らせる。 渡さないと画面に出る図種があり、検査の出力が読めなくなる
  const diagram = compileToCdl(parsed.doc, { onNotice: () => {} });
  const node = diagram.nodes.find((n) => n.title === (書く.題 === true ? "だい" : "Client"));
  if (node === undefined) return "箱なし";
  return node.tone ?? "色なし";
};

/** 登場人物 1 人が 1 つの箱になる図種。 実物を組み立てて導く */
const 箱になる図種 = 全図種.filter((t) => 箱の色(t, { 色: true }) !== "箱なし");

/**
 * 登場人物 1 人を 1 箱にしない図種と、その図種で色をどこに載せるか。
 *
 * 実物から導いた一覧と両方向で突き合わせる。 片方向 (箱になる側) だけを見ると、箱を持た
 * ない図種を新しく足した日に、その図種が黙ってどちらの検査からも外れる。
 */
const 箱にならない図種: Record<string, string> = {
  sequence: "#1466 で 1 枚の板になり、面ごとの箱を持たない (書いた色が落ちることは下の専用 test)",
  solidity: "同じく 1 枚の板になる",
  gantt: "帯を描く 1 箱。 帯ごとの色は `ganttData` が持つ (下の専用 test)",
  pie: "扇を描く 1 箱。 扇ごとの色は `chartData` が持つ (下の専用 test)",
  bar: "値を並べる 1 箱。 色は `chartData` が持つ",
  line: "値を並べる 1 箱。 色は `chartData` が持つ",
  gauge: "値を並べる 1 箱。 色は `chartData` が持つ",
  radial: "値を並べる 1 箱。 色は `chartData` が持つ",
  stat: "値を並べる 1 箱。 色は `chartData` が持つ",
  waffle: "値を並べる 1 箱。 色は `chartData` が持つ",
  stacked: "値を並べる 1 箱。 色は `chartData` が持つ",
  slope: "値を並べる 1 箱。 色は `chartData` が持つ",
  funnel: "段を積む 1 箱",
  tree: "根から枝を描く 1 箱",
  journey: "気持ちの線を描く 1 箱",
  quadrant: "区画に置く 1 箱",
  mind: "#1177 で枝の色に寄せた。 枝ごとの色は `mindData` が持つ (下の専用 test)",
};

describe("登場人物の色が箱に届く", () => {
  it("箱になる図種と、ならない図種の理由が、実物と揃う (#2333)", () => {
    const ならない = 全図種.filter((t) => !箱になる図種.includes(t));
    // 両方向で比べる = 箱を持つようになった図種と、持たなくなった図種のどちらでも落ちる
    expect(Object.keys(箱にならない図種).sort()).toEqual([...ならない].sort());
    for (const [図種, 理由] of Object.entries(箱にならない図種)) {
      expect(理由.length, `${図種} の理由が空`).toBeGreaterThan(0);
    }
    // 空振り防止 = 走査した図種の数を出し、箱になる側が 0 件でないことを見る
    expect(
      箱になる図種.length,
      `図種 ${全図種.length} 件を走査したが、箱になる図種が 1 件も無い`,
    ).toBeGreaterThan(0);
  });

  for (const type of 箱になる図種) {
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

describe("題と色を一緒に書いた箱が色を保つ (#2333)", () => {
  /*
   * 箱に題を書くと、同じ箱に書いた色が黙って消えていた。
   *
   * 色を載せる後処理は箱に出る字で対応付けるが、その字が箱に入る時点が図種で 2 つに割れる。
   * 15 図種は組み立て器が題を入れ、帯図 / c4 / 順序図 / solidity は登場人物の名前で箱を作って
   * 後から題へ書き換える。 書き換えより前に対応付けていたため、前者では題と名前が食い違って
   * 色が落ち、後者だけが通っていた (実測 = 箱になる 7 図種のうち 5 図種で消えていた)。
   */

  it("色だけ書いた時と、色と題を書いた時で、載る色が変わらない", () => {
    const 色だけ = 箱になる図種.map((t) => [t, 箱の色(t, { 色: true })]);
    const 色と題 = 箱になる図種.map((t) => [t, 箱の色(t, { 題: true, 色: true })]);
    // 両方向で比べる = 題を書いた側だけを見ると、色だけ書いた側が壊れた日に気づけない
    expect(色と題).toEqual(色だけ);
    // 片方が丸ごと「色なし」 でも上の比較は通る。 実際に色が載っていることを別に見る
    expect(色だけ).toEqual(箱になる図種.map((t) => [t, "error"]));
  });

  it("題だけ書いた箱には色が付かない", () => {
    const 付いた = 箱になる図種.filter((t) => 箱の色(t, { 題: true }) !== "色なし");
    expect(付いた, "色を書いていないのに色が載っている").toEqual([]);
  });

  it("色を渡さない形に戻すと、色が載る図種が 0 件になる (植え込み対照)", () => {
    const 色なしで載る = 箱になる図種.filter((t) => 箱の色(t, { 題: true, 色: false }) === "error");
    expect(色なしで載る, "色を書かない形でも色が載る = 判定が色を見ていない").toEqual([]);
    // 0 件が「判定が効いた」 か「1 件も測っていない」 かを分ける
    const 色ありで載る = 箱になる図種.filter((t) => 箱の色(t, { 題: true, 色: true }) === "error");
    expect(
      色ありで載る.length,
      `図種 ${全図種.length} 件のうち箱になる ${箱になる図種.length} 件を走査したが、色が載る図種が 0 件`,
    ).toBe(箱になる図種.length);
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

  it("見本の `color` は状態の名前として拾わず、色番号は縦に並べた形と同じく色番号になる (#1973)", () => {
    // #1969 では中括弧の形だけが見本の `color` を状態の上書き `{ color: ... }` として拾っていた。
    // 縦に並べた形と JSON は色として読むため、同じ `color: "#..."` が書き方で効いたり効かなかったりした
    const 読む = (行: string) => {
      const parsed = parseTextDslV05(
        [`title: "t"`, `type: flow`, ``, `actors:`, 行, `  - API`, ``, `flow:`, `  - g1 -> API: "call"`].join("\n"),
      );
      if (!parsed.ok) throw new Error(`parse 失敗: ${parsed.errors.map((e) => e.message).join(" / ")}`);
      return parsed.doc.actors[0]!;
    };
    const 名前 = 読む(`  - g1: { kind: gauge, color: 成功 }`);
    expect(名前.tone, "見本の色名は箱の色として渡さない").toBeUndefined();
    expect(名前.stateOverride, "color を状態の名前として拾った").toBeUndefined();
    const 中括弧 = 読む(`  - g1: { kind: gauge, color: "#d9534f" }`);
    const 縦 = 読む(`  - g1:\n      kind: gauge\n      color: "#d9534f"`);
    expect(縦.colorHex, "縦に並べた形で色番号が読めていない (比べる相手が空)").toBe("#d9534f");
    expect(中括弧.colorHex).toBe(縦.colorHex);
    expect(中括弧.stateOverride).toBeUndefined();
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
