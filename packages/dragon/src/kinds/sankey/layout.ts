/**
 * 量の行き先の図の置き場所 (#3626)。見た目の元は step 2 で本人が選んだ動く試作の案A (全量の棒から幅を保った帯が右へ枝分かれし、量の札が帯を渡る)。
 *
 * 箱は量の棒にし、入る線の無い箱を左の列に、行き先を出どころの右の列に置く。列は出どころの無い箱から最も長い道を辿った数にする。
 * 線の名前の初めの数を量とし、出どころの無い箱の量は出る量の和、行き先の量は入る量の和にする。棒の高さは量に比べ、量が最も多い列の高さの和を `height` にする。
 * 帯は出どころの棒の右の縁に、出る線を書いた順に上から積み、行き先の棒の左の縁に、出どころの高い順に上から積む。帯の幅は線の量の分の棒の高さにする。
 * 行き先の棒は、入る帯がなるべく水平に流れる高さを目指し、同じ列の上の箱と重なる時だけ下へずらす。
 * 出る帯を持つ箱と出どころの無い箱は、名前と量を棒の上に 1 行で書き、出る帯を持たない行き先は棒の右に名前と量の 2 行で書く。
 * 量の札は帯の真ん中の曲線の上を、出どころの側から行き先の側の手前まで渡る。
 * 段の番号は、その段の最初の線の行き先の名前と量の右に置き、線の無い段は前の段の所に、線の無い最初の段は左の列の最初の棒の左に置く
 */
import { amountOf } from "../../blocks/band/limits";
import { textWidth } from "../../layout/measure";
import { besideSameSpot, boxColors, carrierHalf, edgesOf, type Layout, type Point, type Rect, type SceneBadge, type SceneEdge } from "../../layout/scene";
import { SANKEY_LOOK, SANKEY_ROWS, SANKEY_ROWS_TYPE, SANKEY_TREEMAP, SANKEY_TREEMAP_TYPE, SANKEY_TYPE } from "../../look/sankey";
import { type ColorKey, LOOK, READABLE_PX } from "../../look/values";
import type { DiagramModel } from "../../schema";
import type { NotationLang } from "../../words";

/** 量の字。`lead` を立てた字は棒の上に名前と同じ行で書く */
export interface SankeyText {
  text: string;
  x: number;
  y: number;
}

/** 箱の名前と量の置き場所。`place` が `above` なら棒の上に 1 行、`beside` なら棒の右に 2 行。`rect` は字の固まりの四角 */
export interface SankeyLabel {
  place: "above" | "beside";
  name: SankeyText;
  amount?: SankeyText;
  rect: Rect;
}

/** 量の棒。`column` は左から数えた列 (0 から)、`amount` は棒が表す量、`root` は入る線の無い箱 */
export interface SankeyNode extends Rect {
  id: string;
  name: string;
  column: number;
  amount: number;
  root: boolean;
  color: ColorKey;
  label: SankeyLabel;
}

/**
 * 量の帯。`a` は出どころの棒の右の縁 (`x1`) での上と下、`b` は行き先の棒の左の縁 (`x2`) での上と下。
 * `amount` は線の名前から読んだ量、`label` は線の名前。色は行き先の箱の色
 */
export interface SankeyBand {
  from: string;
  to: string;
  step: number;
  event: number;
  amount: number;
  label: string;
  x1: number;
  x2: number;
  a: Point;
  b: Point;
  color: ColorKey;
}

/**
 * 量の行き先の図の置き場所。段ごとの帯の見た目 (`[shape: rows]`、#3641) は `arrangement` に `rows` を持ち、
 * 棒と帯の代わりに段ごとの行 (`rows`) と下りる帯 (`drops`) を持つ (並べ方は `layoutRows`)。
 * 面積で割る四角の見た目 (`[shape: treemap]`、#3642) は `arrangement` に `treemap` を持ち、図の四角 (`frame`) と区画 (`tiles`) と
 * 切る線 (`cuts`) と図の四角の下の名前 (`names`) を持つ (並べ方は `layoutTreemap`)
 */
export interface SankeyLayout extends Layout {
  kind: "sankey";
  nodes: SankeyNode[];
  bands: SankeyBand[];
  arrangement?: "rows" | "treemap";
  rows?: SankeyRow[];
  drops?: SankeyDrop[];
  frame?: Rect;
  tiles?: SankeyTile[];
  cuts?: SankeyCut[];
  names?: SankeyRowName[];
}

const S = SANKEY_LOOK;
const T = SANKEY_TYPE;

/** 字の形の上の縁から基準線まで、基準線から下の縁まで (`textBox` と同じ割り方) */
const ascent = (size: number): number => size * 0.8;
const descent = (size: number): number => size * 0.2;

/** 小数の桁の数 */
const decimals = (lead: string): number => (lead.includes(".") ? (lead.split(".")[1] ?? "").length : 0);

/** 線の名前の初めの数の字 */
const leadOf = (label: string): string => /^\d[\d,]*(?:\.\d+)?/u.exec(label)?.[0] ?? "";

/**
 * 2 本以上の線が入る箱の量の字。入る量の和を、線の名前の桁の区切りと小数の桁で書き、どの線の名前も同じ単位なら単位を後ろに付ける
 */
function sumText(labels: readonly string[]): string {
  return amountText(labels.reduce((s, label) => s + (amountOf(label) ?? 0), 0), labels);
}

/**
 * 量 `total` の字。線の名前 `labels` の桁の区切りと小数の桁で書き、どの線の名前も同じ単位なら単位を後ろに付ける。
 * 段ごとの帯の見た目 (#3641) の出どころの無い箱と残りの量も、同じ書き方で書く
 */
export function amountText(total: number, labels: readonly string[]): string {
  const leads = labels.map(leadOf);
  const units = new Set(labels.map((label, i) => label.slice((leads[i] ?? "").length)));
  const digits = Math.max(...leads.map(decimals));
  const [whole = "0", part] = total.toFixed(digits).split(".");
  const grouped = leads.some((lead) => lead.includes(",")) ? whole.replace(/\B(?=(\d{3})+(?!\d))/gu, ",") : whole;
  return `${grouped}${part === undefined ? "" : `.${part}`}${units.size === 1 ? ([...units][0] ?? "") : ""}`;
}

/** 帯の真ん中の曲線の、`t` (出どころの縁 0 から行き先の縁 1) の所 */
export function bandPoint(band: Pick<SankeyBand, "x1" | "x2" | "a" | "b">, t: number): Point {
  const ca = (band.a[0] + band.a[1]) / 2;
  const cb = (band.b[0] + band.b[1]) / 2;
  const d = band.x2 - band.x1;
  return [band.x1 + d * (1.5 * t - 1.5 * t * t + t * t * t), ca + (cb - ca) * (3 * t * t - 2 * t * t * t)];
}

/** 量の流れ。段ごとの帯の見た目 (`layoutRows`、#3641) も同じ流れから並べる */
export interface Flow {
  step: number;
  event: number;
  from: string;
  to: string;
  label: string;
  amount: number;
}

/** 箱どうしを結ぶ線を、書いた順の量の流れにする */
export function flowsOf(diagram: DiagramModel): Flow[] {
  const ids = diagram.boxes.map((b) => b.id);
  return edgesOf(diagram).flatMap(({ step, event, edge }) =>
    ids.includes(edge.from) && ids.includes(edge.to) ? [{ step, event, from: edge.from, to: edge.to, label: edge.label ?? "", amount: amountOf(edge.label) ?? 0 }] : [],
  );
}

export function layoutSankey(diagram: DiagramModel): SankeyLayout {
  const colors = boxColors(diagram);
  const ids = diagram.boxes.map((b) => b.id);
  const flows = flowsOf(diagram);

  // 列。入る線の無い箱を 0 にし、行き先を出どころの次の列より右に置く。前の列へ戻る線を持つ原本でも止まるよう、箱の数だけ回して打ち切る
  const column = new Map(ids.map((id) => [id, 0]));
  for (let round = 0; round < ids.length; round++) {
    let moved = false;
    for (const f of flows) {
      const want = (column.get(f.from) ?? 0) + 1;
      if ((column.get(f.to) ?? 0) < want) {
        column.set(f.to, want);
        moved = true;
      }
    }
    if (!moved) break;
  }
  const into = (id: string): Flow[] => flows.filter((f) => f.to === id);
  const outOf = (id: string): Flow[] => flows.filter((f) => f.from === id);
  const amountOfBox = (id: string): number => {
    const ins = into(id);
    return (ins.length > 0 ? ins : outOf(id)).reduce((s, f) => s + f.amount, 0);
  };
  const last = Math.max(0, ...column.values());
  const totals = Array.from({ length: last + 1 }, (_, c) => ids.filter((id) => column.get(id) === c).reduce((s, id) => s + amountOfBox(id), 0));
  const most = Math.max(0, ...totals);
  /** 量 1 あたりの棒の高さ */
  const k = most > 0 ? S.height / most : 0;

  // 段の番号を置く箱。段ごとの最初の線の行き先
  const firsts = diagram.steps.map((_, s) => flows.find((f) => f.step === s));
  const badged = new Set(firsts.flatMap((f) => (f ? [f.to] : [])));
  const { r } = LOOK.badge;
  const badgeRoom = (id: string): number => (badged.has(id) ? S.badge.gap + r * 2 : 0);

  // 名前と量の字の大きさ。出る帯を持つ箱と出どころの無い箱は棒の上に 1 行、ほかの行き先は棒の右に 2 行
  const sizes = new Map(
    diagram.boxes.map((box) => {
      const ins = into(box.id);
      const amount = ins.length === 0 ? undefined : ins.length === 1 ? (ins[0] as Flow).label : sumText(ins.map((f) => f.label));
      const above = ins.length === 0 || outOf(box.id).length > 0;
      const nameW = textWidth(box.name, T.name);
      const amountW = amount === undefined ? 0 : textWidth(amount, above ? T.lead : T.amount);
      const w = above ? nameW + (amount === undefined ? 0 : S.label.apart + amountW) : Math.max(nameW, amountW);
      const h = above || amount === undefined ? T.name.size : ascent(T.name.size) + S.label.row + descent(T.amount.size);
      return [box.id, { name: box.name, amount, above, nameW, w, h }];
    }),
  );
  const sizeOf = (id: string) => sizes.get(id) as NonNullable<ReturnType<typeof sizes.get>>;
  const height = (id: string): number => amountOfBox(id) * k;
  /** 棒の上と下に名前と量が出る分 */
  const topRoom = (id: string): number => {
    const size = sizeOf(id);
    return size.above ? S.label.above + ascent(T.name.size) : Math.max(0, (size.h - height(id)) / 2);
  };
  const bottomRoom = (id: string): number => {
    const size = sizeOf(id);
    return size.above ? 0 : Math.max(0, (size.h - height(id)) / 2);
  };

  // 列の横の所。列どうしの間は、名前と量と段の番号が次の列の棒に届かない長さにする
  const xs: number[] = [0];
  for (let c = 0; c < last; c++) {
    const need = ids
      .filter((id) => column.get(id) === c)
      .map((id) => {
        const size = sizeOf(id);
        return (size.above ? size.w - S.bar.w : S.label.gap + size.w) + badgeRoom(id) + S.label.clear;
      });
    xs.push((xs[c] as number) + S.bar.w + Math.max(S.reach, ...need));
  }

  // 棒の縦の所。左の列から順に、出どころの帯の所から目指す高さを決め、同じ列の上の箱と重ならない所まで下げる
  const tops = new Map<string, number>();
  /** 出どころの棒の右の縁での帯の上の縁。出る線を書いた順に積む */
  const sliceTop = new Map<Flow, number>();
  const place = (id: string): void => {
    let at = tops.get(id) as number;
    for (const f of outOf(id)) {
      sliceTop.set(f, at);
      at += f.amount * k;
    }
  };
  /** 行き先の棒に入る線。出どころの帯の上の縁の高い順 */
  const arriving = (id: string): Flow[] => into(id).sort((p, q) => (sliceTop.get(p) ?? 0) - (sliceTop.get(q) ?? 0));
  for (let c = 0; c <= last; c++) {
    const members = ids.filter((id) => column.get(id) === c);
    const wanted = members.map((id, i) => {
      if (c === 0) return { id, i, top: Number.NEGATIVE_INFINITY };
      // 入る帯がなるべく水平に流れる棒の上の縁。入る量で重みを付けて均す
      const ins = arriving(id);
      let offset = 0;
      let sum = 0;
      let weight = 0;
      for (const f of ins) {
        const w = f.amount * k;
        sum += ((sliceTop.get(f) ?? 0) - offset) * Math.max(w, 1e-6);
        weight += Math.max(w, 1e-6);
        offset += w;
      }
      return { id, i, top: weight > 0 ? sum / weight - topRoom(id) : 0 };
    });
    if (c > 0) wanted.sort((p, q) => p.top - q.top || p.i - q.i);
    let cursor = c === 0 ? 0 : Number.NEGATIVE_INFINITY;
    for (const { id, top } of wanted) {
      const slot = Math.max(top, cursor);
      const bar = slot + topRoom(id);
      tops.set(id, bar);
      cursor = bar + height(id) + bottomRoom(id) + S.gap;
      place(id);
    }
  }

  const nodes: SankeyNode[] = diagram.boxes.map((box) => {
    const id = box.id;
    const c = column.get(id) ?? 0;
    const x = xs[c] as number;
    const y = tops.get(id) ?? 0;
    const h = height(id);
    const size = sizeOf(id);
    let label: SankeyLabel;
    if (size.above) {
      const base = y - S.label.above;
      label = {
        place: "above",
        name: { text: box.name, x, y: base },
        ...(size.amount === undefined ? {} : { amount: { text: size.amount, x: x + size.nameW + S.label.apart, y: base } }),
        rect: { x, y: base - ascent(T.name.size), w: size.w, h: T.name.size },
      };
    } else {
      const lx = x + S.bar.w + S.label.gap;
      const top = y + h / 2 - size.h / 2;
      const base = top + ascent(T.name.size);
      label = {
        place: "beside",
        name: { text: box.name, x: lx, y: base },
        ...(size.amount === undefined ? {} : { amount: { text: size.amount, x: lx, y: base + S.label.row } }),
        rect: { x: lx, y: top, w: size.w, h: size.h },
      };
    }
    return { id, name: box.name, column: c, amount: amountOfBox(id), root: into(id).length === 0, color: colors.get(id) ?? "slate", x, y, w: S.bar.w, h, label };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // 帯。行き先の棒の左の縁には、出どころの高い順に上から積む
  const endTop = new Map<Flow, number>();
  for (const node of nodes) {
    let at = node.y;
    for (const f of arriving(node.id)) {
      endTop.set(f, at);
      at += f.amount * k;
    }
  }
  const bands: SankeyBand[] = flows.map((f) => {
    const from = byId.get(f.from) as SankeyNode;
    const to = byId.get(f.to) as SankeyNode;
    const w = f.amount * k;
    const a0 = sliceTop.get(f) ?? from.y;
    const b0 = endTop.get(f) ?? to.y;
    return { from: f.from, to: f.to, step: f.step, event: f.event, amount: f.amount, label: f.label, x1: from.x + from.w, x2: to.x, a: [a0, a0 + w], b: [b0, b0 + w], color: to.color };
  });

  // 量の札の道。帯の真ん中の曲線を区切った点で、出どころの側から行き先の側の手前まで
  const edges: SceneEdge[] = bands.map((band) => ({
    step: band.step,
    event: band.event,
    from: band.from,
    to: band.to,
    points: Array.from({ length: S.samples + 1 }, (_, i) => bandPoint(band, S.chip.from + ((S.chip.to - S.chip.from) * i) / S.samples)),
    color: band.color,
    carry: { kind: "tag", text: band.label },
  }));

  // 段の番号。段の最初の線の行き先の字の右。線の無い段は前の段の所、線の無い最初の段は左の列の最初の棒の左
  const first = nodes.find((n) => n.column === 0);
  let spot: { x: number; y: number; color: ColorKey } | undefined;
  const badges: SceneBadge[] = besideSameSpot(
    firsts.flatMap((f, step) => {
      const node = f ? byId.get(f.to) : undefined;
      if (node) {
        const { rect } = node.label;
        spot = { x: rect.x + rect.w + S.badge.gap + r, y: rect.y + rect.h / 2, color: node.color };
      } else if (!spot && first) spot = { x: first.x - S.badge.gap - r, y: first.y + first.h / 2, color: first.color };
      return spot ? [{ step, ...spot }] : [];
    }),
    () => false,
    () => true,
  );

  // 図の枠。全ての部品を囲み、外周に余白を空ける
  const around = ([x, y]: Point, [hx, hy]: Point): Rect => ({ x: x - hx, y: y - hy, w: hx * 2, h: hy * 2 });
  const parts: Rect[] = [
    ...nodes,
    ...nodes.map((n) => n.label.rect),
    ...badges.map((b) => around([b.x, b.y], [r, r])),
    ...edges.flatMap((e) => e.points.map((p) => around(p, carrierHalf(e.carry)))),
  ];
  const left = Math.min(...parts.map((p) => p.x));
  const top = Math.min(...parts.map((p) => p.y));
  const right = Math.max(...parts.map((p) => p.x + p.w));
  const bottom = Math.max(...parts.map((p) => p.y + p.h));
  const dx = S.pad - left;
  const dy = S.pad - top;
  const move = ([x, y]: Point): Point => [x + dx, y + dy];
  const shift = (t: SankeyText): SankeyText => ({ ...t, x: t.x + dx, y: t.y + dy });
  return {
    kind: "sankey",
    width: right - left + S.pad * 2,
    height: bottom - top + S.pad * 2,
    regions: [],
    boxes: [],
    lifelines: [],
    edges: edges.map((e) => ({ ...e, points: e.points.map(move) })),
    labels: [],
    actions: [],
    badges: badges.map((b) => ({ ...b, x: b.x + dx, y: b.y + dy })),
    paths: [],
    ends: [],
    nodes: nodes.map((n) => ({
      ...n,
      x: n.x + dx,
      y: n.y + dy,
      label: {
        ...n.label,
        name: shift(n.label.name),
        ...(n.label.amount ? { amount: shift(n.label.amount) } : {}),
        rect: { ...n.label.rect, x: n.label.rect.x + dx, y: n.label.rect.y + dy },
      },
    })),
    bands: bands.map((b) => ({ ...b, x1: b.x1 + dx, x2: b.x2 + dx, a: [b.a[0] + dy, b.a[1] + dy], b: [b.b[0] + dy, b.b[1] + dy] })),
  };
}

/*
 * 量の行き先の図の段ごとの帯の見た目 (`[shape: rows]`、#3641) の置き場所。見た目の元は step 2 で決めた案 (動く試作の案Bから、続いている区画の字と残りの点線の枠を減らした版)。
 *
 * 段ごとに図の幅いっぱいの帯を1行ずつ上から積み、各行をその段までの線で分かれた区画に分ける。帯の線と箱は帯の図 (`layout.ts`) と同じ流れから読む。
 * 区画の幅は、出どころの無い箱の量の和に比べた量で決める。最初の行は出どころの無い箱を書いた順に並べ、線を読むたびに、出どころの区画の幅の内の左から行き先の区画を切り出す。
 * 出どころの区画の残りは切り出した区画の右に残り、出どころの無い箱の残りは灰色の残りの区画 (`rest:<名札>`) にする。残りが無くなった区画は行から外す。
 * その段で新しく分かれた区画と最後の行の区画は名前と量を書き、前の段から続いている区画は字を書かない。名前が区画に入らない時は量だけを書き (量も入らなければ字を書かず)、
 * その行の帯の下に色の印と名前を並べる。上の行から下りる帯と量の札は、その段で新しく分かれた区画にだけ引く。
 * 既定の幅で描いた字を枠の幅 (`width`) に縮めると読める大きさに届かない時は、図の幅を枠の幅にして描く
 */

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
const RT = SANKEY_ROWS_TYPE;

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
        const w = textWidth(text, RT.rest);
        if (w <= inner) s.value = placed(text, s.x + s.w / 2 - w / 2, y + R.bar.h / 2 + ascent(RT.rest.size) / 2, RT.rest.size, w);
        continue;
      }
      if (s.kind === "carried" && k < last) continue;
      // 1 本の線で現れたまま分けていない区画は線の名前を、出どころの無い箱と分けた後の残りは量から組んだ字を書く
      const flow = into(cell.box).length === 1 ? into(cell.box)[0] : undefined;
      const valueText = flow && empty(Math.abs(flow.amount - cell.amount), whole) ? flow.label : amountText(cell.amount, labelsOf(cell.box));
      const name = boxNames.get(cell.box) ?? cell.box;
      const nameW = textWidth(name, RT.name);
      const valueW = textWidth(valueText, RT.value);
      if (nameW <= inner && valueW <= inner) {
        const base = y + R.nameAt;
        s.name = placed(name, s.x + R.padX, base, RT.name.size, nameW);
        s.value = placed(valueText, s.x + R.padX, base + R.lines, RT.value.size, valueW);
        continue;
      }
      if (valueW <= inner) s.value = placed(valueText, s.x + s.w / 2 - valueW / 2, y + R.bar.h / 2 + ascent(RT.value.size) / 2, RT.value.size, valueW);
      listed.push({ section: s, text: s.value ? name : `${name} ${valueText}` });
    }
    // 帯の下に並べる名前。区画の左の端の下に置き、前の名前と重なる時は右へずらし、行の右の端を越える時は端に寄せる。それでも前の名前と重なる名前は次の行へ送る
    const N = R.names;
    const names: SankeyRowName[] = [];
    let nx = rowX;
    let line = 0;
    for (const { section, text } of listed) {
      const w = textWidth(text, RT.list);
      const span = N.mark + N.markGap + w;
      let x = Math.max(nx, Math.min(section.x, rowX + rowW - span));
      if (nx > rowX && x + span > rowX + rowW) {
        x = Math.max(rowX, Math.min(section.x, rowX + rowW - span));
        line += 1;
      }
      nx = x;
      const base = y + R.bar.h + N.gap + ascent(RT.list.size) + line * N.row;
      names.push({
        id: section.id,
        color: section.color,
        mark: { x: nx, y: base - ascent(RT.list.size) / 2 - N.mark / 2, w: N.mark, h: N.mark },
        name: placed(text, nx + N.mark + N.markGap, base, RT.list.size, w),
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
  if (width === undefined || (width / wide.width) * RT.name.size >= READABLE_PX) return wide;
  return arrangeRows(diagram, lang, width);
}

/*
 * 量の行き先の図の面積で割る四角の見た目 (`[shape: treemap]`、#3642) の置き場所。見た目の元は step 2 で決めた案。
 *
 * 全量を1つの四角 (図の四角) にし、出どころの無い箱を書いた順に図の四角から切り出す。箱と線は帯の図 (`layout.ts`) と同じ流れから読む。
 * 段ごとに、同じ出どころから書いた線の量の和の帯を、出どころのまだ分けていない残りの長い辺を量の割合で切って切り出し、
 * 帯の中を帯の長い辺に沿って線を書いた順に量で分ける。切る線は割った四角の縁から縁までに引く。
 * 出どころの無い箱の残りは灰色の残りの区画 (`rest:<名札>:<段>`) にし、次に切る段で次の残りに替える。
 * 行き先の区画をさらに分けた時は、区画の枠と名前の札 (`chip`) を残し、札の下の内側を子の区画に割る。
 * 区画は名前と量を書く。名前が区画に入らない時は量だけを書き (量も入らなければ字を書かず)、図の四角の下に色の印と名前を並べる。
 * 段の番号は図の四角の左上の上に置き、段が進むたびに数字を入れ替える。量の札は出さない。
 * 既定の幅で描いた字を枠の幅 (`width`) に縮めると読める大きさに届かない時は、図の幅を枠の幅にして描く
 */

/**
 * 区画。`id` は区画の名札で、箱の区画は箱の名札 (同じ箱の 2 つ目からは `<名札>@<番号>`)、出どころの無い箱の残りは `rest:<名札>:<段>`。
 * `box` は区画が表す箱、`kind` は箱の区画 (`box`) か残り (`rest`)。`step` と `event` は区画を切り出した段と線 (出どころの無い箱は `event` を持たない)。
 * `until` は残りを次の残りに替えた段、`split` は区画を子の区画に分けた段で、`cutBy` はその段で区画を切った最初の線。
 * `amount` は区画の量、`name` と `value` は区画の中に書く名前と量、`chip` は子の区画に分けた後の名前の札
 */
export interface SankeyTile extends Rect {
  id: string;
  box: string;
  kind: "box" | "rest";
  step: number;
  event?: number;
  until?: number;
  split?: number;
  cutBy?: number;
  color: ColorKey;
  amount: number;
  name?: SankeyRowText;
  value?: SankeyRowText;
  chip?: SankeyRowText;
}

/** 切る線。`step` と `event` は線を引く段と、その段の線。`region` は線が割った四角 */
export interface SankeyCut {
  step: number;
  event: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  region: Rect;
}

const TM = SANKEY_TREEMAP;
const TT = SANKEY_TREEMAP_TYPE;

/** 四角 `r` を、縦に切るなら (`vertical`) 左から、横に切るなら上から、割合 `part` の所で切る。前の四角と後ろの四角と切る線 */
function cutAt(r: Rect, part: number, vertical: boolean): { head: Rect; tail: Rect; line: [Point, Point] } {
  if (vertical) {
    const w = r.w * part;
    return { head: { ...r, w }, tail: { x: r.x + w, y: r.y, w: r.w - w, h: r.h }, line: [[r.x + w, r.y], [r.x + w, r.y + r.h]] };
  }
  const h = r.h * part;
  return { head: { ...r, h }, tail: { x: r.x, y: r.y + h, w: r.w, h: r.h - h }, line: [[r.x, r.y + h], [r.x + r.w, r.y + h]] };
}

/** 四角 `r` を区画の隙間の半分ずつ内へ寄せた区画の四角 */
const inset = (r: Rect): Rect => ({ x: r.x + TM.gap / 2, y: r.y + TM.gap / 2, w: Math.max(1, r.w - TM.gap), h: Math.max(1, r.h - TM.gap) });

/** まだ分けていない所。`rect` は残りの四角、`amount` は残りの量、`holder` はその四角を今占める区画 */
interface Space {
  rect: Rect;
  amount: number;
  holder: SankeyTile;
  root: boolean;
}

/**
 * 面積で割る四角の見た目を並べる。`frameWidth` は図の幅を枠の幅にする時の枠の幅で、`undefined` なら既定の幅で描く
 */
function arrangeTreemap(diagram: DiagramModel, lang: NotationLang, frameWidth: number | undefined): SankeyLayout {
  const colors = boxColors(diagram);
  const flows = flowsOf(diagram);
  const boxNames = new Map(diagram.boxes.map((b) => [b.id, b.name]));
  const into = (id: string): Flow[] => flows.filter((f) => f.to === id);
  const outOf = (id: string): Flow[] => flows.filter((f) => f.from === id);
  const roots = diagram.boxes.filter((b) => into(b.id).length === 0 && outOf(b.id).length > 0).map((b) => b.id);
  const rootAmount = (id: string): number => outOf(id).reduce((s, f) => s + f.amount, 0);
  const whole = roots.reduce((s, id) => s + rootAmount(id), 0);

  const { r } = LOOK.badge;
  const phone = frameWidth !== undefined;
  const width = frameWidth ?? TM.width;
  const pad = phone ? TM.phone.pad : SANKEY_LOOK.pad;
  const fw = width - pad * 2;
  const frame: Rect = { x: pad, y: pad + r * 2 + TM.badge.gap, w: fw, h: Math.round(fw * (phone ? TM.phone.aspect : TM.aspect)) };

  const tiles: SankeyTile[] = [];
  const cuts: SankeyCut[] = [];
  const spaces = new Map<string, Space>();
  const valueOf = new Map<string, string>();
  const seen = new Map<string, number>();
  const cutOf = (step: number, event: number, line: [Point, Point], region: Rect): SankeyCut => ({ step, event, x1: line[0][0], y1: line[0][1], x2: line[1][0], y2: line[1][1], region });

  // 出どころの無い箱は書いた順に、図の四角の残りの長い辺を量の割合で切って並べる
  let open = frame;
  let pool = whole;
  roots.forEach((id, i) => {
    const amount = rootAmount(id);
    const part = i === roots.length - 1 || pool <= 0 ? 1 : amount / pool;
    const { head, tail } = cutAt(open, part, open.w >= open.h);
    open = tail;
    pool -= amount;
    const tile: SankeyTile = { id, box: id, kind: "box", step: 0, color: colors.get(id) ?? "slate", amount, ...inset(head) };
    tiles.push(tile);
    valueOf.set(id, amountText(amount, outOf(id).map((f) => f.label)));
    spaces.set(id, { rect: head, amount, holder: tile, root: true });
  });

  diagram.steps.forEach((_, s) => {
    const here = flows.filter((f) => f.step === s && !empty(f.amount, whole));
    for (const src of [...new Set(here.map((f) => f.from))]) {
      const space = spaces.get(src);
      if (!space) continue;
      const group = here.filter((f) => f.from === src);
      const first = group[0] as Flow;
      const { holder } = space;
      let region = space.rect;
      // 初めて分ける行き先の区画は、枠と名前の札を残して内側を割る。出どころの無い箱と残りは、その段で区画を替える
      if (holder.kind === "box" && holder.split === undefined) {
        holder.split = s;
        holder.cutBy = first.event;
        if (!space.root) {
          const n = TM.nest;
          region = { x: holder.x + n.inset, y: holder.y + n.head, w: Math.max(1, holder.w - n.inset * 2), h: Math.max(1, holder.h - n.head - n.inset) };
        }
      } else if (holder.kind === "rest") {
        holder.until = s;
        holder.cutBy = first.event;
      }
      const total = group.reduce((sum, f) => sum + f.amount, 0);
      const left = space.amount - total;
      let strip = region;
      let remainder: Rect | undefined;
      if (left > 0 && !empty(left, whole)) {
        const c = cutAt(region, total / space.amount, region.w >= region.h);
        strip = c.head;
        remainder = c.tail;
        cuts.push(cutOf(s, first.event, c.line, region));
      }
      // 帯の中は帯の長い辺に沿って、線を書いた順に量で分ける
      const vertical = strip.w >= strip.h;
      let tail = strip;
      let rest = total;
      group.forEach((f, i) => {
        let piece = tail;
        const next = group[i + 1];
        if (next) {
          const c = cutAt(tail, rest > 0 ? f.amount / rest : 0, vertical);
          piece = c.head;
          tail = c.tail;
          cuts.push(cutOf(s, next.event, c.line, strip));
        }
        rest -= f.amount;
        const count = (seen.get(f.to) ?? 0) + 1;
        seen.set(f.to, count);
        const tile: SankeyTile = { id: count === 1 ? f.to : `${f.to}@${count}`, box: f.to, kind: "box", step: s, event: f.event, color: colors.get(f.to) ?? "slate", amount: f.amount, ...inset(piece) };
        tiles.push(tile);
        valueOf.set(tile.id, f.label);
        if (count === 1) spaces.set(f.to, { rect: piece, amount: f.amount, holder: tile, root: false });
      });
      if (!remainder) {
        spaces.delete(src);
        continue;
      }
      if (!space.root) {
        spaces.set(src, { ...space, rect: remainder, amount: left });
        continue;
      }
      const restTile: SankeyTile = { id: `rest:${src}:${s}`, box: src, kind: "rest", step: s, event: first.event, color: "slate", amount: left, ...inset(remainder) };
      tiles.push(restTile);
      spaces.set(src, { rect: remainder, amount: left, holder: restTile, root: true });
    }
  });

  // 区画の中の字。名前と量が入らない区画は量だけを書き、名前を図の四角の下に並べる
  const listed: { tile: SankeyTile; text: string }[] = [];
  for (const t of tiles) {
    const inner = t.w - TM.padX * 2;
    const single = (text: string, size: number, w: number): SankeyRowText | undefined =>
      w <= inner && ascent(size) + descent(size) + TM.padY <= t.h ? placed(text, t.x + t.w / 2 - w / 2, t.y + t.h / 2 + ascent(size) / 2, size, w) : undefined;
    if (t.kind === "rest") {
      const text = REST_TEXT[lang](amountText(t.amount, outOf(t.box).map((f) => f.label)));
      t.value = single(text, TT.rest.size, textWidth(text, TT.rest));
      continue;
    }
    const name = boxNames.get(t.box) ?? t.box;
    const valueText = valueOf.get(t.id) ?? "";
    const nameW = textWidth(name, TT.name);
    const valueW = textWidth(valueText, TT.value);
    if (t.split !== undefined && !roots.includes(t.id)) {
      const n = TM.nest;
      const both = `${name} ${valueText}`;
      const text = textWidth(both, TT.chip) <= inner ? both : name;
      const w = textWidth(text, TT.chip);
      if (w <= inner) t.chip = placed(text, t.x + TM.padX, t.y + n.chipAt, TT.chip.size, w);
    }
    if (nameW <= inner && valueW <= inner && TM.nameAt + TM.lines + descent(TT.value.size) + TM.padY <= t.h) {
      t.name = placed(name, t.x + TM.padX, t.y + TM.nameAt, TT.name.size, nameW);
      t.value = placed(valueText, t.x + TM.padX, t.y + TM.nameAt + TM.lines, TT.value.size, valueW);
      continue;
    }
    t.value = single(valueText, TT.value.size, valueW);
    listed.push({ tile: t, text: t.value ? name : `${name} ${valueText}` });
  }

  // 図の四角の下に並べる名前。区画の左の端の下に置き、前の名前と重なる時は右へずらし、図の四角の右の端を越える時は次の行へ送る
  const N = TM.names;
  const names: SankeyRowName[] = [];
  let nx = frame.x;
  let line = 0;
  for (const { tile, text } of listed) {
    const w = textWidth(text, TT.list);
    const span = N.mark + N.markGap + w;
    let x = Math.max(nx, Math.min(tile.x, frame.x + frame.w - span));
    if (nx > frame.x && x + span > frame.x + frame.w) {
      x = Math.max(frame.x, Math.min(tile.x, frame.x + frame.w - span));
      line += 1;
    }
    nx = x;
    const base = frame.y + frame.h + N.gap + ascent(TT.list.size) + line * N.row;
    names.push({
      id: tile.id,
      color: tile.color,
      mark: { x: nx, y: base - ascent(TT.list.size) / 2 - N.mark / 2, w: N.mark, h: N.mark },
      name: placed(text, nx + N.mark + N.markGap, base, TT.list.size, w),
    });
    nx += span + N.apart;
  }

  // 段の番号は図の四角の左上の上に置き、次の段が始まると数字を入れ替える (列の図の右上で段を数える番号と同じ作り)。色はその段で最初に切り出した区画の色
  const last = diagram.steps.length - 1;
  const badges: SceneBadge[] = diagram.steps.map((_, s) => ({
    step: s,
    x: frame.x + r,
    y: pad + r,
    color: tiles.find((t) => t.step === s && t.kind === "box" && t.event !== undefined)?.color ?? "slate",
    ...(s < last ? { until: s + 1, shared: true } : {}),
  }));
  const bottom = Math.max(frame.y + frame.h, ...names.map((n) => n.name.rect.y + n.name.rect.h));
  return {
    kind: "sankey",
    arrangement: "treemap",
    width,
    height: bottom + pad,
    regions: [],
    boxes: [],
    lifelines: [],
    edges: [],
    labels: [],
    actions: [],
    badges,
    paths: [],
    ends: [],
    nodes: [],
    bands: [],
    frame,
    tiles,
    cuts,
    names,
  };
}

/** 面積で割る四角の見た目を並べる。既定の幅で描いた字を枠の幅 `width` に縮めると読める大きさに届かない時は、図の幅を枠の幅にして描き直す */
export function layoutTreemap(diagram: DiagramModel, lang: NotationLang, width: number | undefined): SankeyLayout {
  const wide = arrangeTreemap(diagram, lang, undefined);
  if (width === undefined || (width / wide.width) * TT.name.size >= READABLE_PX) return wide;
  return arrangeTreemap(diagram, lang, width);
}
