/**
 * 見本帳で使う字だけを、分割前の Noto Sans JP から切り出す (#3296)。
 *
 * npm の字の package は 1 文字のために分割された file を読むので、概要の頁の 312 種の字に 35 件 757KB が要る。
 * 組み立て結果の script と CSS に在る字だけを 1 つの file にまとめ、`src/site/font/` に置く。
 * 字の間隔の情報 (`GPOS`) を分割された file から写す道具が無いので、切り出す元は分割前の字にする。
 *
 * 分割前の字は 9.6MB あるので repo に置かない。Google Fonts の配布の `ofl/notosansjp/NotoSansJP[wght].ttf` (版 2.004) を手元に置いて渡す。
 * 分割された字と同じ版でないと字の形がずれるので、指紋で確かめる。
 *
 * 使い方は `pnpm --filter dragon-playground-spa build` の後に `node apps/playground-spa/scripts/site-fonts.mjs <分割前の字>`。
 * 検査 `site-font-covers-every-word` が字の抜けを名指して落ちた時に回す。
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(APP, "dist");
const OUT = join(APP, "src/site/font");
const FONT = "noto-sans-jp-site.woff2";
const SOURCE_SHA256 = "c2f3b4d463500a2ddcd3849cded1fceeb9fd6d1c32e6cbecd568453ba50fc68f";
/** 残す名前の番号。0、13、14 が字の著作権と利用許諾 (OFL は字の file の中か隣にこの文を求める) */
const NAME_IDS = [0, 1, 2, 3, 4, 5, 6, 13, 14];

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const source = process.argv[2];
if (source === undefined) fail("分割前の字の path を渡す (冒頭の comment を読む)");
const sourceBytes = readFileSync(source);
const digest = createHash("sha256").update(sourceBytes).digest("hex");
if (digest !== SOURCE_SHA256) fail(`分割前の字の sha256 が違う (渡された字=${digest}、求める字=${SOURCE_SHA256})`);

// `subset-font` と字の表は `packages/dragon` の依存に在る
const dragon = createRequire(join(APP, "../../packages/dragon/package.json"));
const subsetFont = dragon("subset-font");
const unicode = JSON.parse(readFileSync(join(dirname(dragon.resolve("@fontsource-variable/noto-sans-jp/package.json")), "unicode.json"), "utf8"));

/** `U+30-39,U+3000-303F` の形の範囲の字の番号 */
function codesOf(list) {
  const codes = new Set();
  for (const part of list.split(",")) {
    const [from, to = from] = part.trim().replace(/^U\+/iu, "").split("-");
    for (let code = Number.parseInt(from, 16); code <= Number.parseInt(to, 16); code += 1) codes.add(code);
  }
  return codes;
}

/** 組み立て結果の script と CSS と HTML の本文 */
function builtText() {
  const inAssets = readdirSync(join(DIST, "assets"))
    .filter((name) => /\.(?:js|css)$/u.test(name))
    .map((name) => join(DIST, "assets", name));
  const pages = readdirSync(DIST)
    .filter((name) => name.endsWith(".html"))
    .map((name) => join(DIST, name));
  return [...inAssets, ...pages].map((path) => readFileSync(path, "utf8")).join("");
}

/** 連なった字の番号を `U+3001-3002,U+3005` の形にする */
function rangeOf(codes) {
  const spans = [];
  for (const code of codes) {
    const last = spans.at(-1);
    if (last !== undefined && last[1] === code - 1) last[1] = code;
    else spans.push([code, code]);
  }
  return spans.map(([from, to]) => (from === to ? `U+${from.toString(16)}` : `U+${from.toString(16)}-${to.toString(16)}`)).join(",");
}

// `latin` の字の file は ASCII のために必ず読むので、その範囲の字は切り出さない
const latin = codesOf(unicode.latin);
const noto = codesOf(Object.values(unicode).join(","));
const codes = [...new Set(builtText())]
  .map((char) => char.codePointAt(0))
  .filter((code) => noto.has(code) && !latin.has(code))
  .sort((a, b) => a - b);
if (codes.length === 0) fail(`${DIST} に字が無い。先に組み立てる`);

// 字形の置き換えの先まで広げると 257KB まで増える。頁は置き換えを使わないので広げない
const font = await subsetFont(sourceBytes, String.fromCodePoint(...codes), { targetFormat: "woff2", noLayoutClosure: true, noHinting: true, preserveNameIds: NAME_IDS });
writeFileSync(join(OUT, FONT), font);
writeFileSync(
  join(OUT, "noto-sans-jp-site.css"),
  `/* 作る物。\`apps/playground-spa/scripts/site-fonts.mjs\` が書くので手で直さない。元の字の面より後に読むと、ここに在る字は分割された字の file を読まない */
@font-face {
  font-family: "Noto Sans JP Variable";
  font-style: normal;
  font-display: swap;
  font-weight: 100 900;
  src: url("./${FONT}") format("woff2-variations");
  unicode-range: ${rangeOf(codes)};
}
`,
);
console.log(`字 ${String(codes.length)}種、${String(Math.round(font.length / 1024))}KB`);
