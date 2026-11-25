/**
 * dragonの記法とHTMLの形を相互に変換する (#3908)。
 *
 * HTMLの形は記法の1行を1つの要素で書き、図を`<dg-<種類>>`で包む。要素と属性の名前は原本のJSONの欄の名前から作る。
 * 変換は記法と原本のJSONの今の行き来 (`parseNotation`と`printNotation`) を間に挟み、記法へ戻すと整えた形になる。
 * 戻した記法を読んだ原本のJSONが元と同じなら足り、空行と字下げは揃えない。
 * Markdownの頁は`<dragon-page>`の頁と行き来し、頭の行、見出し、引用、`<details>`、用語のリンク、図が対応する要素へ移る。
 * `dragon check`はHTMLのfileも読み、誤りをHTMLの行と要素の名前で知らせる。
 *
 * 見本帳の見本は全て`packages/dragon/examples`の記法の file から読むので、その dir の全ての記法を変換して戻す。
 * 命令を起こす仕事と全ての見本を変換する仕事は、1 件 10 秒の上限に掛からない file を読み込む段 (`at-load.ts`) で済ませる。
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
// 全ての種類の見本を変換するので、全ての種類を読む
import * as dragon from "./all-kinds";

const ROOT = process.cwd();
const CLI = join(ROOT, "packages/dragon/dist/cli.js");
const EXAMPLES = join(ROOT, "packages/dragon/examples");

type Lang = "ja" | "en";
interface LineError {
  line: number;
  message: string;
}
/** HTMLの形の誤り。`element`は名指す要素の名前 (`dg-box`など) */
interface HtmlError {
  line: number;
  column: number;
  element: string;
  message: string;
}
interface Converter {
  notationToHtml(text: string, options?: { lang?: Lang }): { ok: true; html: string } | { ok: false; errors: LineError[] };
  htmlToNotation(html: string, options?: { lang?: Lang }): { ok: true; notation: string } | { ok: false; errors: HtmlError[] };
  markdownToHtml(markdown: string, options?: { lang?: Lang }): { ok: true; html: string } | { ok: false; errors: HtmlError[] };
  htmlToMarkdown(html: string, options?: { lang?: Lang }): { ok: true; markdown: string } | { ok: false; errors: HtmlError[] };
}

const exported = <K extends keyof Converter>(name: K): Converter[K] | undefined => (dragon as unknown as Partial<Converter>)[name];

/** 変換の関数。出ていない時は判定で落とす */
function tool<K extends keyof Converter>(name: K): Converter[K] | undefined {
  const value = exported(name);
  expect(value, `${name} が src/core から出ていない`).toBeDefined();
  return value;
}

/** 読んだ図の原本。読めない時は undefined。描く印などを外し、JSON にできる欄だけを比べる */
function parsed(text: string): unknown {
  const read = dragon.parseNotation(text, { lang: "ja" });
  return read.ok ? (JSON.parse(JSON.stringify(read.diagram)) as unknown) : undefined;
}

const count = (text: string, part: string): number => text.split(part).length - 1;

interface Ran {
  code: number;
  stdout: string;
  stderr: string;
}
/** 組み上がった命令を子の Node で打つ */
function run(args: string[]): Ran {
  const ran = spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8" });
  return { code: ran.status ?? 1, stdout: ran.stdout, stderr: ran.stderr };
}

/** 一時の dir に file を置いて path を返す */
function place(name: string, text: string): string {
  const path = join(mkdtempSync(join(tmpdir(), "dragon-html-form-")), name);
  writeFileSync(path, text);
  return path;
}

/** 手順の図。箱 3 つと判断 1 つ、段 3 つと線 3 本 */
const FLOW = [
  "flow 申し込みの確かめ",
  "",
  "box form as 申し込み [color: green]",
  "choice ok as 足りている？",
  "box back as 差し戻す [color: rose]",
  "box done as 受け付ける",
  "",
  "step 読む",
  "  say 申し込みの欄を読む。",
  "  form -> ok: 読む",
  "step 足りない時",
  "  say 欄が足りなければ差し戻す。",
  "  ok -> back: いいえ",
  "step 足りる時",
  "  say 欄が足りていれば受け付ける。",
  "  ok -> done: はい",
  "",
].join("\n");

/** 説明の頁の見本と、入口の組み立ての頁の見本 */
const GUIDE = readFileSync(join(EXAMPLES, "guide/guide.md"), "utf8");
const ENTRY_PAGE = readFileSync(join(EXAMPLES, "page/page.md"), "utf8");

/** 見出しの行。囲みの中は数えない */
function headings(markdown: string): string[] {
  let fence = false;
  return markdown.split("\n").filter((line) => {
    if (line.startsWith("```")) fence = !fence;
    return !fence && /^#{1,6} /u.test(line);
  });
}

/** 頁の dragon の囲みを読んだ原本の並び */
const figures = (markdown: string): unknown[] => dragon.extractDiagrams(markdown).map((fence) => parsed(fence.source));

/** 原本のJSONの欄に無い名前の要素を持つHTMLの形。3 行目の`dg-boxx`が知らない名前 */
const UNKNOWN_ELEMENT = ['<dg-flow title="申し込み">', '  <dg-box id="form">申し込み</dg-box>', '  <dg-boxx id="back">差し戻す</dg-boxx>', "</dg-flow>", ""].join("\n");
/** 原本のJSONの欄に無い名前の属性を持つHTMLの形。2 行目の`colour`が知らない名前 */
const UNKNOWN_ATTRIBUTE = ['<dg-flow title="申し込み">', '  <dg-box id="form" colour="green">申し込み</dg-box>', "</dg-flow>", ""].join("\n");
/** 段の中にだけ書ける線を、図の直ぐ下に書いたHTMLの形。3 行目の`dg-edge`が置けない所に在る */
const MISPLACED_ELEMENT = ['<dg-sequence title="注文">', '  <dg-box id="a">あなた</dg-box>', '  <dg-edge from="a" to="a">頼む</dg-edge>', "</dg-sequence>", ""].join("\n");

/**
 * 誤りを持つ 2 つの図を置いた頁。6 行目の箱の色`purple`は記法が読まない色で、14 行目の`dg-stepp`は知らない名前の要素。
 * 記法の誤りは記法の行ではなく、その行を作った要素の行と名前で知らせる
 */
const BROKEN_PAGE = [
  "<!doctype html>",
  '<html lang="ja">',
  "<body>",
  "<p>申し込みの図。</p>",
  '<dg-flow title="申し込みの確かめ">',
  '  <dg-box id="form" color="purple">申し込み</dg-box>',
  '  <dg-choice id="ok">足りている？</dg-choice>',
  '  <dg-step title="読む">',
  "    <dg-body>申し込みの欄を読む。</dg-body>",
  '    <dg-edge from="form" to="ok">読む</dg-edge>',
  "  </dg-step>",
  "</dg-flow>",
  '<dg-sequence title="注文">',
  '  <dg-stepp title="頼む"></dg-stepp>',
  "</dg-sequence>",
  "</body>",
  "</html>",
  "",
].join("\n");

/**
 * 取消の箱の下の縁へ入る 3 本の通らない道が並んで近すぎる状態遷移図 (`test/fixtures/layout/crowded-lines.dragon`) をHTMLの形で書いた頁。
 * 崩れは段 1 に出るので、10 行目の最初の`dg-step`の行と名前で知らせる
 */
const CROWDED_PAGE = [
  '<dg-state title="取消へ移れる状態">',
  '  <dg-box id="受付" sub="受け取る">受付</dg-box>',
  '  <dg-box id="確認" sub="見直す">確認</dg-box>',
  '  <dg-box id="処理" sub="進める">処理</dg-box>',
  '  <dg-box id="取消" sub="止める">取消</dg-box>',
  '  <dg-path from="受付" to="取消"></dg-path>',
  '  <dg-path from="確認" to="取消"></dg-path>',
  '  <dg-path from="処理" to="取消"></dg-path>',
  "",
  '  <dg-step title="受け付ける">',
  "    <dg-body>受け取る</dg-body>",
  '    <dg-edge from="start" to="受付">受け取る</dg-edge>',
  "  </dg-step>",
  '  <dg-step title="確かめる">',
  "    <dg-body>確かめる</dg-body>",
  '    <dg-edge from="受付" to="確認">確かめる</dg-edge>',
  "  </dg-step>",
  '  <dg-step title="進める">',
  "    <dg-body>進める</dg-body>",
  '    <dg-edge from="確認" to="処理">進める</dg-edge>',
  "  </dg-step>",
  "</dg-state>",
  "",
].join("\n");

// 子の Node で命令を起こす仕事は、混んだ機械で 1 件 10 秒の上限を超えるので、file を読み込む段で済ませる (#3815)

const CONVERTED = await atLoad("記法の図と頁を命令で変換する", () => ({
  figure: run(["convert", place("flow.dragon", FLOW)]),
  refused: run(["convert", place("unknown.html", UNKNOWN_ELEMENT), "--lang", "ja"]),
  page: run(["convert", place("guide.md", GUIDE)]),
}));

const CHECKED = await atLoad("誤りを持つHTMLの頁と崩れを持つHTMLの頁を命令で確かめる", () => {
  const broken = place("broken.html", BROKEN_PAGE);
  const crowded = place("crowded.html", CROWDED_PAGE);
  return {
    broken,
    crowded,
    plain: run(["check", broken, "--lang", "ja"]),
    layout: run(["check", broken, "--layout", "--lang", "ja"]),
    breaks: run(["check", crowded, "--layout", "--lang", "ja"]),
  };
});

/** 見本ごとに、HTMLの形へ変換して記法へ戻した結果。変換できなかった時は理由を持つ */
interface RoundTrip {
  file: string;
  problem?: string;
}

const ROUND_TRIPS = await atLoad("全ての見本の記法をHTMLの形へ変換して記法へ戻す", (): RoundTrip[] | undefined => {
  const toHtml = exported("notationToHtml");
  const toNotation = exported("htmlToNotation");
  if (!toHtml || !toNotation) return undefined;
  return readdirSync(EXAMPLES)
    .filter((file) => file.endsWith(".dragon"))
    .sort()
    .map((file): RoundTrip => {
      const text = readFileSync(join(EXAMPLES, file), "utf8");
      const html = toHtml(text, { lang: "ja" });
      if (!html.ok) return { file, problem: `HTMLの形へ変換できない: ${JSON.stringify(html.errors)}` };
      const back = toNotation(html.html, { lang: "ja" });
      if (!back.ok) return { file, problem: `記法へ戻せない: ${JSON.stringify(back.errors)}` };
      const again = parsed(back.notation);
      if (again === undefined) return { file, problem: "戻した記法を読めない" };
      return isDeepStrictEqual(again, parsed(text)) ? { file } : { file, problem: "戻した記法の原本のJSONが元と違う" };
    });
});

describe("記法とHTMLの形の変換 (#3908)", () => {
  it("html-form-from-notation", () => {
    const toHtml = tool("notationToHtml");
    if (!toHtml) return;
    const converted = toHtml(FLOW, { lang: "ja" });
    expect(converted.ok, `記法をHTMLの形へ変換できない: ${converted.ok ? "" : JSON.stringify(converted.errors)}`).toBe(true);
    if (!converted.ok) return;
    const html = converted.html.trim();
    expect(html.startsWith('<dg-flow title="申し込みの確かめ">'), `図を<dg-flow>で包まない: ${html.slice(0, 80)}`).toBe(true);
    expect(html.endsWith("</dg-flow>"), "図の終わりを</dg-flow>で閉じない").toBe(true);
    // 記法の1行が1つの要素になる。箱 3 つ、判断 1 つ、段 3 つ、語り 3 つ、線 3 本
    expect(
      { box: count(html, "<dg-box "), choice: count(html, "<dg-choice "), step: count(html, "<dg-step "), body: count(html, "<dg-body>"), edge: count(html, "<dg-edge ") },
      "記法の行ごとの要素の数",
    ).toEqual({ box: 3, choice: 1, step: 3, body: 3, edge: 3 });
    expect(html, "箱の行の要素").toContain('<dg-box id="form" color="green">申し込み</dg-box>');
    expect(html, "段の中の線の行の要素").toContain('<dg-edge from="ok" to="back">いいえ</dg-edge>');
    expect(html, "段の語りの行の要素").toContain("<dg-body>申し込みの欄を読む。</dg-body>");
    // 同じ変換を命令でもできる
    const { figure } = CONVERTED.get();
    expect(figure.code, `dragon convert が記法を変換できない: ${figure.stderr}`).toBe(0);
    expect(figure.stdout.trim(), "dragon convert と notationToHtml の結果").toBe(html);
  });

  it("html-form-round-trips-every-example", () => {
    if (!tool("notationToHtml") || !tool("htmlToNotation")) return;
    const trips = ROUND_TRIPS.get() ?? [];
    // 走査の空振りを避ける。見本帳の見本は日本語と英語の記法を持ち、100 を超える
    expect(trips.length, "変換した見本の数").toBeGreaterThan(100);
    const problems = trips.flatMap((trip) => (trip.problem === undefined ? [] : [`${trip.file}: ${trip.problem}`]));
    expect(problems, "HTMLの形へ変換して戻すと原本のJSONが変わる見本").toEqual([]);
  });

  it("html-form-refuses-unknown-element", () => {
    const toNotation = tool("htmlToNotation");
    if (!toNotation) return;
    const cases: { name: string; html: string; line: number; element: string; word: string }[] = [
      { name: "知らない名前の要素", html: UNKNOWN_ELEMENT, line: 3, element: "dg-boxx", word: "dg-boxx" },
      { name: "知らない名前の属性", html: UNKNOWN_ATTRIBUTE, line: 2, element: "dg-box", word: "colour" },
      { name: "置けない所の要素", html: MISPLACED_ELEMENT, line: 3, element: "dg-edge", word: "dg-edge" },
    ];
    for (const { name, html, line, element, word } of cases) {
      const read = toNotation(html, { lang: "ja" });
      expect(read.ok, `${name}を持つHTMLの形を変換した`).toBe(false);
      if (read.ok) continue;
      expect(read.errors[0], `${name}の誤りの行と要素`).toMatchObject({ line, element });
      expect(read.errors[0]?.message, `${name}の誤りの文が名前を挙げない`).toContain(word);
    }
    // 命令も変換を断り、file の行と要素の名前を出す
    const { refused } = CONVERTED.get();
    expect(refused.code, "dragon convert が知らない名前の要素を持つHTMLを変換した").toBe(1);
    expect(refused.stdout, "断った時に変換した字を出した").toBe("");
    expect(refused.stderr, "dragon convert の誤りの行").toMatch(/unknown\.html:3 .*dg-boxx/u);
  });

  it("html-page-converts-with-markdown", () => {
    const toPage = tool("markdownToHtml");
    const toMarkdown = tool("htmlToMarkdown");
    if (!toPage || !toMarkdown) return;
    const page = toPage(GUIDE, { lang: "ja" });
    expect(page.ok, `説明の頁をHTMLの頁へ変換できない: ${page.ok ? "" : JSON.stringify(page.errors)}`).toBe(true);
    if (!page.ok) return;
    const html = page.html;
    // 頭の行は<dragon-page>の属性、##と###は<section>と見出し、引用は<blockquote>、<details>は<details>、用語のリンクは<a>、図はHTMLの形
    expect(html.trimStart().startsWith('<dragon-page title="注文を届けるまでの手引き" layout="guide" note="pop">'), `頭の行が<dragon-page>の属性にならない: ${html.slice(0, 120)}`).toBe(true);
    for (const part of [
      "<section>",
      "<h2>注文を受ける</h2>",
      "<h3>店はどの注文を受けるのか</h3>",
      "<blockquote>",
      '<a href="glossary.md#注文">注文</a>',
      "<details>",
      "<summary>在庫の無い品物を1つ含む注文はどうなるか</summary>",
      '<dg-sequence title="注文を受ける">',
    ]) {
      expect(html, `HTMLの頁に ${part} が無い`).toContain(part);
    }
    expect(html, "図を記法の囲みのまま残した").not.toContain("```");
    const { page: ran } = CONVERTED.get();
    expect(ran.code, `dragon convert が説明の頁を変換できない: ${ran.stderr}`).toBe(0);
    expect(ran.stdout.trim(), "dragon convert と markdownToHtml の結果").toBe(html.trim());
    // HTMLの頁をMarkdownの頁へ戻すと、頭の行、見出し、引用、<details>、用語のリンク、図が元のmdの形へ戻る
    const back = toMarkdown(html, { lang: "ja" });
    expect(back.ok, `HTMLの頁をMarkdownの頁へ変換できない: ${back.ok ? "" : JSON.stringify(back.errors)}`).toBe(true);
    if (!back.ok) return;
    for (const line of ["title: 注文を届けるまでの手引き", "layout: guide", "note: pop", "> 在庫の在る品物だけの[注文](glossary.md#注文)を受け、[注文の番号](glossary.md#注文の番号)を返す。", "<summary>在庫の無い品物を1つ含む注文はどうなるか</summary>"]) {
      expect(back.markdown.split("\n"), `Markdownの頁に戻した行に「${line}」が無い`).toContain(line);
    }
    expect(headings(back.markdown), "戻したMarkdownの頁の見出し").toEqual(headings(GUIDE));
    expect(figures(back.markdown), "戻したMarkdownの頁の図の原本").toEqual(figures(GUIDE));
    // 説明の頁でない入口の組み立ての頁も、タブの見出しと表と図が行き来する
    const entry = toPage(ENTRY_PAGE, { lang: "ja" });
    expect(entry.ok, "入口の組み立ての頁をHTMLの頁へ変換できない").toBe(true);
    if (!entry.ok) return;
    expect(entry.html, "入口の組み立ての頁のタブの見出し").toContain("<h4>全体の図</h4>");
    const entryBack = toMarkdown(entry.html, { lang: "ja" });
    expect(entryBack.ok, "入口の組み立てのHTMLの頁をMarkdownの頁へ変換できない").toBe(true);
    if (!entryBack.ok) return;
    expect(headings(entryBack.markdown), "戻した入口の組み立ての頁の見出し").toEqual(headings(ENTRY_PAGE));
    expect(figures(entryBack.markdown), "戻した入口の組み立ての頁の図の原本").toEqual(figures(ENTRY_PAGE));
    expect(entryBack.markdown.split("\n"), "戻した入口の組み立ての頁の表").toContain("| 確かめた事 | 結果 |");
  });

  it("html-form-check-names-line", () => {
    const { broken, crowded, plain, layout, breaks } = CHECKED.get();
    for (const [name, ran] of [
      ["dragon check", plain],
      ["dragon check --layout", layout],
    ] as const) {
      expect(ran.code, `${name} がHTMLの誤りを知らせない: ${ran.stdout}${ran.stderr}`).toBe(1);
      const lines = ran.stdout.trimEnd().split("\n");
      // 記法が読まない色は、その行を作った箱の要素の行と名前で知らせる
      const color = lines.find((line) => line.startsWith(`${broken}:6:`));
      expect(color, `${name} が 6 行目の箱の誤りを知らせない: ${ran.stdout}`).toBeDefined();
      expect(color, `${name} の 6 行目の誤りが要素の名前を挙げない`).toMatch(/error .*dg-box/u);
      const element = lines.find((line) => line.startsWith(`${broken}:14:`));
      expect(element, `${name} が 14 行目の知らない要素を知らせない: ${ran.stdout}`).toBeDefined();
      expect(element, `${name} の 14 行目の誤りが要素の名前を挙げない`).toMatch(/error .*dg-stepp/u);
    }
    // 崩れは段を始める<dg-step>の行と名前で知らせる
    expect(breaks.code, `崩れだけのHTMLの頁で誤りを出した: ${breaks.stdout}${breaks.stderr}`).toBe(0);
    const warnings = breaks.stdout.trimEnd().split("\n").filter((line) => line.includes(" warning "));
    expect(warnings.length, `崩れを知らせない: ${breaks.stdout}${breaks.stderr}`).toBeGreaterThan(0);
    for (const warning of warnings) {
      expect(warning.startsWith(`${crowded}:10:`), `崩れを段 1 の<dg-step>の行で知らせない: ${warning}`).toBe(true);
      expect(warning, "崩れの知らせが要素の名前を挙げない").toContain("dg-step");
    }
  });
});
