/**
 * 箱のブロック (#3345)。
 *
 * 最初の `step` より前の `box <名札> as <名前> [note: <下の字>]` の行で、図に登場する物を 1 つ置く。
 * 名札は線や処理で箱を指す時の呼び名で、図には名前と下の字が出る。`as <名前>` を省くと、名札がそのまま名前になる。
 * 見た目の属性 (色の役と絵) は色の役のブロックの `readLook`、飛び先は飛び先のブロックの `urlOf` で読む。
 * 開いている区画 (`group` から `end` まで) の中の箱はその区画に置く。列の図の `box` の行は列を宣言し、書ける属性は `LANE_ATTRS` だけ。
 * 区画と箱の宣言は書き戻す時に 1 つの塊に混ざるので、宣言の塊はこのブロックが区画のブロックの `declareRegion` で区画の行も含めて書く。
 */
import { attrs, shown } from "../../print-kit";
import { readDeclared } from "../../read-kit";
import type { Box, Diagram } from "../../schema";
import type { Block } from "../block";
import { readLook } from "../color/block";
import { declareRegion } from "../group/block";
import { urlOf } from "../link/block";

/** 列の図 (#3239) の `box` の行に書ける属性の鍵。列は絵柄と飛び先を持たない */
export const LANE_ATTRS = ["note", "color"] as const;

export interface BoxMessages {
  undeclaredBox: (id: string) => string;
  noBoxes: string;
}

const declareBox = (b: Box): string =>
  `box ${b.id}${shown(b.id, b.name)}${attrs([
    ["note", b.sub],
    ["color", b.color],
    ["icon", b.icon],
    ["link", b.link],
  ])}`;

/**
 * 区画と箱の宣言の塊。塊どうしは空行で区切る。
 * 箱は JSON の並びのまま書き、同じ区画の箱が続く所を 1 つの `group … end` にする。区画の箱が飛び飛びの時は同じ `group` を開き直す。
 * 区画の並びが箱の現れる順と違う時と、箱の無い区画がある時は、先に全ての区画を中の無い `group … end` で宣言してから開き直す
 */
function declarations(diagram: Diagram): string[] {
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

export const block: Block<BoxMessages> = {
  name: "box",
  rank: 20,
  attach: { how: "place" },
  words: { heads: ["box"], attrs: { box: ["note"] } },
  shape: {
    definitions: {
      box: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name"],
        properties: {
          id: { $ref: "#/definitions/id" },
          name: { $ref: "#/definitions/text" },
          sub: { $ref: "#/definitions/text" },
          color: { $ref: "#/definitions/color" },
          icon: { $ref: "#/definitions/icon" },
          region: { $ref: "#/definitions/id" },
          link: { description: "飛び先。描いた図ではこの箱がここへの link になる", $ref: "#/definitions/url" },
        },
      },
    },
  },
  read: {
    // `box` の行。開いている `group` の中なら、その区画に置く
    box: (source, state) => {
      state.beforeSteps(source);
      const declared = readDeclared(source, "box", state.kind === "lineup" ? LANE_ATTRS : (state.attrs.box ?? []), state.m);
      state.claim(source, declared.id, declared.idAt);
      state.figure.firstBox ??= source;
      const { note, ...look } = readLook(source, declared.attrs, state.m);
      const link = declared.attrs.get("link");
      const group = state.figure.group;
      state.figure.boxes.push({
        id: declared.id,
        name: declared.name ?? declared.id,
        ...(note !== undefined ? { sub: note } : {}),
        ...look,
        ...(group ? { region: group.id } : {}),
        ...(link ? { link: urlOf(source, "link", link, state.m) } : {}),
      });
    },
  },
  print: { declare: declarations },
  messages: {
    ja: { undeclaredBox: (id) => `${id} という箱は宣言していない`, noBoxes: "箱を 1 つ以上宣言する" },
    en: { undeclaredBox: (id) => `No box named ${id} is declared`, noBoxes: "Declare at least one box" },
  },
};
