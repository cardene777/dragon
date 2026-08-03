/**
 * 色の状態への上書きを色に限る (#1004)。
 *
 * パーツの状態は書く人が値を差し替えられる。 差し替えた値は node の `fill` に入るため、
 * `url(https://...)` を書くと SVG が外部の資源を参照する形になり、 図を開いた人の環境から
 * その URL へ要求が飛ぶ。 書き出した SVG を配布しても同じことが起きる。
 *
 * 元の値が色だった状態だけを対象にする。 数値や文字列の状態は色として描かれないため、
 * 一律に弾くと正当な用途 (ゲージの値、 説明文の差し替え) を壊す。
 *
 * 経路は 2 つある (本文欄の独自記法と、 YAML/JSON)。 どちらも同じ併合処理を通るため、
 * 本 test は併合の入口である `jsonToDiagram` で検査する。
 */
import { describe, it, expect } from "vitest";
import { jsonToDiagram, textDslToDiagram, type CompileNotice } from "../src/index";
import type { CdlDiagram } from "@cardenelabs/cdl";

/** 色の状態 (`stFill`) と、 色ではない状態 (`v` / `note`) を 1 つずつ持つ最小パーツ */
const TEST_PART: CdlDiagram = {
  id: "parts-state-indicator",
  topic: "状態インジケーター",
  lanes: [{ id: "l", x: 0, width: 380 }],
  nodes: [{
    id: "ind",
    lane: "l",
    stack: 0,
    kind: "actor",
    title: "現在の状態",
    subtitle: "{note}",
    w: 360,
    h: 380,
    shape: { kind: "circle", radius: 140, fill: "{stFill}" },
  }] as CdlDiagram["nodes"],
  edges: [],
  states: [
    { id: "stFill", initial: "#22c55e" },
    { id: "v", initial: 0 },
    { id: "note", initial: "active" },
  ],
  phases: [],
};

const CATALOG: Record<string, CdlDiagram> = {
  "state-indicator": TEST_PART,
};

function build(stateOverride: Record<string, unknown>): CdlDiagram {
  return jsonToDiagram(
    {
      title: "host",
      type: "sequence",
      actors: [{ name: "ind1", kind: "state-indicator", state: stateOverride }],
      flow: [],
    },
    { partsCatalog: CATALOG },
  );
}

function stateOf(d: CdlDiagram, id: string): number | string | undefined {
  return d.states.find((s) => s.id === `ind1__${id}`)?.initial;
}

describe("色の状態への上書き (#1004)", () => {
  describe("色として読めない値は採らない", () => {
    it("外部を指す url(...) は採らず、 元の色が残る", () => {
      const d = build({ stFill: "url(https://example.invalid/pixel)" });
      expect(stateOf(d, "stFill")).toBe("#22c55e");
    });

    it("大文字や空白で包んだ url(...) も採らない", () => {
      for (const bad of [
        "URL(https://example.invalid/x)",
        "  url(https://example.invalid/x)  ",
        "Url( https://example.invalid/x )",
      ]) {
        const d = build({ stFill: bad });
        expect(stateOf(d, "stFill"), bad).toBe("#22c55e");
      }
    });

    it("色に見えない文字列も採らない", () => {
      for (const bad of ["red; background:url(x)", "#ff", "#12345", "rgb(1,2,3)", "javascript:alert(1)"]) {
        const d = build({ stFill: bad });
        expect(stateOf(d, "stFill"), bad).toBe("#22c55e");
      }
    });

    it("数値や真偽値を色の状態に入れても採らない", () => {
      expect(stateOf(build({ stFill: 42 }), "stFill")).toBe("#22c55e");
      expect(stateOf(build({ stFill: true }), "stFill")).toBe("#22c55e");
    });
  });

  describe("色として読める値は従来どおり採る", () => {
    it("3 桁 / 6 桁 / 8 桁の色は採る", () => {
      expect(stateOf(build({ stFill: "#f00" }), "stFill")).toBe("#f00");
      expect(stateOf(build({ stFill: "#ff0000" }), "stFill")).toBe("#ff0000");
      expect(stateOf(build({ stFill: "#ff000080" }), "stFill")).toBe("#ff000080");
    });

    it("大文字の色も採る", () => {
      expect(stateOf(build({ stFill: "#FF0000" }), "stFill")).toBe("#FF0000");
    });
  });

  describe("色ではない状態は制限しない", () => {
    it("数値の状態には数値がそのまま入る", () => {
      expect(stateOf(build({ v: 80 }), "v")).toBe(80);
    });

    it("文字列の状態には文字列がそのまま入る", () => {
      expect(stateOf(build({ note: "待機中" }), "note")).toBe("待機中");
    });

    it("文字列の状態でも図の外を指す値は落ちる", () => {
      // 状態は `{名前}` の形で `fill` に差し込める。 差し込み先を辿って判断する形は
      // 経路が増えるほど漏れるので、 状態の値は一律で落とす。
      // 説明文に URL を書きたい場合は状態を経由せず `subtitle` に直接書く
      expect(stateOf(build({ note: "url(https://example.invalid/x)" }), "note")).toBe("none");
    });

    it("外を指さない文字列はそのまま入る", () => {
      expect(stateOf(build({ note: "待機中 (詳細は社内 wiki)" }), "note")).toBe("待機中 (詳細は社内 wiki)");
    });
  });

  describe("本文欄の記法からも同じ制限が効く", () => {
    it("独自記法で色の状態に url(...) を書いても採らない", () => {
      const src = `title: "host"
type: sequence

actors:
  - ind1: { kind: state-indicator, stFill: "url(https://example.invalid/x)" }

flow:
  - ind1 -> ind1: "self"
`;
      const d = textDslToDiagram(src, { partsCatalog: CATALOG });
      expect(stateOf(d, "stFill")).toBe("#22c55e");
    });

    it("独自記法で色を書けば従来どおり採る", () => {
      const src = `title: "host"
type: sequence

actors:
  - ind1: { kind: state-indicator, stFill: "#0000ff" }

flow:
  - ind1 -> ind1: "self"
`;
      const d = textDslToDiagram(src, { partsCatalog: CATALOG });
      expect(stateOf(d, "stFill")).toBe("#0000ff");
    });
  });

  describe("描画に渡る形でも外部参照が残らない", () => {
    it("組み立てた図の中に url( で始まる値が無い", () => {
      const d = build({ stFill: "url(https://example.invalid/pixel)" });
      const dump = JSON.stringify(d);
      expect(dump).not.toContain("example.invalid");
    });
  });
});

/**
 * 状態の上書き以外の入口。
 *
 * 入口ごとに塞ぐと 1 つ見落とした時に穴が残るため、 組み立ての最後に図全体を走査している。
 * ここでは「状態の上書きを通らない経路」 を並べて、 出口で確かに落ちることを見る。
 */
describe("状態の上書き以外の入口も塞がる (#1004)", () => {
  it("phase が入れる値 (sets) で迂回できない", () => {
    // 初期値は安全なまま、 phase 到達時に上書きする形。 入口だけを塞いだ実装はここで破れる
    const part: CdlDiagram = {
      ...TEST_PART,
      phases: [{
        id: "p",
        duration: 1000,
        title: "遷移",
        body: "",
        activate: ["ind"],
        tweens: [],
        sets: [{ stateId: "stFill", value: "url(https://example.invalid/x)" }],
      }] as CdlDiagram["phases"],
    };
    const d = jsonToDiagram(
      {
        title: "host",
        type: "sequence",
        actors: [{ name: "ind1", kind: "state-indicator" }],
        flow: [],
      },
      { partsCatalog: { "state-indicator": part } },
    );
    expect(JSON.stringify(d)).not.toContain("example.invalid");
  });

  it("パーツの図が直接持つ fill も落ちる", () => {
    // 埋め込んだ JSON をそのまま読む経路 (共有本文の `#!parts`) が同じ形になる
    const part: CdlDiagram = {
      ...TEST_PART,
      nodes: [{
        ...TEST_PART.nodes[0],
        shape: { kind: "circle", radius: 140, fill: "url(https://example.invalid/x)" },
      }] as CdlDiagram["nodes"],
    };
    const d = jsonToDiagram(
      {
        title: "host",
        type: "sequence",
        actors: [{ name: "ind1", kind: "state-indicator" }],
        flow: [],
      },
      { partsCatalog: { "state-indicator": part } },
    );
    expect(JSON.stringify(d)).not.toContain("example.invalid");
  });

  it("色名を初期値に持つ状態への上書きも塞がる", () => {
    // 16 進だけを色とみなす実装では、 この状態が「色ではない」 判定になって素通しする
    const part: CdlDiagram = {
      ...TEST_PART,
      states: [{ id: "stFill", initial: "red" }],
    };
    const d = jsonToDiagram(
      {
        title: "host",
        type: "sequence",
        actors: [{ name: "ind1", kind: "state-indicator", state: { stFill: "url(https://example.invalid/x)" } }],
        flow: [],
      },
      { partsCatalog: { "state-indicator": part } },
    );
    expect(stateOf(d, "stFill")).toBe("red");
  });

  it("色名は色として通る (16 進の初期値へ color name を書ける)", () => {
    expect(stateOf(build({ stFill: "red" }), "stFill")).toBe("red");
    expect(stateOf(build({ stFill: "transparent" }), "stFill")).toBe("transparent");
  });

  it("図の中の定義を指す url(#id) は出口で落とさない", () => {
    // 図の中で定義した色の変化 (グラデーション) を指す形。 外へは出ないので落としてはいけない。
    //
    // 上書きとして書く経路は別で、 そちらは色に限るため通らない (書く人が図の中に定義を
    // 置く経路が無く、 書いても存在しない参照になるため)
    const part: CdlDiagram = {
      ...TEST_PART,
      nodes: [{
        ...TEST_PART.nodes[0],
        shape: { kind: "circle", radius: 140, fill: "url(#grad-1)" },
      }] as CdlDiagram["nodes"],
    };
    const d = jsonToDiagram(
      {
        title: "host",
        type: "sequence",
        actors: [{ name: "ind1", kind: "state-indicator" }],
        flow: [],
      },
      { partsCatalog: { "state-indicator": part } },
    );
    expect(JSON.stringify(d)).toContain("url(#grad-1)");
  });
});

describe("落とした時に書いた人へ知らせる (#1004)", () => {
  function noticesFor(stateOverride: Record<string, unknown>): CompileNotice[] {
    const collected: CompileNotice[] = [];
    jsonToDiagram(
      {
        title: "host",
        type: "sequence",
        actors: [{ name: "ind1", kind: "state-indicator", state: stateOverride }],
        flow: [],
      },
      { partsCatalog: CATALOG, onNotice: (n) => collected.push(n) },
    );
    return collected;
  }

  it("色として読めない上書きを捨てたことを知らせる", () => {
    const notices = noticesFor({ stFill: "url(https://example.invalid/x)" });
    const rejected = notices.filter((n) => n.kind === "state-override-rejected");
    expect(rejected.length, JSON.stringify(notices)).toBeGreaterThan(0);
    expect(rejected[0]?.actor).toBe("ind1");
    expect(rejected[0]?.message).toContain("stFill");
    expect(rejected[0]?.hint).toContain("#ff0000");
  });

  it("正しい色を書いた時は何も知らせない", () => {
    const notices = noticesFor({ stFill: "#123456" });
    expect(notices.filter((n) => n.kind === "state-override-rejected")).toHaveLength(0);
  });

  it("出口で落とした分も知らせる", () => {
    const part: CdlDiagram = {
      ...TEST_PART,
      nodes: [{
        ...TEST_PART.nodes[0],
        shape: { kind: "circle", radius: 140, fill: "url(https://example.invalid/x)" },
      }] as CdlDiagram["nodes"],
    };
    const collected: CompileNotice[] = [];
    jsonToDiagram(
      {
        title: "host",
        type: "sequence",
        actors: [{ name: "ind1", kind: "state-indicator" }],
        flow: [],
      },
      { partsCatalog: { "state-indicator": part }, onNotice: (n) => collected.push(n) },
    );
    const dropped = collected.filter((n) => n.kind === "external-paint-dropped");
    expect(dropped.length, JSON.stringify(collected)).toBeGreaterThan(0);
    // 長い URL をそのまま出すと帯が読めないので短く切る
    expect(dropped[0]?.message.length).toBeLessThan(120);
  });
});
