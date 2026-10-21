#!/usr/bin/env node
/* global document -- page.evaluate に渡す関数はブラウザの中で動く */
/**
 * 同梱した 2 つの字の幅を測り、`src/look/fonts.ts` の `SANS_ADVANCE` に貼る表を出す (#2985)。
 *
 * 描く側は字の幅を DOM で測らずに決める (Node でも同じ置き場所になるように)。
 * そのため英数字と記号の幅を、ブラウザに同梱の字を読ませて 1 度だけ測り、表として持つ。
 * 和文 (U+2E80 以降) は全角 (1em)、等幅の字は全て 0.6em なので表に入れない。
 *
 * 字の太さで幅が少し変わるので、使う太さ (500 / 600 / 650 / 700) のうち一番広い値を採る。
 * 幅を狭く見積もると名前が札からはみ出すため、広い側に寄せる。
 *
 * node packages/dragon/scripts/font-widths.mjs
 */
import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { dirname, join, normalize } from "node:path";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const ROOTS = {
  sans: dirname(require.resolve("@fontsource-variable/noto-sans-jp/package.json")),
  mono: dirname(require.resolve("@fontsource-variable/jetbrains-mono/package.json")),
};
const WEIGHTS = [500, 600, 650, 700];
// ASCII の印字できる字と、図の名前に出てくる記号
const CHARS = [...Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) => String.fromCharCode(0x20 + i)), "…", "−", "×", "→", "←", "↑", "↓", "–", "—", "‘", "’", "“", "”", "°", "±", "·", "•"];

const server = createServer((req, res) => {
  const [, key, ...rest] = (req.url ?? "/").split("/");
  const root = ROOTS[key];
  const path = root && normalize(join(root, ...rest));
  if (req.url === "/") {
    res.setHeader("content-type", "text/html");
    res.end(`<!doctype html><link rel="stylesheet" href="/sans/index.css"><link rel="stylesheet" href="/mono/index.css"><body></body>`);
    return;
  }
  if (!path || !path.startsWith(root) || !existsSync(path)) {
    res.statusCode = 404;
    res.end();
    return;
  }
  res.setHeader("content-type", path.endsWith(".css") ? "text/css" : "font/woff2");
  createReadStream(path).pipe(res);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/`);
  const result = await page.evaluate(
    async ({ chars, weights }) => {
      const sans = '"Noto Sans JP Variable"';
      const mono = '"JetBrains Mono Variable"';
      const text = chars.join("");
      for (const w of weights) await document.fonts.load(`${w} 100px ${sans}`, text);
      await document.fonts.load(`600 100px ${mono}`, text);
      const loaded = weights.every((w) => document.fonts.check(`${w} 100px ${sans}`, text)) && document.fonts.check(`600 100px ${mono}`, "A");
      const ctx = document.createElement("canvas").getContext("2d");
      const at = (font, ch) => {
        ctx.font = font;
        return ctx.measureText(ch).width;
      };
      const advance = {};
      for (const ch of chars) advance[ch] = Math.ceil(Math.max(...weights.map((w) => at(`${w} 1000px ${sans}`, ch))));
      return { loaded, advance, mono: at(`600 1000px ${mono}`, "A") };
    },
    { chars: CHARS, weights: WEIGHTS },
  );
  if (!result.loaded) throw new Error("同梱の字を読み込めなかった");
  console.log(`// 等幅の字の幅 (1000 分率): ${result.mono}`);
  console.log(JSON.stringify(result.advance));
} finally {
  await browser.close();
  server.close();
}
