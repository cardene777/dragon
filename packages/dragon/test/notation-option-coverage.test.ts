/**
 * 記法の選択肢が全部カタログに載っていることを、図のデータから見る (#2581)。
 *
 * ## 語ではなくデータを歩く
 *
 * #2579 で「一覧の定数の写しを値で走査すると飽和する」 と記録した。 key の名前で値を集めると
 * 別の概念が混ざる = `kind` で集めると部品の種類 (`percent-ring`) と伝言の種類 (`call`) が
 * 入り、`fill` で集めると色が入る。 語は概念を区別しないので、結果は 0 件でも該当ありでもなく
 * **判定していない** 状態になる (`rules/quality.md § 散文の語を判定材料にしない`)。
 *
 * カタログの図は組み上がった実体で読める。 値が **どの場所に居るか** まで見れば概念は混ざらない。
 *
 * ## 2 方向で突き合わせる
 *
 * | 向き | 何を見るか |
 * |---|---|
 * | カタログ → 一覧 | カタログが一覧に無い値を書いていない |
 * | 一覧 → カタログ | 一覧の値が、明示の値か描く側の既定値のどちらかで覆われている |
 *
 * 片方だけでは足りない。 前者だけなら選択肢を 1 つも見せていない図の集まりでも通り、後者だけなら
 * 綴りを間違えた値が増えても通る。
 *
 * ## 既定値は書かない図が見せている
 *
 * `edgeReveal` の `phase` と `relationFocus` の `off` は既定値なので、明示する図が 1 枚も無い。
 * 書かない図がその選択肢を見せているため、覆われていない扱いにしない。 既定値は描く側の定数から
 * 読む = ここに `phase` と書くと、描く側が既定を変えた時にこの検査だけが古い前提で測る。
 *
 * ## 場所の表は手で持ち、走査で裏取りする
 *
 * 場所は型 (`CdlDiagram`) が決めるが、型は実行時に消えるので実データからしか集められない。
 * そこで表は手で持ち、§ 場所の表が実物と一致している が走査の結果と突き合わせる。
 * 新しい口 (`Tone` を取る field の追加 等) が増えたらそこが落ちる。
 */
import { describe, it, expect } from "vitest";
import {
  TONES,
  EDGE_STYLES,
  NODE_KINDS,
  EDGE_HEADS,
  EDGE_HEAD_FILLS,
  EDGE_REVEALS,
  RELATION_FOCUSES,
  EDGE_REVEAL_DEFAULT,
  RELATION_FOCUS_DEFAULT,
  EDGE_HEAD_DEFAULT,
  EDGE_HEAD_FILL_DEFAULT,
} from "@cardenelabs/cdl";

import { 全図 } from "./support/responsive-accepted";

/**
 * 図を歩いて、場所ごとに現れた文字列を集める。
 * 場所は `nodes[].kind` の形にする (配列は `[]`、 添字は畳む)。
 */
function 場所ごとの値(): Map<string, Set<string>> {
  const 出 = new Map<string, Set<string>>();
  const 歩く = (o: unknown, 場所: string): void => {
    if (Array.isArray(o)) {
      for (const e of o) 歩く(e, 場所 + "[]");
      return;
    }
    if (o === null || typeof o !== "object") return;
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      const p = 場所 ? `${場所}.${k}` : k;
      if (typeof v === "string") {
        const s = 出.get(p) ?? new Set<string>();
        s.add(v);
        出.set(p, s);
      }
      歩く(v, p);
    }
  };
  for (const d of 全図) 歩く(d, "");
  return 出;
}

const 値 = 場所ごとの値();

/**
 * 記法の選択肢の一覧と、それが現れる場所と、書かない図が見せる既定値。
 *
 * `既定` を持たない一覧は、全ての値が明示で現れているもの (描く側も既定の定数を出していない)。
 */
const 選択肢: ReadonlyArray<{
  名: string;
  一覧: readonly string[];
  場所: readonly string[];
  既定?: string;
}> = [
  {
    名: "TONES",
    一覧: TONES,
    場所: [
      "edges[].tone",
      "nodes[].chartData[].tone",
      "nodes[].ganttData[].tone",
      "nodes[].tone",
    ],
  },
  { 名: "EDGE_STYLES", 一覧: EDGE_STYLES, 場所: ["edges[].style"] },
  { 名: "NODE_KINDS", 一覧: NODE_KINDS, 場所: ["nodes[].kind"] },
  {
    名: "EDGE_HEADS",
    一覧: EDGE_HEADS,
    場所: ["edges[].head", "edges[].tailHead"],
    既定: EDGE_HEAD_DEFAULT,
  },
  {
    名: "EDGE_HEAD_FILLS",
    一覧: EDGE_HEAD_FILLS,
    場所: ["edges[].headFill", "edges[].tailHeadFill"],
    既定: EDGE_HEAD_FILL_DEFAULT,
  },
  { 名: "EDGE_REVEALS", 一覧: EDGE_REVEALS, 場所: ["edgeReveal"], 既定: EDGE_REVEAL_DEFAULT },
  {
    名: "RELATION_FOCUSES",
    一覧: RELATION_FOCUSES,
    場所: ["relationFocus"],
    既定: RELATION_FOCUS_DEFAULT,
  },
];

/**
 * 描く側に在るが、見本をまだ置いていない値。
 *
 * 0.125.0 で増えた時間軸の丸い番号。 時間軸の番号を丸で描く #2832 が見本の時間軸で使い始めるまで外す。
 */
const 描く側に在るが見本をまだ置いていない値: Readonly<Record<string, readonly string[]>> = {
  NODE_KINDS: ["timeline-number"],
};

/** その一覧の場所に現れた値を合わせる。 */
function 明示の値(場所: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const p of 場所) for (const v of 値.get(p) ?? []) out.add(v);
  return out;
}

describe("記法の選択肢が全部カタログに載っている (#2581)", () => {
  it("図と場所を集められている (空振り防止)", () => {
    expect(全図.length, "カタログの図を 1 枚も集められていない").toBeGreaterThan(0);
    expect(値.size, `図 ${全図.length} 枚を歩いて場所を 1 件も集められていない`).toBeGreaterThan(0);
  });

  for (const { 名, 一覧, 場所, 既定 } of 選択肢) {
    it(`${名} がカタログに無い値を持たない`, () => {
      const 一覧外 = [...明示の値(場所)].filter((v) => !一覧.includes(v));
      expect(
        一覧外,
        `${名} の場所 (${場所.join(" / ")}) に一覧外の値がある。 綴り違いか、描く側が値を消した`,
      ).toEqual([]);
    });

    it(`${名} の選択肢が全部カタログに出ている`, () => {
      /*
       * 既定値は書かない図が見せているため、明示の値に足して覆う。
       * 覆われない値は「その選択肢を 1 枚も見せていない」 ことを意味する。
       */
      const 出ている = 明示の値(場所);
      if (既定 !== undefined) 出ている.add(既定);
      const 宣言した未使用 = 描く側に在るが見本をまだ置いていない値[名] ?? [];
      const 未使用 = 一覧.filter((v) => !出ている.has(v) && !宣言した未使用.includes(v));
      expect(
        未使用,
        `${名} の選択肢がカタログに 1 枚も無い (一覧 ${一覧.length} 件 / 出ている ${出ている.size} 件)`,
      ).toEqual([]);
    });
  }

  it("見本をまだ置いていないと宣言した値が一覧に在り、カタログには出ていない", () => {
    for (const [名, 宣言した値] of Object.entries(描く側に在るが見本をまだ置いていない値)) {
      const 項目 = 選択肢.find((item) => item.名 === 名);
      expect(項目, `${名} は選択肢の一覧に無い`).toBeDefined();
      if (項目 === undefined) continue;
      const 一覧外 = 宣言した値.filter((value) => !項目.一覧.includes(value));
      expect(一覧外, `${名} に無い値を未使用として宣言している: ${一覧外.join(", ")}`).toEqual([]);
      const 出ている = 明示の値(項目.場所);
      const 見本に在る = 宣言した値.filter((value) => 出ている.has(value));
      expect(見本に在る, `${名} の見本に出た値が未使用の宣言に残っている: ${見本に在る.join(", ")}`).toEqual([]);
    }
  });

  it("場所の表が実物と一致している", () => {
    /*
     * 表を手で持つと、記法に口が増えた時に追記を忘れて無検査のまま残る。
     * 値が全部その一覧に収まる場所を走査で集め、表と突き合わせる。
     *
     * 逆向き (走査から表を作る) にはしない = そうすると何を書いても通る検査になり、
     * 口が増えたことに気付けない。
     */
    for (const { 名, 一覧, 場所 } of 選択肢) {
      const 走査 = [...値.entries()]
        .filter(([, s]) => s.size > 0 && [...s].every((v) => 一覧.includes(v)))
        .map(([p]) => p)
        .sort();
      expect(
        走査,
        `${名} の場所が表とずれている。 記法に口が増えたか、場所が消えた (歩いた場所 ${値.size} 種)`,
      ).toEqual([...場所].sort());
    }
  });
});
