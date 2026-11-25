/**
 * ブラウザで描いた図を画像にする入口 (`@cardenelabs/dragon/capture`、#3644)。
 *
 * 頁に描いた SVG を受けて、GIF と mp4 の Blob と、今の時刻の止め絵の PNG の Blob と、字を埋めた SVG の文字列を返す。
 * dragon の図に限らず、頁に描いた SVG なら PNG と SVG にできる。GIF と mp4 は dragon の図の動きを 1 周撮る。
 * コマの時刻は命令の書き出し (`dragon export`) と同じく、`--play` を `paused` にして `--at` に秒を入れて止め、
 * コマの数と間引きと詰める処理も同じ物 (`export/film.ts`) を使う。同じ図ならコマの数と縦横が `dragon export` と揃う。
 *
 * 字は頁が読み込んだ `@font-face` から、描いた字の範囲に当たる字の file だけを丸ごと埋める (`fonts.ts`)。
 * 字の file を読めない時は、読めない字の名前と範囲を名指して断り、字の無い画像を返さない。
 *
 * 判定の表 (#3879) は、書き出す絵の形 (例を帯に置いた SVG、`renderDiagram` の `picture`、#3891) の根を受けるとそのまま SVG にし、
 * 頁の表 (HTML) の根を受けると写しを SVG の `foreignObject` に包んで同じ形にする (#3937)。
 * PNG と SVG は頁で照らしている段に依らず全ての段を照らさずに見せ、GIF と mp4 は `timeline` の段の始まりの時刻ごとに列を照らす。
 * 図の根の `data-dragon` の値で、段の印を書く処理と消す処理を引く (`STEP_PARTS`)。
 *
 * 記法を受けて、1 file で開ける HTML の頁の文字列も返す (`captureHtml`、#3667)。頁の組み方は `dragon export --format html` と同じ物を使う (`html.ts`)。
 *
 * mp4 は WebCodecs の H.264 で詰めるので、WebCodecs を持たないブラウザでは作れない。呼ぶ前に `canCaptureMp4` で確かめ、
 * 作れない時は mp4 の釦を出さない。この入口は詰める道具 (`gifenc`、`mediabunny`) を読むので、描く入口とは分け、
 * 書き出す時にだけ読む。Node の組み込みの module は読まない。
 */
import * as gifencModule from "gifenc";
import { BufferTarget, CanvasSource, canEncodeVideo, Mp4OutputFormat, Output, QUALITY_MEDIUM } from "mediabunny";
import { FILM_SCALE, makeFilm, planFilm } from "../export/film";
import { clearJudge, showJudge } from "../render/judge-show";
import { DEFAULT_LANG, type NotationLang } from "../words";
import { cycleOf, picture, type Picture, shownAt, type StepParts, stepPicture } from "./picture";

export { captureHtml, type HtmlOptions } from "./html";

/**
 * `gifenc` の部品。束ねる道具とブラウザが読む ESM の build は部品を名前で出すが、Node が読む CommonJS の build は
 * 部品を `default` の下にだけ見せる。名前で読むと Node の `import` が止まるので、名前が無い時は `default` の下から取る (#3659)
 */
const gifenc: typeof gifencModule = "GIFEncoder" in gifencModule ? gifencModule : (gifencModule as unknown as { default: typeof gifencModule }).default;

/** 詰める道具。使う部品だけを渡す */
const TOOLS = {
  mb: { BufferTarget, CanvasSource, Mp4OutputFormat, Output, QUALITY_MEDIUM },
  gif: { GIFEncoder: gifenc.GIFEncoder, nearestColorIndex: gifenc.nearestColorIndex, quantize: gifenc.quantize },
};

/** Encode full interactive-diagram frames using the same encoders as SVG capture. */
export async function captureFrames(options: {
  width: number; height: number; total: number; format: "gif" | "mp4";
  draw: (seconds: number) => Promise<HTMLCanvasElement>;
  signal?: AbortSignal; onProgress?: (fraction: number) => void;
}): Promise<Blob> {
  if (options.format === "mp4" && !(await canCaptureMp4())) throw new Error(TEXT.ja.noMp4);
  const fps = options.format === "gif" ? 8 : 24;
  const count = Math.max(1, Math.ceil(options.total * fps));
  const box = await makeFilm(TOOLS, {width:options.width,height:options.height,scale:1,fps,mp4:options.format==="mp4",gifEvery:options.format==="gif"?1:0});
  try {
  const check = () => options.signal?.throwIfAborted();
  if (options.format === "gif") {
    for (let i=0;i<4;i++) {check();box.sample(await options.draw(options.total*i/4));}
    box.seal();
  }
  for(let i=0;i<count;i++) {check();await box.push(await options.draw(i/fps),i);options.onProgress?.((i+1)/count);}
  check();const made=await box.finish();
  const bytes=options.format==="gif"?made.gif:made.mp4;
  if(!bytes)throw new Error("動画を作成できませんでした");
  return new Blob([bytes as BlobPart],{type:options.format==="gif"?"image/gif":"video/mp4"});
  } catch (error) {
    try { await box.cancel(); } catch (cleanup) { throw new AggregateError([error,cleanup],"動画の作成と終了処理に失敗しました"); }
    throw error;
  }
}

/** 断りの文 */
const TEXT: Record<NotationLang, { noCycle: string; noMp4: string; noSteps: string; notFigure: string }> = {
  ja: {
    noCycle: "図の 1 周の長さ (`--T`) を SVG から読めない。timeline に 1 周の秒を渡す",
    noMp4: "このブラウザは mp4 を作れない (WebCodecs の H.264 が無い)",
    noSteps: "HTML で描く図の動画には、timeline の 1 周の秒 (total) と段の始まりの時刻 (steps) が要る。renderDiagram が返す timeline を渡す",
    notFigure: "SVG か、HTML で描く図 (判定の表) の根の要素を渡す",
  },
  en: {
    noCycle: "Cannot read the cycle length (`--T`) from the SVG. Pass the seconds of one cycle in timeline",
    noMp4: "This browser cannot make mp4 (no H.264 in WebCodecs)",
    noSteps: "A film of an HTML diagram needs the cycle seconds (total) and step starts (steps) in timeline. Pass the timeline renderDiagram returns",
    notFigure: "Pass an SVG, or the root element of an HTML diagram (a judge table)",
  },
};

/** 書き出す図。頁に描いた SVG か、判定の表の書き出す絵の形 (SVG) か、頁の表 (HTML) の根の要素 */
export type CaptureFigure = SVGSVGElement | HTMLElement;

/** 段の印で列を照らす図の種類ごとの、段の印を書く処理と消す処理。図の根の `data-dragon` の値で引く */
const STEP_PARTS: Record<string, StepParts> = { judge: { show: showJudge, clear: clearJudge } };

const isSvg = (figure: CaptureFigure): figure is SVGSVGElement => figure.namespaceURI === "http://www.w3.org/2000/svg";

/** 段の印で列を照らす図の処理。そうでない SVG は undefined、知らない HTML の要素は断る */
function stepParts(figure: CaptureFigure, lang: NotationLang): StepParts | undefined {
  const parts = STEP_PARTS[figure.getAttribute("data-dragon") ?? ""];
  if (!parts && !isSvg(figure)) throw new Error(TEXT[lang].notFigure);
  return parts;
}

/** 止め絵を撮る写し。段の印で列を照らす図は全ての段を照らさずに見せる */
function stillOf(figure: CaptureFigure, lang: NotationLang): Promise<Picture> {
  const parts = stepParts(figure, lang);
  return parts ? stepPicture(figure, lang, parts) : picture(figure as SVGSVGElement, lang);
}

export interface CaptureOptions {
  /** 断りの文の言葉。既定は英語 */
  lang?: NotationLang;
}

export interface StillOptions extends CaptureOptions {
  /** 撮る時刻 (秒)。書かなければ、頁で今描いている時刻 */
  at?: number;
  /** CSS の 1px を何画素で撮るか。既定は 2 */
  scale?: number;
}

export interface FilmOptions extends CaptureOptions {
  /** 作る形。既定は mp4 と GIF の両方 */
  formats?: readonly ("mp4" | "gif")[];
  /** mp4 の 1 秒のコマの数。既定は 30 */
  fps?: number;
  /** GIF の 1 秒のコマの数。既定は 10 */
  gifFps?: number;
  /**
   * 図の 1 周の秒 (`total`) と段ごとの止め絵の時刻 (`stills`) と段の始まりの時刻 (`steps`)。`renderDiagram` が返す `timeline` をそのまま渡せる。
   * 書かなければ 1 周の秒は SVG の `--T` から読み、GIF の色の表は 1 周を 8 つに分けた時刻の絵から作る。
   * 渡すと GIF の色の表を `dragon export` と同じ絵 (最初の絵と段ごとの止め絵) から作る。
   * HTML で描く図 (判定の表) は時刻で動かないので、`total` と `steps` が要り、コマごとにその時刻の段を図に書いて撮る (#3937)
   */
  timeline?: { total: number; stills: readonly number[]; steps?: readonly { start: number }[] };
}

/** 書き出した動画。`frames` は撮ったコマの数、`width` と `height` はコマの大きさ (CSS の px、mp4 はこの 2 倍) */
export interface Film {
  frames: number;
  width: number;
  height: number;
  mp4?: Blob;
  gif?: Blob;
}

/** canvas の中身を PNG の Blob にする */
const pngOf = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((done, fail) => canvas.toBlob((blob) => (blob ? done(blob) : fail(new Error("Cannot encode the PNG"))), "image/png"));

/** このブラウザで mp4 を作れるか。WebCodecs の H.264 が無いブラウザでは false */
export async function canCaptureMp4(): Promise<boolean> {
  if (typeof VideoEncoder !== "function" || typeof OffscreenCanvas !== "function") return false;
  try {
    return await canEncodeVideo("avc", { width: 1280, height: 720, quality: QUALITY_MEDIUM });
  } catch {
    return false;
  }
}

/**
 * 頁に描いた SVG の、今の時刻 (`at` を渡せばその時刻) の止め絵の PNG。縦横は SVG の `scale` 倍 (既定は 2 倍)。
 * 判定の表は、頁で照らしている段に依らず、全ての段を照らさずに見せた表を描いた大きさの `scale` 倍で撮る (#3937)
 */
export async function capturePng(svg: CaptureFigure, options: StillOptions = {}): Promise<Blob> {
  const lang = options.lang ?? DEFAULT_LANG;
  if (!isSvg(svg) || stepParts(svg, lang)) return pngOf(await (await stillOf(svg, lang)).draw(0, options.scale ?? FILM_SCALE));
  const at = options.at ?? shownAt(svg);
  const shot = await picture(svg, lang);
  const style = svg.ownerDocument.defaultView?.getComputedStyle(svg);
  // 時刻が読めない図 (動きの無い図) は、写した `--at` のまま止める
  const t = at ?? (Number.parseFloat(style?.getPropertyValue("--at") ?? "") || 0);
  return pngOf(await shot.draw(t, options.scale ?? FILM_SCALE));
}

/**
 * 頁に描いた SVG を、描いた字の file を `data:` で埋めた SVG の文字列にする。
 * 判定の表は全ての段を照らさずに見せる。書き出す絵の形 (#3891) はそのまま SVG にし、頁の表は写しを `foreignObject` に包む (#3937)。
 * ブラウザでない道具は `foreignObject` を描かないので、書き出す窓は書き出す絵の形を渡す
 */
export async function captureSvg(svg: CaptureFigure, options: CaptureOptions = {}): Promise<string> {
  return (await stillOf(svg, options.lang ?? DEFAULT_LANG)).svg();
}

/** 頁に描いた dragon の図の動きを 1 周撮り、mp4 と GIF に詰める。地は図の地の色 (`--bg`) で塗る */
export async function captureFilm(svg: CaptureFigure, options: FilmOptions = {}): Promise<Film> {
  const lang = options.lang ?? DEFAULT_LANG;
  const formats = options.formats ?? ["mp4", "gif"];
  const mp4 = formats.includes("mp4");
  const gif = formats.includes("gif");
  if (mp4 && !(await canCaptureMp4())) throw new Error(TEXT[lang].noMp4);
  const steps = options.timeline?.steps;
  const parts = stepParts(svg, lang);
  if (parts && !steps?.length) throw new Error(TEXT[lang].noSteps);
  const total = options.timeline?.total ?? (isSvg(svg) && !parts ? cycleOf(svg) : undefined);
  if (total === undefined) throw new Error(TEXT[lang].noCycle);
  const stills = options.timeline?.stills ?? Array.from({ length: 7 }, (_, k) => (total * (k + 1)) / 8);
  const plan = planFilm({ total, stills }, { mp4, gif, fps: options.fps, gifFps: options.gifFps });
  const shot = parts ? await stepPicture(svg, lang, parts, steps?.map((step) => step.start)) : await picture(svg as SVGSVGElement, lang, true);
  const background = svg.ownerDocument.defaultView?.getComputedStyle(svg).getPropertyValue("--bg").trim() || "#ffffff";
  const box = await makeFilm(TOOLS, { width: shot.width, height: shot.height, scale: FILM_SCALE, fps: plan.fps, mp4: plan.mp4, gifEvery: plan.gifEvery });
  if (plan.gifEvery) {
    for (const t of plan.samples) box.sample(await shot.draw(t, FILM_SCALE, background));
    box.seal();
  }
  for (let i = 0; i < plan.frames; i++) await box.push(await shot.draw(i / plan.fps, FILM_SCALE, background), i);
  const made = await box.finish();
  return {
    frames: plan.frames,
    width: shot.width,
    height: shot.height,
    ...(made.mp4 ? { mp4: new Blob([made.mp4 as BlobPart], { type: "video/mp4" }) } : {}),
    ...(made.gif ? { gif: new Blob([made.gif as BlobPart], { type: "image/gif" }) } : {}),
  };
}

/** 頁に描いた dragon の図の動きを 1 周撮った GIF。`dragon export --format gif` と同じコマの数と縦横 */
export async function captureGif(svg: CaptureFigure, options: Omit<FilmOptions, "formats"> = {}): Promise<Blob> {
  return (await captureFilm(svg, { ...options, formats: ["gif"] })).gif as Blob;
}

/** 頁に描いた dragon の図の動きを 1 周撮った mp4。`dragon export --format mp4` と同じコマの数と縦横 (2 倍)。作れないブラウザでは断る */
export async function captureMp4(svg: CaptureFigure, options: Omit<FilmOptions, "formats"> = {}): Promise<Blob> {
  return (await captureFilm(svg, { ...options, formats: ["mp4"] })).mp4 as Blob;
}
