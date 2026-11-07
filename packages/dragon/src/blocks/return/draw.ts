/**
 * 呼び出しの管の描き方 (#3389、#3398)。
 *
 * 呼んだ者ごとに 1 本の本管を引き、呼ぶ相手ごとに枝を分ける。管は太い外の管で描き、枝の根元に弁を置く。
 * 開いている呼び出しは、呼んだ者を出た所から呼ばれた者の名札まで呼び出しの色 (青) で光り、開いた時刻に弁の取っ手が倒れる。
 * 戻ると光が消えて取っ手が立つ。一番外の呼び出しが戻って全てが確定した段は、送り手から出る管を確定の色 (緑) で光らせる。
 * 呼び出しの種類の見た目 (処理を借りる管の 2 本線、書き込めない管の細さ) は呼び出しの種類のブロックの描き方 (`call/draw.ts`) が持つ。
 * この file は配管の図を描く部品 (`render/pipe.ts`) だけが読み、見本帳を開いた時に読む塊に入れない
 */
import type { PipeMain } from "../../kinds/pipe/layout";
import type { Point } from "../../layout/scene";
import { r1 } from "../../render/parts";
import { kindCore } from "../call/draw";
import { cs } from "../color/draw";

/** 点の並びの道。角は丸めず、管の継ぎ目の形のまま描く */
const lineOf = (points: readonly Point[]): string => `M ${points.map((p) => `${r1(p[0])} ${r1(p[1])}`).join(" L ")}`;

/** 本管と枝の外の管 */
export function callCase(main: PipeMain): string {
  const d = [main.points, ...main.branches.map((b) => b.points)]
    .filter((p) => p.length > 1)
    .map(lineOf)
    .join(" ");
  return `<path class="dg-pp-ccase" d="${d}"/>`;
}

/**
 * 光る管。`attrs` は部品の印 (`data-pipe-branch`、`data-pipe-call`、`data-pipe-pipe`)、`shown` は見える間の style。
 * 太さを `stroke-width` に書き、確定した段の管 (`good`) は確定の色で描く。`draw` を渡すと、管がその style の動きで呼んだ者の側から光っていく
 */
export function litPipe(lane: { kind: string; width: number; points: Point[] }, attrs: string, shown: string, good = false, draw = ""): string {
  const d = lineOf(lane.points);
  const drawn = draw ? ` pathLength="1" stroke-dasharray="1"` : "";
  return (
    `<g class="dg-a" style="${shown}"><path${attrs} class="dg-pp-cflow${draw ? " dg-a" : ""}" style="${cs(good ? "green" : "blue")}${draw ? `;${draw}` : ""}"${drawn} stroke-width="${lane.width}" d="${d}"/>` +
    `${kindCore(lane, d)}</g>`
  );
}
