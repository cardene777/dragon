// @vitest-environment jsdom
/**
 * 1 つの図に複数の場面を持たせ、並べて見せるか選んで追うかを選ぶ (#3878)。
 *
 * 箱と全ての場面に共通の段は図で 1 回だけ書き、`scene <名前>` と `end` の間に、分かれる所から先のその場面だけの段を書く。
 * 止まる段の中に `stop <理由>` を書くと、場面はその段で止まって理由の文を出す。場面は 3 つまで書ける。
 * 1 行目の `[scenes: stack]` は場面を縦に並べて同じ段の送りで同時に動かし、`[scenes: pick]` は場面の名前の釦で選んだ 1 つの場面を追う。
 * 書かない図は並べる見せ方で描く。並べる見せ方は同じ箱を全ての場面で同じ横の位置に描き、共通の段の線を灰色、場面の段の線を場面の色で描いて、
 * 分かれる位置に縦の点線を引く。印刷の形では、どちらの見せ方でも全ての場面を最後の段まで進めて縦に並べる。
 *
 * 検査は手順の図と列の図に同じ書き方で 2 つの場面を書き、場面ごとに描いた図 (`renderDiagram` の `scenes`) と、頁に置いた再生の部品を確かめる。
 * 画面の大きさを測れない jsdom では、押した箱と場面の枠の四角を検査が決め、札をその四角から置く位置を確かめる。
 * 場面を持つ図は寄って追わず、見せ方を選ぶ決まりは枠の幅に依らず止めた形を選ぶ (#4018)。
 * 検査は種類を登録しない入口と、使う 2 つの種類の登録の file だけを読む (#3763)。
 */
import { afterEach, describe, expect, it } from "vitest";
import "./built-globals";
import * as dragon from "../src/core";
import "../src/kind-use/flow";
import "../src/kind-use/lineup";
import { atLoad } from "./at-load";

/** 2 つの場面の名前。どちらの種類の図も同じ名前で書く */
const PASS = "通る送金";
const WRONG = "宛先が違う送金";
/** 宛先が違う送金の場面が止まる理由 */
const REASON = "宛先が登録されていない";

/**
 * 手順の図の 2 つの場面。共通の段は 2 つで、通る送金は 2 段を足して 4 段、宛先が違う送金は 1 段を足して 3 段目で止まる。
 * `head` は 1 行目の後ろに書く属性、`look` は宛先を確かめる箱の行の属性
 */
const flowScenes = (head = "", look = ""): string =>
  `flow 送金${head}\n\n` +
  "box ask as 送金を頼む\n" +
  `box look as 宛先を確かめる${look}\n` +
  "box send as 送る\n" +
  "box back as 差し戻す\n\n" +
  "step 頼む\n  say 利用者が送金を頼む。\n  start -> ask\n\n" +
  "step 確かめる\n  say 宛先を確かめる。\n  ask -> look: 宛先\n\n" +
  `scene ${PASS}\n` +
  "  step 送る\n    say 宛先が正しいので送る。\n    look -> send: 正しい\n" +
  "  step 終える\n    say 送金を終える。\n    send -> finish\n" +
  "end\n\n" +
  `scene ${WRONG}\n` +
  `  step 差し戻す\n    say 宛先が違うので差し戻す。\n    look -> back: 違う\n    stop ${REASON}\n` +
  "end\n";

/** 列の図の 2 つの場面。手順の図と同じく共通の段は 2 つで、通る送金は 4 段、宛先が違う送金は 3 段目で止まる */
const lineupScenes = (head = ""): string =>
  `lineup 送金の列${head}\n\n` +
  "box wait as 待ち\n" +
  "box done as 済み\n" +
  "box out as 戻した\n\n" +
  "item a, b, c\n\n" +
  "step 並ぶ\n  say 3つの送金が待ちに並ぶ。\n  line wait: a, b, c\n\n" +
  "step 並べ替える\n  say 急ぎの順に並べ替える。\n  line wait: a, c, b\n\n" +
  `scene ${PASS}\n` +
  "  step 送る\n    say 先頭を済みへ送る。\n    line wait: c, b\n    line done: a\n" +
  "  step 続ける\n    say 次も済みへ送る。\n    line wait: b\n    line done: a, c\n" +
  "end\n\n" +
  `scene ${WRONG}\n` +
  `  step 戻す\n    say 先頭を戻した列へ移す。\n    line wait: c, b\n    line out: a\n    stop ${REASON}\n` +
  "end\n";

/** 場面ごとの段の数。共通の 2 段と、場面だけの段 */
const COUNTS = [4, 3];
/** 共通の段の数 */
const COMMON = 2;

/** 場面ごとに描いた図。名前と止まる理由と場面の色と、描いた図の形 */
type SceneRendered = dragon.Rendered & { name: string; stop?: string; color: string; common: number };
type Scened = dragon.Rendered & { scenes?: SceneRendered[] };

interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
}
interface Edge {
  step: number;
  from: string;
  to: string;
  color: string;
}

/** 記法を読んだ原本。読めない時は判定の文で落とし、`undefined` を返す */
function diagramOf(text: string): unknown {
  const parsed = dragon.parseNotation(text, { lang: "ja" });
  expect(parsed.ok, `記法を読めない: ${parsed.ok ? "" : parsed.errors.map((e) => `${e.line}:${e.column} ${e.message}`).join(" / ")}`).toBe(true);
  return parsed.ok ? parsed.diagram : undefined;
}

/** 記法を描いた図と、場面ごとに描いた図。場面を描かない時は判定の文で落とし、`undefined` を返す */
function scenesOf(text: string, options: dragon.RenderOptions = {}): { rendered: Scened; scenes: SceneRendered[] } | undefined {
  const diagram = diagramOf(text);
  if (diagram === undefined) return undefined;
  const rendered = dragon.renderDiagram(diagram, { lang: "ja", ...options }) as Scened;
  expect(rendered.scenes?.map((s) => s.name), "場面ごとに描いた図の名前").toEqual([PASS, WRONG]);
  return rendered.scenes ? { rendered, scenes: rendered.scenes } : undefined;
}

/** 描いた SVG を要素にする */
function svgOf(markup: string): Element {
  const holder = document.createElement("div");
  holder.innerHTML = markup;
  return holder.querySelector("svg") ?? holder;
}

const boxesOf = (r: { layout: unknown }): Box[] => (r.layout as { boxes: Box[] }).boxes;
/** 列の図の列。列の図は箱を列として描く */
const lanesOf = (r: { layout: unknown }): Box[] => (r.layout as { lanes?: Box[] }).lanes ?? boxesOf(r);
const edgesOf = (r: { layout: unknown }): Edge[] => (r.layout as { edges: Edge[] }).edges;
/** 線の両端の組 (`送る側>受ける側`) */
const pairsOf = (r: { layout: unknown }): string[] => edgesOf(r).map((e) => `${e.from}>${e.to}`);

/** 要素の `transform="translate(x y)"` の縦の位置 */
const translateY = (el: Element): number => Number(/translate\(\s*[-\d.]+[\s,]+([-\d.]+)\s*\)/u.exec(el.getAttribute("transform") ?? "")?.[1] ?? Number.NaN);

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 要素の四角を決める。jsdom は画面の大きさを測らないので、押した箱と場面の枠の四角を検査が渡す */
function placeAt(el: Element | null, rect: Rect): void {
  if (!el) return;
  const value = { ...rect, x: rect.left, y: rect.top, right: rect.left + rect.width, bottom: rect.top + rect.height, toJSON: () => rect };
  Object.defineProperty(el, "getBoundingClientRect", { configurable: true, value: () => value });
}

/** 頁に置いた図。検査の終わりに外す */
const mounted: { destroy(): void }[] = [];
const hosts: HTMLElement[] = [];

/** 記法 `text` の図を頁に置く。置けない時は判定の文で落とし、`undefined` を返す */
function mount(text: string): { host: HTMLElement; player: dragon.Player } | undefined {
  const diagram = diagramOf(text);
  if (diagram === undefined) return undefined;
  const host = document.createElement("div");
  document.body.appendChild(host);
  hosts.push(host);
  const player = dragon.mountDiagram(host, diagram, { lang: "ja" });
  mounted.push(player);
  return { host, player };
}

/** 場面の枠。並べる見せ方では全ての場面、選ぶ見せ方では全ての場面を持ち、選ばない場面を隠す */
const panelsOf = (host: ParentNode): HTMLElement[] => [...host.querySelectorAll<HTMLElement>('[data-dragon="scene"]')];
const panelOf = (host: ParentNode, name: string): HTMLElement | null => host.querySelector<HTMLElement>(`[data-dragon="scene"][data-scene="${name}"]`);
/** 場面の枠が見せている段 (0 から) */
const stepOf = (panel: HTMLElement | null): number => Number(panel?.dataset.step ?? Number.NaN);
/** 場面の枠の止まる理由の文。見せている時だけ字を返す */
const shownReason = (panel: HTMLElement | null): string | undefined => {
  const reason = panel?.querySelector<HTMLElement>('[data-dragon="scene-stop"]');
  return reason && !reason.hidden ? (reason.textContent ?? "") : undefined;
};
/** 場面の枠の図の、今の時刻 (`--at`) */
const atOf = (panel: HTMLElement | null): number => Number.parseFloat(panel?.querySelector<SVGSVGElement>("svg")?.style.getPropertyValue("--at") ?? "");

/** 要素を押す。押した所から上の要素へ伝わる */
const press = (el: Element | null): void => {
  el?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
};

afterEach(() => {
  for (const player of mounted.splice(0)) player.destroy();
  for (const host of hosts.splice(0)) host.remove();
  document.body.innerHTML = "";
  document.head.innerHTML = "";
});

/**
 * 場面を持つ図を描き、図の幅の半分の枠で見せ方を選ぶ決まり (`chooseView`) が選んだ見せ方 (#4018)。
 * 半分の幅に収めると箱の名前の字が 10.5px を下回り、場面を持たない図なら寄って追う形を選ぶ
 */
const HALF_VIEWS = await atLoad("場面を持つ図の見せ方を半分の幅で選ぶ", () =>
  (
    [
      ["flow", flowScenes()],
      ["lineup", lineupScenes()],
    ] as const
  ).map(([kind, text]) => {
    const parsed = dragon.parseNotation(text, { lang: "ja" });
    if (!parsed.ok) throw new Error(`${kind} の記法を読めない: ${JSON.stringify(parsed.errors)}`);
    const rendered = dragon.renderDiagram(parsed.diagram, { lang: "ja" });
    const frame = rendered.layout.width / 2;
    return { kind, frame, scenes: rendered.scenes?.length ?? 0, view: dragon.chooseView(rendered, frame) };
  }),
);

describe("1 つの図の場面 (#3878)", () => {
  it("scenes-stack-same-box-positions", () => {
    const read = scenesOf(flowScenes());
    if (!read) return;
    const { rendered, scenes } = read;
    // 同じ箱は全ての場面で同じ横の位置に、同じ大きさで描く
    const [first, second] = scenes.map(boxesOf);
    expect(first?.map((b) => b.id).sort(), "場面ごとの箱").toEqual(["ask", "back", "look", "send"]);
    for (const box of first ?? []) {
      const same = second?.find((b) => b.id === box.id);
      expect(same, `${WRONG} の場面に箱 ${box.id} が無い`).toBeDefined();
      expect(same?.x, `箱 ${box.id} の横の位置が場面で違う`).toBeCloseTo(box.x, 6);
      expect(same?.w, `箱 ${box.id} の幅が場面で違う`).toBeCloseTo(box.w, 6);
    }
    // 描いた図は場面を書いた順に上から縦に並べ、場面どうしが重ならない
    const groups = [...svgOf(rendered.svg).querySelectorAll('[data-dragon="scene"]')];
    expect(groups.map((g) => g.getAttribute("data-scene")), "縦に並べた場面の順").toEqual([PASS, WRONG]);
    const [top, below] = groups.map(translateY);
    expect(below ?? Number.NaN, `${WRONG} の場面 (${below}) が ${PASS} の場面 (${top}) の高さより下に無い`).toBeGreaterThanOrEqual((top ?? 0) + (scenes[0]?.layout.height ?? 0));
    expect(rendered.layout.height, "縦に並べた図の高さが 2 つの場面の高さより低い").toBeGreaterThanOrEqual(scenes.reduce((sum, s) => sum + s.layout.height, 0));
  });

  it("scenes-own-steps-only-in-their-scene", () => {
    const read = scenesOf(flowScenes());
    if (!read) return;
    const [pass, wrong] = read.scenes;
    if (!pass || !wrong) return;
    // 共通の段の線は全ての場面に描き、場面だけの段の線はその場面にだけ描く
    expect(pairsOf(pass), `${PASS} の場面の線`).toEqual(["start>ask", "ask>look", "look>send", "send>finish"]);
    expect(pairsOf(wrong), `${WRONG} の場面の線`).toEqual(["start>ask", "ask>look", "look>back"]);
    // 場面ごとの段は、共通の段とその場面の段だけ
    expect(pass.diagram.steps.map((s) => s.title), `${PASS} の場面の段`).toEqual(["頼む", "確かめる", "送る", "終える"]);
    expect(wrong.diagram.steps.map((s) => s.title), `${WRONG} の場面の段`).toEqual(["頼む", "確かめる", "差し戻す"]);
    // 描いた SVG も、場面の線の数だけ段で引く線を持つ
    for (const scene of [pass, wrong]) expect(svgOf(scene.svg).querySelectorAll("path.dg-e-on").length, `${scene.name} の場面の SVG の線の数`).toBe(edgesOf(scene).length);
  });

  it("scenes-stop-holds-and-shows-reason", () => {
    const placed = mount(flowScenes());
    const read = scenesOf(flowScenes());
    if (!placed || !read) return;
    const { host, player } = placed;
    const [pass, wrong] = [panelOf(host, PASS), panelOf(host, WRONG)];
    expect(pass && wrong, "並べる見せ方の 2 つの場面の枠").toBeTruthy();
    expect(panelsOf(host).every((p) => !p.hidden), "並べる見せ方で隠した場面").toBe(true);
    player.goTo(0);
    // 並べる見せ方の段の数は、最も長い場面の段の数
    expect(host.querySelectorAll('[data-dragon="segment"]').length, "並べる見せ方の段の数").toBe(Math.max(...COUNTS));
    const wrongStills = read.scenes[1]?.timeline.stills ?? [];
    /** 段 `step` で、2 つの場面の枠が見せる段と、出している理由の文 */
    const expected: [number, number, number, string | undefined][] = [
      [0, 0, 0, undefined],
      [1, 1, 1, undefined],
      // 宛先が違う送金は stop を書いた 3 段目に着くと止まり、理由の文を出す
      [2, 2, 2, REASON],
      // 次の段では通る送金だけが進み、宛先が違う送金は 3 段目のまま理由の文を出し続ける
      [3, 3, 2, REASON],
    ];
    for (const [step, passStep, wrongStep, reason] of expected) {
      if (step > 0) press(host.querySelector('[data-dragon="next"]'));
      expect(player.step, `次へ ${step} 回の後の段`).toBe(step);
      expect(stepOf(pass), `段 ${step + 1} の ${PASS} の場面の段`).toBe(passStep);
      expect(stepOf(wrong), `段 ${step + 1} の ${WRONG} の場面の段`).toBe(wrongStep);
      expect(shownReason(wrong), `段 ${step + 1} の ${WRONG} の場面の理由の文`).toBe(reason);
      expect(shownReason(pass), `段 ${step + 1} の ${PASS} の場面の理由の文`).toBeUndefined();
      // 止まった場面の図は、止まった段の止め絵の時刻に留まる
      expect(atOf(wrong), `段 ${step + 1} の ${WRONG} の場面の図の時刻`).toBeCloseTo(wrongStills[wrongStep] ?? Number.NaN, 3);
    }
    // 最後の段より先へは進まない
    press(host.querySelector('[data-dragon="next"]'));
    expect(player.step, "最後の段で次へ押した後の段").toBe(3);
    expect(stepOf(wrong), "最後の段で次へ押した後の宛先が違う送金の場面の段").toBe(2);
  });

  it("scenes-fork-line-and-colors", () => {
    const read = scenesOf(flowScenes());
    if (!read) return;
    const colors = read.scenes.map((s) => s.color);
    // 場面の色は場面ごとに違い、灰色ではない
    expect(new Set(colors).size, "場面の色が場面ごとに違わない").toBe(2);
    expect(colors, "場面の色に灰色がある").not.toContain("slate");
    for (const scene of read.scenes) {
      // 共通の段の線は灰色、場面の段の線は場面の色
      const edges = edgesOf(scene);
      expect(edges.filter((e) => e.step < COMMON).map((e) => e.color), `${scene.name} の共通の段の線の色`).toEqual(["slate", "slate"]);
      expect(edges.filter((e) => e.step >= COMMON).map((e) => e.color), `${scene.name} の場面の段の線の色`).toEqual(edges.filter((e) => e.step >= COMMON).map(() => scene.color));
      // 分かれる位置に縦の点線を 1 本引く。分かれるのは宛先を確かめる箱で、点線はその箱の左に在る
      const forks = [...svgOf(scene.svg).querySelectorAll('[data-dragon="scene-fork"]')];
      expect(forks.length, `${scene.name} の場面の分かれる位置の点線の数`).toBe(1);
      const fork = forks[0];
      const look = boxesOf(scene).find((b) => b.id === "look");
      if (!fork || !look) continue;
      const [x1, x2, y1, y2] = ["x1", "x2", "y1", "y2"].map((k) => Number(fork.getAttribute(k)));
      expect(x1, `${scene.name} の点線が縦でない`).toBeCloseTo(x2 ?? Number.NaN, 6);
      expect((y2 ?? 0) - (y1 ?? 0), `${scene.name} の点線の長さ`).toBeGreaterThan(0);
      expect(fork.getAttribute("stroke-dasharray") ?? "", `${scene.name} の分かれる位置の線が点線でない`).not.toBe("");
      expect((x1 ?? Number.NaN) <= look.x && (x1 ?? Number.NaN) > look.x - 40, `${scene.name} の点線 (${x1}) が宛先を確かめる箱 (${look.x}) のすぐ左に無い`).toBe(true);
    }
    // 選ぶ見せ方は 1 つの場面ずつ見せるので、分かれる位置の点線を引かない
    const picked = scenesOf(flowScenes(" [scenes: pick]"));
    for (const scene of picked?.scenes ?? []) expect(svgOf(scene.svg).querySelectorAll('[data-dragon="scene-fork"]').length, `選ぶ見せ方の ${scene.name} の点線の数`).toBe(0);
  });

  it("scenes-pick-buttons-follow-one-scene", () => {
    const placed = mount(flowScenes(" [scenes: pick]"));
    if (!placed) return;
    const { host, player } = placed;
    const buttons = [...host.querySelectorAll<HTMLButtonElement>('[data-dragon="scene-pick"]')];
    // 場面の名前をそのまま釦の字にする
    expect(buttons.map((b) => b.textContent), "選ぶ見せ方の釦の字").toEqual([PASS, WRONG]);
    const pressed = (): string[] => buttons.filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.textContent ?? "");
    const shown = (): string[] => panelsOf(host).filter((p) => !p.hidden).map((p) => p.dataset.scene ?? "");
    // 置いた時は最初の場面を選び、その場面だけを見せる
    expect(pressed(), "置いた時に選んだ場面").toEqual([PASS]);
    expect(shown(), "置いた時に見せる場面").toEqual([PASS]);
    player.goTo(2);
    expect(stepOf(panelOf(host, PASS)), "通る送金の場面の 3 段目").toBe(2);
    // 釦を押すと、その場面の 1 段目に戻って、その場面だけを見せる
    press(buttons[1] ?? null);
    expect(pressed(), "宛先が違う送金の釦を押した後に選んだ場面").toEqual([WRONG]);
    expect(shown(), "宛先が違う送金の釦を押した後に見せる場面").toEqual([WRONG]);
    expect(player.step, "釦を押した後の段").toBe(0);
    expect(stepOf(panelOf(host, WRONG)), "釦を押した後の宛先が違う送金の場面の段").toBe(0);
    // 段の数は選んだ場面の段の数
    expect(host.querySelectorAll('[data-dragon="segment"]').length, "宛先が違う送金の場面の段の数").toBe(COUNTS[1]);
    // 段を送ると選んだ場面の段だけを進め、止まる段で理由の文を出す
    press(host.querySelector('[data-dragon="next"]'));
    expect(stepOf(panelOf(host, WRONG)), "次へ 1 回の後の宛先が違う送金の場面の段").toBe(1);
    expect(shownReason(panelOf(host, WRONG)), "止まる段の前の理由の文").toBeUndefined();
    press(host.querySelector('[data-dragon="next"]'));
    expect(stepOf(panelOf(host, WRONG)), "次へ 2 回の後の宛先が違う送金の場面の段").toBe(2);
    expect(shownReason(panelOf(host, WRONG)), "止まる段の理由の文").toBe(REASON);
    expect(stepOf(panelOf(host, PASS)), "選ばない通る送金の場面の段が進んだ").toBe(2);
    expect(host.querySelector('[data-dragon="step-title"]')?.textContent, "止まる段の題").toBe("差し戻す");
    // 止まる段の先へは進まない
    press(host.querySelector('[data-dragon="next"]'));
    expect(player.step, "止まる段で次へ押した後の段").toBe(2);
  });

  it("scenes-same-in-flow-and-lineup", () => {
    /** 種類ごとの、場面の名前と段の数と止まる理由と、置いた再生の部品の場面の枠 */
    const shapes: Record<string, unknown> = {};
    for (const [kind, text] of [
      ["flow", flowScenes()],
      ["lineup", lineupScenes()],
    ] as const) {
      const read = scenesOf(text);
      const placed = mount(text);
      if (!read || !placed) continue;
      // 同じ箱 (列の図の列) は全ての場面で同じ横の位置に描く
      const [first, second] = read.scenes.map(lanesOf);
      for (const lane of first ?? []) expect(second?.find((l) => l.id === lane.id)?.x, `${kind} の ${lane.id} の横の位置が場面で違う`).toBeCloseTo(lane.x, 6);
      placed.player.goTo(3);
      shapes[kind] = {
        scenes: read.scenes.map((s) => ({ name: s.name, steps: s.diagram.steps.length, common: s.common, ...(s.stop === undefined ? {} : { stop: s.stop }) })),
        panels: panelsOf(placed.host).map((p) => ({ name: p.dataset.scene, step: stepOf(p), reason: shownReason(p) ?? null, title: p.querySelector('[data-dragon="scene-name"]')?.textContent })),
      };
    }
    expect(Object.keys(shapes), "場面を描けた図の種類").toEqual(["flow", "lineup"]);
    expect(shapes.flow, "手順の図の場面").toEqual({
      scenes: [
        { name: PASS, steps: COUNTS[0], common: COMMON },
        { name: WRONG, steps: COUNTS[1], common: COMMON, stop: REASON },
      ],
      panels: [
        { name: PASS, step: 3, reason: null, title: PASS },
        { name: WRONG, step: 2, reason: REASON, title: WRONG },
      ],
    });
    // 列の図も同じ書き方で同じ場面を持つ
    expect(shapes.lineup, "列の図の場面が手順の図と違う").toEqual(shapes.flow);
  });

  it("scenes-print-stacks-all-at-last-step", () => {
    for (const head of ["", " [scenes: pick]"]) {
      const placed = mount(flowScenes(head));
      const read = scenesOf(flowScenes(head));
      if (!placed || !read) continue;
      const { host } = placed;
      // 場面の枠は全ての場面の分を持ち、それぞれの図に最後の段の止め絵の時刻 (`--dg-last`) を持つ
      expect(panelsOf(host).map((p) => p.dataset.scene), `${head || "既定"} の場面の枠`).toEqual([PASS, WRONG]);
      for (const [k, scene] of read.scenes.entries()) {
        const svg = panelsOf(host)[k]?.querySelector<SVGSVGElement>("svg");
        const last = scene.timeline.stills[scene.timeline.steps.length - 1] ?? Number.NaN;
        expect(Number.parseFloat(svg?.style.getPropertyValue("--dg-last") ?? ""), `${head || "既定"} の ${scene.name} の最後の段の時刻`).toBeCloseTo(last, 3);
      }
      // 止まる場面は、印刷の形で出す理由の文を持つ
      expect(panelOf(host, WRONG)?.querySelector('[data-dragon="scene-stop"]')?.textContent, `${head || "既定"} の止まる場面の理由の文`).toBe(REASON);
    }
    // 印刷の形では、隠した場面も見せ、全ての場面の図を最後の段の止め絵で止める
    const css = document.getElementById("dragon-scenes-css")?.textContent ?? "";
    const print = /@media print\{(.*)\}$/su.exec(css)?.[1] ?? "";
    expect(print, "場面の見た目の規則に印刷の形が無い").not.toBe("");
    expect(print, "印刷の形で隠した場面を見せる決まりが無い").toMatch(/\.dg-scene(?:\[hidden\])?\{display:block/u);
    expect(print, "印刷の形で場面の図を最後の段で止める決まりが無い").toMatch(/--at:var\(--dg-last\)\s*!important/u);
    expect(print, "印刷の形で場面の図を止める決まりが無い").toMatch(/--play:paused\s*!important/u);
    expect(print, "印刷の形で止まる場面の理由の文を出す決まりが無い").toMatch(/\.dg-scene-stop\[data-final\]\{display:block/u);
  });

  it("scenes-print-shows-every-scene", () => {
    for (const head of ["", " [scenes: pick]"]) {
      const placed = mount(flowScenes(head));
      if (!placed) continue;
      // 場面の枠は全ての場面の分を書いた順に持ち、止まる場面は印刷の形で出す理由の文を持つ
      expect(panelsOf(placed.host).map((p) => p.dataset.scene), `${head || "既定"} の場面の枠`).toEqual([PASS, WRONG]);
      expect(panelOf(placed.host, WRONG)?.querySelector('[data-dragon="scene-stop"]')?.textContent, `${head || "既定"} の止まる場面の理由の文`).toBe(REASON);
    }
    // 印刷の形では、隠した場面も場面の見出しと共に見せ、場面を選ぶ釦と再生の帯は出さない
    const css = document.getElementById("dragon-scenes-css")?.textContent ?? "";
    const print = /@media print\{(.*)\}$/su.exec(css)?.[1] ?? "";
    expect(print, "場面の見た目の規則に印刷の形が無い").not.toBe("");
    expect(print, "印刷の形で隠した場面を見せる決まりが無い").toMatch(/\.dg-scene(?:\[hidden\])?\{display:block/u);
    expect(print, "印刷の形で場面の見出しを見せる決まりが無い").toMatch(/\.dg-scene-h\{display:flex/u);
    const hidden = /([^{}]*)\{display:none\}/gu;
    const off = [...print.matchAll(hidden)].map((m) => m[1] ?? "").join(",");
    for (const part of [".dg-scene-s", ".dg-scene-picks", ".dg-bar"]) expect(off, `印刷の形で ${part} を隠す決まりが無い`).toContain(part);
  });

  it("scenes-print-stacks-every-step", () => {
    // 止め絵は印刷する間だけ置く。jsdom は印刷の形の見張りを持たないので、印刷の前と後の知らせを送る
    try {
      for (const head of ["", " [scenes: pick]"]) {
        const placed = mount(flowScenes(head));
        const read = scenesOf(flowScenes(head));
        if (!placed || !read) continue;
        expect(placed.host.querySelectorAll('[data-dragon="step-still"]').length, `${head || "既定"} の印刷の前の段の止め絵`).toBe(0);
        window.dispatchEvent(new Event("beforeprint"));
        // 場面ごとに、全ての段の止め絵を段の順に持ち、各絵の下に段の番号と say の文を置く (#3956)
        for (const [k, scene] of read.scenes.entries()) {
          const panel = panelsOf(placed.host)[k];
          const stills = [...(panel?.querySelectorAll<HTMLElement>('[data-dragon="step-still"]') ?? [])];
          expect(stills.length, `${head || "既定"} の ${scene.name} の段の止め絵の数`).toBe(COUNTS[k]);
          for (const [i, still] of stills.entries()) {
            const svg = still.querySelector<SVGSVGElement>('svg[data-dragon="figure"]');
            const at = scene.timeline.stills[i] ?? Number.NaN;
            expect(Number.parseFloat(svg?.style.getPropertyValue("--at") ?? ""), `${head || "既定"} の ${scene.name} の段 ${i + 1} の止め絵の時刻`).toBeCloseTo(at, 3);
            const caption = [...still.childNodes]
              .filter((node) => !(node instanceof SVGElement) && !(node instanceof Element && node.querySelector("svg")))
              .map((node) => node.textContent ?? "")
              .join(" ");
            const step = scene.diagram.steps[i] as { title?: string; body?: string } | undefined;
            expect(caption, `${head || "既定"} の ${scene.name} の段 ${i + 1} の止め絵の下に段の番号が無い`).toContain(String(i + 1));
            expect(caption, `${head || "既定"} の ${scene.name} の段 ${i + 1} の止め絵の下に say の文が無い`).toContain(step?.body ?? "(say の文が無い)");
          }
        }
        // 段の止め絵の束は印刷の形で見せる
        const box = placed.host.querySelector('[data-dragon="step-still"]')?.parentElement;
        const name = box?.classList[0] ?? "(止め絵の束が無い)";
        const print = ["dragon-player-css", "dragon-scenes-css"]
          .map((id) => document.getElementById(id)?.textContent ?? "")
          .flatMap((css) => [...css.matchAll(/@media print\{(.*?)\}\}/gsu)].map((m) => m[1] ?? ""))
          .join("");
        expect(print, "印刷の形で段の止め絵の束を見せる決まりが無い").toMatch(new RegExp(`\\.${name}\\{display:(?!none)`, "u"));
        // 印刷の後は止め絵を外し、画面の頁に図の写しを残さない
        window.dispatchEvent(new Event("afterprint"));
        expect(placed.host.querySelectorAll('[data-dragon="step-still"]').length, `${head || "既定"} の印刷の後の段の止め絵`).toBe(0);
      }
    } finally {
      window.dispatchEvent(new Event("afterprint"));
    }
  });

  it("scenes-text-readable-at-728", () => {
    for (const [kind, text] of [
      ["flow", flowScenes()],
      ["lineup", lineupScenes()],
    ] as const) {
      const read = scenesOf(text, { width: 728 });
      if (!read) continue;
      // 幅 728px の枠に収めた、場面ごとの図と縦に並べた図の字が 10.5px 以上
      for (const scene of read.scenes) expect(dragon.chooseView(scene, 728).textPx, `${kind} の ${scene.name} の場面の字`).toBeGreaterThanOrEqual(10.5);
      const whole = dragon.chooseView(read.rendered, 728);
      expect(whole.textPx, `${kind} の縦に並べた図の字`).toBeGreaterThanOrEqual(10.5);
      // 縦に並べた図に書く場面の名前と止まる理由の字も、枠に収めて 10.5px 以上
      const css = svgOf(read.rendered.svg).querySelector("style")?.textContent ?? "";
      const sizes = [...css.matchAll(/\.dg-scene-[nr]\{font:\d+ ([\d.]+)px/gu)].map((m) => Number(m[1]));
      expect(sizes.length, `${kind} の縦に並べた図の場面の名前と理由の字の大きさ`).toBe(2);
      for (const size of sizes) expect((size * 728) / read.rendered.layout.width, `${kind} の縦に並べた図の場面の名前と理由の字`).toBeGreaterThanOrEqual(10.5);
      expect(textOf(read.rendered.svg), `${kind} の縦に並べた図の字`).toEqual(expect.arrayContaining([PASS, WRONG, REASON]));
    }
  });

  it("scenes-note-card-opens-under-pressed-scene", () => {
    const placed = mount(flowScenes(" [note: pop]", " [note: 登録した宛先の一覧と照らす]"));
    if (!placed) return;
    const { host } = placed;
    const frameOf = (panel: HTMLElement | null): HTMLElement | null => panel?.querySelector<HTMLElement>(".dg-frame") ?? null;
    const openIn = (panel: HTMLElement | null): string[] => [...(panel?.querySelectorAll('[data-dragon="note-card"][data-open]') ?? [])].map((c) => c.getAttribute("data-box") ?? "");
    /** 場面の枠の四角と箱の四角を決めてから、その場面の箱を押す。箱は枠の左上から右へ 100、下へ 40 の所に在る */
    const pressIn = (name: string, frame: Rect): Rect => {
      const panel = panelOf(host, name);
      const box = { left: frame.left + 100, top: frame.top + 40, width: 120, height: 48 };
      placeAt(frameOf(panel), frame);
      const el = panel?.querySelector(`[data-note="look"]`) ?? null;
      expect(el, `${name} の場面の宛先を確かめる箱に札の印が無い`).not.toBeNull();
      placeAt(el, box);
      press(el);
      return box;
    };
    const lower: Rect = { left: 20, top: 500, width: 600, height: 420 };
    const box = pressIn(WRONG, lower);
    // 押した場面の枠の中にだけ札が開く
    expect(openIn(panelOf(host, WRONG)), "宛先が違う送金の場面で開いた札").toEqual(["look"]);
    expect(openIn(panelOf(host, PASS)), "押さない通る送金の場面で開いた札").toEqual([]);
    // 札は押した箱のすぐ下に開く。位置は押した場面の枠の左上から測る
    const card = panelOf(host, WRONG)?.querySelector<HTMLElement>('[data-dragon="note-card"][data-open]');
    const top = Number.parseFloat(card?.style.top ?? "");
    const bottom = box.top + box.height - lower.top;
    expect(top > bottom && top <= bottom + 16, `札の上端 (${top}) が押した箱の下端 (${bottom}) のすぐ下に無い`).toBe(true);
    // 別の場面の箱を押すと、前の場面の札を閉じて、押した場面の札だけを開く
    pressIn(PASS, { left: 20, top: 30, width: 600, height: 420 });
    expect(openIn(panelOf(host, PASS)), "通る送金の場面の箱を押した後に開いた札").toEqual(["look"]);
    expect(openIn(panelOf(host, WRONG)), "通る送金の場面の箱を押した後に宛先が違う送金の場面で開いた札").toEqual([]);
  });

  it("scenes-fourth-refused", () => {
    /** 場面を `n` 個書いた手順の図。場面の行は 9 行目から 5 行ずつ */
    const many = (n: number): string =>
      "flow 送金\n\nbox ask as 頼む\nbox send as 送る\n\nstep 頼む\n  say 送金を頼む。\n  start -> ask\n" +
      Array.from({ length: n }, (_, k) => `scene 場面${k + 1}\n  step 送る${k + 1}\n    say 送る。\n    ask -> send: 送る${k + 1}\nend\n`).join("");
    // 場面は 3 つまで書ける
    const three = dragon.parseNotation(many(3), { lang: "ja" });
    expect(three.ok, `場面を 3 つ書いた図を断った: ${three.ok ? "" : three.errors[0]?.message}`).toBe(true);
    // 4 つ目の場面は、その行を名指して断る
    for (const lang of ["ja", "en"] as const) {
      const four = dragon.parseNotation(many(4), { lang });
      expect(four.ok, "場面を 4 つ書いた図を読んだ").toBe(false);
      const error = four.ok ? undefined : four.errors[0];
      expect(error?.line, "4 つ目の場面を断った行").toBe(9 + 5 * 3);
      expect(error?.message ?? "", `4 つ目の場面の断りの文 (${lang}) が上限の 3 を挙げない`).toMatch(/3/u);
    }
  });

  it("scenes-unknown-mode-refused", () => {
    // stack と pick は読め、ほかの値は 1 行目を名指して断る
    for (const mode of ["stack", "pick"]) {
      const parsed = dragon.parseNotation(flowScenes(` [scenes: ${mode}]`), { lang: "ja" });
      expect(parsed.ok, `1 行目の [scenes: ${mode}] を断った: ${parsed.ok ? "" : parsed.errors[0]?.message}`).toBe(true);
    }
    for (const mode of ["side", "Pick"]) {
      for (const lang of ["ja", "en"] as const) {
        const parsed = dragon.parseNotation(flowScenes(` [scenes: ${mode}]`), { lang });
        expect(parsed.ok, `1 行目の [scenes: ${mode}] を読んだ`).toBe(false);
        const error = parsed.ok ? undefined : parsed.errors[0];
        expect(error?.line, `[scenes: ${mode}] を断った行`).toBe(1);
        expect(error?.message ?? "", `[scenes: ${mode}] の断りの文 (${lang}) が書ける値を挙げない`).toMatch(/stack[\s\S]*pick/u);
      }
    }
  });

  it("scenes-in-try-refused", () => {
    // 試す図の段の後ろに scene を書く。scene の行は 9 行目
    const text =
      "try 網\n\nroute 網: あなた - 甲 - 作る人 [from: あなた, to: 作る人]\nqueue 待ち\nask 名前, 値 [into: 待ち, via: 網]\n\n" +
      "step 網を伝わる\n  say 送ったチップが網を伝わる。\nscene 別の道\n  step 別の段\n    say 別の道を通る。\nend\n";
    for (const lang of ["ja", "en"] as const) {
      const parsed = dragon.parseNotation(text, { lang });
      expect(parsed.ok, "試す図の scene を読んだ").toBe(false);
      const error = parsed.ok ? undefined : parsed.errors[0];
      expect(error?.line, "試す図の scene を断った行").toBe(9);
      // 断りの文は、場面を書ける図の種類を挙げる
      expect(error?.message ?? "", `試す図の scene の断りの文 (${lang}) が場面を書ける種類を挙げない`).toMatch(/scene[\s\S]*flow[\s\S]*lineup/u);
    }
  });

  it("scenes-stop-outside-and-unclosed-refused", () => {
    const base = "flow 送金\n\nbox ask as 頼む\nbox send as 送る\n\nstep 頼む\n  say 送金を頼む。\n  start -> ask\n";
    for (const lang of ["ja", "en"] as const) {
      // scene の外の段の stop は、stop の行を名指して断る。stop の行は 9 行目
      const outside = dragon.parseNotation(`${base}  stop 止める\nscene ${PASS}\n  step 送る\n    say 送る。\n    ask -> send\nend\n`, { lang });
      expect(outside.ok, "scene の外の段の stop を読んだ").toBe(false);
      const stray = outside.ok ? undefined : outside.errors[0];
      expect(stray?.line, "scene の外の段の stop を断った行").toBe(9);
      expect(stray?.message ?? "", `scene の外の段の stop の断りの文 (${lang}) が scene を挙げない`).toMatch(/stop[\s\S]*scene|scene[\s\S]*stop/u);
      expect(stray?.message ?? "", `scene の外の段の stop の断りの文 (${lang}) が知らない語の文`).not.toMatch(/行の頭に書けない|cannot start with/u);
      // end で閉じない scene は、scene の行を名指して断る。scene の行は 9 行目
      const unclosed = dragon.parseNotation(`${base}scene ${PASS}\n  step 送る\n    say 送る。\n    ask -> send\n`, { lang });
      expect(unclosed.ok, "end で閉じない scene を読んだ").toBe(false);
      const open = unclosed.ok ? undefined : unclosed.errors[0];
      expect(open?.line, "end で閉じない scene を断った行").toBe(9);
      expect(open?.message ?? "", `end で閉じない scene の断りの文 (${lang}) が場面の名前と end を挙げない`).toMatch(new RegExp(`${PASS}[\\s\\S]*end`, "u"));
    }
  });
});

/** SVG の字。見た目の規則 (`<style>`) の中の字は数えない */
function textOf(markup: string): string[] {
  return [...svgOf(markup).querySelectorAll("text")].map((t) => t.textContent ?? "");
}

describe("場面を持つ図は寄って追わない (#4018)", () => {
  // 再生の部品は場面ごとの図を枠ごと並べて寄って追わないので、見せ方を選ぶ決まりも枠の幅に依らず止めた形を選び、書き出しもそれに従う
  it("scene-figures-stay-fixed", () => {
    for (const { kind, frame, scenes, view } of HALF_VIEWS.get()) {
      expect(scenes, `${kind} の場面の数`).toBe(2);
      expect(view.textPx, `${kind} を幅 ${frame} に収めた箱の名前の字が、寄って追う形を選ぶ 10.5px を下回らない`).toBeLessThan(10.5);
      expect(view.mode, `${kind} を幅 ${frame} で見せる形`).toBe("fixed");
    }
  });
});
