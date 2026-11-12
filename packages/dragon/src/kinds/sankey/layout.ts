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
import { SANKEY_LOOK, SANKEY_TYPE } from "../../look/sankey";
import { type ColorKey, LOOK } from "../../look/values";
import type { DiagramModel } from "../../schema";

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

export interface SankeyLayout extends Layout {
  kind: "sankey";
  nodes: SankeyNode[];
  bands: SankeyBand[];
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
  const leads = labels.map(leadOf);
  const total = labels.reduce((s, label) => s + (amountOf(label) ?? 0), 0);
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

interface Flow {
  step: number;
  event: number;
  from: string;
  to: string;
  label: string;
  amount: number;
}

export function layoutSankey(diagram: DiagramModel): SankeyLayout {
  const colors = boxColors(diagram);
  const ids = diagram.boxes.map((b) => b.id);
  const flows: Flow[] = edgesOf(diagram).flatMap(({ step, event, edge }) =>
    ids.includes(edge.from) && ids.includes(edge.to) ? [{ step, event, from: edge.from, to: edge.to, label: edge.label ?? "", amount: amountOf(edge.label) ?? 0 }] : [],
  );

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
