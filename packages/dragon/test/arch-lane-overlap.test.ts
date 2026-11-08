/**
 * 構成図で、別々の箱から出て同じ道を回る線と、1つの箱の同じ所へ入る線と出る線 (#3552)。
 *
 * 4つの箱を1行に並べて段3で`A → C`、段4で`B → D`を引くと、2本はどちらも間の箱を避けて行の下を回り、
 * 同じ高さの道を間0で重なって走っていた。同じ箱から出る線は #3549 で離したが、出る箱が違う線は離していなかった。
 * 行の下か上か列の間を回る道は、出る箱によらず、区間が重なる線どうしを`APART.line`以上離して並べる。
 * 回る道を離すと入る線の縦の区間が長くなり、1つの箱の同じ所へ入る線とそこから出る線の重なりが崩れの検査の下限を超えたので、
 * 入る所と出る所も離す。
 * 線の名前は自分の線の脇に置き、別の線に乗せず、自分の線より別の線の近くにも置かない。乗るか近い名前は、その線の名前に読める。
 * 縦の線の脇を列の外を回る線が塞ぐ時は、回る道を列の外へ離して名前の置き場を空ける。行の間か帯の間を横に回る線が塞ぐ時は行の間か帯の間を広げ、
 * 横の線の脇を行の下か上を回る道が塞ぐ時は、道を行から離す。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * 描く部品と崩れを数える部品の元の code を、検査の外 (この file を読む段) で先に読む。
 * 検査の中で初めて読むと、混んだ機械では変換だけで 1 件の上限 (10 秒) に近づく (#3410)
 */
const [{ renderDiagram }, { parseNotation }, { checkText, problemLine }, { APART, LOOK }, { placeLabel }] = await Promise.all([
  // 全ての図の種類の部品と個別ブロックの読み方を持つ入口から読む
  import("../src/render/svg"),
  import("../src/parser"),
  import("../src/check"),
  import("../src/look/values"),
  import("../src/layout/scene"),
]);

type Point = [number, number];
interface Edge {
  from: string;
  to: string;
  step: number;
  event: number;
  points: Point[];
}
interface Label {
  step: number;
  event: number;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const FIXTURES = join(process.cwd(), "packages/dragon/test/fixtures/layout");
/** 4つの箱を1行に並べ、段3の`A → C`と段4の`B → D`が行の下を回る図 */
const LANE_OVERLAP = join(FIXTURES, "lane-overlap.dragon");
/** 形を変えた箱の図 (#3520)。段4の関所からプールへの線が行の下を回ってプールの下へ入り、段5のプールから記録の倉庫への線が同じ所から下へ出る */
const SHAPES = join(FIXTURES, "shapes.dragon");
/** 箱を1列に縦に並べ、段4の APIサーバー → 決済代行 が列の右を縦に回る、Claude が評価で描いた図。段2の名前の右を段4の線が回る */
const BESIDE_DETOUR = join(FIXTURES, "label-beside-detour.dragon");
/** 1つの箱の下に3本の線が集まる図 (#3549)。段1の`受け付け → 通知`の右の脇の近くを、段2の`画面 → 通知`が横に通る */
const CROWD_SIDE = join(process.cwd(), "packages/dragon/test/fixtures/crowd-side.dragon");
/** 同じ箱の下に線が集まる図 (#3549)。段1の`受け付け → 支払い`の右の脇を、段2の`支払い → 認証`が横に通る */
const SHARED_SIDE = join(process.cwd(), "packages/dragon/test/fixtures/shared-side.dragon");
/** 4つの箱を1行に並べ、段5の`APIサーバー → 決済代行`が行の下を回る、Claude が評価で描いた図。段2の名前を線の下に置く */
const BESIDE_LANE = join(FIXTURES, "label-beside-lane.dragon");

/** 1行に並べる4つの箱。段1から段3の線が`a`から`d`を順に右へ並べる */
const ROW = ["box a as A", "box b as B", "box c as C", "box d as D"];

/** 段ごとに 1 本の線を引く記法 */
const notation = (title: string, boxes: string[], lines: string[]): string =>
  [`architecture ${title}`, "", ...boxes, ...lines.flatMap((line, i) => ["", `step ${i + 1}`, `  ${line}`])].join("\n");

/**
 * 1行目の4つの箱の下に、`a`の下の`e`と`c`の下の`f`を置く図 (`[side: right]`の線は相手の箱を下の行に置く)。
 * 行の間の道を、行へ戻る線 (`A → C`、`B → D`) と、その帰りの線 (`C → A`) と、次の行へ進む線 (`A → F`) が通る。
 * `A → C`と`B → D`は区間が交わり、`A → F`は`A`の下の`E`に塞がれて真下へ行けず行の間を回る。
 * `C`の下からは、帰りの線`C → A`と真下の`F`への線が出る。
 * 帰りの線には名前を付けない。付けると #3552 の前から名前が線から離れて置かれ (`label-off-line`)、この検査が確かめる線の崩れと混ざるため
 */
const MIXED = notation("行の間で戻る線と進む線と帰りの線を混ぜる", [...ROW, "box e as E", "box f as F"], [
  "a -> b: 一",
  "b -> c: 二",
  "c -> d: 三",
  "a -> e: 四 [side: right]",
  "c -> f: 五 [side: right]",
  "a -> c: 六",
  "b -> d: 七",
  "c -> a",
  "a -> f: 九",
]);

/**
 * 1行目の4つの箱の下に、`a`と`c`と`d`の下の箱を置く図。段7の`A → F`は行の間を回って下り、
 * 段8の`G → B`は`D`に塞がれて真上へ行けず、`F`に塞がれて横へも行けないので、同じ行の間を回って上る。2本の道は`B`から`F`までの区間で重なる。
 * 下の行へ下りる段4から段6の線には名前を付けない。付けると、名前を2本の道の下に置くために行の間が広がり、2本の道を離す間と区別できない
 */
const BETWEEN_ROWS = notation("行の間で下りる線と上る線が重なる", [...ROW, "box e as E", "box f as F", "box g as G"], [
  "a -> b: 一",
  "b -> c: 二",
  "c -> d: 三",
  "a -> e [side: right]",
  "c -> f [side: right]",
  "d -> g [side: right]",
  "a -> f: 七",
  "g -> b: 八",
]);

/** 4つの箱を縦に並べる図。段4の`A → H`と段5の`E → J`は間の箱に塞がれ、同じ列の右の間を縦に回る。2本の道は`E`から`H`までの区間で重なる */
const COLUMN = notation("同じ列の間を縦に回る2本の線", ["box a as A", "box e as E", "box h as H", "box j as J"], [
  "a -> e: 一 [side: right]",
  "e -> h: 二 [side: right]",
  "h -> j: 三 [side: right]",
  "a -> h: 四",
  "e -> j: 五",
]);

/** 1行目の4つの箱の下に、`c`の下の`f`と`d`の下の`e`を置く図。段7の`A → F`が`F`の左へ入り、段8の`F → B`が`F`の左の同じ所から出る */
const IN_OUT_SIDE = notation("箱の左へ入る線と同じ所から出る線", [...ROW, "box e as E", "box f as F"], [
  "a -> b: 一",
  "b -> c: 二",
  "c -> d: 三",
  "a -> e: 四 [side: right]",
  "c -> f: 五 [side: right]",
  "f -> e: 六",
  "a -> f: 七",
  "f -> b: 八",
]);

/**
 * 4つの箱を1行に並べ、`D`の下に輪を置く図。段5の`B → D`は`C`に塞がれ、行の下を回ると`D`の下の輪を横切るので、行の上を回る。
 * 段3の`C → B`は`B → C`と並ぶ上の線で、名前「戻す」を線の上に置く。`named`が偽なら`C → B`に名前を付けない
 */
const overLoop = (named: boolean): string =>
  notation("行の上を回る線が横の線の名前の上を通る", ROW, ["a -> b: 一", "b -> c: 二", named ? "c -> b: 戻す" : "c -> b", "d -> d: 回す", "b -> d: 送る"]);

function laid(text: string): { edges: Edge[]; labels: Label[]; height: number } {
  const parsed = parseNotation(text, { lang: "ja" });
  if (!parsed.ok) throw new Error(`記法を読めない: ${parsed.errors.map((e) => e.message).join(" / ")}`);
  return renderDiagram(parsed.diagram, { lang: "ja" }).layout;
}

/**
 * `dragon check --layout` と同じ形で、記法の誤りと崩れの知らせの行を返す。段の頭は命令と同じ形にする。
 * 誤りの行も返し、記法を読めずに崩れを数えなかった回を、崩れの無い回と取り違えない
 */
function problems(file: string, text: string, kind?: string): string[] {
  return checkText(file, text, "notation", "ja", { layout: (step, said) => `段 ${step}: ${said}` })
    .filter((p) => kind === undefined || p.layout?.kind === kind)
    .map(problemLine);
}

/** 箱`from`から箱`to`への線 */
function line(edges: Edge[], from: string, to: string): Edge {
  const found = edges.find((e) => e.from === from && e.to === to);
  if (!found) throw new Error(`線 ${from} → ${to} が無い`);
  return found;
}

/** 回る道。線の2つ目の区間 */
const lane = (edge: Edge): [Point, Point] => [edge.points[1] as Point, edge.points[2] as Point];

/** 2本の線の縦か横の区間どうしで、間が`APART.line`より狭く、番号の丸2つ分より長く並んで走る所 (間0で重なる所も含む) */
function closeRuns(a: Edge, b: Edge): string[] {
  const runs: string[] = [];
  const segments = (points: Point[]): [Point, Point][] => points.slice(1).map((q, k) => [points[k] as Point, q]);
  for (const [a0, a1] of segments(a.points))
    for (const [b0, b1] of segments(b.points))
      for (const axis of [0, 1] as const) {
        // `axis` が 0 なら縦の区間 (x が同じ)、1 なら横の区間 (y が同じ) どうしを比べる
        if (Math.abs(a0[axis] - a1[axis]) > 0.01 || Math.abs(b0[axis] - b1[axis]) > 0.01) continue;
        const other = axis === 0 ? 1 : 0;
        const along = Math.min(Math.max(a0[other], a1[other]), Math.max(b0[other], b1[other])) - Math.max(Math.min(a0[other], a1[other]), Math.min(b0[other], b1[other]));
        const gap = Math.abs(a0[axis] - b0[axis]);
        if (gap < APART.line && along > LOOK.badge.r * 2) runs.push(`間 ${gap.toFixed(1)} で ${along.toFixed(1)} 並ぶ`);
      }
  return runs;
}

/** 2本の線の回る道が同じ向きに走り、`APART.line`以上離れることを確かめる。`axis` は道の向きと直角の座標 (横の道は y の 1) */
function expectLanesApart(a: Edge, b: Edge, axis: 0 | 1): void {
  const [la, lb] = [lane(a), lane(b)];
  for (const [p, q] of [la, lb]) expect(Math.abs(p[axis] - q[axis]), `線 ${a.from} → ${a.to} か ${b.from} → ${b.to} の2つ目の区間が回る道でない`).toBeLessThan(0.01);
  expect(Math.abs(la[0][axis] - lb[0][axis]), `線 ${a.from} → ${a.to} と線 ${b.from} → ${b.to} の回る道の間`).toBeGreaterThanOrEqual(APART.line);
  expect(closeRuns(a, b), `線 ${a.from} → ${a.to} と線 ${b.from} → ${b.to} が並んで近すぎる所`).toEqual([]);
}

describe("別々の箱から出て同じ道を回る構成図の線は離れて通る (#3552)", () => {
  it("lane-overlap-row-warns-nothing", () => {
    const text = readFileSync(LANE_OVERLAP, "utf8");
    // 知らせが無いことだけでは、検査が重なりを見落とした回と区別できない。描いた線どうしが並んで近すぎないことも確かめる
    const { edges } = laid(text);
    edges.forEach((a, i) => {
      for (const b of edges.slice(i + 1)) if (a.to !== b.to) expect(closeRuns(a, b), `線 ${a.from} → ${a.to} と線 ${b.from} → ${b.to} が並んで近すぎる所`).toEqual([]);
    });
    expect(problems(LANE_OVERLAP, text), "行の下で重なっていた図の崩れの知らせ").toEqual([]);
  });

  it("lane-overlap-row-lanes-apart", () => {
    const { edges } = laid(readFileSync(LANE_OVERLAP, "utf8"));
    expectLanesApart(line(edges, "a", "c"), line(edges, "b", "d"), 1);
  });

  it("lane-mixed-row-warns-nothing", () => {
    const { edges } = laid(MIXED);
    // 図が回る道を通る線を持つことを先に確かめる。持たなければ崩れ0件は当たり前になる
    for (const [from, to] of [
      ["a", "c"],
      ["b", "d"],
      ["c", "a"],
      ["a", "f"],
    ] as const)
      expect(line(edges, from, to).points.length, `線 ${from} → ${to} が行の間を回らない`).toBe(4);
    expectLanesApart(line(edges, "a", "c"), line(edges, "b", "d"), 1);
    expectLanesApart(line(edges, "c", "a"), line(edges, "b", "d"), 1);
    expectLanesApart(line(edges, "b", "d"), line(edges, "a", "f"), 1);
    // 別々の箱へ向かう線は、どの組も並んで近すぎない。同じ箱へ向かう線は入る前に合わさってよい
    edges.forEach((a, i) => {
      for (const b of edges.slice(i + 1)) if (a.to !== b.to) expect(closeRuns(a, b), `線 ${a.from} → ${a.to} と線 ${b.from} → ${b.to} が並んで近すぎる所`).toEqual([]);
    });
    // 混ぜた図は、並べて回る道の間に置く段6の名前を離れた名前として知らせる。名前の知らせは`lane-label-beside-own-line`が確かめる
    expect(problems("mixed.dragon", MIXED, "lines-close"), "混ぜた図の並んで近すぎる線の知らせ").toEqual([]);
  });

  it("lane-between-rows-apart", () => {
    const { edges } = laid(BETWEEN_ROWS);
    expectLanesApart(line(edges, "a", "f"), line(edges, "g", "b"), 1);
    expect(problems("between-rows.dragon", BETWEEN_ROWS, "lines-close"), "並んで近すぎる線の知らせ").toEqual([]);
  });

  it("lane-column-corridor-apart", () => {
    const { edges } = laid(COLUMN);
    expectLanesApart(line(edges, "a", "h"), line(edges, "e", "j"), 0);
    expect(problems("column.dragon", COLUMN, "lines-close"), "並んで近すぎる線の知らせ").toEqual([]);
  });

  it("lane-in-out-spot-apart", () => {
    const shapes = readFileSync(SHAPES, "utf8");
    const below = laid(shapes).edges;
    const into = line(below, "gate", "pool");
    const out = line(below, "pool", "store");
    // プールの下の辺に沿って、入る所と出る所を比べる
    expect(Math.abs((into.points.at(-1) as Point)[0] - (out.points[0] as Point)[0]), "プールの下へ入る所と出る所の間").toBeGreaterThanOrEqual(APART.line);
    expect(closeRuns(into, out), "関所からプールへの線とプールから記録の倉庫への線が並んで近すぎる所").toEqual([]);
    expect(problems(SHAPES, shapes, "lines-close"), "形を変えた箱の図の並んで近すぎる線の知らせ").toEqual([]);

    const side = laid(IN_OUT_SIDE).edges;
    const enter = line(side, "a", "f");
    const leave = line(side, "f", "b");
    // F の左の辺に沿って、入る所と出る所を比べる
    expect(Math.abs((enter.points.at(-1) as Point)[1] - (leave.points[0] as Point)[1]), "F の左へ入る所と出る所の間").toBeGreaterThanOrEqual(APART.line);
    expect(closeRuns(enter, leave), "A から F への線と F から B への線が並んで近すぎる所").toEqual([]);
    expect(problems("in-out-side.dragon", IN_OUT_SIDE, "lines-close"), "並んで近すぎる線の知らせ").toEqual([]);
  });
});

/**
 * 名前の札から線までの離れ。線を 0.5px ごとに区切った点から札の四角までの最も短い離れで、線が札を通れば 0。
 * 描く処理の測り方を使わずに測り、描く処理と同じ誤りで通らないようにする
 */
function gapTo(points: Point[], r: Label): number {
  let least = Number.POSITIVE_INFINITY;
  for (const [k, q] of points.slice(1).entries()) {
    const p = points[k] as Point;
    const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 0.5));
    for (let i = 0; i <= n; i++) {
      const [x, y] = [p[0] + ((q[0] - p[0]) * i) / n, p[1] + ((q[1] - p[1]) * i) / n];
      least = Math.min(least, Math.hypot(Math.max(r.x - x, 0, x - (r.x + r.w)), Math.max(r.y - y, 0, y - (r.y + r.h))));
    }
  }
  return least;
}

/**
 * 図の名前のうち、自分の線の脇に無いか、別の線が自分の線までの `apart` 倍より近い名前。
 * 脇は札から自分の線までが、描く処理が最初に置く離れに札の高さを足した長さまでの所で、崩れの検査が線から離れた名前に数えない所。
 * 同じ道をもう一度引いた線は自分の線として比べない。離れは 0.5px ごとに測るので、0.5px より近い時だけ近いとする
 */
function strayLabels(layout: { edges: Edge[]; labels: Label[] }, apart = 1): string[] {
  const reach = Math.max(LOOK.label.offset - LOOK.label.h / 2, LOOK.label.side) + LOOK.label.h;
  const key = (e: Edge): string => JSON.stringify(e.points);
  return layout.labels.flatMap((l) => {
    const own = layout.edges.find((e) => e.step === l.step && e.event === l.event);
    if (!own) return [`段${l.step + 1}の名前「${l.text}」の線が無い`];
    const gap = gapTo(own.points, l);
    const nearer = layout.edges.filter((e) => key(e) !== key(own) && gapTo(e.points, l) < gap * apart - 0.5);
    return [
      ...(gap > reach ? [`段${l.step + 1}の名前「${l.text}」が自分の線から ${gap.toFixed(1)} 離れる`] : []),
      ...nearer.map((e) => `段${l.step + 1}の名前「${l.text}」に、自分の線 (${gap.toFixed(1)}) の ${apart} 倍より線 ${e.from} → ${e.to} (${gapTo(e.points, l).toFixed(1)}) が近い`),
    ];
  });
}

describe("構成図の線の名前は自分の線の脇に置き、別の線に乗せない (#3552)", () => {
  it("lane-label-beside-own-line", () => {
    const text = readFileSync(LANE_OVERLAP, "utf8");
    const layout = laid(text);
    // 図が名前を持つことを先に確かめる。持たなければ外れた名前0件は当たり前になる
    expect(layout.labels.map((l) => l.text), "行の下で重なっていた図の線の名前").toEqual(["一", "二", "三", "四"]);
    // 名前と別の線の間は、名前と自分の線の間の 2 倍空ける。2本の線の間の真ん中に近い名前は、どちらの線の名前か読めない。
    // 段4の名前は、中ほどの上の脇が段2の線と自分の線の間に在るので、線に沿って C と D の間の上の脇までずらす
    expect(strayLabels(layout, 2), "自分の線の脇に無いか、別の線が自分の線の 2 倍より近い名前").toEqual([]);
    expect(
      problems(LANE_OVERLAP, text).filter((line) => line.includes("に乗る") || line.includes("から離れて描かれる")),
      "別の線に乗るか自分の線から離れた名前の知らせ",
    ).toEqual([]);
    // 行へ戻る線と進む線と帰りの線を混ぜた図、行の間で下りる線と上る線、同じ列の間を縦に回る線、箱の同じ所へ入る線と出る線の図でも、
    // 名前は別の線に乗らない
    for (const [name, mixed] of [
      ["mixed.dragon", MIXED],
      ["between-rows.dragon", BETWEEN_ROWS],
      ["column.dragon", COLUMN],
      ["in-out-side.dragon", IN_OUT_SIDE],
    ] as const) {
      expect(laid(mixed).labels.length, `${name} が線の名前を持たない`).toBeGreaterThan(0);
      expect(problems(name, mixed, "label-on-line"), `${name} の別の線に乗る名前の知らせ`).toEqual([]);
    }
    // ほかの3つの図では、下の行へ下りる線の脇を行の間を回る道が塞ぐ時も、行の間を広げて自分の線が最も近い所に置き、離れた名前を知らせない。
    // 行の間を広げる図は、名前と別の線の間を名前と自分の線の間の 2 倍空ける。
    // 同じ列の間を縦に回る図は、段2と段3の名前の右を段5の道が自分の線の 1.5 倍ほどの所で回る。2 倍空く所が無いので、自分の線が最も近い所に置く
    for (const [name, mixed, apart] of [
      ["between-rows.dragon", BETWEEN_ROWS, 2],
      ["column.dragon", COLUMN, 1],
      ["in-out-side.dragon", IN_OUT_SIDE, 2],
    ] as const) {
      expect(strayLabels(laid(mixed), apart), `${name} の、自分の線の脇に無いか、別の線の方が近い名前`).toEqual([]);
      expect(problems(name, mixed, "label-off-line"), `${name} の離れた名前の知らせ`).toEqual([]);
    }
    // 混ぜた図の段6の名前は、行の下に並べて回る道の間に置く。確かめるのは`lane-label-near-own-line-between-lanes` (#3556)
    // 中ほどの脇が別の線に乗らないだけで近い時は、そこを採らず、自分の線が最も近い所を探す。
    // 3本の線が集まる図の段1の名前は、中ほどの右の脇が段2の線の横の区間の 2.5px 下に在る。
    // 段4の名前と、同じ箱の下に線が集まる図の段1の名前は、脇を段2の線の横の区間が塞ぐので、2つの帯の間を広げてその下に置き、
    // 段2の線との間を自分の線との間の 2 倍空ける。3本の線が集まる図の段1の線は、段2の線と合わさって通知へ入るので、2 倍空く所が無い
    for (const [file, apart] of [
      [CROWD_SIDE, 1],
      [SHARED_SIDE, 2],
    ] as const) {
      const crowd = laid(readFileSync(file, "utf8"));
      expect(crowd.labels.length, `${file} が線の名前を持たない`).toBeGreaterThan(0);
      expect(strayLabels(crowd, apart), `${file} の、自分の線の脇に無いか、別の線の方が近い名前`).toEqual([]);
    }
  });

  it("lane-label-own-line-nearest-before-beside", () => {
    // 脇に別の線から自分の線の 2 倍離れた所が無い時は、自分の線が最も近い所を探し、それも無い時だけ別の線を横切らない脇に置く (#3552)。
    // 横の線の中ほどの上の脇の右の 6px に、縦の線が下りて来る。脇を左へ 8px ずらすと、縦の線との間 (14px) が自分の線との間 (12px) より広くなるが、2 倍にはならない
    const own: Point[] = [
      [0, 100],
      [400, 100],
    ];
    const request = { step: 0, event: 0, text: "名前", points: own, color: "blue" as const, slide: 8 };
    const middle = placeLabel(request, { hard: [], soft: [] });
    const right = middle.x + middle.w + 6;
    const other: Point[] = [
      [right, 0],
      [right, 90],
    ];
    // 中ほどの脇は縦の線の方が近い。そこに置くと、縦の線の名前に読める
    expect(gapTo(other, middle), "中ほどの脇で縦の線が自分の線より近くない").toBeLessThan(gapTo(own, middle));
    const placed = placeLabel(request, { hard: [], soft: [], lines: [other], nearest: true });
    const edges: Edge[] = [
      { from: "a", to: "b", step: 0, event: 0, points: own },
      { from: "c", to: "d", step: 0, event: 1, points: other },
    ];
    expect(strayLabels({ edges, labels: [placed] }), "自分の線の脇に無いか、別の線の方が近い名前").toEqual([]);
    expect(gapTo(other, placed), "2 倍離れた所が無い形になっていない").toBeLessThan(2 * gapTo(own, placed));
  });

  it("lane-label-room-beside-detour", () => {
    const text = readFileSync(BESIDE_DETOUR, "utf8");
    const layout = laid(text);
    const asked = line(layout.edges, "api", "oracle");
    const detour = line(layout.edges, "api", "gateway");
    // 段2の線は真下へ下り、段4の線は列の右を縦に回る。どちらでもなければ、名前の右を回る線が無い図になる
    expect(asked.points.length, "APIサーバー → 価格オラクル が真下へ下りない").toBe(2);
    expect(detour.points.length, "APIサーバー → 決済代行 が列の右を回らない").toBe(4);
    expect(strayLabels(layout, 2), "自分の線の脇に無いか、別の線の方が近い名前").toEqual([]);
    // 名前と回る線の間は、名前と自分の線の間の 2 倍空ける。同じ離れだと、名前がどちらの線の名前か読めない
    const name = layout.labels.find((l) => l.step === asked.step && l.event === asked.event) as Label;
    expect(gapTo(detour.points, name), "名前と列の右を回る線の間").toBeGreaterThanOrEqual(2 * gapTo(asked.points, name) - 0.5);
    expect(problems(BESIDE_DETOUR, text), "列の右を回る線の脇に名前を置いた図の崩れの知らせ").toEqual([]);
  });

  it("lane-label-room-beside-row-lane", () => {
    const text = readFileSync(BESIDE_LANE, "utf8");
    const layout = laid(text);
    const asked = line(layout.edges, "api", "oracle");
    const lane = line(layout.edges, "api", "psp");
    // 段2の線は隣の箱へまっすぐ進み、段5の線は行の下を回る。どちらでもなければ、名前の下を回る線が無い図になる
    expect(asked.points.length, "APIサーバー → 価格オラクル がまっすぐ進まない").toBe(2);
    expect(lane.points.length, "APIサーバー → 決済代行 が行の下を回らない").toBe(4);
    const name = layout.labels.find((l) => l.step === asked.step && l.event === asked.event) as Label;
    expect(name.y, "段2の名前が線の下に無い").toBeGreaterThan((asked.points[0] as Point)[1]);
    // 名前と行の下を回る線の間は、名前と自分の線の間の 2 倍空ける
    expect(strayLabels(layout, 2), "自分の線の脇に無いか、別の線が自分の線の 2 倍より近い名前").toEqual([]);
    expect(problems(BESIDE_LANE, text), "行の下を回る線の上に名前を置いた図の崩れの知らせ").toEqual([]);
    // 道を行から離した分だけ図を下へ伸ばし、道と図の下の縁の間は、段2に名前の無い図と変えない。
    // 段5の名前は、道の下に置かれると図の下の縁を下げるので、比べる2つの図から外す
    const quiet = text.replace("api -> psp: 請求 [carry: coin]", "api -> psp [carry: coin]");
    const [named, plain] = [laid(quiet), laid(quiet.replace("api -> oracle: 為替レートを照会", "api -> oracle"))];
    const [moved, kept] = [(line(named.edges, "api", "psp").points[1] as Point)[1], (line(plain.edges, "api", "psp").points[1] as Point)[1]];
    expect(moved, "名前のために行の下を回る道を行から離さない").toBeGreaterThan(kept);
    expect(named.height - moved, "行の下を回る道と図の下の縁の間").toBeCloseTo(plain.height - kept, 1);
    // 行の上を回る道も同じで、名前の上を通る道を行から離し、離した分だけ行を下げて、道と図の上の縁の間を変えない
    const over = laid(overLoop(true));
    const bare = laid(overLoop(false));
    const back = line(over.edges, "c", "b");
    const [up, stay] = [line(over.edges, "b", "d"), line(bare.edges, "b", "d")];
    expect(up.points.length, "B → D が行の上を回らない").toBe(4);
    expect((up.points[1] as Point)[1], "B → D が行の上を回らない").toBeLessThan((back.points[0] as Point)[1]);
    const back_name = over.labels.find((l) => l.step === back.step && l.event === back.event) as Label;
    expect(back_name.y, "段3の名前が線の上に無い").toBeLessThan((back.points[0] as Point)[1]);
    expect(gapTo(up.points, back_name), "名前と行の上を回る道の間").toBeGreaterThanOrEqual(2 * gapTo(back.points, back_name) - 0.5);
    expect((back.points[0] as Point)[1], "名前のために行を下げない").toBeGreaterThan((line(bare.edges, "c", "b").points[0] as Point)[1]);
    expect((up.points[1] as Point)[1], "行の上を回る道と図の上の縁の間").toBeCloseTo((stay.points[1] as Point)[1], 1);
  });
});

describe("行の下を回る道が並ぶ時も、線の名前を自分の線の脇に置く (#3556)", () => {
  it("lane-label-near-own-line-between-lanes", () => {
    const layout = laid(MIXED);
    const six = layout.labels.find((l) => l.text === "六");
    if (!six) throw new Error("混ぜた図に段6の名前「六」が無い");
    // 「六」の線`A → C`の道の上には帰りの線`C → A`の道が、下には次の行へ進む線`A → F`の道が並び、右では`B → D`が下りる。
    // 決まった離れ (札の縁から線まで12px) では下の道`A → F`が自分の線より近いので、線へ寄せて置く。札が線に触れないよう、札どうしを離す間は空ける
    expect(gapTo(line(layout.edges, "a", "c").points, six), "「六」と自分の線 A → C の間").toBeGreaterThanOrEqual(LOOK.label.soft - 0.01);
    expect(strayLabels({ edges: layout.edges, labels: [six] }, 2), "自分の線の脇に無いか、別の線が自分の線の 2 倍より近い「六」").toEqual([]);
    for (const kind of ["label-off-line", "label-on-line"])
      expect(problems("mixed.dragon", MIXED, kind), `混ぜた図の${kind}の知らせ`).toEqual([]);
    // 線へ寄せて探しても、札と自分の線の間は`LOOK.label.soft`より狭めない。
    // 札を線の6px下から探させ、札の下の2pxを別の線が通ると、決まった離れから外では別の線が近いか札を横切る。
    // 線へ4px寄せた所は、別の線との間が自分の線との間の3倍になるが、自分の線に2pxまで近づく
    const own: Point[] = [
      [0, 100],
      [200, 100],
    ];
    const under = 100 + LOOK.label.soft + LOOK.label.h + 2;
    const near = placeLabel(
      { step: 0, event: 0, text: "六", points: own, color: "slate", side: "below", base: { x: 86, y: 100 + LOOK.label.soft }, slide: 0 },
      { hard: [], soft: [], lines: [[[0, under], [200, under]]], nearest: true },
    );
    expect(gapTo(own, near), "線へ寄せて探した札と自分の線の間").toBeGreaterThanOrEqual(LOOK.label.soft - 0.01);
  });
});
