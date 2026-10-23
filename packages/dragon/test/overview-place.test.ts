// @vitest-environment jsdom
/**
 * 寄って追う図の全体図を、窓に重ねずに置く (#3042)。
 *
 * 全体図を窓の右上に重ねると、狭い枠で今動く線や箱を覆う。
 * 全体図は窓の外に出し、縦長の全体図は窓の右に、横長の全体図は窓の下に置く。
 * 置き場所は描いた `svg` の属性で読む。jsdom は配置を測れないが、窓と全体図の地は座標を属性に持つ。
 */
import { afterEach, describe, expect, it } from "vitest";
import { exampleJson, type Json } from "./diagram-support";
import { draw, gap, type Player, type Rect } from "./render-support";

type Diagramish = { [key: string]: Json };

/** 時系列図は縦長の全体図を、構成図は横長の全体図を持つ見本 */
const SAMPLES = [
  ["oauth", "oauth.json"],
  ["ccip", "ccip.json"],
] as const;
/** 携帯の幅と、記法と並べた編集画面の図の枠の幅 */
const WIDTHS = [390, 560] as const;

const players: Player[] = [];
afterEach(() => {
  for (const player of players.splice(0)) player.destroy();
  document.body.innerHTML = "";
});

/** 寄って追う見せ方で、枠の幅を `width` にして図を置く。jsdom は幅を持たないため、置き場の幅を差し替える */
function mount(file: string, width: number): SVGSVGElement {
  const host = document.createElement("div");
  Object.defineProperty(host, "clientWidth", { value: width });
  document.body.appendChild(host);
  const diagram = { ...(structuredClone(exampleJson(file)) as Diagramish), view: "follow" };
  players.push(draw("mountDiagram")(host, diagram));
  const svg = host.querySelector<SVGSVGElement>('svg[data-dragon="figure"]');
  expect(svg?.getAttribute("data-view"), `${file} を寄って追う見せ方で描けない`).toBe("follow");
  return svg as SVGSVGElement;
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
    for (const [name, file] of SAMPLES) {
      for (const width of WIDTHS) {
        const { window, overview } = parts(file, width);
        expect(gap(window, overview), `${name} / ${width}px の全体図が窓に重なる`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("overview-side-follows-its-shape", () => {
    for (const [name, file] of SAMPLES) {
      for (const width of WIDTHS) {
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
      }
    }
  });

  it("follow-figure-within-frame-width", () => {
    for (const [name, file] of SAMPLES) {
      for (const width of WIDTHS) {
        const { svg, overview } = parts(file, width);
        const drawn = Number(svg.getAttribute("width"));
        expect(drawn, `${name} / ${width}px の図の幅が枠を超える`).toBeLessThanOrEqual(width);
        expect(overview.x + overview.w, `${name} / ${width}px の全体図が図の幅の外に出る`).toBeLessThanOrEqual(drawn);
        expect(overview.y + overview.h, `${name} / ${width}px の全体図が図の高さの外に出る`).toBeLessThanOrEqual(Number(svg.getAttribute("height")));
      }
    }
  });

  it("overview-shows-viewport-box", () => {
    for (const [name, file] of SAMPLES) {
      for (const width of WIDTHS) {
        const { svg } = parts(file, width);
        expect(svg.querySelectorAll(".dg-mm-vp").length, `${name} / ${width}px の全体図に今見ている所の枠が無い`).toBe(1);
        expect(svg.querySelector(".dg-mm-t")?.textContent, `${name} / ${width}px の全体図の札`).toBe("全体図");
      }
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
