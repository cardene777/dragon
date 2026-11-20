/**
 * `icon-paint.test.ts` から移した命令と書き出しの確かめ (#3763)。
 * build した `dist` を読み、選ぶ命令が `dist` を書く検査を全ての入口へ結ぶので、種類の検査のfileから外し、`kind-cli.test.ts` が読む
 */
import * as dragon from "../src/core";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { api, type Json, type LineError, type NotationLang } from "./diagram-support";
import { draw, type Rendered } from "./render-support";
import "../src/kinds/basics";
import "../src/kind-use/architecture";
import "../src/kind-use/sequence";
import "../src/kind-use/state";

const ROOT = process.cwd();

const CLI = join(ROOT, "packages/dragon/dist/cli.js");

type ReadBlocks = { ok: true; blocks: unknown } | { ok: false; errors: LineError[] };

type Parsed = { ok: true; diagram: Json } | { ok: false; errors: LineError[] };

function readBlocks(input: unknown, options?: { lang?: NotationLang }): ReadBlocks {
  const fn = (
    dragon as unknown as {
      readBlocks?: (input: unknown, options?: { lang?: NotationLang }) => ReadBlocks;
    }
  ).readBlocks;
  expect(fn, "readBlocks が @cardenelabs/dragon から出ていない").toBeDefined();
  return fn ? fn(input, options) : { ok: false, errors: [] };
}

const parse = (text: string, options: { lang?: NotationLang; blocks?: unknown } = {}): Parsed =>
  api("parseNotation")(text, options);

/** 読めた図。読めない時は誤りの文を添えて落とす */
function parsed(text: string, options: { lang?: NotationLang } = {}): Json {
  const result = parse(text, options);
  expect(result.ok, `記法を読めない: ${result.ok ? "" : JSON.stringify(result.errors)}`).toBe(true);
  return result.ok ? result.diagram : {};
}

/** 描いた図。描けない時は断りの文を名指して落とす */
function render(diagram: Json, options: { lang?: NotationLang; width?: number } = {}): Rendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, options);
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "色付きの絵柄を持つ図を描けない").toBe("");
  return rendered as Rendered;
}

/** 絵柄の形。地の四角と、偶奇で穴を開けた枠と、丸の 3 つ */
const BACK = "M0 0h48v48H0z";

const RING = "M8 12h32v24H8z M14 18h20v12H14z";

const DOT = "M20 24a4 4 0 1 0 8 0a4 4 0 1 0 -8 0";

/** 色付きの絵柄の定義の行 */
const DEF_LINES = [
  "blocks 1",
  "block +camera",
  "  base icon",
  "  view 0 0 48 48",
  `  paint #2563EB "${BACK}"`,
  `  paint #FFFFFF evenodd "${RING}"`,
  `  paint #F59E0B "${DOT}"`,
  "end",
];

const DEFS = DEF_LINES.join("\n");

/** 色付きの絵柄を置いた構成図。`icon` を替えると、同じ箱に今の絵柄を置いた図になる */
const architecture = (icon = "+camera"): string =>
  [
    "architecture 写真を送る",
    "",
    DEFS,
    "",
    `box phone as スマホ [color: blue, icon: ${icon}]`,
    "box store as 置き場 [color: green]",
    "",
    "step 送る",
    "  say スマホが写真を送る。",
    "  phone -> store: 写真",
    "",
  ].join("\n");

/**
 * 描いた SVG の部品。命令の確かめを集めた検査 (`kind-cli.test.ts`) は字の file を組む道具が `jsdom` の中で動かないので Node で回し、
 * SVG は `jsdom` の読み方で読む (#3763)
 */
const docOf = (svg: string): Document => new new JSDOM().window.DOMParser().parseFromString(svg, "image/svg+xml");

/** 描いた SVG の中で、`d` が `d` に等しい path */
const pathsWith = (svg: string, d: string): Element[] =>
  [...docOf(svg).querySelectorAll("path")].filter((p) => p.getAttribute("d") === d);

/** 書き手が持つ SVG を一時の dir に書き、その path を返す */
const svgFile = (name: string, body: string): string => {
  const dir = mkdtempSync(join(tmpdir(), "dragon-icon-"));
  const path = join(dir, name);
  writeFileSync(path, body);
  return path;
};

/** 命令 `dragon icon` を回す */
const iconCommand = (args: string[]): { status: number | null; stdout: string; stderr: string } => {
  expect(existsSync(CLI), "dist/cli.js が無い (pnpm build:packages を先に回す)").toBe(true);
  const ran = spawnSync(process.execPath, [CLI, "icon", ...args], { encoding: "utf8" });
  return { status: ran.status, stdout: ran.stdout, stderr: ran.stderr };
};

/** 命令 `dragon icon` が断る SVG。何を持つか、断り文が名指す要素、SVG の字 */
const NON_SOLID_HEAD = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">';

const NON_SOLID: [string, string, string][] = [
  [
    "グラデーション",
    "linearGradient",
    `${NON_SOLID_HEAD}<defs><linearGradient id="g"><stop offset="0" stop-color="#000"/></linearGradient></defs><rect width="48" height="48" fill="url(#g)"/></svg>`,
  ],
  [
    "模様",
    "pattern",
    `${NON_SOLID_HEAD}<defs><pattern id="p" width="4" height="4"><rect width="2" height="2"/></pattern></defs><rect width="48" height="48" fill="url(#p)"/></svg>`,
  ],
  [
    "埋め込んだ画像",
    "image",
    `${NON_SOLID_HEAD}<image href="data:image/png;base64,AAAA" width="48" height="48"/></svg>`,
  ],
  [
    "変形",
    "transform",
    `${NON_SOLID_HEAD}<g transform="translate(4 4)"><rect width="40" height="40" fill="#123456"/></g></svg>`,
  ],
  ["線だけの形", "line", `${NON_SOLID_HEAD}<line x1="0" y1="0" x2="48" y2="48" stroke="#000"/></svg>`],
  ["字", "text", `${NON_SOLID_HEAD}<text x="4" y="24">AWS</text></svg>`],
];

// 断る SVG ごとに子の Node で命令を回すと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。file を読み込む段で済ませ、件はその出力を読む
const REFUSED = await atLoad("色付きにできない SVG を命令に渡す", () =>
  NON_SOLID.map(([what, tag, body]) => ({ what, tag, ran: iconCommand([svgFile("bad.svg", body), "--name", "+bad"]) })),
);

describe("色付きの絵柄に変える命令 (#3633)", () => {
  it("icon-command-converts-svg", () => {
    const file = svgFile(
      "lambda-icon.svg",
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">',
        "  <title>見本の絵柄</title>",
        '  <rect x="0" y="0" width="48" height="48" fill="#ED7100"/>',
        '  <g fill="#FFFFFF">',
        '    <path d="M10 10h28v28H10z M16 16h16v16H16z" fill-rule="evenodd"/>',
        '    <circle cx="24" cy="24" r="4"/>',
        "  </g>",
        '  <ellipse cx="24" cy="42" rx="8" ry="3" style="fill:#1f2937"/>',
        '  <polygon points="24,2 30,8 18,8" fill="#ffcc00"/>',
        "</svg>",
      ].join("\n"),
    );
    const named = iconCommand([file, "--name", "+lambda"]);
    expect(named.status, `dragon icon が落ちる: ${named.stderr}`).toBe(0);
    const read = readBlocks(named.stdout);
    expect(
      read.ok,
      `dragon icon が出した定義を読めない: ${read.ok ? "" : JSON.stringify(read.errors)}\n${named.stdout}`,
    ).toBe(true);
    const block = read.ok
      ? (
          read.blocks as {
            blocks: {
              name: string;
              base: string;
              view?: number[];
              paints?: { color: string; rule?: string; path: string }[];
            }[];
          }
        ).blocks[0]
      : undefined;
    expect(block?.name, "dragon icon が出した定義の名前").toBe("+lambda");
    expect(block?.base, "dragon icon が出した定義の元のブロック").toBe("icon");
    expect(block?.view, "dragon icon が出した定義の view").toEqual([0, 0, 48, 48]);
    expect(
      block?.paints?.map((p) => p.color.toLowerCase()),
      "dragon icon が出した定義の形の色",
    ).toEqual(["#ed7100", "#ffffff", "#ffffff", "#1f2937", "#ffcc00"]);
    expect(
      block?.paints?.map((p) => p.rule ?? "nonzero"),
      "dragon icon が出した定義の塗り方の決まり",
    ).toEqual(["nonzero", "evenodd", "nonzero", "nonzero", "nonzero"]);
    // 出した定義をそのまま図の頭に書くと、色付きの絵柄として描ける
    const text = architecture("+lambda").replace(DEFS, named.stdout.trim());
    const { svg } = render(parsed(text));
    for (const p of block?.paints ?? [])
      expect(
        pathsWith(svg, p.path).length,
        `変えた絵柄の形 ${p.color} が描かれない`,
      ).toBeGreaterThan(0);
    // 名前を渡さない時は file の名前から付ける
    const plain = iconCommand([file]);
    expect(plain.status, `名前を渡さない dragon icon が落ちる: ${plain.stderr}`).toBe(0);
    expect(
      plain.stdout,
      "名前を渡さない dragon icon が file の名前から定義の名前を付けない",
    ).toContain("block +lambda-icon");
  });

  it("icon-command-refuses-non-solid", () => {
    for (const { what, tag, ran } of REFUSED.get()) {
      expect(ran.status, `${what}を持つ SVG を dragon icon が断らない`).not.toBe(0);
      expect(ran.stdout.trim(), `${what}を持つ SVG で dragon icon が定義を出す`).toBe("");
      expect(
        ran.stderr,
        `${what}を持つ SVG の断り文が要素 ${tag} を名指さない: ${ran.stderr}`,
      ).toContain(tag);
    }
  });
});
