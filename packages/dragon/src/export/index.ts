/**
 * 同じ原本の JSON から、mp4、GIF、HTML、PNG を書き出す。
 *
 * 見せ方は頁と同じく枠の幅で選ぶ (`chooseView`)。幅は寄って見せる窓の幅にもなる。
 * 寄って見せる図で幅の指定が無い時は、記事の本文ほどの枠 (`FOLLOW_WIDTH`) で寄る。
 * 頁に要る物 (描いた図と色の値と描かれうる字) は、ブラウザの書き出す入口と同じ処理 (`page.ts`) で集める (#3667)。
 * PNG は最後の段の止め絵を、全体を止めた見せ方で撮る。
 * 字は図で描く字だけに削り、撮る頁と HTML の両方に同じ物を埋める。
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Theme } from "../look/values";
import type { Overlap } from "../render/ink";
import type { ViewMode } from "../schema";
import type { UserBlocks } from "../user-blocks";
import { chooseView } from "../view";
import type { NotationLang } from "../words";
import { film, launch, sizeOf, stage, still } from "./capture";
import { planFilm } from "./film";
import { charsOf, fontFaces } from "./fonts";
import { pageHtml } from "./html";
import { planPage } from "./page";

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

/** 頁に図を置いて動かす script。build で `player-global.ts` を 1 file に束ねた物で、この入口と同じ dir に置く */
const PLAYER = new URL("./player.global.js", import.meta.url);

export async function exportDiagram(input: unknown, options: ExportOptions): Promise<ExportResult> {
  const formats = options.formats ?? FORMATS;
  const plan = planPage(input, options);
  const { rendered, said, vars, width, followSvg } = plan;
  const { timeline } = rendered;
  const steps = timeline.stills.length;
  if (options.step !== undefined && !(Number.isInteger(options.step) && options.step >= 1 && options.step <= steps)) throw new NoSuchStep(options.step, steps);
  const view = chooseView(rendered, width).mode;
  const videoSvg = view === "follow" && followSvg ? followSvg : rendered.svg;
  const fontCss = await fontFaces(charsOf(plan.texts));

  // 撮る物を全て撮り終えてから書く。撮る所で失敗した時に、書き出し先の dir と途中の file を残さないため (#3013)
  const outputs: [ExportFormat, string | Buffer][] = [];

  if (formats.includes("html")) outputs.push(["html", pageHtml(plan, fontCss, readFileSync(PLAYER, "utf8"))]);

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
        // コマの数と間引きは書き出す入口と同じ計画で決める (#3644)。GIF の色の表は、最初の絵と段ごとの止め絵から作る
        const filmPlan = planFilm(timeline, { mp4, gif, fps: options.fps, gifFps: options.gifFps });
        const shot = await film(await stage(browser, videoSvg, fontCss, `${vars};background:var(--bg)`, said), filmPlan);
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
