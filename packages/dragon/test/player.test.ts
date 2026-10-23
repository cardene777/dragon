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
  window.matchMedia = (query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion") && query.includes("reduce"),
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
    const moving = mount(oauth);
    expect(moving.player.playing).toBe(true);
    expect(moving.host.querySelector("svg")?.getAttribute("data-motion")).not.toBe("still");
    moving.player.destroy();

    // 設定がある人には、描いた時から止め絵で見せ、釦で段を送る
    prefersReducedMotion(true);
    const { host, player } = mount(oauth);
    expect(player.playing).toBe(false);
    expect(host.querySelector("svg")?.getAttribute("data-motion")).toBe("still");
    expect(player.step).toBe(0);
    expect(stepTitle(host)).toBe(oauth.steps[0]?.title);

    click(host, "next");
    expect(player.step).toBe(1);
    expect(stepTitle(host)).toBe(oauth.steps[1]?.title);
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
    expect(stepTitle(host)).toBe(oauth.steps[last]?.title);
    expect(player.playing).toBe(false);
  });
});

describe("読み上げ", () => {
  it("steps-exposed-to-screen-readers", () => {
    prefersReducedMotion(false);
    const diagram = exampleJson("oauth.json") as { steps: { title: string; body: string }[] };
    const second = diagram.steps[1];
    expect(second).toBeDefined();
    if (second) second.body = "1 行目の本文。\n2 行目の本文。";
    const { host } = mount(diagram);

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
      const step = diagram.steps[i];
      expect(step, `段 ${i + 1}`).toBeDefined();
      if (!step) return;
      const { title, body } = step;
      expect(text, `段 ${i + 1} の題`).toContain(title);
      for (const line of body.split("\n")) expect(text, `段 ${i + 1} の本文`).toContain(line);
      expect(text.indexOf(title), `段 ${i + 1} は題が本文より先`).toBeLessThan(text.indexOf(body.split("\n")[0] ?? body));
    });

    // 図そのものは読み上げの道具から隠し、同じ中身を 2 度読ませない
    expect(host.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("段の知らせ", () => {
  it("player-reports-step-changes", () => {
    // 頁の側の段の札と進み具合の帯は、再生の部品が知らせる段で出す (#3031)
    prefersReducedMotion(true);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const seen: number[] = [];
    const player = draw("mountDiagram")(host, exampleJson("oauth.json"), { onStep: (step) => seen.push(step) });
    players.push(player);
    expect(seen, "置いた時に最初の段を知らせない").toEqual([0]);
    click(host, "next");
    click(host, "next");
    click(host, "prev");
    expect(seen.at(-1), "釦で送った段を知らせない").toBe(1);
    expect([...new Set(seen)], "知らせた段の並びが送った順でない").toEqual([0, 1, 2]);
    expect(seen.at(-1)).toBe(player.step);
  });
});

describe("段の本文の帯の高さ (#3049)", () => {
  it("player-caption-room-holds-every-step", () => {
    // 帯の高さが段の本文の行の数で替わると、図の枠が伸び縮みして図が縮むか上下に動く
    prefersReducedMotion(true);
    const diagram = exampleJson("oauth.json") as { steps: { title: string; body: string }[] };
    const { host } = mount(diagram);

    // 今の段の題と本文は 1 つずつのままで、見えていて、今の段の中身を出す
    expect(host.querySelectorAll('[data-dragon="step-title"]'), "段の題が 1 つでない").toHaveLength(1);
    expect(host.querySelectorAll('[data-dragon="step-body"]'), "段の本文が 1 つでない").toHaveLength(1);
    const title = host.querySelector<HTMLElement>('[data-dragon="step-title"]');
    expect(title && getComputedStyle(title).visibility, "今の段の題が見えない").not.toBe("hidden");
    expect(stepTitle(host)).toBe(diagram.steps[0]?.title);

    // 帯の高さを決める写しは、全部の段の題と本文を段の順に持ち、場所だけを取って見た目と読み上げから隠れる
    const rooms = [...host.querySelectorAll<HTMLElement>('[data-dragon="caption-room"]')];
    expect(rooms, "帯の高さを決める写しが段の数だけ無い").toHaveLength(diagram.steps.length);
    rooms.forEach((room, i) => {
      const step = diagram.steps[i];
      if (!step) return;
      const text = room.textContent ?? "";
      expect(text, `段 ${i + 1} の写しの題`).toContain(step.title);
      for (const line of step.body.split("\n")) expect(text, `段 ${i + 1} の写しの本文`).toContain(line);
      expect(getComputedStyle(room).visibility, `段 ${i + 1} の写しが見えている`).toBe("hidden");
      expect(room.closest('[aria-hidden="true"]'), `段 ${i + 1} の写しが読み上げの道具に出る`).not.toBeNull();
    });

    // 段を送ると、今の段の題が送った段の題に替わる
    click(host, "next");
    expect(stepTitle(host)).toBe(diagram.steps[1]?.title);
  });
});
