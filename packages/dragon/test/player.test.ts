// @vitest-environment jsdom
/**
 * 頁に図を置いて動かす (#2985)。
 *
 * 動きを嫌う設定 (`prefers-reduced-motion: reduce`) の人には自動再生せず、段ごとの止め絵を釦で送る。
 * 各段の題と本文は、読み上げの道具が段の順に読める一覧として頁に置く。
 */
import { afterEach, describe, expect, it } from "vitest";
import { exampleJson, type Json } from "./diagram-support";
import { draw, type Player } from "./render-support";

/** 頁の設定を模す。jsdom は `matchMedia` を持たないため、系の境目として差し替える。 */
function prefersReducedMotion(reduce: boolean): void {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion") && query.includes("reduce"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

const players: Player[] = [];
afterEach(() => {
  for (const player of players.splice(0)) player.destroy();
  document.body.innerHTML = "";
});

function mount(diagram: Json): { host: HTMLElement; player: Player } {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const player = draw("mountDiagram")(host, diagram);
  players.push(player);
  return { host, player };
}

const click = (host: HTMLElement, name: string): void => {
  const button = host.querySelector<HTMLButtonElement>(`button[data-dragon="${name}"]`);
  expect(button, `${name} の釦`).not.toBeNull();
  button?.click();
};

const stepTitle = (host: HTMLElement): string | null | undefined => host.querySelector('[data-dragon="step-title"]')?.textContent;

describe("動きを嫌う設定", () => {
  it("reduced-motion-shows-stills", () => {
    const oauth = exampleJson("oauth.json") as { steps: { title: string }[] };

    // 設定が無い人には自動で流す
    prefersReducedMotion(false);
    const moving = mount(oauth as unknown as Json);
    expect(moving.player.playing).toBe(true);
    expect(moving.host.querySelector("svg")?.getAttribute("data-motion")).not.toBe("still");
    moving.player.destroy();

    // 設定がある人には、描いた時から止め絵で見せ、釦で段を送る
    prefersReducedMotion(true);
    const { host, player } = mount(oauth as unknown as Json);
    expect(player.playing).toBe(false);
    expect(host.querySelector("svg")?.getAttribute("data-motion")).toBe("still");
    expect(player.step).toBe(0);
    expect(stepTitle(host)).toBe(oauth.steps[0].title);

    click(host, "next");
    expect(player.step).toBe(1);
    expect(stepTitle(host)).toBe(oauth.steps[1].title);
    expect(player.playing).toBe(false);

    click(host, "prev");
    expect(player.step).toBe(0);
    click(host, "prev");
    expect(player.step, "最初の段で前へ送っても最初に留まる").toBe(0);

    // 最後の段で次へ送っても、最後の段の止め絵に留まり、流れ出さない
    const last = oauth.steps.length - 1;
    for (let i = 0; i < last; i++) click(host, "next");
    expect(player.step).toBe(last);
    click(host, "next");
    expect(player.step).toBe(last);
    expect(stepTitle(host)).toBe(oauth.steps[last].title);
    expect(player.playing).toBe(false);
  });
});

describe("読み上げ", () => {
  it("steps-exposed-to-screen-readers", () => {
    prefersReducedMotion(false);
    const diagram = exampleJson("oauth.json") as { steps: { title: string; body: string }[] };
    diagram.steps[1].body = "1 行目の本文。\n2 行目の本文。";
    const { host } = mount(diagram as unknown as Json);

    const list = host.querySelector('[data-dragon="steps"]');
    expect(list?.tagName).toBe("OL");
    if (!list) return;
    // 見た目から隠しても、読み上げの道具からは隠さない
    expect(list.hasAttribute("hidden")).toBe(false);
    expect(list.getAttribute("aria-hidden")).not.toBe("true");
    expect((list as HTMLElement).style.display).not.toBe("none");

    const items = [...list.querySelectorAll("li")];
    expect(items).toHaveLength(diagram.steps.length);
    items.forEach((item, i) => {
      const text = item.textContent ?? "";
      const { title, body } = diagram.steps[i];
      expect(text, `段 ${i + 1} の題`).toContain(title);
      for (const line of body.split("\n")) expect(text, `段 ${i + 1} の本文`).toContain(line);
      expect(text.indexOf(title), `段 ${i + 1} は題が本文より先`).toBeLessThan(text.indexOf(body.split("\n")[0]));
    });

    // 図そのものは読み上げの道具から隠し、同じ中身を 2 度読ませない
    expect(host.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});
