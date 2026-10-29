/**
 * 構成図の置き場所。
 *
 * 区画を上から帯に積み、帯の左に区画の名前を置く。箱は全ての帯で共通の列に並べるので、
 * 区画をまたぐ線は縦にまっすぐ走る。箱の並びは線を辿って決める。前の区画の箱から線が来る箱を
 * その箱の列に置き、そこから線で繋がる箱を隣の列へ (寄せの指示が左か右なら下の行へ) 置いていく。
 * 線は縦と横の折れ線で、間にある箱を避ける。名前が箱に掛かる時は帯を広げて名前の場所を空ける。
 */
import { LOOK, TYPE } from "../look/values";
import type { Diagram, LabelSide, Region } from "../schema";
import { textWidth } from "./measure";
import {
  badgeRect,
  boxColors,
  boxWidth,
  cornerBadge,
  edgeColor,
  edgesOf,
  labelStyle,
  type Layout,
  lineBadges,
  replaceSameSpot,
  layoutStrip,
  type Point,
  placeLabel,
  placeSlot,
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
} from "./scene";

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

export function layoutArchitecture(diagram: Diagram): Layout {
  const groups = groupsOf(diagram);
  const slots = placeBoxes(diagram, groups);
  const rooms = groups.map(() => ({ top: 0, bottom: 0 }));
  let layout = arrange(diagram, groups, slots, rooms);
  // 名前を置く場所が帯の外へ出たら、その帯を広げて置き直す
  for (let pass = 0; pass < 3 && grow(layout, groups, slots, rooms); pass++) layout = arrange(diagram, groups, slots, rooms);
  return layout;
}

function groupsOf(diagram: Diagram): Group[] {
  const regions = diagram.regions ?? [];
  const known = new Set(regions.map((r) => r.id));
  const groups: Group[] = regions.map((region) => ({ region, members: diagram.boxes.filter((b) => b.region === region.id).map((b) => b.id) }));
  const loose = diagram.boxes.filter((b) => b.region === undefined || !known.has(b.region)).map((b) => b.id);
  if (loose.length > 0) groups.push({ members: loose });
  return groups;
}

const vertical = (side: LabelSide | undefined): boolean => side === "left" || side === "right";

/** 箱を列と行へ置く。列は全ての区画で共通。 */
function placeBoxes(diagram: Diagram, groups: Group[]): Map<string, Slot> {
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

function arrange(diagram: Diagram, groups: Group[], slots: Map<string, Slot>, rooms: Room[]): Layout {
  const { box: B, region: R, architecture: A, margin, gap } = LOOK;
  const colors = boxColors(diagram);
  const regionColor = regionColors(diagram);
  const edges = edgesOf(diagram);

  // 列の幅と列の間。隣の列を横に結ぶ名前のある線は、名前が収まるまで間を広げる (広げすぎる時は脇へ寄せる)
  const columnCount = Math.max(1, ...[...slots.values()].map((s) => s.col + 1));
  // 運ぶ物を出し入れする箱は、絵柄の横に置き場を並べられる幅にする (#3176)
  const carriedIn = slotRooms(diagram);
  const widths = new Map(diagram.boxes.map((b) => [b.id, Math.max(boxWidth(diagram, b.id, true), slotBoxWidth(carriedIn.get(b.id), b.icon !== undefined, B.padX))]));
  const colW = Array.from({ length: columnCount }, (_, c) => Math.max(B.minW, ...[...slots].filter(([, s]) => s.col === c).map(([id]) => widths.get(id) ?? B.minW)));
  const between = Array.from({ length: Math.max(0, columnCount - 1) }, () => A.columnGap as number);
  for (const { edge } of edges) {
    const a = slots.get(edge.from);
    const b = slots.get(edge.to);
    if (!a || !b || edge.label === undefined || a.group !== b.group || a.row !== b.row || Math.abs(a.col - b.col) !== 1 || vertical(edge.labelSide)) continue;
    const need = textWidth(edge.label, labelStyle(edge.label)) + LOOK.label.padX * 2 + A.labelRoom * 2;
    const i = Math.min(a.col, b.col);
    if (need <= A.maxColumnGap) between[i] = Math.max(between[i] ?? 0, need);
  }
  const headers = groups.map((g) => (g.region ? headerSize(g.region) : undefined));
  const headerW = Math.max(0, ...headers.map((h) => (h ? h.w + R.inset * 2 : 0)));
  const colLeft: number[] = [];
  for (let c = 0; c < columnCount; c++) colLeft.push(c === 0 ? margin + (headerW > 0 ? headerW : R.pad) : (colLeft[c - 1] as number) + (colW[c - 1] as number) + (between[c - 1] as number));
  const center = (c: number): number => (colLeft[c] as number) + (colW[c] as number) / 2;

  // 帯を上から積む
  const boxes: SceneBox[] = [];
  const bands: { group: number; y: number; h: number; rows: number }[] = [];
  let cursor = margin;
  groups.forEach((group, g) => {
    const rows = Math.max(1, ...group.members.map((id) => (slots.get(id)?.row ?? 0) + 1));
    const room = rooms[g] as Room;
    const top = cursor + R.pad + room.top;
    for (const id of group.members) {
      const slot = slots.get(id) as Slot;
      const source = diagram.boxes.find((b) => b.id === id);
      const w = widths.get(id) ?? B.minW;
      const cx = center(slot.col);
      const y = top + slot.row * (B.h + A.rowGap);
      boxes.push({
        id,
        name: source?.name ?? id,
        ...(source?.sub !== undefined ? { sub: source.sub } : {}),
        ...(source?.icon !== undefined ? { icon: source.icon } : {}),
        color: colors.get(id) ?? "slate",
        x: cx - w / 2,
        y,
        w,
        h: B.h,
        cx,
        cy: y + B.h / 2,
      });
    }
    const contentBottom = top + rows * B.h + (rows - 1) * A.rowGap;
    const header = headers[g];
    const h = Math.max(contentBottom + R.pad + room.bottom - cursor, header ? header.h + R.inset * 2 : 0, group.region ? R.minH : 0);
    bands.push({ group: g, y: cursor, h, rows });
    cursor += h + R.gap;
  });
  const bandsBottom = cursor - R.gap;
  for (const box of boxes) placeSlot(box, carriedIn.get(box.id));

  const byId = new Map(boxes.map((b) => [b.id, b]));
  const bandOf = (id: string) => bands[slots.get(id)?.group ?? 0] as (typeof bands)[number];
  const blocked = (points: Point[], a: string, b: string): boolean =>
    boxes.some((box) => {
      if (box.id === a || box.id === b) return false;
      const pad = LOOK.label.search;
      for (let i = 1; i < points.length; i++) {
        const [x1, y1] = points[i - 1] as Point;
        const [x2, y2] = points[i] as Point;
        if (Math.min(x1, x2) <= box.x + box.w + pad && Math.max(x1, x2) >= box.x - pad && Math.min(y1, y2) <= box.y + box.h + pad && Math.max(y1, y2) >= box.y - pad) return true;
      }
      return false;
    });
  // 箱の下 (上) の、次の行か次の帯との間の真ん中
  const laneBelow = (id: string): number => {
    const box = byId.get(id) as SceneBox;
    const band = bandOf(id);
    return (slots.get(id)?.row ?? 0) < band.rows - 1 ? box.y + box.h + A.rowGap / 2 : Math.min(box.y + box.h + R.pad / 2, band.y + band.h - LOOK.edge.inset);
  };
  const laneAbove = (id: string): number => {
    const box = byId.get(id) as SceneBox;
    const band = bandOf(id);
    return (slots.get(id)?.row ?? 0) > 0 ? box.y - A.rowGap / 2 : Math.max(box.y - R.pad / 2, band.y + LOOK.edge.inset);
  };
  const inset = LOOK.edge.inset;
  const route = (from: string, to: string): Point[] => {
    const a = byId.get(from) as SceneBox;
    const b = byId.get(to) as SceneBox;
    const sa = slots.get(from) as Slot;
    const sb = slots.get(to) as Slot;
    if (sa.group === sb.group && sa.row === sb.row) {
      const right = b.cx > a.cx;
      const straight: Point[] = [
        [right ? a.x + a.w : a.x, a.cy],
        [right ? b.x - inset : b.x + b.w + inset, b.cy],
      ];
      if (!blocked(straight, from, to)) return straight;
      const lane = laneBelow(from);
      return [
        [a.cx, a.y + a.h],
        [a.cx, lane],
        [b.cx, lane],
        [b.cx, b.y + b.h + inset],
      ];
    }
    const down = b.cy > a.cy;
    const leave: Point = [a.cx, down ? a.y + a.h : a.y];
    const enter: Point = [b.cx, down ? b.y - inset : b.y + b.h + inset];
    if (sa.col === sb.col) {
      const straight: Point[] = [leave, enter];
      if (!blocked(straight, from, to)) return straight;
      const x = a.x + a.w + (between[sa.col] ?? A.columnGap) / 2;
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
  // 運ぶ物は着いた箱の置き場に留まり、出る箱の置き場で走り出しを待つ (#3176)
  seatCarriers(sceneEdges, byId, carriedIn);
  // 同じ 2 つの箱を行きと帰りで結ぶまっすぐな線は、少しずらして重ならないようにする。
  // ずらした線の名前は、ずらした側 (もう一方の線の反対側) に置き、どちらの線の名前かを取り違えないようにする (#3175)
  const outward = new Map<SceneEdge, LabelSide>();
  for (const edge of sceneEdges) {
    if (edge.points.length !== 2) continue;
    const back = sceneEdges.some((other) => other.from === edge.to && other.to === edge.from && other.points.length === 2);
    if (!back) continue;
    const [p, q] = edge.points as [Point, Point];
    const flat = Math.abs(q[1] - p[1]) < Math.abs(q[0] - p[0]);
    const d = (edge.from < edge.to ? 1 : -1) * LOOK.edge.parallel;
    edge.points = edge.points.map(([x, y]) => (flat ? [x, y + d] : [x + d, y]));
    outward.set(edge, flat ? (d > 0 ? "below" : "above") : d > 0 ? "right" : "left");
  }

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
  const early = lineBadges(sceneEdges, diagram.steps.length);
  const labels: SceneLabel[] = [];
  for (const edge of sceneEdges) {
    const source = diagram.steps[edge.step]?.events[edge.event];
    if (source?.type !== "edge" || source.label === undefined) continue;
    const seen = [...early].filter(([s]) => s <= edge.step).map(([, b]) => badgeRect(b.point));
    const soft: Rect[] = [...regions.map((r) => r.header), ...labels.filter((l) => l.step === edge.step)];
    // 指示の無い線の名前は、空いていなければ反対の側も探す。ずらした線は自分の側だけを探す
    const side = source.labelSide ?? outward.get(edge);
    labels.push(
      placeLabel(
        { step: edge.step, event: edge.event, text: source.label, points: edge.points, color: edge.color, ...(side ? { side } : { flip: true }) },
        { hard: boxes, soft, touch: seen },
      ),
    );
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
  const lines = lineBadges(sceneEdges, diagram.steps.length);
  // 同じ所に置いた番号は、後の段が始まると入れ替える (#3184)
  layout.badges = replaceSameSpot(
    diagram.steps.map((step, s) => {
      const line = lines.get(s);
      if (!line) return cornerBadge(step.events, s, layout);
      return { step: s, x: line.point[0], y: line.point[1], color: line.edge.color };
    }),
  );
  return layout;
}

/** 区画の中を結ぶ線の名前が帯の外へ出ていたら、その分だけ帯の上か下を広げる。広げたら true。 */
function grow(layout: Layout, groups: Group[], slots: Map<string, Slot>, rooms: Room[]): boolean {
  let grown = false;
  const soft = LOOK.label.soft;
  for (const label of layout.labels) {
    const edge = layout.edges.find((e) => e.step === label.step && e.event === label.event);
    const a = edge && slots.get(edge.from);
    const b = edge && slots.get(edge.to);
    if (!a || !b || a.group !== b.group || !groups[a.group]?.region) continue;
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
