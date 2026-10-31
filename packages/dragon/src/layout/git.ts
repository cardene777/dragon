/**
 * 枝分かれの図の置き場所 (#3164)。見た目の元は見本帳の試作 `docs/design/base/scenes/git.js`。
 *
 * 枝ごとに横長の帯を宣言した順に上から並べ、commit の丸を枝の帯の線に置く。commit は親より 1 列右に置き、
 * 同じ帯では積んだ順に右へ進める。一番上でない帯の commit は列の半分だけ右へずらし、上の帯の丸と縦に揃わないようにする。
 * hash と一言は丸の外に 2 行で置き、一番上の帯では丸の上に、ほかの帯では丸の下に置く (step 2 で本人が選んだ)。
 * 札 (枝の名前と HEAD) は丸の上に段を重ねて置き、一番上の帯では字のさらに上に置く。
 *
 * 札がどの commit を指すかは、段の中の出来事を順に辿って決める。
 * commit を積むと、積んだ枝の札と、その枝を指す HEAD が新しい commit へ進む。最初に積んだ枝を HEAD が指す。
 * 枝を切ると、その枝の札が切る commit に置かれ、HEAD がその枝へ移る。
 * 当て直し (`copy`) は枝の札を動かさず、枝から離れた HEAD だけが付いていく。親は枝から離れた HEAD の commit か、枝の札の commit。
 * merge commit (`merge`) は取り込む先の先端と取り込む枝の先端の 2 つを親に持ち、取り込む先の札だけが進む。
 * 札を動かす線 (`<札> -> <commit>`) は、枝の札ならその枝を、HEAD なら HEAD を枝から離して動かす。
 * 枝から離れた HEAD が指す commit へ枝の札が来ると、HEAD はその枝に戻る。HEAD の札は枝から離れた間だけ出す。
 * どの札からも辿れなくなった commit は、その段で点線の丸に変わる。
 *
 * 箱は commit の並びの右に縦に並べ、中身の帯は図の下に置く。
 * 宣言していない枝に積んだ原本の JSON は、その枝の帯を下に足して描く。辿れない名札を指す出来事は描かない。
 */
import { type ColorKey, LOOK, type TextStyle, TYPE } from "../look/values";
import type { Diagram, DiagramEvent } from "../schema";
import { HEAD } from "../words";
import { hasWide, textBox, textWidth } from "./measure";
import {
  along,
  badgeOnPath,
  badgeRect,
  gapBetween,
  boxColors,
  boxWidth,
  type Layout,
  layoutStrip,
  pathLength,
  placeLabel,
  type Point,
  type Rect,
  replaceSameSpot,
  type SceneBadge,
  type SceneBox,
  type SceneLabel,
  type SceneRegion,
  stripNeed,
} from "./scene";

/** 枝の帯。`line` は commit の丸を並べる高さ */
export interface GitLane extends Rect {
  id: string;
  line: number;
  color: ColorKey;
  /** 丸の真ん中から 1 段目の札の真ん中まで。丸の上に字を置く帯は、字のさらに上に札を置く */
  tagBase: number;
}

export interface GitPlaced {
  id: string;
  branch: string;
  color: ColorKey;
  cx: number;
  cy: number;
  r: number;
  /** commit を積んだ段と、段の中の出来事の番号 */
  step: number;
  event: number;
  /** 親の commit。merge commit は取り込む先の先端と取り込む枝の先端の 2 つ */
  parents: string[];
  /** 当て直した元の commit */
  copy?: string;
  hash?: string;
  note?: string;
  /** hash と一言の字の四角と、上から並べた行と、行ごとの基準線の高さ */
  text?: Rect & { lines: string[]; baselines: number[] };
  /** どの札からも辿れなくなった段と、その段の中の出来事の番号 */
  orphan?: number;
  orphanEvent?: number;
}

/** 丸と丸を繋ぐ線。親から子 (`parent`)、当て直しの元から写し (`copy`)、枝を切る (`branch`、`to` は枝の名札) */
export interface GitLink {
  kind: "parent" | "copy" | "branch";
  from: string;
  to: string;
  step: number;
  event: number;
  points: Point[];
  color: ColorKey;
}

/** 段の終わりに札が留まる四角 */
export interface GitTag extends Rect {
  ref: string;
  step: number;
}

/** 札が段の終わりに指す commit。HEAD は `attached` に段の終わりに指す枝を持ち、枝から離れた段は `null` */
export interface GitRef {
  name: string;
  at: (string | null)[];
  attached?: (string | null)[];
}

/**
 * 札の動き。段の中の出来事で、札が `from` の四角から `to` の四角へ移る。
 * `from` が無い札はその出来事で現れ、`to` が無い札は消える。`line` は札を動かす線の出来事が引く線
 */
export interface GitMove {
  ref: string;
  step: number;
  event: number;
  from?: Rect;
  to?: Rect;
  /** 札が着く commit */
  target?: string;
  /** 札を動かす線に、枝の札と別の運ぶ物を書いたか。書いた時は運ぶ物が線を走り、枝の札は走らずに着いた所へ移る */
  carried?: boolean;
  line?: Point[];
  color: ColorKey;
}

export interface GitLayout extends Layout {
  kind: "git";
  lanes: GitLane[];
  commits: GitPlaced[];
  links: GitLink[];
  tags: GitTag[];
  refs: GitRef[];
  moves: GitMove[];
}


/** 札が留まる所。commit と、その commit の上の札の段 (0 から数える) */
interface Slot {
  commit: string;
  row: number;
}

interface Made {
  id: string;
  branch: string;
  parents: string[];
  /** 取り込む枝の先端の親 */
  joined?: string;
  copy?: string;
  hash?: string;
  note?: string;
  step: number;
  event: number;
  orphan?: { step: number; event: number };
}

interface Walked {
  branches: string[];
  made: Made[];
  links: Omit<GitLink, "points" | "color">[];
  moves: { ref: string; step: number; event: number; from?: Slot; to?: Slot; line: boolean }[];
  refs: GitRef[];
  tags: { ref: string; step: number; slot: Slot }[];
  /** commit ごとの、同時に留まる札の段の数の最大 */
  rows: Map<string, number>;
}

/** 段の中の出来事を順に辿り、commit と親と、札が指す commit と、札の動きを決める */
function walk(diagram: Diagram): Walked {
  const branches = (diagram.git?.branches ?? []).map((b) => b.id);
  const lane = (id: string): void => {
    if (!branches.includes(id)) branches.push(id);
  };
  for (const step of diagram.steps) for (const e of step.events) if (e.type === "commit" || e.type === "branch") lane(e.branch);
  const tips = new Map<string, string | null>(branches.map((b) => [b, null]));
  let headAt: string | null = null;
  let attached: string | null = null;
  const made: Made[] = [];
  const byId = new Map<string, Made>();
  const links: Walked["links"] = [];
  const moves: Walked["moves"] = [];
  const tags: Walked["tags"] = [];
  const rows = new Map<string, (string | null)[]>();
  const most = new Map<string, number>();
  const shown = new Map<string, Slot>();
  const names = [...branches, HEAD];
  const at = new Map<string, (string | null)[]>(names.map((n) => [n, []]));
  const heads: (string | null)[] = [];

  /** 札が今出ている commit。HEAD は枝から離れた間だけ出る */
  const visible = (ref: string): string | null => (ref === HEAD ? (attached === null ? headAt : null) : (tips.get(ref) ?? null));
  const freeRow = (commit: string): number => {
    const list = rows.get(commit) ?? [];
    const free = list.indexOf(null);
    return free < 0 ? list.length : free;
  };
  /** 出来事で札の指す先を変え、出ている札を動かす。離れる札を先に外し、来る札を宣言の順に空いた段へ置く */
  const settle = (step: number, event: number, change: () => void, lineFor?: string): void => {
    const before = new Map(names.map((n) => [n, visible(n)]));
    const headBefore = headAt;
    change();
    const changed = names.filter((n) => before.get(n) !== visible(n));
    const leaving = changed.map((ref) => {
      const slot = shown.get(ref);
      if (slot) {
        (rows.get(slot.commit) as (string | null)[])[slot.row] = null;
        shown.delete(ref);
      }
      return { ref, slot };
    });
    for (const { ref, slot } of leaving) {
      // 枝から離れる HEAD は、それまで指していた commit の空いた段から出る
      const from = slot ?? (ref === HEAD && headBefore !== null ? { commit: headBefore, row: freeRow(headBefore) } : undefined);
      const target = visible(ref);
      let to: Slot | undefined;
      if (target !== null) {
        to = { commit: target, row: freeRow(target) };
        const list = rows.get(target) ?? [];
        list[to.row] = ref;
        rows.set(target, list);
        most.set(target, Math.max(most.get(target) ?? 0, list.filter((r) => r !== null).length));
        shown.set(ref, to);
      }
      moves.push({ ref, step, event, ...(from ? { from } : {}), ...(to ? { to } : {}), line: ref === lineFor });
    }
  };
  /** どの札からも辿れなくなった commit に、その出来事を記す */
  const prune = (step: number, event: number): void => {
    const reach = new Set<string>();
    const stack = [...tips.values(), headAt].filter((c): c is string => c !== null);
    while (stack.length > 0) {
      const id = stack.pop() as string;
      if (reach.has(id)) continue;
      reach.add(id);
      stack.push(...(byId.get(id)?.parents ?? []));
    }
    for (const c of made) if (!reach.has(c.id) && c.orphan === undefined) c.orphan = { step, event };
  };

  diagram.steps.forEach((step, s) => {
    step.events.forEach((e, k) => {
      if (e.type === "commit") commit(e, s, k);
      else if (e.type === "branch") {
        if (!byId.has(e.from)) return;
        if (laneOf(e.from) !== e.branch) links.push({ kind: "branch", from: e.from, to: e.branch, step: s, event: k });
        settle(s, k, () => {
          tips.set(e.branch, e.from);
          attached = e.branch;
          headAt = e.from;
        });
      } else if (e.type === "edge") {
        const ref = e.from;
        if ((ref !== HEAD && !tips.has(ref)) || !byId.has(e.to)) return;
        settle(
          s,
          k,
          () => {
            if (ref === HEAD) {
              attached = null;
              headAt = e.to;
              return;
            }
            tips.set(ref, e.to);
            if (attached === ref) headAt = e.to;
            else if (attached === null && headAt === e.to) attached = ref;
          },
          ref,
        );
      } else return;
      prune(s, k);
    });
    for (const n of names) at.get(n)?.push(n === HEAD ? headAt : (tips.get(n) ?? null));
    heads.push(attached);
    for (const n of names) {
      const slot = shown.get(n);
      if (slot) tags.push({ ref: n, step: s, slot });
    }
  });

  function laneOf(id: string): string | undefined {
    return byId.get(id)?.branch;
  }

  function commit(e: Extract<DiagramEvent, { type: "commit" }>, s: number, k: number): void {
    if (byId.has(e.id)) return;
    const copy = e.copy !== undefined && byId.has(e.copy) ? e.copy : undefined;
    const base = copy !== undefined && attached === null && headAt !== null ? headAt : (tips.get(e.branch) ?? null);
    const joined = e.merge !== undefined && e.merge !== e.branch ? (tips.get(e.merge) ?? undefined) : undefined;
    const parents = [...new Set([base, joined].filter((c): c is string => c !== null && c !== undefined))];
    const c: Made = {
      id: e.id,
      branch: e.branch,
      parents,
      ...(joined !== undefined && joined !== base ? { joined } : {}),
      ...(copy !== undefined ? { copy } : {}),
      ...(e.hash !== undefined ? { hash: e.hash } : {}),
      ...(e.note !== undefined ? { note: e.note } : {}),
      step: s,
      event: k,
    };
    made.push(c);
    byId.set(c.id, c);
    for (const p of parents) links.push({ kind: "parent", from: p, to: c.id, step: s, event: k });
    if (copy !== undefined) links.push({ kind: "copy", from: copy, to: c.id, step: s, event: k });
    const first = attached === null && headAt === null;
    settle(s, k, () => {
      if (copy === undefined) {
        tips.set(e.branch, c.id);
        if (attached === e.branch) headAt = c.id;
      } else if (attached === null) headAt = c.id;
      if (first) {
        attached = e.branch;
        headAt = c.id;
      }
    });
  }

  const refs: GitRef[] = names.map((name) => ({ name, at: at.get(name) ?? [], ...(name === HEAD ? { attached: heads } : {}) }));
  return { branches, made, links, moves, refs, tags, rows: most };
}

/** 3 次の Bézier 曲線を点で区切る。始まりの点は含めない */
function cubic(p0: Point, c1: Point, c2: Point, p3: Point): Point[] {
  const n = LOOK.git.samples;
  return Array.from({ length: n }, (_, k): Point => {
    const t = (k + 1) / n;
    const u = 1 - t;
    const at = (i: 0 | 1): number => u * u * u * p0[i] + 3 * u * u * t * c1[i] + 3 * u * t * t * c2[i] + t * t * t * p3[i];
    return [at(0), at(1)];
  });
}

/**
 * 札を動かす線。高さの違う札の間は、低い側の札の x で縦に進み、高い側の札の高さで横に進む鉤形にする。
 * 一番上でない帯の commit は上の帯の commit と列の半分ずれるので、縦の線は上の帯の字の間を通る
 */
function elbow(from: Point, to: Point): Point[] {
  if (Math.abs(from[1] - to[1]) < 0.5) return [from, to];
  return from[1] > to[1] ? [from, [from[0], to[1]], to] : [from, [to[0], from[1]], to];
}

/** 丸の真ん中と半径 */
type Circle = { cx: number; cy: number; r: number };

/** 枝へ分かれる線。親の丸から縦に出て曲がり、`ty` の高さを横へ `tx` まで進む */
function fork(p: Circle, tx: number, ty: number): Point[] {
  const sign = ty > p.cy ? 1 : -1;
  const p0: Point = [p.cx, p.cy + sign * p.r];
  const turn = Math.max(0, Math.min(LOOK.git.turn, tx - p.cx));
  const p3: Point = [p.cx + turn, ty];
  const curve = cubic(p0, [p0[0], p0[1] + (ty - p0[1]) * 0.7], [p.cx + turn * 0.2, ty], p3);
  return [p0, ...curve, ...(tx > p3[0] ? [[tx, ty] as Point] : [])];
}

/** 枝から入る線。親の帯の線を横へ進み、曲がって子の丸へ縦に入る */
function join(p: Circle, c: Circle): Point[] {
  const sign = c.cy < p.cy ? 1 : -1;
  const p0: Point = [p.cx + p.r, p.cy];
  const p3: Point = [c.cx, c.cy + sign * c.r];
  const turn = Math.max(0, Math.min(LOOK.git.turn, c.cx - p0[0]));
  const h: Point = [c.cx - turn, p.cy];
  const curve = cubic(h, [c.cx - turn * 0.2, p.cy], [c.cx, p3[1] + (p.cy - p3[1]) * 0.7], p3);
  return [p0, ...(h[0] > p0[0] ? [h] : []), ...curve];
}

/** 当て直しの線。元の丸の縁から写しの丸の縁へ、S 字に縦に渡る。同じ帯の時は丸の上を弧で渡る */
function copyLine(p: Circle, c: Circle): Point[] {
  if (Math.abs(p.cy - c.cy) < 0.5) {
    const top = p.cy - p.r;
    const lift = LOOK.git.turn * 0.7;
    return [[p.cx, top], ...cubic([p.cx, top], [p.cx, top - lift], [c.cx, top - lift], [c.cx, top])];
  }
  const sign = c.cy < p.cy ? -1 : 1;
  const p0: Point = [p.cx, p.cy + sign * p.r];
  const p3: Point = [c.cx, c.cy - sign * c.r];
  const mid = (p3[1] - p0[1]) * 0.5;
  return [p0, ...cubic(p0, [p0[0], p0[1] + mid], [p3[0], p3[1] - mid], p3)];
}

export function layoutGit(diagram: Diagram): GitLayout {
  const { margin, gap, box: B, region: R, git: G, carrier: C } = LOOK;
  const walked = walk(diagram);
  const notes = new Map((diagram.git?.branches ?? []).map((b) => [b.id, b.note]));
  const laneIndex = new Map(walked.branches.map((id, i) => [id, i]));
  const colorOf = (branch: string): ColorKey => G.colors[(laneIndex.get(branch) ?? 0) % G.colors.length] as ColorKey;

  // 列。親より 1 列右で、同じ帯では前に積んだ commit より右
  const col = new Map<string, number>();
  const laneLast = new Map<string, number>();
  for (const c of walked.made) {
    const k = Math.max(0, ...c.parents.map((p) => (col.get(p) ?? -1) + 1), (laneLast.get(c.branch) ?? -1) + 1);
    col.set(c.id, k);
    laneLast.set(c.branch, k);
  }
  /** hash と一言の行と、行ごとの字。hash は等幅で書く */
  const linesOf = (c: Made): { text: string; style: TextStyle }[] => [
    ...(c.hash !== undefined ? [{ text: c.hash, style: TYPE.gitHash }] : []),
    ...(c.note !== undefined ? [{ text: c.note, style: TYPE.gitNote }] : []),
  ];
  const textW = (c: Made): number => Math.max(0, ...linesOf(c).map((line) => textWidth(line.text, line.style)));
  const tagW = (ref: string): number => textWidth(ref, hasWide(ref) ? TYPE.carrierJa : TYPE.carrier) + C.tagPadX * 2;
  const refWidth = Math.max(0, ...walked.refs.map((r) => tagW(r.name)));
  const pitch = Math.max(G.pitch, ...walked.made.map((c) => textW(c) + G.textGap), refWidth + G.textGap);

  // 帯の左上の名前と添え書き。最初の列の commit の字と札は、名前の右に置く
  const headers = walked.branches.map((id) => ({ w: Math.max(R.icon, textWidth(id, TYPE.regionName), textWidth(notes.get(id) ?? "", TYPE.regionNote)) }));
  const headerRight = margin + R.inset + Math.max(0, ...headers.map((h) => h.w));
  const firstHalf = Math.max(G.r, ...walked.made.filter((c) => col.get(c.id) === 0 && laneIndex.get(c.branch) === 0).map((c) => textW(c) / 2), refWidth / 2);
  const x0 = Math.max(G.x0, headerRight + gap + firstHalf);

  // 帯の高さ。札が 2 段より多く重なる commit がある帯は、その分だけ線を下げる。
  // 一番上でない帯の下は、その帯の commit へ札を動かす線の名前を置く帯だけ、名前の分を空ける
  const named = new Set(
    walked.moves.flatMap((mv) => {
      const source = diagram.steps[mv.step]?.events[mv.event];
      return mv.line && mv.to && source?.type === "edge" && source.label !== undefined ? [walked.made.find((c) => c.id === mv.to?.commit)?.branch ?? ""] : [];
    }),
  );
  const extraRows = (branch: string): number =>
    Math.max(0, ...walked.made.filter((c) => c.branch === branch).map((c) => (walked.rows.get(c.id) ?? 0) - 2)) * G.row;
  // 一番上の帯の commit が字を持たない時は、札を丸のすぐ上に置き、字の分の高さを帯から除く
  const topText = walked.made.some((c) => laneIndex.get(c.branch) === 0 && linesOf(c).length > 0);
  const lanes: GitLane[] = [];
  let y = margin;
  walked.branches.forEach((id, i) => {
    const top = i === 0;
    const tagBase = top && topText ? G.tagTop : G.tag;
    const line = y + (top ? G.topLine - (G.tagTop - tagBase) : G.line) + extraRows(id);
    const h = line - y + (top ? G.topBelow : named.has(id) ? G.below : G.bare);
    lanes.push({ id, x: margin, y, w: 0, h, line, color: colorOf(id), tagBase });
    y += h + R.gap;
  });
  const lanesBottom = y - R.gap;
  const laneOf = new Map(lanes.map((l) => [l.id, l]));

  const commits: GitPlaced[] = walked.made.map((c) => {
    const lane = laneOf.get(c.branch) as GitLane;
    const isTop = laneIndex.get(c.branch) === 0;
    const cx = x0 + pitch * (col.get(c.id) ?? 0) + (isTop ? 0 : pitch / 2);
    const cy = lane.line;
    const lines = linesOf(c);
    // 一番上の帯は丸の上へ、下の行を丸に近く積む。ほかの帯は丸の下へ、上の行を丸に近く積む
    const baselines = lines.map((_, k) => (isTop ? cy - G.above - (lines.length - 1 - k) * G.lineStep : cy + G.under + k * G.lineStep));
    const boxes = lines.map((line, k) => textBox(line.text, cx, baselines[k] as number, line.style, "middle"));
    const text = boxes.length === 0 ? undefined : { ...union(boxes), lines: lines.map((line) => line.text), baselines };
    // 当て直した commit は元の commit の色で描く
    const color = c.copy !== undefined ? colorOf(walked.made.find((m) => m.id === c.copy)?.branch ?? c.branch) : colorOf(c.branch);
    return {
      id: c.id,
      branch: c.branch,
      color,
      cx,
      cy,
      r: G.r,
      step: c.step,
      event: c.event,
      parents: c.parents,
      ...(c.copy !== undefined ? { copy: c.copy } : {}),
      ...(c.hash !== undefined ? { hash: c.hash } : {}),
      ...(c.note !== undefined ? { note: c.note } : {}),
      ...(text ? { text } : {}),
      ...(c.orphan ? { orphan: c.orphan.step, orphanEvent: c.orphan.event } : {}),
    };
  });
  const placed = new Map(commits.map((c) => [c.id, c]));

  const links: GitLink[] = walked.links.flatMap((l): GitLink[] => {
    const from = placed.get(l.from);
    if (!from) return [];
    if (l.kind === "branch") {
      // 枝を切る線は、その枝に後で commit を積む時だけ引く。積まない枝の帯へ引くと、線が何も無い所で途切れる
      if (!walked.made.some((c) => c.branch === l.to)) return [];
      const lane = laneOf.get(l.to) as GitLane;
      return [{ ...l, points: fork(from, from.cx + G.turn, lane.line), color: colorOf(l.to) }];
    }
    const to = placed.get(l.to) as GitPlaced;
    const made = walked.made.find((m) => m.id === l.to);
    let points: Point[];
    if (l.kind === "copy") points = copyLine(from, to);
    else if (Math.abs(from.cy - to.cy) < 0.5) points = [[from.cx + from.r, from.cy], [to.cx - to.r, to.cy]];
    else if (made?.joined === l.from) points = join(from, to);
    else points = fork(from, to.cx - to.r, to.cy);
    return [{ ...l, points, color: to.color }];
  });

  /** 札の段の四角。一番上の帯は字の上に、ほかの帯は丸の上に重ねる */
  const tagRect = (ref: string, slot: Slot): Rect => {
    const c = placed.get(slot.commit) as GitPlaced;
    const base = laneOf.get(c.branch)?.tagBase ?? G.tag;
    const w = tagW(ref);
    return { x: c.cx - w / 2, y: c.cy - base - slot.row * G.row - C.tagH / 2, w, h: C.tagH };
  };
  const center = (r: Rect): Point => [r.x + r.w / 2, r.y + r.h / 2];
  // 札を動かす線は札と同じ墨の灰で引く。札は枝の色を持たず、同じ札の通り道に重なる線どうしを 1 本に見せるため
  const moves: GitMove[] = walked.moves.map((m) => {
    const from = m.from ? tagRect(m.ref, m.from) : undefined;
    const to = m.to ? tagRect(m.ref, m.to) : undefined;
    const source = diagram.steps[m.step]?.events[m.event];
    const carried = m.line && source?.type === "edge" && source.carry.kind !== "none" && !(source.carry.kind === "tag" && source.carry.text === source.from);
    return {
      ref: m.ref,
      step: m.step,
      event: m.event,
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(m.to ? { target: m.to.commit } : {}),
      ...(carried ? { carried: true } : {}),
      ...(m.line && from && to ? { line: elbow(center(from), center(to)) } : {}),
      color: "slate",
    };
  });
  const tags: GitTag[] = walked.tags.map((t) => ({ ...tagRect(t.ref, t.slot), ref: t.ref, step: t.step }));

  // 箱は commit の並びの右に縦に並べる。最初の箱は 2 本目の帯の線の高さに置く
  const colors = boxColors(diagram);
  const right = Math.max(
    x0,
    ...commits.flatMap((c) => [c.cx + c.r, ...(c.text ? [c.text.x + c.text.w] : [])]),
    ...tags.map((t) => t.x + t.w),
    ...moves.flatMap((m) => [m.from, m.to].flatMap((r) => (r ? [r.x + r.w] : []))),
  );
  const boxX = right + G.boxGap;
  const firstCy = (lanes[1] ?? lanes[0])?.line ?? margin + B.h / 2;
  const boxes: SceneBox[] = diagram.boxes.map((b, i) => {
    const w = boxWidth(diagram, b.id, true);
    const cy = firstCy + i * (B.h + gap);
    return {
      id: b.id,
      name: b.name,
      ...(b.sub !== undefined ? { sub: b.sub } : {}),
      ...(b.icon !== undefined ? { icon: b.icon } : {}),
      color: colors.get(b.id) ?? "slate",
      x: boxX,
      y: cy - B.h / 2,
      w,
      h: B.h,
      cx: boxX + w / 2,
      cy,
    };
  });

  const regions: SceneRegion[] = lanes.map((lane, i) => {
    const note = notes.get(lane.id);
    return {
      id: lane.id,
      lines: [lane.id],
      ...(note !== undefined ? { note } : {}),
      icon: "branch",
      color: lane.color,
      x: lane.x,
      y: lane.y,
      w: 0,
      h: lane.h,
      header: { x: lane.x + R.inset, y: lane.y + R.inset, w: headers[i]?.w ?? 0, h: R.nameY - R.inset + (note !== undefined ? R.line : 0) + gap / 2 },
    };
  });

  const layout: GitLayout = {
    kind: "git",
    width: 0,
    height: 0,
    regions,
    boxes,
    lifelines: [],
    edges: [],
    labels: [],
    actions: [],
    badges: [],
    paths: [],
    ends: [],
    lanes,
    commits,
    links,
    tags,
    refs: walked.refs,
    moves,
  };
  layout.badges = badgesOf(diagram, layout);
  layout.labels = labelsOf(diagram, layout);

  const contentRight = Math.max(right, ...boxes.map((b) => b.x + b.w), ...layout.labels.map((l) => l.x + l.w)) + R.pad;
  const width = Math.max(contentRight + margin, stripNeed(diagram) + margin * 2);
  for (const region of regions) region.w = width - margin * 2;
  for (const lane of lanes) lane.w = width - margin * 2;
  const bottom = Math.max(lanesBottom, ...boxes.map((b) => b.y + b.h), ...layout.labels.map((l) => l.y + l.h));
  const strip = layoutStrip(diagram, margin, bottom + gap, width - margin * 2);
  layout.width = width;
  layout.height = (strip ? strip.y + strip.h : bottom) + margin;
  if (strip) layout.strip = strip;
  // 中身の帯だけを書き換える段の番号は帯の左上に置くので、帯を置いた後に決め直す
  layout.badges = badgesOf(diagram, layout);
  return layout;
}

function union(rects: Rect[]): Rect {
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  return { x, y, w: Math.max(...rects.map((r) => r.x + r.w)) - x, h: Math.max(...rects.map((r) => r.y + r.h)) - y };
}

/**
 * 段で最初に起きる、番号を置ける出来事。commit の親からの線と枝を切る線は線を、札を動かす線は札が着く commit を返す。
 * 札を動かす線は段が終わると消えるので、番号は線ではなく着いた commit の脇に置く
 */
function firstMark(layout: GitLayout, step: number): { event: number; points?: Point[]; target?: GitPlaced; color: ColorKey } | undefined {
  const marks = [
    ...layout.links.filter((l) => l.step === step && l.kind !== "copy").map((l) => ({ event: l.event, points: l.points, color: l.color })),
    ...layout.moves.flatMap((m) => {
      const target = layout.commits.find((c) => c.id === m.target);
      return m.step === step && m.line && target ? [{ event: m.event, target, color: target.color }] : [];
    }),
  ].sort((a, b) => a.event - b.event);
  return marks[0];
}

/** commit の丸の右、下、左、上のうち、段の番号の丸が札と字と丸に掛からず、先に置いた番号からも離れた最初の点。無ければ `undefined` */
function besideCommit(c: GitPlaced, taken: Point[], avoid: Rect[]): Point | undefined {
  const { r, inset } = LOOK.badge;
  const d = c.r + inset + r;
  const apart = r * 2 + inset;
  const spots: Point[] = [
    [c.cx + d, c.cy],
    [c.cx, c.cy + d],
    [c.cx - d, c.cy],
    [c.cx, c.cy - d],
  ];
  return spots.find((p) => taken.every(([x, y]) => Math.hypot(p[0] - x, p[1] - y) >= apart) && avoid.every((a) => gapBetween(badgeRect(p), a) >= LOOK.label.touch));
}

/**
 * 線の上で、段の番号の丸が札と字と丸 (`avoid`) に掛からず、先に置いた番号 (`taken`) からも離れた最初の点。
 * 札はどの段に留まる札も避ける。済んだ段の番号は最後の段まで残るので、後の段に来る札にも掛けない。無ければ `undefined`
 */
function clearOnPath(points: Point[], taken: Point[], avoid: Rect[]): Point | undefined {
  const { r, inset, along: start, short } = LOOK.badge;
  const length = pathLength(points);
  const first = length < short ? Math.min(r + 1, length / 2) : start;
  const apart = r * 2 + inset;
  for (let d = first; d <= length; d += 1) {
    const p = along(points, d);
    const rect = badgeRect(p);
    if (taken.every(([x, y]) => Math.hypot(p[0] - x, p[1] - y) >= apart) && avoid.every((a) => gapBetween(rect, a) >= LOOK.label.touch)) return p;
  }
  return undefined;
}

/**
 * 段の番号。commit を積む段と枝を切る段は、段で最初に引く線の始まりから少し進んだ所に置き、先に置いた番号と札と字と丸を避けて線に沿って進める。
 * 札を動かす段は、札が着いた commit の丸の脇に置く。線の無い段は、箱か帯を書き換える段なら箱か帯の左上の角に、
 * 何も起きない段は一番上の枝の先端の commit の脇に置き、脇が埋まっていれば前の段の番号と同じ所に置いて数字を入れ替える
 */
function badgesOf(diagram: Diagram, layout: GitLayout): SceneBadge[] {
  const { inset } = LOOK.badge;
  const taken: Point[] = [];
  const all = [...layout.links.map((l) => l.points), ...layout.moves.flatMap((m) => (m.line ? [m.line] : []))];
  const out: SceneBadge[] = [];
  const avoid: Rect[] = [
    ...layout.tags,
    ...layout.commits.flatMap((c) => [{ x: c.cx - c.r, y: c.cy - c.r, w: c.r * 2, h: c.r * 2 }, ...(c.text ? [c.text] : [])]),
  ];
  diagram.steps.forEach((step, s) => {
    const mark = firstMark(layout, s);
    const near = mark?.target ? besideCommit(mark.target, taken, avoid) : undefined;
    if (mark && (mark.points || near)) {
      const points = mark.points;
      const point = near ?? (points ? (clearOnPath(points, taken, avoid) ?? badgeOnPath(points, taken, all.filter((p) => p !== points))) : [0, 0]);
      taken.push(point);
      out.push({ step: s, x: point[0], y: point[1], color: mark.color });
      return;
    }
    const box = step.events.flatMap((e) => (e.type === "swap" || e.type === "action" ? [e.box] : [])).map((id) => layout.boxes.find((b) => b.id === id))[0];
    if (box) {
      out.push({ step: s, x: box.x, y: box.y, color: box.color });
      return;
    }
    if (layout.strip && step.events.some((e) => e.type === "strip")) {
      out.push({ step: s, x: layout.strip.x + inset, y: layout.strip.y + inset, color: "slate" });
      return;
    }
    // 何も起きない段と、着いた commit の脇が埋まっている札の段は、一番上の枝の先端の commit の脇に置く。
    // 先端が無いか、脇が埋まっている時は前の段の番号と入れ替える
    const tip = layout.commits.find((c) => c.id === layout.refs[0]?.at[s]);
    const spot = tip ? besideCommit(tip, taken, avoid) : undefined;
    if (tip && spot) {
      taken.push(spot);
      out.push({ step: s, x: spot[0], y: spot[1], color: tip.color });
      return;
    }
    const before = out[out.length - 1];
    const lane = layout.lanes[0];
    out.push(before ? { ...before, step: s } : { step: s, x: (lane?.x ?? 0) + (lane?.w ?? 0) - inset - LOOK.badge.r, y: (lane?.y ?? 0) + inset + LOOK.badge.r, color: lane?.color ?? "slate" });
  });
  return replaceSameSpot(out);
}

/**
 * 札を動かす線の名前。一番上の帯の commit へ動かす線は札の段のさらに上に、ほかの帯の commit へ動かす線は丸の下の字のさらに下に置き、
 * 丸と字と、その段の終わりに留まる札と、同じ時刻に見える段の番号を避ける
 */
function labelsOf(diagram: Diagram, layout: GitLayout): SceneLabel[] {
  const G = LOOK.git;
  const labels: SceneLabel[] = [];
  const circles: Rect[] = layout.commits.map((c) => ({ x: c.cx - c.r, y: c.cy - c.r, w: c.r * 2, h: c.r * 2 }));
  const texts: Rect[] = layout.commits.flatMap((c) => (c.text ? [c.text] : []));
  const headers = layout.regions.map((r) => r.header);
  for (const move of layout.moves) {
    const source = diagram.steps[move.step]?.events[move.event];
    if (source?.type !== "edge" || source.label === undefined || !move.line) continue;
    const target = layout.commits.find((c) => c.id === source.to);
    if (!target) continue;
    const top = layout.lanes[0]?.id === target.branch;
    const w = textWidth(source.label, hasWide(source.label) ? TYPE.labelJa : TYPE.label) + LOOK.label.padX * 2;
    const [mx] = move.line.reduce((sum, p) => [sum[0] + p[0] / (move.line as Point[]).length, 0], [0, 0]);
    const rows = Math.max(0, ...layout.tags.filter((t) => t.step === move.step && Math.abs(t.x + t.w / 2 - target.cx) < 0.5).map((t) => target.cy - t.y));
    // 置く側を書いた名前は、その側の線の脇から探す
    const side = source.labelSide ?? (top ? "above" : "below");
    const base =
      source.labelSide !== undefined
        ? undefined
        : top
          ? { x: mx - w / 2, y: target.cy - Math.max(rows, (layout.lanes[0]?.tagBase ?? G.tag) + LOOK.carrier.tagH / 2) - LOOK.label.soft - LOOK.label.h }
          : { x: mx - w / 2, y: target.cy + G.labelUnder };
    const seen = layout.badges.filter((b) => b.step <= move.step).map((b) => badgeRect([b.x, b.y]));
    const tags = layout.tags.filter((t) => t.step === move.step);
    labels.push(
      placeLabel(
        { step: move.step, event: move.event, text: source.label, points: move.line, color: move.color, side, ...(base ? { base } : {}) },
        { hard: [...circles, ...layout.boxes], soft: [...texts, ...tags, ...headers, ...labels.filter((l) => l.step === move.step)], touch: seen },
      ),
    );
  }
  return labels;
}
