/**
 * `gifenc` は型を持たないので、書き出す入口 (`capture/index.ts`) が使う部品の形だけをここで名指す (#3644)。
 * 詰める処理 (`export/film.ts`) は道具を引数で受け、この形を読まない
 */
declare module "gifenc" {
  export function GIFEncoder(): unknown;
  export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number): number[][];
  export function nearestColorIndex(palette: number[][], pixel: number[]): number;
}
