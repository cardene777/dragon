/**
 * 行を持つ図 (`type: record`) の矢印を 2 通りに見分ける (#2782)。
 *
 * 表のつながりと移り変わりは 1 つの図種に畳んだので、**図種では分けられない**。
 * 分けるのは矢印の端。
 *
 * | 端 | 何を表すか | 順番 |
 * |---|---|---|
 * | 棒 / 三又 / 丸 (`one` / `many` / `zero-one` / `zero-many`) | 個数 | 同時に成り立つ |
 * | 中抜きの三角 / 菱 | UML の継承と所有 | 同時に成り立つ |
 * | 開いた矢 (`open`) / 塗った三角 | 移り変わり | 順番を持つ |
 *
 * **この表を 2 箇所に書かない** = 片方だけ直した日に、2 つの検査が別の母集団を見る。
 */
import { CLASS_RELATION_LOOK } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

/** 個数を表す端。 描く側の `ER_CARDINALITY_HEAD` が作る 4 種 */
export const 個数の端: ReadonlySet<string> = new Set(["one", "many", "zero-one", "zero-many"]);

/** SVG に出る端の名前と塗りを、1 つの集合値にする。 */
export type 端の組 = `${string}:${string}`;
export const 端の組 = (端: string, 塗り: string): 端の組 => `${端}:${塗り}`;

const UMLの関係の端 = Object.values(CLASS_RELATION_LOOK).flatMap(
  ({ head, fill, tailHead, tailFill }) => [
    ...(head === "none" ? [] : [{ 端: head, 塗り: fill }]),
    ...(tailHead === "none" ? [] : [{ 端: tailHead, 塗り: tailFill }]),
  ],
);

/**
 * 描いた SVG に出る UML の関係の端と塗りの組。
 * `none` は描画側が marker を作らないので含めない。
 */
export const UMLの関係の端の組: ReadonlySet<端の組> = new Set(
  UMLの関係の端.map(({ 端, 塗り }) => 端の組(端, 塗り)),
);

/** 端と塗りの組で移り変わりと見分けられる UML の関係。 */
export const UMLだけの端の組: ReadonlySet<端の組> = new Set(
  UMLの関係の端.filter(
    ({ 端, 塗り }) => 端 !== "open" && !(端 === "triangle" && 塗り === "solid"),
  ).map(({ 端, 塗り }) => 端の組(端, 塗り)),
);

/**
 * 端だけでは移り変わりと見分けられない UML の関係。
 * CSS の対象外になる関係を種類の表から導き、増減を検査と報告へそのまま出せるようにする。
 */
export const 端で見分けられないUMLの関係: readonly string[] = Object.entries(CLASS_RELATION_LOOK)
  .filter(([, { head, fill, tailHead, tailFill }]) =>
    [
      ...(head === "none" ? [] : [端の組(head, fill)]),
      ...(tailHead === "none" ? [] : [端の組(tailHead, tailFill)]),
    ].every((組) => !UMLだけの端の組.has(組)),
  )
  .map(([関係]) => 関係);

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
