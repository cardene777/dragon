import type { Plugin } from "vite";

/**
 * 公開 site が読み込んでよい場所の決まり (#2956)。
 *
 * **header ではなく meta で配る**。 配信先は GitHub Pages と Vercel の 2 つで (#1156)、
 * GitHub Pages は応答の header を付けられない。 同じ build が両方に出るので、
 * `index.html` に入れれば置き場は 1 か所で済む。
 *
 * | 項目 | 値 | 理由 |
 * |---|---|---|
 * | `script-src` | `'self'` | 束に `eval` / `new Function` が無い (配った束で 0 件) |
 * | `style-src` | `'self' 'unsafe-inline'` | CodeMirror と拡大の処理 (`diagram-scale.ts`) が `<style>` を差し込む |
 * | `img-src` | `'self' data: blob:` | PNG の書き出しが SVG を blob の画像として描く |
 * | `connect-src` | `'self'` | 外への通信は無い |
 *
 * 枠への埋め込みの制限 (`frame-ancestors`) は書かない。 meta では効かず、埋め込みを許す方針
 * (#2956 の判断)。
 *
 * 決まりを狭めると画面は白くならずに一部だけ黙って止まる。 頁と書き出しで違反が出ないことは
 * `tests/csp-no-violation.spec.ts` が確かめる。
 */
export const CSPの決まり = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/**
 * build の時だけ CSP の meta を `<head>` の先頭に差し込む。
 *
 * 開発 server には差し込まない。 React の開発用の書き込み (`@vitejs/plugin-react` の前置き) が
 * inline の script を使い、`script-src 'self'` で止まって画面が描けなくなる。
 */
export function createCspMetaPlugin(): Plugin {
  return {
    name: "dragon-csp-meta",
    apply: "build",
    transformIndexHtml() {
      return [
        {
          tag: "meta",
          attrs: { "http-equiv": "Content-Security-Policy", content: CSPの決まり },
          injectTo: "head-prepend",
        },
      ];
    },
  };
}
