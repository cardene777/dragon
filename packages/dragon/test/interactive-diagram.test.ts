// @vitest-environment jsdom
/**
 * 読み手が値を入れて動かせる図の記法と原本と描き方 (#3337)。
 *
 * 1 行目を `try` にし、部品の行 (`route`、`queue`、`chain`、`ask`、`press`) を上から並べて書く。部品の行は最初の段より前にだけ書ける。
 * チップ (`item`) は入力の帯の欄の値を属性で持ち、最初の欄 (送り手) がチップの名前になる。
 * 段の中では、待ち行列と機械の列の中身を書き (`line`)、書き手の例として送り (`ask`)、釦を押し (`press`)、チップを書き換える (`item`)。
 * 書き手の例の段は、書き出しと印刷で描く。見本は「トランザクションがブロックに入るまで」(`packages/dragon/examples/tx-block.dragon`)。
 * まだ `try` を読めない間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { changelogEntry } from "./changelog-support";
import { api, exampleJson, type Json, type LineError } from "./diagram-support";
import { cliRunCount, formatOf, runCli } from "./export-support";
import { draw } from "./render-support";
import {
  KANA,
  mountTry,
  parsedTry,
  pressButton,
  releaseTry,
  SMALL_PARTS,
  SMALL_VALUES,
  smallTry,
  tryLayout,
  txBlock,
} from "./try-support";


const EXAMPLES = join(process.cwd(), "packages/dragon/examples");

/** 試す図の部品の行の頭の語。step 5 で本人が選んだ */
const PART_WORDS = ["route", "queue", "chain", "ask", "press"] as const;

/** 見本「トランザクションがブロックに入るまで」の file */
const TX_FILES = [
  "tx-block.dragon",
  "tx-block.en.dragon",
  "tx-block.json",
  "tx-block.en.json",
] as const;

interface Source {
  kind?: string;
  title?: string;
  blocks?: Record<string, Json[]>;
  steps?: { title?: string; events?: { type?: string }[] }[];
}

const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

const readRepo = (path: string): string => {
  const full = join(process.cwd(), path);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
};

afterEach(() => releaseTry());

/** 原本の部品と段と出来事の数。日本語と英語の見本で同じ形かを比べる */
function shape(source: Source): { blocks: Record<string, number>; steps: number[] } {
  const blocks: Record<string, number> = {};
  for (const [name, list] of Object.entries(source.blocks ?? {})) blocks[name] = list.length;
  return { blocks, steps: (source.steps ?? []).map((step) => (step.events ?? []).length) };
}

describe("試す図の記法 (#3337)", () => {
  it("interactive-notation-parses", () => {
    const diagram = parsedTry(smallTry({ examples: true })) as Source;
    expect(diagram.kind, "1 行目を try にした図の種類").toBe("try");
    const checked = api("validateDiagram")(diagram);
    expect(
      checked.ok,
      `試す図の原本が原本の形の検査を通らない: ${checked.ok ? "" : JSON.stringify(checked.errors)}`,
    ).toBe(true);
    // 部品の行に書いた名札は全て原本に入る
    const text = JSON.stringify(diagram);
    for (const name of ["net", "pool", "blocks", "build", "sender", "fee"])
      expect(text, `原本に部品の名札 ${name} が無い`).toContain(`"${name}"`);
    expect(diagram.steps?.length, "試す図の原本の段の数").toBe(4);
    // 部品を上から並べた順に、描く部品が上から積む
    const parts = tryLayout(diagram).parts;
    const order = ["net", "pool", "blocks"].map(
      (id) => parts.find((part) => part.id === id)?.rect.y ?? Number.NaN,
    );
    expect(
      order.every((y, i) => i === 0 || y > (order[i - 1] ?? Number.POSITIVE_INFINITY)),
      `網、待ち行列、機械の列の順に上から積まない: ${JSON.stringify(order)}`,
    ).toBe(true);
  });

  /** 部品の行を置けない所に書いた記法と、誤りの行と列 (0 から数える)。図の種類の外に書いた行は、試す図 (try) を名指す */
  const MISPLACED: [string, string[], number, number, boolean][] = [
    [
      "段の中の route",
      [...smallTry().split("\n"), "  route net2: a - b [from: a, to: b]"],
      14,
      2,
      false,
    ],
    ["段の中の queue", [...smallTry().split("\n"), "  queue pool2"], 14, 2, false],
    ["段の中の chain", [...smallTry().split("\n"), "  chain blocks2"], 14, 2, false],
    [
      "列の図の queue",
      [
        "lineup 列の図",
        "box top",
        "item a",
        "queue pool",
        "step 並べる",
        "  say 並べる。",
        "  line top: a",
      ],
      3,
      0,
      true,
    ],
    [
      "木の図の press",
      ["tree 木の図", "press build", "step 葉", "  say 葉。", "  leaf x1"],
      1,
      0,
      true,
    ],
    [
      "時系列図の ask",
      ["sequence 時系列図", "box a", "ask sender, fee [into: a]", "step 送る", "  say 送る。"],
      2,
      0,
      true,
    ],
  ];

  it("interactive-misplaced-line-names-line-and-column", () => {
    const parse = api("parseNotation");
    for (const [name, lines, row, column, namesTry] of MISPLACED) {
      for (const lang of ["ja", "en"] as const) {
        const parsed = parse(lines.join("\n"), { lang });
        const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
        expect(
          first && { line: first.line, column: first.column },
          `${name} の誤りの行と列 (${lang})`,
        ).toEqual({ line: row + 1, column: column + 1 });
        expect(first?.message ?? "", `${name} の誤りの文 (${lang})`).not.toBe("");
        if (namesTry)
          expect(
            first?.message ?? "",
            `${name} の誤りの文が試す図 (try) を名指さない (${lang})`,
          ).toContain("try");
      }
    }
  });

  it("interactive-errors-in-english-carry-no-kana", () => {
    const parse = api("parseNotation");
    const replace = (from: string, to: string): string[] =>
      smallTry()
        .split("\n")
        .map((line) => (line.startsWith(from) ? to : line));
    /** 誤りの行 (0 から数える)。差し替えた行か、最後に足した行 */
    const rowOf = (lines: string[], from: string): number =>
      lines.findIndex((line) => line.startsWith(from));
    const misused: [string, string[], number][] = [
      ...MISPLACED.map(([name, lines, row]): [string, string[], number] => [name, lines, row]),
      [
        "宣言していない待ち行列へ送る ask",
        replace("ask ", "ask sender, to, amount, fee [into: nowhere, via: net]"),
        rowOf(smallTry().split("\n"), "ask "),
      ],
      [
        "宣言していない機械の列へ移す press",
        replace("press ", "press build [from: pool, into: nowhere, take: 3]"),
        rowOf(smallTry().split("\n"), "press "),
      ],
      [
        "0 件を取り出す press",
        replace("press ", "press build [from: pool, into: blocks, take: 0]"),
        rowOf(smallTry().split("\n"), "press "),
      ],
      [
        "入力の帯に無い欄で並べる queue",
        replace("queue ", "queue pool [order: weight]"),
        rowOf(smallTry().split("\n"), "queue "),
      ],
      [
        "入力の帯に無い欄を書き換える chain",
        replace("chain ", "chain blocks [edit: weight]"),
        rowOf(smallTry().split("\n"), "chain "),
      ],
      [
        "網に無い節から運ぶ route",
        replace("route ", "route net: you - n1 - maker [from: nobody, to: maker]"),
        rowOf(smallTry().split("\n"), "route "),
      ],
      [
        "入力の帯に無い欄を持つ item",
        [
          ...smallTry().split("\n").slice(0, 10),
          "item o5 [weight: 3]",
          ...smallTry().split("\n").slice(10),
        ],
        10,
      ],
      [
        "宣言していない釦を押す段",
        [...smallTry().split("\n"), "step 押す", "  say 押す。", "  press nope"],
        16,
      ],
      [
        "欄の数が足りない ask の段",
        [...smallTry().split("\n"), "step 送る", "  say 送る。", "  ask me, bob"],
        16,
      ],
      [
        "宣言していないチップの line",
        [...smallTry().split("\n"), "step 並べる", "  say 並べる。", "  line pool: zz"],
        16,
      ],
    ];
    for (const [name, lines, row] of misused) {
      const ja = parse(lines.join("\n"), { lang: "ja" });
      expect(ja.ok, `${name} が誤りにならない`).toBe(false);
      expect(ja.ok ? undefined : ja.errors[0]?.line, `${name} の誤りの行`).toBe(row + 1);
      expect(ja.ok ? "" : (ja.errors[0]?.message ?? ""), `${name} の日本語の誤りの文`).not.toBe("");
      const en = parse(lines.join("\n"), { lang: "en" });
      const message = en.ok ? "" : (en.errors[0]?.message ?? "");
      expect(message, `${name} の英語の誤りの文`).not.toBe("");
      expect(
        KANA.test(message.replaceAll(/"[^"]*"|`[^`]*`/gu, "")),
        `${name} の英語の誤りの文に仮名か漢字がある: ${message}`,
      ).toBe(false);
    }
  });

  it("notation-keeps-interactive-words-plain-outside-interactive", () => {
    const parse = api("parseNotation");
    for (const kind of ["sequence", "architecture"] as const) {
      const text = [
        `${kind} 試す図の語の名札`,
        ...["try", ...PART_WORDS].map((word) => `box ${word}`),
        "step 送る",
        "  say 送る。",
        "  try -> route: 運ぶ",
        "  queue -> chain: 並べる",
        "  ask -> press: 押す",
      ].join("\n");
      const parsed = parse(text);
      expect(
        parsed.ok,
        `${kind} で試す図の語を名札にした箱が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`,
      ).toBe(true);
      const diagram = (parsed.ok ? parsed.diagram : {}) as unknown as {
        blocks?: { box?: { id: string }[] };
        steps?: { events: { type: string; from?: string; to?: string }[] }[];
      };
      expect(
        diagram.blocks?.box?.map((b) => b.id),
        `${kind} の箱の名札`,
      ).toEqual(["try", ...PART_WORDS]);
      expect(
        diagram.steps?.[0]?.events.map((e) => ({ type: e.type, from: e.from, to: e.to })),
        `${kind} の試す図の語から出る線`,
      ).toEqual([
        { type: "edge", from: "try", to: "route" },
        { type: "edge", from: "queue", to: "chain" },
        { type: "edge", from: "ask", to: "press" },
      ]);
    }
  });

  it("interactive-round-trip-keeps-json", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    const sources: [string, string | undefined][] = [
      ["小さな試す図", smallTry({ examples: true })],
      ["tx-block.dragon", fileText("tx-block.dragon")],
      ["tx-block.en.dragon", fileText("tx-block.en.dragon")],
    ];
    for (const [name, text] of sources) {
      expect(text, `${name} が無い`).toBeDefined();
      const first = parse(text ?? "");
      expect(first.ok, `${name} が読めない: ${first.ok ? "" : JSON.stringify(first.errors)}`).toBe(
        true,
      );
      if (!first.ok) continue;
      const printed = print(first.diagram);
      const second = parse(printed);
      expect(
        second.ok,
        `${name} を書き戻した記法が読めない: ${second.ok ? "" : JSON.stringify(second.errors)}\n${printed}`,
      ).toBe(true);
      expect(
        second.ok ? second.diagram : undefined,
        `${name} を往復した JSON が最初と違う\n${printed}`,
      ).toEqual(first.diagram);
    }
  });
});

describe("試す図の描き方 (#3337)", () => {
  it("interactive-chip-shows-name-and-order-value", () => {
    const diagram = parsedTry(smallTry({ examples: true }));
    const svg = new DOMParser().parseFromString(
      draw("renderDiagram")(diagram).svg,
      "image/svg+xml",
    );
    const values: Record<string, string[]> = { ...SMALL_VALUES, me: ["me", "bob", "2", "6"] };
    const chips = [...svg.querySelectorAll("[data-chip]")];
    expect(chips.map((chip) => chip.getAttribute("data-chip")).sort(), "図に描いたチップ").toEqual(
      Object.keys(values).sort(),
    );
    for (const chip of chips) {
      const id = chip.getAttribute("data-chip") ?? "";
      const texts = [...chip.querySelectorAll("text")]
        .map((text) => text.textContent?.trim() ?? "")
        .filter((text) => text !== "");
      // 名前 (送り手) と、待ち行列が並べる順に使う手数料だけを出す
      expect(texts, `チップ ${id} の字`).toEqual([values[id]?.[0], values[id]?.[3]]);
    }
  });

  it("interactive-button-sits-where-written", () => {
    const parts = SMALL_PARTS.map((line) =>
      line.startsWith("press ")
        ? "press build [from: pool, into: blocks, take: 3, at: blocks]"
        : line,
    );
    const { host } = mountTry(parsedTry(smallTry({ parts })), 720);
    const button = pressButton(host, "build");
    expect(button, "作る釦が無い").not.toBeNull();
    expect(button?.getAttribute("data-at"), "作る釦を書き手が置いた部品に置かない").toBe("blocks");
    expect(
      button?.closest('[data-dragon="ask"]'),
      "置き場を書いた作る釦が入力の帯に入る",
    ).toBeNull();
  });

  it("interactive-button-defaults-to-strip", () => {
    const { host } = mountTry(parsedTry(smallTry()), 720);
    const button = pressButton(host, "build");
    expect(button, "作る釦が無い").not.toBeNull();
    expect(
      button?.closest('[data-dragon="ask"]'),
      "置き場を書かない作る釦が入力の帯に入らない",
    ).not.toBeNull();
  });
});

describe("試す図の書き出し (#3337)", () => {
  // 書き出しの件が書き出しの命令を起こした回数を数える (#3602)
  let runsAtStart = 0;
  let exportCliRuns: number | undefined;
  beforeEach(() => {
    runsAtStart = cliRunCount();
  });
  afterEach(({ task }) => {
    if (task.name === "interactive-export-draws-author-steps") exportCliRuns = cliRunCount() - runsAtStart;
  });

  it(
    "interactive-export-draws-author-steps",
    async () => {
      const json = join(EXAMPLES, "tx-block.json");
      expect(existsSync(json), "tx-block.json が無い").toBe(true);
      const source = txBlock() as Source;
      // 書き出しと印刷は、書き手が書いた段を全て描き、最後の段 (書き換える) は食い違いの印を出す
      const rendered = draw("renderDiagram")(source, { still: true });
      expect(rendered.timeline.steps.length, "書き出しで描く段の数が書き手の段の数と違う").toBe(
        source.steps?.length,
      );
      expect((source.steps?.length ?? 0) > 1, "見本に書き手の例の段が無い").toBe(true);
      expect(rendered.svg, "書き手の例の書き換える段の食い違いの印 (≠) が描かれない").toContain(
        "≠",
      );
      expect(rendered.svg, "書き出す図に入力の欄が入る").not.toMatch(/<input|<button|<form/u);

      const out = join(mkdtempSync(join(tmpdir(), "dragon-try-")), "out");
      const ran = await runCli(["export", json, "--format", "png", "--out", out]);
      expect(ran.code, `書き出しの命令が落ちた: ${ran.stderr}`).toBe(0);
      const file = join(out, "tx-block.png");
      expect(
        formatOf(existsSync(file) ? readFileSync(file) : Buffer.alloc(0)),
        `${file} が png として書かれていない`,
      ).toBe("png");
    },
  );

  // 書き出しの命令を子の Node のプロセスで起こすと、その中で Chromium も起こし、混んだ機械で 1 件の上限 (10 秒) を超えた (#3602)
  it("interactive-export-spawns-no-cli", () => {
    expect(exportCliRuns, "書き出しの件より後に回し、書き出しの件の回数を数えている").toBeDefined();
    expect(exportCliRuns, "試す図の書き出しの件が書き出しの命令を起こした回数").toBe(0);
  });
});

describe("試す図の見本 (#3337)", () => {
  it("tx-block-example-matches-json", () => {
    const parse = api("parseNotation");
    for (const file of TX_FILES)
      expect(existsSync(join(EXAMPLES, file)), `${file} が packages/dragon/examples に無い`).toBe(
        true,
      );
    for (const name of ["tx-block", "tx-block.en"]) {
      const parsed = parse(fileText(`${name}.dragon`) ?? "", {
        lang: name.endsWith(".en") ? "en" : "ja",
      });
      expect(
        parsed.ok,
        `${name}.dragon が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`,
      ).toBe(true);
      expect(
        parsed.ok ? parsed.diagram : undefined,
        `${name}.dragon から作った JSON が ${name}.json と違う`,
      ).toEqual(exampleJson(`${name}.json`));
    }
    const ja = exampleJson("tx-block.json") as Source;
    const en = exampleJson("tx-block.en.json") as Source;
    expect(ja.kind, "見本の図の種類").toBe("try");
    expect(shape(en), "英語版の部品と段と出来事の数が日本語版と違う").toEqual(shape(ja));
    // 書き手の例の段は、送る、作る、書き換えるの 3 つの出来事を含む
    const types = (ja.steps ?? []).flatMap((step) =>
      (step.events ?? []).map((event) => event.type),
    );
    for (const type of ["ask", "press", "item"])
      expect(types, `見本の書き手の例の段に ${type} が無い`).toContain(type);
  });

  it("tx-block-example-renders-in-bitsumi-palette", () => {
    const palettes = draw("PALETTES");
    const arcade = palettes.arcade;
    expect(arcade, "bitsumi の色味 (arcade) が無い").toBeDefined();
    for (const file of ["tx-block.json", "tx-block.en.json"] as const) {
      const rendered = draw("renderDiagram")(txBlock(file), {
        palette: "arcade",
        theme: "dark",
      });
      const svg = rendered.svg.toLowerCase();
      expect(rendered.palette, `${file} を描いた色味`).toBe("arcade");
      expect(svg, `${file} に arcade の地が入らない`).toContain(
        (arcade?.dark.bg ?? "-").toLowerCase(),
      );
      expect(svg, `${file} に arcade の緑が入らない`).toContain(
        (arcade?.dark["c-green"] ?? "-").toLowerCase(),
      );
    }
  });
});

describe("試す図の書き方の文書 (#3337)", () => {
  it("docs-describe-interactive-kind", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    /** 文書の中の dragon の囲みのうち、試す図として読める囲みの数 */
    const tryFences = (text: string): number =>
      extract(text).filter((fence) => {
        const parsed = parse(fence.source);
        return parsed.ok && (parsed.diagram as Source).kind === "try";
      }).length;
    const docs: [string, string][] = [
      ["packages/dragon/README.ja.md", "### 試す図"],
      ["packages/dragon/README.md", "### Try diagram"],
      ["packages/dragon/examples/quick-start.md", "try "],
      ["packages/dragon/examples/quick-start.en.md", "try "],
    ];
    for (const [path, heading] of docs) {
      const text = readRepo(path);
      expect(text, `${path} に試す図の小節 (${heading.trim()}) が無い`).toContain(heading);
      expect(tryFences(text), `${path} に試す図として読める dragon の囲みが無い`).toBeGreaterThan(
        0,
      );
      for (const word of PART_WORDS)
        expect(text, `${path} に部品の行 ${word} の書き方が無い`).toContain(`${word} `);
    }
    const content = readRepo("apps/playground-spa/src/docs/content.ts");
    expect(/SECTIONS = \[[^\]]*"try"/u.test(content), "使い方の頁の節に試す図 (try) が無い").toBe(
      true,
    );
    for (const word of ["try", ...PART_WORDS])
      expect(content, `使い方の頁に ${word} の行が無い`).toContain(`${word} `);
  });

  it("changelog-lists-interactive-kind", () => {
    for (const path of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const entry = changelogEntry(join(process.cwd(), path), 3337);
      expect(entry, `${path} にこの課題 (#3337) の項が無い`).not.toBe("");
      for (const word of ["try", ...PART_WORDS])
        expect(entry, `${path} の #3337 の項を持つ節に ${word} が無い`).toContain(`\`${word}\``);
    }
  });
});
