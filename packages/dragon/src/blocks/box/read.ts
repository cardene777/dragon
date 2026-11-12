/**
 * `box` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import type { BlockReading } from "../block";
import { attrs, num, shown } from "../../print-kit";
import { fail, isOneOf, readDeclared } from "../../read-kit";
import type { Box, DiagramModel } from "../../schema";
import { readLook } from "../color/read";
import { declareRegion } from "../group/read";
import { LANE_ATTRS } from "../item/block";
import { LANE_MOST } from "../line/block";
import { urlOf } from "../link/read";

/** 配管の図 (#3389) の箱は関係者で、種類は行から導くので、書ける属性は形を替える `icon` だけ */
export const PARTY_ATTRS = ["icon"] as const;

/** 列の図の箱の `order` に書ける並べ方。`none` は順番の無い置き場 (#3351) */
export const ORDERS = ["none"] as const;

/** 列の図の箱の `limit` に書ける値。1 から 1 列に並べられる札の数 (`LANE_MOST`) までの整数 (#3624) */
const LIMIT = /^[1-9][0-9]?$/u;

export interface BoxMessages {
  undeclaredBox: (id: string) => string;
  /** 箱を宣言しない図で、線に出た名前 `id` が前に出た名前 `like` と 1 字だけ違う (#3438)。誤りでなく知らせの文 */
  similarBox: (id: string, like: string) => string;
  noBoxes: string;
  /** 列の図の箱だけの属性 (`order` と `limit`) を、別の種類の図の箱に書いた (#3351、#3624) */
  lineupOnlyAttr: (key: string) => string;
  /** 箱の `order` に `none` 以外を書いた */
  orderNone: string;
  /** 箱の `limit` に 1 から `most` までの整数でない値を書いた (#3624) */
  limitRange: (most: number) => string;
}

/** 箱の宣言の行。使う人が足した箱のブロックの箱は、行の頭にそのブロックの名前 (`+<名前>`) を書く (#3399) */
const declareBox = (b: Box): string =>
  `${b.block ?? "box"} ${b.id}${shown(b.id, b.name)}${attrs([
    ["note", b.sub],
    ["color", b.color],
    ["icon", b.icon],
    ["link", b.link],
    ["order", b.order],
    ["limit", num(b.limit)],
  ])}`;

/**
 * 区画と箱の宣言の塊。塊どうしは空行で区切る。
 * 箱は JSON の並びのまま書き、同じ区画の箱が続く所を 1 つの `group … end` にする。区画の箱が飛び飛びの時は同じ `group` を開き直す。
 * 区画の並びが箱の現れる順と違う時と、箱の無い区画がある時は、先に全ての区画を中の無い `group … end` で宣言してから開き直す
 */
function declarations(diagram: DiagramModel): string[] {
  const regions = diagram.regions ?? [];
  const runs: { region?: string; boxes: Box[] }[] = [];
  for (const b of diagram.boxes) {
    const last = runs.at(-1);
    if (last && last.region === b.region) last.boxes.push(b);
    else runs.push({ ...(b.region !== undefined ? { region: b.region } : {}), boxes: [b] });
  }
  const opened = [...new Set(runs.flatMap((run) => (run.region === undefined ? [] : [run.region])))];
  const inOrder = opened.length === regions.length && opened.every((id, i) => regions[i]?.id === id);
  const declared = new Set<string>();
  const blocks: string[] = [];
  if (!inOrder) {
    for (const r of regions) {
      blocks.push(`${declareRegion(r)}\nend`);
      declared.add(r.id);
    }
  }
  for (const run of runs) {
    const lines = run.boxes.map(declareBox);
    if (run.region === undefined) {
      blocks.push(lines.join("\n"));
      continue;
    }
    const region = regions.find((r) => r.id === run.region);
    const open = declared.has(run.region) || !region ? `group ${run.region}` : declareRegion(region);
    declared.add(run.region);
    blocks.push([open, ...lines.map((line) => `  ${line}`), "end"].join("\n"));
  }
  return blocks;
}

export const reading: BlockReading<BoxMessages> = {
  read: {
    // `box` の行。開いている `group` の中なら、その区画に置く
    box: (source, state) => {
      state.beforeSteps(source);
      const declared = readDeclared(source, "box", state.kind === "lineup" ? LANE_ATTRS : state.kind === "pipe" ? PARTY_ATTRS : (state.attrs.box ?? []), state.m);
      state.claim(source, declared.id, declared.idAt);
      state.figure.firstBox ??= source;
      const { note, ...look } = readLook(source, declared.attrs, state.m);
      const link = declared.attrs.get("link");
      const order = declared.attrs.get("order");
      if (order && state.kind !== "lineup") throw fail(source, order.at, state.m.lineupOnlyAttr("order"));
      if (order && !isOneOf(ORDERS, order.value)) throw fail(source, source.text.indexOf(order.value, order.at + "order".length), state.m.orderNone);
      // 上限の値の誤り (0、13、2.5、many) は、値でなく limit の語の所を指す。書けない図の種類に書いた誤りと同じ所を指すため
      const limit = declared.attrs.get("limit");
      if (limit && state.kind !== "lineup") throw fail(source, limit.at, state.m.lineupOnlyAttr("limit"));
      if (limit && (!LIMIT.test(limit.value) || Number(limit.value) > LANE_MOST)) throw fail(source, limit.at, state.m.limitRange(LANE_MOST));
      const group = state.figure.group;
      state.figure.boxes.push({
        id: declared.id,
        name: declared.name ?? declared.id,
        ...(note !== undefined ? { sub: note } : {}),
        ...look,
        ...(group ? { region: group.id } : {}),
        ...(link ? { link: urlOf(source, "link", link, state.m) } : {}),
        ...(order ? { order: order.value as (typeof ORDERS)[number] } : {}),
        ...(limit ? { limit: Number(limit.value) } : {}),
      });
    },
  },
  print: { declare: declarations },
  messages: {
    ja: {
      undeclaredBox: (id) => `${id} という箱は宣言していない`,
      similarBox: (id, like) => `${id} は ${like} と 1 字だけ違う別の箱になる。同じ箱なら名前を揃える`,
      noBoxes: "箱を 1 つ以上宣言する",
      lineupOnlyAttr: (key) => `${key} は lineup (列の図) の box にだけ書ける`,
      orderNone: "order には none だけを書ける。順番の無い置き場にする箱に書く",
      limitRange: (most) => `limit には 1 から ${most} までの整数を書く。その箱に並べられる札の数の上限になる`,
    },
    en: {
      undeclaredBox: (id) => `No box named ${id} is declared`,
      similarBox: (id, like) => `${id} differs from ${like} by one character and becomes another box. Use one name if they are the same box`,
      noBoxes: "Declare at least one box",
      lineupOnlyAttr: (key) => `${key} can be written only on box lines of lineup diagrams`,
      orderNone: "order takes only none. Write it on a box that holds chips in no order",
      limitRange: (most) => `limit takes a whole number from 1 to ${most}, the most chips the box holds`,
    },
  },
};
