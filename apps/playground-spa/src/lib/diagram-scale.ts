/**
 * 図そのもののサイズ変更 (CAR-2160)。
 *
 * `viewport: { scale: k }` を書くだけ。 cdl 側が座標系ごと `<g transform="scale(k)">` で
 * 包み viewBox も k 倍するため、 箱 / 文字 / 線 / 間隔のすべてが等比で拡大縮小される。
 *
 * ## なぜ laneWidth / laneGap / nodeGap ではないか
 *
 * これらは **間隔だけ**を動かす。 実測すると 1.5 倍にしても箱は 184x72 のままで、
 * 図に占める割合は 10.4% → 8.0% と逆に下がる。 さらに縦横の伸び方が揃わないため
 * 倍率によって図の形が変わる (k=1.25 で横 1.14 / 縦 1.40、 k=2 で 1.72 / 1.72)。
 *
 * lane 幅には label 長由来の下限があり、 `nodeGap` は `stackGap = 100 + (nodeGap - 24)` という
 * 非線形な効き方をするため、 DSL 側の値をどう調整しても任意の倍率で等比にはできない。
 * cdl 側で座標系ごと拡大するのが構造的に正しい (CAR-2160 で cdl に `viewport.scale` を追加)。
 */

/** 図の倍率の下限 / 上限。 潰れて読めない / 巨大化して破綻するのを防ぐ。 */
export const MIN_DIAGRAM_SCALE = 0.5;
export const MAX_DIAGRAM_SCALE = 3;

/** 倍率を実用範囲に丸める。 不正値は 1 に倒す。 */
export function clampDiagramScale(scale: number): number {
  if (!Number.isFinite(scale) || scale <= 0) return 1;
  return Math.min(MAX_DIAGRAM_SCALE, Math.max(MIN_DIAGRAM_SCALE, scale));
}

/** DSL から現在の図の倍率を読む。 `viewport.scale` が無ければ 1。 */
export function readDiagramScale(src: string): number {
  const vp = readViewportInner(src);
  if (!vp) return 1;
  const f = splitTop(vp).find((x) => x.slice(0, x.indexOf(":")).trim() === "scale");
  if (!f) return 1;
  const n = Number(f.slice(f.indexOf(":") + 1).trim());
  return clampDiagramScale(n);
}

/**
 * 図の倍率を設定した DSL を返す。
 *
 * `viewport` 行が無ければ `type:` の直後に作る。 既にあれば `scale` だけを差し替え、
 * 他の field は保持する。 倍率 1 では `scale` を消す = 既定に戻して DSL を汚さない。
 */
export function setDiagramScale(src: string, scale: number): string {
  const s = clampDiagramScale(scale);
  const field = Math.abs(s - 1) < 0.001 ? null : `scale: ${Math.round(s * 1000) / 1000}`;
  const segments = src.split(/(\r\n|\n)/);
  for (let i = 0; i < segments.length; i += 2) {
    const m = segments[i]!.match(/^([ \t]*viewport[ \t]*:[ \t]*)\{(.*)\}([ \t]*)$/);
    if (!m) continue;
    const kept = splitTop(m[2]!).filter((f) => f.slice(0, f.indexOf(":")).trim() !== "scale");
    const merged = [...kept, ...(field ? [field] : [])].join(", ");
    if (merged.length === 0) {
      // 他 field が無くなったら viewport 行ごと消す
      segments.splice(i, segments[i + 1] === undefined ? 1 : 2);
      return segments.join("");
    }
    segments[i] = `${m[1]}{ ${merged} }${m[3]}`;
    return segments.join("");
  }
  if (!field) return src;
  // viewport が無いので作る。 `type:` の直後 = actors より前に置く
  for (let i = 0; i < segments.length; i += 2) {
    if (!/^[ \t]*type[ \t]*:/.test(segments[i]!)) continue;
    const sep = segments[i + 1] ?? (src.includes("\r\n") ? "\r\n" : "\n");
    segments.splice(i + 2, 0, `viewport: { ${field} }`, sep);
    return segments.join("");
  }
  return `viewport: { ${field} }\n${src}`;
}

/** `viewport: { ... }` の中身を返す。 無ければ null。 */
function readViewportInner(src: string): string | null {
  for (const line of src.split(/\r?\n/)) {
    const m = line.match(/^[ \t]*viewport[ \t]*:[ \t]*\{(.*)\}[ \t]*$/);
    if (m) return m[1]!;
  }
  return null;
}

/** brace 深さを数えて top-level の `,` でだけ分割する。 */
function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i]!;
    if (quote) {
      if (quote === '"' && ch === "\\") { i += 1; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === "{" || ch === "[") depth += 1;
    else if (ch === "}" || ch === "]") depth -= 1;
    else if (ch === "," && depth === 0) { out.push(s.slice(start, i)); start = i + 1; }
  }
  out.push(s.slice(start));
  return out.map((f) => f.trim()).filter((f) => f.length > 0);
}

// ── 文字サイズ ──────────────────────────────────────────────

/** 文字倍率の下限 / 上限。 */
export const MIN_FONT_SCALE = 0.6;
export const MAX_FONT_SCALE = 2.5;

export function clampFontScale(scale: number): number {
  if (!Number.isFinite(scale) || scale <= 0) return 1;
  return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, scale));
}

const FONT_STYLE_ID = "cdl-editor-font-scale";

/**
 * 図中の文字サイズを一律で倍にする。
 *
 * cdl は `fontSize` を属性で出しており、 CSS の方が属性より優先される。
 * 個々の text に inline style を当てると再 render で消えるため、 `<style>` を 1 枚差し込んで
 * 属性値に対する倍率を CSS 変数なしで表現する = `font-size` を直接指定する。
 *
 * 属性値が複数あるので、 実際の値ごとに rule を作る。 呼び出し側は現在 SVG に
 * 現れる `font-size` 属性値の集合を渡す必要がない = ここで走査する。
 */
export function applyFontScale(svg: SVGSVGElement, scale: number): void {
  const s = clampFontScale(scale);
  const doc = svg.ownerDocument;
  let style = doc.getElementById(FONT_STYLE_ID) as HTMLStyleElement | null;
  if (Math.abs(s - 1) < 0.001) {
    style?.remove();
    return;
  }
  if (!style) {
    style = doc.createElement("style");
    style.id = FONT_STYLE_ID;
    doc.head.appendChild(style);
  }
  // SVG 内に現れる font-size 属性値を集めて、 値ごとに倍率を当てる
  const sizes = new Set<string>();
  svg.querySelectorAll("[font-size]").forEach((el) => {
    const v = el.getAttribute("font-size");
    if (v) sizes.add(v);
  });
  const rules: string[] = [];
  for (const v of sizes) {
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    rules.push(`svg [font-size="${v}"] { font-size: ${Math.round(n * s * 100) / 100}px; }`);
  }
  style.textContent = rules.join("\n");
}
