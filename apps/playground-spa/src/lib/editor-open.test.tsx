// @vitest-environment jsdom
/**
 * 帯のエディタのボタンと、見本帳の編集画面が開くURL (#3697)。
 *
 * 帯のエディタのボタンは記法をブラウザの内で縮めてURLの`#z=`に詰め、編集画面は同じ字の記法を書く欄に入れる。
 * 縮めてもURLの上限 (`EDITOR_URL_LIMIT`) を超える記法は、記法をクリップボードに写してから`#paste`の編集画面を開き、
 * 帯の知らせの欄で貼るよう頼む。`#paste`で開いた編集画面は書く欄を空にし、貼るよう出す。
 *
 * 帯は build した`@cardenelabs/dragon/frame`をjsdomの頁に置き、クリップボードと新しいタブは記録する物に置き換える。
 */
import * as dragon from "@cardenelabs/dragon";
import * as frame from "@cardenelabs/dragon/frame";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Playground } from "../Playground";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** jsdom は大きさを測らないので、大きさの見張りは何も知らせない物で置き換える */
class QuietObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??= QuietObserver as unknown as typeof ResizeObserver;
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  addListener: () => undefined,
  removeListener: () => undefined,
  dispatchEvent: () => false,
})) as typeof window.matchMedia;

/** 公開したエディタの置き場 */
const PUBLISHED = "https://cardene777.github.io/dragon/";

/** 縮めて詰める記法。日本語と絵文字 (UTF-8 で 4 byte) を含み、同じ形の段を重ねて縮むようにする */
const SOURCE = [
  "sequence 注文 🐉",
  "box a as あなた 🧾",
  "box b as 店",
  ...Array.from({ length: 12 }, (_, i) => [`step 確認 ${i + 1}`, `  a -> b: 注文を確かめる ✅ ${i + 1}`]).flat(),
].join("\n");

/** 縮めてもURLの上限を超える記法。決まった種から作る字の並びは縮みにくい */
function longSource(): string {
  let seed = 7;
  const next = (): number => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
  const word = (): string => Array.from({ length: 8 }, () => String.fromCharCode(97 + Math.floor(next() * 26))).join("");
  const lines = ["sequence 長い図", "box a as あなた", "box b as 店"];
  for (let i = 0; i < 300; i += 1) lines.push(`step ${word()}`, `  a -> b: ${word()} ${word()} ${word()}`);
  return lines.join("\n");
}

let host: HTMLDivElement | undefined;
let mounted: Root | undefined;

const wait = async (ms: number): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

/** 条件が成り立つまで待つ */
async function until(ready: () => boolean, what: string): Promise<void> {
  for (let i = 0; i < 100 && !ready(); i += 1) await wait(30);
  expect(ready(), `${what} が届かない`).toBe(true);
}

/** 記法を読んだ図。読めない時は判定で落とす */
function diagramOf(source: string): dragon.Diagram {
  const parsed = dragon.parseNotation(source);
  expect(parsed.ok, "見本の記法が読めない").toBe(true);
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => e.message).join("\n"));
  return parsed.diagram;
}

/** URL の`#`の後ろを開いた編集画面を置く */
async function openEditor(hash: string): Promise<HTMLTextAreaElement> {
  history.replaceState(null, "", `/dragon/editor${hash}`);
  host = document.createElement("div");
  document.body.append(host);
  mounted = createRoot(host);
  act(() => mounted?.render(<Playground lang="ja" theme="light" palette="paper" onBeforeLang={() => undefined} />));
  await wait(50);
  const area = host.querySelector<HTMLTextAreaElement>('[data-playground="editor"]');
  expect(area, "書く欄が無い").not.toBeNull();
  return area as HTMLTextAreaElement;
}

afterEach(() => {
  act(() => mounted?.unmount());
  mounted = undefined;
  host?.remove();
  host = undefined;
  document.body.replaceChildren();
  history.replaceState(null, "", "/");
  vi.restoreAllMocks();
});

describe("エディタのボタンが開くURL (#3697)", () => {
  it("editor-url-compresses-notation", async () => {
    const controls = frame.createDragonFrame(document, SOURCE, diagramOf(SOURCE));
    document.body.append(controls.frame);
    const href = (): string => controls.frame.shadowRoot?.querySelector<HTMLAnchorElement>(".editor")?.getAttribute("href") ?? "";
    await until(() => href().includes("#z="), "エディタのボタンの縮めたURL");
    const url = href();
    controls.destroy();
    expect(url.startsWith(`${PUBLISHED}editor#z=`), `エディタのボタンのURL ${url} が縮めた形でエディタの頁を指さない`).toBe(true);
    const hash = url.slice(url.indexOf("#"));
    expect(hash, "縮めた記法が URL に載る形の base64 でない").toMatch(/^#z=[A-Za-z0-9_-]+$/u);
    expect(url.length, "縮めたURLが縮めていないURLより短くない").toBeLessThan(frame.diagramEditorUrl(SOURCE).length);

    // 同じURLで編集画面を開くと、書く欄が同じ字の記法を持つ
    const area = await openEditor(hash);
    await until(() => area.value === SOURCE, "縮めたURLの記法");
  });

  it("editor-open-copies-long-notation", async () => {
    document.documentElement.lang = "ja";
    const LONG = longSource();
    const packed = (dragon as Record<string, unknown>).packedEditorUrl as ((source: string) => Promise<string>) | undefined;
    const limit = (dragon as Record<string, unknown>).EDITOR_URL_LIMIT as number | undefined;
    expect(typeof packed, "描く入口が記法を縮めたURLを作る関数 (packedEditorUrl) を出さない").toBe("function");
    expect(typeof limit, "描く入口がURLの上限 (EDITOR_URL_LIMIT) を出さない").toBe("number");
    if (!packed || limit === undefined) return;
    // 選んだ記法が、縮めても上限を超える (境目の外側を通っている)
    expect((await packed(LONG)).length, "長い記法の縮めたURLの長さ").toBeGreaterThan(limit);

    const order: string[] = [];
    const written: string[] = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (text: string): Promise<void> => {
          order.push("copy");
          written.push(text);
          return Promise.resolve();
        },
      },
    });
    const opened: string[] = [];
    vi.spyOn(window, "open").mockImplementation((url) => {
      order.push("open");
      opened.push(String(url));
      return null;
    });
    const controls = frame.createDragonFrame(document, LONG, diagramOf(LONG));
    document.body.append(controls.frame);
    const root = controls.frame.shadowRoot!;
    await wait(100);
    root.querySelector<HTMLAnchorElement>(".editor")?.click();
    await until(() => opened.length > 0, "エディタのタブ");
    expect({ order, written, opened }, "長い記法を写してから貼る編集画面を開く").toEqual({
      order: ["copy", "open"],
      written: [LONG],
      opened: [`${PUBLISHED}editor#paste`],
    });
    expect(root.querySelector(".status")?.textContent ?? "", "帯の知らせの欄が貼るよう頼まない").toMatch(/エディタに貼/u);
    controls.destroy();

    // 貼るよう頼むURLで開いた編集画面は、書く欄を空にして貼るよう出す
    const area = await openEditor("#paste");
    expect({ value: area.value, placeholder: area.placeholder.includes("クリップボード") }, "貼るよう頼むURLで開いた書く欄").toEqual({ value: "", placeholder: true });
  });
});
