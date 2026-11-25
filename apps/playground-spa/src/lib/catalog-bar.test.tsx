// @vitest-environment jsdom
/**
 * カタログの種類の頁の見本の札の帯 (#3713)。
 *
 * 札の題と今の操作の列 (図とコードのタブ、色味、拡大縮小、拡大) を、図を組み込んだ先と同じ帯に置き換える。
 * 帯の1行目は段の鱗の印と見本の題と、コード、エディタ、コピー、エクスポート、拡大のボタン、2行目は色味の切替と拡大縮小を持つ。
 * 図とコードのタブは帯のコードのボタンが、拡大のボタンは帯の拡大のボタンが受け持つ。
 * 分類の頁を jsdom に描き、後から読む見本が届いた後の札の中身と、ボタンを押した後の中身を読む。
 * jsdom は画像を描けないので、書き出す入口は代わりの物に替える。画像を描くことは書き出す入口の検査が Chromium で確かめる。
 */
import { createFigureHeader } from "@cardenelabs/dragon/header";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { samplesOf } from "../catalog/catalog";
import { CategoryPage } from "../catalog/CategoryPage";
import { exampleInfo, exampleText, LATER_EXAMPLES } from "../examples";
import { toHash } from "../share";
import { PATHS } from "../site/routes";
import { atLoad } from "../../../../packages/dragon/test/at-load";
import { whenReady } from "../site/later";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** 書き出す入口の代わり。札の書き出す窓が押した時に読む */
const capture = vi.hoisted(() => ({
  capturePng: vi.fn(),
  captureSvg: vi.fn(),
  captureGif: vi.fn(),
  captureMp4: vi.fn(),
  captureHtml: vi.fn(),
  captureFilm: vi.fn(),
  canCaptureMp4: vi.fn(() => Promise.resolve(true)),
}));
vi.doMock("@cardenelabs/dragon/capture", () => capture);

/** jsdom は大きさを測らないので、大きさの見張りは何も知らせない物で置き換える */
class QuietObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??= QuietObserver as unknown as typeof ResizeObserver;

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

/** 札を描く分類。頁を開いた時は分類の最初の見本を選ぶ */
const KIND = "sequence";
/** 札に出る見本。分類の見本は後から読む見本が届いてから決まる */
let SAMPLE: ReturnType<typeof samplesOf>[number];

let host: HTMLDivElement;
let mounted: Root | undefined;

// 後から読む塊は file を読み込む段で待つ。前処理で 25 ミリ秒ずつ見て待つと、混んだ機械で 1 件 10 秒の上限を超えた (#3759)
const EXAMPLES_READY = await atLoad("見本帳の後から読む見本の塊を待つ", () => whenReady(LATER_EXAMPLES));

beforeAll(() => {
  EXAMPLES_READY.get();
  const first = samplesOf(KIND)[0];
  expect(first, `${KIND}の分類に見本が無い`).toBeDefined();
  SAMPLE = first!;
});

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  mounted = createRoot(host);
  act(() => mounted?.render(<CategoryPage kind={KIND} lang="ja" theme="light" palette="paper" />));
});

afterEach(() => {
  act(() => mounted?.unmount());
  mounted = undefined;
  host.remove();
});

const card = (): HTMLElement => {
  const el = host.querySelector<HTMLElement>(".catalog-preview-card");
  expect(el, "見本の札が無い").not.toBeNull();
  return el!;
};
/** 帯の操作のボタン。窓を持つ操作は窓を開くボタン */
const action = (name: string): HTMLElement => {
  const el = card().querySelector<HTMLElement>(`[data-dragon-header] .dg-header-actions > [data-action="${name}"]`);
  expect(el, `帯に${name}のボタンが無い`).not.toBeNull();
  return el!.matches("button,a") ? el! : (el!.querySelector<HTMLElement>(":scope > button") ?? el!);
};
const sampleText = (): string => exampleText(SAMPLE, "ja") ?? "";

async function press(el: HTMLElement): Promise<void> {
  await act(async () => {
    el.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/** 図の帯の印が描く面。札の帯の印と比べる */
function barMarkPaths(): string[] {
  const { element } = createFigureHeader(document, { mark: { href: "https://cardene777.github.io/dragon/", label: "dragon" }, styles: false });
  return [...element.querySelectorAll("a.dg-mark svg path")].map((path) => path.getAttribute("d") ?? "");
}

describe("カタログの札の帯 (#3713)", () => {
  // 札は帯を持ち、帯の1行目に段の鱗の印と見本の題と、5つのボタンをこの順に並べる
  it("catalog-card-has-the-bar", () => {
    const row = card().querySelector<HTMLElement>("[data-dragon-header] .dg-header-row");
    expect(row, "札に帯が無い").not.toBeNull();
    const [mark, title, actions] = [...row!.children] as HTMLElement[];
    expect(mark?.matches("a.dg-mark"), "帯の1行目の左端が印でない").toBe(true);
    expect(mark?.textContent?.trim(), "帯の印が字を持つ").toBe("");
    expect([...(mark?.querySelectorAll("svg path") ?? [])].map((path) => path.getAttribute("d"))).toEqual(barMarkPaths());
    expect(title?.matches(".dg-header-title"), "印の右が題でない").toBe(true);
    expect(title?.textContent).toBe(exampleInfo(SAMPLE, "ja")?.title);
    expect(actions?.matches(".dg-header-actions"), "題の右がボタンの並びでない").toBe(true);
    expect([...(actions?.children ?? [])].map((el) => (el as HTMLElement).dataset.action)).toEqual(["code", "editor", "copy", "export", "expand"]);
  });

  // 帯の2行目に色味の切替と拡大縮小を置き、札は図とコードのタブと、帯の外の拡大のボタンを持たない
  it("catalog-bar-holds-theme-and-zoom", () => {
    const settings = card().querySelector<HTMLElement>("[data-dragon-header] .dg-header-settings");
    expect(settings, "帯に2行目が無い").not.toBeNull();
    expect(settings!.querySelector('select[data-catalog="palette"]'), "帯の2行目に色味の切替が無い").not.toBeNull();
    for (const name of ["zoom-out", "zoom-level", "zoom-in", "fit"]) {
      expect(settings!.querySelector(`[data-catalog="${name}"]`), `帯の2行目に拡大縮小の${name}が無い`).not.toBeNull();
    }
    expect(card().querySelector('[role="tablist"]'), "札に図とコードのタブが残る").toBeNull();
    expect(card().querySelector('[data-catalog="expand"]'), "札に帯の外の拡大のボタンが残る").toBeNull();
    expect(card().querySelector(".catalog-preview-head"), "札に帯の外の題が残る").toBeNull();
  });

  // コードのボタンを押すと記法の本文を出し、もう一度押すと図に戻る
  it("catalog-bar-code-toggles-source", async () => {
    const code = action("code");
    const source = (): HTMLElement => card().querySelector<HTMLElement>('[data-catalog="source"]')!;
    const stage = (): HTMLElement => card().querySelector<HTMLElement>('[data-catalog="stage"]')!;
    expect(source().hidden, "押す前から記法が出ている").toBe(true);
    await press(code);
    expect(code.getAttribute("aria-pressed")).toBe("true");
    expect(source().hidden, "押しても記法が出ない").toBe(false);
    expect(stage().hidden, "記法を出しても図が残る").toBe(true);
    expect(card().querySelector('[data-catalog="source-code"]')?.textContent).toBe(sampleText());
    await press(code);
    expect(code.getAttribute("aria-pressed")).toBe("false");
    expect(source().hidden, "もう一度押しても記法が残る").toBe(true);
    expect(stage().hidden, "もう一度押しても図に戻らない").toBe(false);
  });

  // エディタのボタンは、その見本の記法を入れたエディタを開く
  it("catalog-bar-editor-opens-notation", () => {
    const editor = action("editor");
    expect(editor.tagName).toBe("A");
    expect(editor.getAttribute("href")).toBe(`${PATHS.editor}${toHash(sampleText())}`);
  });

  // コピーのボタンで、その見本の記法をクリップボードに写せる
  it("catalog-bar-copies-notation", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const toggle = action("copy");
    await press(toggle);
    expect(toggle.getAttribute("aria-expanded"), "コピーの窓が開かない").toBe("true");
    const item = card().querySelector<HTMLElement>('[data-menu="copy"] [data-copy="source"]');
    expect(item, "コピーの窓に記法が無い").not.toBeNull();
    await press(item!);
    expect(writeText).toHaveBeenCalledWith(sampleText());
  });

  // エクスポートのボタンを押すと、書き出す形を選ぶ窓を開く
  it("catalog-bar-export-opens-menu", async () => {
    const toggle = action("export");
    await press(toggle);
    expect(toggle.getAttribute("aria-expanded"), "エクスポートの窓が開かない").toBe("true");
    const formats = [...document.querySelectorAll<HTMLElement>('[role="menu"] [data-format]')].map((el) => el.dataset.format);
    for (const format of ["png", "svg", "gif", "html"]) expect(formats, `エクスポートの窓に${format}が無い`).toContain(format);
  });

  // 拡大のボタンを押すと、今の拡大の重ね窓を開く
  it("catalog-bar-fullscreen-opens-overlay", async () => {
    expect(host.querySelector('[data-catalog="overlay"]'), "押す前から重ね窓が開いている").toBeNull();
    await press(action("expand"));
    expect(host.querySelector('[data-catalog="overlay"]'), "押しても重ね窓が開かない").not.toBeNull();
    expect(host.querySelector('[data-catalog="overlay-title"]')?.textContent).toBe(exampleInfo(SAMPLE, "ja")?.title);
  });
});

describe("判定の表の札の書き出し (#3937)", () => {
  /** 判定の表の分類の頁を描き、札に判定の表が届くまで待つ */
  async function openJudge(): Promise<HTMLElement> {
    act(() => mounted?.render(<CategoryPage kind="judge" lang="ja" theme="light" palette="paper" />));
    const table = (): HTMLElement | null => card().querySelector<HTMLElement>('[data-dragon="judge"]');
    // 判定の表の部品の塊が届くまで待つ。1 件の上限 (10 秒) の内の 6 秒まで待つ
    for (let i = 0; i < 300 && !table(); i++) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
    }
    expect(table(), "判定の表の札に表が無い").not.toBeNull();
    return table() as HTMLElement;
  }

  /** 書き出す入口に渡した物が、例を帯に置いた幅 728px 以下の判定の表の SVG か (#3891) */
  function expectBandPicture(given: unknown, table: HTMLElement, what: string): void {
    const el = given as Element | undefined;
    expect(el, `${what}に頁の表の要素を渡した`).not.toBe(table);
    expect([el?.namespaceURI, el?.localName, el?.getAttribute("data-dragon")], `${what}に渡した要素`).toEqual(["http://www.w3.org/2000/svg", "svg", "judge"]);
    expect(el?.querySelectorAll('[data-dragon="judge-band"]').length ?? 0, `${what}に渡した SVG の例の帯`).toBeGreaterThan(0);
    expect(Number(el?.getAttribute("width") ?? "Infinity"), `${what}に渡した SVG の幅`).toBeLessThanOrEqual(728);
  }

  // 判定の表の札で書き出す窓の PNG を押すと、書き出す入口に帯の形の表の SVG を渡す
  it("catalog-export-judge-passes-band-picture", async () => {
    const table = await openJudge();
    capture.capturePng.mockReset();
    capture.capturePng.mockResolvedValue(new Blob(["png"], { type: "image/png" }));
    await press(action("export"));
    const png = document.querySelector<HTMLElement>('[role="menu"] [data-format="png"]');
    expect(png, "エクスポートの窓に png が無い").not.toBeNull();
    if (png) await press(png);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(capture.capturePng, "PNG を押しても書き出す入口の関数を呼ばない").toHaveBeenCalledTimes(1);
    expectBandPicture(capture.capturePng.mock.calls[0]?.[0], table, "PNG の書き出し");
  });

  // 判定の表の札で画像をコピーすると、帯の形の表の SVG から撮った PNG をコピーする
  it("catalog-copy-judge-passes-band-picture", async () => {
    const table = await openJudge();
    const write = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", { value: { write, writeText: vi.fn(() => Promise.resolve()) }, configurable: true });
    (globalThis as { ClipboardItem?: unknown }).ClipboardItem ??= class {
      constructor(readonly items: Record<string, unknown>) {}
    };
    capture.capturePng.mockReset();
    capture.capturePng.mockResolvedValue(new Blob(["png"], { type: "image/png" }));
    await press(action("copy"));
    const image = card().querySelector<HTMLElement>('[data-menu="copy"] [data-copy="image"]');
    expect(image, "コピーの窓に画像が無い").not.toBeNull();
    if (image) await press(image);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(capture.capturePng, "画像のコピーで書き出す入口の関数を呼ばない").toHaveBeenCalledTimes(1);
    expectBandPicture(capture.capturePng.mock.calls[0]?.[0], table, "画像のコピー");
    expect(write, "画像をクリップボードに書かない").toHaveBeenCalledTimes(1);
  });
});
