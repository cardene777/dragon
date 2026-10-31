// @vitest-environment jsdom
/**
 * 寄って追う図の値の表を、窓と全体図の下に置く (#3270)。
 *
 * 表は図の一番下に在り、窓は動く物を追うので、値が変わる段でも表が窓に入らなかった。
 * 窓より広い表は最後の段でも右側が窓の外に出て、OAuth の見本は画面の幅 1280px でも最後の欄を読めなかった。
 * 全体図を窓の外へ出した (#3042) のと同じ理由で、表も窓の外に置き、窓は表を除いた図の中だけを動く。
 * 位置は SVG の値から読む。jsdom は配置を測れないが、表と窓は図の座標でそのまま書かれている。
 */
import { afterEach, describe, expect, it } from "vitest";
import { exampleJson } from "./diagram-support";
import { type Diagramish, place, releasePlaced } from "./follow-support";
import { draw, type Player, type Rect } from "./render-support";

/** 表を持つ見本。原本の `strip` を持つ物を全て挙げる */
const WITH_STRIP = ["oauth", "payment", "ccip", "finality", "withdraw", "merkle", "order", "rebase", "merge"] as const;
/** 携帯の幅と、幅 1024px と 1280px の画面の見本の枠の幅 */
const FRAMES = [321, 565, 778] as const;
/** 編集画面の幅 390px (携帯) と 860px (記法と並べた時) の、図の枠の幅 */
const WIDTHS = [390, 560] as const;
/** 表の内側の左の余白 (`LOOK.strip.pad`) */
const PAD = 12;
/** 欄が 1 行に収まる枠の幅 */
const ROOMY = 1200;

/**
 * 表を持たない見本の、窓の幅と高さと図の幅と高さ。`faff7039` の時の値で、枠の幅ごとに `[窓の幅, 窓の高さ, 図の幅, 図の高さ]` を並べる。
 * 表を持たない図の窓は、この課題で変えない
 */
const NO_STRIP: Record<string, Record<number, [number, number, number, number]>> = {
  api: { 390: [390, 306, 390, 457], 560: [440, 306, 440, 465] },
  auction: { 390: [390, 320, 390, 490], 560: [396, 320, 396, 490] },
  retry: { 390: [255.8, 320, 256, 320], 560: [255.8, 320, 379, 320] },
  wallet: { 390: [390, 320, 390, 464], 560: [560, 387, 560, 539] },
};

interface LaidStrip extends Rect {
  fields: { name: string; x: number; y: number; w: number }[];
}

const players: Player[] = [];
let restore: (() => void) | undefined;

afterEach(() => {
  for (const player of players.splice(0)) player.destroy();
  restore?.();
  restore = undefined;
  releasePlaced();
});

/** 図の中の四角の位置と大きさを、書かれた値から読む */
function rectOf(root: ParentNode, selector: string): Rect {
  const el = root.querySelector(selector);
  expect(el, `${selector} が図に無い`).not.toBeNull();
  const n = (attr: string): number => Number(el?.getAttribute(attr));
  return { x: n("x"), y: n("y"), w: n("width"), h: n("height") };
}

/** 図の座標で描かれた欄の名前。`x` と `y` は字の左端と基準線 */
function fieldNames(root: ParentNode): { name: string; x: number; y: number }[] {
  return [...root.querySelectorAll(".dg-fl")].map((el) => ({ name: el.textContent ?? "", x: Number(el.getAttribute("x")), y: Number(el.getAttribute("y")) }));
}

const stripOf = (layout: unknown): LaidStrip => {
  const strip = (layout as { strip?: LaidStrip }).strip;
  expect(strip, "図の配置に表が無い").toBeDefined();
  return strip as LaidStrip;
};

/** 枠の幅と見える高さを決めて、高さに収める寄って追う図を置く */
function mountFitted(file: string, width: number, height: number): SVGSVGElement {
  const proto = HTMLElement.prototype;
  Object.defineProperty(proto, "clientHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return this.classList.contains("dg-frame") ? height : 0;
    },
  });
  restore = () => {
    delete (proto as { clientHeight?: number }).clientHeight;
  };
  const host = document.createElement("div");
  Object.defineProperty(host, "clientWidth", { value: width });
  document.body.appendChild(host);
  const diagram = { ...(structuredClone(exampleJson(file)) as Diagramish), view: "follow" };
  players.push(draw("mountDiagram")(host, diagram, { fitHeight: true }));
  const svg = host.querySelector<SVGSVGElement>('svg[data-dragon="figure"]');
  expect(svg, `${file} を描けない`).not.toBeNull();
  return svg as SVGSVGElement;
}

describe("寄って追う図の値の表を窓の外に置く (#3270)", () => {
  it("follow-strip-whole-in-figure", () => {
    const out: string[] = [];
    for (const name of WITH_STRIP) {
      for (const width of FRAMES) {
        const placed = place(name, `${name}.json`, width);
        const label = `${name} / 枠の幅 ${width}px`;
        const figureWidth = Number(placed.figure.getAttribute("width"));
        const table = rectOf(placed.figure, ".dg-strip");
        if (table.x < 0 || table.x + table.w > figureWidth) out.push(`${label} の表が図の幅 ${figureWidth}px から外れる (${table.x} から ${table.x + table.w})`);
        const laid = stripOf(placed.layout).fields;
        const drawn = fieldNames(placed.figure);
        expect(drawn.length, `${label} の欄の数が配置と違う`).toBe(laid.length);
        for (const field of drawn) {
          const w = laid.find((f) => f.name === field.name)?.w ?? Number.POSITIVE_INFINITY;
          if (field.x < table.x || field.x + w > table.x + table.w) out.push(`${label} の欄 ${field.name} が表の横から外れる`);
          if (field.y < table.y || field.y > table.y + table.h) out.push(`${label} の欄 ${field.name} が表の縦から外れる`);
        }
      }
    }
    expect(out, "表か欄が図の幅の外に在る").toEqual([]);
  });

  it("follow-strip-below-window", () => {
    for (const name of ["oauth", "ccip"]) {
      for (const width of WIDTHS) {
        const { figure } = place(name, `${name}.json`, width);
        const label = `${name} / 枠の幅 ${width}px`;
        expect(figure.querySelector('g[clip-path^="url(#dg-vp-"] .dg-strip'), `${label} の表が窓の中身と一緒に動く`).toBeNull();
        const table = rectOf(figure, ".dg-strip");
        const win = rectOf(figure, ".dg-vp-frame");
        expect(table.y, `${label} の表が窓に重なる`).toBeGreaterThanOrEqual(win.y + win.h);
        if (figure.querySelector(".dg-mm-bg")) {
          const overview = rectOf(figure, ".dg-mm-bg");
          expect(table.y, `${label} の表が全体図に重なる`).toBeGreaterThanOrEqual(overview.y + overview.h);
        }
      }
    }
  });

  it("follow-window-stops-above-strip", () => {
    const out: string[] = [];
    for (const name of WITH_STRIP) {
      for (const width of FRAMES) {
        const placed = place(name, `${name}.json`, width);
        const bottom = stripOf(placed.layout).y;
        for (let s = 0; s < placed.steps; s++) {
          const win = placed.windowAt(s);
          if (win.y + win.h > bottom + 0.01) out.push(`${name} / 枠の幅 ${width}px / 段 ${s + 1} の窓が表の無い図の下端 ${bottom} を超える (${win.y + win.h})`);
        }
        // 全体図は、窓が動く範囲だけを映す
        if (placed.figure.querySelector(".dg-mm-world")) {
          const world = rectOf(placed.figure, ".dg-mm-world");
          if (Math.abs(world.h / world.w - bottom / placed.layout.width) > 0.01) out.push(`${name} / 枠の幅 ${width}px の全体図が表の無い図の比でない`);
        }
      }
    }
    expect(out, "窓か全体図が表の在った所まで映す").toEqual([]);
  });

  it("follow-strip-fits-height", () => {
    const cases = [
      ["oauth", 560, 500],
      ["ccip", 560, 700],
      ["ccip", 390, 800],
    ] as const;
    for (const [name, width, height] of cases) {
      const svg = mountFitted(`${name}.json`, width, height);
      const label = `${name} / 枠 ${width} × ${height}px`;
      const table = rectOf(svg, ".dg-strip");
      expect(Number(svg.getAttribute("height")), `${label} の図が見える高さを超える`).toBeLessThanOrEqual(height);
      expect(table.y + table.h, `${label} の表が見える高さの外に出る`).toBeLessThanOrEqual(height);
    }
  });

  it("follow-strip-wraps-by-width", () => {
    const roomy = place("oauth", "oauth.json", ROOMY).figure;
    const inOneRow = fieldNames(roomy);
    const title = roomy.querySelector(".dg-sh");
    expect(new Set(inOneRow.map((f) => f.y)).size, "広い枠で欄が 1 行に収まらない").toBe(1);
    expect(inOneRow[0]?.x, "広い枠で欄が題の右に並ばない").toBeGreaterThan(Number(title?.getAttribute("x")));

    const narrow = place("oauth", "oauth.json", FRAMES[0]).figure;
    const stacked = fieldNames(narrow);
    const table = rectOf(narrow, ".dg-strip");
    const narrowTitle = narrow.querySelector(".dg-sh");
    expect(new Set(stacked.map((f) => f.y)).size, "狭い枠で欄が折り返さない").toBeGreaterThan(1);
    expect(stacked[0]?.x, "狭い枠で欄が左端から始まらない").toBeCloseTo(table.x + PAD, 0);
    expect(stacked[0]?.y, "狭い枠で欄が題の下に並ばない").toBeGreaterThan(Number(narrowTitle?.getAttribute("y")));
  });

  it("follow-strip-step-badge-on-strip", () => {
    // 枝分かれの図は、表の値だけが変わる段の番号の丸を表の隅に置く
    const source = structuredClone(exampleJson("rebase.json")) as Diagramish;
    const steps = source.steps as Diagramish[];
    steps.push({ title: "値だけ変える", body: "表の値だけが変わる。", events: [{ type: "strip", field: "HEAD", value: "feature" }] });
    const placed = place("rebase", source, FRAMES[1]);
    const last = placed.steps - 1;
    const dot = placed.badgeAt(last);
    const table = rectOf(placed.figure, ".dg-strip");
    expect(dot.x, "番号の丸が表の横から外れる").toBeGreaterThanOrEqual(table.x);
    expect(dot.x, "番号の丸が表の横から外れる").toBeLessThanOrEqual(table.x + table.w);
    expect(dot.y, "番号の丸が表の縦から外れる").toBeGreaterThanOrEqual(table.y);
    expect(dot.y, "番号の丸が表の縦から外れる").toBeLessThanOrEqual(table.y + table.h);
    expect(placed.figure.querySelector(`g[clip-path^="url(#dg-vp-"] g.dg-bd[data-step="${last}"]`), "番号の丸が窓の中身と一緒に動く").toBeNull();
    expect(placed.windowAt(last), "表の値だけが変わる段で窓が動く").toEqual(placed.windowAt(last - 1));
  });

  it("fixed-figure-keeps-strip-in-figure", () => {
    for (const name of WITH_STRIP) {
      const { svg, layout } = draw("renderDiagram")(exampleJson(`${name}.json`));
      const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
      const laid = stripOf(layout);
      const table = rectOf(doc, ".dg-strip");
      // 図の値は小数第 1 位に丸めて書かれる
      expect(table.x, `${name} の止めて見せる図の表の左端が変わった`).toBeCloseTo(laid.x + 0.5, 1);
      expect(table.y, `${name} の止めて見せる図の表の上端が変わった`).toBeCloseTo(laid.y + 0.5, 1);
      expect(table.w, `${name} の止めて見せる図の表の幅が変わった`).toBeCloseTo(laid.w - 1, 1);
      expect(table.h, `${name} の止めて見せる図の表の高さが変わった`).toBeCloseTo(laid.h - 1, 1);
    }
  });

  it("follow-no-strip-window-kept", () => {
    for (const [name, sizes] of Object.entries(NO_STRIP)) {
      for (const width of WIDTHS) {
        const { figure } = place(name, `${name}.json`, width);
        const win = rectOf(figure, 'clipPath[id^="dg-vp-"] rect');
        const size = [win.w, win.h, Number(figure.getAttribute("width")), Number(figure.getAttribute("height"))];
        expect(size, `${name} / 枠の幅 ${width}px の窓か図の大きさが変わった`).toEqual(sizes[width]);
      }
    }
  });
});
