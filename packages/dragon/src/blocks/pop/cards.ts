/**
 * 押すと出る札の層 (#3877)。
 *
 * 再生の部品に置いた図は、図の枠の中の層に箱ごとの札を持ち、印の付いた箱を押すと箱のすぐ下に札を開く。
 * 札の位置は押した時に箱と図の枠の四角を測って決めるので、寄って追う図でも押した箱の下に出る。
 * 札の外か閉じるのアイコンを押すと閉じ、段を送ると閉じる。段が替わると箱の位置と中身が替わり、開いたままの札が別の箱を指すため。再生の操作の列を押しただけでは閉じない。
 * 判定の表 (#3890) は、規則の見出しと例の名前のセルを箱と同じく押せる所にし、表を横に送ると閉じる。送ると札が指すセルの位置が動くため。
 * 印刷の形では全ての札を開き、図の幅と高さに対する箱の真ん中と下端の割合 (`--nx` と `--ny`) の所に置く。
 * 目盛りの札 (#3896) は、目盛りの名前と上限を見出しにし、値を書いた段ごとに段の番号と名前、小さな棒と増えた量と値、予約の内訳を並べる。
 * 押した段より後の段の行は隠し (`hidden`)、印刷の形では全ての行を出す。目盛りの札の見た目の規則は、目盛りの札を持つ図の札の層にだけ置く。
 * 札の見た目の規則は再生の部品の規則 (`player.ts` の `playerCss`) が持つ。
 * 札で見せる図だけが使うので、軽い入口は最初に読む量に入れず、札で見せる図を置いた時に後から読む (`cards-store.ts`)
 */
import type { FigureText } from "../../figure-text";
import { hasWide } from "../../layout/measure";
import type { GaugeNote, GaugeNoteRow, Layout, Rect, SceneNote } from "../../layout/scene";
import { LOOK, TYPE } from "../../look/values";
import { cssFont as font } from "../../render/parts";
import { r1 } from "../../render/round";
import { cs } from "../color/draw";
import type { NoteCards } from "./cards-store";

const N = LOOK.note;
const G = LOOK.gauge;

/** 図の上に札を描く時の SVG の名前空間 */
const SVG_NS = "http://www.w3.org/2000/svg";
/** 閉じるのアイコンの線 (24 の升の中の 2 本の斜めの線) */
const CLOSE_PATH = "M6 6l12 12M18 6L6 18";

const px = (v: number): string => `${r1(v)}px`;

/** 予約した量の淡い塗り。図の目盛りと同じく、目盛りの色を札の地の色と混ぜる (#3895) */
const HELD = `color-mix(in srgb,var(--c) ${G.heldMix}%,var(--surf))`;

/**
 * 目盛りの札 (#3896) の見た目の規則。目盛りの札を持つ図の札の層にだけ置き、ほかの図の最初に読む規則を増やさない。
 * 行は札の中の 1 つの格子に並べ、段の番号、名前 (2 列目から右の端まで)、棒、増えた量、値の列を揃える。
 * 行の棒は図の目盛りと同じ塗りで、上限までの地 (`dg-ngb`) の右の端に上限の点線を引き、上限を超えた分は地の右の外へ伸ばす。
 * 押した段より後の行は画面で隠し (`hidden`)、印刷の形では全ての行を出す
 */
const GAUGE_CARD_CSS = [
  `.dg-ngl{margin-left:${px(G.chipGap)};font-weight:${TYPE.noteBody.weight}}`,
  `.dg-ngs{display:grid;grid-template-columns:auto 1fr auto auto;column-gap:${px(G.chipGap)};align-items:center}`,
  ".dg-ngr{display:contents}.dg-ngr[hidden]{display:none}",
  `.dg-ngn{grid-column:1;margin-top:${px(N.gap)};${font(TYPE.gaugeTag)};color:var(--mute)}`,
  `.dg-ngt{grid-column:2/-1;margin:${px(N.gap)} 0 0;${font(TYPE.noteBody)};line-height:${N.bodyLine};overflow-wrap:anywhere}`,
  ".dg-ngw{grid-column:2;min-width:0}",
  `.dg-ngb{position:relative;height:${px(G.barH)};border-radius:${px(G.radius)};background:var(--sunk)}`,
  ".dg-ngb>span{position:absolute;top:0;bottom:0;left:0;border-radius:inherit}",
  `.dg-ngb>.dg-ngh{background:${HELD}}.dg-ngb>.dg-ngf{background:var(--c)}.dg-ngb>.dg-ngo{left:100%;background:var(--c-rose)}`,
  `.dg-ngb::after{content:"";position:absolute;left:100%;top:${px(-G.limitOver)};bottom:${px(-G.limitOver)};border-left:${px(G.stroke)} dashed var(--ink2)}`,
  `.dg-ngd{grid-column:3;text-align:end;${font(TYPE.gaugeTag)};color:var(--ct)}`,
  `.dg-ngv{grid-column:4;text-align:end;${font(TYPE.gaugeValue)};color:var(--ink)}`,
  ".dg-ngr[data-over] .dg-ngv{color:var(--t-rose)}",
  `.dg-ngp{grid-column:2/-1;display:flex;flex-wrap:wrap;column-gap:${px(G.splitItemGap)};margin-top:${px(G.splitGap)};${font(TYPE.gaugeSplit)};color:var(--ct)}`,
  `.dg-ngp>span{display:inline-flex;align-items:center;gap:${px(G.swatchGap)};white-space:nowrap}`,
  `.dg-ngq{width:${px(G.swatch)};height:${px(G.swatch)};border-radius:${px(G.swatchRadius)};background:var(--c)}.dg-ngp>span+span>.dg-ngq{background:${HELD}}`,
  // 和文を含む字は、図の目盛りと同じく和文の字で描く
  ".dg-ngj{font-family:var(--sans)}",
  "@media print{.dg-player[data-notes] .dg-ngr[hidden]{display:contents}}",
].join("");

/** 札の中の部品を 1 つ作る。`name` は検査と頁が探す名前 (`data-dragon`)、`text` は中の字 */
function partOf(doc: Document, tag: string, cls: string, name: string, text?: string): HTMLElement {
  const el = doc.createElement(tag);
  if (cls !== "") el.className = cls;
  if (name !== "") el.dataset.dragon = name;
  if (text !== undefined) el.textContent = text;
  return el;
}

/** 和文を含む字の部品は、和文の字で描く名前を足す */
const wide = (cls: string, text: string): string => (hasWide(text) ? `${cls} dg-ngj`.trim() : cls);

/** 目盛りの札の 1 行。`bar` は行の棒の置き場の幅に対する上限までの地の幅 (%) で、上限を書かない目盛りは渡さない */
function gaugeRow(doc: Document, row: GaugeNoteRow, bar: number | undefined): HTMLElement {
  const el = partOf(doc, "div", "dg-ngr", "gauge-row");
  el.dataset.step = String(row.step);
  if (row.over) el.dataset.over = "";
  el.append(partOf(doc, "span", "dg-ngn", "gauge-row-no", String(row.step + 1)), partOf(doc, "p", "dg-ngt", "gauge-row-name", row.title));
  if (bar !== undefined && row.fill !== undefined) {
    const track = partOf(doc, "div", "dg-ngw", "");
    const box = partOf(doc, "div", "dg-ngb", "gauge-row-bar");
    box.style.width = `${bar}%`;
    const paint = (cls: string, name: string, width: number | undefined): void => {
      if (width === undefined) return;
      const part = partOf(doc, "span", cls, name);
      part.style.width = `${width}%`;
      box.append(part);
    };
    // 予約の淡い塗りは総量まで敷き、確定の濃い塗りをその上に重ねる
    paint("dg-ngh", "gauge-row-held", row.held);
    paint("dg-ngf", "gauge-row-fill", row.fill);
    paint("dg-ngo", "gauge-row-over", row.beyond);
    track.append(box);
    el.append(track);
  }
  el.append(partOf(doc, "span", "dg-ngd", "gauge-row-delta", row.delta), partOf(doc, "span", wide("dg-ngv", row.value), "gauge-row-value", row.value));
  if (row.split) {
    const split = partOf(doc, "div", "dg-ngp", "gauge-row-split");
    for (const text of row.split) {
      const item = partOf(doc, "span", wide("", text), "");
      item.append(partOf(doc, "span", "dg-ngq", "gauge-row-swatch"), doc.createTextNode(text));
      split.append(item);
    }
    el.append(split);
  }
  return el;
}

/** 目盛りの札の中身。見出しは目盛りの名前と上限、その下に値を書いた段の行を並べる */
function gaugeParts(doc: Document, name: string, gauge: GaugeNote): HTMLElement[] {
  const head = partOf(doc, "p", "dg-nc-n", "note-name", name);
  if (gauge.limit !== undefined) head.append(partOf(doc, "span", "dg-ngl", "gauge-card-limit", gauge.limit));
  const rows = partOf(doc, "div", "dg-ngs", "gauge-rows");
  rows.append(...gauge.rows.map((row) => gaugeRow(doc, row, gauge.bar)));
  return [head, rows];
}

/** 目盛りの札の名札 `key` の、置いた目盛りの四角 */
const gaugeAt = (layout: Layout, key: string): Rect | undefined => (layout as Layout & { gauges?: (Rect & { card?: string })[] }).gauges?.find((g) => g.card === key);

/** 箱の札を 1 枚作る。`--nx` と `--ny` は印刷の形で札を置く、図の幅と高さに対する割合 */
function noteCard(doc: Document, note: SceneNote, layout: Layout, words: FigureText): HTMLElement {
  const card = doc.createElement("div");
  card.className = "dg-nc";
  card.dataset.dragon = "note-card";
  card.dataset.box = note.box;
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-label", note.name);
  // 目盛りの札は目盛りの色で塗り、印刷の形では目盛りの真ん中と下端の割合の所に置く (#3896)
  if (note.gauge) card.setAttribute("style", cs(note.gauge.color));
  const gauge = note.gauge ? gaugeAt(layout, note.box) : undefined;
  const box = gauge ? { ...gauge, cx: gauge.x + gauge.w / 2 } : layout.boxes.find((b) => b.id === note.box);
  if (box) {
    card.style.setProperty("--nx", `${r1((box.cx / layout.width) * 100)}%`);
    card.style.setProperty("--ny", `${r1(((box.y + box.h) / layout.height) * 100)}%`);
  }
  const close = doc.createElement("button");
  close.type = "button";
  close.className = "dg-nc-x";
  close.dataset.dragon = "note-close";
  close.setAttribute("aria-label", words.closeNote);
  close.title = words.closeNote;
  const icon = doc.createElementNS(SVG_NS, "svg");
  for (const [k, v] of Object.entries({ viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" })) icon.setAttribute(k, v);
  const line = doc.createElementNS(SVG_NS, "path");
  line.setAttribute("d", CLOSE_PATH);
  icon.appendChild(line);
  close.appendChild(icon);
  const part = (cls: string, name: string, text: string): HTMLElement => {
    const p = doc.createElement("p");
    p.className = cls;
    p.dataset.dragon = name;
    p.textContent = text;
    return p;
  };
  if (note.gauge) {
    card.append(close, ...gaugeParts(doc, note.name, note.gauge));
    return card;
  }
  card.append(close, part("dg-nc-n", "note-name", note.name), part("dg-nc-t", "note-text", note.text));
  if (note.example !== undefined) card.append(part("dg-nc-e", "note-example", note.example));
  return card;
}

/**
 * 図の枠 `frame` の札の層を作る。札で見せる箱が無い図は何も作らず `undefined` を返す。
 * 札の外を押した時に閉じるため、頁の全体の押す動きを聞く。札の中と印の付いた箱を押した時は、図の枠の処理が開け閉めを決める。
 * 再生の操作の列 `controls` を押した時は閉じない。流すと止めるの切り替えは箱の位置を変えず、段を送る操作は `stepped` が閉じるため
 */
export function mountNoteCards(doc: Document, frame: HTMLElement, controls: Element, layout: Layout, words: FigureText): NoteCards | undefined {
  const notes = layout.noteCards ?? [];
  if (notes.length === 0) return undefined;
  const layer = doc.createElement("div");
  layer.className = "dg-notes";
  layer.dataset.dragon = "notes";
  const cards = new Map(notes.map((note) => [note.box, noteCard(doc, note, layout, words)]));
  // 目盛りの札の見た目の規則は、目盛りの札を持つ図の札の層にだけ置く (#3896)
  if (notes.some((note) => note.gauge)) layer.append(Object.assign(doc.createElement("style"), { textContent: GAUGE_CARD_CSS }));
  layer.append(...cards.values());
  let opened: { box: string; card: HTMLElement; step: number } | undefined;
  const close = (): void => {
    opened?.card.removeAttribute("data-open");
    opened = undefined;
  };
  const open = (box: string, anchor: Element, step: number): void => {
    const again = opened?.box === box;
    close();
    const card = cards.get(box);
    if (again || !card) return;
    // 目盛りの札は、押した段までの行だけを見せる (#3896)
    for (const row of card.querySelectorAll<HTMLElement>(".dg-ngr")) row.hidden = Number(row.dataset.step) > step;
    // 札は図の枠の左上から置く。枠が札より狭い時は枠の幅にし、枠の左右の外へ出さない
    const f = frame.getBoundingClientRect();
    const r = anchor.getBoundingClientRect();
    const width = f.width > 0 ? Math.min(N.card, f.width) : N.card;
    const left = Math.max(0, Math.min(r.left + r.width / 2 - f.left - width / 2, f.width - width));
    card.style.width = `${r1(width)}px`;
    card.style.left = `${r1(left)}px`;
    card.style.top = `${r1(r.bottom - f.top + N.gap)}px`;
    card.dataset.open = "";
    opened = { box, card, step };
  };
  const onOutside = (event: Event): void => {
    if (!opened) return;
    const path = event.composedPath();
    if (path.includes(opened.card) || path.includes(controls) || path.some((el) => (el as Element).hasAttribute?.("data-note") === true)) return;
    close();
  };
  doc.addEventListener("click", onOutside);
  // 判定の表の横に送る枠を送ると閉じる。送る枠の scroll は上へ伝わらないので、図の枠で先に聞く
  const onScroll = (event: Event): void => {
    if ((event.target as Element | null)?.matches?.('[data-dragon="judge-scroll"]')) close();
  };
  frame.addEventListener("scroll", onScroll, true);
  return {
    layer,
    open,
    close,
    stepped: (step) => {
      if (opened && opened.step !== step) close();
    },
    destroy: () => {
      doc.removeEventListener("click", onOutside);
      frame.removeEventListener("scroll", onScroll, true);
      layer.remove();
    },
  };
}
