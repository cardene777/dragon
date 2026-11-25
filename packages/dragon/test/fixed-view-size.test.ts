// @vitest-environment jsdom
/**
 * 止めて見せる図を、元の幅より大きく描かない (#3934)。
 *
 * 全ての図に入る `.dg{width:100%}` が、元の幅より広い枠で図を枠いっぱいまで拡げ、縦に長い手順の図の箱の名前の字が 30px 近くになっていた。
 * 再生の部品は止めて見せる図に元の幅 (`--dg-w`) を上限として渡し、枠より狭い図を枠の真ん中に置く。
 * 見せ方を選ぶ `chooseView` も倍率を 1 で止め、字の大きさを元の字の大きさより大きく求めない。
 * jsdom は配置を測れないので、図に渡した上限と、再生の部品の見た目の規則を読む。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { api, exampleJson, type Json } from "./diagram-support";
import { draw, type Player } from "./render-support";
import "../src/kind-use/architecture";
import "../src/kind-use/flow";

type Diagramish = { [key: string]: Json };

/** 箱の名前の元の字の大きさ (`TYPE.boxName.size`) */
const NATURAL_PX = 13;
/** 説明の頁の図の枠の幅 */
const PAGE_WIDTH = 728;

/** skill の資料の例の、縦に長い手順の図の原文 */
function tallFlow(): Diagramish {
  const doc = readFileSync(join(__dirname, "../../../plugins/dragon/skills/dragon/references/example-library-loans.md"), "utf8");
  const text = /```dragon\n(flow The checks at the desk\n[\s\S]*?)```/.exec(doc)?.[1];
  expect(text, "資料の例に手順の図が無い").toBeDefined();
  const read = api("parseNotation")(text ?? "", { lang: "en" });
  expect(read.ok, `資料の例の手順の図が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return (read.ok ? read.diagram : {}) as Diagramish;
}

/** 名前、原本、元の幅より広い枠の幅 */
function samples(): [string, Diagramish, number][] {
  return [
    ["library-loans の手順の図", tallFlow(), PAGE_WIDTH],
    ["ccip", exampleJson("ccip.json") as Diagramish, 2400],
  ];
}

const players: Player[] = [];
afterEach(() => {
  for (const player of players.splice(0)) player.destroy();
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});

/** 枠の幅を `width` にして図を置く */
function mount(diagram: Diagramish, width: number): SVGSVGElement {
  const host = document.createElement("div");
  Object.defineProperty(host, "clientWidth", { value: width });
  document.body.appendChild(host);
  players.push(draw("mountDiagram")(host, structuredClone(diagram)));
  const svg = host.querySelector<SVGSVGElement>('svg[data-dragon="figure"]');
  expect(svg, "図を置けない").not.toBeNull();
  return svg as SVGSVGElement;
}

/** 図に渡した幅の上限 (px)。渡していなければ枠の幅いっぱい */
function capOf(svg: SVGSVGElement, frame: number): number {
  const cap = Number.parseFloat(svg.style.getPropertyValue("--dg-w"));
  return Number.isFinite(cap) ? Math.min(frame, cap) : frame;
}

describe("止めて見せる図を元の幅より大きく描かない (#3934)", () => {
  it("fixed-figure-not-wider-than-layout", () => {
    for (const [name, diagram, width] of samples()) {
      const { layout } = draw("renderDiagram")(diagram);
      const svg = mount(diagram, width);
      expect(svg.getAttribute("data-view"), `${name} / 枠 ${width}px が止めて見せる図にならない`).toBe("fixed");
      expect(Math.ceil(layout.width), `${name} の元の幅が枠 ${width}px より狭くない`).toBeLessThan(width);
      expect(capOf(svg, width), `${name} / 枠 ${width}px の図が元の幅より広く描かれる`).toBe(Math.ceil(layout.width));
    }
    // 上限を読む規則は止めて見せる図にだけ当て、送れる枠とキャンバス式の窓の規則 (`max-width:none`) には勝たない
    const css = [...document.querySelectorAll("style#dragon-player-css")].map((s) => s.textContent ?? "").join("");
    expect(css, "止めて見せる図に上限と真ん中寄せを付ける規則が無い").toMatch(
      /\.dg-frame>svg:where\(\[data-view="fixed"\]\)\{max-width:var\(--dg-w,100%\);margin-inline:auto\}/,
    );
  });

  it("tall-flow-text-stays-natural-size", () => {
    const diagram = tallFlow();
    const rendered = draw("renderDiagram")(diagram);
    expect(draw("chooseView")(rendered, PAGE_WIDTH).textPx, "見せ方を選ぶ字の大きさ").toBeLessThanOrEqual(NATURAL_PX);
    const svg = mount(diagram, PAGE_WIDTH);
    const viewWidth = Number(svg.getAttribute("viewBox")?.split(" ")[2]);
    const shown = (capOf(svg, PAGE_WIDTH) / viewWidth) * NATURAL_PX;
    expect(shown, `枠 ${PAGE_WIDTH}px で描いた手順の図の箱の名前の字`).toBeLessThanOrEqual(NATURAL_PX);
  });

  it("choose-view-text-capped-at-natural", () => {
    for (const [name, diagram] of samples()) {
      const rendered = draw("renderDiagram")(diagram);
      for (const width of [PAGE_WIDTH, 4000]) {
        const { textPx } = draw("chooseView")(rendered, width);
        expect(textPx, `${name} / 枠 ${width}px の字`).toBeLessThanOrEqual(NATURAL_PX);
      }
      expect(draw("chooseView")(rendered, 4000).textPx, `${name} / 広い枠の字が元の大きさにならない`).toBeCloseTo(NATURAL_PX);
    }
  });
});

/** 共に始まり、分かれ目の後で2つの場面に分かれる、縦に長い手順の図 (#3938) */
function sceneFlow(scenes: "stack" | "pick"): Diagramish {
  const text = [
    `flow 返す日で分かれる [scenes: ${scenes}]`,
    "",
    "box back as 本を返す",
    "choice late as 期限を過ぎた？",
    "box take as 受け取る",
    "box fee as 延滞料を取る",
    "",
    "step 返す",
    "  say 本を返しに来る。",
    "  start -> back",
    "  back -> late",
    "",
    "scene 期限の内",
    "  step 受け取る",
    "    say 期限の内なので受け取る。",
    "    late -> take: いいえ",
    "end",
    "",
    "scene 期限を過ぎた",
    "  step 延滞料を取る",
    "    say 期限を過ぎたので延滞料を取る。",
    "    late -> fee: はい",
    "end",
  ].join("\n");
  const read = api("parseNotation")(text, { lang: "ja" });
  expect(read.ok, `場面の図が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return (read.ok ? read.diagram : {}) as Diagramish;
}

describe("場面を持つ図も元の幅より大きく描かない (#3938)", () => {
  it("scene-figures-not-wider-than-layout", () => {
    for (const scenes of ["stack", "pick"] as const) {
      const host = document.createElement("div");
      Object.defineProperty(host, "clientWidth", { value: 2400 });
      document.body.appendChild(host);
      players.push(draw("mountDiagram")(host, sceneFlow(scenes)));
      const figures = [...host.querySelectorAll<SVGSVGElement>('[data-dragon="scene"] .dg-frame > svg')];
      expect(figures.length, `[scenes: ${scenes}] の場面ごとの図の数`).toBe(2);
      for (const svg of figures) {
        const width = Number(svg.getAttribute("width"));
        expect(width, `[scenes: ${scenes}] の場面の図の元の幅が枠より狭くない`).toBeLessThan(2400);
        expect(svg.getAttribute("data-view"), `[scenes: ${scenes}] の場面の図が止めて見せる図にならない`).toBe("fixed");
        expect(capOf(svg, 2400), `[scenes: ${scenes}] の場面の図が元の幅より広く描かれる`).toBe(width);
      }
    }
  });
});
