/**
 * 同じ原本の JSON から、mp4、GIF、HTML、PNG を書き出す。
 *
 * 見せ方は頁と同じく枠の幅で選ぶ (`chooseView`)。幅は寄って見せる窓の幅にもなる。
 * 寄って見せる図で幅の指定が無い時は、記事の本文ほどの枠 (`DEFAULTS.followWidth`) で寄る。
 * PNG は最後の段の止め絵を、全体を止めた見せ方で撮る。
 * 字は図で描く字だけに削り、撮る頁と HTML の両方に同じ物を埋める。
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FIGURE_TEXT } from "../figure-text";
import { paletteVars, resolvePalette, type Theme } from "../look/values";
import { FORMAT_VERSION, fromModel } from "../model";
import { pipeTexts } from "../pipe-player";
import { BUTTON_TEXT, stepNo, ZOOM_TEXT } from "../player";
import type { Overlap } from "../render/ink";
import { drawSvg, type Rendered, redrawWithBlocks, renderDiagram } from "../render/svg";
import type { Diagram, ViewMode } from "../schema";
import type { UserBlocks } from "../user-blocks";
import { tryTexts } from "../try-player";
import { readDiagram } from "../version";
import { chooseView } from "../view";
import { DEFAULT_LANG, type NotationLang, textLang } from "../words";
import { film, launch, sizeOf, stage, still } from "./capture";
import { charsOf, fontFaces } from "./fonts";
import { pageHtml } from "./html";

export type ExportFormat = "mp4" | "gif" | "html" | "png";

export interface ExportOptions {
  /** 書き出す先の dir。無ければ作り、書き出しに失敗した時は作った dir を残さない (#3013) */
  outDir: string;
  /** file の名前 (拡張子を除く)。既定は `diagram` */
  name?: string;
  /** 書き出す形。既定は 4 つ全て */
  formats?: ExportFormat[];
  /** 枠の幅 (CSS の px)。見せ方を選び、寄って見せる窓の幅になる */
  width?: number;
  palette?: string;
  theme?: Theme;
  /** mp4 の 1 秒のコマの数 */
  fps?: number;
  /** GIF の 1 秒のコマの数 */
  gifFps?: number;
  /**
   * 図の中の字 (図に足す字、全体図の札、HTML の読み上げの名前) と断りの文 (描けない時、書き出す道具が無い時) の言葉 (#3001、#3338)。
   * 書かなければ、図の中の字は図の題か段の本文 (`say`) に仮名か漢字があれば日本語、無ければ英語にし、断りの文は英語にする (#3516)
   */
  lang?: NotationLang;
  /** PNG に撮る段 (1 から数える)。書かなければ最後の段 (#3484)。崩れを知らされた段を撮って見るために使う */
  step?: number;
  /**
   * 原本の頭に書かずに渡す、使う人が足すブロックの定義 (`dragon export --blocks`、#3606)。`readBlocks` が読んだ物。
   * 頁に埋める原本の定義の欄 (`define`) にも入れ、頁が原本を読み直して同じ図を描けるようにする。原本の頭の定義と同じ名前の定義は原本の物を使う
   */
  blocks?: UserBlocks;
}

/** 図に無い段を `step` に選んだ時の断り (#3484)。撮る前に断り、命令は使い方の誤りとして終える */
export class NoSuchStep extends Error {
  constructor(
    readonly step: number,
    readonly count: number,
  ) {
    super(`No step ${step} in the diagram (steps 1 to ${count})`);
  }
}

export interface ExportResult {
  /** 書き出した file の path */
  files: Partial<Record<ExportFormat, string>>;
  view: ViewMode;
  /** 撮ったコマの数 */
  frames: number;
  /** 動画のコマの大きさ (CSS の px)。撮る画素はこの 2 倍 */
  width: number;
  height: number;
  /** 段ごとの止め絵で同時に見えている字の重なり (#3178)。命令はこれを標準エラーに出す */
  overlaps: Overlap[];
}

/** 書き出せる形。命令が `--format` の値を確かめる時にも使う */
export const FORMATS: readonly ExportFormat[] = ["mp4", "gif", "html", "png"];
const DEFAULTS = { fps: 30, gifFps: 10, followWidth: 728 };

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
function openedTexts(input: unknown, rendered: Rendered, options: ExportOptions, lang: NotationLang): string[] {
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

export async function exportDiagram(input: unknown, options: ExportOptions): Promise<ExportResult> {
  const formats = options.formats ?? FORMATS;
  // 断りの文は渡した言葉か英語で出し、図の中の字は渡されなければ図の字の言葉で描く (#3516)
  const said = options.lang ?? DEFAULT_LANG;
  const lang = options.lang ?? drawnLang(input, said);
  const blocks = options.blocks ? { blocks: options.blocks } : {};
  const rendered = renderDiagram(input, {
    ...(options.palette ? { palette: options.palette } : {}),
    ...(options.theme ? { theme: options.theme } : {}),
    ...blocks,
    lang,
  });
  const { diagram, layout, timeline, theme } = rendered;
  const steps = timeline.stills.length;
  if (options.step !== undefined && !(Number.isInteger(options.step) && options.step >= 1 && options.step <= steps)) throw new NoSuchStep(options.step, steps);
  const palette = resolvePalette(rendered.palette);
  const vars = paletteVars(palette, theme);
  const width = options.width ?? (rendered.view === "follow" ? DEFAULTS.followWidth : layout.width);
  const view = chooseView(rendered, width).mode;
  // 寄って見せる図は動画と字の file の両方に使うので 1 度だけ描き、2 つの全体図の札の言葉を揃える。
  // 描き直す間も足したブロックの定義を有効にし、足した箱の形と線の模様を止め絵と同じに描く (#3606)
  const followSvg = rendered.view === "fixed" ? undefined : redrawWithBlocks(input, { ...blocks, lang }, () => drawSvg(diagram, layout, timeline, palette, theme, { width, lang }));
  const videoSvg = view === "follow" && followSvg ? followSvg : rendered.svg;
  const fontCss = await fontFaces(charsOf([...drawnTexts(rendered, followSvg, lang), ...openedTexts(input, rendered, options, lang)]));

  // 撮る物を全て撮り終えてから書く。撮る所で失敗した時に、書き出し先の dir と途中の file を残さないため (#3013)
  const outputs: [ExportFormat, string | Buffer][] = [];

  // 頁は埋めた原本を読み直して描くので、今の版の原本 (版2) に戻して埋める (#3346)。
  // 配管の図は内側の段をまとめる前の形を埋め、頁が箱を押された時に内側の段を開けるようにする (#3398)
  if (formats.includes("html")) outputs.push(["html", pageHtml(withDefinitions(fromModel(rendered.source ?? diagram, FORMAT_VERSION), options.blocks), { palette: palette.id, theme, vars, lang }, fontCss)]);

  let frames = 0;
  const mp4 = formats.includes("mp4");
  const gif = formats.includes("gif");
  if (mp4 || gif || formats.includes("png")) {
    const browser = await launch(said);
    try {
      if (formats.includes("png")) {
        const fixed = await stage(browser, rendered.svg, fontCss, "", said);
        outputs.push(["png", await still(fixed, timeline.stills[(options.step ?? steps) - 1] ?? 0)]);
      }
      if (mp4 || gif) {
        const fps = mp4 ? (options.fps ?? DEFAULTS.fps) : (options.gifFps ?? DEFAULTS.gifFps);
        const gifEvery = gif ? Math.max(1, Math.round(fps / (options.gifFps ?? DEFAULTS.gifFps))) : 0;
        const shot = await film(await stage(browser, videoSvg, fontCss, `${vars};background:var(--bg)`, said), {
          total: timeline.total,
          fps,
          mp4,
          gifEvery,
          // GIF の色の表は、最初の絵と段ごとの止め絵から作る
          samples: [0, ...timeline.stills],
        });
        frames = shot.frames;
        if (shot.mp4) outputs.push(["mp4", shot.mp4]);
        if (shot.gif) outputs.push(["gif", shot.gif]);
      }
    } finally {
      await browser.close();
    }
  }
  const files = writeOutputs(options.outDir, options.name ?? "diagram", outputs);
  return { files, view, frames, ...sizeOf(videoSvg), overlaps: rendered.overlaps };
}

/**
 * 書き出し先の dir を作り、撮った物を並びの順に書く。
 * 書いている途中で失敗した時は、この回に作った dir を中身ごと消してから投げ直す (#3013)。
 * 前から在った dir は消さない。
 */
function writeOutputs(outDir: string, name: string, outputs: [ExportFormat, string | Buffer][]): Partial<Record<ExportFormat, string>> {
  // 作った dir の内で一番上の path。前から在った時は undefined
  const created = mkdirSync(outDir, { recursive: true });
  const files: Partial<Record<ExportFormat, string>> = {};
  try {
    for (const [format, data] of outputs) {
      const path = join(outDir, `${name}.${format}`);
      writeFileSync(path, data);
      files[format] = path;
    }
  } catch (error) {
    if (created !== undefined) rmSync(created, { recursive: true, force: true });
    throw error;
  }
  return files;
}
