/**
 * 押すと出る札の描き方 (#3877)。
 *
 * 札で見せる図は、`note` を持つ箱の説明を名前の下に描かず、札 (`SceneNote`) に移す。箱は名前の下の字の幅まで広げない。
 * 札を持つ箱は、箱の札ごと押せる組 (`data-note`) で包み、右上の内側に丸い i の印を描く。
 * 再生の部品に置いた図は、図の枠の中の層に箱ごとの札を持ち (`mountNoteCards`)、印の付いた箱を押すと箱のすぐ下に札を開く。
 * 札の位置は押した時に箱と図の枠の四角を測って決めるので、寄って追う図でも押した箱の下に出る。
 * 札の外か閉じるのアイコンを押すと閉じ、段を送ると閉じる。段が替わると箱の位置と中身が替わり、開いたままの札が別の箱を指すため。再生の操作の列を押しただけでは閉じない。
 * 印刷の形では全ての札を開き、図の幅と高さに対する箱の真ん中と下端の割合 (`--nx` と `--ny`) の所に置く。
 * 札の見た目の規則は再生の部品の規則 (`player.ts` の `playerCss`) が持つ。
 */
import type { FigureText } from "../../figure-text";
import type { Layout, SceneBox, SceneNote } from "../../layout/scene";
import { LOOK, TYPE } from "../../look/values";
import { cssFont, esc } from "../../render/parts";
import { r1 } from "../../render/round";
import type { DiagramModel } from "../../schema";

const N = LOOK.note;

/**
 * 札で見せる図 (`note: "pop"`) の箱の説明を札に移す。札で見せない図はそのまま返し、札を持たない。
 * 移した箱は名前の下の字 (`sub`) と例 (`example`) を持たないので、並べ方は名前の下の字を描かない幅で箱を置く
 */
export function takeNotes(diagram: DiagramModel): { diagram: DiagramModel; notes: Omit<SceneNote, "x" | "y">[] } {
  if (diagram.note !== "pop") return { diagram, notes: [] };
  const notes = diagram.boxes.flatMap((b) => (b.sub === undefined ? [] : [{ box: b.id, name: b.name, text: b.sub, ...(b.example !== undefined ? { example: b.example } : {}) }]));
  if (notes.length === 0) return { diagram, notes };
  return { diagram: { ...diagram, boxes: diagram.boxes.map(({ sub: _sub, example: _example, ...box }) => box) }, notes };
}

/** 札の印の丸の真ん中を、箱 `box` の右上の角から `inset` だけ内側に置く */
export const noteAt = (note: Omit<SceneNote, "x" | "y">, box: SceneBox): SceneNote => ({ ...note, x: box.x + box.w - N.inset, y: box.y + N.inset });

/** 札に印の丸の真ん中を足す。並べた箱に無い箱の札は落とす */
export const placeNotes = (notes: readonly Omit<SceneNote, "x" | "y">[], boxes: readonly SceneBox[]): SceneNote[] =>
  notes.flatMap((note) => {
    const box = boxes.find((b) => b.id === note.box && !b.ghost);
    return box ? [noteAt(note, box)] : [];
  });

/** 印の見た目の規則。札で見せる図の SVG にだけ書き、ほかの図の SVG を変えない */
export const NOTE_CSS =
  ".dg-np{cursor:pointer}.dg-np:focus{outline:none}" +
  `.dg-nbc{fill:var(--c-blue)}.dg-np:focus-visible .dg-nbc{stroke:var(--ink);stroke-width:${LOOK.stroke.on}}` +
  `.dg-nbt{${cssFont(TYPE.noteMark)};font-style:italic;fill:var(--on-c);pointer-events:none}`;

/**
 * 札を持つ箱。箱の札 `inner` を押せる組で包み、右上の内側に丸い i の印を描く。
 * 印の真ん中は `y` で、寄って追う時系列図の頭の列の箱は頭の箱の上端から測った `y` を渡す
 */
export function noteMark(note: SceneNote, inner: string, y: number = note.y): string {
  return (
    `<g class="dg-np" data-note="${esc(note.box)}">${inner}` +
    `<g class="dg-nb"><circle class="dg-nbc" cx="${r1(note.x)}" cy="${r1(y)}" r="${N.badge}"/>` +
    `<text class="dg-nbt" x="${r1(note.x)}" y="${r1(y + TYPE.noteMark.size * 0.36)}" text-anchor="middle">i</text></g></g>`
  );
}

/** 図の上に札を描く時の SVG の名前空間 */
const SVG_NS = "http://www.w3.org/2000/svg";
/** 閉じるのアイコンの線 (24 の升の中の 2 本の斜めの線) */
const CLOSE_PATH = "M6 6l12 12M18 6L6 18";

export interface NoteCards {
  /** 箱 `box` の札を、押した箱の要素 `anchor` のすぐ下に開く。開いている同じ箱の札は閉じる。段 `step` で開いたことを覚える */
  open(box: string, anchor: Element, step: number): void;
  /** 開いている札を閉じる */
  close(): void;
  /** 段が替わった時に呼ぶ。開いた時と違う段なら札を閉じる */
  stepped(step: number): void;
  /** 頁から外す */
  destroy(): void;
}

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
 * 図の枠 `frame` に札の層を置く。札で見せる箱が無い図は何も置かず `undefined` を返す。
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
  frame.append(layer);
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
  return {
    open,
    close,
    stepped: (step) => {
      if (opened && opened.step !== step) close();
    },
    destroy: () => {
      doc.removeEventListener("click", onOutside);
      layer.remove();
    },
  };
}
