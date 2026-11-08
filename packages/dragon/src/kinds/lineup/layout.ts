/**
 * 列の図の置き場所 (#3239)。卓の形 (#3351) の見た目の元は `docs/design/lineup/auction.pen` の 2 枚の板 (横に並べた形と、携帯の幅で縦に組んだ形)。
 *
 * 箱 (`box`) は宣言した順に左から並ぶ。`[order: none]` の箱は順番の無い置き場で、チップを格子に並べ、点線の枠で描く。
 * ほかの箱は札で、チップを `line` に書いた順に上から積み、札の下の端に `note` の字 (`sub` と段の中の `note`) を大きく出す。
 * どの札も同じ幅と高さにし、高さは札に積む最も多い枚数で決まる。置き場と札が隣り合う所には左から右へ向く矢印を置く。
 * 枠の幅 (`width`) を渡し、横に並べると箱の名前が `READABLE_PX` に届かない時は縦に組む。置き場を札の列の幅の帯にし、
 * 続いた札を 1 列にまとめ、宣言した順に上から積む。帯と札の列の間の矢印は上から下へ向く。
 *
 * 図の上に段の題と文 (`say`) を段ごとに出し、その下に役 (`role`) の札を並べる。札の下には `line` を書いた段にだけ出る一言を置く。
 * 一言は段の始まりに置き場に在ったチップと比べ、色付きのチップの席の番号、置き場に無かったチップを足したこと、置き場の色付きのチップが無いことを言う。
 * 一言の下に後の段の題を並べた「この先」の帯を、その下にチップの説明 (`item` の `note`) の凡例を置く。
 *
 * 段の中の `line` を書いた順に辿り、チップが席に居る間を 1 回ずつ `LineupSeat` にする。
 * 滑り始める所は、同じ箱に居たチップならその席、ほかの箱に居たチップなら段の始まりの居場所で、選んだ箱に居ればその席、なければ最後に座った席。
 * どの箱にも居なかったチップは滑り始める所を持たない。同じ席に残るチップは前の `LineupSeat` のまま続ける。
 * 元の箱を書き換えない時は元の席のチップも残る。元の箱を書き換えた時は、元の席の `until` に書き換えた出来事を書く。
 *
 * 原本の JSON が宣言していない箱とチップを書く時は、その箱とチップを除いて描く。同じ箱に同じチップを書く時は最初の 1 枚だけを描く。
 * 開いている箱への `open` と、封をした箱への `seal` は描かない。
 *
 * 段の番号は図の右上の同じ所に置き、次の段の番号と入れ替える。
 */
import { type ColorKey, LOOK, READABLE_PX, type TextStyle, TYPE } from "../../look/values";
import { LINEUP_LOOK } from "../../look/lineup";
import type { DiagramModel, DiagramEvent } from "../../schema";
import { DEFAULT_LANG, LANE_MOST, type NotationLang } from "../../words";
import { hasWide, textWidth } from "../../layout/measure";
import { besideSameSpot, boxColors, type Layout, layoutStrip, type Point, type Rect, type SceneBadge, type SceneBox, stripNeed } from "../../layout/scene";

const L = LINEUP_LOOK;

/**
 * 列の図の卓の形の字 (#3351)。札と置き場の名前の下の字、選んだ札の印、封の字、「この先」の帯の字、空の置き場の字。
 * 札の下の一言は、色付きのチップの席の番号、置き場に無かったチップを足したこと、置き場に在った色付きのチップが無いことを言う。
 * 列の図を描く時にだけ要るので、見本帳が最初に読む図の字の表 (`figure-text.ts`) ではなく、後から読む列の図の塊に置く (#3525)
 */
interface LineupWords {
  lineupInOrder: string;
  lineupNoOrder: string;
  lineupPicked: string;
  lineupSealed: string;
  lineupAhead: string;
  lineupEmpty: string;
  lineupAt: (name: string, n: number) => string;
  lineupAdded: (names: string[]) => string;
  lineupMissing: (name: string) => string;
}

const LINEUP_WORDS: Record<NotationLang, LineupWords> = {
  ja: {
    lineupInOrder: "上から実行",
    lineupNoOrder: "順番なし",
    lineupPicked: "選ばれる",
    lineupSealed: "封",
    lineupAhead: "この先",
    lineupEmpty: "まだ空",
    lineupAt: (name, n) => `${name}は${n}番目`,
    lineupAdded: (names) => `${names.join("、")}を足した`,
    lineupMissing: (name) => `${name}が無い`,
  },
  en: {
    lineupInOrder: "Top first",
    lineupNoOrder: "No order",
    lineupPicked: "Picked",
    lineupSealed: "Sealed",
    lineupAhead: "Next",
    lineupEmpty: "Empty",
    lineupAt: (name, n) => `${name} is #${n}`,
    lineupAdded: (names) => `Added ${names.join(", ")}`,
    lineupMissing: (name) => `${name} is missing`,
  },
};
const C = L.chip;
/** 1 行の字。`x` は左端、`baseline` は基準線 */
export interface TextLine {
  text: string;
  x: number;
  baseline: number;
}

/** 字。`text` は全文、`lines` は幅で折った行で、四角は全ての行の字の形を囲む */
export interface LineupText extends Rect {
  text: string;
  lines: TextLine[];
}

/** 箱。置き場 (`pool`) か札。`track` はチップを置く所で、`hint` は名前の下の字 (札は「上から実行」、置き場は「順番なし」) */
export interface LineupLane extends SceneBox {
  pool: boolean;
  title: LineupText;
  hint: LineupText;
  track: Rect;
  /** 札の下の端の字の最初の字と、その基準線。札だけが持ち、字を書かない札は `note` を持たない */
  note?: LineupText;
  noteBaseline?: number;
  /** 札の仕切りの高さ。札だけが持つ */
  foot?: number;
  /** 札の空の席の枠。札だけが持つ */
  slots: Rect[];
  /** 名前の下の字の左の矢印の左端。札だけが持つ */
  arrowX?: number;
  /** 空の置き場の字。置き場だけが持つ */
  empty?: LineupText;
}

/** 段の出来事の場所 */
export interface LineupAt {
  step: number;
  event: number;
}

/** チップが箱の席に居る間 1 回分。`from` は滑り始める左上で、弾んで現れるチップは持たない。`until` は席を離れる出来事。`label` は枠の中の字 */
export interface LineupSeat extends Rect, LineupAt {
  id: string;
  lane: string;
  index: number;
  label: LineupText;
  from?: Point;
  until?: LineupAt;
}

/** 封。`until` は開ける出来事 */
export interface LineupSeal extends Rect, LineupAt {
  lane: string;
  until?: LineupAt;
}

/** 箱に押す印 */
export interface LineupStamp extends Rect, LineupAt {
  lane: string;
  text: string;
}

/** 箱を選ぶ出来事。同じ箱を続けて選んだ時は最初の 1 つだけを持つ */
export interface LineupPick extends LineupAt {
  lane: string;
}

/** 選んだ札の頭の印 (「選ばれる」) */
export interface LineupMark extends Rect, LineupAt {
  lane: string;
  text: string;
}

/** 役の札。`steps` は役が動く段 */
export interface LineupRoleCard extends Rect {
  id: string;
  title: LineupText;
  note?: LineupText;
  steps: number[];
}

/** 段ごとの図の上の題と文 */
export interface LineupHeadline {
  step: number;
  title: LineupText;
  say?: LineupText;
}

/** 札の下の一言。`line` の出来事の段にだけ出る。`bar` は色の縦棒 */
export interface LineupRemark extends LineupAt {
  lane: string;
  color?: ColorKey;
  bar: Rect;
  text: LineupText;
}

/** 「この先」の帯の札。`step` は題の段、`no` は番号の箱 */
export interface LineupAheadTag extends Rect {
  step: number;
  no: Rect;
  number: LineupText;
  text: LineupText;
}

/** 段ごとの「この先」の帯。札は後の段の題で、`arrows` は札の間の矢印 */
export interface LineupAhead {
  step: number;
  label: LineupText;
  tags: LineupAheadTag[];
  arrows: Point[][];
}

/** 凡例の行。`swatch` は色の枠の見本 */
export interface LineupLegendRow {
  color?: ColorKey;
  swatch: Rect;
  text: LineupText;
}

/** 置き場と札の間の矢印 */
export interface LineupArrow {
  from: string;
  to: string;
  points: Point[];
}

export interface LineupLayout extends Layout {
  kind: "lineup";
  /** 箱を横に並べたか (`row`)、置き場を帯にして札の列の上下に積んだか (`stack`) */
  arrangement: "row" | "stack";
  lanes: LineupLane[];
  chips: LineupSeat[];
  seals: LineupSeal[];
  stamps: LineupStamp[];
  picks: LineupPick[];
  marks: LineupMark[];
  roles: LineupRoleCard[];
  /** 図の題 */
  heading: LineupText;
  headlines: LineupHeadline[];
  remarks: LineupRemark[];
  aheads: LineupAhead[];
  legend: LineupLegendRow[];
  arrows: LineupArrow[];
  /** 封の字 */
  sealWord: string;
}

export interface LineupOptions {
  /** 描く枠の幅。渡すと、横に並べると箱の名前が読めない幅で縦に組む */
  width?: number;
  lang?: NotationLang;
}

/** 札の下の端の字を、数と単位に分ける。`0.05 ETH` は `0.05` と `ETH`。数で終わらない字は分けない */
export function splitNote(text: string): { number: string; unit?: string } {
  const m = /^(.*\d)\s+(\D+)$/u.exec(text);
  return m ? { number: m[1] as string, unit: m[2] } : { number: text };
}

/** 札の下の端の字の幅。数と単位を別の大きさで描く */
export function noteWidth(text: string): number {
  const { number, unit } = splitNote(text);
  return textWidth(number, TYPE.laneNote) + (unit === undefined ? 0 : L.card.unitGap + textWidth(unit, TYPE.laneUnit));
}

/** 1 行の字 */
function single(text: string, x: number, baseline: number, style: TextStyle): LineupText {
  const w = textWidth(text, style);
  return { text, lines: [{ text, x, baseline }], x, y: baseline - style.size * 0.8, w, h: style.size };
}

/** 字の後ろで折ってよい字か。読点と句点と閉じ括弧の前では折らない */
const CLOSING = new Set([..."、。，．）」』！？,.)"]);

/** 字を幅 `width` に収まる行に折る。和文は字の間で、欧文は空白の後で折る */
export function wrap(text: string, style: TextStyle, width: number): string[] {
  if (textWidth(text, style) <= width) return [text];
  const chars = [...text];
  const tokens: string[] = [];
  let cur = "";
  chars.forEach((ch, i) => {
    const prev = chars[i - 1] ?? "";
    const breakable = cur !== "" && !CLOSING.has(ch) && (hasWide(ch) || hasWide(prev) || /\s/u.test(prev));
    if (breakable) {
      tokens.push(cur);
      cur = "";
    }
    cur += ch;
  });
  if (cur !== "") tokens.push(cur);
  const lines: string[] = [];
  let line = "";
  for (const token of tokens) {
    const next = line + token;
    if (line !== "" && textWidth(next.trimEnd(), style) > width) {
      lines.push(line.trimEnd());
      line = token.trimStart();
    } else {
      line = next;
    }
  }
  if (line !== "") lines.push(line.trimEnd());
  return lines;
}

/** 幅 `width` で折った字。1 行目の基準線を `baseline` に置き、`pitch` ずつ下げる */
function wrapped(text: string, x: number, baseline: number, style: TextStyle, width: number, pitch: number): LineupText {
  const rows = wrap(text, style, width);
  const lines = rows.map((t, k) => ({ text: t, x, baseline: baseline + k * pitch }));
  const w = Math.max(0, ...rows.map((t) => textWidth(t, style)));
  const top = baseline - style.size * 0.8;
  return { text, lines, x, y: top, w, h: (rows.length - 1) * pitch + style.size };
}

/** 字を `dx` と `dy` だけずらす */
function moved(t: LineupText, dx: number, dy: number): LineupText {
  return { ...t, x: t.x + dx, y: t.y + dy, lines: t.lines.map((l) => ({ ...l, x: l.x + dx, baseline: l.baseline + dy })) };
}

const bottomOf = (r: Rect): number => r.y + r.h;

/** 段の中の `line` 1 つ。宣言したチップだけを、同じチップは最初の 1 枚だけ、上限の枚数まで持つ */
interface Line extends LineupAt {
  lane: string;
  items: string[];
}

function linesOf(diagram: DiagramModel, known: Set<string>, lanes: Set<string>): Line[] {
  return diagram.steps.flatMap((step, s) =>
    step.events.flatMap((e, k): Line[] => (e.type === "line" && "box" in e && lanes.has(e.box) ? [{ step: s, event: k, lane: e.box, items: [...new Set(e.items)].filter((id) => known.has(id)).slice(0, LANE_MOST) }] : [])),
  );
}

/** 札の下の端に出る字。`sub` と段の中の `note` */
function notesOf(diagram: DiagramModel, id: string, sub: string | undefined): string[] {
  const written = diagram.steps.flatMap((step) => step.events.flatMap((e) => (e.type === "swap" && e.box === id ? [e.text] : [])));
  return sub === undefined ? written : [sub, ...written];
}

/**
 * 置き場のチップを格子に並べた四角 (#3408)。`inner` の上端から行を積み、行ごとに `gapX` 以上空けて等しく割った枠の真ん中に置く。
 * どのチップも最も広いチップの幅にそろえ、同じ行の上端と同じ列の左端をそろえる。席ごとにずらすと、崩れたように見えて間の詰まる所ができた
 */
function grid(widths: number[], inner: { x: number; y: number; w: number }, gapX: number): { seats: Rect[]; h: number } {
  const n = widths.length;
  if (n === 0) return { seats: [], h: C.h };
  const widest = Math.max(...widths);
  const fit = Math.max(1, Math.min(n, Math.floor((inner.w + gapX) / (widest + gapX))));
  const rows = Math.ceil(n / fit);
  const cols = Math.ceil(n / rows);
  const cell = inner.w / cols;
  const seats = widths.map((_, k) => {
    const x = inner.x + (k % cols) * cell + (cell - widest) / 2;
    const y = inner.y + Math.floor(k / cols) * (C.h + L.pool.gapY);
    return { x, y, w: widest, h: C.h };
  });
  return { seats, h: rows * (C.h + L.pool.gapY) - L.pool.gapY };
}

/** 札の下の一言の中身。置く所は並べ方が決める */
interface RemarkSpec extends LineupAt {
  lane: string;
  color?: ColorKey;
  text: string;
}

/**
 * 札の下の一言。札に `line` を書いた段ごとに、段の始まりに置き場に在ったチップと比べる。
 * 置き場に無かったチップは色ごとに 1 つの一言にまとめ、置き場に在った色付きのチップは席の番号か、無いことを言う。
 * 一言は札の中の最初の席の順に並べ、無いことを言う一言は最後に置く。段の始まりに置き場にチップが無い段は一言を出さない
 */
function remarksOf(diagram: DiagramModel, lines: Line[], pools: Set<string>, words: LineupWords): RemarkSpec[] {
  const items = new Map((diagram.lineup?.items ?? []).map((item) => [item.id, item]));
  const nameOf = (id: string): string => items.get(id)?.label ?? id;
  const held = new Map<string, string[]>();
  const out: RemarkSpec[] = [];
  diagram.steps.forEach((_, s) => {
    const pooled = [...held.entries()].filter(([lane]) => pools.has(lane)).flatMap(([, ids]) => ids);
    const inPool = new Set(pooled);
    for (const line of lines.filter((l) => l.step === s && !pools.has(l.lane))) {
      if (inPool.size === 0) continue;
      const found: { at: number; color?: ColorKey; text: string }[] = [];
      const added = new Map<string, { at: number; color?: ColorKey; ids: string[] }>();
      line.items.forEach((id, index) => {
        if (inPool.has(id)) return;
        const color = items.get(id)?.color;
        const key = color ?? "";
        const group = added.get(key) ?? { at: index, ...(color ? { color } : {}), ids: [] };
        group.ids.push(id);
        added.set(key, group);
      });
      for (const group of added.values()) found.push({ at: group.at, ...(group.color ? { color: group.color } : {}), text: words.lineupAdded(group.ids.map(nameOf)) });
      for (const id of [...new Set(pooled)]) {
        const color = items.get(id)?.color;
        if (!color) continue;
        const index = line.items.indexOf(id);
        found.push(index < 0 ? { at: Number.POSITIVE_INFINITY, color, text: words.lineupMissing(nameOf(id)) } : { at: index, color, text: words.lineupAt(nameOf(id), index + 1) });
      }
      found.sort((a, b) => a.at - b.at);
      for (const f of found) out.push({ step: line.step, event: line.event, lane: line.lane, ...(f.color ? { color: f.color } : {}), text: f.text });
    }
    for (const line of lines.filter((l) => l.step === s)) held.set(line.lane, line.items);
  });
  return out;
}

/** 箱の大きさだけを決めた物。置く所は並べ方が決める */
interface Sized {
  id: string;
  name: string;
  sub?: string;
  pool: boolean;
  color: ColorKey;
  w: number;
}

export function layoutLineup(diagram: DiagramModel, options: LineupOptions = {}): LineupLayout {
  const words = LINEUP_WORDS[options.lang ?? DEFAULT_LANG];
  const row = arrange(diagram, words, "row");
  const { width } = options;
  if (width === undefined || (width / row.width) * TYPE.boxName.size >= READABLE_PX) return row;
  return arrange(diagram, words, "stack");
}

function arrange(diagram: DiagramModel, words: LineupWords, arrangement: "row" | "stack"): LineupLayout {
  const stacked = arrangement === "stack";
  const margin = stacked ? L.stack.margin : L.margin;
  const pad = L.padX;
  const items = diagram.lineup?.items ?? [];
  const itemOf = new Map(items.map((item) => [item.id, item]));
  const nameOf = (id: string): string => itemOf.get(id)?.label ?? id;
  const chipW = (id: string): number => Math.max(C.minW, textWidth(nameOf(id), TYPE.chip) + C.padX * 2);
  const pools = new Set(diagram.boxes.filter((b) => b.order === "none").map((b) => b.id));
  const lines = linesOf(diagram, new Set(itemOf.keys()), new Set(diagram.boxes.map((b) => b.id)));
  const cardMost = Math.max(1, ...lines.filter((l) => !pools.has(l.lane)).map((l) => l.items.length));
  const colors = boxColors(diagram);
  const remarkSpecs = remarksOf(diagram, lines, pools, words);
  const hintText = (pool: boolean): string => (pool ? words.lineupNoOrder : words.lineupInOrder);
  const hintW = (pool: boolean): number => (pool ? 0 : L.hintArrow + L.hintGap) + textWidth(hintText(pool), TYPE.laneHint);
  const cardChips = Math.max(0, ...lines.filter((l) => !pools.has(l.lane)).flatMap((l) => l.items.map((id) => textWidth(nameOf(id), TYPE.chip) + C.padX * 2)));
  const cards = diagram.boxes.filter((b) => !pools.has(b.id));
  const cardNeed = Math.max(
    hintW(false),
    cardChips,
    ...cards.map((b) => textWidth(b.name, TYPE.boxName)),
    ...cards.flatMap((b) => notesOf(diagram, b.id, b.sub).map(noteWidth)),
  );
  /** 置き場の幅。横に並べた置き場は、2 枚以上を置くなら最も広いチップが 2 列並ぶ幅にして、チップを 1 列に積まない */
  const poolNeed = (id: string, name: string): number => {
    const held = lines.filter((l) => l.lane === id);
    const widest = Math.max(0, ...held.flatMap((l) => l.items.map(chipW)));
    const pair = !stacked && held.some((l) => l.items.length > 1) ? widest * 2 + L.pool.gapX : 0;
    return Math.max(textWidth(name, TYPE.boxName) + (stacked ? L.band.hintGap + hintW(true) : 0), stacked ? 0 : hintW(true), textWidth(words.lineupEmpty, TYPE.laneEmpty), widest, pair);
  };
  const sized: Sized[] = diagram.boxes.map((b) => {
    const pool = pools.has(b.id);
    const w = pool ? Math.max(stacked ? 0 : L.pool.w, poolNeed(b.id, b.name) + pad * 2) : Math.max(stacked ? 0 : L.card.w, cardNeed + pad * 2);
    return { id: b.id, name: b.name, ...(b.sub !== undefined ? { sub: b.sub } : {}), pool, color: colors.get(b.id) ?? "slate", w };
  });
  const gapAfter = (a: Sized, b: Sized): number => (a.pool !== b.pool ? L.arrowGap : L.gap);

  // 役の札の幅は、名前と一言の長い方で決まる
  const roleDecl = diagram.lineup?.roles ?? [];
  const roleNeed = Math.max(0, ...roleDecl.map((r) => Math.max(textWidth(r.id, TYPE.roleName), r.note === undefined ? 0 : textWidth(r.note, TYPE.roleNote)) + L.role.padX * 2));

  // 図の幅。横に並べた形は箱と役の札の並びで決まり、縦に組んだ形は決めた幅に収める
  const rowW = sized.reduce((sum, b, i) => sum + b.w + (i > 0 ? gapAfter(sized[i - 1] as Sized, b) : 0), 0);
  const rolesW = roleDecl.length * Math.max(L.role.w, roleNeed) + Math.max(0, roleDecl.length - 1) * L.role.gap;
  const groups = groupsOf(sized);
  const stackNeed = Math.max(
    roleNeed,
    ...groups.map((g) => (g.pool ? (g.lanes[0] as Sized).w : g.lanes.length * (cardNeed + pad * 2) + (g.lanes.length - 1) * L.gap)),
  );
  const width = Math.max(stacked ? Math.max(L.stack.width, stackNeed + margin * 2) : Math.max(rowW, rolesW) + margin * 2, stripNeed(diagram) + margin * 2);
  const inner = width - margin * 2;

  // 図の上の題。段の題と文は折った行の数が段で違うので、最も低い段に合わせて役の札を置く
  const H = L.headline;
  const heading = single(diagram.title, margin, margin + H.titleY, TYPE.lineupTitle);
  const headlines: LineupHeadline[] = diagram.steps.map((step, s) => {
    const title = wrapped(step.title, margin, margin + H.headY, TYPE.lineupHead, inner, H.headLine);
    const last = title.lines.at(-1)?.baseline ?? margin + H.headY;
    const body = step.body ?? "";
    return { step: s, title, ...(body === "" ? {} : { say: wrapped(body, margin, last + H.sayY, TYPE.lineupSay, inner, H.sayLine) }) };
  });
  const headBottom = Math.max(...headlines.map((h) => bottomOf(h.say ?? h.title)));

  // 役の札。横に並べた形は札の列の上の真ん中に、縦に組んだ形は図の幅を割って並べる
  const roleTop = headBottom + H.below;
  const steps = diagram.steps.map((step) => step.events.flatMap((e) => (e.type === "role" ? [e.role] : [])));
  const roleOf = (decl: { id: string; note?: string }, x: number, y: number, w: number, h: number): LineupRoleCard => {
    const title = single(decl.id, x + L.role.padX, y + L.role.titleY, TYPE.roleName);
    const note = decl.note === undefined ? undefined : wrapped(decl.note, x + L.role.padX, y + L.role.noteY, TYPE.roleNote, w - L.role.padX * 2, H.sayLine);
    return { id: decl.id, x, y, w, h: Math.max(h, note ? bottomOf(note) - y + L.role.padX : 0), title, ...(note ? { note } : {}), steps: steps.flatMap((ids, s) => (ids.includes(decl.id) ? [s] : [])) };
  };
  let roles: LineupRoleCard[];
  if (stacked) {
    let per = Math.max(1, roleDecl.length);
    while (per > 1 && (inner - L.gap * (per - 1)) / per < roleNeed) per--;
    const w = (inner - L.gap * (per - 1)) / per;
    roles = [];
    let y = roleTop;
    for (let k = 0; k < roleDecl.length; k += per) {
      const placed = roleDecl.slice(k, k + per).map((decl, j) => roleOf(decl, margin + j * (w + L.gap), y, w, L.role.stackH));
      roles.push(...placed);
      y = Math.max(...placed.map(bottomOf)) + L.gap;
    }
  } else {
    const w = Math.max(L.role.w, roleNeed);
    roles = roleDecl.map((decl, k) => roleOf(decl, k * (w + L.role.gap), roleTop, w, L.role.h));
  }
  const laneTop = roles.length > 0 ? Math.max(...roles.map(bottomOf)) + L.role.below : headBottom + H.below;

  // 箱の置き場所
  const cardH = L.trackY + cardMost * (C.h + C.gap) - C.gap + L.card.foot + L.card.noteY + L.card.bottom;
  const poolTrackY = stacked ? L.band.trackY : L.trackY;
  const poolGapX: number = L.pool.gapX;
  /** 置き場の幅 `w` で、置き場に書いた `line` のチップを格子に並べた中で最も高い高さ */
  const poolRows = (id: string, w: number): number => Math.max(...[[] as string[], ...lines.filter((l) => l.lane === id).map((l) => l.items)].map((ids) => grid(ids.map(chipW), { x: 0, y: 0, w: w - pad * 2 }, poolGapX).h));
  const placed = new Map<string, Rect>();
  if (stacked) {
    let y = laneTop;
    groups.forEach((group, g) => {
      if (g > 0) y += (groups[g - 1] as Group).pool !== group.pool ? L.stack.arrowGap : L.gap;
      if (group.pool) {
        const lane = group.lanes[0] as Sized;
        placed.set(lane.id, { x: margin, y, w: inner, h: poolTrackY + poolRows(lane.id, inner) + L.pool.bottom });
        y += (placed.get(lane.id) as Rect).h;
        return;
      }
      const n = group.lanes.length;
      const w = (inner - L.gap * (n - 1)) / n;
      group.lanes.forEach((lane, k) => placed.set(lane.id, { x: margin + k * (w + L.gap), y, w, h: cardH }));
      y += cardH + remarkRoom(group.lanes.map((l) => l.id), w);
    });
  } else {
    const hasCard = sized.some((b) => !b.pool);
    const h = Math.max(hasCard ? cardH : 0, ...sized.filter((b) => b.pool).map((b) => poolTrackY + poolRows(b.id, b.w) + L.pool.bottom));
    let x = margin;
    sized.forEach((b, i) => {
      if (i > 0) x += gapAfter(sized[i - 1] as Sized, b);
      placed.set(b.id, { x, y: laneTop, w: b.w, h });
      x += b.w;
    });
    // 役の札を札の列の上の真ん中へ寄せる。図の幅からはみ出す時は図の左右の余白に止める
    const cardRects = sized.filter((b) => !b.pool).map((b) => placed.get(b.id) as Rect);
    const span = cardRects.length > 0 ? cardRects : [...placed.values()];
    const mid = (Math.min(...span.map((r) => r.x)) + Math.max(...span.map((r) => r.x + r.w))) / 2;
    const total = roles.length > 0 ? (roles.at(-1) as LineupRoleCard).x + (roles.at(-1) as LineupRoleCard).w : 0;
    const left = Math.max(margin, Math.min(mid - total / 2, width - margin - total));
    roles = roles.map((r) => ({ ...r, x: r.x + left, title: moved(r.title, left, 0), ...(r.note ? { note: moved(r.note, left, 0) } : {}) }));
  }

  /** 札の列の下に一言が要る高さ。段ごとの一言は別の段に出るので、最も高い段に合わせる */
  function remarkRoom(ids: string[], w: number): number {
    const tall = ids.map((id) => remarkHeight(id, w));
    return Math.max(0, ...tall);
  }
  function remarkHeight(id: string, w: number): number {
    const mine = remarkSpecs.filter((r) => r.lane === id);
    const bySteps = [...new Set(mine.map((r) => r.step))].map((s) => mine.filter((r) => r.step === s).reduce((h, r) => h + remarkLines(r.text, w) * L.remark.line, 0));
    return bySteps.length === 0 ? 0 : L.remark.top + Math.max(...bySteps) - (L.remark.line - L.remark.barH);
  }

  const lanes: LineupLane[] = sized.map((b) => {
    const r = placed.get(b.id) as Rect;
    const base = { id: b.id, name: b.name, ...(b.sub !== undefined ? { sub: b.sub } : {}), color: b.color, ...r, cx: r.x + r.w / 2, cy: r.y + r.h / 2, pool: b.pool };
    const title = single(b.name, r.x + pad, r.y + L.titleY, TYPE.boxName);
    if (b.pool) {
      const hint = stacked ? single(hintText(true), title.x + title.w + L.band.hintGap, r.y + L.titleY, TYPE.laneHint) : single(hintText(true), r.x + pad, r.y + L.hintY, TYPE.laneHint);
      const track = { x: r.x + pad, y: r.y + poolTrackY, w: r.w - pad * 2, h: r.h - poolTrackY - L.pool.bottom };
      const empty = single(words.lineupEmpty, r.x + pad, track.y + C.h / 2 + LOOK.baseline.tag, TYPE.laneEmpty);
      return { ...base, title, hint, track, slots: [], empty };
    }
    const arrowX = r.x + pad;
    const hint = single(hintText(false), arrowX + L.hintArrow + L.hintGap, r.y + L.hintY, TYPE.laneHint);
    const track = { x: r.x + pad, y: r.y + L.trackY, w: r.w - pad * 2, h: cardMost * (C.h + C.gap) - C.gap };
    const slots = Array.from({ length: cardMost }, (_, k) => ({ x: track.x, y: track.y + k * (C.h + C.gap), w: track.w, h: C.h }));
    const foot = bottomOf(track) + L.card.foot;
    const noteBaseline = foot + L.card.noteY;
    const first = notesOf(diagram, b.id, b.sub)[0];
    const note = first === undefined ? undefined : { ...single(first, r.x + r.w / 2 - noteWidth(first) / 2, noteBaseline, TYPE.laneNote), w: noteWidth(first) };
    return { ...base, title, hint, track, slots, arrowX, foot, noteBaseline, ...(note ? { note } : {}) };
  });
  const laneOf = new Map(lanes.map((lane) => [lane.id, lane]));

  // 札の下の一言
  const remarks: LineupRemark[] = [];
  for (const lane of lanes) {
    const mine = remarkSpecs.filter((r) => r.lane === lane.id);
    const tops = new Map<number, number>();
    for (const spec of mine) {
      const y = tops.get(spec.step) ?? bottomOf(lane) + L.remark.top;
      const textX = lane.x + L.remark.bar + L.remark.gap;
      const text = wrapped(spec.text, textX, y + L.remark.barH / 2 + TYPE.remark.size * 0.3, TYPE.remark, lane.w - L.remark.bar - L.remark.gap, L.remark.line);
      remarks.push({ step: spec.step, event: spec.event, lane: lane.id, ...(spec.color ? { color: spec.color } : {}), bar: { x: lane.x, y, w: L.remark.bar, h: L.remark.barH }, text });
      tops.set(spec.step, y + text.lines.length * L.remark.line);
    }
  }

  // チップの席
  const seatsOf = new Map<Line, Rect[]>();
  for (const line of lines) {
    const lane = laneOf.get(line.lane) as LineupLane;
    seatsOf.set(
      line,
      lane.pool
        ? grid(line.items.map(chipW), { x: lane.track.x, y: lane.track.y, w: lane.track.w }, poolGapX).seats
        : line.items.map((_, index) => lane.slots[index] as Rect),
    );
  }
  const chips: LineupSeat[] = [];
  const seals: LineupSeal[] = [];
  const stamps: LineupStamp[] = [];
  const picks: LineupPick[] = [];
  const marks: LineupMark[] = [];
  const seated = new Map<string, LineupSeat[]>();
  const open = new Map<string, LineupSeal>();
  let picked: string | undefined;
  diagram.steps.forEach((step, s) => {
    // 同じ段の `line` どうしは、段の始まりの居場所から滑る
    const before = [...seated.values()].flat();
    step.events.forEach((e: DiagramEvent, k) => {
      if ((e.type !== "line" && e.type !== "seal" && e.type !== "open" && e.type !== "pick" && e.type !== "stamp") || !("box" in e)) return;
      const lane = laneOf.get(e.box);
      if (!lane) return;
      const at: LineupAt = { step: s, event: k };
      if (e.type === "seal" && !open.has(lane.id)) {
        const { over } = L.seal;
        const seal: LineupSeal = { ...at, lane: lane.id, x: lane.track.x - over, y: lane.track.y - over, w: lane.track.w + over * 2, h: lane.track.h + over * 2 };
        seals.push(seal);
        open.set(lane.id, seal);
      } else if (e.type === "open") {
        const seal = open.get(lane.id);
        if (seal) seal.until = at;
        open.delete(lane.id);
      } else if (e.type === "pick" && picked !== lane.id) {
        picks.push({ ...at, lane: lane.id });
        marks.push({ ...at, ...markOf(lane, words.lineupPicked) });
        picked = lane.id;
      } else if (e.type === "stamp") {
        const w = textWidth(e.text, TYPE.stamp) + L.stamp.padX * 2;
        stamps.push({ ...at, lane: lane.id, text: e.text, x: lane.x + lane.w - L.stamp.inset - w, y: bottomOf(lane) - L.stamp.drop, w, h: L.stamp.h });
      } else if (e.type === "line") {
        const line = lines.find((l) => l.step === s && l.event === k) as Line;
        const rects = seatsOf.get(line) ?? [];
        const old = seated.get(lane.id) ?? [];
        const placedSeats = line.items.map((id, index): LineupSeat => {
          const rect = rects[index] as Rect;
          const same = old.find((c) => c.id === id);
          if (same?.index === index && same.x === rect.x && same.y === rect.y && same.w === rect.w) return same;
          const others = before.filter((c) => c.id === id);
          const source = same ?? others.find((c) => c.lane === picked) ?? others.at(-1);
          const text = nameOf(id);
          const label = lane.pool ? single(text, rect.x + rect.w / 2 - textWidth(text, TYPE.chip) / 2, rect.y + rect.h / 2 + LOOK.baseline.tag, TYPE.chip) : single(text, rect.x + C.padX, rect.y + rect.h / 2 + LOOK.baseline.tag, TYPE.chip);
          const seat: LineupSeat = { ...at, id, lane: lane.id, index, ...rect, label, ...(source ? { from: [source.x, source.y] as Point } : {}) };
          chips.push(seat);
          return seat;
        });
        for (const c of old) if (!placedSeats.includes(c)) c.until = at;
        seated.set(lane.id, placedSeats);
      }
    });
  });

  // 置き場と札の間の矢印
  const arrows: LineupArrow[] = [];
  const { inset } = L.arrow;
  if (stacked) {
    const nearest = (g: Group): LineupLane => {
      const list = g.lanes.map((l) => laneOf.get(l.id) as LineupLane);
      return list.reduce((best, lane) => (Math.abs(lane.cx - width / 2) < Math.abs(best.cx - width / 2) ? lane : best), list[0] as LineupLane);
    };
    const groupBottom = (g: Group): number => Math.max(...g.lanes.map((l) => bottomOf(laneOf.get(l.id) as LineupLane)), ...remarks.filter((r) => g.lanes.some((l) => l.id === r.lane)).map((r) => bottomOf(r.text)));
    groups.forEach((group, g) => {
      const prev = groups[g - 1];
      if (!prev || prev.pool === group.pool) return;
      const from = nearest(prev);
      const to = nearest(group);
      const top = laneOf.get((group.lanes[0] as Sized).id) as LineupLane;
      // 札の頭に印を持ち上げる所を空けて止める
      const end = top.y - inset - (group.pool ? 0 : L.mark.lift);
      arrows.push({ from: from.id, to: to.id, points: [[width / 2, groupBottom(prev) + inset], [width / 2, end]] });
    });
  } else {
    lanes.forEach((lane, i) => {
      const next = lanes[i + 1];
      if (!next || next.pool === lane.pool) return;
      const y = lane.y + lane.h / 2;
      arrows.push({ from: lane.id, to: next.id, points: [[lane.x + lane.w + inset, y], [next.x - inset, y]] });
    });
  }

  // 「この先」の帯。後の段の題を左から並べ、図の幅で折り返す
  const above = Math.max(...lanes.map(bottomOf), ...remarks.map((r) => bottomOf(r.text)), ...stamps.map(bottomOf));
  const A = L.ahead;
  const aheadTop = above + A.top;
  const aheads: LineupAhead[] = diagram.steps.slice(0, -1).map((_, s) => {
    const label = single(words.lineupAhead, margin, aheadTop + A.h / 2 + TYPE.aheadLabel.size * 0.3, TYPE.aheadLabel);
    let x = label.x + label.w + A.labelGap;
    let y = aheadTop;
    const later = diagram.steps.slice(s + 1);
    const tags: LineupAheadTag[] = [];
    const tagArrows: Point[][] = [];
    later.forEach((step, k) => {
      const room = width - margin - (k < later.length - 1 ? A.arrow : 0);
      const textW = Math.min(textWidth(step.title, TYPE.aheadText), inner - A.padX * 3 - A.no - A.textGap - A.arrow);
      const w = A.padX + A.no + A.textGap + textW + A.padX * 2;
      if (k > 0 && x + w > room) {
        x = margin;
        y += A.h + A.gap;
      }
      const no = { x: x + A.padX, y: y + (A.h - A.no) / 2, w: A.no, h: A.no };
      const n = String(s + 2 + k);
      const number = single(n, no.x + no.w / 2 - textWidth(n, TYPE.aheadNo) / 2, no.y + no.h / 2 + LOOK.baseline.tag, TYPE.aheadNo);
      const text = { ...single(step.title, no.x + no.w + A.textGap, y + A.h / 2 + TYPE.aheadText.size * 0.3, TYPE.aheadText), w: textW };
      tags.push({ step: s + 1 + k, x, y, w, h: A.h, no, number, text });
      if (k < later.length - 1) tagArrows.push([[x + w + inset, y + A.h / 2], [x + w + A.arrow - inset, y + A.h / 2]]);
      x += w + A.arrow;
    });
    return { step: s, label, tags, arrows: tagArrows };
  });
  const aheadBottom = Math.max(above, ...aheads.flatMap((a) => a.tags.map(bottomOf)));

  // 凡例。説明ごとに 1 行を、チップの宣言の順に左から並べ、図の幅で折り返す
  const G = L.legend;
  const notes: { note: string; color?: ColorKey }[] = [];
  for (const item of items) if (item.note !== undefined && !notes.some((n) => n.note === item.note)) notes.push({ note: item.note, ...(item.color ? { color: item.color } : {}) });
  const legend: LineupLegendRow[] = [];
  {
    let x = margin;
    let y = aheadBottom + G.top;
    let rowH: number = G.swatch;
    for (const n of notes) {
      const textW = Math.min(textWidth(n.note, TYPE.legend), inner - G.swatch - G.gap);
      const w = G.swatch + G.gap + textW;
      if (x > margin && x + w > width - margin) {
        x = margin;
        y += rowH + (G.line - G.swatch);
        rowH = G.swatch;
      }
      const swatch = { x, y, w: G.swatch, h: G.swatch };
      const text = wrapped(n.note, x + G.swatch + G.gap, y + G.swatch / 2 + TYPE.legend.size * 0.3, TYPE.legend, inner - G.swatch - G.gap, G.line);
      legend.push({ ...(n.color ? { color: n.color } : {}), swatch, text });
      rowH = Math.max(rowH, bottomOf(text) - y);
      x += w + G.colGap;
    }
  }
  const bottom = Math.max(aheadBottom, ...legend.map((r) => Math.max(bottomOf(r.swatch), bottomOf(r.text))));

  const layout: LineupLayout = {
    kind: "lineup",
    arrangement,
    width,
    height: 0,
    regions: [],
    boxes: lanes,
    lifelines: [],
    edges: [],
    labels: [],
    actions: [],
    badges: [],
    paths: [],
    ends: [],
    lanes,
    chips,
    seals,
    stamps,
    picks,
    marks,
    roles,
    heading,
    headlines,
    remarks,
    aheads,
    legend,
    arrows,
    sealWord: words.lineupSealed,
  };
  const strip = layoutStrip(diagram, margin, bottom + LOOK.gap, inner);
  layout.height = (strip ? strip.y + strip.h : bottom) + margin;
  if (strip) layout.strip = strip;
  // 段の番号は図の右上の同じ所に置き、次の段の番号と入れ替えて段を数える。
  // 入れ替えるのが作りどおりなので、どの番号も脇へずらさず (`blocked` が全ての所を断る)、`shared` を付けて崩れの確かめに数えさせない (#3525)
  const badges: SceneBadge[] = diagram.steps.map((_, s) => ({ step: s, x: width - margin - LOOK.badge.r, y: margin + H.badgeY, color: "green" }));
  layout.badges = besideSameSpot(badges, () => true, () => true);
  return layout;

  /** 札の頭の印。名前の右に入れば名前の行に、入らなければ札の上の端に掛けて右に寄せる */
  function markOf(lane: LineupLane, text: string): Rect & { lane: string; text: string } {
    const w = textWidth(text, TYPE.laneMark) + L.mark.padX * 2;
    const inline = lane.title.x + lane.title.w + L.mark.gap;
    if (inline + w <= lane.x + lane.w - pad) return { lane: lane.id, text, x: inline, y: lane.title.y + lane.title.h / 2 - L.mark.h / 2, w, h: L.mark.h };
    return { lane: lane.id, text, x: lane.x + lane.w - pad - w, y: lane.y - L.mark.lift, w, h: L.mark.h };
  }
}

/** 一言が幅 `w` の札の下で何行になるか */
function remarkLines(text: string, w: number): number {
  return wrap(text, TYPE.remark, w - L.remark.bar - L.remark.gap).length;
}

/** 縦に組んだ時の組。置き場は 1 つずつ帯になり、続いた札は 1 列にまとまる */
interface Group {
  pool: boolean;
  lanes: Sized[];
}

function groupsOf(sized: Sized[]): Group[] {
  const groups: Group[] = [];
  for (const lane of sized) {
    const last = groups.at(-1);
    if (!lane.pool && last && !last.pool) last.lanes.push(lane);
    else groups.push({ pool: lane.pool, lanes: [lane] });
  }
  return groups;
}
