import type { RowMark } from "@cardenelabs/cdl";

/**
 * 行頭の印を dragon の語で決める (#2782)。
 *
 * 描画側が持つ印は 3 軸しかない。 形 (四角 / 山形) と 塗り (塗る / 中空) と
 * 名前の下線で、この 3 軸に 1 対 1 で当たる語を dragon 自身が持つ。
 *
 * | 語 | 軸 | 意味 |
 * |---|---|---|
 * | `鍵` | 名前に下線を引く | その行で箱を見分ける |
 * | `外` | 行頭を山形にする | その行は箱の外とつながる |
 * | `条件` | 行頭を中空にする | その行は条件が揃った時だけ効く |
 *
 * 畳む前は 図種ごとに語を持っていた (表の図は `pk` / `fk` / `opt`、移り変わりの図は
 * `entry` / `exit` / `do` / `internal`)。 2 つの語彙は同じ 2 軸の格子を別の名前で
 * 呼んでいただけで、格子の 4 隅は 1 対 1 に重なる。
 *
 * |  | 塗る | 中空 |
 * |---|---|---|
 * | 四角 | 語なし / `do` | `条件` / `opt` / `internal` |
 * | 山形 | `外` / `fk` / `entry` | `外 条件` / `fk opt` / `exit` |
 *
 * 古い語から dragon の語への読み替えは本 file の `行頭の語へ読み替える` が持ち、
 * 読み取りの入口 (記法 / JSON の 2 経路) が通す。 印にする時点で古い語は 1 つも残っていない。
 */
export const 行頭の語 = ["鍵", "外", "条件"] as const;

export type 行頭の語 = (typeof 行頭の語)[number];

/**
 * 行頭の印の古い語から dragon の 3 語への読み替え (#2782)。
 *
 * **ここは図種の別名と向きが違う**。 図種の `er` / `state` は綴りごと消したが (畳んだ先の
 * `record` が別の名前なので、古い綴りを残すと「名前を無くす」 という目的が達たない)、
 * 行頭の語は残す = 語が指す印は 1 つに決まっており、`pk` と `鍵` は同じ絵になる。
 *
 * 読み替え先は空白区切りの語。 `exit` だけが 2 語になる = 山形 + 中空 の 2 軸を同時に動かす。
 */
const 行頭の語の別名: ReadonlyMap<string, string> = new Map([
  ["pk", "鍵"],
  ["fk", "外"],
  ["opt", "条件"],
  ["entry", "外"],
  ["exit", "外 条件"],
  ["do", ""],
  ["internal", "条件"],
]);

/**
 * 1 行分の印の語を dragon の 3 語に揃える (#2782)。
 *
 * 1 行に語を 2 つ以上書ける (`pk fk` の形) ので、語ごとに引いて繋ぎ直す。
 * 知らない語はそのまま通す = 組み立て側が無視するため、書いた人が気付ける形は変わらない。
 *
 * **読み取りの入口は 3 経路ある** (縦に並べた形 / 中括弧の形 / JSON)。 3 つとも本 file の
 * この関数を通す = 1 経路でも素通りさせると、その書き方だけ古い語が印を持たないまま通る
 * (中括弧の形が実際にそうなっていた)。
 */
export function 行頭の語へ読み替える(値: string): string {
  const 語 = 値.trim().split(/\s+/).filter(Boolean);
  if (語.length === 0) return 値;
  return 語
    .map((w) => 行頭の語の別名.get(w) ?? w)
    .filter((w) => w !== "")
    .join(" ");
}

/**
 * 書いた語を行頭の印にする (#2782)。
 *
 * **語を書かない行にも既定の印を付ける**。 四角 + 塗る + 下線なしで、箱の中で完結して
 * 常に在る行を表す。
 *
 * 印なしにすると、書かなかった行だけ行頭が空いて **群の区切りと見分けが付かなくなる**
 * (群の区切りは行頭の印が持っている)。 畳む前の表の図が同じ理由で既定を配っていた。
 */
export function 行頭の印にする(
  marks: readonly (string | { mark: string; tone?: "primary" | "muted" })[],
  行数: number,
): (RowMark | null)[] {
  return Array.from({ length: 行数 }, (_, i) => {
    const 値 = marks[i] ?? "";
    const 語 = (typeof 値 === "string" ? 値 : 値.mark).trim().split(/\s+/).filter(Boolean);
    return {
      shape: 語.includes("外") ? ("chevron" as const) : ("square" as const),
      filled: !語.includes("条件"),
      ...(typeof 値 === "object" && 値.tone !== undefined ? { tone: 値.tone } : {}),
      ...(語.includes("鍵") ? { underline: true } : {}),
    };
  });
}

/**
 * 箱を見分ける行を上にまとめる (#2782)。
 *
 * `鍵` を書いた行を先に、残りを後に置く。 畳む前の表の図が同じ並べ替えをしていた
 * (組み立て器 `er()` と同じ形)。 `鍵` を 1 つも書かない図では並びが 1 行も動かない。
 *
 * **空の行では群を分けない**。 群の区切りは行頭の印が持っており、空の行を挟むと
 * 行の間隔が不揃いになる (描画側が cdl 0.23.0 で空の行をやめた)。
 */
export function 鍵の行を上にまとめる(
  rows: readonly string[],
  印: readonly (RowMark | null)[],
): { rows: string[]; rowMarks: (RowMark | null)[] } {
  const 鍵: number[] = [];
  const 値: number[] = [];
  rows.forEach((_, i) => ((印[i]?.underline === true ? 鍵 : 値).push(i)));
  const 並び = [...鍵, ...値];
  return {
    rows: 並び.map((i) => rows[i] ?? ""),
    rowMarks: 並び.map((i) => 印[i] ?? null),
  };
}

/**
 * 行頭の印を読む図種か (#2782)。
 *
 * **図種の名前を案内の文に写さない**。 読む図種を足した日に案内だけが古くなるため、
 * 知らせを組む側はここに聞く (`compile.ts` の `行頭の印を読む図種`)。
 *
 * 畳む前は 2 図種 (表の図 / 移り変わりの図) が別の語彙で読んでいた。 クラス図は行を
 * 組み立て器が作るので読まない。
 */
export function 行頭の印を読むか(type: string): boolean {
  return type === "record";
}
