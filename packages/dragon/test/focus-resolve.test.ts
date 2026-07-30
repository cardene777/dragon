/**
 * 光らせる相手 (`focus:`) の読み方と、 実在しない指定の知らせの検証。
 *
 * 読み方は 1 か所 (`parseFocusEntry`) に置き、 id への解決だけを図種ごとに残した。
 * 図種で読み方が割れると、 同じ記述が図種によって別の意味になる。 以前は順序図と汎用の
 * 2 経路が `-` 1 文字を矢印と見なしており、 名前に `-` を含む箱が光らなかった。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import type { CompileNotice } from "../src/compile";
import { parseFocusEntry } from "../src/focus";

/** 図種ごとに、 focus に書いた相手が実際に光るか。 */
function activated(type: string, name: string, focus: string): string[] {
  const src = `title: "t"
type: ${type}
actors:
  - Client
  - ${name}
flow:
  - Client -> ${name}: "要求"
animation:
  - step: "呼ぶ" 1.4s
    focus: [${focus}]
`;
  return textDslToDiagram(src).phases.flatMap((p) => p.activate ?? []);
}

function noticesOf(src: string): CompileNotice[] {
  const out: CompileNotice[] = [];
  textDslToDiagram(src, { onNotice: (n) => out.push(n) });
  return out;
}

describe("光らせる相手の読み方", () => {
  it("名前 1 つは箱として読む", () => {
    expect(parseFocusEntry("API")).toEqual({ kind: "node", name: "API" });
  });

  it("矢印は 2 者として読む", () => {
    expect(parseFocusEntry("Client -> API")).toEqual({ kind: "edge", from: "Client", to: "API" });
  });

  it("全角矢印も読む", () => {
    expect(parseFocusEntry("Client → API")).toEqual({ kind: "edge", from: "Client", to: "API" });
  });

  it("空白なしの矢印も読む", () => {
    expect(parseFocusEntry("Client->API")).toEqual({ kind: "edge", from: "Client", to: "API" });
  });

  it("`-` 1 文字は矢印にしない (名前に使える文字)", () => {
    // これを矢印と見なすと `api-gateway` が「api から gateway」 と読まれる
    expect(parseFocusEntry("api-gateway")).toEqual({ kind: "node", name: "api-gateway" });
    expect(parseFocusEntry("shape-api-gateway")).toEqual({ kind: "node", name: "shape-api-gateway" });
  });

  it("`>` 1 文字も矢印にしない", () => {
    expect(parseFocusEntry("a>b")).toEqual({ kind: "node", name: "a>b" });
  });

  it("片側が空な矢印は名前として扱う", () => {
    expect(parseFocusEntry("-> API")).toEqual({ kind: "node", name: "-> API" });
    expect(parseFocusEntry("API ->")).toEqual({ kind: "node", name: "API ->" });
  });

  it("名前に空白を含む矢印も 2 者に分ける", () => {
    expect(parseFocusEntry("決済 基盤 -> API")).toEqual({ kind: "edge", from: "決済 基盤", to: "API" });
  });

  it("前後の空白を落とす", () => {
    expect(parseFocusEntry("  API  ")).toEqual({ kind: "node", name: "API" });
  });
});

describe("名前に `-` を含む箱が光る (図種で割れない)", () => {
  for (const type of ["sequence", "flow"]) {
    it(`${type}: 普通の名前が光る`, () => {
      const ids = activated(type, "API", "Client, API");
      expect(ids.some((id) => id.includes("api")), JSON.stringify(ids)).toBe(true);
    });

    it(`${type}: \`-\` を含む名前も光る`, () => {
      // 以前は順序図では光らず、 流れ図では名前に部分一致した矢印が光った (実測)
      const ids = activated(type, "api-gateway", "Client, api-gateway");
      expect(ids.some((id) => id.includes("api-gateway")), JSON.stringify(ids)).toBe(true);
      // 箱を指定したのに矢印が光ってはいけない
      expect(ids.some((id) => /^e\d/.test(id)), JSON.stringify(ids)).toBe(false);
    });

    it(`${type}: 矢印の指定は矢印を光らせる`, () => {
      const ids = activated(type, "api-gateway", '"Client -> api-gateway"');
      expect(ids.length, JSON.stringify(ids)).toBeGreaterThan(0);
    });
  }
});

describe("実在しない相手を書いた時の知らせ", () => {
  const src = (focus: string): string => `title: "t"
type: sequence
actors:
  - Client
  - API
flow:
  - Client -> API: "要求"
animation:
  - step: "呼ぶ" 1.4s
    focus: [${focus}]
`;

  it("居ない名前を行番号付きで知らせる", () => {
    const n = noticesOf(src("Client, いない人"));
    expect(n).toHaveLength(1);
    expect(n[0]!.kind).toBe("focus-target-missing");
    expect(n[0]!.actor).toBe("いない人");
    expect(n[0]!.line).toBeGreaterThan(0);
    // 何が書けるか分かるよう、 居る名前を並べる
    expect(n[0]!.hint).toContain("Client");
    expect(n[0]!.hint).toContain("API");
  });

  it("流れに無い矢印を知らせる", () => {
    const n = noticesOf(src('"API -> Client"'));
    expect(n).toHaveLength(1);
    expect(n[0]!.message).toContain("矢印が流れにありません");
    expect(n[0]!.hint).toContain("flow:");
  });

  it("流れにある矢印は知らせない", () => {
    expect(noticesOf(src('"Client -> API"'))).toEqual([]);
  });

  it("居る名前だけなら知らせない", () => {
    expect(noticesOf(src("Client, API"))).toEqual([]);
  });

  it("`-` を含む名前を居ない扱いにしない", () => {
    const s = `title: "t"
type: sequence
actors:
  - Client
  - api-gateway
flow:
  - Client -> api-gateway: "要求"
animation:
  - step: "呼ぶ" 1.4s
    focus: [Client, api-gateway]
`;
    expect(noticesOf(s)).toEqual([]);
  });

  it("知らせを受け取らなくても図は出る", () => {
    expect(() => textDslToDiagram(src("Client, いない人"))).not.toThrow();
  });

  it("動きを書いていない図では何も知らせない", () => {
    const s = `title: "t"
type: sequence
actors:
  - Client
  - API
flow:
  - Client -> API: "要求"
`;
    expect(noticesOf(s)).toEqual([]);
  });
});

describe("知らせの受理集合が解決側と一致する", () => {
  const run = (src: string): { activate: string[]; notices: string[] } => {
    const notices: string[] = [];
    const d = textDslToDiagram(src, { onNotice: (n) => notices.push(n.message) });
    return { activate: d.phases.flatMap((p) => p.activate ?? []), notices };
  };

  it("slug の形で書いた名前を誤報しない (解決側は slug に落とす)", () => {
    const r = run(`title: "t"
type: sequence
actors:
  - Client
  - "API Gateway"
flow:
  - Client -> "API Gateway": "a"
animation:
  - step: "s" 1.4s
    focus: [api-gateway]
`);
    expect(r.activate.length, "光っていない").toBeGreaterThan(0);
    expect(r.notices, "光るのに誤報している").toEqual([]);
  });

  it("縦列の id は受理しない (どの経路も縦列を光らせない)", () => {
    // 受理すると「知らせは出ないのに何も光らない」 状態になる
    const r = run(`title: "t"
type: flow
lanes:
  main: { width: 400, label: "本流" }
actors:
  - Client
  - API
flow:
  - Client -> API: "a"
animation:
  - step: "s" 1.4s
    focus: [main]
`);
    expect(r.activate).toEqual([]);
    expect(r.notices.join(" ")).toContain("main");
  });

  it("矢印を含む名前の箱は名前として光る", () => {
    const r = run(`title: "t"
type: flow
actors:
  - Client
  - "A -> B"
flow:
  - Client -> "A -> B": "a"
animation:
  - step: "s" 1.4s
    focus: ["A -> B"]
`);
    expect(r.activate.length, "光っていない").toBeGreaterThan(0);
    expect(r.notices).toEqual([]);
  });

  it("実在しない名前は矢印として読んで知らせる", () => {
    const r = run(`title: "t"
type: flow
actors:
  - Client
  - API
flow:
  - Client -> API: "a"
animation:
  - step: "s" 1.4s
    focus: ["X -> Y"]
`);
    expect(r.notices.join(" ")).toContain("矢印が流れにありません");
  });
});

describe("光らせる相手の読み方 = 実在する名前を先に見る", () => {
  it("実在すれば矢印より名前を優先する", () => {
    const known = new Set(["A -> B"]);
    expect(parseFocusEntry("A -> B", known)).toEqual({ kind: "node", name: "A -> B" });
  });

  it("実在しなければ矢印として読む", () => {
    expect(parseFocusEntry("A -> B", new Set(["A", "B"]))).toEqual({ kind: "edge", from: "A", to: "B" });
  });

  it("名前集合を渡さなければ書き方だけで判断する", () => {
    expect(parseFocusEntry("A -> B")).toEqual({ kind: "edge", from: "A", to: "B" });
  });
});
