/**
 * 場面を選ぶ見た目の選べる図 (`try` の `[shape: scenes]`、#3873) の再生の部品。
 *
 * 図の上に場面を選ぶ欄と送る釦だけを持つ入力の帯 (`form[data-dragon="ask"]`) を置き、その下に物だけを描いた図を置く。
 * 場面を選んで送ると、その場面のやり取りだけを書いた順に 1 つずつ引き (矢印は `SCENES_TIME.draw`、注記は `SCENES_TIME.note`)、
 * 最後のやり取りの後に場面の答えの一文と理由を図の下に出す。場面を選び直すと、やり取りと答えを消して物だけの図に戻す。
 * 再生の帯は置かず、段を送る操作 (`next` や `play`) は何もしない。動きを減らす設定の頁では動きを飛ばし、送った時に結果を出す。
 * 図は枠の幅で描き直し、`SCENES_LOOK.narrowBelow` より狭い枠では物の名前の札とやり取りの札を縦に積む形にする。
 * この file は選べる図の描く部品と同じ塊 (`kinds/try.ts`) に入り、軽い入口が最初に読む量に入れない
 */
import type { Styles } from "./adopt-css";
import { layoutScenes } from "./kinds/try/layout";
import { pickScene, readScenes } from "./kinds/try/scenes";
import { SCENES_LOOK, SCENES_TIME, SCENES_TYPE } from "./look/scenes";
import { EASE, FONT_VARS, type Palette, paletteVars } from "./look/values";
import type { Player, PlayerOptions } from "./player";
import { type Rendered, renderLayout } from "./render/draw";
import { cssFont as font } from "./render/parts";
import { ensureTryCss } from "./try-player";
import { TRY_TEXT } from "./try-text";
import type { NotationLang } from "./words";

const px = (v: number): string => `${v}px`;

/** 答えの見た目。答えの一文を答えの色で、理由を地の字で、図の左右の余白にそろえて書く */
const scenesCss = (): string =>
  [
    `.dg-sc-ans{display:flex;flex-direction:column;gap:${px(SCENES_LOOK.wide.whyGap)};margin:0;padding:0 ${px(SCENES_LOOK.margin)}}`,
    `.dg-sc-ah{margin:0;${font(SCENES_TYPE.answerHead)};line-height:1.45;color:var(--t-green)}`,
    `.dg-sc-aw{margin:0;${font(SCENES_TYPE.answerWhy)};line-height:1.55;color:var(--ink)}`,
  ].join("");

/** 答えの見た目を入れる。口`styles`を渡された時は口で図を置いた所の根へ入れる (#3695) */
function ensureScenesCss(doc: Document, styles?: Styles): void {
  if (styles) return styles.adopt("dragon-try-scenes-css", scenesCss());
  if (doc.getElementById("dragon-try-scenes-css")) return;
  const style = doc.createElement("style");
  style.id = "dragon-try-scenes-css";
  style.textContent = scenesCss();
  doc.head.appendChild(style);
}

/**
 * 場面の図を `host` に置く。`rendered` は再生の部品が描いた図 (色味と言葉と時刻の表を読む)、`source` は渡された原本で、
 * 書き手の最後の段の `ask` が選ぶ場面を始めに選んでおく
 */
export function mountTryScenes(
  host: HTMLElement,
  rendered: Rendered,
  source: unknown,
  options: PlayerOptions,
  palette: Palette,
  lang: NotationLang,
): Player {
  const doc = host.ownerDocument;
  const win = doc.defaultView;
  const reduce = Boolean(win?.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  const { styles } = options;
  const model = rendered.diagram;
  const read = readScenes(source);
  const words = TRY_TEXT[lang];
  ensureTryCss(doc, styles);
  ensureScenesCss(doc, styles);

  const root = doc.createElement("div");
  root.className = "dg-player";
  root.dataset.dragon = "player";
  root.dataset.try = "";
  root.dataset.scenes = "";
  root.setAttribute("style", `${FONT_VARS};${paletteVars(palette, rendered.theme)}`);
  if (palette.corner === "cut") root.dataset.corner = "cut";

  // 入力の帯は場面の欄 1 つと送る釦だけを持つ。置いた頁の言葉と違っても、釦の字を渡した言葉の声で読ませる
  const tools = doc.createElement("div");
  tools.className = "dg-try";
  tools.setAttribute("lang", lang);
  const form = doc.createElement("form");
  form.className = "dg-ask";
  form.dataset.dragon = "ask";
  const row = doc.createElement("div");
  row.className = "dg-ask-row";
  const label = doc.createElement("label");
  label.className = "dg-field";
  const caption = doc.createElement("span");
  caption.className = "dg-fl";
  caption.textContent = read.field;
  const select = doc.createElement("select");
  select.className = "dg-in";
  select.dataset.field = read.field;
  for (const scene of read.scenes) {
    const option = doc.createElement("option");
    option.value = scene;
    option.textContent = scene;
    select.append(option);
  }
  select.value = read.chosen;
  const caret = doc.createElement("span");
  caret.className = "dg-caret";
  caret.setAttribute("aria-hidden", "true");
  label.append(caption, select, caret);
  const send = doc.createElement("button");
  send.type = "submit";
  send.className = "dg-act";
  send.dataset.dragon = "send";
  send.textContent = words.trySend;
  row.append(label, send);
  form.append(row);
  tools.append(form);

  const frame = doc.createElement("div");
  frame.className = "dg-frame";
  root.append(tools, frame);
  host.append(root);

  /** 今の場面と、その場面を送ったか */
  let scene = select.value;
  let sent = false;
  /** 送るたびに増やす番号。古い動きの続きを止める */
  let run = 0;
  let drawnWidth = -1;
  let answer: HTMLElement | undefined;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const later = (at: number, then: () => void): void => {
    const id = setTimeout(() => {
      timers.delete(id);
      then();
    }, at);
    timers.add(id);
  };
  const stop = (): void => {
    run++;
    for (const id of timers) clearTimeout(id);
    timers.clear();
    send.disabled = false;
  };

  const frameWidth = (): number => Math.floor(frame.clientWidth || host.clientWidth || 0);

  /** 物だけか (`rows` が偽)、今の場面のやり取りも描いた図を枠の幅で描き、やり取りの組を返す */
  const draw = (rows: boolean): Element[] => {
    const width = frameWidth();
    drawnWidth = width;
    const layout = layoutScenes(model, {
      ...(width > 0 ? { width } : {}),
      scene,
      rows,
      answer: false,
    });
    const out = renderLayout(model, layout, rendered.timeline, {
      ...options,
      palette: rendered.palette,
      theme: rendered.theme,
      lang,
    });
    frame.innerHTML = styles ? styles.markup(out.svg) : out.svg;
    const svg = frame.querySelector("svg");
    svg?.style.setProperty("--dg-w", `${svg.getAttribute("width") ?? ""}px`);
    options.onResize?.(root.getBoundingClientRect().height);
    return [...frame.querySelectorAll("[data-scene-row]")];
  };

  /** 今のやり取りの印を `k` 番目のやり取りへ移し、両端の物の箱を光らせる */
  const markNow = (rows: Element[], k: number): void => {
    rows.forEach((one, i) => one.toggleAttribute("data-now", i === k));
    const now = rows[k];
    const ends = new Set([now?.getAttribute("data-from"), now?.getAttribute("data-to")]);
    for (const lane of frame.querySelectorAll("[data-scene-lane]"))
      lane.toggleAttribute("data-on", ends.has(lane.getAttribute("data-scene-lane")));
  };

  const clearAnswer = (): void => {
    answer?.remove();
    answer = undefined;
  };

  /** 場面の答えの一文と理由を図の下に出す */
  const showAnswer = (animate: boolean): void => {
    clearAnswer();
    const picked = pickScene(read, scene).answer;
    if (picked.head === "") return;
    const box = doc.createElement("div");
    box.className = "dg-sc-ans";
    box.dataset.dragon = "scene-answer";
    box.setAttribute("role", "status");
    box.setAttribute("lang", lang);
    const head = doc.createElement("p");
    head.className = "dg-sc-ah";
    head.dataset.sceneAnswer = "head";
    head.textContent = picked.head;
    box.append(head);
    if (picked.why !== "") {
      const why = doc.createElement("p");
      why.className = "dg-sc-aw";
      why.dataset.sceneAnswer = "why";
      why.textContent = picked.why;
      box.append(why);
    }
    root.append(box);
    answer = box;
    if (animate && typeof box.animate === "function")
      box.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: SCENES_TIME.answer,
        easing: EASE.inOut,
      });
    options.onResize?.(root.getBoundingClientRect().height);
  };

  /** 送った場面のやり取りを 1 つずつ引いてから答えを出す。動きを減らす頁と、動きを持たないブラウザでは結果を出す */
  const reveal = (rows: Element[]): void => {
    const last = rows.length - 1;
    if (reduce || rows.length === 0 || typeof (rows[0] as SVGElement).animate !== "function") {
      markNow(rows, last);
      showAnswer(false);
      return;
    }
    const mine = ++run;
    send.disabled = true;
    const tall = frame.querySelector(".dg-scc") !== null;
    let at = 0;
    rows.forEach((one, k) => {
      const note = one.getAttribute("data-from") === one.getAttribute("data-to");
      const long = tall ? SCENES_TIME.card : note ? SCENES_TIME.note : SCENES_TIME.draw;
      const start = at;
      const timing = { delay: start, fill: "backwards" as const, easing: EASE.inOut };
      (one as SVGElement).animate([{ opacity: 0 }, { opacity: 1 }], {
        ...timing,
        duration: tall ? long : SCENES_TIME.label,
      });
      if (tall)
        (one as SVGElement).animate(
          [{ transform: `translateY(${px(-SCENES_LOOK.tall.card.gap)})` }, { transform: "none" }],
          { ...timing, duration: long },
        );
      one
        .querySelector(".dg-sc-ln")
        ?.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
          ...timing,
          duration: long,
        });
      // 矢じりは済んだやり取りの薄さ (見た目の規則の値) へ向けて出すので、終わりの値を書かない
      one
        .querySelector(".dg-sc-hd")
        ?.animate([{ opacity: 0 }], {
          ...timing,
          delay: start + long,
          duration: SCENES_TIME.pop,
        });
      one
        .querySelector(".dg-sc-b")
        ?.animate([{ transform: "scale(0.4)" }, { transform: "scale(1)" }], {
          ...timing,
          duration: SCENES_TIME.pop,
        });
      later(start, () => {
        if (mine === run) markNow(rows, k);
      });
      at += long + SCENES_TIME.stagger;
    });
    later(at, () => {
      if (mine !== run) return;
      send.disabled = false;
      showAnswer(true);
    });
  };

  // 場面を選び直すと、送るまでやり取りと答えを消して物だけを描く
  select.addEventListener("change", () => {
    stop();
    scene = select.value;
    sent = false;
    clearAnswer();
    draw(false);
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    stop();
    scene = select.value;
    sent = true;
    clearAnswer();
    reveal(draw(true));
  });

  draw(false);
  // 枠の幅が変わった時だけ描き直す。送った場面は動きを飛ばした結果で描き直し、答えは残す
  const observer =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(() => {
          if (frameWidth() === drawnWidth) return;
          const wasSent = sent;
          const shown = answer !== undefined;
          stop();
          const rows = draw(wasSent);
          if (wasSent) markNow(rows, rows.length - 1);
          if (wasSent && !shown) showAnswer(false);
        })
      : undefined;
  observer?.observe(frame);
  options.onStep?.(0);

  const none = (): void => undefined;
  return {
    get step() {
      return 0;
    },
    get playing() {
      return timers.size > 0;
    },
    get held() {
      return false;
    },
    hold: none,
    next: none,
    prev: none,
    play: none,
    pause: none,
    goTo: none,
    rewind: none,
    setSpeed(speed: number) {
      if (typeof speed !== "number" || !Number.isFinite(speed) || speed <= 0)
        throw new RangeError(`speed must be a finite number greater than 0, got ${String(speed)}`);
    },
    mark: none,
    get diagram() {
      return source;
    },
    destroy() {
      stop();
      observer?.disconnect();
      root.remove();
    },
  };
}
