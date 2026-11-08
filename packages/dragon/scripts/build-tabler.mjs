#!/usr/bin/env node
/**
 * 無料の絵柄集 Tabler (MIT) の線の絵柄を、手描きの絵柄の表 (`src/blocks/icon/icons.ts` の `ICONS`) と同じ格子に移して書き出す (#3493)。
 *
 * Tabler の線の絵柄は 24 四方の格子 (左上が (0, 0)) に `<path>` だけで描かれ、手描きの絵柄は (0, 0) を中心に 20 四方へ描く。
 * 1 つの絵柄の path を全て、座標を (v − 12) × 20 / 24 へ移した絶対座標の命令に書き直し、1 本の path にまとめる。
 * 相対座標の命令のまま縮めると、小数の丸めの誤差が点ごとに積もるので、絶対座標にしてから点ごとに丸める。
 * 背景の枠 (`stroke="none"`) は描かないので外す。`<path>` 以外の形を持つ絵柄が在れば、移せない形なので build を止める。
 *
 * 書き出す先は `src/blocks/icon/tabler.js` で、絵柄の名前を鍵に path の字を持つ表を既定で出す。
 * 既定の入口は読み込みの時に表を登録し、軽い入口は `tabler:` を書いた図の時だけこの file を後から読む。
 * 利用許諾の表示 (`THIRD_PARTY_NOTICES.md`) も、入れた版と `@tabler/icons` の `LICENSE` の全文から同じ時に書き出す。
 * 手で書くと、版を上げた時に表示の版と許諾の文が表とずれるため。
 * package の build は最初にこれを回す。元は devDependency の `@tabler/icons` で、版を上げたら build で書き直す。
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join as joinPath } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = joinPath(here, "../node_modules/@tabler/icons/icons/outline");
const VERSION = JSON.parse(readFileSync(joinPath(here, "../node_modules/@tabler/icons/package.json"), "utf8")).version;
export const OUT = joinPath(here, "../src/blocks/icon/tabler.js");
/** npm に出す利用許諾の表示 */
export const NOTICES = joinPath(here, "../THIRD_PARTY_NOTICES.md");
const LICENSE = joinPath(here, "../node_modules/@tabler/icons/LICENSE");

/** 24 四方の格子から 20 四方の格子への縮み */
const K = 20 / 24;
/** 命令ごとの数の個数 */
const ARITY = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/u;

/** 小数 `digits` 桁 (既定は 2 桁) に丸めた数の字。`-0` は `0` にし、1 より小さい数は頭の `0` を外す (`0.5` は `.5`) */
const fmt = (v, digits = 2) => {
  const unit = 10 ** digits;
  const r = Math.round(v * unit) / unit;
  return String(Object.is(r, -0) ? 0 : r).replace(/^(-?)0\./u, "$1.");
};

/** 数を並べた字。負の数は `-` が区切りになるので、前に空白を置かない */
const join = (values) => values.map((v, k) => (k === 0 || v.startsWith("-") ? v : ` ${v}`)).join("");

/**
 * path の字を命令と数の並びに分ける。数の後に命令が無く続く数は、同じ命令の繰り返しとして読む (`M` の後は `L`)。
 * 弧 (`A`) の 2 つの印は区切り無しで続けて書けるので 1 字ずつ読む
 */
function tokenize(d) {
  const out = [];
  let i = 0;
  let command = "";
  const skip = () => {
    while (i < d.length && /[\s,]/u.test(d[i])) i++;
  };
  const number = () => {
    skip();
    const found = NUMBER.exec(d.slice(i));
    if (!found) throw new Error(`path の数を読めない: ${d.slice(i, i + 12)}`);
    i += found[0].length;
    return Number(found[0]);
  };
  const flag = () => {
    skip();
    const ch = d[i];
    if (ch !== "0" && ch !== "1") throw new Error(`弧の印を読めない: ${d.slice(i, i + 12)}`);
    i++;
    return Number(ch);
  };
  for (;;) {
    skip();
    if (i >= d.length) break;
    const ch = d[i];
    if (/[A-Za-z]/u.test(ch)) {
      command = ch;
      i++;
    } else if (command === "M") command = "L";
    else if (command === "m") command = "l";
    else if (command === "" || command === "Z" || command === "z") throw new Error(`命令の無い数: ${d.slice(i, i + 12)}`);
    const upper = command.toUpperCase();
    if (!(upper in ARITY)) throw new Error(`知らない命令 ${command}`);
    const values = upper === "A" ? [number(), number(), number(), flag(), flag(), number(), number()] : Array.from({ length: ARITY[upper] }, number);
    out.push({ command, values });
  }
  return out;
}

/** 24 四方の格子の点を、(0, 0) を中心にした 20 四方の格子へ移す */
const move = (v) => (v - 12) * K;

/**
 * 弧の半径が両端の点に届く割合 (SVG の決まりの λ)。1 以上なら半径が足りず、SVG は半径を広げて半円にする。
 * 1 に近いほど半円に近く、1 から離れるほど弧の中心が両端の間から離れる。
 * `from` と `to` は弧の両端、`rx` と `ry` は半径、`rotation` は楕円の傾き (度)
 */
function reach(from, to, rx, ry, rotation) {
  const phi = (rotation * Math.PI) / 180;
  const dx = (from[0] - to[0]) / 2;
  const dy = (from[1] - to[1]) / 2;
  const x1 = Math.cos(phi) * dx + Math.sin(phi) * dy;
  const y1 = -Math.sin(phi) * dx + Math.cos(phi) * dy;
  return (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
}

/** 半径を小数 4 桁で書く、半円に近い弧の割合 λ の下限 */
const NEAR_HALF = 0.9;

/**
 * 20 四方の格子へ移した弧の半径の字。`from` と `to` は丸める前の両端。
 *
 * 両端と半径を別々に丸めると、両端の間と半径の釣り合い (λ) が変わり、半円に近い弧ほど中心が大きくずれる。
 * 半円の弧 (`a2 2 0 0 1 0 4`) は半径 1.67 と両端の間の半分 1.665 になって中心が 0.13 動き、
 * 半円に近い 3/4 の弧 (`circle-off`) は λ が 0.99999 から 0.9987 に下がって中心が 0.27 動く。
 * そこで、丸めた両端で元と同じ λ になるよう半径を縮める。半円に近い弧 (λ が `NEAR_HALF` 以上) は半径を小数 4 桁で書き、
 * 丸めで λ が動かないようにする。元が半円か半径の足りない弧 (λ が 1 以上) は、丸めた両端に届かない所まで半径を切り下げ、
 * SVG に半円として描かせる
 */
function arcRadii(from, to, rx, ry, rotation) {
  if (rx === 0 || ry === 0) return [fmt(rx), fmt(ry)];
  const round2 = (p) => p.map((v) => Math.round(v * 100) / 100);
  const before = reach(from, to, rx, ry, rotation);
  const after = reach(round2(from), round2(to), rx, ry, rotation);
  if (before >= 1 - 1e-9) {
    const floor4 = (v) => Math.floor(v * 10000) / 10000;
    const scale = Math.sqrt(after);
    return [fmt(floor4(rx * scale), 4), fmt(floor4(ry * scale), 4)];
  }
  // λ は半径の 2 乗に反比例するので、半径を √(after / before) 倍すると丸めた両端で λ が元に戻る
  const scale = Math.sqrt(after / before);
  const digits = before >= NEAR_HALF ? 4 : 2;
  return [fmt(rx * scale, digits), fmt(ry * scale, digits)];
}

/** 1 本の path を、20 四方の格子の絶対座標の命令の字へ書き直す */
export function convertPath(d) {
  const parts = [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  for (const { command, values } of tokenize(d)) {
    const relative = command === command.toLowerCase();
    const upper = command.toUpperCase();
    const ax = (v) => (relative ? x + v : v);
    const ay = (v) => (relative ? y + v : v);
    switch (upper) {
      case "Z":
        parts.push("Z");
        x = startX;
        y = startY;
        break;
      case "H":
        x = ax(values[0]);
        parts.push(`H${fmt(move(x))}`);
        break;
      case "V":
        y = ay(values[0]);
        parts.push(`V${fmt(move(y))}`);
        break;
      case "A": {
        const [rx, ry, rotation, large, sweep, ex, ey] = values;
        const nx = ax(ex);
        const ny = ay(ey);
        const [ox, oy] = arcRadii([move(x), move(y)], [move(nx), move(ny)], rx * K, ry * K, rotation);
        parts.push(`A${join([ox, oy, fmt(rotation), String(large), String(sweep), fmt(move(nx)), fmt(move(ny))])}`);
        x = nx;
        y = ny;
        break;
      }
      default: {
        // 点の対を並べる命令。制御点も終わりの点も、この命令の始まりの点からの相対で書かれる
        const points = [];
        for (let k = 0; k < values.length; k += 2) points.push([ax(values[k]), ay(values[k + 1])]);
        parts.push(`${upper}${join(points.flatMap(([px, py]) => [fmt(move(px)), fmt(move(py))]))}`);
        [x, y] = points[points.length - 1];
        if (upper === "M") {
          startX = x;
          startY = y;
        }
      }
    }
  }
  return parts.join("");
}

/** 絵柄の SVG の字から、描く path の d を並べる。背景の枠 (`stroke="none"`) は外す */
export function drawnPaths(name, svg) {
  const shapes = [...svg.matchAll(/<([a-z]+)\b/gu)].map((match) => match[1]).filter((tag) => tag !== "svg");
  const other = shapes.find((tag) => tag !== "path");
  if (other !== undefined) throw new Error(`${name}: path 以外の形 <${other}> を持つ`);
  return [...svg.matchAll(/<path\b([^>]*?)\/?>/gu)]
    .map((match) => match[1])
    .filter((attrs) => !attrs.includes('stroke="none"'))
    .map((attrs) => {
      const d = /\bd="([^"]*)"/u.exec(attrs)?.[1];
      if (d === undefined) throw new Error(`${name}: d を持たない path`);
      return d;
    });
}

function build() {
  const names = readdirSync(SOURCE)
    .filter((file) => file.endsWith(".svg"))
    .map((file) => file.slice(0, -4))
    .sort();
  if (names.length === 0) throw new Error(`${SOURCE} に絵柄が無い`);
  const table = {};
  for (const name of names) {
    const paths = drawnPaths(name, readFileSync(joinPath(SOURCE, `${name}.svg`), "utf8"));
    if (paths.length === 0) throw new Error(`${name}: 描く path が無い`);
    table[name] = paths.map(convertPath).join("");
  }
  const lines = [
    `// build-tabler.mjs が @tabler/icons ${VERSION} の線の絵柄から書き出した表 (#3493)。手で直さない`,
    `export default ${JSON.stringify(table)};`,
    "",
  ];
  writeFileSync(OUT, lines.join("\n"));
  writeFileSync(NOTICES, notices());
  return names.length;
}

/** 利用許諾の表示の字。表の元にした版と、Tabler の利用許諾の全文を持つ */
function notices() {
  return [
    "# Third-party notices",
    "",
    "dragon ships icon data derived from the following project.",
    "",
    "## Tabler Icons",
    "",
    `Package: \`@tabler/icons\` ${VERSION} (outline icons)`,
    "",
    "Use: the `tabler:<name>` icons for boxes and groups. The build moves each outline icon from its 24 x 24 grid onto the 20 x 20 grid that dragon draws its own icons on, and joins its paths into one.",
    "",
    "License text:",
    "",
    "```",
    readFileSync(LICENSE, "utf8").trim(),
    "```",
    "",
  ].join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const count = build();
  console.log(`tabler: ${count} 個の絵柄を ${OUT} に書き出した`);
}
