/**
 * 押すと出る札の層 (#3877)。
 *
 * 再生の部品に置いた図は、図の枠の中の層に箱ごとの札を持ち、印の付いた箱を押すと箱のすぐ下に札を開く。
 * 札の位置は押した時に箱と図の枠の四角を測って決めるので、寄って追う図でも押した箱の下に出る。
 * 札の外か閉じるのアイコンを押すと閉じ、段を送ると閉じる。段が替わると箱の位置と中身が替わり、開いたままの札が別の箱を指すため。再生の操作の列を押しただけでは閉じない。
 * 判定の表 (#3890) は、規則の見出しと例の名前のセルを箱と同じく押せる所にし、表を横に送ると閉じる。送ると札が指すセルの位置が動くため。
 * 印刷の形では全ての札を開き、図の幅と高さに対する箱の真ん中と下端の割合 (`--nx` と `--ny`) の所に置く。
 * 札の見た目の規則は再生の部品の規則 (`player.ts` の `playerCss`) が持つ。
 * 札で見せる図だけが使うので、軽い入口は最初に読む量に入れず、札で見せる図を置いた時に後から読む (`cards-store.ts`)
 */
import type { FigureText } from "../../figure-text";
import type { Layout, SceneNote } from "../../layout/scene";
import { LOOK } from "../../look/values";
import { r1 } from "../../render/round";
import type { NoteCards } from "./cards-store";

const N = LOOK.note;

/** 図の上に札を描く時の SVG の名前空間 */
const SVG_NS = "http://www.w3.org/2000/svg";
/** 閉じるのアイコンの線 (24 の升の中の 2 本の斜めの線) */
const CLOSE_PATH = "M6 6l12 12M18 6L6 18";

/** 箱の札を 1 枚作る。`--nx` と `--ny` は印刷の形で札を置く、図の幅と高さに対する割合 */
function noteCard(doc: Document, note: SceneNote, layout: Layout, words: FigureText): HTMLElement {
  const card = doc.createElement("div");
  card.className = "dg-nc";
  card.dataset.dragon = "note-card";
  card.dataset.box = note.box;
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-label", note.name);
  const box = layout.boxes.find((b) => b.id === note.box);
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
