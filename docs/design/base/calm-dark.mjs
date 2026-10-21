// 暗い背景の強さを抑える値を palettes.json の暗い側へ書き込む (2026-10-21 に案 b で決めた形)。
// node calm-dark.mjs          書き込まずに、色味ごとの新しい値と検査の結果を出す
// node calm-dark.mjs --write  検査が通った時だけ palettes.json へ書き込む
//
// | 値 | 変え方 |
// |---|---|
// | c-* | 明るさと色相を保ち、鮮やかさを 0.85 倍にする。検査に落ちる色味は 0.9 / 0.95 倍と戻し、通る中で一番落とした値を採る |
// | t-* | 落とした c-* から、地と箱の両方に 7:1 を満たす濃さを求め直す (finalize-palettes.mjs と同じ決め方) |
// | tint / edge | 区画の地と縁に混ぜる色を 8% → 6%、26% → 19% にする |
//
// 鮮やかさを 0.85 倍より落とさないのは、澄んだ色で 0.8 倍にすると紫と青の差が見分けの下限 (ΔE 15) を割るため。
// 明るさも落とさない。0.95 倍で紫と赤が箱の色に対して 3:1 を割る。
// 今の値で既に見分けの検査に落ちる色味は、検査で比べずに 0.85 倍を当てる
// 封筒と札の塗り (carry) は暗い側では持たない。暗い背景では白い塗りが灰より強く見えず、灰は沈んで見えたため、字の色 (ink) で塗る
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { VALIDATOR, contrast } from "./validator.mjs";

const DIR = dirname(fileURLToPath(import.meta.url));
const FILE = join(DIR, "palettes.json");
const P = JSON.parse(readFileSync(FILE, "utf8"));
const write = process.argv.includes("--write");

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
const textOf = (c, bg, surf) => {
  const [L, C, H] = toOklch(c);
  for (let k = 0; k < 80; k++) {
    const hex = toHex(L + k * 0.005, C, H);
    if (hex && contrast(hex, bare(bg)) >= 7 && contrast(hex, bare(surf)) >= 7) return hex;
  }
  return null;
};
const calm = (hex, f) => { const [L, C, H] = toOklch(hex); return toHex(L, C * f, H); };
// 灰 (slate) は分類の色ではなく中立の色なので、見分けの検査からは外す (check-palettes.mjs と同じ)
const SLOTS = ["blue", "amber", "green", "violet", "rose", "slate"], JUDGED = SLOTS.slice(0, 5);
const judge = (d) => {
  let out;
  try { out = execFileSync("node", [VALIDATOR, JUDGED.map((s) => d[`c-${s}`]).join(","), "--mode", "dark", "--surface", d.surf, "--pairs", "all"], { encoding: "utf8" }); } catch (e) { out = (e.stdout ?? "") + (e.stderr ?? ""); }
  const lines = out.split("\n").filter((l) => /FAIL|WARN|→/.test(l)).map((l) => l.trim());
  return { ok: lines.some((l) => l.startsWith("→ ALL CHECKS PASS")), lines };
};
const calmed = (d0, f) => {
  const d = structuredClone(d0);
  for (const s of SLOTS) {
    d[`c-${s}`] = calm(d[`c-${s}`], f);
    d[`t-${s}`] = textOf(d[`c-${s}`], d.bg, d.surf);
  }
  d.tint = "6%";
  d.edge = "19%";
  return d;
};

let failed = 0;
for (const [id, p] of Object.entries(P)) {
  // 区画の地の量が書き換え済みの値なら、抑えた後の値に 2 度目の 0.85 倍を当てないよう飛ばす
  if (p.dark.tint === "6%") { console.log(`${id} は既に書き込み済み。飛ばす`); continue; }
  const judged = judge(p.dark).ok;
  let f = 0.85, d = calmed(p.dark, f), v = judge(d);
  if (judged) for (const g of [0.9, 0.95, 1]) { if (v.ok) break; f = g; d = calmed(p.dark, f); v = judge(d); }
  const missing = Object.entries(d).filter(([, x]) => x === null).map(([k]) => k);
  const ok = missing.length === 0 && (!judged || v.ok);
  if (!ok) failed++;
  p.dark = d;
  console.log(`${id} ${!judged ? "見分けの検査の対象外 (今の値で既に落ちる)" : ok ? "通る" : "落ちる"} 鮮やかさ ${f} 倍`);
  console.log("  " + SLOTS.map((s) => `${s} ${d[`c-${s}`]}/${d[`t-${s}`]}`).join("  "));
  if (missing.length) console.log(`  求められなかった値 ${missing.join(" ")}`);
  if (judged) console.log("  " + v.lines.join(" | "));
}
if (failed) { console.log(`${failed} 案が検査に落ちたので書き込まない`); process.exit(1); }
if (write) { writeFileSync(FILE, JSON.stringify(P, null, 2) + "\n"); console.log("palettes.json へ書き込んだ"); }
