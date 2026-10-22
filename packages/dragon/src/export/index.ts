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
import { paletteVars, resolvePalette, type Theme } from "../look/values";
import { BUTTON_TEXT, stepNo } from "../player";
import { drawSvg, type Rendered, renderDiagram } from "../render/svg";
import type { ViewMode } from "../schema";
import { chooseView } from "../view";
import type { NotationLang } from "../words";
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
  /** 図の中の字 (全体図の札、HTML の読み上げの名前、描けない時の断りの文) の言葉。書かなければ日本語 (#3001) */
  lang?: NotationLang;
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
}

/** 書き出せる形。命令が `--format` の値を確かめる時にも使う */
export const FORMATS: readonly ExportFormat[] = ["mp4", "gif", "html", "png"];
const DEFAULTS = { fps: 30, gifFps: 10, followWidth: 728 };

const unescape = (s: string): string => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

/** SVG の中で描かれる字 (`<text>` の中身) */
const svgTexts = (svg: string): string[] => [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map((m) => unescape((m[1] ?? "").replace(/<[^>]+>/g, "")));

/** 頁と書き出しで描かれうる字。寄って見せる時の全体図の題 (`followSvg` の中) と、釦と段の番号の字も含む */
function drawnTexts(rendered: Rendered, followSvg: string | undefined): string[] {
  const { diagram } = rendered;
  const svgs = followSvg === undefined ? [rendered.svg] : [rendered.svg, followSvg];
  const count = diagram.steps.length;
  return [...svgs.flatMap(svgTexts), ...diagram.steps.flatMap((step, s) => [step.title, step.body, stepNo(s, count)]), ...Object.values(BUTTON_TEXT)];
}

export async function exportDiagram(input: unknown, options: ExportOptions): Promise<ExportResult> {
  const formats = options.formats ?? FORMATS;
  const lang = options.lang ?? "ja";
  const rendered = renderDiagram(input, {
    ...(options.palette ? { palette: options.palette } : {}),
    ...(options.theme ? { theme: options.theme } : {}),
    lang,
  });
  const { diagram, layout, timeline, theme } = rendered;
  const palette = resolvePalette(rendered.palette);
  const vars = paletteVars(palette, theme);
  const width = options.width ?? (rendered.view === "follow" ? DEFAULTS.followWidth : layout.width);
  const view = chooseView(rendered, width).mode;
  // 寄って見せる図は動画と字の file の両方に使うので 1 度だけ描き、2 つの全体図の札の言葉を揃える
  const followSvg = rendered.view === "fixed" ? undefined : drawSvg(diagram, layout, timeline, palette, theme, { width, lang });
  const videoSvg = view === "follow" && followSvg ? followSvg : rendered.svg;
  const fontCss = await fontFaces(charsOf(drawnTexts(rendered, followSvg)));

  // 撮る物を全て撮り終えてから書く。撮る所で失敗した時に、書き出し先の dir と途中の file を残さないため (#3013)
  const outputs: [ExportFormat, string | Buffer][] = [];

  if (formats.includes("html")) outputs.push(["html", pageHtml(diagram, { palette: palette.id, theme, vars, lang }, fontCss)]);

  let frames = 0;
  const mp4 = formats.includes("mp4");
  const gif = formats.includes("gif");
  if (mp4 || gif || formats.includes("png")) {
    const browser = await launch(lang);
    try {
      if (formats.includes("png")) {
        const fixed = await stage(browser, rendered.svg, fontCss, "");
        outputs.push(["png", await still(fixed, timeline.stills[timeline.stills.length - 1] ?? 0)]);
      }
      if (mp4 || gif) {
        const fps = mp4 ? (options.fps ?? DEFAULTS.fps) : (options.gifFps ?? DEFAULTS.gifFps);
        const gifEvery = gif ? Math.max(1, Math.round(fps / (options.gifFps ?? DEFAULTS.gifFps))) : 0;
        const shot = await film(await stage(browser, videoSvg, fontCss, `${vars};background:var(--bg)`), {
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
  return { files, view, frames, ...sizeOf(videoSvg) };
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
