/**
 * 色覚の違いを模して、2 色の差を測る道具 (#2985)。
 *
 * 見え方は Machado らの 2009 年の行列 (強さ 1.0) を線形の RGB に掛けて模す。
 * 差は OKLab の距離を 100 倍した値で、見本帳の検査 (`docs/design/base/check-palettes.mjs`) と同じ物差しにする。
 * 物差しが同じなら、見本帳で測った値と package の検査の値を突き合わせられる。
 */

export type Sight = "normal" | "protan" | "deutan" | "tritan";

const MACHADO: Record<Exclude<Sight, "normal">, number[][]> = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

const toLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function linearRgb(hex: string): number[] {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`6 桁の色ではない: ${hex}`);
  return [1, 3, 5].map((i) => toLinear(Number.parseInt(hex.slice(i, i + 2), 16) / 255));
}

function simulate(rgb: number[], sight: Sight): number[] {
  if (sight === "normal") return rgb;
  return MACHADO[sight].map((row) => Math.min(1, Math.max(0, row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2])));
}

function oklab([r, g, b]: number[]): number[] {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** 2 色を同じ見え方で見た時の差。OKLab の距離の 100 倍。 */
export function colorDistance(a: string, b: string, sight: Sight): number {
  const x = oklab(simulate(linearRgb(a), sight));
  const y = oklab(simulate(linearRgb(b), sight));
  return 100 * Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

/** 色の並びの全ての組のうち、一番近い組の差と、その組の 2 色。 */
export function closestPair(colors: string[], sight: Sight): { distance: number; pair: [string, string] } {
  let best = { distance: Number.POSITIVE_INFINITY, pair: ["", ""] as [string, string] };
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const distance = colorDistance(colors[i], colors[j], sight);
      if (distance < best.distance) best = { distance, pair: [colors[i], colors[j]] };
    }
  }
  return best;
}
