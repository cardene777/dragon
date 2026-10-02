/**
 * 行を持つ図 (`type: record`) の矢印を 2 通りに見分ける (#2782)。
 *
 * 表のつながりと移り変わりは 1 つの図種に畳んだので、**図種では分けられない**。
 * 分けるのは矢印の端。
 *
 * | 端 | 何を表すか | 順番 |
 * |---|---|---|
 * | 棒 / 三又 / 丸 (`one` / `many` / `zero-one` / `zero-many`) | 個数 | 同時に成り立つ |
 * | 開いた矢 (`open`) ほか | 移り変わり | 順番を持つ |
 *
 * **この表を 2 箇所に書かない** = 片方だけ直した日に、2 つの検査が別の母集団を見る。
 */
import type { CdlDiagram } from "@cardenelabs/cdl";

/** 個数を表す端。 描く側の `ER_CARDINALITY_HEAD` が作る 4 種 */
export const 個数の端: ReadonlySet<string> = new Set(["one", "many", "zero-one", "zero-many"]);

/** 個数を表す端を持つ矢印か。 移り変わりの矢印 (開いた矢) をここで外す */
export const 個数を表す矢印 = (e: { head?: string }): boolean =>
  e.head !== undefined && 個数の端.has(e.head);

/**
 * 表のつながりを描いた図か。
 *
 * 見本帳には 2 つの作り方の図が並ぶ。 記法から作った図は `type: record` を持ち、
 * 組み立て器 (`er()`) から作った図は描く側の名前 `er` をそのまま持つ
 * (#2782 で畳んだのは記法の側だけで、描く側の組み立て器の名前は変えていない)。
 *
 * 記法から作った図は個数を表す矢印で見分ける。 組み立て器から作った図は名前で足りる。
 */
export const 表のつながりの図 = (d: CdlDiagram): boolean =>
  d.type === "er" ||
  (d.type === "record" && d.edges.some((e) => 個数を表す矢印(e)));
