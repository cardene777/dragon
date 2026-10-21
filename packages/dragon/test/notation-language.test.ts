/**
 * 記法を日本語の語と英語の語のどちらでも書ける (#2997)。
 *
 * 1 つの file の言葉は最初の行の図の種類の語 (`時系列図` / `構成図` か `sequence` / `architecture`) で決まる。
 * 英語の語は原本の JSON の名前に揃え、記号と原本の JSON は 2 つの言葉で同じにする。
 * 誤りの文は file の言葉で出し、JSON から記法へは渡した言葉の語で書き戻す。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, exampleJson, exampleText, type Json, type LineError, type NotationLang } from "./diagram-support";

const EXAMPLES = ["intro", "oauth", "ccip"] as const;

/** 仮名と漢字。英語の誤りの文に入らない */
const KANA_KANJI = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/** 行の形で見た、その言葉の語の使い方。名札として書いた語 (`帯 = …` や `region -> …`) には当たらない */
const WORDS: Record<NotationLang, RegExp[]> = {
  ja: [/^(時系列図|構成図)\s/u, /^区画\s+[^\s=]+\s*=/u, /^帯\s+[^\s:=>-]/u, /^見せ方\s+\S+$/u, /\[(色|印|区画|名前|札)\s/u, /\[(硬貨|なし|封筒)\]/u],
  en: [
    /^(sequence|architecture)\s/u,
    /^region\s+[^\s=]+\s*=/u,
    /^strip\s+[^\s:=>-]/u,
    /^view\s+\S+$/u,
    /\[(color|icon|region|label|tag)\s/u,
    /\[(coin|none|envelope)\]/u,
  ],
};

/** `text` の中で、`lang` の言葉の語を使っている行 */
const linesWithWords = (text: string, lang: NotationLang): string[] =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => WORDS[lang].some((word) => word.test(line)));

/** 言葉を決める最初の行。空行とコメントの行 (`//`) は飛ばす */
const headLine = (text: string): string =>
  text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line !== "" && !line.startsWith("//")) ?? "";

const firstError = (result: { ok: true } | { ok: false; errors: LineError[] }): LineError | undefined =>
  result.ok ? undefined : result.errors[0];

const schema = JSON.parse(readFileSync(join(process.cwd(), "packages/dragon/src/schemas/diagram.schema.json"), "utf8")) as Json;

/** schema の中で `key` という名前の欄が持つ値の一覧。最初に見つかった物を返す */
function enumOf(node: Json, key: string): string[] | undefined {
  if (node === null || typeof node !== "object") return undefined;
  if (!Array.isArray(node)) {
    const own = node[key];
    if (own && typeof own === "object" && !Array.isArray(own) && Array.isArray(own.enum)) return own.enum as string[];
  }
  for (const child of Object.values(node)) {
    const found = enumOf(child, key);
    if (found) return found;
  }
  return undefined;
}

const schemaEnum = (path: string[]): string[] => {
  let node = schema;
  for (const key of path) node = (node as Record<string, Json>)[key] as Json;
  return node as unknown as string[];
};

/** 運ぶ物。札だけは字を持つ */
const carryOf = (kind: string): Json => (kind === "tag" ? { kind, text: "token" } : { kind });

/** 原本の JSON が持てる語の値を全部使った図。図の種類と見せ方ごとに作る */
function everyWord(kind: string, view: string | undefined): Json {
  const version = api("FORMAT_VERSION");
  const carries = schemaEnum(["definitions", "carry", "properties", "kind", "enum"]);
  const sides = enumOf(schema, "labelSide") ?? [];
  expect(sides.length, "schema に線の名前の側の値が無い").toBeGreaterThan(0);
  const diagram: { [key: string]: Json } = {
    version,
    kind,
    title: "Every word",
    regions: [{ id: "zone", name: "Zone", note: "zone note", color: "blue", icon: "cloud" }],
    boxes: [
      { id: "a", name: "A", sub: "a sub", color: "amber", icon: "user", region: "zone" },
      { id: "b", name: "B" },
    ],
    strip: { title: "State", fields: ["phase", "owner"] },
    steps: [
      {
        title: "Step",
        body: "Body",
        code: "run it",
        events: [
          ...carries.map((carry, i) => ({
            type: "edge",
            from: "a",
            to: "b",
            label: `carry ${i}`,
            carry: carryOf(carry),
          })),
          ...sides.map((side, i) => ({ type: "edge", from: "b", to: "a", label: `side ${i}`, carry: { kind: "envelope" }, labelSide: side })),
          { type: "action", box: "a", label: "work" },
          { type: "swap", box: "a", text: "new sub" },
          { type: "strip", field: "phase", value: "ready", tag: "new" },
          { type: "strip", field: "owner", tag: "me" },
        ],
      },
    ],
  };
  if (view !== undefined) diagram.view = view;
  if (kind === "sequence") diagram.sequence = { lifelines: ["a", "b"] };
  return diagram;
}

describe("英語の語で書いた記法を読む", () => {
  it("english-words-compile-to-same-json", () => {
    const parse = api("parseNotation");
    for (const name of EXAMPLES) {
      const text = exampleText(`${name}.en.dragon`);
      expect(headLine(text), `${name}.en.dragon の最初の行が英語の図の種類の語で始まらない`).toMatch(/^(sequence|architecture)\s/u);
      expect(linesWithWords(text, "ja"), `${name}.en.dragon に日本語の語の行がある`).toEqual([]);
      // 書き直す前 (日本語の語で書いていた時) に読んだ JSON と比べる
      expect(parse(text), name).toEqual({ ok: true, diagram: exampleJson(`${name}.en.json`) });
    }
  });

  it("japanese-examples-compile-unchanged", () => {
    const parse = api("parseNotation");
    for (const name of EXAMPLES) {
      expect(parse(exampleText(`${name}.dragon`)), name).toEqual({ ok: true, diagram: exampleJson(`${name}.json`) });
    }
  });

  it("keyword-table-pairs-every-role", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    const kinds = schemaEnum(["properties", "kind", "enum"]);
    const views = [undefined, ...schemaEnum(["properties", "view", "enum"])];
    for (const kind of kinds) {
      for (const view of views) {
        const diagram = everyWord(kind, view);
        const label = `${kind} ${view ?? "(見せ方なし)"}`;
        for (const lang of ["ja", "en"] as const) {
          const other: NotationLang = lang === "ja" ? "en" : "ja";
          const text = print(diagram, { lang });
          expect(linesWithWords(text, other), `${label} を ${lang} で書き戻すと ${other} の語が残る`).toEqual([]);
          expect(linesWithWords(text, lang).length, `${label} を ${lang} で書き戻した記法に ${lang} の語が無い`).toBeGreaterThan(0);
          expect(parse(text), `${label} を ${lang} で書き戻して読み直すと元の JSON に戻らない`).toEqual({ ok: true, diagram });
        }
      }
    }
  });

  it("other-language-word-reports-file-word", () => {
    const parse = api("parseNotation");
    const en = ["sequence Mixed", "app = App", "api = API", "# Call", "> App calls API.", "app -> api : call"];
    const ja = ["時系列図 混ぜた図", "送る側 = 送る側", "受ける側 = 受ける側", "# 送る", "> 送る。", "送る側 -> 受ける側 : 1 通"];
    const cases: { lines: string[]; at: number; line: string; column: (text: string) => number; word: string }[] = [
      { lines: en, at: 1, line: "区画 zone = Zone", column: () => 1, word: "region" },
      { lines: en, at: 1, line: "帯 state = phase", column: () => 1, word: "strip" },
      { lines: en, at: 1, line: "見せ方 寄る", column: () => 1, word: "view" },
      { lines: en, at: 1, line: "app = App [色 blue]", column: (t) => t.indexOf("[") + 1, word: "color" },
      { lines: en, at: 5, line: "app -> api : call [硬貨]", column: (t) => t.indexOf("[") + 1, word: "coin" },
      { lines: ja, at: 1, line: "region zone = Zone", column: () => 1, word: "区画" },
      { lines: ja, at: 1, line: "strip 状態表 = 状態", column: () => 1, word: "帯" },
      { lines: ja, at: 1, line: "view follow", column: () => 1, word: "見せ方" },
      { lines: ja, at: 1, line: "送る側 = 送る側 [color blue]", column: (t) => t.indexOf("[") + 1, word: "色" },
      { lines: ja, at: 5, line: "送る側 -> 受ける側 : 1 通 [tag 値]", column: (t) => t.indexOf("[") + 1, word: "札" },
    ];
    for (const c of cases) {
      const lines = [...c.lines];
      if (c.at === 5) lines[5] = c.line;
      else lines.splice(c.at, 0, c.line);
      const error = firstError(parse(lines.join("\n")));
      expect(error, `${c.line} が誤りにならない`).toBeDefined();
      expect(error, c.line).toMatchObject({ line: c.at + 1, column: c.column(c.line) });
      expect(error?.message, `${c.line} の誤りが file の言葉の語 (${c.word}) を示さない`).toContain(c.word);
    }
  });

  it("keyword-spelled-ids-read-as-boxes", () => {
    const parse = api("parseNotation");
    const version = api("FORMAT_VERSION");
    const english = [
      "sequence Names",
      'region = Region box "holds"',
      "strip = Strip box",
      "view = View box",
      "color = Color box",
      "区画 = Section box",
      "strip state = phase",
      "# Step",
      "> Body.",
      "region -> strip : first",
      "strip -> view : second",
      "区画 -> region : third",
      "view : think",
      "strip : act",
      'region "new text"',
      "strip phase = A -> B",
    ].join("\n");
    expect(parse(english)).toEqual({
      ok: true,
      diagram: {
        version,
        kind: "sequence",
        title: "Names",
        boxes: [
          { id: "region", name: "Region box", sub: "holds" },
          { id: "strip", name: "Strip box" },
          { id: "view", name: "View box" },
          { id: "color", name: "Color box" },
          { id: "区画", name: "Section box" },
        ],
        strip: { title: "state", fields: ["phase"] },
        steps: [
          {
            title: "Step",
            body: "Body.",
            events: [
              { type: "edge", from: "region", to: "strip", label: "first", carry: { kind: "envelope" } },
              { type: "edge", from: "strip", to: "view", label: "second", carry: { kind: "envelope" } },
              { type: "edge", from: "区画", to: "region", label: "third", carry: { kind: "envelope" } },
              { type: "action", box: "view", label: "think" },
              { type: "action", box: "strip", label: "act" },
              { type: "swap", box: "region", text: "new text" },
              { type: "strip", field: "phase", value: "A -> B" },
            ],
          },
        ],
        sequence: { lifelines: ["region", "strip", "view", "color", "区画"] },
      },
    });

    const japanese = [
      "時系列図 名札",
      "帯 = 帯の箱「値を持つ」",
      "区画 = 区画の箱",
      "見せ方 = 見せ方の箱",
      "region = 英語の綴りの箱",
      "受け手 = 受け手",
      "帯 状態表 = 状態",
      "# 送る",
      "> 本文。",
      "帯 -> 受け手 : 1 通",
      "帯 : 値を書く",
      "区画 -> 帯 : 2 通",
      "region -> 受け手 : 3 通",
      "見せ方 : 見る",
      "帯「書き換え」",
      "帯 状態 = A -> B",
    ].join("\n");
    expect(parse(japanese)).toEqual({
      ok: true,
      diagram: {
        version,
        kind: "sequence",
        title: "名札",
        boxes: [
          { id: "帯", name: "帯の箱", sub: "値を持つ" },
          { id: "区画", name: "区画の箱" },
          { id: "見せ方", name: "見せ方の箱" },
          { id: "region", name: "英語の綴りの箱" },
          { id: "受け手", name: "受け手" },
        ],
        strip: { title: "状態表", fields: ["状態"] },
        steps: [
          {
            title: "送る",
            body: "本文。",
            events: [
              { type: "edge", from: "帯", to: "受け手", label: "1 通", carry: { kind: "envelope" } },
              { type: "action", box: "帯", label: "値を書く" },
              { type: "edge", from: "区画", to: "帯", label: "2 通", carry: { kind: "envelope" } },
              { type: "edge", from: "region", to: "受け手", label: "3 通", carry: { kind: "envelope" } },
              { type: "action", box: "見せ方", label: "見る" },
              { type: "swap", box: "帯", text: "書き換え" },
              { type: "strip", field: "状態", value: "A -> B" },
            ],
          },
        ],
        sequence: { lifelines: ["帯", "区画", "見せ方", "region", "受け手"] },
      },
    });
  });

  it("strip-value-with-arrow-stays-strip", () => {
    const parse = api("parseNotation");
    const text = ["時系列図 帯の値", "甲 = 甲", "乙 = 乙", "帯 状態表 = 状態, 次", "# 送る", "> 送る。", "甲 -> 乙 : 送る", "帯 状態 = A -> B", "帯 次 = 甲 -> 乙 [新]"].join("\n");
    const parsed = parse(text);
    expect(parsed.ok, JSON.stringify(firstError(parsed))).toBe(true);
    if (!parsed.ok) return;
    const events = (parsed.diagram as { steps: { events: Json[] }[] }).steps[0]?.events;
    expect(events?.slice(1)).toEqual([
      { type: "strip", field: "状態", value: "A -> B" },
      { type: "strip", field: "次", value: "甲 -> 乙", tag: "新" },
    ]);
  });

  it("double-quotes-read-like-corner-brackets", () => {
    const parse = api("parseNotation");
    const quoted = [
      "sequence Quotes",
      'region zone = Zone "inside"',
      'app = App "client" [region zone]',
      "api = API「server」",
      "# Call",
      "> App calls API.",
      "app -> api : call",
      'app "updated"',
      "api「changed」",
    ].join("\n");
    const cornered = quoted.replace(/"([^"]*)"/gu, "「$1」");
    const fromQuoted = parse(quoted);
    expect(fromQuoted.ok, JSON.stringify(firstError(fromQuoted))).toBe(true);
    expect(fromQuoted).toEqual(parse(cornered));
    if (!fromQuoted.ok) return;
    const diagram = fromQuoted.diagram as { regions: Json[]; boxes: Json[]; steps: { events: Json[] }[] };
    expect(diagram.regions).toEqual([{ id: "zone", name: "Zone", note: "inside" }]);
    expect(diagram.boxes).toEqual([
      { id: "app", name: "App", sub: "client", region: "zone" },
      { id: "api", name: "API", sub: "server" },
    ]);
    expect(diagram.steps[0]?.events.slice(1)).toEqual([
      { type: "swap", box: "app", text: "updated" },
      { type: "swap", box: "api", text: "changed" },
    ]);
  });

  it("japanese-file-keeps-double-quotes-literal", () => {
    const parse = api("parseNotation");
    const text = ["時系列図 引用", '区画 z = Zone "y"', 'a = App "x" [区画 z]', "b = B", "# 呼ぶ", "> 呼ぶ。", "a -> b : 呼ぶ"].join("\n");
    const parsed = parse(text);
    expect(parsed.ok, JSON.stringify(firstError(parsed))).toBe(true);
    if (!parsed.ok) return;
    const diagram = parsed.diagram as { regions: Json[]; boxes: Json[] };
    expect(diagram.regions).toEqual([{ id: "z", name: 'Zone "y"' }]);
    expect(diagram.boxes[0]).toEqual({ id: "a", name: 'App "x"', region: "z" });
  });
});

describe("JSON から記法へ言葉を選んで書き戻す", () => {
  it("roundtrip-in-english-keeps-json-identical", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    for (const name of EXAMPLES.flatMap((n) => [`${n}.json`, `${n}.en.json`])) {
      const diagram = exampleJson(name);
      const text = print(diagram, { lang: "en" });
      expect(linesWithWords(text, "ja"), `${name} を英語で書き戻すと日本語の語が残る`).toEqual([]);
      expect(text, `${name} を英語で書き戻すと「」で囲む`).not.toContain("「");
      expect(parse(text), name).toEqual({ ok: true, diagram });
    }

    const version = api("FORMAT_VERSION");
    const quoting = {
      version,
      kind: "architecture",
      title: "Quotes inside",
      regions: [{ id: "zone", name: "Zone", note: 'a "b" c' }],
      boxes: [
        { id: "app", name: 'Say "hi"', sub: "greeting", region: "zone" },
        { id: "api", name: "API", sub: "server" },
      ],
      steps: [{ title: "Call", body: "App calls API.", events: [{ type: "edge", from: "app", to: "api", label: "call", carry: { kind: "envelope" } }, { type: "swap", box: "api", text: 'say "x"' }] }],
    };
    const text = print(quoting, { lang: "en" });
    expect(text).toContain('app = Say "hi"「greeting」');
    expect(text).toContain('api = API "server"');
    expect(text).toContain('api「say "x"」');
    expect(parse(text)).toEqual({ ok: true, diagram: quoting });
  });

  it("print-defaults-to-japanese", () => {
    const print = api("printNotation");
    for (const name of EXAMPLES) {
      const diagram = exampleJson(`${name}.json`);
      const today = readFileSync(join(process.cwd(), `packages/dragon/test/fixtures/printed/${name}.dragon`), "utf8");
      expect(print(diagram), name).toBe(today);
      expect(print(diagram, { lang: "ja" }), name).toBe(today);
    }
  });
});

describe("誤りの文の言葉", () => {
  const en = ["sequence Errors", "app = App", "api = API", "# Call", "> App calls API.", "app -> api : call"];

  it("english-file-errors-in-english", () => {
    const parse = api("parseNotation");
    const replace = (index: number, line: string): string => en.map((l, i) => (i === index ? line : l)).join("\n");
    const insert = (index: number, line: string): string => [...en.slice(0, index), line, ...en.slice(index)].join("\n");
    const cases: Record<string, string> = {
      "宣言していない箱": replace(5, "app -> nowhere : lost"),
      "読めない行": replace(5, "app => api"),
      "本文の無い段": [...en, "# Again"].join("\n"),
      "色の値": replace(1, "app = App [color pink]"),
      "名札の重なり": insert(3, "app = Again"),
      "見せ方の値": insert(1, "view sideways"),
      "宣言していない帯": replace(5, "strip phase = ready"),
      "書けない指定": replace(1, "app = App [shape round]"),
      "箱が無い": ["sequence Empty", "# Call", "> Nothing."].join("\n"),
      "段が無い": ["sequence Only", "app = App"].join("\n"),
      "題の無い段": insert(3, "#"),
      "題の無い図": ["sequence", "app = App"].join("\n"),
    };
    for (const [label, text] of Object.entries(cases)) {
      const error = firstError(parse(text));
      expect(error, `${label} が誤りにならない`).toBeDefined();
      expect(error?.line, label).toBeGreaterThan(0);
      expect(error?.column, label).toBeGreaterThan(0);
      expect(error?.message, `${label} の誤りの文が空`).not.toBe("");
      expect(error?.message, `${label} の誤りの文が英語でない`).not.toMatch(KANA_KANJI);
    }
    expect(firstError(parse(replace(5, "app -> nowhere : lost")))).toMatchObject({ line: 6, column: 8 });
  });

  it("japanese-file-errors-stay-japanese", () => {
    const parse = api("parseNotation");
    const ja = ["時系列図 誤りのある図", "送る側 = 送る側", "受ける側 = 受ける側", "# 送る", "> 送る。", "送る側 -> 受ける側 : 1 通"];
    const replace = (index: number, line: string): string => ja.map((l, i) => (i === index ? line : l)).join("\n");
    const cases: [string, string][] = [
      [replace(5, "送る側 -> 届け先 : 迷う"), "届け先 という箱は宣言していない"],
      [replace(5, "送る側 => 受ける側"), "読めない行。線は <名札> -> <名札> : <線の名前>、処理は <名札> : <処理の名前> の形で書く"],
      [[...ja, "# 返す"].join("\n"), "段「返す」に本文 (> で始まる行) が要る"],
      [replace(1, "送る側 = 送る側 [色 pink]"), "色は blue / amber / green / violet / rose / slate / coin のどれか"],
      [[ja[0], "見せ方 横", ...ja.slice(1)].join("\n"), "見せ方は 止める か 寄る"],
      [replace(0, "流れ図 誤りのある図"), "最初の行は 時系列図 か 構成図 で始め、続けて題を書く"],
    ];
    for (const [text, message] of cases) {
      expect(firstError(parse(text))?.message).toBe(message);
    }
  });

  it("unknown-language-errors-use-given-language", () => {
    const parse = api("parseNotation");
    const japanese = "最初の行は 時系列図 か 構成図 で始め、続けて題を書く";
    expect(firstError(parse("flow chart"))?.message, "言葉を渡さない時に日本語で出さない").toBe(japanese);
    expect(firstError(parse("flow chart", { lang: "ja" }))?.message).toBe(japanese);
    for (const text of ["flow chart", ""]) {
      const message = firstError(parse(text, { lang: "en" }))?.message ?? "";
      expect(message, `${JSON.stringify(text)} の誤りの文が英語でない`).not.toMatch(KANA_KANJI);
      expect(message, `${JSON.stringify(text)} の誤りの文が英語の図の種類の語を示さない`).toMatch(/sequence/u);
      expect(message).toMatch(/architecture/u);
    }
  });
});

describe("Markdown と使い方の文書", () => {
  it("markdown-fences-read-each-language", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    const body = ["甲 = 甲", "乙 = 乙", "# 呼ぶ", "> 甲が乙を呼ぶ。", "甲 -> 乙 : 呼ぶ"];
    const markdown = ["# 図", "", "```dragon", "時系列図 同じ図", ...body, "```", "", "```dragon", "sequence 同じ図", ...body, "```", ""].join("\n");
    const fences = extract(markdown);
    expect(fences.length).toBe(2);
    const [ja, en] = fences.map((fence) => parse(fence.source));
    expect(ja?.ok, JSON.stringify(ja)).toBe(true);
    expect(en, "英語の語の囲みが日本語の語の囲みと同じ図にならない").toEqual(ja);
  });

  it("quick-start-en-fences-parse", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    const path = join(process.cwd(), "packages/dragon/examples/quick-start.en.md");
    expect(existsSync(path), "使い方の文書の英語版 (packages/dragon/examples/quick-start.en.md) が無い").toBe(true);
    if (!existsSync(path)) return;
    const english = extract(readFileSync(path, "utf8"));
    const japanese = extract(exampleText("quick-start.md"));
    expect(english.length, "英語版の図の数が日本語版と違う").toBe(japanese.length);
    for (const fence of english) {
      expect(headLine(fence.source), `${fence.line} 行目の囲みが英語の語で始まらない`).toMatch(/^(sequence|architecture)\s/u);
      expect(linesWithWords(fence.source, "ja"), `${fence.line} 行目の囲みに日本語の語がある`).toEqual([]);
      const parsed = parse(fence.source);
      expect(parsed.ok, `${fence.line} 行目の囲みが読めない ${JSON.stringify(firstError(parsed))}`).toBe(true);
    }
  });
});
