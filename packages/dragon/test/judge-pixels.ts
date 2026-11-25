/**
 * 判定の表 (#3879) を書き出した絵の画素を、表の色の値から作った色で数える道具 (#3923、#3937)。
 * 命令の書き出しの検査 (`judge-export.test.ts`) と、ブラウザで書き出す入口の検査 (`capture.test.ts`) が同じ数え方を使う。
 *
 * 判定の札の地は緑か赤を地の色に 14% 混ぜた色、見出しの番号の丸の地は青を見出しの地に 14% 混ぜた色で、どちらも表のほかの所に無い。
 * 照らした列の見出しの地は青を見出しの地に 16% 混ぜた色で、再生の部品が段を送った時だけ付く (`render/judge.ts` の `showJudge`)。
 */

/** 撮る画素の細かさ (CSS の 1px あたりの画素)。書き出しの `FILM_SCALE` */
export const SCALE = 2;
/**
 * 混ぜた色と書き出した画素の差の許し (色の成分ごと)。混ぜる時と重ねる時の丸めの分。
 * 見出しの番号の丸の地 (青 14%) と照らした見出しの地 (青 16%) は赤の成分で 3.4 しか違わないので、2 より小さくする
 */
const NEAR = 1.5;
/** 塗った地と数える画素の、左右に続く同じ色の画素の数。線の縁が地へ溶ける所 (✓ の縁は緑を地に薄く混ぜた色になる) を数えない */
const RUN = 2;

export type Rgb = [number, number, number];
/** 画素を RGBA の並びで持つ絵 */
export interface Picture {
  width: number;
  height: number;
  data: Uint8Array;
}
/** 表の色の値 (描いた HTML の根の `style` に書いた `--surf` など) を持つ物 */
export interface Colored {
  colors: Record<string, string>;
}

/** 描いた HTML の根の `style` に書いた色の値 (`--surf` など) */
export function colorsOf(markup: string): Record<string, string> {
  const style = /style="([^"]*)"/.exec(markup)?.[1]?.replace(/&quot;/g, '"') ?? "";
  return Object.fromEntries(
    [...style.matchAll(/(--[\w-]+):(#[0-9a-f]{6,8})/gi)].map(([, name, value]) => [
      name as string,
      value as string,
    ]),
  );
}

const hex = (value: string | undefined): Rgb => {
  const v = (value ?? "#000000").replace("#", "");
  return [0, 2, 4].map((i) => Number.parseInt(v.slice(i, i + 2), 16)) as Rgb;
};
/** `color` を `base` に `amount` の割合で混ぜた色 (`color-mix(in srgb, color amount, base)` と、透明に混ぜて地に重ねた色は同じ) */
const mix = (color: Rgb, amount: number, base: Rgb): Rgb =>
  base.map((b, i) => b + ((color[i] as number) - b) * amount) as Rgb;

/** 表の中にしか出ない 4 つの色 */
export function marks(facts: Colored): { pass: Rgb; block: Rgb; badge: Rgb; now: Rgb } {
  const c = (name: string): Rgb => hex(facts.colors[name]);
  return {
    pass: mix(c("--c-green"), 0.14, c("--surf")),
    block: mix(c("--c-rose"), 0.14, c("--surf")),
    badge: mix(c("--c-blue"), 0.14, c("--sunk")),
    now: mix(c("--c-blue"), 0.16, c("--sunk")),
  };
}

/** `color` で塗った地の画素の位置。左右に `RUN` 画素ずつ同じ色が続く画素だけを数える */
export function spots(picture: Picture, color: Rgb): { x: number; y: number }[] {
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
export function span(values: number[]): { min: number; max: number } {
  return values.reduce((m, v) => ({ min: Math.min(m.min, v), max: Math.max(m.max, v) }), {
    min: Number.POSITIVE_INFINITY,
    max: Number.NEGATIVE_INFINITY,
  });
}

/** 並んだ値を、`gap` より離れた所で分けた塊の真ん中 */
export function clusters(values: number[], gap: number): number[] {
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
export function vivid(
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

/** 判定の札の画素の囲みと、札の行の数。札は判定の列にだけ在る */
export function verdictBox(
  picture: Picture,
  facts: Colored,
): { left: number; right: number; top: number; bottom: number; rows: number } {
  const { pass, block } = marks(facts);
  const found = [...spots(picture, pass), ...spots(picture, block)];
  const xs = span(found.map((p) => p.x));
  const ys = found.map((p) => p.y);
  const { min: top, max: bottom } = span(ys);
  return { left: xs.min, right: xs.max, top, bottom, rows: clusters(ys, 4 * SCALE).length };
}

/** PNG の絵の判定の札の囲みを、CSS の 1px を 1 画素で撮った GIF の絵の囲みにする */
export function toGifBox(box: { left: number; right: number; top: number; bottom: number }): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  return {
    left: Math.floor(box.left / SCALE),
    right: Math.ceil(box.right / SCALE),
    top: Math.floor(box.top / SCALE),
    bottom: Math.ceil(box.bottom / SCALE),
  };
}
