// @vitest-environment jsdom
/**
 * 頁に図を置いて動かす (#2985)。
 *
 * 動きを嫌う設定 (`prefers-reduced-motion: reduce`) の人には自動再生せず、段ごとの止め絵を釦で送る。
 * 各段の題と本文は、読み上げの道具が段の順に読める一覧として頁に置く。
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { api, exampleJson, type Json } from "./diagram-support";
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

describe("段の出典 (#3199)", () => {
  it("notation-step-sources", () => {
    prefersReducedMotion(true);
    const README = "https://github.com/cardene777/dragon/blob/main/README.md";
    const text = [
      "sequence 出典のある段",
      "box 送る側",
      "box 受ける側",
      "step 送る",
      "  say 送る側が受ける側へ送る。",
      `  source dragon の README [url: ${README}]`,
      "  source 中の仕組み [url: /diagrams/entry]",
      "  送る側 -> 受ける側",
      "step 返す",
      "  say 受ける側が送る側へ返す。",
      "  受ける側 -> 送る側",
    ].join("\n");
    const parsed = api("parseNotation")(text);
    expect(parsed.ok, JSON.stringify(parsed.ok ? undefined : parsed.errors[0])).toBe(true);
    if (!parsed.ok) return;

    // 1 つの段に書いた出典の行は、書いた順に段の出典になる。書かない段は出典の欄を持たない
    const steps = (parsed.diagram as { steps: Json[] }).steps as { sources?: Json }[];
    const sources = [
      { name: "dragon の README", url: README },
      { name: "中の仕組み", url: "/diagrams/entry" },
    ];
    expect(steps[0]?.sources).toEqual(sources);
    expect(steps[1] && Object.hasOwn(steps[1], "sources"), "出典を書かない段が出典の欄を持つ").toBe(false);

    // 読み上げの段の一覧では、出典を書いた段にだけ、出典の名前の link が書いた順に並ぶ
    const { host } = mount(parsed.diagram);
    const items = [...host.querySelectorAll('[data-dragon="steps"] > li')];
    expect(items).toHaveLength(2);
    const linksOf = (item: Element | undefined): { name: string; url: string }[] =>
      [...(item?.querySelectorAll("a") ?? [])].map((a) => ({ name: a.textContent ?? "", url: a.getAttribute("href") ?? "" }));
    expect(linksOf(items[0])).toEqual(sources);
    expect(linksOf(items[1])).toEqual([]);
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

describe("流して見せる (#3113)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  interface Seen {
    step: number;
    title: string | null | undefined;
    no: string | null | undefined;
  }

  /** 偽の時計で OAuth を流して置く。`at(t)` は時刻を `t` 秒まで進めて、今の段と題と番号の札を読む */
  function playedTo(): { at: (t: number) => Seen; timeline: { total: number; steps: { start: number }[] }; titles: string[] } {
    prefersReducedMotion(false);
    vi.useFakeTimers();
    const diagram = exampleJson("oauth.json") as { steps: { title: string }[] };
    const { host, player } = mount(diagram);
    expect(player.playing, "設定が無い人に流れない").toBe(true);
    const { timeline } = draw("renderDiagram")(diagram);
    let now = 0;
    const at = (t: number): Seen => {
      vi.advanceTimersByTime(Math.round((t - now) * 1000));
      now = t;
      return { step: player.step, title: stepTitle(host), no: host.querySelector('[data-dragon="step-no"]')?.textContent };
    };
    return { at, timeline, titles: diagram.steps.map((s) => s.title) };
  }

  it("player-follows-real-time", () => {
    // 流して見せる時は時刻の表の秒のとおりに段が進み、段が替わったら題と番号もすぐ替わる
    const { at, timeline, titles } = playedTo();
    const second = timeline.steps[1]?.start ?? Number.NaN;
    const before = at(second - 0.2);
    expect(before.step, `段 2 の始まり (${second.toFixed(2)} 秒) の 0.2 秒前に段 1 でない`).toBe(0);
    expect(before.title).toBe(titles[0]);
    const after = at(second + 0.2);
    expect(after.step, `段 2 の始まりから 0.2 秒後に段 2 に替わらない`).toBe(1);
    expect(after.title).toBe(titles[1]);
    expect(after.no, "段 2 の始まりから 0.2 秒後の番号の札").toBe("02/12");
  });

  it("player-loops-after-total", () => {
    // 1 周を終えたら最初の段へ戻って流れ続ける
    const { at, timeline, titles } = playedTo();
    const last = titles.length - 1;
    const end = at(timeline.total - 0.2);
    expect(end.step, "1 周の終わりの 0.2 秒前に最後の段でない").toBe(last);
    const again = at(timeline.total + (timeline.steps[0]?.start ?? Number.NaN) + 0.2);
    expect(again.step, "1 周を終えて最初の段の始まりから 0.2 秒後に段 1 へ戻らない").toBe(0);
    expect(again.title).toBe(titles[0]);
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
