// 明るい背景の運ぶ物 (封筒と札) の灰を palettes.json の明るい側へ書き込む (2026-10-21 に案 a で決めた形)。
// node carry-light.mjs          書き込まずに、色味ごとの値を出す
// node carry-light.mjs --write  palettes.json へ書き込む
//
// 灰は字の色 (ink) を明るくしていき、地 (bg) に対して 5.5:1 を割る手前で止めた値にする。
// 札の字は地の色 (白) で書くので、札の字もこの比で読める。暗い側は carry を持たず字の色 (白) で塗る
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contrast } from "./validator.mjs";

const DIR = dirname(fileURLToPath(import.meta.url));
const FILE = join(DIR, "palettes.json");
const P = JSON.parse(readFileSync(FILE, "utf8"));

const s2l = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toOklch = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => s2l(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), (Math.atan2(B, A) * 180) / Math.PI];
};
const toHex = (L, C, H) => {
  for (let c = C; c >= 0; c -= 0.004) {
    const a = c * Math.cos((H * Math.PI) / 180), b = c * Math.sin((H * Math.PI) / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
    if (rgb.every((v) => v >= -0.0005 && v <= 1.0005)) return "#" + rgb.map((v) => { v = Math.min(1, Math.max(0, v)); v = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; return Math.round(v * 255).toString(16).padStart(2, "0"); }).join("");
  }
  return null;
};
const bare = (hex) => hex.slice(0, 7);

for (const [id, p] of Object.entries(P)) {
  const m = p.light, [L, C, H] = toOklch(m.ink);
  let carry = m.ink;
  for (let k = 1; k < 120; k++) {
    const hex = toHex(L + k * 0.004, C, H);
    if (!hex || contrast(hex, bare(m.bg)) < 5.5) break;
    carry = hex;
  }
  m.carry = carry;
  console.log(`${id} ${carry} (地に対して ${contrast(carry, bare(m.bg)).toFixed(2)}:1)`);
}
if (process.argv.includes("--write")) { writeFileSync(FILE, JSON.stringify(P, null, 2) + "\n"); console.log("palettes.json へ書き込んだ"); }
