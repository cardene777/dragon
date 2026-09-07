/**
 * 段に書く `draw: line` の検査 (#1312)。
 *
 * 見るのは 4 つ。 書いた段だけが描画側の欄を持つこと、2 つの入口 (記法 / JSON) が同じ図に
 * なること、読めない語と効かない図種を知らせること、書かない図が変わらないこと。
 */
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  textDslToDiagram,
  jsonToDiagram,
  parseTextDslV05,
  DRAW_TARGETS,
  DRAW_WORDS,
} from "../src/index";
import type { CompileNotice } from "../src/compile";

/** JSON Schema の実体。 表との一致を見るために読む (#1318) */
const SCHEMA_PATH = new URL("../src/schemas/diagram.json", import.meta.url);

const 折れ線 = (段: string): string => `title: "週ごとの応答時間"
type: line

actors:
  - W1: "{w1}"
  - W2: "{w2}"

states:
  w1: 180
  w2: 240

animation:
${段}`;

const 描く段 = `  - step: "改善前" 1.2s
    draw: line
    description: "x"
  - step: "改善後" 1.2s
    tween:
      w1: 180 -> 140
    description: "y"
`;

const 描かない段 = `  - step: "改善前" 1.2s
    description: "x"
  - step: "改善後" 1.2s
    tween:
      w1: 180 -> 140
    description: "y"
`;

/** 段ごとの `draw` を並べる。 欄を持たない段は `undefined` */
const 段ごとのdraw = (src: string): Array<string[] | undefined> =>
  textDslToDiagram(src).phases.map((p) => p.draw);

describe("書いた段だけが描画側の欄を持つ", () => {
  it("`draw: line` を書いた段が図の箱を指す", () => {
    const d = textDslToDiagram(折れ線(描く段));
    const 箱 = d.nodes.find((n) => n.kind === "chart-line");
    expect(箱, "折れ線の箱がある").toBeDefined();
    expect(d.phases[0]!.draw).toEqual([箱!.id]);
  });

  it("書かなかった段は欄ごと持たない (空配列も置かない)", () => {
    const phase = textDslToDiagram(折れ線(描く段)).phases[1]!;
    expect(phase.draw).toBeUndefined();
    expect(Object.keys(phase)).not.toContain("draw");
  });

  it("1 段も書かない図では、どの段も欄を持たない", () => {
    expect(段ごとのdraw(折れ線(描かない段))).toEqual([undefined, undefined]);
  });

  it("`draw` を書いても光らせる相手は増えない", () => {
    // 描画側は焦点と別集合で持つ (cdl#512)。 兼ねると値が動くだけの段でも引き直しになる
    expect(textDslToDiagram(折れ線(描く段)).phases[0]!.activate).toEqual([]);
  });
});

describe("2 つの入口が同じ図になる", () => {
  it("JSON に `draw` を書いた図が記法と一致する", () => {
    const 記法 = textDslToDiagram(折れ線(描く段));
    const json = jsonToDiagram({
      title: "週ごとの応答時間",
      type: "line",
      actors: [
        { name: "W1", subtitle: "{w1}" },
        { name: "W2", subtitle: "{w2}" },
      ],
      flow: [],
      states: { w1: 180, w2: 240 },
      animation: [
        { step: "改善前", duration: 1.2, draw: "line", body: "x" },
        { step: "改善後", duration: 1.2, body: "y", tween: { w1: [180, 140] } },
      ],
    });
    expect(json.phases).toEqual(記法.phases);
  });

  it("JSON で読めない語を書くと誤りになる", () => {
    expect(() =>
      jsonToDiagram({
        title: "t",
        type: "line",
        actors: [{ name: "W1", subtitle: "180" }],
        flow: [],
        animation: [{ step: "s1", duration: 1, draw: "sweep" }],
      }),
    ).toThrow(/draw must be one of: line/);
  });
});

describe("読めない語を知らせる", () => {
  it.each(["sweep", "LINE", "線"])("`draw: %s` が行番号付きの誤りになる", (語) => {
    const r = parseTextDslV05(折れ線(`  - step: "s1" 1.2s\n    draw: ${語}\n`));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.message.includes("draw に書けない語"))).toBe(true);
      // 段の先頭ではなく `draw:` を書いた行を指す
      expect(r.errors.find((e) => e.message.includes("draw"))!.line).toBe(14);
    }
  });

  it("受ける語の一覧が空でない (検査が空振りしていない)", () => {
    expect(DRAW_WORDS.size).toBeGreaterThan(0);
  });

  it("段の項目名を間違えた時の案内に draw が載る", () => {
    const r = parseTextDslV05(折れ線(`  - step: "s1" 1.2s\n    drawww: line\n`));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.hint ?? "").join("\n")).toContain("draw");
  });
});

describe("語と図種の対応を 1 つの表から導く (#1314)", () => {
  it("表が空でない (検査が空振りしていない)", () => {
    expect(DRAW_TARGETS.size).toBeGreaterThan(0);
  });

  it("受ける語の一覧が表の鍵と一致する", () => {
    expect([...DRAW_WORDS].sort()).toEqual([...DRAW_TARGETS.keys()].sort());
  });

  it("JSON Schema の enum が表と一致する (#1318)", () => {
    /*
     * `enum` は JSON file なので実装から生成できない。 表に語を足した時に片方だけ古くなる
     * 形を、この検査だけが塞ぐ (他の 2 つの一覧は表から導いてある)。
     */
    const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8")) as {
      properties: {
        animation: { items: { properties: { draw: { enum: string[] } } } };
      };
    };
    const en = schema.properties.animation.items.properties.draw.enum;
    expect([...en].sort()).toEqual([...DRAW_TARGETS.keys()].sort());
  });

  it("表の 13 組が語と図種の対で固定されている", () => {
    /*
     * **手で並べる**。 実装から導くと恒真になる (下の `it.each` も同じ表から出る)。
     *
     * 鍵だけでなく **組で** 固定する。 鍵だけを見ると、語と図種の対応をずらす変更
     * (`["funnel", "tree"]` 等) を 1 件も捕まえられない = `it.each` が表から両側を
     * 作るため、ずれた表でも辻褄が合ってしまう (変異試験で実測)。
     */
    expect([...DRAW_TARGETS].sort()).toEqual([
      ["bar", "bar"],
      ["funnel", "funnel"],
      ["gantt", "gantt"],
      ["gauge", "gauge"],
      ["journey", "journey"],
      ["line", "line"],
      ["mind", "mind"],
      ["pie", "pie"],
      ["radial", "radial"],
      ["slope", "slope"],
      ["stacked", "stacked"],
      ["tree", "tree"],
      ["waffle", "waffle"],
    ]);
  });

  it.each([...DRAW_TARGETS])("`draw: %s` を type: %s の段に書くと箱を指す", (語, 図種) => {
    const src = `title: "t"
type: ${図種}

actors:
  - A: "45"
  - B: "25"

animation:
  - step: "s1" 1.2s
    draw: ${語}
`;
    const d = textDslToDiagram(src);
    expect(d.phases[0]!.draw, `${語} が箱を指していない`).toHaveLength(1);
    // 指す先は図全体を 1 箱で描く箱そのもの
    expect(d.nodes.some((n) => n.id === d.phases[0]!.draw![0])).toBe(true);
  });
});

describe("語と図種が食い違う形を知らせる (#1314)", () => {
  const 食い違い = `title: "t"
type: bar

actors:
  - A: "45"
  - B: "25"

animation:
  - step: "s1" 1.2s
    draw: pie
`;

  it("知らせが 1 件出て、行は `draw:` を指す", () => {
    const notices: CompileNotice[] = [];
    textDslToDiagram(食い違い, { onNotice: (n) => notices.push(n) });
    const 該当 = notices.filter((n) => n.kind === "draw-target-mismatch");
    expect(該当).toHaveLength(1);
    expect(該当[0]!.line).toBe(10);
    expect(該当[0]!.hint, "その図で書く語を案内する").toContain("draw: bar");
  });

  it("誤りにはしない (図は描かれ、段も残る)", () => {
    const d = textDslToDiagram(食い違い, { onNotice: () => {} });
    expect(d.nodes.length).toBeGreaterThan(0);
    expect(d.phases).toHaveLength(1);
  });

  it("効かないので段は箱を指さない", () => {
    const d = textDslToDiagram(食い違い, { onNotice: () => {} });
    expect(d.phases[0]!.draw).toBeUndefined();
  });

  it("語と図種が一致する形では知らせが出ない", () => {
    const notices: CompileNotice[] = [];
    textDslToDiagram(食い違い.replace("draw: pie", "draw: bar"), {
      onNotice: (n) => notices.push(n),
    });
    expect(notices.filter((n) => n.kind === "draw-target-mismatch")).toHaveLength(0);
  });
});

describe("効かない図種で知らせる", () => {
  const 矢印の図 = `title: "t"
type: flow

actors:
  - A
  - B

flow:
  - A -> B: "x"

animation:
  - step: "s1" 1s
    draw: line
`;

  it("`type: flow` に書くと知らせが出る", () => {
    const notices: CompileNotice[] = [];
    textDslToDiagram(矢印の図, { onNotice: (n) => notices.push(n) });
    const 該当 = notices.filter((n) => n.kind === "draw-not-honored");
    expect(該当).toHaveLength(1);
    expect(該当[0]!.line, "`draw:` を書いた行を指す").toBe(13);
    expect(該当[0]!.hint).toContain("line");
  });

  it("知らせが出ても図は描かれる (箱と矢印が減らない)", () => {
    const d = textDslToDiagram(矢印の図, { onNotice: () => {} });
    expect(d.nodes.length).toBeGreaterThan(0);
    expect(d.edges.length).toBe(1);
  });

  it("折れ線では知らせが出ない", () => {
    const notices: CompileNotice[] = [];
    textDslToDiagram(折れ線(描く段), { onNotice: (n) => notices.push(n) });
    expect(notices.filter((n) => n.kind === "draw-not-honored")).toHaveLength(0);
  });
});

describe("書かない図が変わらない", () => {
  it("`draw` を足す前後で、書かない図の段が 1 文字も変わらない", () => {
    const 前 = JSON.stringify(textDslToDiagram(折れ線(描かない段)).phases);
    const 後 = JSON.stringify(
      textDslToDiagram(折れ線(描かない段), { onNotice: () => {} }).phases,
    );
    expect(後).toBe(前);
    expect(前).not.toContain("draw");
  });
});
