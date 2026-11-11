// @vitest-environment jsdom
/**
 * 編集画面の欄の境目のつまみ (#3612)。
 *
 * 棚と記法の欄の間、記法の欄と図の欄の間に、引いて幅を変えるつまみ (`role="separator"`) を置く。
 * 欄の幅は編集画面の根 (`.pg`) の `--pg-shelf` と `--pg-code` に px で置き、図の欄は残りの幅を取る。
 * 引いた幅は次に編集画面を開いた時も残り、キーボードでは左右の矢印で 16px ずつ動く。
 * 図の欄は 320px、記法の欄は 240px、棚は 180px より狭くならない。
 * 幅 1100px 以下では棚を引き出しに畳むので記法の欄と図の欄の間だけ、幅 760px 以下では縦に積むのでつまみを出さない。
 *
 * jsdom は大きさを測らず、幅の境目 (`matchMedia`) も知らないので、画面の幅を 1 つ決めて両方をそれに合わせる。
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Playground } from "../Playground";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** jsdom は大きさを測らないので、大きさの見張りは何も知らせない物で置き換える */
class QuietObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??= QuietObserver as unknown as typeof ResizeObserver;

/** 試す画面の幅 */
let viewport = 1440;

/** 幅の境目の問い合わせを、試す画面の幅で答える。幅を書かない問い (明暗、動きを減らす) は当たらない */
window.matchMedia = (query: string) => {
  const max = /max-width:\s*(\d+)px/u.exec(query);
  const min = /min-width:\s*(\d+)px/u.exec(query);
  const matches = max ? viewport <= Number(max[1]) : min ? viewport >= Number(min[1]) : false;
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

/** 編集画面の根 (`.pg`) だけが試す画面の幅を持つ。ほかの要素は jsdom のまま 0 */
Object.defineProperty(HTMLElement.prototype, "clientWidth", {
  configurable: true,
  get(this: HTMLElement): number {
    return this.classList.contains("pg") ? viewport : 0;
  },
});

let host: HTMLDivElement;
let mounted: Root | undefined;

const wait = async (ms: number): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

/** 編集画面を開く。開き直す時は前の画面を閉じてから開く */
async function open(width: number): Promise<void> {
  close();
  viewport = width;
  host = document.createElement("div");
  document.body.append(host);
  mounted = createRoot(host);
  act(() => mounted?.render(<Playground lang="ja" theme="light" palette="paper" onBeforeLang={() => undefined} />));
  await wait(50);
}

function close(): void {
  if (!mounted) return;
  act(() => mounted?.unmount());
  mounted = undefined;
  host.remove();
}

const editor = (): HTMLElement => {
  const el = host.querySelector<HTMLElement>(".pg");
  expect(el, "編集画面の根 (.pg) が無い").not.toBeNull();
  return el as HTMLElement;
};

/** 欄の幅 (px)。根に置いた値を読む */
const widthOf = (pane: "shelf" | "code"): number => Number.parseFloat(editor().style.getPropertyValue(`--pg-${pane}`));

const handleOf = (pane: "shelf" | "code"): HTMLElement | null => host.querySelector<HTMLElement>(`[data-playground="split-${pane}"]`);

/** つまみを取る。無い時は落とす */
function handle(pane: "shelf" | "code"): HTMLElement {
  const el = handleOf(pane);
  expect(el, `${pane === "shelf" ? "棚と記法の欄" : "記法の欄と図の欄"}の間につまみ (data-playground="split-${pane}") が無い`).not.toBeNull();
  expect(el?.getAttribute("role"), "つまみが境目の役 (separator) を名乗らない").toBe("separator");
  return el as HTMLElement;
}

const Pointer = typeof PointerEvent === "function" ? PointerEvent : MouseEvent;

/** つまみを掴んで横へ引き、離す */
function drag(pane: "shelf" | "code", by: number): void {
  const grip = handle(pane);
  const from = 500;
  act(() => {
    grip.dispatchEvent(new Pointer("pointerdown", { bubbles: true, cancelable: true, clientX: from, button: 0 }));
  });
  act(() => {
    grip.dispatchEvent(new Pointer("pointermove", { bubbles: true, cancelable: true, clientX: from + by }));
  });
  act(() => {
    grip.dispatchEvent(new Pointer("pointerup", { bubbles: true, cancelable: true, clientX: from + by }));
  });
}

function press(pane: "shelf" | "code", key: "ArrowLeft" | "ArrowRight"): void {
  const grip = handle(pane);
  act(() => {
    grip.focus();
    grip.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }));
  });
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  close();
});

describe("編集画面の欄の境目のつまみ (#3612)", () => {
  it("split-code-drag-widens-code", async () => {
    await open(1440);
    const before = widthOf("code");
    expect(before, "記法の欄の最初の幅").toBe(300);
    drag("code", 200);
    expect(widthOf("code"), "右へ 200px 引いた後の記法の欄の幅").toBe(before + 200);
    expect(handle("code").getAttribute("aria-valuenow"), "つまみが読み上げに渡す幅").toBe(String(before + 200));
  });

  it("split-shelf-drag-widens-shelf", async () => {
    await open(1440);
    const before = widthOf("shelf");
    expect(before, "棚の最初の幅").toBe(240);
    drag("shelf", 100);
    expect(widthOf("shelf"), "右へ 100px 引いた後の棚の幅").toBe(before + 100);
    expect(widthOf("code"), "棚を引いても記法の欄の幅は変わらない").toBe(300);
  });

  it("split-widths-persist", async () => {
    await open(1440);
    drag("code", 200);
    drag("shelf", 100);
    await open(1440);
    expect(widthOf("code"), "開き直した記法の欄の幅").toBe(500);
    expect(widthOf("shelf"), "開き直した棚の幅").toBe(340);
  });

  it("split-arrow-keys-step", async () => {
    await open(1440);
    press("code", "ArrowRight");
    expect(widthOf("code"), "右の矢印で記法の欄が広がる").toBe(316);
    press("code", "ArrowLeft");
    press("code", "ArrowLeft");
    expect(widthOf("code"), "左の矢印で記法の欄が狭まる").toBe(284);
    press("shelf", "ArrowRight");
    expect(widthOf("shelf"), "右の矢印で棚が広がる").toBe(256);
    press("shelf", "ArrowLeft");
    expect(widthOf("shelf"), "左の矢印で棚が狭まる").toBe(240);
  });

  it("split-keeps-minimums", async () => {
    await open(1440);
    drag("code", 5000);
    expect(widthOf("code"), "記法の欄を右の端まで引くと、図の欄に 320px を残して止まる").toBe(1440 - 240 - 320);
    drag("code", -5000);
    expect(widthOf("code"), "記法の欄を左の端まで引くと 240px で止まる").toBe(240);
    drag("shelf", -5000);
    expect(widthOf("shelf"), "棚を左の端まで引くと 180px で止まる").toBe(180);
    drag("shelf", 5000);
    expect(widthOf("shelf"), "棚を右の端まで引くと、図の欄に 320px を残して止まる").toBe(1440 - 240 - 320);
    press("shelf", "ArrowRight");
    expect(widthOf("shelf"), "矢印でも図の欄の 320px を割らない").toBe(1440 - 240 - 320);
  });

  it("split-middle-shows-code-only", async () => {
    await open(900);
    expect(handleOf("shelf"), "棚を引き出しに畳む幅で、棚と記法の欄の間につまみが在る").toBeNull();
    handle("code");
    drag("code", 5000);
    expect(widthOf("code"), "棚を畳んだ幅では、図の欄に 320px を残して止まる").toBe(900 - 320);
  });

  it("split-hidden-when-stacked", async () => {
    await open(700);
    expect(host.querySelectorAll('[role="separator"]').length, "縦に積む幅で出したつまみの数").toBe(0);
  });

  it("split-keeps-panes-in-order", async () => {
    await open(1440);
    const panes = [...editor().querySelectorAll<HTMLElement>(":scope > .pg-shelf, :scope > .pg-code, :scope > .pg-stage")].map((el) => el.className.split(" ")[0]);
    expect(panes, "編集画面の欄の順").toEqual(["pg-shelf", "pg-code", "pg-stage"]);
  });
});
