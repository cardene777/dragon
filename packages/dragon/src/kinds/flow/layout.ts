/**
 * 手順の図の置き場所 (#3561)。見た目の元は step 2 で本人が選んだ動く試作の「上から下へ」。
 *
 * 段で通る本筋の箱と判断は、段の線が初めて辿り着く順に上から下へ 1 列に並べ、中心の横の位置をそろえる。判断はひし形にする。
 * 本筋で隣り合う 2 つを結ぶ線は真下への 1 本になり、間の箱を飛ばす線は本筋の左を通る。
 * 本筋に無い箱 (今回は通らない道の先) は、そこへ道を出す本筋の箱と判断の右に置き、高さはその箱と判断の真ん中の平均にする。
 * 本筋から本筋に無い箱への線は、送る側の右の角から横へ出て、箱の上か下の端へ入る。同じ側から入る線は、高い所を通る線ほど右へ入れ、線を交えない。
 * 始まりの印は最初の箱の上に、終わりの印は終わりへ移る箱の右に置く。
 * 判断の問いは、2 行に折るとひし形が細くなる時だけ、助詞か空白の後で 2 行に折る。
 * 判断から同じ段に書いた 2 本の線は、先に書いた線が本筋を進み、後に書いた線の先の箱は本筋に無い箱と同じ所へ置く。段で辿り着くので点線の縁と薄い字にはしない (#3579)。
 */
import { type MainWalk, walkLine } from "../../blocks/choice/block";
import { FIGURE_TEXT } from "../../figure-text";
import { type ColorKey, LOOK, TYPE } from "../../look/values";
import type { Box, DiagramModel } from "../../schema";
import { type NotationLang, STATE_ENDS } from "../../words";
import { textBox, textWidth } from "../../layout/measure";
import {
  badgeBlocked,
  badgeOnPath,
  badgeRect,
  besideSameSpot,
  type BoxFit,
  boxColors,
  boxWidth,
  carrierHalf,
  carrierSeats,
  cornerBadge,
  edgesOf,
  type EdgeEvent,
  labelStyle,
  type Layout,
  layoutStrip,
  lineBadges,
  lineKey,
  loopBadge,
  loopLabelBase,
  loopUnder,
  markText,
  placeLabel,
  type Point,
  askedSide,
  pullApart,
  type Rect,
  type SceneBox,
  type SceneEdge,
  type SceneEnd,
  type SceneLabel,
  type ScenePath,
  shapedSize,
  shiftContent,
  stripNeed,
} from "../../layout/scene";

const isEnd = (id: string): boolean => (STATE_ENDS as readonly string[]).includes(id);

/** 後ろで折ってよい助詞。和文の問いは助詞の後で折り、助詞を行の頭に送らない */
const PARTICLES = new Set([..."はがをにでとへもの"]);
/** 後ろで折ってよい読点 */
const COMMAS = new Set([..."、，"]);
/** 前で折らない字。閉じ括弧と句読点と、問いの終わりの印を行の頭に送らない */
const CLOSING = new Set([..."、。，．）」』！？!?,.)"]);
/** 平仮名か。助詞と同じ字の平仮名は語の中にも出るので、前と後ろがどちらも平仮名の所では折らない */
const isKana = (ch: string | undefined): boolean => ch !== undefined && /\p{Script=Hiragana}/u.test(ch);

/**
 * 問いを 2 行に折れる所ごとの 2 行。欧文は空白で、和文は読点の後と、漢字か片仮名か英字の後に続く助詞か、漢字か片仮名か英字の前に来る助詞の後で折る。
 * 折った後の行が空になる所と、次の行が閉じる字で始まる所では折らない
 */
function twoRows(question: string): string[][] {
  const chars = [...question];
  const out: string[][] = [];
  for (let k = 1; k < chars.length; k++) {
    const prev = chars[k - 1] as string;
    const next = chars[k] as string;
    const space = /\s/u.test(next);
    const particle = PARTICLES.has(prev) && k >= 2 && !(isKana(chars[k - 2]) && isKana(next));
    if (!space && !particle && !COMMAS.has(prev)) continue;
    const first = chars.slice(0, k).join("").trimEnd();
    const second = chars.slice(k).join("").trimStart();
    if (first === "" || second === "" || CLOSING.has([...second][0] as string)) continue;
    out.push([first, second]);
  }
  return out;
}

/** 線の両端が同じ 2 つの線か */
const same = (a: { from: string; to: string }, b: { from: string; to: string }): boolean => a.from === b.from && a.to === b.to;

/** 本筋。段の線の送る側と受ける側を、段の順に見て初めて出た順に並べた箱と判断 */
export function mainPath(diagram: DiagramModel): string[] {
  const walk: MainWalk = { main: [], side: [], forked: [] };
  const choices = diagram.flow?.choices ?? [];
  let at = -1;
  for (const { step, edge } of edgesOf(diagram)) {
    if (step !== at) walk.forked.length = 0;
    at = step;
    walkLine(walk, edge, (id) => choices.some((c) => c.id === id));
  }
  return walk.main;
}

export function layoutFlow(diagram: DiagramModel, lang: NotationLang): Layout {
  const { box: B, flow: F, state: T, margin, gap } = LOOK;
  const inset = LOOK.edge.inset;
  const words = FIGURE_TEXT[lang];
  const choices = diagram.flow?.choices ?? [];
  const isChoice = (id: string): boolean => choices.some((c) => c.id === id);
  // 判断も箱の並びに足し、箱と同じく幅を測り色を配る。判断の色は値の表が持つ
  const all: DiagramModel = { ...diagram, boxes: [...diagram.boxes, ...choices.map((c): Box => ({ id: c.id, name: c.name, color: F.choice.color }))] };
  const colors = boxColors(all);
  const steps = edgesOf(diagram);
  const main = mainPath(diagram);
  const off = all.boxes.map((b) => b.id).filter((id) => !main.includes(id));
  const notTaken = (diagram.flow?.paths ?? []).filter((p) => !steps.some(({ edge }) => same(edge, p)));
  const lines: { from: string; to: string; label?: string }[] = [...steps.map(({ edge }) => edge), ...notTaken];
  // 段で辿り着く箱。本筋に無くても、段で横へ分かれた先の箱はここに入る (#3579)
  const reached = new Set(steps.flatMap(({ edge }) => [edge.from, edge.to]));
  /** 本筋を外れて右の列へ入る線。今回は通らない道と、段で横へ分かれる線 */
  const sideLines = [...notTaken, ...steps.map(({ edge }) => edge).filter((e) => !isEnd(e.to) && !main.includes(e.to))];
  /** 本筋に無い箱か */
  const aside = (id: string): boolean => !isEnd(id) && !main.includes(id);

  // 絵柄を持つ箱が 1 つでもある図は、名前を絵柄の下に下げてそろえる (`box/draw.ts` の `boxTextY`)。判断の問いは下げた分だけ中身の真ん中を上げ、ひし形の真ん中に置く
  const nameBase = all.boxes.some((b) => b.icon !== undefined) ? B.nameY : B.nameMid;
  const { size } = TYPE.boxName;
  const { h: choiceH, pad, minW, lead } = F.choice;
  /** 問いを `rows` の行で書いた時のひし形の幅。行ごとに、字の四角の角のうち真ん中から遠い角が、ひし形の縁から `pad` 内に収まる幅にする */
  const diamondW = (rows: readonly string[]): number =>
    Math.max(
      minW,
      ...rows.map((row, k) => {
        const far = Math.abs((k - (rows.length - 1) / 2) * lead) + size / 2;
        return (textWidth(row, TYPE.boxName) + pad * 2) / (1 - (far * 2 + pad * 2) / choiceH);
      }),
    );
  /** 判断の問いの行。2 行に折るとひし形が 1 行より細くなる時だけ、細くなる所で 2 行に折る */
  const rowsOf = (question: string): string[] => {
    let best = [question];
    for (const rows of twoRows(question)) if (diamondW(rows) < diamondW(best)) best = rows;
    return best;
  };
  const rows = new Map(choices.map((c) => [c.id, rowsOf(c.name)]));
  /** 箱と判断の大きさ */
  const fitOf = (id: string): BoxFit => {
    const question = rows.get(id);
    if (!question) return shapedSize(all, id, boxWidth(all, id, true), true);
    const w = diamondW(question);
    // 字の四角は基準線から字の大きさの 0.8 上と 0.2 下に在るので、基準線を真ん中から字の大きさの 0.3 下げると字の高さの真ん中が真ん中に来る
    return { w, h: choiceH, at: [w / 2, choiceH / 2 + size * 0.3 - nameBase] };
  };
  const fits = new Map(all.boxes.map((b) => [b.id, fitOf(b.id)]));
  const fit = (id: string): BoxFit => fits.get(id) ?? { w: B.minW, h: B.h };

  const boxOf = (id: string, x: number, y: number): SceneBox => {
    const source = all.boxes.find((b) => b.id === id);
    const { w, h, at } = fit(id);
    const question = rows.get(id);
    return {
      id,
      name: source?.name ?? id,
      ...(question && question.length > 1 ? { lines: question.map((text, k) => ({ text, dy: (k - (question.length - 1) / 2) * lead })) } : {}),
      ...(source?.sub !== undefined ? { sub: source.sub } : {}),
      ...(source?.icon !== undefined ? { icon: source.icon } : {}),
      color: colors.get(id) ?? "slate",
      x,
      y,
      w,
      h,
      ...(at ? { at } : {}),
      cx: x + w / 2,
      cy: y + h / 2,
      ...(isChoice(id) ? { shape: "diamond" as const } : {}),
      ...(reached.has(id) ? {} : { off: true as const }),
    };
  };

  // 本筋の間の箱を飛ばす線は本筋の左を通り、1 本ごとに外の道を使う
  const index = (id: string): number => main.indexOf(id);
  const skipKeys = [...new Set(lines.filter((l) => index(l.from) >= 0 && index(l.to) >= 0 && index(l.to) !== index(l.from) + 1 && l.from !== l.to).map((l) => `${l.from}>${l.to}`))];
  const leftRoom = skipKeys.length > 0 ? F.skip + (skipKeys.length - 1) * F.lane : 0;
  const mainW = Math.max(B.minW, ...main.map((id) => fit(id).w));
  const cx = margin + leftRoom + mainW / 2;
  const startTo = lines.find((l) => l.from === "start")?.to;
  // 始まりの印から最初の箱へ下りる間を、最初の箱の上に空ける
  let y = margin + (startTo !== undefined && (startTo === main[0] || !main.includes(startTo)) ? T.start + F.drop : 0);
  const boxes: SceneBox[] = [];
  for (const id of main) {
    boxes.push(boxOf(id, cx - fit(id).w / 2, y));
    y += fit(id).h + F.gap;
  }
  const byId = new Map(boxes.map((b) => [b.id, b]));
  const mainRight = Math.max(cx, ...boxes.map((b) => b.x + b.w));
  const mainLeft = Math.min(cx, ...boxes.map((b) => b.x));
  const mainBottom = boxes.length > 0 ? Math.max(...boxes.map((b) => b.y + b.h)) : margin;

  // 本筋に無い箱の列。本筋から道を引かれた箱は本筋の右の列、本筋に無い箱からだけ道を引かれた箱はその箱の右の列に置く
  const sourcesOf = (id: string): string[] => sideLines.filter((p) => p.to === id && !isEnd(p.from) && p.from !== id).map((p) => p.from);
  const columnOf = new Map<string, number>();
  for (const id of off) if (sourcesOf(id).some((from) => main.includes(from))) columnOf.set(id, 1);
  for (let changed = true; changed; ) {
    changed = false;
    for (const id of off) {
      if (columnOf.has(id)) continue;
      const near = sourcesOf(id).flatMap((from) => columnOf.get(from) ?? []);
      if (near.length === 0) continue;
      columnOf.set(id, Math.min(...near) + 1);
      changed = true;
    }
  }
  for (const id of off) if (!columnOf.has(id)) columnOf.set(id, 1);
  const columns = Math.max(0, ...columnOf.values());
  let left = mainRight + F.side;
  for (let c = 1; c <= columns; c++) {
    const inColumn = off.filter((id) => columnOf.get(id) === c);
    const colW = Math.max(B.minW, ...inColumn.map((id) => fit(id).w));
    // 道を出す箱の真ん中の高さの平均に置きたい高さ。道を引かれない箱は本筋の下へ並べる
    const wanted = inColumn.map((id, k) => {
      const from = sourcesOf(id).flatMap((s) => byId.get(s) ?? []);
      return { id, k, cy: from.length > 0 ? from.reduce((sum, b) => sum + b.cy, 0) / from.length : Number.POSITIVE_INFINITY };
    });
    wanted.sort((a, b) => a.cy - b.cy || a.k - b.k);
    let floor = margin;
    for (const { id, cy } of wanted) {
      const { h } = fit(id);
      const top = Math.max(Number.isFinite(cy) ? cy - h / 2 : mainBottom - h, floor);
      const placed = boxOf(id, left + (colW - fit(id).w) / 2, top);
      boxes.push(placed);
      byId.set(id, placed);
      floor = top + h + F.stack;
    }
    left += colW + F.side;
  }

  // 始まりの印は始まりから入る箱の上。本筋の途中の箱へ入る時は、その箱の左に置く
  const ends: SceneEnd[] = [];
  const startBox = startTo === undefined ? undefined : byId.get(startTo);
  if (startBox) {
    const above = startBox === boxes[0] || aside(startBox.id);
    ends.push(above ? { kind: "start", x: startBox.cx, y: startBox.y - F.drop, r: T.start, ghost: false, text: words.start } : { kind: "start", x: startBox.x - F.beside, y: startBox.cy, r: T.start, ghost: false, text: words.start });
  }
  // 終わりの印は終わりへ移る箱の右。右の角から本筋に無い箱へ道を出す箱は、下に置く
  const exitsRight = (id: string): boolean => lines.some((l) => l.from === id && byId.has(l.to) && aside(l.to) && !aside(id));
  for (const box of boxes.filter((b) => lines.some((l) => l.from === b.id && l.to === "finish"))) {
    ends.push(
      exitsRight(box.id)
        ? { kind: "finish", x: box.cx, y: box.y + box.h + T.below, r: T.end.r, ghost: false, text: words.end, box: box.id }
        : { kind: "finish", x: box.x + box.w + F.beside, y: box.cy, r: T.end.r, ghost: false, text: words.end, box: box.id },
    );
  }
  const finishOf = (id: string): SceneEnd | undefined => ends.find((e) => e.kind === "finish" && e.box === id);

  /** 本筋に無い箱 `to` へ、本筋の箱 `from` から入る所。箱の上の端か下の端か左の端 */
  const entryOf = (from: SceneBox, to: SceneBox): { side: "top" | "bottom" | "left"; x: number } => {
    if (from.cy > to.y + inset * 2 && from.cy < to.y + to.h - inset * 2) return { side: "left", x: to.x };
    const top = from.cy <= to.cy;
    // 同じ側から入る線を、上から入る線は高い所を通る線ほど右、下から入る線は低い所を通る線ほど右に並べる
    const peers = sideLines
      .filter((p) => p.to === to.id)
      .flatMap((p) => byId.get(p.from) ?? [])
      .filter((b) => !aside(b.id) && (b.cy <= to.cy) === top && !(b.cy > to.y + inset * 2 && b.cy < to.y + to.h - inset * 2))
      .sort((a, b) => (top ? a.cy - b.cy : b.cy - a.cy));
    const k = Math.max(0, peers.indexOf(from));
    const x = peers.length <= 1 ? to.cx : to.x + to.w - F.entry - ((to.w - F.entry * 2) * k) / (peers.length - 1);
    return { side: top ? "top" : "bottom", x };
  };
  /** 間の箱を飛ばす線の通る所の横の位置 */
  const laneX = (from: string, to: string): number => mainLeft - F.skip - Math.max(0, skipKeys.indexOf(`${from}>${to}`)) * F.lane;

  const route = (from: string, to: string): Point[] => {
    if (from === "start") {
      const start = ends.find((e) => e.kind === "start");
      const target = byId.get(to);
      if (!start || !target) return [];
      return Math.abs(start.x - target.cx) < 0.5 ? [[start.x, start.y + start.r], [target.cx, target.y - inset]] : [[start.x + start.r, start.y], [target.x - inset, target.cy]];
    }
    const a = byId.get(from);
    if (!a) return [];
    if (to === "finish") {
      const end = finishOf(from);
      if (!end) return [];
      return Math.abs(end.x - a.cx) < 0.5 ? [[a.cx, a.y + a.h], [a.cx, end.y - end.r - inset]] : [[a.x + a.w, a.cy], [end.x - end.r - inset, a.cy]];
    }
    const b = byId.get(to);
    if (!b) return [];
    if (from === to) return loopUnder(a);
    if (!aside(from) && !aside(to)) {
      if (index(to) === index(from) + 1) return [[a.cx, a.y + a.h], [b.cx, b.y - inset]];
      const x = laneX(from, to);
      return [[a.x, a.cy], [x, a.cy], [x, b.cy], [b.x - inset, b.cy]];
    }
    if (!aside(from)) {
      const entry = entryOf(a, b);
      if (entry.side === "left") return [[a.x + a.w, a.cy], [b.x - inset, a.cy]];
      return [[a.x + a.w, a.cy], [entry.x, a.cy], [entry.x, entry.side === "top" ? b.y - inset : b.y + b.h + inset]];
    }
    if (!aside(to)) return b.cy > a.cy ? [[a.cx, a.y + a.h], [a.cx, b.cy], [b.x + b.w + inset, b.cy]] : [[a.cx, a.y], [a.cx, b.cy], [b.x + b.w + inset, b.cy]];
    if (Math.abs(a.cx - b.cx) < 0.5) return b.cy > a.cy ? [[a.cx, a.y + a.h], [b.cx, b.y - inset]] : [[a.cx, a.y], [b.cx, b.y + b.h + inset]];
    const mid = (a.x + a.w + b.x) / 2;
    return [[a.x + a.w, a.cy], [mid, a.cy], [mid, b.cy], [b.x - inset, b.cy]];
  };

  /** 終わりへ着いた札が留まる所。終わりの印と字に掛からないよう、下に置いた印なら左、右に置いた印なら下に留まる */
  const settleOf = (edge: EdgeEvent): Point | undefined => {
    const end = edge.to === "finish" ? finishOf(edge.from) : undefined;
    if (!end) return undefined;
    const from = byId.get(edge.from);
    return from && Math.abs(end.x - from.cx) < 0.5 ? [end.x - end.r - gap - carrierHalf(edge.carry)[0], end.y] : [end.x, end.y + end.r + gap + LOOK.carrier.tagH / 2];
  };
  /** 始まりの印から出る札は、印の右の字に掛からないよう、印の左で走り出しを待つ */
  const waitOf = (edge: EdgeEvent): Point | undefined => {
    const start = edge.from === "start" ? ends.find((e) => e.kind === "start") : undefined;
    return start ? [start.x - start.r - LOOK.slot.mark - carrierHalf(edge.carry)[0], start.y] : undefined;
  };

  // 運ぶ物を書かない線は封筒でなく段の印の点が走り、点は着くと消えるので、待つ所と留まる所を持たない。書いた運ぶ物 (`carry: coin` と `tag`) は今どおり待って留まる
  const sceneEdges: SceneEdge[] = steps.map(({ step, event, edge }) => {
    const rides = edge.carry.kind === "coin" || edge.carry.kind === "tag";
    const settle = rides ? settleOf(edge) : undefined;
    const wait = rides ? waitOf(edge) : undefined;
    return {
      step,
      event,
      from: edge.from,
      to: edge.to,
      points: route(edge.from, edge.to),
      color: F.on,
      carry: edge.carry,
      ...(settle ? { settle } : {}),
      ...(wait ? { wait } : {}),
    };
  });
  // 同じ 2 つを行きと帰りで結ぶ線は、崩れの検査の下限より広く左右に離す (原本の JSON にだけ書ける)
  const outward = pullApart(sceneEdges, askedSide(diagram));
  const paths: ScenePath[] = notTaken.map((p) => ({ from: p.from, to: p.to, points: route(p.from, p.to) }));

  /** 線の名前と段の番号の色。線そのものは段で動く色で引くが、名前と番号は今どおり着く先の箱の色で出す */
  const nameColor = (e: SceneEdge): ColorKey => colors.get(e.to === "finish" ? e.from : e.to) ?? "slate";
  // 線の名前。段が終わった名前も薄く残るので、段を問わず先に置いた全ての名前と、印に添えた字と段の番号を避ける
  const badgeAt = (edge: SceneEdge, taken: Point[], others: Point[][]): Point => (edge.from === edge.to ? loopBadge(edge.points) : badgeOnPath(edge.points, taken, others));
  const labels: SceneLabel[] = [];
  const marks: Rect[] = ends.flatMap((e) => (e.text === "" ? [] : [textBox(e.text, ...markText(e), TYPE.regionNote)]));
  const badgeRects = [...lineBadges(sceneEdges, diagram.steps.length, badgeAt).values()].map((b) => badgeRect(b.point));
  const others = (own: Point[]): Point[][] => [...sceneEdges.map((o) => o.points), ...paths.map((o) => o.points)].filter((line) => line !== own);
  for (const e of sceneEdges) {
    const source = diagram.steps[e.step]?.events[e.event];
    if (source?.type !== "edge" || source.label === undefined) continue;
    const loop = e.from === e.to;
    // 同じ線に同じ名前を置いた段が前に在れば、その名前の所に重ねて名前を 1 つにまとめる。前の段の薄い名前はこの段が始まると消す (#3184)
    const key = lineKey(e);
    const same2 = labels.filter((l) => l.text === source.label && sceneEdges.some((o) => o.step === l.step && o.event === l.event && lineKey(o) === key)).at(-1);
    if (same2) {
      same2.until = e.step;
      labels.push({ x: same2.x, y: same2.y, w: same2.w, h: same2.h, step: e.step, event: e.event, text: same2.text, family: same2.family, color: nameColor(e) });
      continue;
    }
    const w = textWidth(source.label, labelStyle(source.label)) + LOOK.label.padX * 2;
    const below = loop ? { side: "below" as const, base: loopLabelBase(e.points, w) } : {};
    const side = source.labelSide ?? (e.to === "finish" ? undefined : outward.get(e));
    labels.push(
      placeLabel(
        { step: e.step, event: e.event, text: source.label, points: e.points, color: nameColor(e), ...(side ? { side } : loop ? {} : { flip: true }), ...below },
        { hard: boxes, soft: [...marks, ...labels], touch: badgeRects, lines: others(e.points) },
      ),
    );
  }
  // 今回は通らない道の名前は、横に通る所の上か下に置く
  const placed: Rect[] = [];
  notTaken.forEach((p, i) => {
    const path = paths[i] as ScenePath;
    if (p.label === undefined || path.points.length === 0) return;
    const style = labelStyle(p.label);
    const rect = placeLabel({ step: -1, event: i, text: p.label, points: path.points, color: "slate", flip: true }, { hard: boxes, soft: [...marks, ...labels, ...placed], touch: badgeRects, lines: others(path.points) });
    placed.push(rect);
    path.label = { x: rect.x, y: rect.y, w: rect.w, h: rect.h, text: p.label, family: style.family };
  });

  const layout: Layout = { kind: "flow", width: 0, height: 0, regions: [], boxes, lifelines: [], edges: sceneEdges, labels, actions: [], badges: [], paths, ends };
  // 名前が左か上へ出たら、全体を右か下へ寄せる。始まりの印の左で待つ札と終わりの印の脇に留まる札も、図の中に収める
  const seatsBefore = carrierSeats(sceneEdges);
  const lefts = [...boxes.map((b) => b.x), ...labels.map((l) => l.x), ...paths.flatMap((p) => [...p.points.map((q) => q[0]), ...(p.label ? [p.label.x] : [])]), ...sceneEdges.flatMap((e) => e.points.map((q) => q[0])), ...ends.map((e) => e.x - e.r), ...seatsBefore.map((r) => r.x)];
  const tops = [...labels.map((l) => l.y), ...paths.flatMap((p) => (p.label ? [p.label.y] : [])), ...ends.map((e) => e.y - e.r), ...seatsBefore.map((r) => r.y)];
  const shift = Math.max(0, margin - Math.min(...lefts));
  const drop = tops.length > 0 ? Math.max(0, margin - Math.min(...tops)) : 0;
  if (shift > 0 || drop > 0) shiftContent(layout, shift, drop);
  const endRight = (e: SceneEnd): number => e.x + (e.text === "" ? e.r : T.text + textWidth(e.text, TYPE.regionNote));
  const seats = carrierSeats(sceneEdges);
  const rights = [
    ...boxes.map((b) => b.x + b.w),
    ...labels.map((l) => l.x + l.w),
    ...ends.map(endRight),
    ...sceneEdges.flatMap((e) => e.points.map((p) => p[0])),
    ...paths.flatMap((p) => [...p.points.map((q) => q[0]), ...(p.label ? [p.label.x + p.label.w] : [])]),
    ...seats.map((r) => r.x + r.w),
  ];
  const bottoms = [
    ...boxes.map((b) => b.y + b.h),
    ...labels.map((l) => l.y + l.h),
    ...ends.map((e) => e.y + e.r),
    ...sceneEdges.flatMap((e) => e.points.map((p) => p[1])),
    ...paths.flatMap((p) => [...p.points.map((q) => q[1]), ...(p.label ? [p.label.y + p.label.h] : [])]),
    ...seats.map((r) => r.y + r.h),
  ];
  const width = Math.max(Math.max(...rights) + margin, stripNeed(diagram) + margin * 2);
  const bottom = Math.max(...bottoms);
  const strip = layoutStrip(diagram, margin, bottom + gap, width - margin * 2);
  layout.width = width;
  layout.height = (strip ? strip.y + strip.h : bottom) + margin;
  if (strip) layout.strip = strip;
  const placedBadges = lineBadges(sceneEdges, diagram.steps.length, badgeAt);
  // 同じ線を通る段の番号は後の段が始まると入れ替え (#3184)、同じ箱の角に来た番号は前の番号の脇に並べる (#3525)
  const lineOf = (step: number): string | undefined => {
    const line = placedBadges.get(step);
    return line ? lineKey(line.edge) : undefined;
  };
  const endParts: Rect[] = layout.ends.flatMap((e) => [{ x: e.x - e.r, y: e.y - e.r, w: e.r * 2, h: e.r * 2 }, ...(e.text === "" ? [] : [textBox(e.text, ...markText(e), TYPE.regionNote)])]);
  layout.badges = besideSameSpot(
    diagram.steps.map((step, s) => {
      const line = placedBadges.get(s);
      if (!line) return cornerBadge(step.events, s, layout);
      return { step: s, x: line.point[0], y: line.point[1], color: nameColor(line.edge) };
    }),
    badgeBlocked(layout, endParts),
    (before, after) => lineOf(before.step) !== undefined && lineOf(before.step) === lineOf(after.step),
  );
  return layout;
}
