/**
 * 量の行き先の図の段ごとの帯の見た目 (`[shape: rows]`、#3641) の置き場所。見た目の元は step 2 で決めた案 (動く試作の案Bから、続いている区画の字と残りの点線の枠を減らした版)。
 *
 * 段ごとに図の幅いっぱいの帯を1行ずつ上から積み、各行をその段までの線で分かれた区画に分ける。帯の線と箱は帯の図 (`layout.ts`) と同じ流れから読む。
 * 区画の幅は、出どころの無い箱の量の和に比べた量で決める。最初の行は出どころの無い箱を書いた順に並べ、線を読むたびに、出どころの区画の幅の内の左から行き先の区画を切り出す。
 * 出どころの区画の残りは切り出した区画の右に残り、出どころの無い箱の残りは灰色の残りの区画 (`rest:<名札>`) にする。残りが無くなった区画は行から外す。
 * その段で新しく分かれた区画と最後の行の区画は名前と量を書き、前の段から続いている区画は字を書かない。名前が区画に入らない時は量だけを書き (量も入らなければ字を書かず)、
 * その行の帯の下に色の印と名前を並べる。上の行から下りる帯と量の札は、その段で新しく分かれた区画にだけ引く。
 * 既定の幅で描いた字を枠の幅 (`width`) に縮めると読める大きさに届かない時は、図の幅を枠の幅にして描く
 */
import { textWidth } from "../../layout/measure";
import { boxColors, carrierHalf, type Point, type Rect, type SceneBadge, type SceneEdge } from "../../layout/scene";
import { SANKEY_LOOK, SANKEY_ROWS, SANKEY_ROWS_TYPE } from "../../look/sankey";
import { type ColorKey, LOOK, READABLE_PX } from "../../look/values";
import type { DiagramModel } from "../../schema";
import type { NotationLang } from "../../words";
import { amountText, type Flow, flowsOf, type SankeyLayout } from "./layout";

/** 区画と帯の下に書く字。`x` と `y` は字の左の端と基準線、`rect` は字の四角 */
export interface SankeyRowText {
  text: string;
  x: number;
  y: number;
  rect: Rect;
}

/**
 * 行の区画。`id` は区画の名札で、箱の区画は箱の名札、出どころの無い箱の残りは `rest:<名札>`。`box` は区画が表す箱。
 * `kind` は、その段で新しく分かれた区画 (`new`)、前の段から続いている区画 (`carried`)、出どころの無い箱のまだ分けていない残り (`rest`)。
 * `amount` は区画の量、`name` と `value` は区画の中に書く名前と量
 */
export interface SankeyRowSection extends Rect {
  id: string;
  box: string;
  kind: "new" | "carried" | "rest";
  color: ColorKey;
  amount: number;
  name?: SankeyRowText;
  value?: SankeyRowText;
}

/** 帯の下に並べる名前。`mark` は区画と同じ色の印の四角 */
export interface SankeyRowName {
  id: string;
  color: ColorKey;
  mark: Rect;
  name: SankeyRowText;
}

/** 段ごとの行。行の四角は図の幅いっぱいの帯 */
export interface SankeyRow extends Rect {
  step: number;
  sections: SankeyRowSection[];
  names: SankeyRowName[];
}

/** 上の行から下の行へ下りる帯。`x` と `w` は下の行の新しく分かれた区画の幅、`y1` は上の行の帯の下の縁、`y2` は下の行の帯の上の縁 */
export interface SankeyDrop {
  step: number;
  event: number;
  from: string;
  to: string;
  x: number;
  w: number;
  y1: number;
  y2: number;
  color: ColorKey;
}

const R = SANKEY_ROWS;
const T = SANKEY_ROWS_TYPE;

/** 字の形の上の縁から基準線まで、基準線から下の縁まで (`textBox` と同じ割り方) */
const ascent = (size: number): number => size * 0.8;
const descent = (size: number): number => size * 0.2;

/** 残りの量の字 */
const REST_TEXT: Record<NotationLang, (amount: string) => string> = {
  ja: (amount) => `残り${amount}`,
  en: (amount) => `${amount} left`,
};

/** 字 `text` を左の端 `x` と基準線 `y` に置いた時の、字と字の四角 */
function placed(text: string, x: number, y: number, size: number, w: number): SankeyRowText {
  return { text, x, y, rect: { x, y: y - ascent(size), w, h: ascent(size) + descent(size) } };
}

/** 並べている区画。`id` と `box` と `amount` は `SankeyRowSection` と同じ、`born` は区画が現れた段 */
interface Cell {
  id: string;
  box: string;
  amount: number;
  born: number;
}

/** 量 `amount` を、量がほぼ 0 か (小数の足し算の端数を 0 と見る) */
const empty = (amount: number, whole: number): boolean => amount <= Math.max(whole, 1) * 1e-9;

/**
 * 段ごとの帯の見た目を並べる。`frame` は図の幅を枠の幅にする時の枠の幅で、`undefined` なら既定の幅で描く
 */
function arrangeRows(diagram: DiagramModel, lang: NotationLang, frame: number | undefined): SankeyLayout {
  const colors = boxColors(diagram);
  const flows = flowsOf(diagram);
  const boxNames = new Map(diagram.boxes.map((b) => [b.id, b.name]));
  const into = (id: string): Flow[] => flows.filter((f) => f.to === id);
  const outOf = (id: string): Flow[] => flows.filter((f) => f.from === id);
  const roots = diagram.boxes.filter((b) => into(b.id).length === 0 && outOf(b.id).length > 0).map((b) => b.id);
  const rootAmount = (id: string): number => outOf(id).reduce((s, f) => s + f.amount, 0);
  const whole = roots.reduce((s, id) => s + rootAmount(id), 0);
  /** 箱の量の字を組む線の名前。行き先は入る線、出どころの無い箱は出る線 */
  const labelsOf = (id: string): string[] => (into(id).length > 0 ? into(id) : outOf(id)).map((f) => f.label);

  // 段ごとの区画の並び。線を書いた順に、出どころの区画の残りの左に行き先の区画を切り出す
  let cells: Cell[] = roots.map((id) => ({ id, box: id, amount: rootAmount(id), born: 0 }));
  const snapshots: Cell[][] = diagram.steps.map((_, s) => {
    for (const f of flows.filter((x) => x.step === s)) {
      const at = cells.findIndex((c) => c.box === f.from);
      const cell: Cell = { id: f.to, box: f.to, amount: f.amount, born: s };
      if (at < 0) {
        cells = [...cells, cell];
        continue;
      }
      const parent = cells[at] as Cell;
      const left = parent.amount - f.amount;
      // 出どころの無い箱を初めて分けた時は、残りを残りの区画にする
      const rest: Cell = roots.includes(parent.box) && !parent.id.startsWith("rest:") ? { ...parent, id: `rest:${parent.box}`, amount: left, born: s } : { ...parent, amount: left };
      cells = [...cells.slice(0, at), cell, ...(empty(left, whole) ? [] : [rest]), ...cells.slice(at + 1)];
    }
    return cells;
  });

  const { r } = LOOK.badge;
  const width = frame ?? R.width;
  const phone = frame !== undefined;
  const pad = phone ? R.phone.pad : SANKEY_LOOK.pad;
  const rowX = pad + r * 2 + (phone ? R.phone.badgeGap : R.badge.gap);
  const rowW = width - pad - rowX;
  const drop = phone ? R.phone.drop : R.drop;
  const last = snapshots.length - 1;
  const chipHalf = (text: string): Point => carrierHalf({ kind: "tag", text });

  const rows: SankeyRow[] = [];
  let y = pad;
  snapshots.forEach((snapshot, k) => {
    let cum = 0;
    const sections: SankeyRowSection[] = snapshot.map((cell) => {
      const left = rowX + (whole > 0 ? (cum / whole) * rowW : 0);
      cum += cell.amount;
      const right = rowX + (whole > 0 ? (cum / whole) * rowW : 0);
      const kind: SankeyRowSection["kind"] = cell.id.startsWith("rest:") ? "rest" : cell.born === k ? "new" : "carried";
      return { id: cell.id, box: cell.box, kind, color: kind === "rest" ? "slate" : (colors.get(cell.box) ?? "slate"), amount: cell.amount, x: left + R.gap / 2, y, w: Math.max(1, right - left - R.gap), h: R.bar.h };
    });
    const listed: { section: SankeyRowSection; text: string }[] = [];
    for (const s of sections) {
      const cell = snapshot.find((c) => c.id === s.id) as Cell;
      const inner = s.w - R.padX * 2;
      if (s.kind === "rest") {
        const text = REST_TEXT[lang](amountText(s.amount, labelsOf(s.box)));
        const w = textWidth(text, T.rest);
        if (w <= inner) s.value = placed(text, s.x + s.w / 2 - w / 2, y + R.bar.h / 2 + ascent(T.rest.size) / 2, T.rest.size, w);
        continue;
      }
      if (s.kind === "carried" && k < last) continue;
      // 1 本の線で現れたまま分けていない区画は線の名前を、出どころの無い箱と分けた後の残りは量から組んだ字を書く
      const flow = into(cell.box).length === 1 ? into(cell.box)[0] : undefined;
      const valueText = flow && empty(Math.abs(flow.amount - cell.amount), whole) ? flow.label : amountText(cell.amount, labelsOf(cell.box));
      const name = boxNames.get(cell.box) ?? cell.box;
      const nameW = textWidth(name, T.name);
      const valueW = textWidth(valueText, T.value);
      if (nameW <= inner && valueW <= inner) {
        const base = y + R.nameAt;
        s.name = placed(name, s.x + R.padX, base, T.name.size, nameW);
        s.value = placed(valueText, s.x + R.padX, base + R.lines, T.value.size, valueW);
        continue;
      }
      if (valueW <= inner) s.value = placed(valueText, s.x + s.w / 2 - valueW / 2, y + R.bar.h / 2 + ascent(T.value.size) / 2, T.value.size, valueW);
      listed.push({ section: s, text: s.value ? name : `${name} ${valueText}` });
    }
    // 帯の下に並べる名前。区画の左の端の下に置き、前の名前と重なる時は右へずらし、行の右の端を越える時は端に寄せる。それでも前の名前と重なる名前は次の行へ送る
    const N = R.names;
    const names: SankeyRowName[] = [];
    let nx = rowX;
    let line = 0;
    for (const { section, text } of listed) {
      const w = textWidth(text, T.list);
      const span = N.mark + N.markGap + w;
      let x = Math.max(nx, Math.min(section.x, rowX + rowW - span));
      if (nx > rowX && x + span > rowX + rowW) {
        x = Math.max(rowX, Math.min(section.x, rowX + rowW - span));
        line += 1;
      }
      nx = x;
      const base = y + R.bar.h + N.gap + ascent(T.list.size) + line * N.row;
      names.push({
        id: section.id,
        color: section.color,
        mark: { x: nx, y: base - ascent(T.list.size) / 2 - N.mark / 2, w: N.mark, h: N.mark },
        name: placed(text, nx + N.mark + N.markGap, base, T.list.size, w),
      });
      nx += span + N.apart;
    }
    rows.push({ step: k, x: rowX, y, w: rowW, h: R.bar.h, sections, names });
    const below = names.length > 0 ? N.gap + (line + 1) * N.row : 0;
    y += R.bar.h + below + drop;
  });

  // 下りる帯と量の札の道。その段で新しく分かれた区画にだけ、上の行の帯の下の縁から下の行の帯の上の縁まで引く
  const drops: SankeyDrop[] = [];
  const edges: SceneEdge[] = [];
  for (const f of flows) {
    const row = rows[f.step];
    const above = rows[f.step - 1];
    const s = row?.sections.find((x) => x.id === f.to && x.kind === "new");
    if (!row || !s) continue;
    const y1 = above ? above.y + above.h : row.y - drop;
    const listedBelow = above && above.names.length > 0 ? Math.max(...above.names.map((n) => n.name.rect.y + n.name.rect.h)) : y1;
    drops.push({ step: f.step, event: f.event, from: f.from, to: f.to, x: s.x, w: s.w, y1, y2: row.y, color: s.color });
    // 量の札は帯の下の名前より下から、下の行の帯の上の縁の手前まで落ちる
    const [, hy] = chipHalf(f.label);
    const top = Math.max(y1, listedBelow) + R.chip + hy;
    const bottom = Math.max(top, row.y - R.chip - hy);
    const cx = s.x + s.w / 2;
    edges.push({
      step: f.step,
      event: f.event,
      from: f.from,
      to: f.to,
      points: Array.from({ length: SANKEY_LOOK.samples + 1 }, (_, i): Point => [cx, top + ((bottom - top) * i) / SANKEY_LOOK.samples]),
      color: s.color,
      carry: { kind: "tag", text: f.label },
    });
  }

  // 段の番号は、行の帯の左に置く。色はその行で最初に新しく分かれた区画の色
  const badges: SceneBadge[] = rows.map((row) => ({ step: row.step, x: pad + r, y: row.y + row.h / 2, color: row.sections.find((s) => s.kind === "new")?.color ?? "slate" }));
  const lastRow = rows.at(-1);
  const bottomOf = (row: SankeyRow): number => Math.max(row.y + row.h, ...row.names.map((n) => n.name.rect.y + n.name.rect.h));
  return {
    kind: "sankey",
    arrangement: "rows",
    width,
    height: (lastRow ? bottomOf(lastRow) : pad) + pad,
    regions: [],
    boxes: [],
    lifelines: [],
    edges,
    labels: [],
    actions: [],
    badges,
    paths: [],
    ends: [],
    nodes: [],
    bands: [],
    rows,
    drops,
  };
}

/** 段ごとの帯の見た目を並べる。既定の幅で描いた字を枠の幅 `width` に縮めると読める大きさに届かない時は、図の幅を枠の幅にして描き直す */
export function layoutRows(diagram: DiagramModel, lang: NotationLang, width: number | undefined): SankeyLayout {
  const wide = arrangeRows(diagram, lang, undefined);
  if (width === undefined || (width / wide.width) * T.name.size >= READABLE_PX) return wide;
  return arrangeRows(diagram, lang, width);
}
