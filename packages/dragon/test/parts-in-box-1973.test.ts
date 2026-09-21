/**
 * 部品を箱に使う時の色番号・知らせ・空の縦列の検証 (#1973)。
 *
 * カタログに部品を箱に使う見本を置くと、次の穴が見つかった。
 *
 * | 穴 | 実測 |
 * |---|---|
 * | 中括弧の形だけが部品の `color: "#..."` を状態の名前 `color` として拾って捨てる | `state-indicator` の塗りが既定の緑のまま。 縦に並べた形と JSON は赤になる |
 * | 色の状態を持たない部品に色番号を書いても何も知らせない | `arc-gauge` は塗りを図形に直接書いており、色番号の入れ先が無い |
 * | 部品に色の名前を書いても何も知らせない | 3 つの形とも塗りは既定のまま。 部品の色の状態は色番号しか受けない |
 * | 部品 1 つだけの図に中身の無い縦列が残る | 図種が自動で作った `flow` の縦列に仮の箱しか無く、仮の箱を消した後も縦列が残った |
 *
 * 部品は実物 (`parts.cdl.ts`) を使う。 作り物の部品で測ると、実物の状態の名前や初期値と
 * ずれても検査が通る。
 */
import { describe, it, expect } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import {
  jsonToDiagram,
  parseTextDslV05,
  textDslToDiagram,
  部品に上書きを当てる,
} from "../src/index";
import type { CompileNotice } from "../src/compile";
import * as 部品 from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";

const 一覧: Record<string, CdlDiagram> = {};
for (const v of Object.values(部品)) {
  const d = v as CdlDiagram;
  if (typeof d === "object" && d !== null && typeof d.id === "string" && Array.isArray(d.nodes)) {
    一覧[d.id] = d;
    一覧[d.id.replace(/^parts-/, "")] = d;
  }
}

const 記法 = (本文: string, 知らせ?: CompileNotice[]): CdlDiagram =>
  textDslToDiagram(`title: "t"\ntype: flow\n\n${本文}`, {
    partsCatalog: 一覧,
    onNotice: (n) => 知らせ?.push(n),
  });

const 状態 = (d: CdlDiagram, 名: string): unknown =>
  d.states.find((s) => s.id.endsWith(`__${名}`))?.initial;

describe("部品の色番号は 3 つの書き方で同じく効く (#1973)", () => {
  it("中括弧・縦並び・JSON のどれで書いても state-indicator の塗りが書いた色番号になる", () => {
    const 中括弧 = 記法(`actors:\n  - 印: { kind: state-indicator, color: "#d9534f" }\n`);
    const 縦 = 記法(`actors:\n  - 印:\n      kind: state-indicator\n      color: "#d9534f"\n`);
    const json = jsonToDiagram(
      {
        title: "t",
        type: "flow",
        actors: [{ name: "印", kind: "state-indicator", color: "#d9534f" }],
        flow: [],
      },
      { partsCatalog: 一覧 },
    );
    const 書かない = 記法(`actors:\n  - 印: { kind: state-indicator }\n`);
    expect(状態(書かない, "stFill"), "部品の塗りの初期値が読めない (前提が崩れた)").toBe("#22c55e");
    for (const [名, d] of [
      ["中括弧", 中括弧],
      ["縦並び", 縦],
      ["JSON", json],
    ] as const) {
      expect(状態(d, "stFill"), `${名} で色番号が効かない`).toBe("#d9534f");
    }
    expect(JSON.stringify(中括弧)).toBe(JSON.stringify(json));
  });

  it("中括弧の色番号は他の状態を変えず、状態の上書きと一緒に書ける", () => {
    const d = 記法(`actors:\n  - 印: { kind: state-indicator, color: "#d9534f", lvl: 0.4 }\n`);
    expect(状態(d, "stFill")).toBe("#d9534f");
    expect(状態(d, "lvl")).toBe(0.4);
  });
});

describe("色の状態を持たない部品に色番号を書くと知らせる (#1973)", () => {
  it("arc-gauge に色番号を書くと part-color-ignored を 1 件出し、塗りは変わらない", () => {
    const 知らせ: CompileNotice[] = [];
    const d = 記法(`actors:\n  - 弧: { kind: arc-gauge, color: "#d9534f" }\n`, 知らせ);
    const 色 = 知らせ.filter((n) => n.kind === "part-color-ignored");
    expect(色).toHaveLength(1);
    expect(色[0]!.actor).toBe("弧");
    expect(色[0]!.message).toContain("#d9534f");
    const 弧 = d.nodes.find((n) => n.id === "弧__arc");
    expect(弧, "部品の箱が組み立てられていない (検査が空振りしている)").toBeDefined();
    expect((弧!.shape as { fill?: string }).fill).toBe("#4e9dc4");
  });

  it("部品に色の名前を書くと、中括弧・縦並び・JSON のどれでも part-color-ignored を 1 件出し、塗りは変わらない", () => {
    const 集める = (作る: (知らせ: CompileNotice[]) => CdlDiagram) => {
      const 知らせ: CompileNotice[] = [];
      const d = 作る(知らせ);
      return { 色: 知らせ.filter((n) => n.kind === "part-color-ignored"), d };
    };
    const 形 = [
      [
        "中括弧",
        集める((k) => 記法(`actors:\n  - 印: { kind: state-indicator, color: 成功 }\n`, k)),
      ],
      [
        "縦並び",
        集める((k) =>
          記法(`actors:\n  - 印:\n      kind: state-indicator\n      color: 成功\n`, k),
        ),
      ],
      [
        "JSON",
        集める((k) =>
          jsonToDiagram(
            {
              title: "t",
              type: "flow",
              actors: [{ name: "印", kind: "state-indicator", color: "成功" }],
              flow: [],
            },
            { partsCatalog: 一覧, onNotice: (n) => k.push(n) },
          ),
        ),
      ],
    ] as const;
    for (const [名, { 色, d }] of 形) {
      expect(色, `${名} で知らせが出ない`).toHaveLength(1);
      expect(色[0]!.actor, 名).toBe("印");
      expect(色[0]!.message, 名).toContain("色の名前");
      expect(状態(d, "stFill"), `${名} で塗りが変わった`).toBe("#22c55e");
    }
  });

  it("色の状態を持つ部品と、色番号を書かない部品では知らせない", () => {
    const 知らせ: CompileNotice[] = [];
    記法(
      `actors:\n  - 印: { kind: state-indicator, color: "#d9534f" }\n  - 弧: { kind: arc-gauge }\n`,
      知らせ,
    );
    expect(知らせ.filter((n) => n.kind === "part-color-ignored")).toEqual([]);
  });
});

describe("部品に上書きを当てる は組み立て側と同じ値を返す (#1973)", () => {
  // 組み立て側の状態は `印__lvl` のように前置きが付く。 前置きを外して部品の状態の名前で並べる
  const 組み立ての状態 = (d: CdlDiagram): Record<string, unknown> =>
    Object.fromEntries(d.states.map((s) => [s.id.replace(/^[^_]+__/, ""), s.initial]));
  const 当てた状態 = (d: CdlDiagram): Record<string, unknown> =>
    Object.fromEntries(d.states.map((s) => [s.id, s.initial]));

  it.each([
    ["状態の上書き", `{ kind: state-indicator, state: { lvl: 0.4 } }`],
    ["平たく書いた状態", `{ kind: state-indicator, lvl: 0.4 }`],
    ["色番号", `{ kind: state-indicator, color: "#d9534f" }`],
    ["色番号と名前で書いた色", `{ kind: state-indicator, color: "#d9534f", stFill: "#123456" }`],
    [
      "色として読めない上書き",
      `{ kind: state-indicator, stFill: "url(https://example.invalid/x)" }`,
    ],
  ])("%s", (_名, 中身) => {
    const 本文 = `title: "t"\ntype: flow\n\nactors:\n  - 印: ${中身}\n`;
    const 読んだ = parseTextDslV05(本文);
    if (!読んだ.ok) throw new Error(読んだ.errors.map((e) => e.message).join(" / "));
    const 印 = 読んだ.doc.actors.find((a) => a.name === "印");
    expect(印?.partId, "部品として読めていない (前提が崩れた)").toBe("state-indicator");
    const 当てた = 部品に上書きを当てる(一覧["state-indicator"]!, 印!);
    const 組み立て = textDslToDiagram(本文, { partsCatalog: 一覧 });
    expect(
      Object.keys(当てた状態(当てた)).length,
      "部品の状態を 1 つも読めていない (検査が空振りしている)",
    ).toBeGreaterThan(0);
    expect(当てた状態(当てた)).toEqual(組み立ての状態(組み立て));
  });

  it("phase: false で段の中身を空にし、段の数は残す。 書かなければ段はそのまま", () => {
    const 部品 = 一覧["state-indicator"]!;
    const 段の中身 = (d: CdlDiagram) =>
      d.phases.reduce((n, ph) => n + ph.tweens.length + ph.sets.length + ph.activate.length, 0);
    expect(段の中身(部品), "部品の段が動いていない (前提が崩れた)").toBeGreaterThan(0);
    const 外した = 部品に上書きを当てる(部品, { stateOverride: { lvl: 0.4, phase: false } });
    expect(外した.phases.length).toBe(部品.phases.length);
    expect(段の中身(外した)).toBe(0);
    expect(部品に上書きを当てる(部品, { stateOverride: { lvl: 0.4 } }).phases).toBe(部品.phases);
    // 何も書かなければ部品の図そのものを返す (描き直しの手掛かりを変えない)
    expect(部品に上書きを当てる(部品, {})).toBe(部品);
  });
});

describe("部品の箱を置いた後に空の縦列を残さない (#1973)", () => {
  const 空の縦列 = (d: CdlDiagram): string[] => {
    const 使う = new Set(d.nodes.map((n) => n.lane));
    return d.lanes.filter((l) => !使う.has(l.id)).map((l) => l.id);
  };

  it("部品 1 つだけの図に、図種が自動で作った縦列が残らない", () => {
    const d = 記法(`actors:\n  - 印: { kind: state-indicator }\n`);
    expect(d.nodes.length, "部品の箱が組み立てられていない (検査が空振りしている)").toBeGreaterThan(
      0,
    );
    expect(空の縦列(d)).toEqual([]);
  });

  it("普通の箱と同じ縦列を使っていた部品を置いても、普通の箱の縦列は残る", () => {
    const d = 記法(`actors:\n  - 受付: { kind: card }\n  - 印: { kind: state-indicator }\n`);
    const 受付 = d.nodes.find((n) => n.title === "受付");
    expect(受付, "普通の箱が無い (前提が崩れた)").toBeDefined();
    expect(d.lanes.some((l) => l.id === 受付!.lane)).toBe(true);
    expect(空の縦列(d)).toEqual([]);
  });

  it("書き手が lanes に書いた縦列は、部品を置いて空になっても残す", () => {
    // 縦列を書かない箱の仮の箱は、フローが作る `flow` の縦列に入る。 書き手が同じ id の縦列を
    // 書くと、仮の箱はその縦列に入る (箱に `lane:` を書いた形は別の決まりで元から残る)
    const 書かない = 記法(`actors:\n  - 受付: { kind: card }\n`);
    expect(
      書かない.lanes.map((l) => l.id),
      "フローが作る縦列の id が変わった (前提が崩れた)",
    ).toEqual(["flow"]);
    const d = 記法(
      `lanes:\n  flow: { label: "流れ" }\n\nactors:\n  - 印: { kind: state-indicator }\n`,
    );
    expect(d.nodes.length, "部品の箱が組み立てられていない (検査が空振りしている)").toBeGreaterThan(
      0,
    );
    expect(d.lanes.map((l) => l.id)).toContain("flow");
  });
});
