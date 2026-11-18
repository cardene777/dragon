/**
 * `export-language.test.ts` の書き出しを、1 回の実行の準備の段で済ませる (#3734)。
 *
 * 命令 `dragon export` は子の Node の process で起こし、部品の書き出しは書き出しの thread で回す。
 * 1 件 1 回の命令に分けても (#3410、#3424)、混んだ機械 (load average 50 から 100) では命令と Chromium の書き出しだけで 1 件の上限 (10 秒) を超えた。
 * 件は書き出された file を読み、書き出した HTML を Chromium で開いて言葉を確かめる。
 * 件ごとの入力 (見本と渡す言葉) は、件と準備で同じ物を使うためここに置く。
 */
import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { EXAMPLES, exportIn, type Ran, runCli, scratch } from "../../../test-support/prepare-tools";
import { exampleJson, exampleText, type Json } from "./diagram-data";

/** 命令で書き出した結果と、書き出した先 */
export interface CliExport {
  ran: Ran;
  out: string;
}

/** 命令を起こし、終わった後に `dir` の中に在る物も残す */
export interface CliLeft {
  ran: Ran;
  left: string[];
}

/** 題と `say` に仮名か漢字がある見本。`--lang` が無ければ図に足す字を日本語で書き出す (#3516)。記法の file も JSON の原本も同じ */
export const JAPANESE_SOURCES = [
  { what: "日本語の記法", file: "oauth.dragon" },
  { what: "日本語の JSON", file: "oauth.json" },
] as const;

/** --lang を渡した時は、図の字の言葉に関わらず渡した言葉で書き出す (#3516) */
export const LANG_FLAGS = [
  { what: "JSON に --lang en を渡した時", file: "oauth.en.json", source: "oauth.en.json", extra: ["--lang", "en"], lang: "en" },
  { what: "JSON に --lang を渡さない時", file: "oauth.en.json", source: "oauth.en.json", extra: [], lang: "en" },
  { what: "JSON に --lang ja を渡した時", file: "oauth.en.json", source: "oauth.en.json", extra: ["--lang", "ja"], lang: "ja" },
  { what: "英語の記法に --lang ja を渡した時", file: "oauth.en.dragon", source: "oauth.en.json", extra: ["--lang", "ja"], lang: "ja" },
  { what: "日本語の記法に --lang en を渡した時", file: "oauth.dragon", source: "oauth.json", extra: ["--lang", "en"], lang: "en" },
] as const;

/** 状態の図の見本と、`--lang` に渡す言葉 (#3516) */
export const STATE_PNGS = [
  { file: "order.dragon", lang: "ja" },
  { file: "order.en.dragon", lang: "en" },
] as const;

/** 箱 2 つで段 30 の、高さが幅の 6 倍ほどある縦に長い図。寄って動かす見せ方で置く */
function tall(): Json {
  const edge: Json = { type: "edge", from: "a", to: "b", carry: { kind: "envelope" } };
  return {
    version: 1,
    kind: "sequence",
    title: "Tall diagram",
    view: "follow",
    boxes: [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ],
    steps: Array.from({ length: 30 }, (_, i) => ({ title: `Step ${i + 1}`, body: "Send.", events: [edge] })),
    sequence: { lifelines: ["a", "b"] },
  };
}

/** 英字だけで書き、大文字の O と小文字の r と w を持たない図。全体図の札 `Overview` の字が図の字から入らない */
function english(): Json {
  return {
    version: 1,
    kind: "sequence",
    title: "Small API",
    boxes: [
      { id: "a", name: "Web app" },
      { id: "b", name: "API v2" },
    ],
    steps: [{ title: "Call", body: "The app calls the API.", events: [{ type: "edge", from: "a", to: "b", label: "GET /items", carry: { kind: "envelope" } }] }],
    sequence: { lifelines: ["a", "b"] },
  };
}

const outDir = (): string => scratch("dragon-export-lang-");

/** 命令で HTML だけを書き出す */
async function cliHtml(file: string, extra: readonly string[] = []): Promise<CliExport> {
  const out = outDir();
  return { ran: await runCli(["export", join(EXAMPLES, file), "--out", out, "--format", "html", ...extra]), out };
}

/** 色の欄の名前を間違えた、描けない原本を置き、命令を起こす */
async function refusal(extra: readonly string[]): Promise<CliLeft> {
  const dir = outDir();
  const bad = exampleJson("oauth.json") as { blocks: { box: { [key: string]: Json }[] } };
  (bad.blocks.box[0] as { [key: string]: Json }).colour = "blue";
  const input = join(dir, "bad.json");
  writeFileSync(input, JSON.stringify(bad));
  const ran = await runCli(["export", input, "--out", join(dir, "out"), "--format", "html", ...extra]);
  return { ran, left: readdirSync(dir) };
}

/**
 * 状態の図の見本を、命令で `--lang` を渡さずに PNG に書き出した中身と、`--lang` の言葉を渡した部品で書き出した中身 (#3516)。
 * `dragon export --lang <言葉>` は記法を読んで同じ部品にその言葉を渡すので、部品の PNG を `--lang` を渡した書き出しとして比べる
 */
async function statePng(file: string, lang: "ja" | "en"): Promise<{ parsed: boolean; ran: Ran; out: string; given?: string }> {
  const parsed = dragon.parseNotation(exampleText(file));
  const out = outDir();
  const [ran, given] = await Promise.all([runCli(["export", join(EXAMPLES, file), "--out", out, "--format", "png"]), parsed.ok ? exportIn(parsed.diagram, { outDir: outDir(), formats: ["png"], lang }) : undefined]);
  return { parsed: parsed.ok, ran, out, ...(given?.files.png ? { given: given.files.png } : {}) };
}

export default async function prepare() {
  const unknownDir = outDir();
  const [overviewJa, overviewEn, englishNotation, japanese, langFlags, japaneseDiagram, refusalEn, refusalDefault, unknownLang, englishFont, englishPng, states] = await Promise.all([
    exportIn(tall(), { outDir: outDir(), formats: ["html"], lang: "ja" }),
    exportIn(tall(), { outDir: outDir(), formats: ["html"], lang: "en" }),
    // 題と `say` が英語の図は、`--lang` が無ければ英語で書き出す (#3338、#3516)
    cliHtml("oauth.en.dragon"),
    Promise.all(JAPANESE_SOURCES.map(({ file }) => cliHtml(file))),
    Promise.all(LANG_FLAGS.map(({ file, extra }) => cliHtml(file, extra))),
    // 部品も、`lang` を渡さなければ図の題と `say` から図に足す字の言葉を決める (#3516)
    exportIn(exampleJson("oauth.json"), { outDir: outDir(), formats: ["html"] }),
    refusal(["--lang", "en"]),
    // 題と `say` が日本語の図でも、`--lang` が無ければ描けない時の断りは英語で出す (#3338、#3516)
    refusal([]),
    runCli(["export", join(EXAMPLES, "oauth.json"), "--out", join(unknownDir, "out"), "--format", "html", "--lang", "fr"]).then((ran): CliLeft => ({ ran, left: readdirSync(unknownDir) })),
    exportIn(english(), { outDir: outDir(), formats: ["html"], lang: "en" }),
    (async (): Promise<CliExport> => {
      const out = outDir();
      return { ran: await runCli(["export", join(EXAMPLES, "order.en.json"), "--out", out, "--format", "png", "--lang", "en"]), out };
    })(),
    Promise.all(STATE_PNGS.map(({ file, lang }) => statePng(file, lang))),
  ]);
  return {
    overview: { ja: overviewJa.files.html, en: overviewEn.files.html },
    englishNotation,
    japanese,
    langFlags,
    japaneseDiagram: japaneseDiagram.files.html,
    refusalEn,
    refusalDefault,
    unknownLang,
    englishFont: englishFont.files.html,
    englishPng,
    states,
  };
}
