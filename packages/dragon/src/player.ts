/**
 * 頁に図を置いて動かす。
 *
 * 動きを嫌う設定 (`prefers-reduced-motion: reduce`) は描く前に読み、その人には一瞬も自動再生せず、
 * 段ごとの止め絵を釦で送る。各段の題と本文は、読み上げの道具が段の順に読める番号付きの一覧として置き、
 * 図そのものは読み上げから隠して同じ中身を 2 度読ませない。
 * 見せ方は枠の幅で選び (`view.ts`)、寄って追う時は窓と全体図で描き直す。
 * 釦と段の一覧の読み上げの名前と全体図の札は、渡した言葉 (`options.lang`、書かなければ日本語) で出す (#3001)。
 */
import { FIGURE_TEXT } from "./figure-text";
import { FONT_VARS, LOOK, paletteVars, resolvePalette, type TextStyle, TYPE } from "./look/values";
import { drawSvg, type RenderOptions, renderDiagram } from "./render/svg";
import type { Span } from "./timeline";
import { chooseView } from "./view";

export interface Player {
  /** 今の段 (0 から) */
  readonly step: number;
  /** 動いているか */
  readonly playing: boolean;
  next(): void;
  prev(): void;
  play(): void;
  pause(): void;
  destroy(): void;
}

const font = (t: TextStyle): string => `font:${t.weight} ${t.size}px var(--${t.family})`;
const px = (v: number): string => `${v}px`;

function playerCss(): string {
  const P = LOOK.player;
  const hidden = px(P.hidden);
  return [
    `.dg-player{display:flex;flex-direction:column;gap:${px(P.gap)};color:var(--ink)}`,
    `.dg-player .dg-frame{border-radius:${px(P.radius)};overflow:hidden}`,
    `.dg-bar{display:flex;align-items:flex-start;gap:${px(P.gap)}}`,
    `.dg-btns{display:flex;gap:${px(P.gap / 2)};flex:none}`,
    `.dg-btn{width:${px(P.button)};height:${px(P.button)};border-radius:${px(P.radius)};border:${px(LOOK.stroke.hair)} solid var(--hair);background:var(--surf);color:var(--ink);${font(TYPE.button)};cursor:pointer}`,
    `.dg-btn:focus-visible{outline:${px(P.focus)} solid var(--c-blue);outline-offset:${px(P.focus)}}`,
    `.dg-say{display:flex;gap:${px(P.gap)};min-width:0}`,
    `.dg-no{${font(TYPE.stepNo)};color:var(--mute);padding-top:${px(P.focus)}}`,
    `.dg-tt{${font(TYPE.stepTitle)};margin:0}`,
    `.dg-tb{${font(TYPE.stepBody)};color:var(--ink2);margin:0;white-space:pre-line}`,
    `.dg-sr{position:absolute;width:${hidden};height:${hidden};margin:-${hidden};padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}`,
  ].join("");
}

function ensureCss(doc: Document): void {
  if (doc.getElementById("dragon-player-css")) return;
  const style = doc.createElement("style");
  style.id = "dragon-player-css";
  style.textContent = playerCss();
  doc.head.appendChild(style);
}

/** 釦に出す字。HTML に書き出す時は、この字も字の file に残す。 */
export const BUTTON_TEXT = { prev: "‹", pause: "❚❚", play: "▶", next: "›" } as const;

const pad = (n: number): string => String(n).padStart(2, "0");
/** 段の番号の札 (`01/12`)。`step` は 0 から数える。 */
export const stepNo = (step: number, count: number): string => `${pad(step + 1)}/${pad(count)}`;

export function mountDiagram(host: HTMLElement, diagram: unknown, options: RenderOptions = {}): Player {
  const doc = host.ownerDocument;
  const win = doc.defaultView;
  // 描く前に読む。描いた後に読むと、動きを嫌う人にも一瞬だけ流れてしまう
  const reduce = Boolean(win?.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  const rendered = renderDiagram(diagram, options);
  const lang = options.lang ?? "ja";
  const words = FIGURE_TEXT[lang];
  const palette = resolvePalette(rendered.palette);
  const { timeline } = rendered;
  const steps = rendered.diagram.steps;
  const count = steps.length;

  ensureCss(doc);
  const root = doc.createElement("div");
  root.className = "dg-player";
  root.dataset.dragon = "player";
  root.setAttribute("style", `${FONT_VARS};${paletteVars(palette, rendered.theme)}`);

  const frame = doc.createElement("div");
  frame.className = "dg-frame";
  const button = (name: string, label: string, text: string): HTMLButtonElement => {
    const b = doc.createElement("button");
    b.type = "button";
    b.className = "dg-btn";
    b.dataset.dragon = name;
    b.setAttribute("aria-label", label);
    b.textContent = text;
    return b;
  };
  const prevButton = button("prev", words.prev, BUTTON_TEXT.prev);
  const toggleButton = button("toggle", words.pause, BUTTON_TEXT.pause);
  const nextButton = button("next", words.next, BUTTON_TEXT.next);
  const buttons = doc.createElement("div");
  buttons.className = "dg-btns";
  // 置いた頁の言葉と違っても、釦の名前を名前の言葉の声で読ませる
  buttons.setAttribute("lang", lang);
  buttons.append(prevButton, toggleButton, nextButton);

  // 見える語り。読み上げには下の一覧を読ませるので、こちらは読み上げから隠す
  const say = doc.createElement("div");
  say.className = "dg-say";
  say.setAttribute("aria-hidden", "true");
  const no = doc.createElement("div");
  no.className = "dg-no";
  no.dataset.dragon = "step-no";
  const text = doc.createElement("div");
  const title = doc.createElement("p");
  title.className = "dg-tt";
  title.dataset.dragon = "step-title";
  const body = doc.createElement("p");
  body.className = "dg-tb";
  body.dataset.dragon = "step-body";
  text.append(title, body);
  say.append(no, text);
  const bar = doc.createElement("div");
  bar.className = "dg-bar";
  bar.append(buttons, say);

  // 読み上げの道具が段の順に読む一覧。見た目からは外すが、読み上げからは隠さない
  const list = doc.createElement("ol");
  list.className = "dg-sr";
  list.dataset.dragon = "steps";
  list.setAttribute("aria-label", words.steps(rendered.diagram.title));
  for (const step of steps) {
    const item = doc.createElement("li");
    const head = doc.createElement("strong");
    head.textContent = step.title;
    item.append(head);
    for (const line of step.body.split("\n")) {
      const p = doc.createElement("p");
      p.textContent = line;
      item.append(p);
    }
    list.append(item);
  }

  root.append(frame, bar, list);
  host.append(root);

  const frameWidth = (): number => frame.clientWidth || host.clientWidth || rendered.layout.width;
  let mode = chooseView(rendered, frameWidth()).mode;
  let width = frameWidth();
  let svg: SVGSVGElement | null = null;
  let step = 0;
  let playing = !reduce;
  let at = reduce ? (timeline.stills[0] ?? 0) : 0;
  let born = Date.now();

  /** 動きの変数を付けた図を置き直す。置き直すと動きの時計が最初から数え直される */
  const place = (markup?: string): void => {
    let next: SVGSVGElement | null;
    if (markup !== undefined) {
      const holder = doc.createElement("div");
      holder.innerHTML = markup;
      next = holder.querySelector("svg");
    } else {
      next = svg ? (svg.cloneNode(true) as SVGSVGElement) : null;
    }
    if (!next) return;
    next.setAttribute("aria-hidden", "true");
    next.removeAttribute("role");
    next.removeAttribute("aria-label");
    next.style.setProperty("--at", String(at));
    next.style.setProperty("--play", playing ? "running" : "paused");
    next.dataset.motion = playing ? "play" : "still";
    if (svg) svg.replaceWith(next);
    else frame.append(next);
    svg = next;
    born = Date.now();
  };
  const markup = (): string => (mode === "follow" ? drawSvg(rendered.diagram, rendered.layout, timeline, palette, rendered.theme, { width, lang }) : rendered.svg);

  const now = (): number => (playing ? (at + (Date.now() - born) / 1000) % timeline.total : at);
  const stepAt = (t: number): number => {
    let found = 0;
    timeline.steps.forEach((span: Span, i) => {
      if (span.start <= t) found = i;
    });
    return found;
  };
  const show = (): void => {
    const current = steps[step];
    no.textContent = stepNo(step, count);
    title.textContent = current?.title ?? "";
    body.textContent = current?.body ?? "";
    toggleButton.setAttribute("aria-label", playing ? words.pause : words.play);
    toggleButton.textContent = playing ? BUTTON_TEXT.pause : BUTTON_TEXT.play;
  };
  const restart = (t: number, play: boolean): void => {
    at = t;
    playing = play;
    place();
    show();
  };
  const go = (target: number): void => {
    step = Math.min(count - 1, Math.max(0, target));
    const span = timeline.steps[step] as Span;
    restart(playing ? span.start : (timeline.stills[step] ?? span.start), playing);
  };

  place(markup());
  show();

  const timer = win?.setInterval(() => {
    if (!playing) return;
    const s = stepAt(now());
    if (s !== step) {
      step = s;
      show();
    }
  }, 120);
  const onPrev = (): void => go(step - 1);
  const onNext = (): void => go(step + 1);
  const onToggle = (): void => (playing ? restart(now(), false) : restart(at, true));
  // 段の番号を押すとその段へ移る
  const onFigure = (event: Event): void => {
    const target = (event.target as Element | null)?.closest?.("[data-step]");
    const s = target ? Number(target.getAttribute("data-step")) : Number.NaN;
    if (Number.isInteger(s)) go(s);
  };
  prevButton.addEventListener("click", onPrev);
  nextButton.addEventListener("click", onNext);
  toggleButton.addEventListener("click", onToggle);
  frame.addEventListener("click", onFigure);

  // 枠の幅が変わったら見せ方を選び直す。寄って追う窓は幅で決まるので、幅が変われば描き直す
  const Observer = (win as (Window & { ResizeObserver?: typeof ResizeObserver }) | null)?.ResizeObserver;
  const observer = Observer
    ? new Observer(() => {
        const w = frameWidth();
        const chosen = chooseView(rendered, w).mode;
        if (chosen === mode && (mode === "fixed" || w === width)) return;
        const t = now();
        mode = chosen;
        width = w;
        at = t;
        place(markup());
      })
    : undefined;
  observer?.observe(frame);

  return {
    get step() {
      return step;
    },
    get playing() {
      return playing;
    },
    next: onNext,
    prev: onPrev,
    play: () => {
      if (!playing) restart(at, true);
    },
    pause: () => {
      if (playing) restart(now(), false);
    },
    destroy: () => {
      if (timer !== undefined) win?.clearInterval(timer);
      observer?.disconnect();
      prevButton.removeEventListener("click", onPrev);
      nextButton.removeEventListener("click", onNext);
      toggleButton.removeEventListener("click", onToggle);
      frame.removeEventListener("click", onFigure);
      root.remove();
    },
  };
}
