/**
 * 構成図の置き場所。
 *
 * 区画を書いた順に上から帯に積み、帯の左に区画の名前を置く。区画の外の箱は、書いた所の前後の区画の間の帯に置く (#3546)。箱は全ての帯で共通の列に並べるので、
 * 区画をまたぐ線は縦にまっすぐ走る。箱の並びは線を辿って決める。前の区画の箱から線が来る箱を
 * その箱の列に置き、そこから線で繋がる箱を隣の列へ (寄せの指示が左か右なら下の行へ) 置いていく。
 * 線は縦と横の折れ線で、間にある箱を避ける。名前が箱に掛かる時は帯を広げて名前の場所を空ける。
 * 箱の下か上を回る線は、行で最も高い箱の枠と帯の枠から余白 (`LOOK.margin`) 以上離して通し、帯が狭ければ帯を広げる (#3526、#3546)。
 * 同じ箱の同じ所から別々の箱へ出る線は、出る所と回る道を離して通し、離した道が収まるまで行の間か帯か列の間を広げる (#3549)。
 * 別々の箱から出て同じ道を回る線も、区間が重なれば道を離し、同じ所へ入る線と出る線も入る所と出る所を離す (#3552)。
 * 囲みの外へ出る線の名前は囲みの枠線から離して置き、空きが無ければ帯の間を広げる。図の枠の上へ出る名前は、出た分だけ図の上を広げる (#3554)。
 */
import { APART, LOOK, TYPE } from "../../look/values";
import type { DiagramModel, LabelSide, Region } from "../../schema";
import { textWidth } from "../../layout/measure";
import {
  backOf,
  badgeBlocked,
  badgeOnPath,
  badgeRect,
  besideSameSpot,
  boxColors,
  boxWidth,
  cornerBadge,
  edgeColor,
  edgesOf,
  frameLines,
  labelStyle,
  type Layout,
  lineBadges,
  lineKey,
  longest,
  LOOP_ROOM,
  loopBadge,
  loopLabelBase,
  loopUnder,
  layoutStrip,
  type BoxFit,
  shapedSize,
  type Point,
  nearestLine,
  placeLabel,
  placeSlot,
  pullApart,
  type Rect,
  regionColors,
  type SceneBox,
  type SceneEdge,
  type SceneLabel,
  type SceneRegion,
  seatCarriers,
  shiftContent,
  slotBoxWidth,
  slotRooms,
  stripNeed,
} from "../../layout/scene";

interface Group {
  region?: Region;
  members: string[];
}

interface Slot {
  group: number;
  col: number;
  row: number;
}

interface Room {
  top: number;
  bottom: number;
}

/**
 * 回る道を並べるのに足す間 (鍵は行の下が `g:r:below`、行の上が `g:r:above`、列 `i` と `i + 1` の間が `col:i`)。
 * 同じ箱の同じ所から出る線の回る道を離して並べると、並べた分だけ行の間か帯か列の間を広げる (#3549)
 */
type Lanes = Map<string, number>;

export function layoutArchitecture(diagram: DiagramModel): Layout {
  const groups = groupsOf(diagram);
  const slots = placeBoxes(diagram, groups);
  const rooms = groups.map(() => ({ top: 0, bottom: 0 }));
  const lanes: Lanes = new Map();
  let { layout, need } = arrange(diagram, groups, slots, rooms, lanes);
  // 名前を置く場所が帯の外へ出たら、その帯を広げて置き直す。箱の下か上を回る線が帯の枠に近い時も広げる (#3526)。
  // 同じ所から出る線の回る道を並べる間が足りない時も、その間を広げて置き直す (#3549)
  for (let pass = 0; pass < 3; pass++) {
    const widened = widen(lanes, need);
    if (!grow(layout, groups, slots, rooms) && !widened) break;
    ({ layout, need } = arrange(diagram, groups, slots, rooms, lanes));
  }
  return layout;
}

/** 回る道を並べるのに要る間を、今の間より広い所だけ広げる。広げたら true */
function widen(lanes: Lanes, need: Lanes): boolean {
  let widened = false;
  for (const [key, room] of need) {
    if (room <= (lanes.get(key) ?? 0) + 0.01) continue;
    lanes.set(key, room);
    widened = true;
  }
  return widened;
}

/**
 * 帯を上から積む順。区画は書いた順に並べる。区画に入らない箱は、続けて書いた箱ごとに1つの帯にまとめ、書いた所の前後の区画の間に積む。
 * 区画の外の箱を全て最後の帯にまとめると、2つの区画の間に書いた橋の箱が下の区画の下へ回り、上の区画から橋へ行く線が
 * 下の区画を縦に貫いて、その区画の箱の字を横切る (#3546)。箱を1つも持たない区画は書いた場所が判らないので、前の区画の後に置く
 */
function groupsOf(diagram: DiagramModel): Group[] {
  const regions = diagram.regions ?? [];
  const order = new Map(regions.map((r, i) => [r.id, i]));
  const groups: Group[] = [];
  const byRegion = new Map<string, Group>();
  let opened = 0;
  /** `last` 番目の区画まで、まだ積んでいない区画を書いた順に積む */
  const openUpTo = (last: number): void => {
    for (; opened <= last; opened++) {
      const region = regions[opened] as Region;
      const group: Group = { region, members: [] };
      groups.push(group);
      byRegion.set(region.id, group);
    }
  };
  for (const box of diagram.boxes) {
    const at = box.region === undefined ? undefined : order.get(box.region);
    if (at === undefined) {
      const last = groups.at(-1);
      if (last && !last.region) last.members.push(box.id);
      else groups.push({ members: [box.id] });
      continue;
    }
    openUpTo(at);
    byRegion.get(box.region as string)?.members.push(box.id);
  }
  openUpTo(regions.length - 1);
  return groups;
}

const vertical = (side: LabelSide | undefined): boolean => side === "left" || side === "right";

/** 箱を列と行へ置く。列は全ての区画で共通。 */
function placeBoxes(diagram: DiagramModel, groups: Group[]): Map<string, Slot> {
  const columns = LOOK.architecture.columns;
  const edges = edgesOf(diagram).map((e) => e.edge);
  const slots = new Map<string, Slot>();
  groups.forEach((group, g) => {
    const inGroup = new Set(group.members);
    const taken = new Set<string>();
    const free = (col: number, row: number): boolean => col >= 0 && col < columns && !taken.has(`${col},${row}`);
    const near = (col: number, row: number): [number, number] => {
      const start = Math.min(columns - 1, Math.max(0, col));
      for (let r = row; ; r++) {
        for (let d = 0; d < columns; d++) {
          for (const c of [start + d, start - d]) if (free(c, r)) return [c, r];
        }
      }
    };
    const put = (id: string, col: number, row: number): void => {
      slots.set(id, { group: g, col, row });
      taken.add(`${col},${row}`);
    };
    let dir = 1;
    const visit = (id: string): void => {
      for (const edge of edges) {
        const partner = edge.from === id ? edge.to : edge.to === id ? edge.from : undefined;
        if (partner === undefined || !inGroup.has(partner) || slots.has(partner)) continue;
        const me = slots.get(id) as Slot;
        const [c, r] = vertical(edge.labelSide) ? near(me.col, me.row + 1) : free(me.col + dir, me.row) ? [me.col + dir, me.row] : near(me.col + dir, me.row);
        put(partner, c, r);
        visit(partner);
      }
    };
    // 前の区画の箱と線で繋がる箱 (起きる順に早い線から) をその箱の列に置き、そこから辿る
    const anchorOf = (id: string): { order: number; col: number } | undefined => {
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        const partner = edge?.from === id ? edge.to : edge?.to === id ? edge.from : undefined;
        const slot = partner === undefined ? undefined : slots.get(partner);
        if (slot && slot.group < g) return { order: i, col: slot.col };
      }
      return undefined;
    };
    let placed = 0;
    for (;;) {
      const rest = group.members.filter((id) => !slots.has(id));
      if (rest.length === 0) break;
      const anchored = rest.map((id) => ({ id, anchor: anchorOf(id) })).filter((a) => a.anchor !== undefined);
      anchored.sort((a, b) => (a.anchor?.order ?? 0) - (b.anchor?.order ?? 0));
      const pick = anchored[0] ?? { id: rest[0] as string, anchor: undefined };
      const want = pick.anchor?.col ?? 0;
      if (placed === 0) dir = want >= (columns - 1) / 2 ? -1 : 1;
      const [c, r] = free(want, 0) ? [want, 0] : near(want, 0);
      put(pick.id, c, r);
      visit(pick.id);
      placed++;
    }
  });
  // 使っていない列を詰める
  const used = [...new Set([...slots.values()].map((s) => s.col))].sort((a, b) => a - b);
  for (const slot of slots.values()) slot.col = used.indexOf(slot.col);
  return slots;
}

/** 区画の名前の行。空白があれば真ん中に近い空白で 2 行に折る。 */
function nameLines(name: string): string[] {
  const spaces = [...name.matchAll(/ /g)].map((m) => m.index);
  if (spaces.length === 0) return [name];
  const at = spaces.reduce((best, i) => (Math.abs(i - name.length / 2) < Math.abs(best - name.length / 2) ? i : best));
  return [name.slice(0, at), name.slice(at + 1)];
}

function headerSize(region: Region): { w: number; h: number; lines: string[] } {
  const { icon, nameY, line, inset } = LOOK.region;
  const lines = nameLines(region.name);
  const w = Math.max(icon, ...lines.map((l) => textWidth(l, TYPE.regionName)), textWidth(region.note ?? "", TYPE.regionNote));
  // 名前の最後の行の下と、添え書きの下まで
  const h = nameY - inset + (lines.length - 1) * line + (region.note ? line : 0) + LOOK.gap / 2;
  return { w, h, lines };
}

function arrange(diagram: DiagramModel, groups: Group[], slots: Map<string, Slot>, rooms: Room[], lanes: Lanes): { layout: Layout; need: Lanes } {
  const { box: B, region: R, architecture: A, margin, gap } = LOOK;
  const extra = (key: string): number => lanes.get(key) ?? 0;
  const colors = boxColors(diagram);
  const regionColor = regionColors(diagram);
  const edges = edgesOf(diagram);

  // 列の幅と列の間。隣の列を横に結ぶ名前のある線は、名前が長くても収まるまで間を広げる。
  // 広げずに脇へ寄せると、名前は両隣の箱を避けて箱より上まで離れ、どの線の名前か読み手が取り違える (#3528)
  const columnCount = Math.max(1, ...[...slots.values()].map((s) => s.col + 1));
  // 運ぶ物を出し入れする箱は、絵柄の横に置き場を並べられる幅にする (#3176)。形を持つ箱は、中身が形の内に収まる大きさにする (#3520)
  const carriedIn = slotRooms(diagram);
  const fits = new Map(
    diagram.boxes.map((b) => [b.id, shapedSize(diagram, b.id, Math.max(boxWidth(diagram, b.id, true), slotBoxWidth(carriedIn.get(b.id), b.icon !== undefined, B.padX)), true, carriedIn)]),
  );
  const colW = Array.from({ length: columnCount }, (_, c) => Math.max(B.minW, ...[...slots].filter(([, s]) => s.col === c).map(([id]) => fits.get(id)?.w ?? B.minW)));
  const between = Array.from({ length: Math.max(0, columnCount - 1) }, () => A.columnGap as number);
  for (const { edge } of edges) {
    const a = slots.get(edge.from);
    const b = slots.get(edge.to);
    if (!a || !b || edge.label === undefined || a.group !== b.group || a.row !== b.row || Math.abs(a.col - b.col) !== 1 || vertical(edge.labelSide)) continue;
    const need = textWidth(edge.label, labelStyle(edge.label)) + LOOK.label.padX * 2 + A.labelRoom * 2;
    const i = Math.min(a.col, b.col);
    between[i] = Math.max(between[i] ?? 0, need);
  }
  // 列の間を縦に走る道を離して並べる時は、並べた幅だけ列の間を広げる (#3549)
  between.forEach((w, i) => (between[i] = Math.max(w, A.columnGap + extra(`col:${i}`))));
  // 縦の線の脇の名前に要る間を、別の線が回る列の間に足す (#3552)。一番右の列の右を回る道は `gapX` が足す
  between.forEach((w, i) => (between[i] = w + extra(`label:${i}`)));
  const headers = groups.map((g) => (g.region ? headerSize(g.region) : undefined));
  const headerW = Math.max(0, ...headers.map((h) => (h ? h.w + R.inset * 2 : 0)));
  const colLeft: number[] = [];
  for (let c = 0; c < columnCount; c++) colLeft.push(c === 0 ? margin + (headerW > 0 ? headerW : R.pad) : (colLeft[c - 1] as number) + (colW[c - 1] as number) + (between[c - 1] as number));
  const center = (c: number): number => (colLeft[c] as number) + (colW[c] as number) / 2;

  // 同じ箱へ戻る線は箱の下の輪で描くので、輪を持つ箱の行の下は、輪とその下の名前が収まるだけ空ける (#3186)
  const looped = new Set(edges.filter(({ edge }) => edge.from === edge.to).map(({ edge }) => edge.from));
  const loopRows = new Set([...looped].flatMap((id) => {
    const slot = slots.get(id);
    return slot ? [`${slot.group}:${slot.row}`] : [];
  }));
  const loopRoom = (g: number, row: number): number => (loopRows.has(`${g}:${row}`) ? LOOP_ROOM : 0);

  // 帯を上から積む
  const boxes: SceneBox[] = [];
  const bands: { group: number; y: number; h: number; rows: number }[] = [];
  /** 帯 `g` の行 `r` の上端と下端 (鍵は `g:r`)。行で最も高い箱の上端と下端 */
  const rowSpan = new Map<string, Room>();
  let cursor = margin;
  groups.forEach((group, g) => {
    const rows = Math.max(1, ...group.members.map((id) => (slots.get(id)?.row ?? 0) + 1));
    const room = rooms[g] as Room;
    // 行の下と上を回る道を離して並べる時は、並べた分だけ行の間と帯を広げる (#3549)
    const below = (r: number): number => extra(`${g}:${r}:below`);
    const above = (r: number): number => extra(`${g}:${r}:above`);
    // 横の線の脇の名前のために、行の下か上を回る道を行から離す分 (#3552)
    const drop = (r: number, side: "below" | "above"): number => extra(`label-lane:${g}:${r}:${side}`);
    const top = cursor + R.pad + room.top + above(0) + drop(0, "above");
    // 行の高さは行で最も高い箱の高さ。形を持つ箱は中身を収めるために高くなる (#3520)
    const rowH = Array.from({ length: rows }, (_, r) => Math.max(B.h, ...group.members.filter((id) => slots.get(id)?.row === r).map((id) => fits.get(id)?.h ?? B.h)));
    // 行の上端。輪を持つ行の下は、行の間に輪の分を足す
    const rowTop: number[] = [0];
    // 縦の線の脇の名前が行の間を横に回る線の下に入る分と、横の線の脇の名前のために道を行から離す分だけ行の間を広げる (#3552)
    const labelRow = (r: number): number => extra(`label-row:${g}:${r}`) + drop(r, "below") + drop(r + 1, "above");
    for (let r = 1; r < rows; r++) rowTop.push((rowTop[r - 1] as number) + (rowH[r - 1] as number) + A.rowGap + loopRoom(g, r - 1) + below(r - 1) + above(r) + labelRow(r - 1));
    for (let r = 0; r < rows; r++) rowSpan.set(`${g}:${r}`, { top: top + (rowTop[r] as number), bottom: top + (rowTop[r] as number) + (rowH[r] as number) });
    for (const id of group.members) {
      const slot = slots.get(id) as Slot;
      const source = diagram.boxes.find((b) => b.id === id);
      const fit = fits.get(id) as BoxFit;
      const { w, h } = fit;
      const cx = center(slot.col);
      // 行より低い箱は行の真ん中に置き、同じ行の箱を結ぶ線をまっすぐにする
      const y = top + (rowTop[slot.row] as number) + ((rowH[slot.row] as number) - h) / 2;
      boxes.push({
        id,
        name: source?.name ?? id,
        ...(source?.sub !== undefined ? { sub: source.sub } : {}),
        ...(source?.icon !== undefined ? { icon: source.icon } : {}),
        color: colors.get(id) ?? "slate",
        x: cx - w / 2,
        y,
        ...fit,
        cx,
        cy: y + h / 2,
      });
    }
    // 帯の最後の行の下も、名前のために道を離す分と、次の帯の箱へ下りる線の脇の名前が入る分だけ広げる (#3552)
    const contentBottom =
      top + (rowTop[rows - 1] as number) + (rowH[rows - 1] as number) + loopRoom(g, rows - 1) + below(rows - 1) + drop(rows - 1, "below") + extra(`label-row:${g}:${rows - 1}`);
    const header = headers[g];
    const h = Math.max(contentBottom + R.pad + room.bottom - cursor, header ? header.h + R.inset * 2 : 0, group.region ? R.minH : 0);
    bands.push({ group: g, y: cursor, h, rows });
    // 帯の間を下りる線の名前を、囲みの枠線をまたがずに置く分だけ、次の帯との間を広げる (#3554)
    cursor += h + R.gap + extra(`label-gap:${g}`);
  });
  const bandsBottom = cursor - R.gap;
  for (const box of boxes) placeSlot(box, carriedIn.get(box.id));

  const byId = new Map(boxes.map((b) => [b.id, b]));
  const bandOf = (id: string) => bands[slots.get(id)?.group ?? 0] as (typeof bands)[number];
  /** 折れ線のどれかの区間が、四角を `pad` だけ広げた所に掛かる */
  const crosses = (points: Point[], rect: Rect, pad: number): boolean => {
    for (let i = 1; i < points.length; i++) {
      const [x1, y1] = points[i - 1] as Point;
      const [x2, y2] = points[i] as Point;
      if (Math.min(x1, x2) <= rect.x + rect.w + pad && Math.max(x1, x2) >= rect.x - pad && Math.min(y1, y2) <= rect.y + rect.h + pad && Math.max(y1, y2) >= rect.y - pad) return true;
    }
    return false;
  };
  // 輪を持つ箱の下の、輪と名前の置き場。ほかの線は、その箱から出る線と入る線も含めてここを通さない (#3186)
  const loopZones: Rect[] = [...looped].flatMap((id) => {
    const box = byId.get(id);
    return box ? [{ x: box.x, y: box.y + box.h, w: box.w, h: LOOP_ROOM }] : [];
  });
  const onLoop = (points: Point[]): boolean => loopZones.some((zone) => crosses(points, zone, 0));
  const blocked = (points: Point[], a: string, b: string): boolean =>
    boxes.some((box) => box.id !== a && box.id !== b && crosses(points, box, LOOK.label.search)) || onLoop(points);
  // 箱の行の下 (上) の、次の行との間の真ん中。箱の下に輪が在る時は、輪と名前の下を通す (#3186)
  // 帯の最後 (最初) の行は、行の箱の枠から余白だけ離す。帯の枠との間が余白より狭ければ `grow` が帯を広げる (#3526)
  // 測るのは回る箱ではなく行で最も高い箱の端から。形を持つ箱は行を高くし (#3520)、低い箱は行の真ん中に置くので、
  // 低い箱の端から測ると、線は同じ行の高い箱の枠に余白より近く沿って走る (#3546)
  const spanOf = (id: string): { slot: Slot; span: Room } => {
    const slot = slots.get(id) as Slot;
    return { slot, span: rowSpan.get(`${slot.group}:${slot.row}`) as Room };
  };
  const laneBelow = (id: string): number => {
    const { slot, span } = spanOf(id);
    const under = span.bottom + loopRoom(slot.group, slot.row);
    return (slot.row < bandOf(id).rows - 1 ? under + A.rowGap / 2 : under + margin) + extra(`label-lane:${slot.group}:${slot.row}:below`);
  };
  const laneAbove = (id: string): number => {
    const { slot, span } = spanOf(id);
    return (slot.row > 0 ? span.top - A.rowGap / 2 : span.top - margin) - extra(`label-lane:${slot.group}:${slot.row}:above`);
  };
  const inset = LOOK.edge.inset;
  /** 列 `col` の右 (左) の、隣の列との間の真ん中。同じ列の箱は幅が違うので、箱ではなく列の端から測る (幅の広い箱の中を通さない) */
  const gapX = (col: number, toRight: boolean): number =>
    toRight ? (colLeft[col] as number) + (colW[col] as number) + (between[col] ?? A.columnGap + extra(`label:${col}`)) / 2 : (colLeft[col] as number) - (between[col - 1] ?? A.columnGap) / 2;
  const route = (from: string, to: string): Point[] => {
    const a = byId.get(from) as SceneBox;
    const b = byId.get(to) as SceneBox;
    // 同じ箱へ戻る線は、状態遷移図と同じ箱の下の輪で描く (#3186)
    if (from === to) return loopUnder(a);
    const sa = slots.get(from) as Slot;
    const sb = slots.get(to) as Slot;
    if (sa.group === sb.group && sa.row === sb.row) {
      const right = b.cx > a.cx;
      const straight: Point[] = [
        [right ? a.x + a.w : a.x, a.cy],
        [right ? b.x - inset : b.x + b.w + inset, b.cy],
      ];
      if (!blocked(straight, from, to)) return straight;
      const below = laneBelow(from);
      const under: Point[] = [
        [a.cx, a.y + a.h],
        [a.cx, below],
        [b.cx, below],
        [b.cx, b.y + b.h + inset],
      ];
      if (!onLoop(under)) return under;
      // 下を回ると輪を横切る時は、上を回る
      const above = laneAbove(from);
      const over: Point[] = [
        [a.cx, a.y],
        [a.cx, above],
        [b.cx, above],
        [b.cx, b.y - inset],
      ];
      return onLoop(over) ? under : over;
    }
    const down = b.cy > a.cy;
    const leave: Point = [a.cx, down ? a.y + a.h : a.y];
    const enter: Point = [b.cx, down ? b.y - inset : b.y + b.h + inset];
    if (sa.col === sb.col) {
      const straight: Point[] = [leave, enter];
      if (!blocked(straight, from, to)) return straight;
      const x = gapX(sa.col, true);
      return [
        [a.x + a.w, a.cy],
        [x, a.cy],
        [x, b.cy],
        [b.x + b.w + inset, b.cy],
      ];
    }
    const right = b.cx > a.cx;
    const lane = down ? laneBelow(from) : laneAbove(from);
    const candidates: Point[][] = [
      [leave, [a.cx, b.cy], [right ? b.x - inset : b.x + b.w + inset, b.cy]],
      [[right ? a.x + a.w : a.x, a.cy], [b.cx, a.cy], enter],
      [leave, [a.cx, lane], [b.cx, lane], enter],
    ];
    // 輪を持つ箱の下からは出入りしない。箱の脇から列の間へ出て、列の間を縦に走る (#3186)
    if (looped.has(from) || looped.has(to)) {
      const ax = gapX(sa.col, right);
      const bx = gapX(sb.col, !right);
      const out: Point[] = [
        [right ? a.x + a.w : a.x, a.cy],
        [ax, a.cy],
      ];
      const side: Point = [right ? b.x - inset : b.x + b.w + inset, b.cy];
      candidates.push(
        [...out, [ax, b.cy], side],
        [...out, [ax, lane], [b.cx, lane], enter],
        [leave, [a.cx, lane], [bx, lane], [bx, b.cy], side],
        [...out, [ax, lane], [bx, lane], [bx, b.cy], side],
      );
    }
    return candidates.find((points) => !blocked(points, from, to)) ?? (candidates[2] as Point[]);
  };

  const sceneEdges: SceneEdge[] = edges.map(({ step, event, edge }) => ({
    step,
    event,
    from: edge.from,
    to: edge.to,
    points: route(edge.from, edge.to),
    color: edgeColor(edge, colors),
    carry: edge.carry,
  }));
  /** 線の2つ目の区間が、出る箱の行の下か上か、列の間を回る道ならその鍵 (`Lanes` の鍵)。列の間の道は列の間の真ん中を挟んで並べる */
  const laneOf = (edge: SceneEdge): { key: string; centered: boolean } | undefined => {
    const [p0, p1] = edge.points as [Point, Point];
    const { slot } = spanOf(edge.from);
    if (Math.abs(p0[0] - p1[0]) < 0.5) {
      if (p1[1] > p0[1] && Math.abs(p1[1] - laneBelow(edge.from)) < 0.5) return { key: `${slot.group}:${slot.row}:below`, centered: false };
      if (p1[1] < p0[1] && Math.abs(p1[1] - laneAbove(edge.from)) < 0.5) return { key: `${slot.group}:${slot.row}:above`, centered: false };
      return undefined;
    }
    const right = p1[0] > p0[0];
    return Math.abs(p1[0] - gapX(slot.col, right)) < 0.5 ? { key: `col:${right ? slot.col : slot.col - 1}`, centered: true } : undefined;
  };
  // 同じ箱の同じ所から別々の箱へ出る線は、出る所と回る道を離す (#3549)
  const need = spreadFans(sceneEdges, byId, laneOf);
  // 運ぶ物は着いた箱の置き場に留まり、出る箱の置き場で走り出しを待つ (#3176)
  seatCarriers(sceneEdges, byId, carriedIn);
  // 同じ2つの箱を行きと帰りで結ぶ線は、崩れの検査の下限より広く左右に離す。名前はずらした側に置く (#3175、#3521)
  const outward = pullApart(sceneEdges);

  const regions: SceneRegion[] = [];
  groups.forEach((group, g) => {
    const band = bands[g] as (typeof bands)[number];
    const header = headers[g];
    if (!group.region || !header) return;
    regions.push({
      id: group.region.id,
      lines: header.lines,
      ...(group.region.note !== undefined ? { note: group.region.note } : {}),
      ...(group.region.icon !== undefined ? { icon: group.region.icon } : {}),
      color: regionColor.get(group.region.id) ?? "slate",
      x: margin,
      y: band.y,
      w: 0,
      h: band.h,
      header: { x: margin + R.inset, y: band.y + R.inset, w: header.w, h: header.h },
    });
  });

  // 線の名前は、同じ時刻に見えている段の番号 (その段とそれより前の段の番号) も避ける (#3175)
  // 輪の番号は弧に重ねず弧の右に置く (#3186)。線の番号は区画の枠線を避ける (#3525)
  const frames = frameLines(regions);
  const badgeAt = (edge: SceneEdge, taken: Point[], lines: Point[][]): Point => (edge.from === edge.to ? loopBadge(edge.points) : badgeOnPath(edge.points, taken, lines, frames));
  const early = lineBadges(sceneEdges, diagram.steps.length, badgeAt);
  /**
   * 縦の線 `edge` の脇に名前を置く間を空ける (#3552)。`x` は線の縦の区間が通る所、`span` はその区間の両端の高さ、`w` は名前の札の幅。
   * 名前と別の線の間は、名前と自分の線の間 (`LOOK.label.side`) より狭くしない。狭いと、名前が 2 本の線のどちらの名前か読めない。
   *
   * 列の外を縦に走る別の線が名前の側で近い時は、近い分の 2 倍を名前の側の列の間に足し、名前と別の線の間を名前と自分の線の間の 2 倍にする。
   * 列の間の真ん中を回る線は広げた分の半分しか動かないので 2 倍にする。列の中を走る線 (並べた線や帰りの線) は列の間を広げても動かないので数えない。
   * 一番左の列の左は広げない。
   * 行の間を横に回る線が名前の幅の所を通る時は、その線から名前と自分の線の間の 2 倍下に名前が入るだけ、線が結ぶ 2 つの行の間を広げる。
   * 2 つの行は同じ帯の続く行か、続く2つの帯の上の帯の最後の行と下の帯の最初の行で、帯の間は上の帯を下へ延ばして広げる。
   * 行の下を回る道は上の行から測って置くので、下の行を下げれば道と下の行の間が空く。
   * 名前を置く所は線に沿って `LOOK.label.search` ずつずらして探すので、置ける所の幅が 0 だと探す所が当たらない。ずらす 1 回分を足しておく
   */
  const roomBeside = (edge: SceneEdge, x: number, span: [number, number], w: number, right: boolean, lines: Point[][]): void => {
    const { side, h } = LOOK.label;
    const [y0, y1] = [Math.min(...span), Math.max(...span)];
    const segments = lines.flatMap((line) => line.slice(1).map((q, k): [Point, Point] => [line[k] as Point, q]));
    const col = colLeft.findIndex((left, c) => x >= left && x <= left + (colW[c] as number));
    const at = right ? col : col - 1;
    if (col >= 0 && at >= 0) {
      const edgeX = right ? (colLeft[col] as number) + (colW[col] as number) : (colLeft[col] as number);
      let short = 0;
      for (const [p, q] of segments) {
        if (Math.abs(p[0] - q[0]) > 0.5 || (right ? p[0] <= edgeX : p[0] >= edgeX)) continue;
        if (Math.min(Math.max(p[1], q[1]), y1) - Math.max(Math.min(p[1], q[1]), y0) <= 0) continue;
        short = Math.max(short, right ? x + w + side * 3 - p[0] : p[0] - (x - w - side * 3));
      }
      const key = `label:${at}`;
      if (short > 0) need.set(key, Math.max(need.get(key) ?? 0, extra(key) + 2 * Math.ceil(short)));
    }
    // 線が結ぶ上の箱と下の箱。同じ帯の続く行か、続く帯の最後の行と最初の行を結ぶ線だけを見る
    const [m, n] = [slots.get(edge.from), slots.get(edge.to)];
    if (!m || !n || m.col !== n.col) return;
    const topOf = (slot: Slot): number => (rowSpan.get(`${slot.group}:${slot.row}`) as Room).top;
    const [upper, lower] = topOf(m) <= topOf(n) ? [m, n] : [n, m];
    const next = upper.group === lower.group ? upper.row + 1 === lower.row : upper.group + 1 === lower.group && upper.row === (bands[upper.group]?.rows ?? 0) - 1 && lower.row === 0;
    if (!next) return;
    const [lx0, lx1] = right ? [x + side, x + side + w] : [x - side - w, x - side];
    let lowest = Number.NEGATIVE_INFINITY;
    for (const [p, q] of segments) {
      if (Math.abs(p[1] - q[1]) > 0.5 || p[1] <= y0 || p[1] >= y1) continue;
      if (Math.min(Math.max(p[0], q[0]), lx1) - Math.max(Math.min(p[0], q[0]), lx0) <= 0) continue;
      lowest = Math.max(lowest, p[1]);
    }
    const short = lowest + side * 2 + h + LOOK.gap + LOOK.label.search - topOf(lower);
    const key = `label-row:${upper.group}:${upper.row}`;
    if (short > 0) need.set(key, Math.max(need.get(key) ?? 0, extra(key) + Math.ceil(short)));
  };
  /**
   * 同じ行の2つの箱をまっすぐ結ぶ横の線 `edge` の脇に名前を置く間を空ける (#3552)。`toward` は名前を置く側、`w` は名前の札の幅。
   * 名前の側の、行の下か上を回る道が、名前と自分の線の間の 2 倍より名前に近い時は、その道を行から離す。
   * 行の下か上を回る道は、行の間の真ん中か帯の縁から測って置くので、名前の側の道だけを動かせる
   */
  const roomAlong = (edge: SceneEdge, toward: "above" | "below", lines: Point[][]): void => {
    const slot = slots.get(edge.from);
    const [a, b] = edge.points as [Point, Point];
    if (!slot || edge.points.length !== 2 || Math.abs(a[1] - b[1]) > 0.5) return;
    const span = rowSpan.get(`${slot.group}:${slot.row}`) as Room;
    const gap = LOOK.label.offset - LOOK.label.h / 2;
    // 名前の札の外の縁から、名前と自分の線の間の 2 倍離す
    const reach = gap * 3 + LOOK.label.h;
    const [x0, x1] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
    let short = 0;
    for (const line of lines)
      for (let k = 1; k < line.length; k++) {
        const [p, q] = [line[k - 1] as Point, line[k] as Point];
        if (Math.abs(p[1] - q[1]) > 0.5 || Math.min(Math.max(p[0], q[0]), x1) - Math.max(Math.min(p[0], q[0]), x0) <= 0) continue;
        if (toward === "below" ? p[1] <= span.bottom : p[1] >= span.top) continue;
        short = Math.max(short, toward === "below" ? a[1] + reach - p[1] : p[1] - (a[1] - reach));
      }
    const key = `label-lane:${slot.group}:${slot.row}:${toward}`;
    if (short > 0) need.set(key, Math.max(need.get(key) ?? 0, extra(key) + Math.ceil(short)));
  };
  /** 囲みの枠線の横の線の真ん中の高さと、その線を持つ帯と、線が帯の下の縁か (#3554)。枠線は帯の四角を 0.5px 内へ縮めて太さ 1px で描く */
  const borderLines = bands.flatMap((band, g) =>
    groups[g]?.region
      ? [
          { y: band.y + 0.5, band: g, bottom: false },
          { y: band.y + band.h - 0.5, band: g, bottom: true },
        ]
      : [],
  );
  /** 線が1つの囲みの中で2つの箱を結ぶか。その線の名前は、`grow` が囲みの中に収める */
  const inRegion = (edge: SceneEdge): boolean => {
    const [m, n] = [slots.get(edge.from), slots.get(edge.to)];
    return m !== undefined && n !== undefined && m.group === n.group && groups[m.group]?.region !== undefined;
  };
  /**
   * 帯 `k` と帯 `k + 1` の間を通る線の名前 `label` が、囲みの枠線をまたがずに収まるだけ、2つの帯の間を広げる (#3554)。
   * 名前の上の限りは、上の帯が囲みなら枠線 (帯の下の縁から 1px の太さ) から `LOOK.label.soft` 下、囲みでなければ名前と横に重なる上の帯の箱から `LOOK.gap` 下にする。
   * 下の限りも同じに、下の帯の枠線か箱から決める。札を置く処理が囲みの枠線と箱から離す間と同じ。
   * 2つの帯の間を広げると下の帯が下がり、下の限りだけが下がる。足りない分に、名前を探す所をずらす 1 回分を足して広げる
   */
  const roomAcross = (label: Rect, k: number): void => {
    const [upper, lower] = [bands[k], bands[k + 1]];
    if (!upper || !lower) return;
    const { soft, search, h } = LOOK.label;
    const beneath = (box: SceneBox, g: number): boolean => slots.get(box.id)?.group === g && box.x < label.x + label.w + gap && box.x + box.w > label.x - gap;
    const lows = boxes.filter((box) => beneath(box, k)).map((box) => box.y + box.h + gap);
    const highs = boxes.filter((box) => beneath(box, k + 1)).map((box) => box.y - gap);
    const top = groups[k]?.region ? upper.y + upper.h + soft : lows.length > 0 ? Math.max(...lows) : upper.y + upper.h;
    const bottom = groups[k + 1]?.region ? lower.y - soft : highs.length > 0 ? Math.min(...highs) : lower.y;
    const short = h + search - (bottom - top);
    const key = `label-gap:${k}`;
    if (short > 0) need.set(key, Math.max(need.get(key) ?? 0, extra(key) + Math.ceil(short)));
  };
  const labels: SceneLabel[] = [];
  // 線の名前は別の線に乗せず、自分の線より別の線の近くにも置かない。乗るか近い名前は、その線の名前に読める (#3552)。
  // 後の段の線も初めから点線の道で見えているので、全ての段の線を避ける。同じ道をもう一度引いた線は自分の線なので避けない。
  // 中ほどの脇が空かない時は、一番長い区間の端までずらして空きを探し、自分の線の脇に留める
  const keys = new Map(sceneEdges.map((e) => [e, lineKey(e)]));
  for (const edge of sceneEdges) {
    const source = diagram.steps[edge.step]?.events[edge.event];
    if (source?.type !== "edge" || source.label === undefined) continue;
    const seen = [...early].filter(([s]) => s <= edge.step).map(([, b]) => badgeRect(b.point));
    const lines = sceneEdges.filter((o) => keys.get(o) !== keys.get(edge)).map((o) => o.points);
    const soft: Rect[] = [...regions.map((r) => r.header), ...labels.filter((l) => l.step === edge.step)];
    // 指示の無い線の名前は、空いていなければ反対の側も探す。ずらした線は自分の側だけを探す
    const side = source.labelSide ?? outward.get(edge);
    const w = textWidth(source.label, labelStyle(source.label)) + LOOK.label.padX * 2;
    // 輪の名前は輪の下から探す (#3186)
    const below = edge.from === edge.to ? { side: "below" as const, base: loopLabelBase(edge.points, w) } : undefined;
    const { a, b, vertical } = longest(edge.points);
    const slide = vertical ? Math.max(LOOK.label.h * 4, (Math.abs(b[1] - a[1]) - LOOK.label.h) / 2) : Math.max(w, (Math.abs(b[0] - a[0]) - w) / 2);
    // 1つの囲みの中で結ぶ線でない線の名前は、囲みの枠線をまたがせない。枠線が札に刺さると字と重なる (#3554)
    const fenced = !inRegion(edge);
    const label = placeLabel(
      { step: edge.step, event: edge.event, text: source.label, points: edge.points, color: edge.color, ...(below ?? { slide, ...(side ? { side } : { flip: true }) }) },
      { hard: boxes, soft, touch: seen, lines, nearest: true, ...(fenced ? { frames: borderLines.map((l) => l.y) } : {}) },
    );
    labels.push(label);
    // 枠線から離せる所が脇に無かった名前は、枠線を持つ帯と隣の帯の間を広げて置き直す。離れは札を置く処理と同じく、枠線の太さの半分を足して測る
    const clearance = LOOK.label.soft + 0.5;
    if (fenced)
      for (const line of borderLines) {
        if (label.y - line.y >= clearance || line.y - (label.y + label.h) >= clearance) continue;
        roomAcross(label, line.bottom ? line.band : line.band - 1);
      }
    // 名前の脇に自分の線より近い線が残る時は、縦の線なら列か行の間を、横の線なら行を回る道との間を広げて置き直す
    const toward = side ?? (vertical ? "right" : "above");
    if (!below && !nearestLine(label, edge.points, lines)) {
      if (vertical && (toward === "left" || toward === "right")) roomBeside(edge, a[0], [a[1], b[1]], w, toward === "right", lines);
      if (!vertical && (toward === "above" || toward === "below")) roomAlong(edge, toward, lines);
    }
  }

  const layout: Layout = { kind: "architecture", width: 0, height: 0, regions, boxes, lifelines: [], edges: sceneEdges, labels, actions: [], badges: [], paths: [], ends: [] };
  // 名前が左へ出たら、帯の中身を右へ寄せる。帯は図の幅いっぱいに引き直す
  const shift = labels.length > 0 ? Math.max(0, margin + LOOK.label.soft - Math.min(...labels.map((l) => l.x))) : 0;
  if (shift > 0) shiftContent(layout, shift, 0);
  const contentRight = Math.max(...boxes.map((b) => b.x + b.w + R.pad), ...labels.map((l) => l.x + l.w + LOOK.label.soft), ...sceneEdges.flatMap((e) => e.points.map((p) => p[0] + R.pad)));
  const width = Math.max(contentRight + margin, stripNeed(diagram) + margin * 2);
  for (const region of regions) region.w = width - margin * 2;
  // 箱の下を回る線の名前は帯の下へ出ることがあるので、名前の下端まで図に入れる (#3176)
  const contentBottom = Math.max(bandsBottom, ...labels.map((l) => l.y + l.h));
  const strip = layoutStrip(diagram, margin, contentBottom + gap, width - margin * 2);
  layout.width = width;
  layout.height = (strip ? strip.y + strip.h : contentBottom) + margin;
  if (strip) layout.strip = strip;
  const lines = lineBadges(sceneEdges, diagram.steps.length, badgeAt);
  // 同じ線を通る段の番号は後の段が始まると入れ替え (#3184)、同じ箱の角に来た番号は前の番号の脇に並べる (#3525)
  const lineOf = (step: number): string | undefined => {
    const line = lines.get(step);
    return line ? lineKey(line.edge) : undefined;
  };
  layout.badges = besideSameSpot(
    diagram.steps.map((step, s) => {
      const line = lines.get(s);
      if (!line) return cornerBadge(step.events, s, layout);
      return { step: s, x: line.point[0], y: line.point[1], color: line.edge.color };
    }),
    badgeBlocked(layout),
    (before, after) => lineOf(before.step) !== undefined && lineOf(before.step) === lineOf(after.step),
  );
  return { layout, need };
}

/**
 * 並んだ線の真ん中どうしの間。崩れの検査が並んだ線に求める間 (`APART.line`) に光った線の太さを足し、行きと帰りの線 (`pullApart`) と同じ間にする。
 * 光った線の縁どうしの間も、検査の下限を下回らない
 */
const FAN = APART.line + LOOK.stroke.edgeOn;

/**
 * 同じ箱の同じ所から別々の箱へ出る線を、出る所と回る道で離す (#3549)。返す表は、回る道を並べるのに要る間。
 *
 * 出る所は箱の辺に沿って `FAN` ずつ離す。辺の角の丸みを除いた長さに収まらない時は、線の縁どうしの間が検査の下限を下回らない所まで詰めて角の丸みからも出し、
 * 辺の長さにも収まらない時だけ、辺の長さに収まるまで詰める。
 * 並べる順は、出た後に曲がる向きと、曲がった後の道の遠さで決める。辺に沿って負の向きへ曲がる線を負の側に、正の向きへ曲がる線を正の側に、
 * 曲がらない線をその間に置き、どちらの側も遠い道を通る線ほど真ん中に寄せる。遠い道を通る線が先に曲がる線の道を横切らないため。
 * 出る線と同じ所へ入る線も、箱から逆に辿った道で同じように並べる (#3552)。
 * 行の下か上か列の間を回る道は、出る箱によらず同じ道を通る線どうしで `stackLanes` が並べる (#3552)。
 * 帰りの線を持つ線は、帰りの線も同じだけ動かす。2本は後で `pullApart` が離すので、2本分の場所を取る。
 * 同じ線を別の段でもう一度引いた線は同じ道なので、一緒に動かす
 */
function spreadFans(edges: SceneEdge[], byId: Map<string, SceneBox>, laneOf: (edge: SceneEdge) => { key: string; centered: boolean } | undefined): Lanes {
  const need: Lanes = new Map();
  // 出る箱と出る所と出る向きが同じ線を、道ごとにまとめる
  const fans = new Map<string, Port[]>();
  const spotKey = (box: string, [x, y]: Point, [dx, dy]: Point): string => `${box} ${Math.round(x * 10)},${Math.round(y * 10)} ${Math.sign(Math.round(dx))},${Math.sign(Math.round(dy))}`;
  for (const edge of edges) {
    const [p0, p1] = edge.points;
    if (edge.from === edge.to || !p0 || !p1) continue;
    const key = spotKey(edge.from, p0, [p1[0] - p0[0], p1[1] - p0[1]]);
    const fan = fans.get(key) ?? [];
    const same = fan.find((g) => lineKey(g.lines[0] as SceneEdge) === lineKey(edge));
    if (same) same.lines.push(edge);
    else fan.push({ lines: [edge], incoming: false });
    fans.set(key, fan);
  }
  // 出る線と同じ所へ入る線も並べる。並べないと、入る線と出る線が箱の同じ所で重なって走る (#3552)。
  // 入る線の終わりは箱から `LOOK.edge.inset` だけ離すので、その分を戻した所で比べる。出る線の帰りの線は出る線と一緒に動くので足さない
  for (const edge of edges) {
    const n = edge.points.length;
    const [end, before] = [edge.points[n - 1], edge.points[n - 2]];
    if (edge.from === edge.to || !end || !before) continue;
    const length = Math.hypot(end[0] - before[0], end[1] - before[1]);
    if (length === 0) continue;
    const inset = LOOK.edge.inset / length;
    const at: Point = [end[0] + (end[0] - before[0]) * inset, end[1] + (end[1] - before[1]) * inset];
    const fan = fans.get(spotKey(edge.to, at, [before[0] - end[0], before[1] - end[1]]));
    if (!fan || fan.some((g) => !g.incoming && g.lines.some((line) => backOf(line, edge)))) continue;
    const same = fan.find((g) => g.incoming && lineKey(g.lines[0] as SceneEdge) === lineKey(edge));
    if (same) same.lines.push(edge);
    else fan.push({ lines: [edge], incoming: true });
  }
  // 回る道は、出る箱によらず同じ道を通る線どうしで並べる (#3552)
  const fanned = new Set([...fans.values()].filter((fan) => fan.length >= 2).flatMap((fan) => fan.flatMap((g) => g.lines)));
  const riders = ridersOf(edges, laneOf, fanned);
  stackLanes(riders, need);
  const laneShift = new Map(riders.flatMap((r) => [...r.lines, ...r.backs].map((e): [SceneEdge, number] => [e, r.out * r.shift])));
  // 線の始まりと終わりは、それぞれの箱で1度だけ動かす。真っすぐな線は2つの点しか持たず、両端を動かすと線ごと2度動くので、1度だけ動かす
  const movedStart = new Set<SceneEdge>();
  const movedEnd = new Set<SceneEdge>();
  const move = (line: SceneEdge, atEnd: boolean, delta: (i: number) => Point): void => {
    const [mine, other] = atEnd ? [movedEnd, movedStart] : [movedStart, movedEnd];
    const n = line.points.length;
    if (mine.has(line) || (n < 3 && other.has(line))) return;
    mine.add(line);
    line.points = line.points.map(([x, y], i) => {
      const [dx, dy] = delta(atEnd ? n - 1 - i : i);
      return [x + dx, y + dy];
    });
  };
  for (const fan of fans.values()) {
    if (fan.length < 2) continue;
    const first = fan.find((g) => !g.incoming)?.lines[0] as SceneEdge;
    const box = byId.get(first.from);
    if (!box) continue;
    const [p0, p1] = first.points as [Point, Point];
    // `u` は出る所を並べる辺に沿う向き、`o` は箱から出ていく向き。下か上の辺から出る線は x に、左か右の辺から出る線は y に並べる
    const u: 0 | 1 = Math.abs(p0[0] - p1[0]) < 0.5 ? 0 : 1;
    const o: 0 | 1 = u === 0 ? 1 : 0;
    const out = Math.sign(p1[o] - p0[o]);
    const members = fan.map(({ lines, incoming }) => {
      // 入る線は、箱から逆に辿った道で並べる
      const points = incoming ? [...(lines[0] as SceneEdge).points].reverse() : (lines[0] as SceneEdge).points;
      const [a, b, c] = points as [Point, Point, Point | undefined];
      const step = c ? c[u] - b[u] : 0;
      const backs = incoming ? [] : edges.filter((e) => lines.some((line) => backOf(line, e)));
      return {
        lines,
        incoming,
        backs,
        turn: Math.abs(step) < 0.5 ? 0 : Math.sign(step),
        reach: Math.abs(step),
        depth: Math.abs(b[o] - a[o]),
        width: backs.length > 0 ? 2 : 1,
        // 回る道を道の内から外へずらした量。道に並べた順で決まる
        shift: out * (laneShift.get(lines[0] as SceneEdge) ?? 0),
      };
    });
    // 出る所。負の向きへ曲がる線、曲がらない線、正の向きへ曲がる線の順に、辺に沿って並べる
    const far = (m: (typeof members)[number]): number => m.depth + m.shift;
    const order = [
      ...members.filter((m) => m.turn < 0).sort((a, b) => far(a) - far(b) || a.reach - b.reach),
      ...members.filter((m) => m.turn === 0).sort((a, b) => far(a) - far(b)),
      ...members.filter((m) => m.turn > 0).sort((a, b) => far(b) - far(a) || b.reach - a.reach),
    ];
    const total = order.reduce((sum, m) => sum + m.width, 0);
    // 辺の角の丸みを除いた長さに収まらない時は、線の縁どうしの間が検査の下限を下回らない所まで詰め、角の丸みにも掛けて出す。
    // それでも辺に収まらない時だけ、辺の長さに収まるまで詰める
    const { radius } = LOOK.box;
    const length = u === 0 ? box.w : box.h;
    const gaps = Math.max(1, total - 1);
    const pitch = Math.min(FAN, Math.max(length - radius * 2, Math.min(gaps * (APART.line + LOOK.stroke.edge), length)) / gaps);
    let taken = 0;
    for (const m of order) {
      const along = (taken + m.width / 2 - total / 2) * pitch;
      taken += m.width;
      // 角の丸みに掛けて出す線は、丸みの縁から出るよう始まりを箱へ寄せる
      const corner = Math.max(0, Math.abs(along) - (length / 2 - radius));
      const sink = radius - Math.sqrt(Math.max(0, radius * radius - corner * corner));
      const delta = (i: number): Point => {
        const d: Point = [0, 0];
        if (i <= 1) d[u] += along;
        if (i === 0) d[o] -= out * sink;
        return d;
      };
      for (const line of m.lines) move(line, m.incoming, delta);
      for (const back of m.backs) move(back, true, delta);
    }
  }
  // 回る道。線は2つ目の区間を、帰りの線は後ろから2つ目の区間をずらす
  for (const r of riders) {
    if (r.shift === 0) continue;
    const shifted = (points: Point[], at: (i: number) => number): Point[] =>
      points.map((p, i): Point => {
        const k = at(i);
        if (k !== 1 && k !== 2) return p;
        const q: Point = [p[0], p[1]];
        q[r.axis] += r.out * r.shift;
        return q;
      });
    for (const line of r.lines) line.points = shifted(line.points, (i) => i);
    for (const back of r.backs) back.points = shifted(back.points, (i) => back.points.length - 1 - i);
  }
  return need;
}

/** 箱の同じ所から出る線か入る線の組。同じ道にもう一度引いた線を含む。`incoming` が真なら、その所へ入る線 (#3552) */
interface Port {
  lines: SceneEdge[];
  incoming: boolean;
}

/**
 * 回る道を通る線の組 (#3552)。同じ道にもう一度引いた線と帰りの線を1つにまとめる。
 * 帰りの線を持つ組は後で `pullApart` が2本に離すので、道の中で2本分の場所を取る
 */
interface Rider {
  /** 同じ道にもう一度引いた線を含む線 */
  lines: SceneEdge[];
  backs: SceneEdge[];
  width: number;
  lane: { key: string; centered: boolean };
  /** 道を並べる向き (0 は x、1 は y) と、その向きで道の内から外へ進む符号。列の間の道は x の正の向きを外とする */
  axis: 0 | 1;
  out: number;
  /** 道に沿った区間の両端 */
  lo: number;
  hi: number;
  /**
   * 道の両端で線が道を離れる所。`side` が負なら道の内の側へ、正なら外の側へ離れる。
   * `start` は線を出す箱の側の端で、段の番号の丸が乗る。帰りの線を持つ組は両端とも線を出す箱の側になる
   */
  legs: { at: number; side: number; start: boolean }[];
  to: string;
  /** 同じ箱の同じ所から別々の箱へ出る線の組 (#3549) に入るか */
  fanned: boolean;
  /** 道の内から外へずらす量 */
  shift: number;
}

/** 2つ目の区間で行の下か上か列の間を回る線を、組ごとにまとめる。並べ方は辿る前の点の並びで決める */
function ridersOf(edges: SceneEdge[], laneOf: (edge: SceneEdge) => { key: string; centered: boolean } | undefined, fanned: Set<SceneEdge>): Rider[] {
  const riders: Rider[] = [];
  const taken = new Set<SceneEdge>();
  for (const edge of edges) {
    if (taken.has(edge) || edge.from === edge.to || edge.points.length < 4) continue;
    const lane = laneOf(edge);
    if (!lane) continue;
    const lines = edges.filter((e) => !taken.has(e) && lineKey(e) === lineKey(edge));
    const backs = edges.filter((e) => !taken.has(e) && !lines.includes(e) && lines.some((line) => backOf(line, e)));
    for (const e of [...lines, ...backs]) taken.add(e);
    const [p0, p1, p2, p3] = edge.points as [Point, Point, Point, Point];
    const axis: 0 | 1 = Math.abs(p1[1] - p2[1]) < 0.5 ? 1 : 0;
    const run: 0 | 1 = axis === 0 ? 1 : 0;
    const out = lane.centered ? 1 : Math.sign(p1[axis] - p0[axis]);
    const side = (end: Point, at: Point): number => Math.sign(end[axis] - at[axis]) * out;
    riders.push({
      lines,
      backs,
      width: backs.length > 0 ? 2 : 1,
      lane,
      axis,
      out,
      lo: Math.min(p1[run], p2[run]),
      hi: Math.max(p1[run], p2[run]),
      legs: [
        { at: p1[run], side: side(p0, p1), start: true },
        { at: p2[run], side: side(p3, p2), start: backs.length > 0 },
      ],
      to: edge.to,
      fanned: lines.some((line) => fanned.has(line)),
      shift: 0,
    });
  }
  return riders;
}

/**
 * 同じ道で区間の重なる2つの組か。同じ箱へ入る線どうしは、入る前に合わさって同じ道を走ってよい。
 * どちらの線も同じ箱へ向かうと読めるので、崩れの検査も数えない
 */
const clash = (a: Rider, b: Rider): boolean => Math.min(a.hi, b.hi) - Math.max(a.lo, b.lo) > 0.5 && !(a.width === 1 && b.width === 1 && a.to === b.to);

/**
 * 組 `inner` を内に、`outer` を外に並べた時に、線が相手の道を横切る所。
 * 外の線が内の側へ離れる所は内の道の区間の中にあれば内の道を横切り、内の線が外の側へ離れる所は外の道の区間の中にあれば外の道を横切る
 */
function crossings(inner: Rider, outer: Rider): Rider["legs"] {
  const within = (at: number, r: Rider): boolean => at > r.lo + 0.5 && at < r.hi - 0.5;
  return [...outer.legs.filter((l) => l.side < 0 && within(l.at, inner)), ...inner.legs.filter((l) => l.side > 0 && within(l.at, outer))];
}

/** 内から並べる順で、区間の重なる組を重ならない段に積む。返す値は組ごとの段 (内から数える) */
function tracksOf(order: Rider[]): Map<Rider, number> {
  const track = new Map<Rider, number>();
  order.forEach((r, k) => {
    track.set(r, Math.max(0, ...order.slice(0, k).filter((o) => clash(o, r)).map((o) => (track.get(o) ?? 0) + o.width)));
  });
  return track;
}

/** 並べる順を全て試す組の数の上限。7つ以上の組は、先に引いた線を内にする順で並べる */
const TRY_ALL = 6;

/**
 * 区間の重なる組を内から並べる順。線が相手の道を横切る数の少ない順を選ぶ。
 * 同じなら、線を出す箱の側で横切る数の少ない順を選ぶ。そこには段の番号の丸が乗り、丸が相手の線に重なるため。
 * それも同じなら段の数の少ない順、それも同じなら先に引いた線を内にする順に近い順を選ぶ
 */
function bestOrder(part: Rider[]): Rider[] {
  if (part.length > TRY_ALL) return part;
  const rank = new Map(part.map((r, i) => [r, i]));
  const score = (order: Rider[]): number[] => {
    let crossed = 0;
    let atStart = 0;
    let swapped = 0;
    order.forEach((a, i) => {
      for (const b of order.slice(i + 1)) {
        const legs = clash(a, b) ? crossings(a, b) : [];
        crossed += legs.length;
        atStart += legs.filter((l) => l.start).length;
        if ((rank.get(a) ?? 0) > (rank.get(b) ?? 0)) swapped += 1;
      }
    });
    const track = tracksOf(order);
    return [crossed, atStart, Math.max(...order.map((r) => (track.get(r) ?? 0) + r.width)), swapped];
  };
  const better = (a: number[], b: number[]): boolean => {
    for (let i = 0; i < a.length; i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) < (b[i] ?? 0);
    return false;
  };
  let best = part;
  let bestScore = score(part);
  const visit = (head: Rider[], rest: Rider[]): void => {
    if (rest.length === 0) {
      const s = score(head);
      if (better(s, bestScore)) [best, bestScore] = [head, s];
      return;
    }
    rest.forEach((r, i) => visit([...head, r], [...rest.slice(0, i), ...rest.slice(i + 1)]));
  };
  visit([], part);
  return best;
}

/**
 * 同じ道を通る組を、区間が重なる組どうしで `FAN` ずつ離した段に積み、ずらす量と道を並べるのに要る間を決める (#3552)。
 * 区間が重ならない組は同じ段を通り、どの組とも重ならない組は動かさない。
 * ただし同じ箱の同じ所から出る線の組 (#3549) の帰りの線を持つ組は、2本の内の1本を道の位置に合わせる。
 * 行の間の道は、上の行から下りる線と下の行から上る線が同じ高さを通るので、2つの線の区間が重なれば、`FAN` だけ離す間を足す
 */
function stackLanes(riders: Rider[], need: Lanes): void {
  const byKey = new Map<string, Rider[]>();
  for (const r of riders) byKey.set(r.lane.key, [...(byKey.get(r.lane.key) ?? []), r]);
  for (const [key, list] of byKey) {
    const seen = new Set<Rider>();
    for (const start of list) {
      if (seen.has(start)) continue;
      // 区間の重なりで繋がる組を、元の順のまま集める
      const part: Rider[] = [];
      const queue = [start];
      seen.add(start);
      while (queue.length > 0) {
        const r = queue.shift() as Rider;
        part.push(r);
        for (const o of list) {
          if (seen.has(o) || !clash(r, o)) continue;
          seen.add(o);
          queue.push(o);
        }
      }
      part.sort((a, b) => list.indexOf(a) - list.indexOf(b));
      let span = 0;
      if (part.length === 1) {
        const [r] = part as [Rider];
        // 帰りの線を持つ組は後で `pullApart` が2本に離すので、2本の真ん中を半分外へ置き、内の1本を道の位置に合わせる
        if (r.fanned) [r.shift, span] = [((r.width - 1) / 2) * FAN, (r.width - 1) * FAN];
      } else {
        const order = bestOrder(part);
        const track = tracksOf(order);
        for (const r of order) {
          const t = track.get(r) ?? 0;
          r.shift = (t + (r.width - 1) / 2) * FAN;
          span = Math.max(span, (t + r.width - 1) * FAN);
        }
      }
      if (span === 0) continue;
      if (start.lane.centered) for (const r of part) r.shift -= span / 2;
      need.set(key, Math.max(need.get(key) ?? 0, span));
    }
  }
  for (const [key, list] of byKey) {
    // 行の下の道と、次の行の上の道は、行の間の同じ所を通る
    const [g, row, end] = key.split(":");
    const next = end === "below" ? byKey.get(`${g}:${Number(row) + 1}:above`) : undefined;
    if (next?.some((b) => list.some((a) => clash(a, b)))) need.set(key, (need.get(key) ?? 0) + FAN);
  }
}

/**
 * 区画の中を結ぶ線の名前が帯の外へ出ていたら、その分だけ帯の上か下を広げる。
 * 帯の中を横に走る線が帯の上か下の枠に余白 (`LOOK.margin`) より近い時も、余白が空くまで広げる (#3526)。広げたら true。
 */
function grow(layout: Layout, groups: Group[], slots: Map<string, Slot>, rooms: Room[]): boolean {
  let grown = false;
  const { margin } = LOOK;
  groups.forEach((group, g) => {
    const region = layout.regions.find((r) => r.id === group.region?.id);
    const room = rooms[g];
    if (!region || !room) return;
    let [top, bottom] = [0, 0];
    for (const edge of layout.edges)
      edge.points.slice(1).forEach(([x, y], k) => {
        const [px, py] = edge.points[k] as Point;
        // 番号の丸 2 つ分より長く横に走る所だけを見る。輪の弧の短い区間は輪の分を空けた行の下に収まる
        if (py !== y || Math.abs(x - px) <= LOOK.badge.r * 2 || y < region.y || y > region.y + region.h) return;
        top = Math.max(top, margin - (y - region.y));
        bottom = Math.max(bottom, margin - (region.y + region.h - y));
      });
    // 広げた後の足し引きの丸めの誤差 (1px の 100 分の 1 未満) では広げ直さない
    if (top > 0.01) room.top += top;
    if (bottom > 0.01) room.bottom += bottom;
    if (top > 0.01 || bottom > 0.01) grown = true;
  });
  const soft = LOOK.label.soft;
  for (const label of layout.labels) {
    const edge = layout.edges.find((e) => e.step === label.step && e.event === label.event);
    const a = edge && slots.get(edge.from);
    const b = edge && slots.get(edge.to);
    if (!a || !b) continue;
    if (a.group !== b.group || !groups[a.group]?.region) {
      // 囲みの中で結ぶ線でない名前が図の上の余白より上へ出たら、一番上の帯の上を広げて図の枠の内に収める (#3554)。
      // 行の上を回る道は行から余白だけ離して通すので、道の上に置く名前は図の枠の上へ出る
      const above = margin - label.y;
      const first = rooms[0];
      if (above > 0.01 && first) {
        first.top += above;
        grown = true;
      }
      continue;
    }
    const region = layout.regions.find((r) => r.id === groups[a.group]?.region?.id);
    const room = rooms[a.group];
    if (!region || !room) continue;
    const over = region.y + soft - label.y;
    const under = label.y + label.h - (region.y + region.h - soft);
    if (over > 0) {
      room.top += over;
      grown = true;
    }
    if (under > 0) {
      room.bottom += under;
      grown = true;
    }
  }
  return grown;
}
