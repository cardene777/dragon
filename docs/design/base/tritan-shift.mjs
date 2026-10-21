// 色味の明暗ごとに、今の 5 色を出発点に明るさ / 鮮やかさ / 色相を少しずつ動かし、
// 1 型 / 2 型 / 3 型を模した全ての組で差 6 以上、通常の見え方で差 15 以上を満たす中で、
// 元の色から一番動かない組を探す。3 型 (青と黄が見分けにくい色覚) では青と緑が近づくため、主に青と緑が動く。
// 字に使う濃さ (t-*) は finalize-palettes.mjs と同じ決め方で求め直す。
// 乱数で探すので、回すたびに値が少し変わる。palettes.json へは書かず、見つけた値を出すだけ
// DATAVIZ_VALIDATOR=<validate_palette.js> node tritan-shift.mjs <色味> <light|dark>
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contrast } from "./validator.mjs";

const DIR = dirname(fileURLToPath(import.meta.url));
const P = JSON.parse(readFileSync(join(DIR, "palettes.json"), "utf8"));
const SLOTS = ["blue", "amber", "green", "violet", "rose"];
const [id, mode] = process.argv.slice(2);
const m = P[id]?.[mode];
if (!m) { console.error("色味と明暗を渡す (例 paper dark)"); process.exit(2); }

// 見本帳の検査と同じ物差し。Machado らの 2009 年の行列 (強さ 1.0) で見え方を模し、OKLab の距離の 100 倍で測る
const MACHADO = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
const s2l = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lin = (h) => [1, 3, 5].map((i) => s2l(parseInt(h.slice(i, i + 2), 16) / 255));
const lab = ([r, g, b]) => {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * mm + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * mm - 0.808675766 * s];
};
const sim = (h, k) => { const v = lin(h); return k ? MACHADO[k].map((row) => Math.max(0, Math.min(1, row[0] * v[0] + row[1] * v[1] + row[2] * v[2]))) : v; };
const dE = (a, b, k) => { const x = lab(sim(a, k)), y = lab(sim(b, k)); return 100 * Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
const closest = (pal, k) => { let d = Infinity; for (let i = 0; i < pal.length; i++) for (let j = i + 1; j < pal.length; j++) d = Math.min(d, dE(pal[i], pal[j], k)); return d; };
const toOklch = (hex) => { const [L, A, B] = lab(lin(hex)); return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360]; };
const toHex = (L, C, H) => {
  for (let c = C; c >= 0; c -= 0.004) {
    const a = c * Math.cos((H * Math.PI) / 180), b = c * Math.sin((H * Math.PI) / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const rgb = [4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s];
    if (rgb.every((v) => v >= -0.0005 && v <= 1.0005)) return "#" + rgb.map((v) => { v = Math.min(1, Math.max(0, v)); v = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; return Math.round(v * 255).toString(16).padStart(2, "0"); }).join("");
  }
  return null;
};
const textOf = (c) => {
  const [L, C, H] = toOklch(c), need = mode === "light" ? 5.5 : 7;
  for (let k = 0; k < 80; k++) {
    const hex = toHex(mode === "light" ? L - k * 0.005 : L + k * 0.005, C, H);
    if (hex && contrast(hex, m.bg.slice(0, 7)) >= need && contrast(hex, m.surf.slice(0, 7)) >= need) return hex;
  }
  return null;
};

// 検査の道具 (validate_palette.js) の明るさの帯と鮮やかさの下限、地との 3:1 を守る
const BAND = { light: [0.43, 0.77], dark: [0.48, 0.67] }[mode];
const orig = SLOTS.map((s) => m[`c-${s}`]);
const start = orig.map(toOklch);
// 1 型と 2 型は今より下げない (8 を超えていた所は 8 までは許す)。通常の見え方は 15 に 0.4 の余裕を持たせる
const cvdFloor = Math.max(6, Math.min(8, closest(orig, "protan"), closest(orig, "deutan")));
const fits = (pal) => {
  for (const c of pal) {
    const [L, C] = toOklch(c);
    if (L < BAND[0] || L > BAND[1] || C < 0.1 || contrast(c, m.surf.slice(0, 7)) < 3) return false;
  }
  return closest(pal, null) >= 15.4 && closest(pal, "tritan") >= 6.3 && closest(pal, "protan") >= cvdFloor && closest(pal, "deutan") >= cvdFloor;
};
let best = fits(orig) ? { moved: 0, pal: orig } : null;
for (let n = 0; n < 200000 && best?.moved !== 0; n++) {
  const scale = n < 100000 ? 1 : 0.4;
  const pal = start.map(([L, C, H]) => (Math.random() < 0.4 ? toHex(L, C, H) : toHex(L + (Math.random() - 0.5) * 0.14 * scale, Math.max(0.1, C + (Math.random() - 0.5) * 0.08 * scale), H + (Math.random() - 0.5) * 40 * scale)));
  if (pal.includes(null) || !fits(pal)) continue;
  const moved = pal.reduce((s, c, i) => s + dE(c, orig[i]), 0);
  if (!best || moved < best.moved) best = { moved, pal };
}
if (!best) { console.error(`${id} ${mode}: 条件を満たす組が見つからない`); process.exit(1); }
const out = {};
best.pal.forEach((c, i) => { if (c !== orig[i]) { out[`c-${SLOTS[i]}`] = c; out[`t-${SLOTS[i]}`] = textOf(c); } });
console.log(JSON.stringify({ id, mode, moved: +best.moved.toFixed(1), set: out, tritan: +closest(best.pal, "tritan").toFixed(1) }));
