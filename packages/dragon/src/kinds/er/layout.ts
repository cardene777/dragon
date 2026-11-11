/**
 * 表どうしの関係の図の置き場所 (#3618)。見た目の元は step 2 で本人が選んだ動く試作の案A (表を横 1 列に並べ、結びの線で行どうしを繋ぐ)。
 *
 * 表は書いた順に左から右へ横 1 列に並べ、上の端を揃える。表は見出しと項目の行を持ち、幅は名前と印と値と段の番号と式の札が収まる幅にする。
 * 結びの線は、結びを書いた項目 (何件もの側) の行の横の縁から出て、指した項目 (1 件の側) の行の横の縁へ着く。
 * 線は縦と横の線分だけで引き、表の中を通らない。隣どうしの表を結ぶ線は表の間で縦に折れ、隣でない表を結ぶ線は表の下の道を通る。
 * 同じ表の間を通る線は、互いに並んで近すぎない間を空けた縦の道を 1 本ずつ持つ。表の間は、縦の道と線の端の印と、そこで止まる札が収まる幅にする。
 * 段の中の線の札は、結びの線の上を送る側の項目の近くから線の真ん中まで走り、そこで止まる。札が表の行の字に掛からないため (案Aの決まり)。
 * 式の札 (`note`) は、添えた表の真下に、表と同じ幅で置き、表の下の道より上に置く。札は出した段から後も残すので、同じ表の札は書いた順に下へ積む。
 * 段の番号は、その段で行を選んだ表 (選ばない段は値か式を書いた表、それも無い段は線の受ける側の表、何も無い段は前の段の表) の見出しの右に置き、
 * 同じ表の番号は右の端から左へ段の順に並べる
 */
import { hasWide, textWidth } from "../../layout/measure";
import { along, carrierHalf, type Layout, pathLength, type Point, type Rect, type SceneBadge, type SceneEdge } from "../../layout/scene";
import { ER_COLORS, ER_LOOK, ER_TYPE } from "../../look/er";
import { type ColorKey, LOOK, type TextStyle } from "../../look/values";
import type { DiagramModel } from "../../schema";
import type { ErField } from "../../blocks/table/block";

/** 表の中の項目の行。`field` は項目の名前、`cy` は行の真ん中の高さ */
export interface ErRow extends Rect {
  field: string;
  cy: number;
}

/** 並べた表。`markX` は印の列の左端、`nameX` は項目の名前の左端、`valueX` は値の右端 */
export interface ErTableBox extends Rect {
  id: string;
  name: string;
  color: ColorKey;
  rows: ErRow[];
  markX: number;
  nameX: number;
  valueX: number;
}

/**
 * 結びの線。`from` は結びを書いた項目 (何件もの側)、`to` は指した項目 (1 件の側) で、どちらも `<表>.<項目>`。
 * `points` は何件もの側の行の縁から 1 件の側の行の縁までの点。`many` は三つ叉の根元、`one` は縦の棒の所。
 * `manyDir` と `oneDir` は、それぞれの端で線が表の縁から出ていく向き (右へ 1、左へ -1)
 */
export interface ErLink {
  from: string;
  to: string;
  points: Point[];
  many: Point;
  one: Point;
  manyDir: 1 | -1;
  oneDir: 1 | -1;
}

/**
 * 式の札。`step` と `event` は原本の出来事、`field` は添える項目 (`<表>.<項目>`)、`caption` は項目の名前、`anchor` は矢じりの先 (表の下の縁)。
 * 矢じりは表に一番近い札 (`arrow`) だけが持つ。下へ積んだ札の矢じりは上の札を横切るため
 */
export interface ErNote extends Rect {
  step: number;
  event: number;
  field: string;
  text: string;
  caption: string;
  color: ColorKey;
  anchor: Point;
  arrow: boolean;
}

export interface ErLayout extends Layout {
  kind: "er";
  tables: ErTableBox[];
  links: ErLink[];
  notes: ErNote[];
}

/** 鍵と結びの印の字。表どうしの関係の図で広く使う略字なので、言葉で変えない */
export const ER_MARKS = { key: "PK", ref: "FK" } as const;

/** 項目に付ける印。鍵を結びより先に並べる */
export const erMarksOf = (f: Pick<ErField, "key" | "ref">): (keyof typeof ER_MARKS)[] => [...(f.key ? ["key" as const] : []), ...(f.ref !== undefined ? ["ref" as const] : [])];

/** 印 1 つの札の幅 */
export const erMarkWidth = (mark: keyof typeof ER_MARKS): number => textWidth(ER_MARKS[mark], ER_TYPE.mark) + ER_LOOK.mark.padX * 2;

/** 値と式の字の形。和文を含む物は和文の字で書く */
export const erValueStyle = (text: string): TextStyle => (hasWide(text) ? ER_TYPE.valueJa : ER_TYPE.value);
export const erNoteStyle = (text: string): TextStyle => (hasWide(text) ? ER_TYPE.noteJa : ER_TYPE.note);

/** `<表>.<項目>` の表と項目 */
export const erTableOf = (ref: string): string => ref.slice(0, ref.indexOf("."));
export const erFieldOf = (ref: string): string => ref.slice(ref.indexOf(".") + 1);

/** 段ごとの、段の番号を添える表 */
function focusOf(diagram: DiagramModel, first: string): string[] {
  let before = first;
  return diagram.steps.map((step) => {
    const last = (types: string[]): string | undefined =>
      step.events.flatMap((e) => (types.includes(e.type) && "field" in e && typeof e.field === "string" ? [erTableOf(e.field)] : [])).at(-1);
    const to = step.events.flatMap((e) => (e.type === "edge" ? [erTableOf(e.to)] : [])).at(-1);
    before = last(["lookup"]) ?? last(["cell", "formula"]) ?? to ?? before;
    return before;
  });
}

/** 折れ線 `points` の、始まりから `a` から `b` までの長さの所 */
function subPath(points: Point[], a: number, b: number): Point[] {
  const out: Point[] = [along(points, a)];
  let walked = 0;
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1] as Point;
    const q = points[i] as Point;
    walked += Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (walked > a + 1e-6 && walked < b - 1e-6) out.push(q);
  }
  out.push(along(points, b));
  return out;
}

/** 2 つの表の間の縦の道 1 本。`wire` は結びの番号、`yL` と `yR` は左と右の表の縁で線が出入りする高さ (表の下の道へ下りる端は片方だけ) */
interface Track {
  wire: number;
  yL?: number;
  yR?: number;
  lane: boolean;
}

export function layoutEr(diagram: DiagramModel): ErLayout {
  const source = diagram.er?.tables ?? [];
  const T = ER_LOOK.table;
  const G = ER_LOOK.gap;
  const E = ER_LOOK.end;
  const N = ER_LOOK.note;
  const B = ER_LOOK.badge;
  const pad = ER_LOOK.pad;
  const index = new Map(source.map((t, i) => [t.id, i]));
  const focus = focusOf(diagram, source[0]?.id ?? "");
  const badgeSteps = new Map<string, number[]>();
  focus.forEach((id, s) => badgeSteps.set(id, [...(badgeSteps.get(id) ?? []), s]));

  // 項目ごとの値の移り変わりと、表ごとの式の札
  const values = new Map(source.flatMap((t) => t.fields.map((f) => [`${t.id}.${f.name}`, [f.value]] as [string, string[]])));
  const formulas: { step: number; event: number; field: string; text: string }[] = [];
  diagram.steps.forEach((step, s) =>
    step.events.forEach((e, k) => {
      if (e.type === "cell") values.get(e.field)?.push(e.value);
      if (e.type === "formula") formulas.push({ step: s, event: k, field: e.field, text: e.text });
    }),
  );

  // 表の大きさ。上の端は揃えるので、行の高さはここで決まる
  const top = pad;
  const sizes = source.map((t) => {
    const count = (badgeSteps.get(t.id) ?? []).length;
    const titleW = textWidth(t.name, ER_TYPE.title);
    const head = T.padX + titleW + (count > 0 ? T.titleGap + LOOK.badge.r + (count - 1) * B.step + B.inset : T.padX);
    const markW = Math.max(0, ...t.fields.map((f) => erMarksOf(f).reduce((sum, mark, k) => sum + erMarkWidth(mark) + (k > 0 ? ER_LOOK.mark.gap : 0), 0)));
    const nameW = Math.max(0, ...t.fields.map((f) => textWidth(f.name, ER_TYPE.field)));
    const valueW = Math.max(0, ...t.fields.flatMap((f) => (values.get(`${t.id}.${f.name}`) ?? []).map((v) => textWidth(v, erValueStyle(v)))));
    const row = T.padX + (markW > 0 ? markW + T.markGap : 0) + nameW + T.valueGap + valueW + T.padX;
    const note = Math.max(
      0,
      ...formulas.filter((n) => erTableOf(n.field) === t.id).map((n) => Math.max(textWidth(n.text, erNoteStyle(n.text)), textWidth(erFieldOf(n.field), ER_TYPE.caption)) + N.padX * 2),
    );
    return { w: Math.ceil(Math.max(T.minW, head, row, note)), h: T.headH + t.fields.length * T.rowH + T.bottom, markW };
  });
  const cyOf = (ref: string): number => {
    const t = source[index.get(erTableOf(ref)) ?? 0];
    const k = t?.fields.findIndex((f) => f.name === erFieldOf(ref)) ?? 0;
    return top + T.headH + k * T.rowH + T.rowH / 2;
  };

  // 結び。何件もの側の表が 1 件の側の表より左なら、何件もの側は右の縁から、1 件の側は左の縁から出入りする
  const wires = source.flatMap((t, i) =>
    t.fields.flatMap((f) => {
      const j = f.ref === undefined ? undefined : index.get(erTableOf(f.ref));
      if (f.ref === undefined || j === undefined) return [];
      const manyDir: 1 | -1 = j > i ? 1 : -1;
      return [{ from: `${t.id}.${f.name}`, to: f.ref, i, j, manyDir, oneDir: (-manyDir) as 1 | -1 }];
    }),
  );
  // 結びの線を走る札の半分の幅。札が線の真ん中で止まるので、表の間の線の札は表の間に収める
  const half = wires.map((w) =>
    Math.max(
      0,
      ...diagram.steps.flatMap((step) =>
        step.events.flatMap((e) => (e.type === "edge" && ((e.from === w.from && e.to === w.to) || (e.from === w.to && e.to === w.from)) ? [carrierHalf(e.carry)[0]] : [])),
      ),
    ),
  );
  /** 隣でない表を結ぶ線が下りる表の間。何件もの側の端と 1 件の側の端 */
  const gapAt = (table: number, dir: 1 | -1): number => (dir === 1 ? table : table - 1);
  const tracks: Track[][] = source.slice(1).map(() => []);
  wires.forEach((w, k) => {
    const yM = cyOf(w.from);
    const yO = cyOf(w.to);
    if (Math.abs(w.i - w.j) === 1) {
      const left = w.manyDir === 1;
      tracks[Math.min(w.i, w.j)]?.push({ wire: k, yL: left ? yM : yO, yR: left ? yO : yM, lane: false });
      return;
    }
    for (const [table, dir, y] of [
      [w.i, w.manyDir, yM],
      [w.j, w.oneDir, yO],
    ] as const)
      tracks[gapAt(table, dir)]?.push(dir === 1 ? { wire: k, yL: y, lane: true } : { wire: k, yR: y, lane: true });
  });
  // 縦の道の並び。交わる所が少ないよう、左の表から下りる線を左に、右の表から下りる線を右に置き、
  // 隣どうしを結ぶ線は、下へ向かう線を受ける側の低い順に左から、上へ向かう線を受ける側の高い順に置く
  const order = (t: Track): number[] => {
    if (t.lane) return t.yL !== undefined ? [0, -t.yL] : [3, t.yR ?? 0];
    const down = (t.yR ?? 0) > (t.yL ?? 0);
    return down ? [1, -(t.yR ?? 0)] : [2, t.yR ?? 0];
  };
  for (const list of tracks) list.sort((a, b) => { const x = order(a); const y = order(b); return (x[0] ?? 0) - (y[0] ?? 0) || (x[1] ?? 0) - (y[1] ?? 0); });
  const gaps = tracks.map((list) => {
    const n = list.length;
    const chips = list.filter((t) => !t.lane).map((t) => 2 * ((half[t.wire] ?? 0) + G.clear));
    return Math.max(G.least, 2 * G.end + (n - 1) * G.track, ...chips.map((c) => c + (n - 1) * G.track));
  });

  // 表の横の位置
  const tables: ErTableBox[] = [];
  let x = pad;
  source.forEach((t, i) => {
    const { w, h, markW } = sizes[i] as { w: number; h: number; markW: number };
    const color: ColorKey = t.color ?? ER_COLORS[i % ER_COLORS.length] ?? "slate";
    const rows = t.fields.map((f, k) => {
      const y = top + T.headH + k * T.rowH;
      return { field: f.name, x, y, w, h: T.rowH, cy: y + T.rowH / 2 };
    });
    tables.push({ id: t.id, name: t.name, color, x, y: top, w, h, rows, markX: x + T.padX, nameX: x + T.padX + (markW > 0 ? markW + T.markGap : 0), valueX: x + w - T.padX });
    x += w + (gaps[i] ?? 0);
  });
  const right = (tables.at(-1)?.x ?? pad) + (tables.at(-1)?.w ?? 0);
  /** 表の間 `g` の縦の道 `k` の横の位置 */
  const trackX = (g: number, wire: number): number => {
    const list = tracks[g] ?? [];
    const k = list.findIndex((t) => t.wire === wire);
    const left = (tables[g]?.x ?? 0) + (tables[g]?.w ?? 0);
    return left + (gaps[g] ?? 0) / 2 + (k - (list.length - 1) / 2) * G.track;
  };

  // 式の札。添えた表の真下に、同じ表の札は書いた順に下へ積む
  const notes: ErNote[] = [];
  formulas.forEach((n, k) => {
    const t = tables[index.get(erTableOf(n.field)) ?? 0] as ErTableBox;
    const below = formulas.slice(0, k).filter((o) => erTableOf(o.field) === t.id).length;
    notes.push({ ...n, caption: erFieldOf(n.field), color: t.color, x: t.x, y: t.y + t.h + N.gap + below * (N.h + N.stack), w: t.w, h: N.h, anchor: [t.x + t.w / 2, t.y + t.h], arrow: below === 0 });
  });
  const band = Math.max(top, ...tables.map((t) => t.y + t.h), ...notes.map((n) => n.y + n.h));

  // 隣でない表を結ぶ線の、表の下の道。離れた表どうしの線ほど下を通す
  const lanes = wires
    .map((w, k) => ({ k, span: Math.abs(w.i - w.j), left: Math.min(w.i, w.j) }))
    .filter((w) => w.span > 1)
    .sort((a, b) => a.span - b.span || a.left - b.left);
  const laneY = new Map(lanes.map((l, k) => [l.k, band + ER_LOOK.lane.gap + k * ER_LOOK.lane.step]));

  // 結びの線の点と、線の真ん中 (札が止まる所) までの長さ
  const rests: number[] = [];
  const links: ErLink[] = wires.map((w, k) => {
    const mt = tables[w.i] as ErTableBox;
    const ot = tables[w.j] as ErTableBox;
    const yM = cyOf(w.from);
    const yO = cyOf(w.to);
    const xM = w.manyDir === 1 ? mt.x + mt.w : mt.x;
    const xO = w.oneDir === 1 ? ot.x + ot.w : ot.x;
    let points: Point[];
    let rest: number;
    const lane = laneY.get(k);
    if (lane === undefined) {
      const tx = trackX(Math.min(w.i, w.j), k);
      if (Math.abs(yM - yO) < 0.5) {
        points = [[xM, yM], [xO, yO]];
        rest = Math.abs(xO - xM) / 2;
      } else {
        points = [[xM, yM], [tx, yM], [tx, yO], [xO, yO]];
        rest = Math.abs(tx - xM) + Math.abs(yO - yM) / 2;
      }
    } else {
      const ax = trackX(gapAt(w.i, w.manyDir), k);
      const bx = trackX(gapAt(w.j, w.oneDir), k);
      points = [[xM, yM], [ax, yM], [ax, lane], [bx, lane], [bx, yO], [xO, yO]];
      rest = Math.abs(ax - xM) + Math.abs(lane - yM) + Math.abs(bx - ax) / 2;
    }
    rests.push(rest);
    return { from: w.from, to: w.to, points, many: [xM + w.manyDir * E.fork, yM], one: [xO + w.oneDir * E.bar, yO], manyDir: w.manyDir, oneDir: w.oneDir };
  });

  // 段の中の線。札は送る側の表の縁から札の半分の幅と隙間だけ離れた所から、結びの線の真ん中まで走る
  const edges: SceneEdge[] = [];
  diagram.steps.forEach((step, s) =>
    step.events.forEach((e, k) => {
      if (e.type !== "edge") return;
      const at = links.findIndex((l) => (l.from === e.from && l.to === e.to) || (l.from === e.to && l.to === e.from));
      const link = links[at];
      if (!link) return;
      const forward = link.from === e.from;
      const points = forward ? link.points : [...link.points].reverse();
      const length = pathLength(points);
      const stop = forward ? (rests[at] ?? 0) : length - (rests[at] ?? 0);
      const start = Math.min(carrierHalf(e.carry)[0] + G.clear, stop / 2);
      const color = tables[index.get(erTableOf(e.to)) ?? 0]?.color ?? "slate";
      edges.push({ step: s, event: k, from: e.from, to: e.to, points: subPath(points, start, stop), color, carry: e.carry });
    }),
  );

  // 段の番号。同じ表の番号は右の端から左へ、段の順に読めるよう並べる
  const badges: SceneBadge[] = focus.flatMap((id, s) => {
    const t = tables[index.get(id) ?? -1];
    if (!t) return [];
    const list = badgeSteps.get(id) ?? [];
    const slot = list.length - 1 - list.indexOf(s);
    return [{ step: s, x: t.x + t.w - B.inset - slot * B.step, y: t.y + T.headH / 2, color: t.color }];
  });

  const bottom = Math.max(band, ...[...laneY.values()].map((y) => y + LOOK.carrier.tagH / 2));
  return {
    kind: "er",
    width: Math.ceil(right + pad),
    height: Math.ceil(bottom + pad),
    regions: [],
    boxes: [],
    lifelines: [],
    edges,
    labels: [],
    actions: [],
    badges,
    paths: [],
    ends: [],
    tables,
    links,
    notes,
  };
}

/**
 * 寄って追う窓が段 `step` で見る所 (#3618)。その段で行を選ぶか値か式を書く表と、線の両端の表と、その段から出る式の札。
 * 表の行と札は表の中に在り、線 (`layout.edges`) だけを見ると線を書かない段で窓が動かないため
 */
export function erFocusParts(layout: ErLayout, diagram: DiagramModel, step: number): Rect[] {
  const ids = new Set(
    (diagram.steps[step]?.events ?? []).flatMap((e) =>
      e.type === "edge" ? [erTableOf(e.from), erTableOf(e.to)] : e.type === "lookup" || e.type === "cell" || e.type === "formula" ? [erTableOf(e.field)] : [],
    ),
  );
  return [...layout.tables.filter((t) => ids.has(t.id)), ...layout.notes.filter((n) => n.step === step)];
}
