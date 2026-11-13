// @vitest-environment jsdom
/**
 * 編集画面と書き方の頁で線の描き方を選ぶ (#3643)。
 *
 * 線の描き方は色味と同じく描く時に選ぶ。編集画面は図の上の道具の列で、色味の選び口の隣に線の描き方の選び口を置き、
 * 「定規」と「手描き」の 2 つの釦で選ぶ。手描きを押すと、図を手描きのペンの線で描き直す。書き出した HTML も選んだ線の描き方で描く。
 * 書き方の頁は、書き出しの設定の表に `--line` の行を足し、線の描き方の節に手描きの線で描いた見本の図を載せる。
 *
 * jsdom は画像を描けないので、書き出す入口は代わりの物に替え、渡された描く時の指定を確かめる。
 * 渡した指定で頁を組むことは `packages/dragon/test/pen-line.test.ts` の `cli-export-draws-pen-line` が、同じ組み方 (`export/page.ts` と `export/html.ts`) で確かめる。
 */
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DOCS, SECTIONS } from "../docs/content";
import { Docs } from "../docs/Docs";
import { Playground } from "../Playground";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** 書き出す入口の代わり。HTML の頁は返した字を保存させる */
const capture = vi.hoisted(() => ({
  capturePng: vi.fn(),
  captureSvg: vi.fn(),
  captureGif: vi.fn(),
  captureMp4: vi.fn(),
  captureHtml: vi.fn<(source: string, options?: { line?: string; palette?: string }) => Promise<string>>(),
  captureFilm: vi.fn(),
  canCaptureMp4: vi.fn(() => Promise.resolve(true)),
}));
// 書き出す入口は編集画面が釦を押した時に読むので、件を回す前に代わりの物を置く (`vi.doMock`)
vi.doMock("@cardenelabs/dragon/capture", () => capture);

/** jsdom は大きさを測らないので、大きさの見張りは何も知らせない物で置き換える */
class QuietObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??= QuietObserver as unknown as typeof ResizeObserver;
globalThis.IntersectionObserver ??= QuietObserver as unknown as typeof IntersectionObserver;

/** 幅の境目の問い合わせ。机の幅 (1440px) で答える */
window.matchMedia = (query: string) => {
  const max = /max-width:\s*(\d+)px/u.exec(query);
  const min = /min-width:\s*(\d+)px/u.exec(query);
  const matches = max ? 1440 <= Number(max[1]) : min ? 1440 >= Number(min[1]) : false;
  return {
    matches,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  };
};

/** 手描きの線では `path` に描き替える形の要素 */
const SHAPES = "rect, circle, ellipse, line, polygon, polyline";
/** 形を描かず、切り抜きや模様の定義だけを持つ置き場 */
const DEFINITIONS = "defs, clipPath, mask, pattern, symbol, marker";
/** 手描きの線でも描き替えない、絵柄の線と図の地の枠と、置いた後に再生の部品が足す重なりの囲み */
const KEPT = ["dg-gl", "dg-try-ng", "dg-env-in", "dg-done-ck", "dg-tree-cg", "dg-tm-pgl", "dg-tm-pcg", "dg-lb-glyph", "dg-bg", "dg-spot"];

/** 図の中で、定規の線のまま残った形。手描きの線で描いた図では 0 になる */
const ruled = (svg: Element): Element[] =>
  [...svg.querySelectorAll(SHAPES)].filter((e) => !e.closest(DEFINITIONS) && !KEPT.some((name) => e.classList.contains(name)));
/** 図の中で、揺れた線 (曲線の命令を持つ `path`) */
const wobbly = (svg: Element): Element[] => [...svg.querySelectorAll("path")].filter((e) => !e.closest(DEFINITIONS) && /C/u.test(e.getAttribute("d") ?? ""));

let host: HTMLDivElement;
let mounted: Root | undefined;

const wait = async (ms: number): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

/** `ready` が真になるまで 20ms ごとに待つ。混んだ機械を見込み、1 件の上限 (10 秒) の内の 6 秒まで待つ */
async function until(ready: () => boolean): Promise<void> {
  for (let i = 0; i < 300 && !ready(); i++) await wait(20);
}

function place(view: ReactElement): void {
  host = document.createElement("div");
  document.body.append(host);
  mounted = createRoot(host);
  act(() => mounted?.render(view));
}

const figure = (): SVGSVGElement | null => host.querySelector<SVGSVGElement>('[data-playground="figure"] svg[data-dragon="figure"]');

/** 編集画面を開き、図を置き終えるまで待つ */
async function openEditor(): Promise<SVGSVGElement> {
  place(<Playground lang="ja" theme="light" palette="paper" onBeforeLang={() => undefined} />);
  await until(() => figure() !== null);
  const svg = figure();
  expect(svg, "編集画面に図を置かない").not.toBeNull();
  return svg as SVGSVGElement;
}

function close(): void {
  if (!mounted) return;
  act(() => mounted?.unmount());
  mounted = undefined;
  host.remove();
}

async function press(button: Element | null | undefined): Promise<void> {
  expect(button, "押す釦が無い").toBeTruthy();
  act(() => (button as HTMLElement).click());
  await wait(10);
}

/** 色味の選び口の隣に在る、線の描き方の選び口 */
function linePicker(): HTMLElement {
  const swatches = host.querySelector<HTMLElement>('[data-playground="stage"] .pg-swatches');
  expect(swatches, "図の上の道具の列に色味の選び口 (.pg-swatches) が無い").not.toBeNull();
  const next = swatches?.nextElementSibling as HTMLElement | null;
  expect({ name: next?.getAttribute("data-playground"), role: next?.getAttribute("role"), label: next?.getAttribute("aria-label") }, "色味の選び口の隣").toEqual({
    name: "line-style",
    role: "group",
    label: "線の描き方",
  });
  return next as HTMLElement;
}

/** 線の描き方の釦。並びの順に、名札と読み上げの名前と押された印を返す */
const lineChoices = (picker: HTMLElement): { name: string | null; label: string | null; pressed: string | null }[] =>
  [...picker.querySelectorAll("button")].map((b) => ({ name: b.getAttribute("data-playground"), label: b.getAttribute("aria-label"), pressed: b.getAttribute("aria-pressed") }));

beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = (): string => "blob:dragon-test/0";
  URL.revokeObjectURL = () => undefined;
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  capture.captureHtml.mockReset();
});

afterEach(() => {
  close();
  vi.restoreAllMocks();
});

describe("編集画面で線の描き方を選ぶ (#3643)", () => {
  it("stage-picks-pen-line", async () => {
    const before = await openEditor();
    const picker = linePicker();
    expect(lineChoices(picker), "線の描き方の釦").toEqual([
      { name: "line-ruler", label: "定規", pressed: "true" },
      { name: "line-pen", label: "手描き", pressed: "false" },
    ]);
    expect(ruled(before).length, "選ぶ前の図が定規の線で描かれていない").toBeGreaterThan(0);
    await press(picker.querySelector('[data-playground="line-pen"]'));
    await until(() => {
      const svg = figure();
      return svg !== null && ruled(svg).length === 0;
    });
    const after = figure();
    expect(after, "手描きを押した後に図が無い").not.toBeNull();
    expect(lineChoices(linePicker()).map((c) => c.pressed), "手描きを押した後の押された印").toEqual(["false", "true"]);
    expect(
      ruled(after as SVGSVGElement).map((e) => `${e.tagName}.${e.getAttribute("class") ?? ""}`),
      "手描きを押した後も定規の線のまま残った形",
    ).toEqual([]);
    expect(wobbly(after as SVGSVGElement).length, "手描きを押した後の図に揺れた線が無い").toBeGreaterThan(0);
  });

  it("export-menu-keeps-pen-line", async () => {
    await openEditor();
    await press(linePicker().querySelector('[data-playground="line-pen"]'));
    capture.captureHtml.mockReturnValue(Promise.resolve("<!doctype html><title>図</title>"));
    await press(host.querySelector('[data-playground="export-figure"]'));
    const html = [...host.querySelectorAll<HTMLElement>('[data-playground="export-menu"] [role="menuitem"]')].find((item) => item.textContent?.trim() === "HTML");
    await press(html);
    expect(capture.captureHtml, "HTML を選んでも書き出す入口の関数を呼ばない").toHaveBeenCalledTimes(1);
    expect(capture.captureHtml.mock.calls[0]?.[1]?.line, "手描きを選んで書き出した HTML の線の描き方").toBe("pen");
  });
});

describe("書き方の頁の線の描き方 (#3643)", () => {
  it("docs-show-line-style", async () => {
    const sections = SECTIONS as readonly string[];
    expect(sections, "書き方の頁に線の描き方の節 (line) が無い").toContain("line");
    for (const lang of ["ja", "en"] as const) {
      // 書き出しの設定の表の `--line` の行
      const rows = DOCS[lang].options.rows("`paper`", "paper");
      const row = rows.find(([option]) => option.startsWith("--line "));
      expect(row?.[0], `${lang} の書き出しの設定の表に --line の行が無い`).toBe(lang === "ja" ? "--line <名前>" : "--line <name>");
      for (const word of ["`ruler`", "`pen`"]) expect(row?.[1] ?? "", `${lang} の --line の行に ${word} が無い`).toContain(word);
    }
    // 線の描き方の節は、見本の図を手描きの線で描く
    place(<Docs lang="ja" theme="light" palette="paper" />);
    const lineFigure = (): SVGSVGElement | null => host.querySelector<SVGSVGElement>('section#line [data-docs="example"] svg[data-dragon="figure"]');
    await until(() => lineFigure() !== null);
    const section = host.querySelector("section#line");
    expect(section, "書き方の頁に線の描き方の節 (section#line) が無い").not.toBeNull();
    expect(section?.querySelector("h2")?.textContent, "線の描き方の節の見出し").toBe("線の描き方");
    const svg = lineFigure();
    expect(svg, "線の描き方の節に見本の図が無い").not.toBeNull();
    expect(
      ruled(svg as SVGSVGElement).map((e) => `${e.tagName}.${e.getAttribute("class") ?? ""}`),
      "線の描き方の節の見本の図で定規の線のまま残った形",
    ).toEqual([]);
    expect(wobbly(svg as SVGSVGElement).length, "線の描き方の節の見本の図に揺れた線が無い").toBeGreaterThan(0);
  });
});
