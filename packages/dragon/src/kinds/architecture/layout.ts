/**
 * 構成図の置き場所。
 *
 * 区画を書いた順に上から帯に積み、帯の左に区画の名前を置く。区画の外の箱は、書いた所の前後の区画の間の帯に置く (#3546)。箱は全ての帯で共通の列に並べるので、
 * 区画をまたぐ線は縦にまっすぐ走る。箱の並びは線を辿って決める。前の区画の箱から線が来る箱を
 * その箱の列に置き、そこから線で繋がる箱を隣の列へ (寄せの指示が左か右なら下の行へ) 置いていく。
 * 線は縦と横の折れ線で、間にある箱を避ける。名前が箱に掛かる時は帯を広げて名前の場所を空ける。
 * 箱の下か上を回る線は、行で最も高い箱の枠と帯の枠から余白 (`LOOK.margin`) 以上離して通し、帯が狭ければ帯を広げる (#3526、#3546)。
 */
import { LOOK, TYPE } from "../../look/values";
import type { DiagramModel, LabelSide, Region } from "../../schema";
import { textWidth } from "../../layout/measure";
import {
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
  LOOP_ROOM,
  loopBadge,
  loopLabelBase,
  loopUnder,
  layoutStrip,
  type BoxFit,
  shapedSize,
  type Point,
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

export function layoutArchitecture(diagram: DiagramModel): Layout {
  const groups = groupsOf(diagram);
  const slots = placeBoxes(diagram, groups);
  const rooms = groups.map(() => ({ top: 0, bottom: 0 }));
  let layout = arrange(diagram, groups, slots, rooms);
  // 名前を置く場所が帯の外へ出たら、その帯を広げて置き直す。箱の下か上を回る線が帯の枠に近い時も広げる (#3526)
  for (let pass = 0; pass < 3 && grow(layout, groups, slots, rooms); pass++) layout = arrange(diagram, groups, slots, rooms);
  return layout;
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

function arrange(diagram: DiagramModel, groups: Group[], slots: Map<string, Slot>, rooms: Room[]): Layout {
  const { box: B, region: R, architecture: A, margin, gap } = LOOK;
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
    const top = cursor + R.pad + room.top;
    // 行の高さは行で最も高い箱の高さ。形を持つ箱は中身を収めるために高くなる (#3520)
    const rowH = Array.from({ length: rows }, (_, r) => Math.max(B.h, ...group.members.filter((id) => slots.get(id)?.row === r).map((id) => fits.get(id)?.h ?? B.h)));
    // 行の上端。輪を持つ行の下は、行の間に輪の分を足す
    const rowTop: number[] = [0];
    for (let r = 1; r < rows; r++) rowTop.push((rowTop[r - 1] as number) + (rowH[r - 1] as number) + A.rowGap + loopRoom(g, r - 1));
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
    const contentBottom = top + (rowTop[rows - 1] as number) + (rowH[rows - 1] as number) + loopRoom(g, rows - 1);
    const header = headers[g];
    const h = Math.max(contentBottom + R.pad + room.bottom - cursor, header ? header.h + R.inset * 2 : 0, group.region ? R.minH : 0);
    bands.push({ group: g, y: cursor, h, rows });
    cursor += h + R.gap;
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
    return slot.row < bandOf(id).rows - 1 ? under + A.rowGap / 2 : under + margin;
  };
  const laneAbove = (id: string): number => {
    const { slot, span } = spanOf(id);
    return slot.row > 0 ? span.top - A.rowGap / 2 : span.top - margin;
  };
  const inset = LOOK.edge.inset;
  /** 列 `col` の右 (左) の、隣の列との間の真ん中。同じ列の箱は幅が違うので、箱ではなく列の端から測る (幅の広い箱の中を通さない) */
  const gapX = (col: number, toRight: boolean): number =>
    toRight ? (colLeft[col] as number) + (colW[col] as number) + (between[col] ?? A.columnGap) / 2 : (colLeft[col] as number) - (between[col - 1] ?? A.columnGap) / 2;
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
  const labels: SceneLabel[] = [];
  for (const edge of sceneEdges) {
    const source = diagram.steps[edge.step]?.events[edge.event];
    if (source?.type !== "edge" || source.label === undefined) continue;
    const seen = [...early].filter(([s]) => s <= edge.step).map(([, b]) => badgeRect(b.point));
    const soft: Rect[] = [...regions.map((r) => r.header), ...labels.filter((l) => l.step === edge.step)];
    // 指示の無い線の名前は、空いていなければ反対の側も探す。ずらした線は自分の側だけを探す
    const side = source.labelSide ?? outward.get(edge);
    // 輪の名前は輪の下から探す (#3186)
    const below = edge.from === edge.to ? { side: "below" as const, base: loopLabelBase(edge.points, textWidth(source.label, labelStyle(source.label)) + LOOK.label.padX * 2) } : undefined;
    labels.push(
      placeLabel(
        { step: edge.step, event: edge.event, text: source.label, points: edge.points, color: edge.color, ...(below ?? (side ? { side } : { flip: true })) },
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
  return layout;
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
