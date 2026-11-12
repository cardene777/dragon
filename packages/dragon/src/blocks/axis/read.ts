/**
 * 軸のブロックの読み方 (#3622)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * 3 つ目の軸と 5 つ目の区画の行はその行で止め、軸が 2 つでないか区画が 4 つでない図は最初の段を始める時に図の種類の行で止める。
 * 2つの軸で置く図に書ける行は軸と区画と課題と段の行だけで、ほかの行の頭の語 (`checkHead`) と線の行は誤りで止める
 */
import { attrs, name } from "../../print-kit";
import { type Attr, fail, readAttrs, readName } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type BlockReading, type ParseState, ranked } from "../block";
import { BLOCKS } from "../index";
import type { MatrixAxis } from "./block";
import { MATRIX_AREAS, MATRIX_AXES } from "./limits";

/** 2つの軸で置く図に書ける行の頭の語。2つの軸で置く図だけのブロックの語と、区画と課題と置く行と、段の行 */
const MATRIX_LINES: readonly string[] = [
  ...ranked(BLOCKS).flatMap((block) => (block.attach.only === "matrix" ? (block.words.heads ?? []) : [])),
  ...["box", "item", "line", "step", "say", "code", "source"],
];

export interface AxisMessages {
  /** `axis` の行の形 */
  matrixAxisShape: string;
  /** 軸の行が `most` 行でない */
  matrixAxes: (most: number) => string;
  /** 区画の箱が `most` つでない */
  matrixAreas: (most: number) => string;
  /** 2つの軸で置く図に書けない行 (区画の囲み、中身の帯など) を書いた */
  matrixNoLine: (word: string) => string;
  /** 2つの軸で置く図に線の行を書いた */
  matrixNoEdge: string;
}

/** 区画の箱の行に書ける属性。添え書きは区画の名前の下の字になる。色は置き場所で決まり、絵と飛び先は描かない */
const AREA_ATTRS: readonly string[] = ["note"];

/**
 * 区画の箱の行の、属性の `[` の位置。属性が無ければ `undefined`。
 * `[` を含む名前は `"` で囲む決まりなので、行の終わりの `]` で閉じる、空白の後ろの `[` が属性の始まり
 */
function attrsAt(source: SourceLine): number | undefined {
  const text = source.text.trimEnd();
  if (!text.endsWith("]")) return undefined;
  const at = text.lastIndexOf(" [");
  return at < 0 ? undefined : at + 1;
}

/** `axis <名前> [from: <小さい側>, to: <大きい側>]` の行。横の軸、縦の軸の順に 2 行まで */
function readAxis(source: SourceLine, state: ParseState): void {
  const { m } = state;
  state.beforeSteps(source);
  const { axes } = state.figure.matrix;
  if (axes.length >= MATRIX_AXES) throw fail(source, 0, m.matrixAxes(MATRIX_AXES));
  const named = readName(source, "axis".length, m);
  if (named.value === "") throw fail(source, 0, m.matrixAxisShape);
  const read = named.rest < source.text.length ? readAttrs(source, named.rest, state.attrs.axis ?? [], m) : new Map<string, Attr>();
  const from = read.get("from")?.value;
  const to = read.get("to")?.value;
  axes.push({ name: named.value, ...(from !== undefined ? { from } : {}), ...(to !== undefined ? { to } : {}) });
}

/** 軸の行。両端の字を書かない軸は名前だけを書く */
const axisLine = (axis: MatrixAxis): string =>
  `axis ${name(axis.name)}${attrs([
    ["from", axis.from],
    ["to", axis.to],
  ])}`;

export const reading: BlockReading<AxisMessages> = {
  take: (source, state, view) => {
    if (view.edgeFrom !== undefined) throw fail(source, 0, state.m.matrixNoEdge);
    // 区画の箱の行は箱のブロックが読み、ここでは 5 つ目の区画の行と、描かない属性 (色と絵と飛び先) を書いた行を止める
    if (state.figure.boxes.length >= MATRIX_AREAS) throw fail(source, 0, state.m.matrixAreas(MATRIX_AREAS));
    const at = attrsAt(source);
    if (at !== undefined) readAttrs(source, at, AREA_ATTRS, state.m);
    return false;
  },
  checkHead: (source, word, state) => {
    if (!MATRIX_LINES.includes(word)) throw fail(source, 0, state.m.matrixNoLine(word));
  },
  settle: (state, head) => {
    if (state.figure.matrix.axes.length !== MATRIX_AXES) throw fail(head, 0, state.m.matrixAxes(MATRIX_AXES));
    if (state.figure.boxes.length !== MATRIX_AREAS) throw fail(head, 0, state.m.matrixAreas(MATRIX_AREAS));
  },
  read: { axis: readAxis },
  print: {
    // 図の種類の行の直ぐ後ろ、区画の箱より前に、横の軸、縦の軸の順に書く
    lead: (diagram) => (diagram.matrix ? [diagram.matrix.axes.map(axisLine).join("\n")] : []),
  },
  messages: {
    ja: {
      matrixAxisShape: "axis は axis <名前> [from: <小さい側>, to: <大きい側>] の形で書く",
      matrixAxes: (most) => `matrix (2つの軸で置く図) の axis の行は、横の軸と縦の軸の順に ${most} 行だけ書く`,
      matrixAreas: (most) => `matrix (2つの軸で置く図) の区画は box の行でちょうど ${most} つ書く。書いた順に左上、右上、左下、右下に置く`,
      matrixNoLine: (word) => `matrix (2つの軸で置く図) には ${word} の行を書けない。軸は axis、区画は box、課題は item の行で書き、段の中の line の行で区画へ置く`,
      matrixNoEdge: "matrix (2つの軸で置く図) には線の行を書けない。課題は段の中の line <区画>: <課題> の行で区画へ置く",    },
    en: {
      matrixAxisShape: "Write an axis as axis <name> [from: <low end>, to: <high end>]",
      matrixAxes: (most) => `A two-axis matrix takes exactly ${most} axis lines: the horizontal axis, then the vertical axis`,
      matrixAreas: (most) => `A two-axis matrix takes exactly ${most} areas as box lines, placed top left, top right, bottom left and bottom right in written order`,
      matrixNoLine: (word) => `A two-axis matrix takes no ${word} lines. Write axes with axis, areas with box and tasks with item, and place tasks with line inside steps`,
      matrixNoEdge: "A two-axis matrix takes no edge lines. Put tasks into areas with line <area>: <task> inside steps",    },
  },
};
