/**
 * 図そのもののサイズ変更 (CAR-2160)。
 *
 * `viewport: { scale: k }` を書くだけ。 cdl 側が SVG の表示幅を親幅の k 倍にするため、
 * 箱 / 文字 / 線 / 間隔のすべてが等比で拡大縮小される。 viewBox は等倍のままなので
 * 座標系は変わらず、 当たり判定や座標の読み書きは倍率の影響を受けない。
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
  // 書き込み先は「最後の viewport」 に揃える。 parser が後勝ちで採用するため、
  // 先頭に書くと後ろの viewport に上書きされて倍率が効かない。
  // block 形式は行を跨ぐので別経路で扱う。 inline に書き換えると user の記法を
  // 勝手に変えてしまうため、 block のまま `  scale: k` を足す / 差し替える。
  if (lastViewportIsBlock(src)) return setScaleInBlockViewport(src, field);

  const segments = src.split(/(\r\n|\n)/);
  // 最後の inline viewport を探す
  let inlineIdx = -1;
  for (let i = 0; i < segments.length; i += 2) {
    if (/^[ \t]*viewport[ \t]*:[ \t]*\{.*\}[ \t]*$/.test(segments[i]!)) inlineIdx = i;
  }
  for (let i = inlineIdx; i >= 0 && i < segments.length; i += 2) {
    const m = segments[i]!.match(/^([ \t]*viewport[ \t]*:[ \t]*)\{(.*)\}([ \t]*)$/);
    if (!m) break;
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
    if (i + 1 >= segments.length) {
      // `type:` が最終行 = 後ろに separator が無い。 このまま splice すると
      // `type: sequenceviewport: { scale: 1.5 }` と連結する (実測)。 改行を先に置く。
      segments.push(sep, `viewport: { ${field} }`);
    } else {
      segments.splice(i + 2, 0, `viewport: { ${field} }`, sep);
    }
    return segments.join("");
  }
  return `viewport: { ${field} }\n${src}`;
}

/**
 * `viewport` の中身を返す。 無ければ null。
 *
 * DSL は 2 形式を受理する (`packages/dragon/src/v05/parser.ts`)。
 *
 *   inline = `viewport: { laneGap: 300, scale: 1.5 }`
 *   block  = `viewport:` の次行以降に `  laneGap: 300` を字下げして並べる
 *
 * inline しか見ないと、 block 形式の DSL に 2 つ目の `viewport` を作ってしまう。
 * parser は後勝ちで block 側を採用するため、 倍率が無言で効かなくなる (実測)。
 *
 * `viewport` が複数ある DSL では **最後のものを返す**。 parser が後勝ちで採用するため
 * (実測 = inline → block の順なら block、 逆順なら inline が doc.viewport になる)、
 * 先頭を返すと「書いた値が読めない」 食い違いが再発する。
 */
function readViewportInner(src: string): string | null {
  const lines = src.split(/\r?\n/);
  let last: string | null = null;
  for (let i = 0; i < lines.length; i += 1) {
    const inline = lines[i]!.match(/^[ \t]*viewport[ \t]*:[ \t]*\{(.*)\}[ \t]*$/);
    if (inline) { last = inline[1]!; continue; }
    // block 形式 = `viewport:` の後に値が無く、 次行以降が字下げされている
    if (/^[ \t]*viewport[ \t]*:[ \t]*$/.test(lines[i]!)) {
      const fields: string[] = [];
      for (let j = i + 1; j < lines.length; j += 1) {
        if (!isInsideBlock(lines[j]!)) break;
        const f = lines[j]!.match(/^[ \t]+([a-zA-Z][\w-]*)[ \t]*:[ \t]*(.+?)[ \t]*$/);
        if (f) fields.push(`${f[1]}: ${f[2]}`);
      }
      last = fields.join(", ");
    }
  }
  return last;
}

/**
 * その行が block の内側かを判定する。 parser の `collectIndentedList` と同じ条件にする。
 *
 * parser は「空行は読み飛ばす / 字下げが親以下になったら終了」 で、 その間にある
 * コメント行やリスト項目 (`- x`) は items に入らないだけで **終端にはしない**。
 * こちらだけ打ち切ると、 それらより後ろの field が見えず parser の実値と食い違う
 * (実測 = コメント行 / リスト項目を挟むと parser は 2、 こちらは 1)。
 */
function isInsideBlock(line: string): boolean {
  if (!line.trim()) return true; // 空行は終端ではない
  return /^[ \t]/.test(line); // 字下げがある限り block の内側
}

/**
 * block 形式の `viewport` に scale を upsert する。
 *
 * `field` が null (倍率 1) なら既存の `scale:` 行を消す。 block 自体は残す =
 * 他の field が消えるのを避ける。
 */
function setScaleInBlockViewport(src: string, field: string | null): string {
  const segments = src.split(/(\r\n|\n)/);
  // 最後の block viewport を対象にする (parser の後勝ちに合わせる)
  let headIdx = -1;
  for (let i = 0; i < segments.length; i += 2) {
    if (/^[ \t]*viewport[ \t]*:[ \t]*$/.test(segments[i]!)) headIdx = i;
  }
  if (headIdx < 0) return src;

  // block の範囲 (字下げが続く限り) と、 既存 scale 行を探す
  let lastIdx = headIdx;
  let scaleIdx = -1;
  let indent = "  ";
  for (let i = headIdx + 2; i < segments.length; i += 2) {
    if (!isInsideBlock(segments[i]!)) break;
    lastIdx = i;
    const m = segments[i]!.match(/^([ \t]+)([a-zA-Z][\w-]*)[ \t]*:/);
    if (!m) continue;
    indent = m[1]!;
    if (m[2] === "scale") scaleIdx = i;
  }

  if (field === null) {
    if (scaleIdx < 0) return src;
    // scale 行とその separator を消す
    segments.splice(scaleIdx, segments[scaleIdx + 1] === undefined ? 1 : 2);
    return segments.join("");
  }
  if (scaleIdx >= 0) {
    segments[scaleIdx] = `${indent}${field}`;
    return segments.join("");
  }
  // block の末尾に足す
  const sep = segments[lastIdx + 1] ?? (src.includes("\r\n") ? "\r\n" : "\n");
  if (lastIdx + 1 >= segments.length) segments.push(sep, `${indent}${field}`);
  else segments.splice(lastIdx + 2, 0, `${indent}${field}`, sep);
  return segments.join("");
}

/**
 * DSL の **最後の** `viewport` が block 形式かを判定する。
 *
 * 単に「block が存在するか」 で見ると、 inline が後ろにある DSL で block 側に書いてしまう。
 * parser は後勝ちなので、 書き込み先も最後のものに合わせる必要がある。
 */
function lastViewportIsBlock(src: string): boolean {
  let isBlock = false;
  for (const l of src.split(/\r?\n/)) {
    if (/^[ \t]*viewport[ \t]*:[ \t]*\{.*\}[ \t]*$/.test(l)) isBlock = false;
    else if (/^[ \t]*viewport[ \t]*:[ \t]*$/.test(l)) isBlock = true;
  }
  return isBlock;
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
