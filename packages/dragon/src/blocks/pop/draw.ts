/**
 * 押すと出る札の描き方 (#3877)。
 *
 * 札で見せる図は、`note` を持つ箱の説明を名前の下に描かず、札 (`SceneNote`) に移す。箱は名前の下の字の幅まで広げない。
 * 札を持つ箱は、箱の札ごと押せる組 (`data-note`) で包み、右上の内側に丸い i の印を描く。
 * 再生の部品に置いた図の札の層は `cards.ts` が作る。
 */
import type { SceneBox, SceneNote } from "../../layout/scene";
import { LOOK } from "../../look/values";
import { esc } from "../../render/parts";
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
  ".dg-nbt{fill:var(--on-c);pointer-events:none}";

/**
 * 印の丸の中の斜めの i (#3890)。字 (`text`) で描くと、字の形が字の箱の中で右と上に寄り、丸の真ん中から右へ約1px、上へ約0.5pxずれたので、
 * 縦の線 (平行四辺形) と点の丸で描き、字の形の上下左右の真ん中を丸の真ん中 `(cx, cy)` に揃える。
 * 縦の線は真ん中から左へ1.9と右へ1.0、点は右へ0.75の所に半径1.2で置き、上の端 (点の上) と下の端 (線の下) は真ん中から4.3ずつ。
 * 箱の札の印と判定の表の印が同じ形を描く。`cls` は字の部品に付ける名前
 */
export function noteGlyph(cx: number, cy: number, cls: string): string {
  return (
    `<path class="${cls}" d="M${r1(cx - 1.9)} ${r1(cy + 4.3)}h1.8l1.1-5.3h-1.8z"/>` +
    `<circle class="${cls}" cx="${r1(cx + 0.75)}" cy="${r1(cy - 3.1)}" r="1.2"/>`
  );
}

/**
 * 札を持つ箱。箱の札 `inner` を押せる組で包み、右上の内側に丸い i の印を描く。
 * 印の真ん中は `y` で、寄って追う時系列図の頭の列の箱は頭の箱の上端から測った `y` を渡す
 */
export function noteMark(note: SceneNote, inner: string, y: number = note.y): string {
  return (
    `<g class="dg-np" data-note="${esc(note.box)}">${inner}` +
    `<g class="dg-nb"><circle class="dg-nbc" cx="${r1(note.x)}" cy="${r1(y)}" r="${N.badge}"/>` +
    `${noteGlyph(note.x, y, "dg-nbt")}</g></g>`
  );
}
