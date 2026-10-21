// 方向ごとに 5 色の色相の範囲と鮮やかさを決め、全ての組が見分けられる色を探す。
// 図では離れた区画の色も並んで見えるため、隣り合う組ではなく全ての組で見る。
// node search-palette.mjs <方向> <light|dark> <地の色>
import { validate, contrast } from "./validator.mjs";

// OKLCH から sRGB の hex へ。色域の外は鮮やかさを落として戻す
const toHex = (L, C, H) => {
  for (let c = C; c >= 0; c -= 0.004) {
    const a = c * Math.cos((H * Math.PI) / 180), b = c * Math.sin((H * Math.PI) / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
    if (rgb.every((v) => v >= -0.0005 && v <= 1.0005)) {
      return "#" + rgb.map((v) => { v = Math.min(1, Math.max(0, v)); v = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; return Math.round(v * 255).toString(16).padStart(2, "0"); }).join("");
    }
  }
  return null;
};

// 色相の範囲 [下, 上] と鮮やかさの範囲。並びは blue / amber / green / violet / rose
// 明るさは色ごとに範囲を持たせ、琥珀は明るく、紫は暗く、と色の性格を保つ
const LR = {
  light: [[0.5, 0.62], [0.6, 0.68], [0.55, 0.66], [0.45, 0.53], [0.54, 0.64]],
  dark: [[0.58, 0.665], [0.62, 0.665], [0.58, 0.665], [0.5, 0.585], [0.55, 0.645]],
};
const DIR = {
  clear: { H: [[248, 266], [58, 78], [150, 172], [290, 312], [8, 24]], C: [0.14, 0.2] },
  paper: { H: [[250, 268], [62, 82], [128, 150], [310, 330], [28, 44]], C: [0.11, 0.155] },
  night: { H: [[225, 245], [70, 88], [140, 160], [285, 305], [345, 360]], C: [0.15, 0.21] },
};
const [dir, mode, surface] = process.argv.slice(2);
const band = mode === "light" ? [0.45, 0.75] : [0.5, 0.665];
const spec = DIR[dir];
const rnd = (a, b) => a + Math.random() * (b - a);
let best = null;
for (let n = 0; n < 150000; n++) {
  const pal = spec.H.map(([h0, h1], k) => toHex(rnd(...LR[mode][k]), rnd(...spec.C), rnd(h0, h1)));
  if (pal.includes(null) || pal.some((c) => contrast(c, surface) < 3)) continue;
  const r = validate(pal, { mode, surface, pairs: "all" });
  const txt = r.report.map(([, , d]) => d).join(" ");
  const cvd = +(txt.match(/worst all-pairs \S+ ΔE ([\d.]+) \((?:protan|deutan)\)/)?.[1] ?? 0);
  const nor = +(txt.match(/worst all-pairs \S+ ΔE ([\d.]+) \(normal\)/)?.[1] ?? 0);
  const band_ok = r.report[0][1] === true, chroma_ok = r.report[1][1] === true;
  if (!band_ok || !chroma_ok || nor < 15) continue;
  const score = Math.min(cvd, 12) * 10 + nor;
  if (!best || score > best.score) best = { score, pal, cvd, nor };
}
console.log(JSON.stringify(best));
