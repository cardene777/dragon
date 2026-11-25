/**
 * 判定の表 (#3879) を PNG と GIF と mp4 に書き出す (#3923)。
 *
 * 判定の表は SVG でなく HTML の表で描くので、書き出しは撮る頁で表を描いた大きさを測り、その大きさで撮る。
 * 書き出しは 1 回の実行の準備の段で済ませ (`judge-export.prepare.ts`、#3734)、件は書き出した file の画素を数える。
 *
 * 画素は表の色の値 (描いた HTML の根の `style` の色) から作った色で数える。
 * 判定の札の地は緑か赤を地の色に 14% 混ぜた色、見出しの番号の丸の地は青を見出しの地に 14% 混ぜた色で、どちらも表のほかの所に無い。
 * 照らした列の見出しの地は青を見出しの地に 16% 混ぜた色で、再生の部品が段を送った時だけ付く (`render/judge.ts` の `showJudge`)。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { formatOf } from "./export-support";
import prepare, {
  FILMED,
  type GifShot,
  JUDGE_EXAMPLES,
  type JudgeFacts,
  type Settled,
  STEPPED,
} from "./judge-export.prepare";
import { fileChromium } from "./page-needs";
import { prepared } from "./prepared";

/** 準備の段が書き出した結果 */
const done = (): Awaited<ReturnType<typeof prepare>> => prepared(import.meta.url);

/** GIF を file で 1 つの Chromium (#3424) の `ImageDecoder` で読み戻し、`indexes` 番目のコマを重ねて描き終えた絵で返す */
async function gifFrames(gif: Buffer, indexes: number[]): Promise<GifShot[]> {
  const context = await (await fileChromium()).newContext();
  try {
    const page = await context.newPage();
    await page.route("http://localhost/**", (route) =>
      new URL(route.request().url()).pathname === "/film.gif"
        ? route.fulfill({ contentType: "image/gif", body: gif })
        : route.fulfill({ contentType: "text/html", body: "<!doctype html><p>gif</p>" }),
    );
    await page.goto("http://localhost/");
    const shots = await page.evaluate(async (indexes) => {
      const data = await (await fetch("/film.gif")).arrayBuffer();
      const decoder = new ImageDecoder({ data, type: "image/gif" });
      await decoder.tracks.ready;
      const out: { width: number; height: number; rgba: string }[] = [];
      for (const frameIndex of indexes) {
        const { image } = await decoder.decode({ frameIndex });
        const canvas = new OffscreenCanvas(image.displayWidth, image.displayHeight);
        const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
        context.drawImage(image, 0, 0);
        image.close();
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let text = "";
        for (let i = 0; i < pixels.length; i += 0x8000)
          text += String.fromCharCode(...pixels.subarray(i, i + 0x8000));
        out.push({ width: canvas.width, height: canvas.height, rgba: btoa(text) });
      }
      return out;
    }, indexes);
    return shots;
  } finally {
    await context.close();
  }
}

/** 命令で書き出した GIF の最初のコマと、最後の段の止め絵の時刻のコマ。頁を開く仕事なので件の中でなく読み込む段で読む (#3940) */
const FRAMES = await atLoad("GIF のコマを読み戻す", async () => {
  const film = done().film;
  const gif = film.ok ? film.value.gif : undefined;
  if (!gif) return undefined;
  const [first, last] = await gifFrames(readFileSync(gif.path), [0, gif.lastIndex]);
  return first && last ? { first, last, lastIndex: gif.lastIndex } : undefined;
});

/** 撮る画素の細かさ (CSS の 1px あたりの画素)。書き出しの `FILM_SCALE` */
const SCALE = 2;
/**
 * 混ぜた色と書き出した画素の差の許し (色の成分ごと)。混ぜる時と重ねる時の丸めの分。
 * 見出しの番号の丸の地 (青 14%) と照らした見出しの地 (青 16%) は赤の成分で 3.4 しか違わないので、2 より小さくする
 */
const NEAR = 1.5;
/** 塗った地と数える画素の、左右に続く同じ色の画素の数。線の縁が地へ溶ける所 (✓ の縁は緑を地に薄く混ぜた色になる) を数えない */
const RUN = 2;

type Rgb = [number, number, number];
interface Picture {
  width: number;
  height: number;
  data: Uint8Array;
}

const hex = (value: string | undefined): Rgb => {
  const v = (value ?? "#000000").replace("#", "");
  return [0, 2, 4].map((i) => Number.parseInt(v.slice(i, i + 2), 16)) as Rgb;
};
/** `color` を `base` に `amount` の割合で混ぜた色 (`color-mix(in srgb, color amount, base)` と、透明に混ぜて地に重ねた色は同じ) */
const mix = (color: Rgb, amount: number, base: Rgb): Rgb =>
  base.map((b, i) => b + ((color[i] as number) - b) * amount) as Rgb;

/** 表の中にしか出ない 4 つの色 */
function marks(facts: JudgeFacts): { pass: Rgb; block: Rgb; badge: Rgb; now: Rgb } {
  const c = (name: string): Rgb => hex(facts.colors[name]);
  return {
    pass: mix(c("--c-green"), 0.14, c("--surf")),
    block: mix(c("--c-rose"), 0.14, c("--surf")),
    badge: mix(c("--c-blue"), 0.14, c("--sunk")),
    now: mix(c("--c-blue"), 0.16, c("--sunk")),
  };
}

const readPng = (file: string): Picture => {
  const png = PNG.sync.read(readFileSync(file));
  return { width: png.width, height: png.height, data: png.data };
};
const fromGif = (shot: GifShot): Picture => ({
  width: shot.width,
  height: shot.height,
  data: Buffer.from(shot.rgba, "base64"),
});

/** `color` で塗った地の画素の位置。左右に `RUN` 画素ずつ同じ色が続く画素だけを数える */
function spots(picture: Picture, color: Rgb): { x: number; y: number }[] {
  const near = (x: number, y: number): boolean => {
    const at = (y * picture.width + x) * 4;
    return (
      (picture.data[at + 3] as number) >= 250 &&
      color.every((v, i) => Math.abs((picture.data[at + i] as number) - v) <= NEAR)
    );
  };
  const found: { x: number; y: number }[] = [];
  for (let y = 0; y < picture.height; y++) {
    for (let x = RUN; x < picture.width - RUN; x++) {
      let run = true;
      for (let dx = -RUN; dx <= RUN && run; dx++) run = near(x + dx, y);
      if (run) found.push({ x, y });
    }
  }
  return found;
}

/** 並んだ値の最小と最大 */
function span(values: number[]): { min: number; max: number } {
  return values.reduce((m, v) => ({ min: Math.min(m.min, v), max: Math.max(m.max, v) }), {
    min: Number.POSITIVE_INFINITY,
    max: Number.NEGATIVE_INFINITY,
  });
}

/** 並んだ値を、`gap` より離れた所で分けた塊の真ん中 */
function clusters(values: number[], gap: number): number[] {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  const groups: number[][] = [];
  for (const v of sorted) {
    const last = groups.at(-1);
    if (last && v - (last.at(-1) as number) <= gap) last.push(v);
    else groups.push([v]);
  }
  return groups.map((g) => ((g[0] as number) + (g.at(-1) as number)) / 2);
}

/** 色の濃い画素 (成分の最大と最小の差が 60 より大きい) の数。判定の語と ✓ と ✕ の線の色は濃く、地と枠と黒い字は淡い */
function vivid(
  picture: Picture,
  box: { left: number; right: number; top: number; bottom: number },
): number {
  let count = 0;
  for (let y = Math.max(0, box.top); y <= Math.min(picture.height - 1, box.bottom); y++) {
    for (let x = Math.max(0, box.left); x <= Math.min(picture.width - 1, box.right); x++) {
      const at = (y * picture.width + x) * 4;
      const rgb = [picture.data[at], picture.data[at + 1], picture.data[at + 2]] as number[];
      if (Math.max(...rgb) - Math.min(...rgb) > 60) count++;
    }
  }
  return count;
}

/** 書き出しが落ちた時は理由を挙げて落とす */
function value<T>(settled: Settled<T> | undefined, what: string): T {
  expect(settled, `${what} の結果が無い`).toBeDefined();
  if (!settled?.ok) expect.fail(`${what} を書き出せない: ${settled?.error.split("\n")[0]}`);
  return settled.value;
}

const factsOf = (file: string): JudgeFacts => done().facts[file] as JudgeFacts;

/** 判定の札の画素の囲み。札は判定の列にだけ在る */
function verdictBox(
  picture: Picture,
  facts: JudgeFacts,
): { left: number; right: number; top: number; bottom: number; rows: number } {
  const { pass, block } = marks(facts);
  const found = [...spots(picture, pass), ...spots(picture, block)];
  const xs = span(found.map((p) => p.x));
  const ys = found.map((p) => p.y);
  const { min: top, max: bottom } = span(ys);
  return { left: xs.min, right: xs.max, top, bottom, rows: clusters(ys, 4 * SCALE).length };
}

describe("判定の表の PNG (#3923)", () => {
  it("judge-png-shows-every-column", () => {
    for (const file of JUDGE_EXAMPLES) showsEveryColumn(file);
  });

  /** 見本 1 つの PNG に、全ての規則の列と、全ての行の判定の札が切れずに写る */
  function showsEveryColumn(file: string): void {
    const facts = factsOf(file);
    const picture = readPng(value(done().pngs[file], file));
    const { pass, block, badge } = marks(facts);
    // 見出しの番号の丸は規則の列ごとに 1 つ。全ての規則の列が写れば、丸の塊の数が規則の数になる
    const badges = clusters(
      spots(picture, badge).map((p) => p.x),
      4 * SCALE,
    );
    expect(badges.length, `${file} の見出しの番号の丸の数`).toBe(facts.rules);
    // 判定の札は例の行ごとに 1 つ。通す例と止める例の札がどちらも写り、行の数だけ在る
    expect(spots(picture, pass).length > 0, `${file} に通す札が写る`).toBe(
      facts.verdicts.includes("pass"),
    );
    expect(spots(picture, block).length > 0, `${file} に止める札が写る`).toBe(
      facts.verdicts.includes("block"),
    );
    const box = verdictBox(picture, facts);
    expect(box.rows, `${file} の判定の札の行の数`).toBe(facts.verdicts.length);
    // 判定の列は右端の列。札の右に表の枠の内側の余白 (8px 以上) が残れば、判定の列は切れていない
    expect(
      picture.width - 1 - box.right,
      `${file} の判定の札の右の余白 (画素)`,
    ).toBeGreaterThanOrEqual(8 * SCALE);
  }

  it("judge-png-default-shows-all-unlit", () => {
    for (const file of JUDGE_EXAMPLES) {
      const facts = factsOf(file);
      const picture = readPng(value(done().pngs[file], file));
      expect(
        spots(picture, marks(facts).now).length,
        `${file} の照らした列の見出しの色の画素`,
      ).toBe(0);
      expect(verdictBox(picture, facts).rows, `${file} の判定の札の行の数`).toBe(
        facts.verdicts.length,
      );
    }
  });

  it("judge-png-step-lights-chosen-column", () => {
    const facts = factsOf(STEPPED);
    const picture = readPng(value(done().stepped, `${STEPPED} の --step 2`));
    const whole = readPng(value(done().pngs[STEPPED], STEPPED));
    const { pass, block, badge, now } = marks(facts);
    // 照らした見出しは 2 番目の規則の列に在る。列の位置は、照らさない PNG の見出しの番号の丸の塊で決める
    const columns = clusters(
      spots(whole, badge).map((p) => p.x),
      4 * SCALE,
    );
    const lit = spots(picture, now).map((p) => p.x);
    expect(lit.length, "照らした列の見出しの色の画素").toBeGreaterThan(0);
    const second = columns[1] as number;
    const { min, max } = span(lit);
    expect(
      min <= second && second <= max,
      `照らした見出し (${min} から ${max}) が 2 番目の丸 (${second}) を含む`,
    ).toBe(true);
    expect(spots(picture, pass).length + spots(picture, block).length, "判定の札の画素").toBe(0);
  });

  it("judge-png-ignores-narrow-width", () => {
    const narrow = readPng(value(done().narrow, `${STEPPED} の --width 390`));
    const whole = readPng(value(done().pngs[STEPPED], STEPPED));
    expect([narrow.width, narrow.height], "幅 390 で書き出した PNG の大きさ").toEqual([
      whole.width,
      whole.height,
    ]);
    expect(verdictBox(narrow, factsOf(STEPPED)).rows, "幅 390 の PNG の判定の札の行の数").toBe(
      factsOf(STEPPED).verdicts.length,
    );
  });

  it("png-export-keeps-svg-size", () => {
    const { png, width, height } = done().svg;
    const picture = readPng(png);
    expect([picture.width, picture.height], "SVG の図の PNG の大きさ").toEqual([
      width * SCALE,
      height * SCALE,
    ]);
  });

  it("judge-export-refuses-missing-step", () => {
    const { error, outDir } = done().refused;
    expect(error, "図に無い段を選んだ書き出しが断られない").toMatch(/No step 99 in the diagram/);
    expect(
      () => readFileSync(join(outDir, "diagram.png")),
      "断った書き出しが PNG を書いた",
    ).toThrow();
  });
});

describe("判定の表の命令の書き出しと動画 (#3923)", () => {
  it("judge-export-writes-four-formats", () => {
    const film = value(done().film, `${FILMED} の命令の書き出し`);
    expect(film.ran.code, `命令が落ちた: ${film.ran.stderr}`).toBe(0);
    for (const format of ["mp4", "gif", "html", "png"] as const) {
      const file = join(film.out, FILMED.replace(/\.dragon$/u, `.${format}`));
      let bytes = Buffer.alloc(0);
      try {
        bytes = readFileSync(file);
      } catch {
        // 書かれていない時は空にして、形の判定で落とす
      }
      expect(formatOf(bytes), `${file} が ${format} として書かれていない`).toBe(format);
    }
  });

  it("judge-film-lights-columns-by-step", () => {
    const film = value(done().film, `${FILMED} の命令の書き出し`);
    const frames = FRAMES.get();
    expect(frames, `GIF のコマを読めない: ${film.ran.stderr}`).toBeDefined();
    if (!frames) return;
    const facts = factsOf(FILMED);
    const whole = readPng(value(done().pngs[FILMED], FILMED));
    const first = fromGif(frames.first);
    const last = fromGif(frames.last);
    // GIF は CSS の 1px を 1 画素で撮り、PNG は 2 画素で撮る
    expect([first.width * SCALE, first.height * SCALE], "GIF のコマの大きさの 2 倍").toEqual([
      whole.width,
      whole.height,
    ]);
    // 判定の札の囲みは、照らさない PNG の札の画素で決める。GIF は色を減らすので、コマでは色の濃い画素 (判定の語の色) を数える
    const pills = verdictBox(whole, facts);
    const box = {
      left: Math.floor(pills.left / SCALE),
      right: Math.ceil(pills.right / SCALE),
      top: Math.floor(pills.top / SCALE),
      bottom: Math.ceil(pills.bottom / SCALE),
    };
    expect(vivid(first, box), "最初のコマの判定の札の所の色の濃い画素").toBe(0);
    expect(
      vivid(last, box),
      `${frames.lastIndex} 番目のコマ (最後の段) の判定の札の所の色の濃い画素`,
    ).toBeGreaterThan(0);
  });
});
