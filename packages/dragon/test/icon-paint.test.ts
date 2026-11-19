// @vitest-environment jsdom
/**
 * 書き手が持つ色付きの絵柄を元の色のまま置く (#3633)。
 *
 * 印のブロックの定義 (`base icon`) に、元の SVG の表示の枠を `view <x> <y> <幅> <高さ>` の行で、色付きの形を `paint <色> "<path>"` の行で何本も書ける。
 * 塗り方の決まりを偶奇にする形は、色と path の間に `evenodd` を書く。定義はデータだけのままで、色は `#` と 16 進の数、形は path の文法の字だけを受ける。
 * 描く時は `view` の枠を今の絵柄と同じ 20 四方に縮め、箱の絵柄の枠の中に、形ごとに定義の色で塗って描き、箱の色で塗らない。
 * 書き手が持つ SVG の file は、命令 `dragon icon <file.svg>` で定義の行に変える。1 色で塗っていない形と変形を持つ要素は、要素の名前を挙げて断る。
 * 見本の file と命令と色付きの絵柄の定義がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import * as dragon from "../src/core";
import { describe, expect, it } from "vitest";
import { api, type Json, type LineError, type NotationLang } from "./diagram-support";
import { draw, type Rendered } from "./render-support";
import "../src/kinds/basics";
import "../src/kind-use/architecture";
import "../src/kind-use/sequence";
import "../src/kind-use/state";
const LANGS = ["ja", "en"] as const;

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
const PAINTS = [
  { color: "#2563EB", path: BACK },
  { color: "#FFFFFF", rule: "evenodd", path: RING },
  { color: "#F59E0B", path: DOT },
] as const;

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

/** 同じ定義の JSON */
const JSON_DEFS = {
  format: 1,
  blocks: [
    { name: "+camera", base: "icon", view: [0, 0, 48, 48], paints: PAINTS.map((p) => ({ ...p })) },
  ],
};

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

/** 描いた SVG の部品 */
const docOf = (svg: string): Document => new DOMParser().parseFromString(svg, "image/svg+xml");

/** 描いた SVG の中で、`d` が `d` に等しい path */
const pathsWith = (svg: string, d: string): Element[] =>
  [...docOf(svg).querySelectorAll("path")].filter((p) => p.getAttribute("d") === d);

/** 部品と、それを包む部品の `transform` を外側から順に掛けた、点 `p` の描いた所。`translate` と `scale` を読む */
function placed(el: Element, p: [number, number]): [number, number] {
  const chain: string[] = [];
  for (let e: Element | null = el; e; e = e.parentElement) {
    const t = e.getAttribute("transform");
    if (t) chain.unshift(t);
  }
  const ops = chain.flatMap((t) =>
    [...t.matchAll(/(translate|scale)\(([^)]*)\)/gu)].map((m) => ({
      op: m[1],
      args: (m[2] ?? "")
        .trim()
        .split(/[\s,]+/u)
        .map(Number),
    })),
  );
  let [x, y] = p;
  for (const { op, args } of [...ops].reverse()) {
    const [a = 0, b] = args;
    if (op === "translate") {
      x += a;
      y += b ?? 0;
    } else {
      x *= a;
      y *= b ?? a;
    }
  }
  return [x, y];
}

/** 誤りの文が `line` 行目を指し、理由の語を持ち、日本語の文は日本語の字を持ち英語の文は持たない */
function refusedAt(
  text: string,
  line: number,
  where: string,
  reason: { ja: RegExp; en: RegExp },
): void {
  for (const lang of LANGS) {
    const read = parse(text, { lang });
    expect(read.ok, `${where} を読めてしまう (${lang})`).toBe(false);
    const at = read.ok ? [] : read.errors.filter((e) => e.line === line);
    expect(
      at.length,
      `${where} の誤りが ${line} 行目を指さない (${lang}): ${read.ok ? "" : JSON.stringify(read.errors)}`,
    ).toBeGreaterThan(0);
    expect(
      at.some((e) => reason[lang].test(e.message)),
      `${where} の誤りの文が理由を名指さない (${lang}): ${JSON.stringify(at.map((e) => e.message))}`,
    ).toBe(true);
    expect(
      at.some((e) => /[ぁ-んァ-ヶ一-龠]/u.test(e.message)),
      `${where} の誤りの文の言葉 (${lang})`,
    ).toBe(lang === "ja");
  }
}

/** 記法の中で、字 `text` で始まる行の番号 (1 から) */
const lineOf = (source: string, text: string): number =>
  source.split("\n").findIndex((l) => l.trim().startsWith(text)) + 1;

describe("色付きの絵柄の定義 (#3633)", () => {
  it("icon-paint-definition-round-trips", () => {
    const fromText = readBlocks(DEFS);
    expect(
      fromText.ok,
      `色付きの絵柄の定義を読めない: ${fromText.ok ? "" : JSON.stringify(fromText.errors)}`,
    ).toBe(true);
    const fromJson = readBlocks(JSON_DEFS);
    expect(
      fromJson.ok,
      `色付きの絵柄の JSON の定義を読めない: ${fromJson.ok ? "" : JSON.stringify(fromJson.errors)}`,
    ).toBe(true);
    if (fromText.ok && fromJson.ok)
      expect(fromJson.blocks, "JSON の定義が記法の定義と違う中身になる").toEqual(fromText.blocks);
    const diagram = parsed(architecture());
    const printed = api("printNotation")(diagram);
    for (const line of DEF_LINES.slice(1))
      expect(printed, `書き戻した記法に \`${line.trim()}\` が無い`).toContain(line);
    expect(parsed(printed), "書き戻した記法を読み直すと元の図と違う").toEqual(diagram);
  });

  it("icon-paint-rejects-non-data", () => {
    const text = architecture();
    const color = { ja: /色/u, en: /colou?r/iu };
    for (const bad of ["url(#g)", "red", "#12"]) {
      const t = text.replace(`paint #F59E0B "${DOT}"`, `paint ${bad} "${DOT}"`);
      refusedAt(t, lineOf(t, `paint ${bad}`), `paint の色に ${bad} を書いた定義`, color);
    }
    const script = text.replace(`paint #F59E0B "${DOT}"`, 'paint #F59E0B "M 0 0 L <script>"');
    refusedAt(
      script,
      lineOf(script, 'paint #F59E0B "M 0 0 L'),
      "paint の path に path の文法の外の字を書いた定義",
      { ja: /path/u, en: /path/iu },
    );
    const both = text.replace("  view 0 0 48 48", '  view 0 0 48 48\n  shape path "M -8 0 h 16"');
    refusedAt(both, lineOf(both, "block +camera"), "paint と shape path を両方書いた定義", {
      ja: /paint|path/u,
      en: /paint|path/iu,
    });
    const noView = text.replace("  view 0 0 48 48\n", "");
    refusedAt(noView, lineOf(noView, "block +camera"), "view の無い paint の定義", {
      ja: /view/u,
      en: /view/iu,
    });
    const flat = text.replace("  view 0 0 48 48", "  view 0 0 0 48");
    refusedAt(flat, lineOf(flat, "view 0 0 0 48"), "幅の無い view の定義", {
      ja: /view/u,
      en: /view/iu,
    });
    const badJson = {
      format: 1,
      blocks: [{ ...JSON_DEFS.blocks[0], paints: [{ color: "url(#g)", path: BACK }] }],
    };
    expect(readBlocks(badJson).ok, "paint の色に url(#g) を書いた JSON の定義を読めてしまう").toBe(
      false,
    );
    const extraJson = {
      format: 1,
      blocks: [
        { ...JSON_DEFS.blocks[0], paints: [{ color: "#2563EB", path: BACK, href: "x.svg" }] },
      ],
    };
    expect(readBlocks(extraJson).ok, "paint に知らない鍵を持つ JSON の定義を読めてしまう").toBe(
      false,
    );
  });

  it("schema-accepts-icon-paint", () => {
    const validate = api("validateDiagram");
    const diagram = parsed(architecture());
    const checked = validate(diagram);
    expect(
      checked.ok,
      `色付きの絵柄の定義を持つ原本が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`,
    ).toBe(true);
    const define = (
      diagram as unknown as { define?: { blocks: { paints?: { color: string }[] }[] } }
    ).define;
    expect(define?.blocks[0]?.paints?.length, "読んだ原本の define に paints が無い").toBe(3);
    const bad = JSON.parse(JSON.stringify(diagram)) as {
      define: { blocks: { paints: { color: string }[] }[] };
    };
    const first = bad.define.blocks[0]?.paints[0];
    if (first) first.color = "url(#g)";
    expect(
      validate(bad as unknown as Json).ok,
      "paint の色に url(#g) を書いた原本が検査を通る",
    ).toBe(false);
  });
});

describe("色付きの絵柄の描き方 (#3633)", () => {
  it("icon-paint-draws-original-colors", () => {
    const { svg } = render(parsed(architecture()));
    for (const p of PAINTS) {
      const found = pathsWith(svg, p.path);
      expect(found.length, `色付きの絵柄の形 ${p.color} が描かれない`).toBeGreaterThan(0);
      for (const el of found) {
        expect(el.getAttribute("fill"), `色付きの絵柄の形の塗りが定義の色 ${p.color} でない`).toBe(
          p.color,
        );
        expect(
          el.getAttribute("fill-rule") ?? "nonzero",
          `色付きの絵柄の形 ${p.color} の塗り方の決まり`,
        ).toBe("rule" in p ? p.rule : "nonzero");
        expect(
          el.closest(".dg-gl"),
          `色付きの絵柄の形 ${p.color} を箱の色の線の絵柄として描いている`,
        ).toBeNull();
        expect(
          el.getAttribute("class") ?? "",
          `色付きの絵柄の形 ${p.color} を箱の色の線の絵柄として描いている`,
        ).not.toContain("dg-gl");
      }
    }
  });

  it("icon-paint-fits-the-icon-frame", () => {
    const plain = docOf(render(parsed(architecture("key"))).svg).querySelector("path.dg-gl");
    expect(plain, "今の絵柄 key を置いた箱の絵柄が描かれない").not.toBeNull();
    const back = pathsWith(render(parsed(architecture())).svg, BACK)[0];
    expect(back, "色付きの絵柄の地の形が描かれない").toBeDefined();
    if (!plain || !back) return;
    // 今の絵柄は (0, 0) を中心に 20 四方。色付きの絵柄は view の枠 (0 0 48 48) を同じ四角に縮める
    const [cx, cy] = placed(plain, [0, 0]);
    const [px] = placed(plain, [10, 0]);
    const half = px - cx;
    const [x1, y1] = placed(back, [0, 0]);
    const [x2, y2] = placed(back, [48, 48]);
    expect(
      Math.abs((x1 + x2) / 2 - cx),
      "色付きの絵柄の真ん中が今の絵柄の真ん中と横にずれる",
    ).toBeLessThan(0.5);
    expect(
      Math.abs((y1 + y2) / 2 - cy),
      "色付きの絵柄の真ん中が今の絵柄の真ん中と縦にずれる",
    ).toBeLessThan(0.5);
    expect(Math.abs((x2 - x1) / 2 - half), "色付きの絵柄の枠の大きさが今の絵柄と違う").toBeLessThan(
      0.5,
    );
  });

  it("icon-paint-works-in-every-kind", () => {
    const sequence = [
      "sequence 写真を送る",
      "",
      DEFS,
      "",
      "box phone as スマホ [icon: +camera]",
      "box store as 置き場",
      "",
      "step 送る",
      "  say 写真を送る。",
      "  phone -> store: 写真",
      "",
    ].join("\n");
    const state = [
      "state 写真の状態",
      "",
      DEFS,
      "",
      "box taken as 撮った [icon: +camera]",
      "box sent as 送った",
      "",
      "step 送る",
      "  say 写真を送る。",
      "  taken -> sent: 送る",
      "",
    ].join("\n");
    for (const [kind, text] of [
      ["sequence", sequence],
      ["state", state],
    ] as const) {
      const { svg } = render(parsed(text));
      expect(pathsWith(svg, BACK).length, `${kind} の箱に色付きの絵柄が描かれない`).toBeGreaterThan(
        0,
      );
    }
  });
});
