// @vitest-environment jsdom
/**
 * 寄って追う図の全体図を、窓に重ねずに置く (#3042)。
 *
 * 全体図を窓の右上に重ねると、狭い枠で今動く線や箱を覆う。
 * 全体図は窓の外に出し、縦長の全体図は窓の右に、横長の全体図は窓の下に置く。
 * 枠の幅が 440px より狭い時は、縦長の全体図の列が窓を狭めすぎるので出さない (#3055)。
 * 置き場所は描いた `svg` の属性で読む。jsdom は配置を測れないが、窓と全体図の地は座標を属性に持つ。
 */
import { afterEach, describe, expect, it } from "vitest";
import { exampleJson, exampleSource, type Json } from "./diagram-support";
import { draw, gap, type Player, type Rect } from "./render-support";

type Diagramish = { [key: string]: Json };

/** 時系列図は縦長の全体図を、構成図は横長の全体図を持つ見本 */
const SAMPLES = [
  ["oauth", "oauth.json"],
  ["ccip", "ccip.json"],
] as const;
/**
 * 全体図を出す見本と枠の幅。時系列図 (oauth) は縦長の全体図を、構成図 (ccip) は横長の全体図を持つ。
 * 縦長の全体図は枠の幅が 440px より狭いと出さない (#3055) ので、oauth は境目の 440px と、記法と並べた編集画面の図の枠の幅 560px で見る。
 * 横長の全体図は表を持たない図ならどの幅でも出す。表を持つ図は狭い枠で全体図を出さない (#3274) ので、ccip は表を外して携帯の幅 390px で、表を持ったまま 560px で見る
 */
const CASES = [
  ["oauth", "oauth.json", 440],
  ["oauth", "oauth.json", 560],
  ["ccip", "ccip.json#bare", 390],
  ["ccip", "ccip.json", 560],
] as const;
/** 幅 1440px の画面の重ね窓の図の枠の幅。oauth の原寸の幅と全体図の列を並べても余る */
const WIDE = 1200;

const players: Player[] = [];
afterEach(() => {
  for (const player of players.splice(0)) player.destroy();
  document.body.innerHTML = "";
});

/** 寄って追う見せ方で、枠の幅を `width` にして原本 `source` を置く。jsdom は幅を持たないため、置き場の幅を差し替える */
function mountSource(name: string, source: Json, width: number): SVGSVGElement {
  const host = document.createElement("div");
  Object.defineProperty(host, "clientWidth", { value: width });
  document.body.appendChild(host);
  const diagram = { ...(structuredClone(source) as Diagramish), view: "follow" };
  players.push(draw("mountDiagram")(host, diagram));
  const svg = host.querySelector<SVGSVGElement>('svg[data-dragon="figure"]');
  expect(svg?.getAttribute("data-view"), `${name} を寄って追う見せ方で描けない`).toBe("follow");
  return svg as SVGSVGElement;
}

const mount = (file: string, width: number): SVGSVGElement => mountSource(file, exampleSource(file), width);

/** 2 本の生存線の間を 20 段行き来する時系列図。高さが幅の 4 倍を超え、全体図の大きさを窓の高さが決める */
function tallSequence(): Json {
  const steps = Array.from({ length: 20 }, (_, i) => ({
    title: `${i + 1} 回目`,
    body: "送って返す。",
    events: [i % 2 === 0 ? { type: "edge", from: "a", to: "b", carry: { kind: "envelope" } } : { type: "edge", from: "b", to: "a", carry: { kind: "envelope" } }],
  }));
  return {
    version: 1,
    kind: "sequence",
    title: "縦に長い時系列図",
    boxes: [
      { id: "a", name: "送る側" },
      { id: "b", name: "受ける側" },
    ],
    steps,
    sequence: { lifelines: ["a", "b"] },
  };
}

/** 四角の属性を読む。無い時は `undefined` */
function rectOf(svg: SVGSVGElement, selector: string): Rect | undefined {
  const el = svg.querySelector(selector);
  if (!el) return undefined;
  const n = (name: string): number => Number(el.getAttribute(name) ?? Number.NaN);
  return { x: n("x") || 0, y: n("y") || 0, w: n("width"), h: n("height") };
}

/** 窓の枠と全体図の地 */
function parts(file: string, width: number): { svg: SVGSVGElement; window: Rect; overview: Rect } {
  const svg = mount(file, width);
  const window = rectOf(svg, ".dg-vp-frame");
  const overview = rectOf(svg, ".dg-mm-bg");
  expect(window, `${file} / ${width}px に窓の枠が無い`).toBeDefined();
  expect(overview, `${file} / ${width}px に全体図の地が無い`).toBeDefined();
  return { svg, window: window as Rect, overview: overview as Rect };
}

describe("寄って追う図の全体図の置き場所 (#3042)", () => {
  it("overview-outside-window", () => {
    for (const [name, file, width] of CASES) {
      const { window, overview } = parts(file, width);
      expect(gap(window, overview), `${name} / ${width}px の全体図が窓に重なる`).toBeGreaterThanOrEqual(0);
    }
  });

  it("overview-side-follows-its-shape", () => {
    for (const [name, file, width] of CASES) {
      const { svg, window, overview } = parts(file, width);
      const world = rectOf(svg, ".dg-mm-world") as Rect;
      const tall = world.h > world.w;
      expect(tall, `${name} の全体図の縦横`).toBe(name === "oauth");
      const right = window.x + window.w;
      const bottom = window.y + window.h;
      if (tall) {
        expect(overview.x, `${name} / ${width}px の縦長の全体図が窓の右に無い`).toBeGreaterThanOrEqual(right);
        expect(overview.y, `${name} / ${width}px の縦長の全体図が窓の上端より上に在る`).toBeGreaterThanOrEqual(window.y - 1);
        expect(overview.y + overview.h, `${name} / ${width}px の縦長の全体図が窓の下へはみ出す`).toBeLessThanOrEqual(bottom + 1);
      } else {
        expect(overview.y, `${name} / ${width}px の横長の全体図が窓の下に無い`).toBeGreaterThanOrEqual(bottom);
        expect(overview.x + overview.w, `${name} / ${width}px の横長の全体図が窓の右へはみ出す`).toBeLessThanOrEqual(right + 1);
      }
      // 窓と全体図の間は 12px。縦長は窓の上端に、横長は窓の右端から 12px 内に揃え、図の幅は窓と全体図をちょうど包む (#3099)。
      // 図の高さは窓と全体図の下の値の表までを包み (#3270)、表を持たない図は横長の全体図の下端までを包む。図の幅と高さは端数を切り上げて書く。表の四角は 0.5px 内側に書かれる
      const view = rectOf(svg, ".dg-vp-bg") as Rect;
      const size = { w: Number(svg.getAttribute("width")), h: Number(svg.getAttribute("height")) };
      const table = rectOf(svg, ".dg-strip");
      const tableEnd = table ? Math.ceil(table.y + table.h + 0.5) : Math.ceil(overview.y + overview.h);
      const place = tall
        ? { gap: overview.x - (view.x + view.w), edge: overview.y - view.y, w: size.w - Math.ceil(overview.x + overview.w), h: size.h - tableEnd }
        : { gap: overview.y - (view.y + view.h), edge: view.x + view.w - (overview.x + overview.w), w: size.w - Math.ceil(view.x + view.w), h: size.h - tableEnd };
      for (const [key, value] of Object.entries({ gap: 12, edge: tall ? 0 : 12, w: 0, h: 0 })) {
        expect(place[key as keyof typeof place], `${name} / ${width}px の全体図の ${key} が ${value}px でない`).toBeCloseTo(value, 5);
      }
    }
  });

  it("follow-figure-within-frame-width", () => {
    for (const [name, file, width] of CASES) {
      const { svg, overview } = parts(file, width);
      const drawn = Number(svg.getAttribute("width"));
      // 枠が図の原寸より狭い時は、枠の幅を余さず使う。余すと窓が狭まり、右端の登場する物の札が切れる (#3053、#3099)
      expect(drawn, `${name} / ${width}px の図の幅が枠の幅と違う`).toBe(width);
      expect(overview.x + overview.w, `${name} / ${width}px の全体図が図の幅の外に出る`).toBeLessThanOrEqual(drawn);
      expect(overview.y + overview.h, `${name} / ${width}px の全体図が図の高さの外に出る`).toBeLessThanOrEqual(Number(svg.getAttribute("height")));
    }
  });

  it("follow-window-takes-figure-width", () => {
    // 窓と全体図を図の原寸の幅に収めていたため、枠が余っても窓は図より狭く、右端の登場する物の札が切れていた (#3053)
    const figureWidth = draw("renderDiagram")(exampleJson("oauth.json")).layout.width;
    const { svg, window, overview } = parts("oauth.json", WIDE);
    expect(window.w + 1, `枠の幅 ${WIDE}px の oauth の窓の幅が、図の原寸の幅と違う`).toBeCloseTo(figureWidth, 5);
    expect(gap(window, overview), `枠の幅 ${WIDE}px の oauth の全体図が窓に重なる`).toBeGreaterThanOrEqual(0);
    expect(overview.x, `枠の幅 ${WIDE}px の oauth の全体図が窓の右に無い`).toBeGreaterThanOrEqual(window.x + window.w);
    expect(Number(svg.getAttribute("width")), `枠の幅 ${WIDE}px の oauth の図の幅が枠を超える`).toBeLessThanOrEqual(WIDE);
  });

  it("tall-overview-fits-beside-window", () => {
    // 窓の高さに比べてとても縦に長い図でも、窓の右の全体図は窓の高さの中に収まる (全体図の高さは窓の高さの 4 割まで)
    const svg = mountSource("縦に長い時系列図", tallSequence(), 560);
    const window = rectOf(svg, ".dg-vp-frame") as Rect;
    const overview = rectOf(svg, ".dg-mm-bg") as Rect;
    const world = rectOf(svg, ".dg-mm-world") as Rect;
    expect(window && overview && world, "縦に長い時系列図に窓の枠か全体図が無い").toBeTruthy();
    expect(world.h, "縦に長い時系列図の全体図が縦長でない").toBeGreaterThan(world.w);
    expect(overview.x, "縦に長い時系列図の全体図が窓の右に無い").toBeGreaterThanOrEqual(window.x + window.w);
    expect(overview.y + overview.h, "縦に長い時系列図の全体図が窓の下へはみ出す").toBeLessThanOrEqual(window.y + window.h + 1);
  });

  it("overview-shows-viewport-box", () => {
    for (const [name, file, width] of CASES) {
      const { svg } = parts(file, width);
      expect(svg.querySelectorAll(".dg-mm-vp").length, `${name} / ${width}px の全体図に今見ている所の枠が無い`).toBe(1);
      expect(svg.querySelector(".dg-mm-t")?.textContent, `${name} / ${width}px の全体図の札`).toBe("全体図");
    }
  });

  it("fixed-figure-has-no-overview", () => {
    for (const [name, file] of SAMPLES) {
      const rendered = draw("renderDiagram")(exampleJson(file));
      const holder = document.createElement("div");
      holder.innerHTML = rendered.svg;
      const svg = holder.querySelector("svg");
      expect(svg?.getAttribute("data-view"), `${name} の止めて見せる図`).toBe("fixed");
      expect(svg?.querySelectorAll(".dg-mm-bg, .dg-vp-frame").length, `${name} の止めて見せる図に全体図か窓が在る`).toBe(0);
      expect(Number(svg?.getAttribute("width")), `${name} の止めて見せる図の幅`).toBe(Math.ceil(rendered.layout.width));
      expect(Number(svg?.getAttribute("height")), `${name} の止めて見せる図の高さ`).toBe(Math.ceil(rendered.layout.height));
    }
  });
});
