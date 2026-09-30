/**
 * 見えない支えの箱を外せないことの検証 (#2511)。
 *
 * 読み取り値だけを持つ部品は `_h` という 1×1 の見えない箱
 * (`w: 1, h: 1, visibleIf: "0"`) を 1 つ置く。 箱が 1 つも無いと帯の位置が決まらず、
 * 読み取り値だけが宙に浮く。
 *
 * ## 点検の知らせのほうが誤っている
 *
 * 描画側の点検はこの箱をこう知らせる。
 *
 * ```
 * [cdl validate] warn: node "_h" がどの phase でも activate されていない (unused、 typo の可能性)
 * ```
 *
 * **従って消すと部品が壊れる**。 知らせを出しているのは読み取り専用の依存 (`cdl`) で、
 * 本 repo からは直せない。 だから **知らせが誤りであることをここに書いて残す** =
 * 次に見た人が同じ道を辿らずに済む。
 *
 * ## 外すと描けなくなることで確かめる
 *
 * 「見えないから効いていない」 を否定するには、外した時に何かが変わることを見ればよい。
 * 外すと描画側が図を受け付けず、`[cdl] empty: node が 0 件です` で止まる。
 *
 * **板では確かめられない** (#2681)。 0.93.0 から描くものが 1 つも無い図は最小の板を返すため、
 * 支えが 1 つあっても無くても板は `{-60,-60,120,120}` で同じになる。
 * 板で見ていた間は 17 枚すべてが「支えが要らない」 と判定されていた = 支えを外せば
 * 描画が止まるのに、検査は外してよいと言っていた。
 *
 * 対象は実物から導く = 部品の名前を並べると、後から足した部品が検査を受けない。
 */
import { describe, it, expect } from "vitest";
import { layout, validate } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as PartsMod from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";

/** 見えない支えの箱の名前 */
const 支えの名 = "_h";

/** `_h` を持つ部品を実物から集める */
function 支えを持つ部品(): Array<{ name: string; diagram: CdlDiagram }> {
  const out: Array<{ name: string; diagram: CdlDiagram }> = [];
  for (const [name, val] of Object.entries(PartsMod as Record<string, unknown>)) {
    if (!val || typeof val !== "object") continue;
    const d = val as Partial<CdlDiagram>;
    if (typeof d.id !== "string" || !Array.isArray(d.nodes)) continue;
    if (d.nodes.some((n) => n.id === 支えの名)) {
      out.push({ name, diagram: d as CdlDiagram });
    }
  }
  return out;
}

/**
 * 描画側が図を受け付けるか。 受け付けなければ投げる。
 *
 * **`layout` では足りない**。 `layout` は節が 0 件でも最小の板を返す。 止めるのは
 * 描画の前に通る検査のほうで、`[cdl] empty: node が 0 件です` で投げる。
 */
function 描ける(d: CdlDiagram): void {
  validate(d);
  layout(d);
}

describe("見えない支えの箱 (#2511)", () => {
  const 部品 = 支えを持つ部品();

  it("支えを持つ部品を 1 枚以上集めている (走査の生存確認)", () => {
    // 0 枚だと、下の 1 件が何も確かめずに通る
    expect(部品.length, `${支えの名} を持つ部品を 1 枚も集められていない`).toBeGreaterThan(0);
  });

  it("支えを外すと描けなくなる (見えないが効いている)", () => {
    // 支えを外した図が描画側を通ってしまう部品を集める。 通るなら支えは要らない
    const 通る: string[] = [];
    for (const { diagram } of 部品) {
      const 外した = {
        ...diagram,
        nodes: diagram.nodes.filter((n) => n.id !== 支えの名),
      };
      try {
        描ける(外した);
        通る.push(diagram.id);
      } catch {
        // 期待どおり止まった
      }
    }
    expect(
      通る,
      `${支えの名} を外しても描ける部品がある (${部品.length} 枚を走査)。` +
        ` その部品では支えが要らない = 外すか、要る理由を書き足すかを決める`,
    ).toEqual([]);
  });

  it("支えを付けた形は描ける (対照)", () => {
    // 上の 1 件は「外すと止まる」 を見る。 付けた形も止まるなら、支えとは無関係に
    // 止まっているだけになる = 対照を置かないと区別できない
    const 止まる: string[] = [];
    for (const { diagram } of 部品) {
      try {
        描ける(diagram);
      } catch (e) {
        止まる.push(`${diagram.id} (${(e as Error).message.split("\n")[0]})`);
      }
    }
    expect(止まる, `支えを付けた形でも描けない部品がある`).toEqual([]);
  });

  it("支えは見えない大きさで置かれている", () => {
    // 見える大きさで置くと、それは支えではなく図の一部になる
    const おかしい: string[] = [];
    for (const { diagram } of 部品) {
      const n = diagram.nodes.find((x) => (x as { id?: string }).id === 支えの名) as
        | { w?: number; h?: number; visibleIf?: string }
        | undefined;
      if (n === undefined) continue;
      if (n.w !== 1 || n.h !== 1 || n.visibleIf !== "0") {
        おかしい.push(`${diagram.id} (w=${n.w} h=${n.h} visibleIf=${n.visibleIf})`);
      }
    }
    expect(おかしい, `${支えの名} が見えない大きさで置かれていない部品がある`).toEqual([]);
  });
});
