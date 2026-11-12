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
 * mp4 は WebCodecs の H.264 で詰めるので、WebCodecs を持たないブラウザでは作れない。呼ぶ前に `canCaptureMp4` で確かめ、
 * 作れない時は mp4 の釦を出さない。この入口は詰める道具 (`gifenc`、`mediabunny`) を読むので、描く入口とは分け、
 * 書き出す時にだけ読む。Node の組み込みの module は読まない。
 */
import * as gifencModule from "gifenc";
import { BufferTarget, CanvasSource, canEncodeVideo, Mp4OutputFormat, Output, QUALITY_MEDIUM } from "mediabunny";
import { FILM_SCALE, makeFilm, planFilm } from "../export/film";
import { DEFAULT_LANG, type NotationLang } from "../words";
import { cycleOf, picture, shownAt } from "./picture";

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

/** 断りの文 */
const TEXT: Record<NotationLang, { noCycle: string; noMp4: string }> = {
  ja: {
    noCycle: "図の 1 周の長さ (`--T`) を SVG から読めない。timeline に 1 周の秒を渡す",
    noMp4: "このブラウザは mp4 を作れない (WebCodecs の H.264 が無い)",
  },
  en: {
    noCycle: "Cannot read the cycle length (`--T`) from the SVG. Pass the seconds of one cycle in timeline",
    noMp4: "This browser cannot make mp4 (no H.264 in WebCodecs)",
  },
};

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
   * 図の 1 周の秒 (`total`) と段ごとの止め絵の時刻 (`stills`)。`renderDiagram` が返す `timeline` をそのまま渡せる。
   * 書かなければ 1 周の秒は SVG の `--T` から読み、GIF の色の表は 1 周を 8 つに分けた時刻の絵から作る。
   * 渡すと GIF の色の表を `dragon export` と同じ絵 (最初の絵と段ごとの止め絵) から作る
   */
  timeline?: { total: number; stills: readonly number[] };
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

/** 頁に描いた SVG の、今の時刻 (`at` を渡せばその時刻) の止め絵の PNG。縦横は SVG の `scale` 倍 (既定は 2 倍) */
export async function capturePng(svg: SVGSVGElement, options: StillOptions = {}): Promise<Blob> {
  const at = options.at ?? shownAt(svg);
  const shot = await picture(svg, options.lang ?? DEFAULT_LANG);
  const style = svg.ownerDocument.defaultView?.getComputedStyle(svg);
  // 時刻が読めない図 (動きの無い図) は、写した `--at` のまま止める
  const t = at ?? (Number.parseFloat(style?.getPropertyValue("--at") ?? "") || 0);
  return pngOf(await shot.draw(t, options.scale ?? FILM_SCALE));
}

/** 頁に描いた SVG を、描いた字の file を `data:` で埋めた SVG の文字列にする */
export async function captureSvg(svg: SVGSVGElement, options: CaptureOptions = {}): Promise<string> {
  return (await picture(svg, options.lang ?? DEFAULT_LANG)).svg();
}

/** 頁に描いた dragon の図の動きを 1 周撮り、mp4 と GIF に詰める。地は図の地の色 (`--bg`) で塗る */
export async function captureFilm(svg: SVGSVGElement, options: FilmOptions = {}): Promise<Film> {
  const lang = options.lang ?? DEFAULT_LANG;
  const formats = options.formats ?? ["mp4", "gif"];
  const mp4 = formats.includes("mp4");
  const gif = formats.includes("gif");
  if (mp4 && !(await canCaptureMp4())) throw new Error(TEXT[lang].noMp4);
  const total = options.timeline?.total ?? cycleOf(svg);
  if (total === undefined) throw new Error(TEXT[lang].noCycle);
  const stills = options.timeline?.stills ?? Array.from({ length: 7 }, (_, k) => (total * (k + 1)) / 8);
  const plan = planFilm({ total, stills }, { mp4, gif, fps: options.fps, gifFps: options.gifFps });
  const shot = await picture(svg, lang, true);
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
export async function captureGif(svg: SVGSVGElement, options: Omit<FilmOptions, "formats"> = {}): Promise<Blob> {
  return (await captureFilm(svg, { ...options, formats: ["gif"] })).gif as Blob;
}

/** 頁に描いた dragon の図の動きを 1 周撮った mp4。`dragon export --format mp4` と同じコマの数と縦横 (2 倍)。作れないブラウザでは断る */
export async function captureMp4(svg: SVGSVGElement, options: Omit<FilmOptions, "formats"> = {}): Promise<Blob> {
  return (await captureFilm(svg, { ...options, formats: ["mp4"] })).mp4 as Blob;
}
