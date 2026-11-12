// @vitest-environment jsdom
/**
 * 編集画面の図を書き出す釦と窓 (#3644)。
 *
 * 図の上の道具の列の右端に「書き出す」の釦を置き、押すと PNG、SVG、GIF、MP4、HTML を選ぶ小さな窓を開く。Esc で閉じる。
 * 形を選ぶと、書き出す入口 (`@cardenelabs/dragon/capture`) の関数に今の図の SVG を渡し、返った物を書類名の file に保存させる。
 * HTML は図の SVG でなく今の記法を渡し、返った頁の文字列を保存させる (#3667)。
 * 書き出している間は同じ釦を押せない。図の下の `dragon export` の案内は残す。
 *
 * jsdom は画像を描けないので、書き出す入口は代わりの物に替え、渡された物と保存させた file を確かめる。
 * 画像を描くことは書き出す入口の検査 (`packages/dragon/test/capture.test.ts`) が Chromium で確かめる。
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { parseNotation } from "@cardenelabs/dragon";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Playground } from "../Playground";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** 書き出す入口の代わり。関数ごとに、呼ばれた時に返す約束を件が差し替える */
const capture = vi.hoisted(() => ({
  capturePng: vi.fn<(svg: SVGSVGElement) => Promise<Blob>>(),
  captureSvg: vi.fn<(svg: SVGSVGElement) => Promise<string>>(),
  captureGif: vi.fn<(svg: SVGSVGElement) => Promise<Blob>>(),
  captureMp4: vi.fn<(svg: SVGSVGElement) => Promise<Blob>>(),
  captureHtml: vi.fn<(source: string) => Promise<string>>(),
  captureFilm: vi.fn(),
  canCaptureMp4: vi.fn(() => Promise.resolve(true)),
}));
// 書き出す入口は編集画面が釦を押した時に読むので、件を回す前に代わりの物を置く。
// 置く時は入口の場所を解かず、編集画面が読む時に初めて解く (`vi.doMock`)
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

let host: HTMLDivElement;
let mounted: Root | undefined;

const wait = async (ms: number): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

/** 編集画面を開き、図を置き終えるまで待つ */
async function open(): Promise<SVGSVGElement> {
  host = document.createElement("div");
  document.body.append(host);
  mounted = createRoot(host);
  act(() => mounted?.render(<Playground lang="ja" theme="light" palette="paper" onBeforeLang={() => undefined} />));
  // 図の種類の部品の塊が届くまで待つ。混んだ機械では 2 秒を超えた回があったので、1 件の上限 (10 秒) の内の 6 秒まで待つ
  for (let i = 0; i < 300 && !figure(); i++) await wait(20);
  const svg = figure();
  expect(svg, "編集画面に図を置かない").not.toBeNull();
  return svg as SVGSVGElement;
}

const figure = (): SVGSVGElement | null => host.querySelector<SVGSVGElement>('[data-playground="figure"] svg[data-dragon="figure"]');

function close(): void {
  if (!mounted) return;
  act(() => mounted?.unmount());
  mounted = undefined;
  host.remove();
}

/** 図の上の道具の列の右端の釦。「書き出す」の釦でない時は落とす */
function exportButton(): HTMLButtonElement {
  const bar = host.querySelector<HTMLElement>('[data-playground="stage"] .pg-stage-bar');
  expect(bar, "図の上の道具の列 (.pg-stage-bar) が無い").not.toBeNull();
  const last = bar?.lastElementChild as HTMLElement | null;
  expect({ tag: last?.tagName, name: last?.getAttribute("data-playground"), label: last?.getAttribute("aria-label") }, "道具の列の右端").toEqual({
    tag: "BUTTON",
    name: "export-figure",
    label: "書き出す",
  });
  return last as HTMLButtonElement;
}

const menu = (): HTMLElement | null => host.querySelector<HTMLElement>('[data-playground="export-menu"]');

/** 窓に並んだ形の名前 */
const choices = (): string[] => [...(menu()?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])].map((item) => item.textContent?.trim() ?? "");

async function press(button: HTMLElement): Promise<void> {
  act(() => button.click());
  await wait(10);
}

/** 窓から形を選ぶ */
async function choose(format: string): Promise<void> {
  const item = [...(menu()?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])].find((el) => el.textContent?.trim() === format);
  expect(item, `書き出す窓に ${format} が無い`).toBeDefined();
  if (item) await press(item);
}

/** 頼んだ時に解ける約束 */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

/** 保存させた file。保存の印 (`<a download>`) を押した回ごとに、file の名前と中身を残す */
let saved: { name: string; blob: Blob | undefined }[] = [];
const blobs = new Map<string, Blob>();

beforeEach(() => {
  localStorage.clear();
  saved = [];
  blobs.clear();
  let n = 0;
  URL.createObjectURL = (blob: Blob | MediaSource): string => {
    const url = `blob:dragon-test/${n++}`;
    blobs.set(url, blob as Blob);
    return url;
  };
  URL.revokeObjectURL = () => undefined;
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    saved.push({ name: this.download, blob: blobs.get(this.href) });
  });
  for (const fn of [capture.capturePng, capture.captureSvg, capture.captureGif, capture.captureMp4, capture.captureHtml]) fn.mockReset();
});

afterEach(() => {
  close();
  vi.restoreAllMocks();
});

describe("編集画面の図を書き出す (#3644)", () => {
  it("editor-export-menu-lists-formats", async () => {
    await open();
    const button = exportButton();
    expect(button.classList.contains("pg-tool"), "書き出すの釦がほかの道具の釦と同じ形 (pg-tool) でない").toBe(true);
    expect(menu(), "押す前から書き出す窓が開いている").toBeNull();
    await press(button);
    expect(menu(), "書き出すの釦を押しても窓が開かない").not.toBeNull();
    expect(menu()?.getAttribute("role"), "書き出す窓の役").toBe("menu");
    expect(button.getAttribute("aria-expanded"), "窓を開いた釦の印").toBe("true");
    expect(choices(), "書き出す窓に並ぶ形").toEqual(["PNG", "SVG", "GIF", "MP4", "HTML"]);
    act(() => {
      document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    });
    await wait(10);
    expect(menu(), "Esc で書き出す窓が閉じない").toBeNull();
    expect(button.getAttribute("aria-expanded"), "窓を閉じた釦の印").toBe("false");
  });

  it("editor-export-saves-chosen-format", async () => {
    const svg = await open();
    const hint = host.querySelector(".pg-hint code")?.textContent ?? "";
    const name = hint.replace(/^dragon export /u, "").replace(/\.dragon$/u, "");
    expect(name, "図の下の案内から書類名を読めない").not.toBe("");
    const cases = [
      { format: "PNG", fn: capture.capturePng, made: new Blob(["png"], { type: "image/png" }), ext: "png" },
      { format: "SVG", fn: capture.captureSvg, made: "<svg></svg>", ext: "svg" },
      { format: "GIF", fn: capture.captureGif, made: new Blob(["gif"], { type: "image/gif" }), ext: "gif" },
      { format: "MP4", fn: capture.captureMp4, made: new Blob(["mp4"], { type: "video/mp4" }), ext: "mp4" },
      { format: "HTML", fn: capture.captureHtml, made: "<!doctype html><title>図</title>", ext: "html" },
    ] as const;
    for (const { format, fn, made, ext } of cases) {
      const pending = deferred<Blob | string>();
      (fn as unknown as { mockReturnValue(value: Promise<Blob | string>): void }).mockReturnValue(pending.promise);
      const before = saved.length;
      await press(exportButton());
      await choose(format);
      expect(fn, `${format} を選んでも書き出す入口の関数を呼ばない`).toHaveBeenCalledTimes(1);
      const given = fn.mock.calls[0]?.[0];
      if (format === "HTML") {
        // HTML の頁は図を描き直すので、図の SVG でなく今の記法を渡す。渡した記法は読める記法で、題を持つ
        const read = typeof given === "string" ? parseNotation(given) : undefined;
        expect(read?.ok, "HTML の書き出しに今の記法を渡さない").toBe(true);
        expect(read?.ok ? read.diagram.title : "", "HTML の書き出しに渡した記法の題").not.toBe("");
      } else {
        expect(given, `${format} の書き出しに今の図の SVG を渡さない`).toBe(svg);
      }
      expect(exportButton().disabled, `${format} を書き出している間に書き出すの釦を押せる`).toBe(true);
      expect(saved.length, `${format} を書き出し終える前に保存させた`).toBe(before);
      await act(async () => {
        pending.resolve(made);
        await pending.promise;
      });
      await wait(10);
      const file = saved[before];
      expect(file?.name, `${format} を保存させた file の名前`).toBe(`${name}.${ext}`);
      if (typeof made === "string") {
        const type = format === "HTML" ? "text/html" : "image/svg+xml";
        expect({ type: file?.blob?.type, text: await file?.blob?.text() }, `${format} を保存させた中身`).toEqual({ type, text: made });
      } else {
        expect(file?.blob, `${format} を保存させた中身が書き出す入口の返した Blob でない`).toBe(made);
      }
      expect(exportButton().disabled, `${format} を書き出し終えても書き出すの釦を押せない`).toBe(false);
      fn.mockReset();
    }
  });

  it("editor-export-keeps-cli-hint", async () => {
    await open();
    const hint = host.querySelector(".pg-hint");
    expect(hint?.textContent ?? "", "図の下の書き出しの案内").toContain("同じ図を書き出す");
    expect(hint?.querySelector("code")?.textContent ?? "", "案内の命令").toMatch(/^dragon export \S+\.dragon$/u);
  });
});
