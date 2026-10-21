// @vitest-environment jsdom
/**
 * 描く部品が出す字を、渡した言葉 (日本語か英語) で出す (#3001)。
 *
 * 図の原本は語を持たないので、呼ぶ側が言葉を渡す。渡さなければ今の日本語で出す。
 * 字は 3 か所にある。描けない時の断りの文、寄って動かす見せ方の全体図の札、再生の釦と段の一覧の読み上げの名前。
 */
import { afterEach, describe, expect, it } from "vitest";
import { exampleJson, type Json } from "./diagram-support";
import { draw, type Lang, type Player } from "./render-support";

/** 仮名と漢字。英語の字に入らない */
const KANA_KANJI = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

type Diagramish = { [key: string]: Json };
const oauth = (): Diagramish => structuredClone(exampleJson("oauth.json")) as Diagramish;
const title = (): string => (exampleJson("oauth.json") as { title: string }).title;

/** 書けない欄を足した、描けない原本 */
function broken(): Diagramish {
  const d = oauth();
  ((d.boxes as Diagramish[])[0] as Diagramish).colour = "blue";
  return d;
}

/** 頁の設定を模す。jsdom は `matchMedia` を持たないため、系の境目として差し替える。動きを嫌わない人として置く */
function allowMotion(): void {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

const players: Player[] = [];
afterEach(() => {
  for (const player of players.splice(0)) player.destroy();
  document.body.innerHTML = "";
});

/** 寄って動かす見せ方で図を置く。`lang` が `undefined` の時は言葉を渡さない */
function mount(lang: Lang | undefined): HTMLElement {
  allowMotion();
  const host = document.createElement("div");
  document.body.appendChild(host);
  const options = lang === undefined ? undefined : { lang };
  players.push(draw("mountDiagram")(host, { ...oauth(), view: "follow" }, options));
  return host;
}

const label = (host: HTMLElement, name: string): string | null | undefined =>
  host.querySelector(`[data-dragon="${name}"]`)?.getAttribute("aria-label");

/** 再生の釦と段の一覧の読み上げの名前。止める釦は動かしている間と、押して止めた後の 2 つを読む */
function labels(host: HTMLElement): { prev: unknown; pause: unknown; play: unknown; next: unknown; steps: unknown } {
  const prev = label(host, "prev");
  const pause = label(host, "toggle");
  host.querySelector<HTMLButtonElement>('button[data-dragon="toggle"]')?.click();
  const play = label(host, "toggle");
  return { prev, pause, play, next: label(host, "next"), steps: label(host, "steps") };
}

const overview = (host: HTMLElement): string | null | undefined => host.querySelector("svg .dg-mm-t")?.textContent;

/** 描けない原本を描いた時の断りの文 */
function refusal(lang: Lang | undefined): string {
  try {
    draw("renderDiagram")(broken(), lang === undefined ? undefined : { lang });
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  expect.fail("描けない原本が描けた");
}

describe("描く部品が出す字の言葉", () => {
  it("render-refusal-in-english", () => {
    const message = refusal("en");
    expect(message, "英語の断りの文の頭").toMatch(/^Cannot draw the diagram: /u);
    expect(message, "断りの文に誤りの場所が無い").toContain("/boxes/0/colour");
    expect(message, "英語の断りの文に仮名か漢字がある").not.toMatch(KANA_KANJI);
  });

  it("overview-label-in-english", () => {
    expect(overview(mount("en")), "英語の全体図の札").toBe("Overview");
  });

  it("player-labels-in-english", () => {
    const host = mount("en");
    expect(labels(host)).toEqual({ prev: "Previous step", pause: "Pause", play: "Play", next: "Next step", steps: `Steps of ${title()}` });
    const buttons = host.querySelector('[data-dragon="prev"]')?.parentElement;
    expect(buttons?.getAttribute("lang"), "釦を並べた要素の言葉").toBe("en");
  });

  it("render-text-default-japanese-unchanged", () => {
    for (const lang of [undefined, "ja"] as const) {
      expect(refusal(lang), `${lang ?? "言葉なし"} の断りの文`).toBe("図を描けない: /boxes/0/colour colour という欄は書けない");
      const host = mount(lang);
      expect(overview(host), `${lang ?? "言葉なし"} の全体図の札`).toBe("全体図");
      expect(labels(host), `${lang ?? "言葉なし"} の読み上げの名前`).toEqual({ prev: "前の段", pause: "止める", play: "動かす", next: "次の段", steps: `${title()} の段` });
      for (const player of players.splice(0)) player.destroy();
      document.body.innerHTML = "";
    }
  });
});
