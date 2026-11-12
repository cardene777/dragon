/**
 * GIF と mp4 のコマの計画と、頁の中でコマを詰める処理 (#3644)。
 *
 * 命令の書き出し (`export/capture.ts`) は画面なしの Chromium の頁で、書き出す入口 (`capture/index.ts`) は読み手の頁で、
 * どちらもこの計画でコマの数と間引きを決め、この処理でコマを詰める。同じ図なら、どちらで書き出してもコマの数と縦横が揃う。
 *
 * mp4 は WebCodecs で H.264 にして `mediabunny` で箱に入れ、GIF は `gifenc` で詰める。
 * 詰める道具は引数で受け取り、この file は読まない。描く入口と命令が読む部品に道具を持ち込まないため。
 * この file は Node の組み込みの module も読まない。書き出す入口が頁で読むため。
 */

/** CSS の 1px を何画素で撮るか。mp4 と PNG はこの倍率で、GIF は 1 倍で詰める */
export const FILM_SCALE = 2;

/** 既定の 1 秒のコマの数。mp4 は 30 コマ、GIF は 10 コマ */
export const FILM_RATES = { fps: 30, gifFps: 10 } as const;

export interface FilmPlan {
  /** 1 周の秒 */
  total: number;
  /** 撮る 1 秒のコマの数 */
  fps: number;
  /** 撮るコマの数 */
  frames: number;
  mp4: boolean;
  /** GIF は撮ったコマのこの数に 1 枚を使う。0 なら GIF を作らない */
  gifEvery: number;
  /** GIF の色の表を作る絵の時刻 (秒)。最初の絵と段ごとの止め絵 */
  samples: number[];
}

/**
 * 1 周 (`timeline.total` 秒) を撮る計画。mp4 を作る時は mp4 の速さで撮り、GIF はそのコマを間引いて使う。
 * GIF だけを作る時は GIF の速さで撮る
 */
export function planFilm(
  timeline: { total: number; stills: readonly number[] },
  want: { mp4: boolean; gif: boolean; fps?: number; gifFps?: number },
): FilmPlan {
  const gifFps = want.gifFps ?? FILM_RATES.gifFps;
  const fps = want.mp4 ? (want.fps ?? FILM_RATES.fps) : gifFps;
  return {
    total: timeline.total,
    fps,
    frames: Math.round(timeline.total * fps),
    mp4: want.mp4,
    gifEvery: want.gif ? Math.max(1, Math.round(fps / gifFps)) : 0,
    samples: [0, ...timeline.stills],
  };
}

/** 詰める道具。`mb` は `mediabunny`、`gif` は `gifenc` の module (使う部品だけを持つ物でもよい) */
export interface FilmTools {
  mb: any;
  gif: any;
}

/** 詰める大きさと速さ。`width` と `height` は CSS の px で、mp4 はその `scale` 倍で詰める */
export interface FilmSize {
  width: number;
  height: number;
  scale: number;
  fps: number;
  mp4: boolean;
  gifEvery: number;
}

/**
 * 頁の中でコマを詰める箱。`sample` で GIF の色の表の元を集め、`seal` で色の表を決めてから `push` でコマを渡す。
 * 渡す絵は CSS の px の `scale` 倍の大きさで描いた物
 */
export interface FilmBox {
  sample(image: CanvasImageSource): void;
  seal(): void;
  push(image: CanvasImageSource, i: number): Promise<void>;
  finish(): Promise<{ mp4?: Uint8Array; gif?: Uint8Array }>;
}

/**
 * コマを詰める箱を作る。GIF の色の表は集めた絵から 1 つだけ作り、全てのコマをその表で塗る。
 * コマごとに表を作ると、寄って追う図でコマ全体が動いた後、止まった所の淡い色がコマごとの表でばらばらに残る。
 *
 * 命令の書き出しは、この関数の字の並び (`makeFilm.toString()`) を撮る頁へ送って動かす。
 * そのため関数の外の名前 (import した部品やこの file の定数) を読まず、引数と頁の組み込みの物だけで書く
 */
export async function makeFilm(tools: FilmTools, size: FilmSize): Promise<FilmBox> {
  const { mb, gif } = tools;
  const { width, height, scale, fps, mp4, gifEvery } = size;
  let add: (image: CanvasImageSource, i: number) => Promise<void> = () => Promise.resolve();
  let close: () => Promise<Uint8Array | undefined> = () => Promise.resolve(undefined);
  if (mp4) {
    const canvas = new OffscreenCanvas(width * scale, height * scale);
    const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
    const target = new mb.BufferTarget();
    const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: "in-memory" }), target });
    const source = new mb.CanvasSource(canvas, { codec: "avc", bitrate: mb.QUALITY_MEDIUM, keyFrameInterval: 2 });
    output.addVideoTrack(source, { frameRate: fps });
    await output.start();
    add = async (image, i) => {
      context.drawImage(image, 0, 0, width * scale, height * scale);
      await source.add(i / fps, 1 / fps);
    };
    close = async () => {
      await output.finalize();
      return new Uint8Array(target.buffer as ArrayBuffer);
    };
  }

  // GIF は CSS の 1px を 1 画素で詰める。前のコマの元の絵と 1 つでも色が違う画素だけを書き、残りは透明にする。
  // 撮る絵は毎回同じなので、動いていない所はぴったり一致する。
  // 差に幅を持たせると、ゆっくり消える物の最後の数段が書かれず、薄い残りになる
  const small = new OffscreenCanvas(width, height);
  const smallContext = small.getContext("2d", { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;
  const read = (image: CanvasImageSource): Uint8ClampedArray => {
    smallContext.clearRect(0, 0, width, height);
    smallContext.drawImage(image, 0, 0, width, height);
    return smallContext.getImageData(0, 0, width, height).data;
  };
  const encoder = gifEvery ? gif.GIFEncoder() : undefined;
  const delay = (gifEvery / fps) * 1000;
  const sampled: Uint8ClampedArray[] = [];
  // 色の表。最後の 1 色は透明に使う
  let colors: number[][] = [];
  // 色ごとに表のどの色で塗るかを 1 度だけ決めて覚える。`gifenc` の `applyPalette` は似た色の組ごとに
  // そのコマで最初に見た色で塗る色を決めるので、同じ色でもコマによって塗る色が変わり、
  // 動いた所だけを書くと、書いたコマごとに淡い色がずれて前の絵の形が浮く
  const nearest = new Map<number, number>();
  const toIndex = (data: Uint8ClampedArray): Uint8Array => {
    const index = new Uint8Array(data.length / 4);
    for (let p = 0; p < index.length; p++) {
      const i = p * 4;
      const key = ((data[i] as number) << 16) | ((data[i + 1] as number) << 8) | (data[i + 2] as number);
      let k = nearest.get(key);
      if (k === undefined) {
        k = gif.nearestColorIndex(colors, [data[i], data[i + 1], data[i + 2]]) as number;
        nearest.set(key, k);
      }
      index[p] = k;
    }
    return index;
  };
  let previous: Uint8ClampedArray | undefined;
  const writeGif = (data: Uint8ClampedArray): void => {
    const clear = colors.length;
    const index = toIndex(data);
    const before = previous;
    previous = data;
    if (!before) {
      encoder.writeFrame(index, width, height, { palette: [...colors, [0, 0, 0]], delay, dispose: 1 });
      return;
    }
    let changed = 0;
    for (let p = 0; p < index.length; p++) {
      const i = p * 4;
      if (data[i] === before[i] && data[i + 1] === before[i + 1] && data[i + 2] === before[i + 2]) index[p] = clear;
      else changed++;
    }
    // 変わった所が無いコマは、透明な 1 画素だけを書いて時間だけ進める
    if (!changed) encoder.writeFrame(new Uint8Array([clear]), 1, 1, { transparent: true, transparentIndex: clear, delay, dispose: 1 });
    else encoder.writeFrame(index, width, height, { transparent: true, transparentIndex: clear, delay, dispose: 1 });
  };

  return {
    sample(image) {
      sampled.push(read(image));
    },
    seal() {
      const all = new Uint8ClampedArray(sampled.reduce((n, data) => n + data.length, 0));
      let offset = 0;
      for (const data of sampled) {
        all.set(data, offset);
        offset += data.length;
      }
      colors = gif.quantize(all, 255);
    },
    async push(image, i) {
      await add(image, i);
      if (gifEvery && i % gifEvery === 0) writeGif(read(image));
    },
    async finish() {
      const video = await close();
      if (encoder) encoder.finish();
      return { ...(video ? { mp4: video } : {}), ...(encoder ? { gif: encoder.bytes() as Uint8Array } : {}) };
    },
  };
}
