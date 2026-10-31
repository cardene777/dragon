// @vitest-environment jsdom
/**
 * 図を、図の枠の中で見える高さに収める (#3047)。
 *
 * 寄って追う窓の高さは枠の幅から決まり (幅の 0.75 倍、320px 以上、図の高さ以下)、横長の全体図は窓の下に出る。
 * 高さが決まった置き場 (カタログの拡大の重ね窓) では、その高さを超えると窓の下と全体図が隠れる。
 * 再生の部品に高さに収めるよう頼んだ時 (`fitHeight`) だけ、枠の中で見える高さに窓と全体図を収め、
 * 高さに収めると字が読めなくなる図は寄って追う図にする。
 * jsdom は配置を測れないため、枠の幅は置き場の幅を、枠の高さは枠の `clientHeight` を差し替える。
 */
import { afterEach, describe, expect, it } from "vitest";
import { exampleJson, exampleSource, type Json } from "./diagram-support";
import { draw, type Player } from "./render-support";

type Diagramish = { [key: string]: Json };
type View = "fixed" | "follow";

/** 時系列図は縦長の全体図を窓の右に、構成図は横長の全体図を窓の下に持つ見本 */
const SAMPLES = [
  ["oauth", "oauth.json"],
  ["ccip", "ccip.json"],
] as const;
/** 携帯の幅と、記法と並べた編集画面の図の枠の幅 */
const WIDTHS = [390, 560] as const;
/**
 * 全体図を出す見本と枠の幅。縦長の全体図は枠の幅が 440px より狭いと出さない (#3055) ので、oauth は 560px だけで見る。
 * 横長の全体図は表を持たない図ならどの幅でも出す。表を持つ図は狭い枠で全体図を出さない (#3274) ので、ccip は表を外して 390px で、表を持ったまま 560px で見る
 */
const CASES = [
  ["oauth", "oauth.json", 560],
  ["ccip", "ccip.json#bare", 390],
  ["ccip", "ccip.json", 560],
] as const;
/** 縦長の全体図を出さない、携帯の幅の枠 (#3055) */
const NARROW = [360, 390, 430] as const;
/** 見本ごとの、枠の中で見える高さ。どちらも今の寄って追う図より低く、窓の下限 (160px) と全体図と窓の下の値の表が入る (#3270) */
const HEIGHTS = { oauth: [340, 400], ccip: [560, 640] } as const;
/** 今の寄って追う図の窓より高い、枠の中で見える高さ。ccip は 700px で全体図の下までが枠いっぱいになり、900px で図の高さで止まる */
const TALL = [700, 900] as const;
/** 窓と、窓の下に置いた全体図の間 */
const INSET = 12;
/** 幅 1440px の画面の重ね窓の図の枠。oauth は高さに収めると箱の名前の字が読めず、ccip は読める */
const WIDE = { width: 1200, height: 675 } as const;

const players: Player[] = [];
let restore: (() => void) | undefined;
/** 置いた図と、差し替えた枠の高さを片付ける。1 つの検査の中で枠の大きさを替えるたびにも呼ぶ */
function reset(): void {
  for (const player of players.splice(0)) player.destroy();
  restore?.();
  restore = undefined;
  document.body.innerHTML = "";
}
afterEach(reset);

/** 図の枠 (`.dg-frame`) の `clientHeight` だけを `height` にする。ほかの要素は 0 のまま */
function stubFrameHeight(height: number): void {
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
}

/** 枠の幅を `width`、枠の高さを `height` にして図を置く。`view` を渡すと書き手が見せ方を決めた図にする */
function mount(file: string, frame: { width: number; height: number }, options: { fitHeight?: boolean; view?: View } = {}): SVGSVGElement {
  stubFrameHeight(frame.height);
  const host = document.createElement("div");
  Object.defineProperty(host, "clientWidth", { value: frame.width });
  document.body.appendChild(host);
  const source = structuredClone(exampleSource(file)) as Diagramish;
  const diagram = options.view ? { ...source, view: options.view } : source;
  players.push(draw("mountDiagram")(host, diagram, options.fitHeight === undefined ? {} : { fitHeight: options.fitHeight }));
  const svg = host.querySelector<SVGSVGElement>('svg[data-dragon="figure"]');
  expect(svg, `${file} を描けない`).not.toBeNull();
  return svg as SVGSVGElement;
}

const attr = (svg: SVGSVGElement, selector: string, name: string): number => Number(svg.querySelector(selector)?.getAttribute(name) ?? Number.NaN);
const viewOf = (svg: SVGSVGElement): string | null => svg.getAttribute("data-view");

describe("寄って追う図を枠の中で見える高さに収める (#3047)", () => {
  it("follow-figure-fits-frame-height", () => {
    for (const [name, file, width] of CASES) {
      for (const height of HEIGHTS[name]) {
        const svg = mount(file, { width, height }, { fitHeight: true, view: "follow" });
        const label = `${name} / 枠 ${width} × ${height}px`;
        expect(viewOf(svg), `${label} が寄って追う図にならない`).toBe("follow");
        expect(Number(svg.getAttribute("height")), `${label} の図が見える高さを超える`).toBeLessThanOrEqual(height);
        expect(attr(svg, ".dg-mm-bg", "y") + attr(svg, ".dg-mm-bg", "height"), `${label} の全体図が見える高さの外に出る`).toBeLessThanOrEqual(height);
        expect(Number(svg.getAttribute("width")), `${label} の図の幅が枠を超える`).toBeLessThanOrEqual(width);
        reset();
      }
    }
  });

  it("follow-window-grows-to-frame-height", () => {
    // 窓の高さは枠が低い時に縮むだけで、枠が高い時は幅から決めた高さで止まり、枠の下が空いていた (#3053)
    for (const [name, file, width] of CASES) {
      // 窓が見るのは、値の表を除いた図の高さ (#3270)
      const { layout } = draw("renderDiagram")(exampleSource(file));
      const worldHeight = (layout as unknown as { strip?: { y: number } }).strip?.y ?? layout.height;
      for (const height of TALL) {
        const label = `${name} / 枠 ${width} × ${height}px`;
        // 高さを頼まない時の窓と全体図が、今の寸法
        const natural = mount(file, { width, height }, { view: "follow" });
        const before = attr(natural, ".dg-vp-frame", "height") + 1;
        const mini = { w: attr(natural, ".dg-mm-bg", "width"), h: attr(natural, ".dg-mm-bg", "height") };
        const beside = attr(natural, ".dg-mm-bg", "y") === 0;
        const table = natural.querySelector(".dg-strip") ? attr(natural, ".dg-strip", "height") + 1 + INSET : 0;
        reset();
        const svg = mount(file, { width, height }, { fitHeight: true, view: "follow" });
        // 窓の右の全体図は窓の高さの中に収まり、窓の下の全体図と値の表はその分だけ窓の高さを減らす
        const expected = Math.min(worldHeight, (beside ? height : height - mini.h - INSET) - table);
        expect(expected, `${label} の枠が今の窓より高くない`).toBeGreaterThan(before);
        expect(attr(svg, ".dg-vp-frame", "height") + 1, `${label} の窓の高さ`).toBeCloseTo(expected, 5);
        expect(attr(svg, ".dg-mm-bg", "width"), `${label} の全体図の幅が今と違う`).toBeCloseTo(mini.w, 5);
        expect(attr(svg, ".dg-mm-bg", "height"), `${label} の全体図の高さが今と違う`).toBeCloseTo(mini.h, 5);
        expect(Number(svg.getAttribute("height")), `${label} の図が見える高さを超える`).toBeLessThanOrEqual(height);
        reset();
      }
    }
  });

  it("narrow-tall-figure-drops-overview", () => {
    // 携帯の幅では縦長の全体図の列が枠の幅の 3 割を取り、窓が図の横の 3 割ほどしか見せなかった (#3055)
    const height = 500;
    for (const width of NARROW) {
      for (const fitHeight of [false, true]) {
        const label = `oauth / 枠の幅 ${width}px${fitHeight ? " / 高さに収める" : ""}`;
        const svg = mount("oauth.json", { width, height }, { fitHeight, view: "follow" });
        expect(svg.querySelectorAll(".dg-mm-bg, .dg-mm-world, .dg-mm-vp, .dg-mm-t").length, `${label} に全体図が在る`).toBe(0);
        expect(attr(svg, ".dg-vp-frame", "width") + 1, `${label} の窓の幅が枠の幅と違う`).toBeCloseTo(width, 5);
        expect(Number(svg.getAttribute("width")), `${label} の図の幅が枠の幅と違う`).toBe(width);
        if (fitHeight) expect(Number(svg.getAttribute("height")), `${label} の図が見える高さを超える`).toBeLessThanOrEqual(height);
        reset();
      }
    }
  });

  it("follow-window-height-from-width", () => {
    for (const [name, file] of SAMPLES) {
      const figureHeight = draw("renderDiagram")(exampleJson(file)).layout.height;
      for (const width of WIDTHS) {
        // 高さを頼まない時は、枠の高さが測れても窓の高さを幅だけから決める
        const svg = mount(file, { width, height: 200 }, { view: "follow" });
        const expected = Math.min(figureHeight, Math.max(320, width * 0.75));
        expect(attr(svg, ".dg-vp-frame", "height") + 1, `${name} / ${width}px の窓の高さ`).toBeCloseTo(expected, 5);
        reset();
      }
    }
  });
});

describe("枠の中で見える高さで見せ方を選ぶ (#3047)", () => {
  it("fit-height-turns-tall-figure-follow", () => {
    const tall = mount("oauth.json", WIDE, { fitHeight: true });
    expect(viewOf(tall), "高さに収めると字が読めない oauth が寄って追う図にならない").toBe("follow");
    expect(Number(tall.getAttribute("height")), "寄って追う図にした oauth が見える高さを超える").toBeLessThanOrEqual(WIDE.height);
    reset();
    const wide = mount("ccip.json", WIDE, { fitHeight: true });
    expect(viewOf(wide), "高さに収めても字が読める ccip が寄って追う図になる").toBe("fixed");
    reset();
    const chosen = mount("oauth.json", WIDE, { fitHeight: true, view: "fixed" });
    expect(viewOf(chosen), "書き手が全体を止めて見せると決めた oauth が寄って追う図になる").toBe("fixed");
  });

  it("view-by-width-without-fit-height", () => {
    const svg = mount("oauth.json", { width: WIDE.width, height: 300 });
    expect(viewOf(svg), "高さを頼まない時に、低い枠の oauth の見せ方が幅で選んだ物と違う").toBe("fixed");
  });
});
