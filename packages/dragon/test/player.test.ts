// @vitest-environment jsdom
/**
 * 頁に図を置いて動かす (#2985)。
 *
 * 動きを嫌う設定 (`prefers-reduced-motion: reduce`) の人には自動再生せず、段ごとの止め絵を釦で送る。
 * 各段の題と本文は、読み上げの道具が段の順に読める一覧として頁に置く。
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { api, exampleJson, type Json } from "./diagram-support";
import { motionFrom, tagOpacity } from "./motion-support";
import { pipeTexts } from "../src/pipe-player";
import { ARCADE_COLORS, cssVars, draw, figureVars, type LaidAction, type Player, type PlayerOptions } from "./render-support";

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

function mount(diagram: Json, options: PlayerOptions = {}): { host: HTMLElement; player: Player } {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const player = draw("mountDiagram")(host, diagram, options);
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

describe("飛び先を持つ図の読み上げ (#3329)", () => {
  /** 箱の 1 つが飛び先を持つ図。描いた SVG ではその箱が `<a href>` になる */
  const linked = (): Json => {
    const text = [
      "sequence 飛び先のある図",
      "box 入口 [link: /diagrams/entry]",
      "box 受ける側",
      "step 送る",
      "  say 入口が受ける側へ送る。",
      "  入口 -> 受ける側",
      "step 返す",
      "  say 受ける側が入口へ返す。",
      "  受ける側 -> 入口",
    ].join("\n");
    const parsed = api("parseNotation")(text);
    expect(parsed.ok, JSON.stringify(parsed.ok ? undefined : parsed.errors[0])).toBe(true);
    return parsed.ok ? parsed.diagram : {};
  };

  // 隠した要素の中に押せる link が残ると、Tab で移った先を読み上げの道具が読めない
  const expectReadable = (host: HTMLElement): void => {
    const svg = host.querySelector("svg");
    expect(svg?.querySelector("a[href]"), "箱の link が描かれていない").not.toBeNull();
    expect(svg?.hasAttribute("aria-hidden"), "link を持つ図を読み上げから隠した").toBe(false);
    expect(svg?.getAttribute("role")).toBe("group");
    expect(svg?.getAttribute("aria-label")).toBe("飛び先のある図");
  };

  it("player-linked-figure-stays-readable", () => {
    prefersReducedMotion(false);
    const { host, player } = mount(linked());
    expect(player.playing).toBe(true);
    expectReadable(host);
  });

  it("player-linked-figure-readable-after-replace", () => {
    prefersReducedMotion(false);
    const { host, player } = mount(linked());
    // 段を送ると、部品は図の読み上げの属性と動きの変数を付け直す (#3445 からは図を写さず同じ図に付ける)
    click(host, "next");
    expect(player.step).toBe(1);
    expectReadable(host);
    // 流している図の止める釦を押しても、部品は図の属性を付け直す
    expect(player.playing).toBe(true);
    click(host, "toggle");
    expect(player.playing).toBe(false);
    expectReadable(host);
  });

  it("player-plain-figure-hidden-from-reader", () => {
    prefersReducedMotion(false);
    const { host } = mount(exampleJson("oauth.json"));
    const svg = host.querySelector("svg");
    expect(svg?.querySelector("a[href]"), "oauth の見本が箱の link を持つ").toBeNull();
    // link の無い図は段の一覧に読ませ、図は隠して同じ中身を 2 度読ませない
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.hasAttribute("role")).toBe(false);
    expect(svg?.hasAttribute("aria-label")).toBe(false);
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

describe("色の値 (#3198)", () => {
  it("player-colors-override-palette", () => {
    prefersReducedMotion(false);
    const sh = draw("resolvePalette")("paper").light.sh;
    for (const view of ["fixed", "follow"] as const) {
      const host = document.createElement("div");
      document.body.appendChild(host);
      players.push(draw("mountDiagram")(host, { ...(exampleJson("oauth.json") as Record<string, Json>), view }, { palette: "paper", colors: ARCADE_COLORS }));
      const svg = host.querySelector('svg[data-dragon="figure"]');
      expect(svg?.getAttribute("data-view"), "置いた図の見せ方").toBe(view);
      // 寄って追う図は全体図を同じ SVG に描き、全体図の地と札も SVG の変数の色で塗る
      if (view === "follow") expect(svg?.querySelector(".dg-mm-bg"), "寄って追う図に全体図が無い").not.toBeNull();
      const figure = figureVars(svg?.outerHTML ?? "");
      const bar = cssVars(host.querySelector('[data-dragon="player"]')?.getAttribute("style") ?? "");
      for (const [name, value] of Object.entries(ARCADE_COLORS)) {
        expect(figure[name], `${view} の図の ${name}`).toBe(value);
        expect(bar[name], `${view} の釦と段の帯の ${name}`).toBe(value);
      }
      // 渡さない色は紙と墨の値のまま残る
      expect(figure.sh, `${view} の図の影`).toBe(sh);
    }
  });
});

describe("止めて置く、1 度だけ流す (#3200)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  type Oauth = { steps: { title: string }[] };

  /** 置いた SVG が止める時刻と、止めているか流しているか */
  const placed = (host: HTMLElement): { at: number; motion: string | null | undefined } => {
    const svg = host.querySelector("svg");
    return { at: Number(svg?.style.getPropertyValue("--at")), motion: svg?.getAttribute("data-motion") };
  };

  /** 置いた SVG を、止める時刻で読んだ時の線の名前と処理の札の見える濃さ。札は止め絵を選んで描いた置き場所から引く */
  function shownTags(host: HTMLElement, diagram: Json): { step: number; text: string; opacity: number }[] {
    const svg = host.querySelector("svg");
    expect(svg, "図が置かれていない").not.toBeNull();
    const rendered = draw("renderDiagram")(diagram, { still: true });
    const motion = motionFrom({ ...rendered, svg: svg?.outerHTML ?? "" });
    const at = placed(host).at;
    const labels = rendered.layout.labels.map((l) => ({ step: l.step, text: l.text, opacity: tagOpacity(motion, "dg-cap", l, at) }));
    const actions = (rendered.layout.actions as (LaidAction & { text: string })[]).map((a) => ({ step: a.step, text: a.text, opacity: tagOpacity(motion, "dg-act", a, at) }));
    return [...labels, ...actions];
  }

  /** 偽の時計を `t` 秒進める */
  const advance = (t: number): void => {
    vi.advanceTimersByTime(Math.round(t * 1000));
  };

  it("player-start-paused-at-step", () => {
    prefersReducedMotion(false);
    vi.useFakeTimers();
    const diagram = exampleJson("oauth.json") as Oauth;
    const { timeline } = draw("renderDiagram")(diagram);
    const { host, player } = mount(diagram, { pausedAt: 3 });
    expect(player.playing, "止めて置く設定を渡した図が、置いた時から流れる").toBe(false);
    expect(player.step, "止めて置く段").toBe(3);
    expect(stepTitle(host)).toBe(diagram.steps[3]?.title);
    expect(placed(host), "置いた図が段 4 の止め絵で止まっていない").toEqual({ at: timeline.stills[3], motion: "still" });
    advance(timeline.total * 2);
    expect(player.step, "止めて置いた図が時刻とともに段を進める").toBe(3);
    expect(player.playing).toBe(false);
  });

  it("player-plays-once-then-still", () => {
    prefersReducedMotion(false);
    vi.useFakeTimers();
    const diagram = exampleJson("oauth.json") as Oauth;
    const { timeline } = draw("renderDiagram")(diagram, { still: true });
    const last = diagram.steps.length - 1;
    const { host, player } = mount(diagram, { playOnce: true, still: true });
    expect(player.playing, "1 度だけ流す図が、置いた時から流れない").toBe(true);
    expect(player.step).toBe(0);
    advance((timeline.stills[last] ?? Number.NaN) - 0.5);
    expect(player.step, "最後の段の止め絵の 0.5 秒前に最後の段でない").toBe(last);
    expect(player.playing, "最後の段の止め絵より前に止まる").toBe(true);
    advance(1);
    expect(player.playing, "1 度だけ流す図が、最後の段の止め絵を過ぎても止まらない").toBe(false);
    expect(placed(host), "1 度流した図が最後の段の止め絵で止まっていない").toEqual({ at: timeline.stills[last], motion: "still" });
    advance(timeline.total * 2);
    expect(player.step, "1 度流した図が繰り返して最初の段へ戻る").toBe(last);
    expect(player.playing).toBe(false);
    expect(stepTitle(host)).toBe(diagram.steps[last]?.title);
    for (const tag of shownTags(host, diagram)) expect(tag.opacity, `止まった図に段 ${tag.step + 1} の「${tag.text}」が最後の段と同じ濃さで出ない`).toBeGreaterThan(0.99);
  });

  it("player-still-middle-step-own-labels", () => {
    prefersReducedMotion(false);
    const diagram = exampleJson("oauth.json") as Oauth;
    const { timeline } = draw("renderDiagram")(diagram, { still: true });
    const { host, player } = mount(diagram, { still: true });
    for (let step = 0; step < diagram.steps.length - 1; step++) {
      player.goTo(step);
      expect(placed(host), `段 ${step + 1} へ送った図が段 ${step + 1} の止め絵で止まっていない`).toEqual({ at: timeline.stills[step], motion: "still" });
      for (const tag of shownTags(host, diagram)) {
        if (tag.step === step) expect(tag.opacity, `段 ${step + 1} の止め絵にその段の「${tag.text}」が出ない`).toBeGreaterThan(0.99);
        else expect(tag.opacity, `段 ${step + 1} の止め絵に段 ${tag.step + 1} の「${tag.text}」が出る`).toBeLessThan(0.01);
      }
    }
  });

  it("player-default-loops", () => {
    prefersReducedMotion(false);
    vi.useFakeTimers();
    const diagram = exampleJson("oauth.json") as Oauth;
    const { timeline } = draw("renderDiagram")(diagram);
    const last = diagram.steps.length - 1;
    const { host, player } = mount(diagram);
    expect(player.playing, "設定を渡さない図が、置いた時から流れない").toBe(true);
    expect(placed(host).motion).toBe("play");
    const first = timeline.steps[0]?.start ?? Number.NaN;
    let now = 0;
    const stepAt = (t: number): number => {
      advance(t - now);
      now = t;
      return player.step;
    };
    for (const round of [0, 1, 2]) {
      const start = round * timeline.total;
      expect(stepAt(start + first + 0.2), `${round + 1} 周目の最初の段の始まりから 0.2 秒後に段 1 でない`).toBe(0);
      expect(stepAt(start + timeline.total - 0.2), `${round + 1} 周目の終わりの 0.2 秒前に最後の段でない`).toBe(last);
      expect(player.playing, `${round + 1} 周目の終わりに止まる`).toBe(true);
    }
  });
});

describe("試す図でない図の帯の並び (#3437)", () => {
  // 試す図の並びを変えても、試す図でない図は図の枠のすぐ下に段の説明とゲージの帯を置き、入力の帯を持たない
  it("player-caption-sits-under-frame", () => {
    prefersReducedMotion(true);
    for (const name of ["oauth.json", "swap.json"]) {
      const { host } = mount(exampleJson(name));
      const frame = host.querySelector(".dg-frame");
      const bar = host.querySelector(".dg-bar");
      expect(frame && bar, `${name} の図の枠か段の説明の帯が無い`).toBeTruthy();
      expect(frame?.nextElementSibling, `${name} の図の枠の次が段の説明とゲージの帯でない`).toBe(bar);
      expect(host.querySelector(".dg-try"), `${name} に入力の帯が在る`).toBeNull();
    }
  });
});

describe("試作の形の再生の操作 (#3398)", () => {
  it("player-r6-controls", () => {
    prefersReducedMotion(true);
    for (const name of ["oauth.json", "swap.json"]) {
      const diagram = exampleJson(name) as { steps: { title: string; body: string }[] };
      const { host, player } = mount(diagram);
      // やり直しの釦と、前と次の釦と、名前の付いた再生の釦を持つ
      const names = [...host.querySelectorAll<HTMLButtonElement>("button[data-dragon]")].map((b) => b.dataset.dragon);
      for (const want of ["restart", "prev", "toggle", "next"]) expect(names, `${name} の再生の操作に ${want} の釦が無い`).toContain(want);
      const toggle = host.querySelector<HTMLButtonElement>('button[data-dragon="toggle"]');
      expect(toggle?.textContent ?? "", `${name} の再生の釦に名前が無い`).toMatch(/\p{L}{2,}/u);
      // 配管の図でない図は、大きな段の題と、題の下の小さな段の説明文を持つ (配管の図は説明の文だけ、#3418)
      const pipe = name === "swap.json";
      const title = host.querySelector<HTMLElement>('[data-dragon="step-title"]');
      const body = host.querySelector<HTMLElement>('[data-dragon="step-body"]');
      expect(pipe || (title && body), `${name} の段の題か説明文が無い`).toBeTruthy();
      if (!pipe && title && body) {
      const size = (el: HTMLElement): number => Number.parseFloat(getComputedStyle(el).fontSize);
      expect(size(title), `${name} の段の題の字の大きさ`).toBeGreaterThanOrEqual(20);
      expect(size(title), `${name} の段の題が説明文より大きくない`).toBeGreaterThanOrEqual(1.4 * size(body));
      expect(title.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING, `${name} の段の説明文が題の下に無い`).toBeTruthy();
      }
      // 段ごとに分けた進み具合の帯。済んだ段と今の段とまだの段を分ける
      const segments = (): string[] =>
        [...host.querySelectorAll<HTMLElement>('[data-dragon="progress"] [data-dragon="segment"]')].map((el) => el.dataset.state ?? "");
      const want = (now: number): string[] => diagram.steps.map((_, i) => (i < now ? "done" : i === now ? "now" : "todo"));
      expect(segments(), `${name} の進み具合の帯の最初の段`).toEqual(want(0));
      click(host, "next");
      click(host, "next");
      expect(segments(), `${name} の進み具合の帯の 3 段目`).toEqual(want(2));
      // やり直しの釦で最初の段へ戻る
      click(host, "restart");
      expect(player.step, `${name} のやり直しの釦で最初の段へ戻らない`).toBe(0);
      expect(segments(), `${name} のやり直した後の進み具合の帯`).toEqual(want(0));
    }
  });

  it("player-pans-wide-figure", () => {
    prefersReducedMotion(true);
    const source = exampleJson("aggregator.json");
    const frame = 1200;
    const host = document.createElement("div");
    Object.defineProperty(host, "clientWidth", { value: frame });
    document.body.appendChild(host);
    const player = draw("mountDiagram")(host, source, { open: [2] });
    players.push(player);
    const drawn = draw("renderDiagram")(source, { open: [2], width: frame }) as unknown as {
      layout: { width: number; parties: { id: string; x: number; w: number }[] };
      diagram: { steps: { events: { from?: string; to?: string; box?: string }[] }[] };
    };
    const { layout } = drawn;
    expect(layout.width, "aggregator を開いた図の幅").toBeGreaterThan(frame);
    // 図を縮めずに枠の中を横に送る。手でも横に動かせる
    const pan = host.querySelector<HTMLElement>('[data-dragon="pan"]');
    expect(pan, "横に送る枠が無い").not.toBeNull();
    if (!pan) return;
    expect(["auto", "scroll"], "横に送る枠を手で動かせない").toContain(pan.style.overflowX || getComputedStyle(pan).overflowX);
    const svg = pan.querySelector("svg");
    expect(Number.parseFloat(svg?.style.width || svg?.getAttribute("width") || ""), "横に送る枠の中の図が縮んでいる").toBeCloseTo(layout.width, 0);
    // 図の下の細い線が、全体のどこを見ているかを示す
    const thumb = host.querySelector<HTMLElement>('[data-dragon="overview"] [data-dragon="overview-thumb"]');
    expect(thumb, "全体のどこを見ているかを示す線が無い").not.toBeNull();
    const steps = drawn.diagram.steps;
    expect(steps.length, "aggregator を開いた図の段の数").toBe(14);
    const rectOf = new Map(layout.parties.map((p) => [p.id, p]));
    steps.forEach((step, s) => {
      player.goTo(s);
      const left = pan.scrollLeft;
      expect(left >= 0 && left <= layout.width - frame + 1, `段 ${s + 1} の送った位置が図の外`).toBe(true);
      // 段を進めると、その段に関わる関係者の所へ送る
      const ids = [...new Set(step.events.flatMap((e) => [e.from, e.to, e.box]).filter((id): id is string => id !== undefined))];
      const rects = ids.flatMap((id) => rectOf.get(id) ?? []);
      expect(rects.length, `段 ${s + 1} に関わる関係者が並べた図に無い`).toBeGreaterThan(0);
      const lo = Math.min(...rects.map((r) => r.x));
      const hi = Math.max(...rects.map((r) => r.x + r.w));
      if (hi - lo <= frame) expect(lo >= left - 1 && hi <= left + frame + 1, `段 ${s + 1} に関わる関係者が枠の中に無い`).toBe(true);
      else expect(left + frame / 2 >= lo && left + frame / 2 <= hi, `段 ${s + 1} の枠の真ん中が関わる関係者の間に無い`).toBe(true);
      expect(Number.parseFloat(thumb?.style.left ?? ""), `段 ${s + 1} の全体の線の位置`).toBeCloseTo((left / layout.width) * 100, 0);
      expect(Number.parseFloat(thumb?.style.width ?? ""), `段 ${s + 1} の全体の線の幅`).toBeCloseTo((frame / layout.width) * 100, 0);
    });
    // 手で動かした時も、全体の線が見ている所に付いていく
    pan.scrollLeft = 0;
    pan.dispatchEvent(new Event("scroll"));
    expect(Number.parseFloat(thumb?.style.left ?? ""), "手で左の端へ動かした後の全体の線の位置").toBeCloseTo(0, 0);
    // 枠に収まる図は横に送らない
    const small = mount(exampleJson("swap.json"));
    expect(small.host.querySelector('[data-dragon="overview"]'), "枠に収まる図に全体の線がある").toBeNull();
  });
});

describe("配管の図の再生 (#3418)", () => {
  it("player-pipe-bar-shows-step-title", () => {
    prefersReducedMotion(true);
    const diagram = exampleJson("swap.json") as { steps: { title: string; body: string }[] };
    const { host, player } = mount(diagram);
    const shown = (name: string): HTMLElement | null => {
      const el = host.querySelector<HTMLElement>(`[data-dragon="${name}"]`);
      return el && !el.hidden && el.style.display !== "none" && getComputedStyle(el).display !== "none" ? el : null;
    };
    for (const s of [0, 5]) {
      player.goTo(s);
      expect((shown("step-no")?.textContent ?? "").replace(/\s/g, ""), `段 ${s + 1} の再生の欄の段の番号`).toMatch(new RegExp(`^0*${s + 1}/0*${diagram.steps.length}$`));
      expect(shown("step-title")?.textContent, `段 ${s + 1} の再生の欄の段の題`).toBe(diagram.steps[s]?.title);
      expect(shown("step-body"), `段 ${s + 1} の再生の欄に段の説明の文がある`).toBeNull();
    }
    // 読み上げには段の題と本文を今どおり出す
    const read = host.querySelector('[data-dragon="steps"] > li')?.textContent ?? "";
    expect(read, "読み上げの一覧に段の題が無い").toContain(diagram.steps[0]?.title ?? "?");
    expect(read, "読み上げの一覧に段の説明の文が無い").toContain(diagram.steps[0]?.body ?? "?");
  });

  it("player-pipe-call-record", () => {
    prefersReducedMotion(true);
    const { host, player } = mount(exampleJson("swap-two-hops.json"), { lang: "ja" });
    const record = host.querySelector<HTMLDetailsElement>('[data-dragon="call-record"]');
    expect(record, "図の下に呼び出しの記録が無い").not.toBeNull();
    if (!record) return;
    expect(record.tagName, "呼び出しの記録を畳めない").toBe("DETAILS");
    expect(record.open, "呼び出しの記録が初めから開いている").toBe(false);
    const svg = host.querySelector("svg");
    expect(svg && record.compareDocumentPosition(svg) & Node.DOCUMENT_POSITION_PRECEDING, "呼び出しの記録が図の下に無い").toBeTruthy();
    // 4 列の表は置かない
    expect(host.querySelector("table"), "図の下に表が残る").toBeNull();
    expect(record.querySelector("summary")?.textContent, "呼び出しの記録の題").toBe("呼び出しの結果");
    record.open = true;
    const cell = (el: HTMLElement, name: string): string => (el.querySelector(`[data-dragon="call-${name}"]`)?.textContent ?? "").replace(/\s+/g, " ").trim();
    /** 先頭に置くいちばん外の呼び出し (取引)。呼んだ側、呼ばれた側、中身、返した値か返り待ち */
    const deals = (): { from: string; to: string; what: string; value: string; now: boolean }[] =>
      [...record.querySelectorAll<HTMLElement>('[data-dragon="call-tx"]')].map((el) => ({ from: cell(el, "from"), to: cell(el, "to"), what: cell(el, "what"), value: cell(el, "value"), now: el.dataset.state === "now" }));
    /** 戻った内側の呼び出し。呼ばれた側、中身、返した値の 3 列 */
    const results = (): { to: string; what: string; value: string; now: boolean }[] =>
      [...record.querySelectorAll<HTMLElement>('[data-dragon="call"]')].map((el) => ({ to: cell(el, "to"), what: cell(el, "what"), value: cell(el, "value"), now: el.dataset.state === "now" }));
    // 段 1 は Alice が SwapRouter を呼ぶ。戻る前の取引は返り待ちと出し、内側の結果はまだ無い
    expect(deals(), "段 1 の取引").toEqual([{ from: "Alice", to: "SwapRouter", what: "100 USDCをDAIに交換", value: "返り待ち", now: false }]);
    expect(results(), "段 1 の呼び出しの結果").toEqual([]);
    // 段 3 は SwapRouter が USDC を呼んで true を返す。返した値が true だけの呼び出しは出さない
    player.goTo(2);
    expect(results(), "段 3 の呼び出しの結果").toEqual([]);
    // 段 12 は Pool2 が交換した値を返す。今の段で戻った行に印を付ける
    player.goTo(11);
    expect(results(), "段 12 の呼び出しの結果").toEqual([
      { to: "Pool1", what: "100 USDCを交換", value: "0.05 WETH", now: false },
      { to: "Pool2", what: "0.05 WETHを交換", value: "160 DAI", now: true },
    ]);
    // 最後の段は取引が返した値を出す
    player.goTo(12);
    expect(deals(), "最後の段の取引").toEqual([{ from: "Alice", to: "SwapRouter", what: "100 USDCをDAIに交換", value: "160 DAI", now: true }]);
    expect(results().map((r) => r.now), "最後の段で戻っていない行に印が付く").toEqual([false, false]);
    // 取り消した呼び出しは、返した値の欄に取り消しと出す
    const revert = mount(exampleJson("swap-revert.json"), { lang: "ja" });
    const revertRecord = revert.host.querySelector<HTMLDetailsElement>('[data-dragon="call-record"]');
    if (revertRecord) revertRecord.open = true;
    revert.player.goTo(9);
    const revertDeals = [...revert.host.querySelectorAll<HTMLElement>('[data-dragon="call-tx"]')].map((el) => [cell(el, "to"), cell(el, "value"), el.dataset.state ?? ""]);
    expect(revertDeals, "見本 swap-revert の段 10 の取引").toEqual([["SwapRouter", "✗ 取り消し", "now"]]);
    const revertResults = [...revert.host.querySelectorAll<HTMLElement>('[data-dragon="call"]')].map((el) => [cell(el, "to"), cell(el, "what"), cell(el, "value"), el.dataset.state ?? ""]);
    expect(revertResults, "見本 swap-revert の段 10 の呼び出しの結果").toEqual([["LiquidityPool", "100 USDCを交換", "✗ 取り消し", "now"]]);
  });

  it("player-pipe-zooms-and-pans", () => {
    prefersReducedMotion(true);
    const { host } = mount(exampleJson("swap.json"));
    const frame = host.querySelector<HTMLElement>('[data-dragon="zoom-frame"]');
    expect(frame, "拡大する枠が無い").not.toBeNull();
    if (!frame) return;
    const level = (): string => host.querySelector('[data-dragon="zoom-level"]')?.textContent ?? "";
    const svgWidth = (): number => Number.parseFloat(frame.querySelector<SVGElement>("svg")?.style.width || "0");
    expect(level(), "始めの拡大の度合い").toBe("100%");
    const base = svgWidth();
    expect(base, "図の幅").toBeGreaterThan(0);
    // 拡大と縮小の釦
    click(host, "zoom-in");
    expect(level(), "拡大の釦を押した後の度合い").toBe("125%");
    expect(svgWidth(), "拡大の釦を押した後の図の幅").toBeCloseTo(base * 1.25, 0);
    click(host, "zoom-out");
    expect(level(), "縮小の釦を押した後の度合い").toBe("100%");
    // Ctrl か Command を押しながらのホイールで拡大する。押さないホイールは拡大しない
    frame.dispatchEvent(new WheelEvent("wheel", { deltaY: -100, bubbles: true, cancelable: true }));
    expect(level(), "押さないホイールで拡大した").toBe("100%");
    const ctrl = new WheelEvent("wheel", { deltaY: -100, ctrlKey: true, bubbles: true, cancelable: true });
    frame.dispatchEvent(ctrl);
    expect(Number.parseInt(level(), 10), "Ctrl を押しながらのホイールで拡大しない").toBeGreaterThan(100);
    expect(ctrl.defaultPrevented, "Ctrl を押しながらのホイールで頁が拡大する").toBe(true);
    frame.dispatchEvent(new WheelEvent("wheel", { deltaY: 400, metaKey: true, bubbles: true, cancelable: true }));
    expect(level(), "Command を押しながらのホイールで縮小しない").toBe("100%");
    // ダブルクリックで押した所を中心に拡大する
    frame.dispatchEvent(new MouseEvent("dblclick", { clientX: 10, clientY: 10, bubbles: true }));
    expect(level(), "ダブルクリックの後の度合い").toBe("160%");
    // 拡大した図を引いて動かす
    frame.scrollLeft = 100;
    frame.scrollTop = 100;
    frame.dispatchEvent(new PointerEvent("pointerdown", { clientX: 200, clientY: 200, pointerId: 1, bubbles: true }));
    frame.dispatchEvent(new PointerEvent("pointermove", { clientX: 150, clientY: 170, pointerId: 1, bubbles: true }));
    frame.dispatchEvent(new PointerEvent("pointerup", { clientX: 150, clientY: 170, pointerId: 1, bubbles: true }));
    expect([frame.scrollLeft, frame.scrollTop], "引いて動かした後の位置").toEqual([150, 130]);
  });
});

describe("配管の図の下に段の動きを矢印で出す (#3450)", () => {
  type Flow = { kind: string; from: string; amount: string; to: string; tag: string };
  const rowsOf = (host: HTMLElement): HTMLElement[] => [...host.querySelectorAll<HTMLElement>('[data-dragon="flows"] [data-dragon="flow"]')];
  /** 今の段の矢印。送る側、量、受ける側、札を 1 本ずつ読む */
  const flowsOf = (host: HTMLElement): Flow[] =>
    rowsOf(host).map((row) => {
      const part = (name: string): string => (row.querySelector(`[data-dragon="flow-${name}"]`)?.textContent ?? "").replace(/\s+/g, " ").trim();
      return { kind: row.dataset.kind ?? "", from: part("from"), amount: part("amount"), to: part("to"), tag: part("tag") };
    });
  const KANA_KANJI = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;
  /** 全ての段を順に送り、図の下の矢印と要点の札と、開いた呼び出しの結果の字を集める */
  function shownTexts(host: HTMLElement, player: Player): { text: string; rows: number } {
    const record = host.querySelector<HTMLDetailsElement>('[data-dragon="call-record"]');
    if (record) record.open = true;
    const seen: string[] = [];
    let rows = 0;
    for (let s = 0; ; s++) {
      player.goTo(s);
      if (player.step !== s) break;
      rows += rowsOf(host).length;
      // 矢印と要点の札と、開いた呼び出しの結果は、図の下の入れ物にまとまる
      seen.push(host.querySelector('[data-dragon="calls"]')?.textContent ?? "");
    }
    return { text: seen.join(" "), rows };
  }

  it("player-pipe-flows-show-moves", () => {
    prefersReducedMotion(true);
    const two = mount(exampleJson("swap-two-hops.json"), { lang: "ja" });
    two.player.goTo(2);
    expect(flowsOf(two.host), "見本 swap-two-hops の段 3 の矢印").toEqual([{ kind: "move", from: "Alice", amount: "100 USDC", to: "Pool1", tag: "送る" }]);
    const agg = mount(exampleJson("aggregator.json"), { lang: "ja", open: [2] });
    agg.player.goTo(6);
    // 呼び出しと返した値は出さず、動いた値だけを出す
    expect(flowsOf(agg.host), "箱を開いた aggregator の段 7 の矢印").toEqual([
      { kind: "move", from: "Aggregator", amount: "25 USDC", to: "Pool3", tag: "送る" },
      { kind: "move", from: "Pool3", amount: "0.0125 WETH", to: "Aggregator", tag: "送る" },
    ]);
    expect(rowsOf(agg.host).map((r) => r.dataset.line), "動いた値の矢印が実線でない").toEqual(["solid", "solid"]);
  });

  it("player-pipe-flows-show-checks-and-reverts", () => {
    prefersReducedMotion(true);
    /** 今の段の行ごとの、部品の並び */
    const partsOf = (host: HTMLElement): (string | undefined)[][] =>
      rowsOf(host).map((row) => [...row.querySelectorAll<HTMLElement>('[data-dragon^="flow-"]')].map((el) => el.dataset.dragon));
    const swap = mount(exampleJson("swap.json"), { lang: "ja" });
    swap.player.goTo(8);
    expect(flowsOf(swap.host), "見本 swap の段 9 の確かめ").toEqual([{ kind: "check", from: "", amount: "0.05 WETH ≥ 0.04 WETH", to: "", tag: "✓ 満たす" }]);
    // 確かめは満たすかの札を式の前に置いた 1 行にする
    expect(partsOf(swap.host), "見本 swap の段 9 の確かめの部品の並び").toEqual([["flow-tag", "flow-amount"]]);
    const revert = mount(exampleJson("swap-revert.json"), { lang: "ja" });
    revert.player.goTo(8);
    expect(flowsOf(revert.host), "見本 swap-revert の段 9 の確かめ").toEqual([{ kind: "check", from: "", amount: "0.05 WETH ≥ 0.06 WETH", to: "", tag: "✗ 満たさない" }]);
    expect(partsOf(revert.host), "見本 swap-revert の段 9 の確かめの部品の並び").toEqual([["flow-tag", "flow-amount"]]);
    // 同じ理由で続けて取り消した呼び出しは、取り消した側から戻る先までの道 1 本にまとめ、理由を 1 回だけ出す
    revert.player.goTo(9);
    expect(flowsOf(revert.host), "見本 swap-revert の段 10 の取り消し").toEqual([{ kind: "revert", from: "LiquidityPool", amount: "INSUFFICIENT_OUTPUT_AMOUNT", to: "Alice", tag: "✗ 取り消し" }]);
    expect(partsOf(revert.host), "見本 swap-revert の段 10 の取り消しの部品の並び").toEqual([["flow-tag", "flow-amount", "flow-from", "flow-via", "flow-to"]]);
    const via = [...revert.host.querySelectorAll('[data-dragon="flows"] [data-dragon="flow-via"]')].map((el) => el.textContent?.trim());
    expect(via, "見本 swap-revert の段 10 の道の途中の関係者").toEqual(["SwapRouter"]);
  });

  it("player-pipe-flows-show-calls-and-returns", () => {
    prefersReducedMotion(true);
    const swap = mount(exampleJson("swap.json"), { lang: "ja" });
    expect(flowsOf(swap.host), "見本 swap の段 1 の呼び出し").toEqual([{ kind: "call", from: "Alice", amount: "100 USDCを交換", to: "SwapRouter", tag: "呼ぶ" }]);
    const agg = mount(exampleJson("aggregator.json"), { lang: "ja", open: [2] });
    agg.player.goTo(3);
    // 同じ段で戻った呼び出しは、返した側から返した値の矢印 1 本にまとめる
    expect(flowsOf(agg.host), "箱を開いた aggregator の段 4 の矢印").toEqual([
      { kind: "return", from: "Oracle", amount: "3200", to: "Aggregator", tag: "priceを返す" },
      { kind: "return", from: "Lib", amount: "40/35/25", to: "Aggregator", tag: "splitを返す" },
    ]);
    expect(rowsOf(agg.host).map((r) => r.dataset.line), "返した値の矢印が点線でない").toEqual(["dashed", "dashed"]);
    // 前の段で開いた呼び出しが戻る段は、返した値だけを出す
    const vault = mount(exampleJson("vault-proxy.json"), { lang: "ja" });
    vault.player.goTo(4);
    expect(flowsOf(vault.host), "見本 vault-proxy の段 5 の矢印").toEqual([{ kind: "return", from: "PriceOracle", amount: "3200", to: "VaultLogic", tag: "返す" }]);
  });

  it("player-pipe-flows-english", () => {
    prefersReducedMotion(true);
    for (const file of ["swap-two-hops.en.json", "swap-revert.en.json", "vault-proxy.en.json"]) {
      const { host, player } = mount(exampleJson(file), { lang: "en" });
      const { text, rows } = shownTexts(host, player);
      expect(rows, `${file} の図の下に矢印が無い`).toBeGreaterThan(0);
      expect(KANA_KANJI.test(text), `${file} の図の下の矢印か呼び出しの記録に仮名か漢字がある`).toBe(false);
    }
  });

  it("pipe-texts-cover-flows", () => {
    prefersReducedMotion(true);
    for (const [file, lang] of [
      ["swap-two-hops.json", "ja"],
      ["swap-revert.json", "ja"],
      ["vault-proxy.en.json", "en"],
    ] as const) {
      const source = exampleJson(file);
      const { host, player } = mount(source, { lang });
      const { text, rows } = shownTexts(host, player);
      expect(rows, `${file} の図の下に矢印が無い`).toBeGreaterThan(0);
      const model = (draw("renderDiagram")(source, { lang }) as unknown as { diagram: Parameters<typeof pipeTexts>[0] }).diagram;
      const known = new Set([...pipeTexts(model, lang).join("")]);
      const missing = [...new Set([...text.replace(/\s/g, "")])].filter((c) => !known.has(c));
      expect(missing, `${file} の図の下の字のうち、書き出した頁の字の file に残らない字`).toEqual([]);
    }
  });
});

describe("配管の図の段の要点の札 (#3464)", () => {
  it("player-pipe-shows-gist", () => {
    prefersReducedMotion(true);
    for (const [file, lang, label, word] of [
      ["swap.json", "ja", "要点", "確定"],
      ["swap.en.json", "en", "Key point", "final"],
    ] as const) {
      const source = exampleJson(file) as { steps: { gist?: string }[] };
      const gist = source.steps[13]?.gist;
      expect(gist, `${file} の段 14 が要点を持たない`).toBeDefined();
      const { host, player } = mount(source, { lang });
      const note = (): HTMLElement | null => host.querySelector<HTMLElement>('[data-dragon="calls"] [data-dragon="gist"]');
      const part = (name: string): string | undefined => note()?.querySelector(`[data-dragon="gist-${name}"]`)?.textContent ?? undefined;
      // 要点を持たない段には札を出さない
      expect(note(), `${file} の段 1 に要点の札がある`).toBeNull();
      player.goTo(13);
      expect(part("label"), `${file} の段 14 の要点の札の名札`).toBe(label);
      expect(part("text"), `${file} の段 14 の要点の札の文`).toBe(gist);
      expect((part("text") ?? "").toLowerCase(), `${file} の段 14 の要点の札の文`).toContain(word);
      // 札は段の矢印の後に置く
      const flows = host.querySelector('[data-dragon="flows"]');
      const shown = note();
      expect(flows && shown ? flows.compareDocumentPosition(shown) & Node.DOCUMENT_POSITION_FOLLOWING : 0, `${file} の要点の札が矢印の後に無い`).toBeTruthy();
      player.goTo(1);
      expect(note(), `${file} の段 2 に戻っても段 14 の要点の札が消えない`).toBeNull();
      // 読み上げの段の一覧は、要点を持つ段に要点の文を出す
      const items = [...host.querySelectorAll('[data-dragon="steps"] > li')];
      expect(items[13]?.querySelector('[data-dragon="step-gist"]')?.textContent, `${file} の読み上げの段 14 の要点`).toBe(gist);
      expect(items[0]?.querySelector('[data-dragon="step-gist"]'), `${file} の読み上げの段 1 に要点がある`).toBeNull();
    }
  });
});

describe("携帯の幅で配管の図の字を読める大きさに置く (#3450)", () => {
  /** 携帯の幅の枠で配管の図に求める、画面で見える残高の字の大きさの下限 (`look/pipe.ts` の `narrow.px`) */
  const READABLE_PX = 10.5;
  const PHONE = 390;

  type PipeShown = { layout: { width: number; levels: { text: { h: number } }[] } };

  /** 幅 `PHONE` の枠に配管の見本を置き、置いた枠と図の幅と、画面で見える残高の字の大きさを返す */
  function placeOnPhone(file: string, lang: "ja" | "en", open?: number[]): { host: HTMLElement; shown: number; px: number; frame: HTMLElement | null } {
    prefersReducedMotion(true);
    const source = exampleJson(file);
    const host = document.createElement("div");
    Object.defineProperty(host, "clientWidth", { value: PHONE });
    document.body.appendChild(host);
    players.push(draw("mountDiagram")(host, source, { lang, ...(open ? { open } : {}) }));
    const { layout } = draw("renderDiagram")(source, { lang, width: PHONE, ...(open ? { open } : {}) }) as unknown as PipeShown;
    const frame = host.querySelector<HTMLElement>('[data-dragon="pan"],[data-dragon="zoom-frame"]');
    const shown = Number.parseFloat(frame?.querySelector<SVGElement>("svg")?.style.width || "0");
    const level = layout.levels[0];
    expect(level, `${file} の槽の残高の字が無い`).toBeDefined();
    return { host, shown, px: ((level?.text.h ?? 0) * shown) / layout.width, frame };
  }

  // 言葉ごとに件を分け、1 件が混んだ機械でも上限に収まるようにする
  describe.for(["ja", "en"] as const)("%s", (lang) => {
    it("player-pipe-narrow-keeps-text-readable", () => {
      const file = lang === "ja" ? "aggregator.json" : "aggregator.en.json";
      const { host, shown, px, frame } = placeOnPhone(file, lang, [2]);
      expect(px, `箱を開いた aggregator (${lang}) を幅 ${PHONE} に置いた残高の字 (置いた図の幅 ${Math.round(shown)}px)`).toBeGreaterThanOrEqual(READABLE_PX);
      // 字を読める幅で置くと枠より広くなるので、縮めずに横に送り、全体のどこを見ているかを線で示す
      expect(frame?.dataset.dragon, "幅に収まらない図を横に送る枠にしていない").toBe("pan");
      expect(host.querySelector('[data-dragon="overview"] [data-dragon="overview-thumb"]'), "全体のどこを見ているかを示す線が無い").not.toBeNull();
    });
  });

  // 字が読める図は今どおり枠の幅に収める。見本ごとに件を分ける
  const FITTING = ["swap.json", "swap-revert.json", "swap-two-hops.json", "swap-retry.json", "vault-proxy.json", "aggregator.json"] as const;
  describe.for(FITTING)("%s", (file) => {
    it("player-pipe-narrow-fits-readable-figures", () => {
      const { shown, px, frame } = placeOnPhone(file, "ja");
      expect(frame?.dataset.dragon, `${file} を幅 ${PHONE} に置いた枠が横に送る形になる`).toBe("zoom-frame");
      expect(shown, `${file} を幅 ${PHONE} に置いた図の幅`).toBeCloseTo(PHONE, 0);
      expect(px, `${file} を幅 ${PHONE} に置いた残高の字`).toBeGreaterThanOrEqual(READABLE_PX);
    });
  });
});

describe("段を送る時に図を置き直さない (#3445)", () => {
  /** 置いた SVG の動きの変数と、止めているか流しているか */
  const clock = (svg: SVGSVGElement | null): { at: string | undefined; play: string | undefined; motion: string | null | undefined } => ({
    at: svg?.style.getPropertyValue("--at"),
    play: svg?.style.getPropertyValue("--play"),
    motion: svg?.getAttribute("data-motion"),
  });

  it("player-goto-keeps-the-figure", () => {
    prefersReducedMotion(true);
    const diagram = exampleJson("oauth.json");
    const { timeline } = draw("renderDiagram")(diagram);
    const { host, player } = mount(diagram);
    const svg = host.querySelector("svg");
    expect(svg, "図が置かれていない").not.toBeNull();
    // 段を送ると、同じ図の動きの変数を替えて、その段の止め絵で止める
    player.goTo(2);
    expect(host.querySelector("svg"), "段を送ると図の SVG を写して置き直す").toBe(svg);
    expect(clock(svg), "段 3 へ送った図の動きの変数").toEqual({ at: String(timeline.stills[2]), play: "paused", motion: "still" });
    // 再生の釦で流し直した時も同じ図のまま、流す変数に替える
    click(host, "toggle");
    expect(player.playing, "再生の釦で流れない").toBe(true);
    expect(host.querySelector("svg"), "流し直すと図の SVG を写して置き直す").toBe(svg);
    expect(clock(svg), "流し直した図の動きの変数").toEqual({ at: String(timeline.stills[2]), play: "running", motion: "play" });
  });

  it("player-goto-rewinds-animations", () => {
    prefersReducedMotion(true);
    // jsdom は動きを持たないので、図の中の動きを偽の動きに差し替え、時刻を 0 に戻したかを読む
    const fakes = [{ currentTime: 0 as number | null }, { currentTime: 0 as number | null }];
    const asked: { tag: string; subtree: boolean }[] = [];
    const proto = Element.prototype as unknown as { getAnimations?: (options?: { subtree?: boolean }) => unknown[] };
    proto.getAnimations = function (this: Element, options?: { subtree?: boolean }) {
      asked.push({ tag: this.tagName.toLowerCase(), subtree: options?.subtree === true });
      return fakes;
    };
    try {
      const { host, player } = mount(exampleJson("oauth.json"));
      // 流れた後の時刻が残っている動きを、段を送った時に 0 へ戻す
      for (const f of fakes) f.currentTime = 1500;
      player.goTo(2);
      expect(fakes.map((f) => f.currentTime), "段を送った後の動きの時刻").toEqual([0, 0]);
      expect(asked.some((a) => a.tag === "svg" && a.subtree), "図の SVG の中の全ての動きを引いていない").toBe(true);
      // 再生の釦で流し直す時も 0 へ戻し、動きの時計を最初から数え直す
      for (const f of fakes) f.currentTime = 800;
      click(host, "toggle");
      expect(player.playing, "再生の釦で流れない").toBe(true);
      expect(fakes.map((f) => f.currentTime), "流し直した後の動きの時刻").toEqual([0, 0]);
      expect(host.querySelector("svg"), "図が置かれていない").not.toBeNull();
    } finally {
      delete proto.getAnimations;
    }
    // getAnimations を持たない環境では時刻を戻す所を飛ばし、止まらずに段を送る
    const { player } = mount(exampleJson("oauth.json"));
    expect(() => player.goTo(3), "getAnimations を持たない環境で段を送ると止まる").not.toThrow();
    expect(player.step).toBe(3);
  });

  it("player-goto-costs-less-than-mount", () => {
    prefersReducedMotion(true);
    // 段を送る手間を、同じ図を置く手間と比べる。秒ではなく比で見るので、機械が混んでいても両方が同じだけ遅れる。
    // 配管の図は組んだ置き場所を原本ごとに覚えるので、題を替えて前の件が組んだ覚えを使わせず、置く手間を件の順に依らせない
    const source = exampleJson("swap-two-hops.json") as { steps: unknown[] };
    const diagram = { ...source, title: "段の送りの手間を測る図 (#3445)" } as Json;
    const ms = (u: NodeJS.CpuUsage): number => (u.user + u.system) / 1000;
    const placing = process.cpuUsage();
    const { player } = mount(diagram, { lang: "ja" });
    const placed = ms(process.cpuUsage(placing));
    const sending = process.cpuUsage();
    for (let s = 0; s < source.steps.length; s++) player.goTo(s);
    const sent = ms(process.cpuUsage(sending));
    expect(sent, `全ての段を送る CPU 時間 (${Math.round(sent)}ms) が、図を置く CPU 時間 (${Math.round(placed)}ms) の 4 分の 1 以上`).toBeLessThan(placed / 4);
  });
});
