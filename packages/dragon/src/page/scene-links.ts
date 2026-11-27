/**
 * 判定の表の例の行から場面の図を追う繋ぎ (#3892)。
 *
 * 説明の頁 (`layout: guide`) の判定の表の例の行は、`[scene: <場面の名前>]` で同じ問い (`###`) の節の場面の図の場面を名指す。
 * 問いの節は話題ごとの頁に分けても必ず一緒に見えるので、場面は問いの節の中だけで探す。
 * 名指した場面がどの場面の図にも無い時と、2 つ以上の場面の図に在る時は、例の行を名指して断る。
 * 頁の書き出し (`page/export.ts`) と `dragon check` (`check.ts`) が同じ形で断る
 */
import type { Diagram } from "../schema";
import type { NotationLang } from "../words";

/** 問いの節の中の図。`first` は図の記法の 1 行目の、頁の file の行 */
export interface SectionFigure {
  file: string;
  first: number;
  notation: string;
  diagram: Diagram;
}

/** 例の行の断り。`column` は `scene:` の字の 1 から数えた位置 */
export interface SceneLinkError {
  file: string;
  line: number;
  column: number;
  message: string;
}

const WORDS: Record<NotationLang, { missing(name: string): string; twice(name: string): string }> =
  {
    ja: {
      missing: (name) =>
        `場面「${name}」が、同じ問いの節の場面の図に無い。同じ ### の節に、この名前の scene を持つ場面の図を置く`,
      twice: (name) =>
        `場面「${name}」が、同じ問いの節の2つ以上の場面の図に在る。この名前の scene は1つの図にだけ置く`,
    },
    en: {
      missing: (name) =>
        `No scene figure in the same question section has the scene "${name}". Put a scene figure with this scene in the same ### section`,
      twice: (name) =>
        `The scene "${name}" is in two or more scene figures of the same question section. Keep the scene in one figure`,
    },
  };

/** 記法の行のうち `case` で始まる行の番号 (0 から数える)。書いた順 */
const caseRows = (notation: string): number[] =>
  notation.split("\n").flatMap((row, i) => (/^\s*case\s/u.test(row) ? [i] : []));

/** 問いの節の図 `figures` の判定の表の例の行が名指す場面を、同じ節の場面の図から探し、無いか 2 つ以上の場面の図に在る行の断りを返す */
export function sceneLinkErrors(
  figures: readonly SectionFigure[],
  lang: NotationLang,
): SceneLinkError[] {
  const words = WORDS[lang];
  const holders = (name: string): number =>
    figures.filter((figure) =>
      (figure.diagram.scenes?.list ?? []).some((scene) => scene.name === name),
    ).length;
  return figures.flatMap((figure) => {
    const cases = figure.diagram.judge?.cases ?? [];
    const rows = caseRows(figure.notation);
    const lines = figure.notation.split("\n");
    return cases.flatMap((item, k) => {
      if (item.scene === undefined) return [];
      const count = holders(item.scene);
      if (count === 1) return [];
      const row = rows[k] ?? 0;
      const column = Math.max(0, (lines[row] ?? "").indexOf("scene:")) + 1;
      return [
        {
          file: figure.file,
          line: figure.first + row,
          column,
          message: count === 0 ? words.missing(item.scene) : words.twice(item.scene),
        },
      ];
    });
  });
}

/** 頭の行に `layout: guide` を書いた説明の頁の md か */
export const isGuidePage = (text: string): boolean =>
  /^---\r?\n(?:.*\r?\n)*?layout:\s*guide\s*\r?\n(?:.*\r?\n)*?---\s*(?:\r?\n|$)/u.test(text);

/**
 * md の行 `line` (1 から数える) が入る問いの節の番号。問いの節は `###` の見出しから次の `#`、`##`、`###` の見出しまでで、
 * 囲みの中の行は見出しに数えない。どの問いの節にも入らない行は `undefined`
 */
export function sectionsOf(text: string): (line: number) => number | undefined {
  const at: (number | undefined)[] = [];
  let section: number | undefined;
  let fence: string | undefined;
  for (const [i, row] of text.split(/\r?\n/u).entries()) {
    const open = /^\s{0,3}(`{3,}|~{3,})/u.exec(row)?.[1];
    if (fence !== undefined) {
      if (open !== undefined && open[0] === fence[0] && open.length >= fence.length)
        fence = undefined;
    } else if (open !== undefined) fence = open;
    else if (/^###\s/u.test(row)) section = i;
    else if (/^#{1,2}\s/u.test(row)) section = undefined;
    at.push(section);
  }
  return (line) => at[line - 1];
}
