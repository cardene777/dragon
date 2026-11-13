/**
 * 書き出す HTML の頁に要る物を、原本から集める (#3667)。
 *
 * 命令の書き出し (`dragon export`) とブラウザの書き出す入口 (`captureHtml`) の両方が使い、同じ原本から同じ頁を組む。
 * 原本から図を描き、頁の色の値と、頁が埋め直す原本と、頁と再生の帯で描かれうる字を返す。
 * 字の file の埋め方だけが 2 つで違う。命令は同梱の字を描く字だけに削り、ブラウザは頁が読み込んだ字の file を丸ごと埋める。
 * ブラウザも読むので、Node の組み込みの module を読まない。
 */
import { FIGURE_TEXT } from "../figure-text";
import { type Palette, paletteVars, resolvePalette, type Theme } from "../look/values";
import { FORMAT_VERSION, fromModel } from "../model";
import { pipeTexts } from "../pipe-player";
import { BUTTON_TEXT, stepNo, ZOOM_TEXT } from "../player";
import { drawSvg, type Rendered, redrawWithBlocks, renderDiagram } from "../render/svg";
// 書き出しは命令とブラウザの書き出す入口の両方で、手描きの線の処理を初めから持つ (#3643)
import "../render/pen-all";
import { drawLines, type LineStyle } from "../render/pen-store";
import type { Diagram } from "../schema";
import { tryTexts } from "../try-player";
import type { UserBlocks } from "../user-blocks";
import { readDiagram } from "../version";
import { DEFAULT_LANG, type NotationLang, textLang } from "../words";

/** 寄って見せる図で幅の指定が無い時の枠の幅。記事の本文ほどの幅 */
export const FOLLOW_WIDTH = 728;

export interface PageOptions {
  palette?: string;
  theme?: Theme;
  /**
   * 図の中の字と断りの文の言葉。書かなければ、図の中の字は図の題か段の本文 (`say`) に仮名か漢字があれば日本語、
   * 無ければ英語にし、断りの文は英語にする (#3516)
   */
  lang?: NotationLang;
  /** 枠の幅 (CSS の px)。寄って見せる図の全体図をこの幅で描く */
  width?: number;
  /** 原本の頭に書かずに渡す、使う人が足すブロックの定義 (#3606) */
  blocks?: UserBlocks;
  /** 線の描き方 (#3643)。書かなければ定規の線 */
  line?: LineStyle;
}

/** 原本から集めた、頁と書き出しに要る物 */
export interface PagePlan {
  rendered: Rendered;
  /** 断りの文の言葉 */
  said: NotationLang;
  /** 図の中の字の言葉 */
  lang: NotationLang;
  palette: Palette;
  /** 頁の `:root` に置く色の値 */
  vars: string;
  /** 枠の幅 (CSS の px) */
  width: number;
  /** 寄って見せる図を枠の幅で描いた SVG。止めて見せる図では undefined */
  followSvg: string | undefined;
  /** 頁と書き出しで描かれうる字 */
  texts: string[];
  /** 頁に埋める原本。頁は埋めた原本を読み直して描く */
  source: Diagram;
  /** 線の描き方。頁は埋めた原本をこの描き方で描き直す (#3643) */
  line: LineStyle;
}

const unescape = (s: string): string => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

/** SVG の中で描かれる字 (`<text>` の中身) */
const svgTexts = (svg: string): string[] => [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map((m) => unescape((m[1] ?? "").replace(/<[^>]+>/g, "")));

/**
 * 頁と書き出しで描かれうる字。寄って見せる時の全体図の題 (`followSvg` の中) と、釦と段の番号の字も含む。
 * 試す図は、頁の入力の帯の欄の名前と釦の字と、押せない訳と読み手が足す段の題と本文の字も含む (#3337)。
 * 配管の図は、図の下の段の矢印と呼び出しの結果の字と、拡大と縮小の釦と拡大の度合いの札の字も含む (#3418、#3450)
 */
function drawnTexts(rendered: Rendered, followSvg: string | undefined, lang: NotationLang): string[] {
  const { diagram } = rendered;
  const svgs = followSvg === undefined ? [rendered.svg] : [rendered.svg, followSvg];
  const count = diagram.steps.length;
  return [
    ...svgs.flatMap(svgTexts),
    ...diagram.steps.flatMap((step, s) => [step.title, step.body, stepNo(s, count)]),
    ...Object.values(BUTTON_TEXT),
    // 再生の釦は名前も字で出す (#3398)
    FIGURE_TEXT[lang].play,
    FIGURE_TEXT[lang].pause,
    ...(diagram.kind === "try" ? tryTexts(diagram, lang) : []),
    ...(diagram.kind === "pipe" ? [...pipeTexts(diagram, lang), ...Object.values(ZOOM_TEXT)] : []),
  ];
}

/**
 * 配管の図の畳んだ箱を全て開いた図で描かれる字 (#3398)。頁で読み手が箱を押すと、内側の段の題と本文と関係者の名前を描く。
 * 箱の内側にも箱が在るので、新しい箱が出なくなるまで開いて描く
 */
function openedTexts(input: unknown, rendered: Rendered, options: PageOptions, lang: NotationLang): string[] {
  if (!rendered.source) return [];
  const texts: string[] = [];
  let open: number[] = [];
  for (let folds = (rendered.layout as { folds?: { call: number }[] }).folds ?? []; folds.length > 0; ) {
    open = [...open, ...folds.map((f) => f.call)];
    const opened = renderDiagram(input, { ...(options.palette ? { palette: options.palette } : {}), ...(options.blocks ? { blocks: options.blocks } : {}), lang, open });
    texts.push(...drawnTexts(opened, undefined, lang));
    folds = ((opened.layout as { folds?: { call: number }[] }).folds ?? []).filter((f) => !open.includes(f.call));
  }
  return texts;
}

/**
 * 言葉を渡されない時に図の中の字を描く言葉 (#3516)。書き出しは置く頁を持たないので、頁の言葉の代わりに図の題と段の本文 (`say`) から決める。
 * 原本を読めない時は断りの文の言葉を返し、描く処理がその言葉で描けない訳を出す
 */
function drawnLang(input: unknown, said: NotationLang): NotationLang {
  const read = readDiagram(input, { lang: said });
  return read.ok ? textLang(read.diagram) : said;
}

/**
 * 頁に埋める原本に、引数で渡した足したブロックの定義を足す (#3606)。頁は埋めた原本を読み直して描くので、渡した定義も原本の定義の欄で運ぶ。
 * 原本の頭の定義と同じ名前の定義は、描く時と同じく原本の物を残す
 */
function withDefinitions(source: Diagram, blocks: UserBlocks | undefined): Diagram {
  const own = source.define?.blocks ?? [];
  const added = (blocks?.blocks ?? []).filter((b) => !own.some((o) => o.name === b.name));
  return added.length === 0 ? source : { ...source, define: { format: 1, blocks: [...own, ...added] } };
}

/** 原本 `input` を描き、頁と書き出しに要る物を集める。描けない原本は描く処理が断る */
export function planPage(input: unknown, options: PageOptions): PagePlan {
  // 断りの文は渡した言葉か英語で出し、図の中の字は渡されなければ図の字の言葉で描く (#3516)
  const said = options.lang ?? DEFAULT_LANG;
  const lang = options.lang ?? drawnLang(input, said);
  const blocks = options.blocks ? { blocks: options.blocks } : {};
  const rendered = renderDiagram(input, {
    ...(options.palette ? { palette: options.palette } : {}),
    ...(options.theme ? { theme: options.theme } : {}),
    ...(options.line === "pen" ? { line: options.line } : {}),
    ...blocks,
    lang,
  });
  const { diagram, layout, timeline, theme } = rendered;
  const palette = resolvePalette(rendered.palette);
  const vars = paletteVars(palette, theme);
  const width = options.width ?? (rendered.view === "follow" ? FOLLOW_WIDTH : layout.width);
  // 寄って見せる図は動画と字の file の両方に使うので 1 度だけ描き、2 つの全体図の札の言葉を揃える。
  // 描き直す間も足したブロックの定義を有効にし、足した箱の形と線の模様を止め絵と同じに描く (#3606)
  const line = options.line ?? "ruler";
  const followSvg =
    rendered.view === "fixed"
      ? undefined
      : redrawWithBlocks(input, { ...blocks, lang }, () => {
          const svg = drawSvg(diagram, layout, timeline, palette, theme, { width, lang });
          return drawLines(svg, line, lang);
        });
  const texts = [...drawnTexts(rendered, followSvg, lang), ...openedTexts(input, rendered, options, lang)];
  // 頁は埋めた原本を読み直して描くので、今の版の原本 (版2) に戻して埋める (#3346)。
  // 配管の図は内側の段をまとめる前の形を埋め、頁が箱を押された時に内側の段を開けるようにする (#3398)
  const source = withDefinitions(fromModel(rendered.source ?? diagram, FORMAT_VERSION), options.blocks);
  return { rendered, said, lang, palette, vars, width, followSvg, texts, source, line };
}
