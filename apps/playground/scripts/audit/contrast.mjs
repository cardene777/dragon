/**
 * WCAG contrast ratio 計算の SSOT。
 * opacity 合成 (alpha compositing) を parent chain 全体で行い、 element の実効 bg 色を得る。
 *
 * ## 使い方
 *
 * ```js
 * import { contrastAuditLib } from "./contrast.mjs";
 *
 * await page.evaluate((auditLib) => {
 *   eval(auditLib);
 *   for (const el of document.querySelectorAll("body button, body a, body span")) {
 *     const hasDirectText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
 *     if (!hasDirectText) continue;
 *     const fg = parseRgba(getComputedStyle(el).color);
 *     const bg = composeChain(el);
 *     const ratio = contrastRatio(fg, bg);
 *     if (ratio < 3.0) console.log(el.tagName, ratio);
 *   }
 * }, contrastAuditLib);
 * ```
 *
 * 提供 API (Playwright evaluate 内で使用):
 * - `parseRgba(s)` = "rgba(r,g,b,a)" 文字列を {r,g,b,a} object に
 * - `relativeLuminance(rgb)` = WCAG 相対輝度 (0-1)
 * - `alphaCompose(fg, bg)` = alpha compositing で合成
 * - `composeChain(el)` = element の parent chain を辿って opaque bg を alpha compose で決定
 * - `contrastRatio(fg, bg)` = WCAG contrast ratio (1-21)
 *
 * ## WCAG 基準
 * - AA (normal text) = 4.5
 * - AA (large text) = 3.0
 * - AAA (normal) = 7.0
 * - AAA (large) = 4.5
 *
 * ## 制約
 * - background-image (gradient / image) は audit 対象外、 backgroundColor のみ考慮
 * - opacity property は未対応 (backgroundColor の alpha channel のみ)
 * - box-shadow / border は色計算に含めない
 */

export const contrastAuditLib = `
function parseRgba(s) {
  const m = s.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?/);
  return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 } : null;
}

function relativeLuminance(rgb) {
  const [rn, gn, bn] = [rgb.r, rgb.g, rgb.b].map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rn + 0.7152 * gn + 0.0722 * bn;
}

function alphaCompose(fg, bg) {
  if (fg.a >= 1) return fg;
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  };
}

function composeChain(el) {
  const chain = [];
  let cur = el;
  while (cur) {
    const s = getComputedStyle(cur).backgroundColor;
    const rgba = parseRgba(s);
    if (rgba && rgba.a > 0) chain.push(rgba);
    cur = cur.parentElement;
  }
  if (chain.length === 0) {
    const bodyBg = parseRgba(getComputedStyle(document.body).backgroundColor);
    return bodyBg || { r: 255, g: 255, b: 255, a: 1 };
  }
  let composed = chain[chain.length - 1];
  for (let i = chain.length - 2; i >= 0; i--) composed = alphaCompose(chain[i], composed);
  return composed;
}

function contrastRatio(fg, bg) {
  const lf = relativeLuminance(fg);
  const lb = relativeLuminance(bg);
  return (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05);
}
`;
