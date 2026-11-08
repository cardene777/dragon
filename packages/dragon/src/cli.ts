#!/usr/bin/env node
/**
 * `dragon export <図の file>` の命令。原本の JSON (`.json`) か記法 (`.dragon`) を読み、mp4、GIF、HTML、PNG を書き出す。
 * 書き出した file の path を 1 行ずつ出す。
 * `dragon embed <HTML の file>` の命令は、頁の script の1行の入口を束ねた script の中身に置き換え、外へ通信しない1 file を書く (#3343)。
 * `dragon check <file>` の命令は、記法を描かずに確かめ、誤りと知らせを `<file>:<行>:<列> <重さ> <文>` の 1 件 1 行で出す (#3455)。
 * 誤りがあれば終わり方 1、知らせだけなら 0 で終わる。`dragon --version` は package の版を出す。
 * 図に字の重なりがある時は、書き出したうえで重なりを段と文で 1 件 1 行ずつ標準エラーに出し、終わり方は 0 のままにする (#3178)。
 * 重なりは描けない誤りではなく、止めると避けられない重なりを持つ図を書き出せなくなるため。
 *
 * 使い方の文と誤りの文は、図の中の字と同じ言葉で出す (#3003)。`--lang` を渡せばその言葉、無ければ英語 (#3338)。
 * dragon記法の語は英語だけで file から言葉が決まらないため、記法の file も JSON の原本と同じに扱う (#3137)。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { CHECKED_FILES, checkText, isBlocksFile, type Problem, problemLine, readBlocksFile } from "./check";
import { embedPage } from "./export/embed";
import { type ExportFormat, exportDiagram, FORMATS, NoSuchStep } from "./export/index";
import { PALETTES, type Theme } from "./look/values";
import { parseNotation } from "./parser";
import { describeOverlap } from "./render/ink";
import { DEFAULT_LANG, type NotationLang } from "./words";

const OPTIONS = {
  out: { type: "string" },
  width: { type: "string" },
  palette: { type: "string" },
  theme: { type: "string" },
  lang: { type: "string" },
  fps: { type: "string" },
  "gif-fps": { type: "string" },
  format: { type: "string" },
  step: { type: "string" },
} as const;

/** `dragon embed` の設定 */
const EMBED_OPTIONS = { out: { type: "string" }, lang: { type: "string" } } as const;

/** `dragon check` の設定 */
const CHECK_OPTIONS = { json: { type: "boolean" }, layout: { type: "boolean" }, lang: { type: "string" }, blocks: { type: "string" } } as const;

/** package の版。build が入れる (`tsup.config.ts`) */
declare const __DRAGON_VERSION__: string;

type Values = Partial<Record<keyof typeof OPTIONS, string>>;

const THEMES: readonly Theme[] = ["light", "dark"];
/** 色味の名前。使い方の文と `--palette` の値の確かめに使う */
const PALETTE_NAMES = Object.keys(PALETTES).join(" / ");

interface CliText {
  usage: string;
  /** `dragon embed` の使い方 */
  embedUsage: string;
  /** `dragon embed` の誤りの文 */
  embed: { extraFiles: (extra: string[]) => string; noFile: (path: string) => string; unreadable: (path: string, detail: string) => string; noEntry: (path: string) => string };
  /** `dragon check` の使い方 */
  checkUsage: string;
  /** `dragon check` が読めない拡張子の file */
  cannotCheck: (path: string) => string;
  /** `dragon check --blocks` に渡した定義の file が無い (#3508) */
  noBlocksFile: (path: string) => string;
  /** `dragon check --blocks` に渡した file が足したブロックの定義の file でない (#3508) */
  notBlocksFile: (path: string) => string;
  /** `dragon --version` の使い方 */
  versionUsage: string;
  unknownOption: (name: string) => string;
  missingValue: (name: string) => string;
  extraFiles: (extra: string[]) => string;
  noFile: (path: string) => string;
  unreadable: (path: string, detail: string) => string;
  badJson: (path: string, detail: string) => string;
  cannotWrite: (path: string, detail: string) => string;
  badValue: (option: string, value: string, allowed: string) => string;
  /** 設定ごとの許す値の言い方 */
  allowed: { lang: string; theme: string; positive: string; format: string; step: string; steps: (count: number) => string };
  /** 字の重なりの 1 行。`step` は 1 から数える */
  overlap: (step: number, text: string) => string;
}

/** 命令が出す文。英語は日本語の文をそのまま英語にする */
const CLI_TEXT: Record<NotationLang, CliText> = {
  ja: {
    usage: [
      "使い方: dragon export <図の file (.json か .dragon)> [設定]",
      "  --out <dir>        書き出す先 (既定は今の dir)",
      "  --width <px>       枠の幅。見せ方を選び、寄って見せる窓の幅になる",
      `  --palette <名前>   色味 (${PALETTE_NAMES})`,
      "  --theme <明暗>     light か dark",
      "  --lang <言葉>      図の中の字と命令の文の言葉 (ja か en)。既定は en",
      "  --fps <数>         mp4 の 1 秒のコマの数 (既定 30)",
      "  --gif-fps <数>     GIF の 1 秒のコマの数 (既定 10)",
      "  --format <形>      書き出す形を , で区切る (既定 mp4,gif,html,png)",
      "  --step <段>        png に撮る段 (1 から数える。既定は最後の段)",
    ].join("\n"),
    embedUsage: [
      "使い方: dragon embed <HTML の file> [設定]",
      "  --out <file>       書き出す file (既定は元の file の隣の <名前>.offline.html)",
      "  --lang <言葉>      命令の文の言葉 (ja か en)。既定は en",
    ].join("\n"),
    embed: {
      extraFiles: (extra) => `HTML の file は 1 つだけ渡す。余分な引数: ${extra.join(" ")}`,
      noFile: (path) => `HTML の file が無い: ${path}`,
      unreadable: (path, detail) => `HTML の file を読めない: ${path} (${detail})`,
      noEntry: (path) => `入口の1行 (src が dist/cdn/dragon.js で終わる script) が無い: ${path}`,
    },
    checkUsage: [
      "使い方: dragon check <記法の file (.dragon か .md) か -> [設定]",
      "  --json             誤りと知らせを JSON で出す",
      "  --layout           図を描き、崩れ (丸や線の詰まり、箱の形からのはみ出し) も段ごとに知らせる",
      "  --blocks <file>    足したブロックの定義の file を読み、その定義を図に渡して確かめる",
      "  --lang <言葉>      命令の文の言葉 (ja か en)。既定は en",
    ].join("\n"),
    cannotCheck: (path) => `確かめられない file: ${path} (.dragon か .md の file か、標準入力の - を渡す)`,
    noBlocksFile: (path) => `足したブロックの定義の file が無い: ${path}`,
    notBlocksFile: (path) => `足したブロックの定義の file でない: ${path} (注釈の後の最初の行を blocks 1 にする)`,
    versionUsage: "使い方: dragon --version (版を出す)",
    unknownOption: (name) => `知らない設定: ${name}`,
    missingValue: (name) => `設定に値が無い: ${name}`,
    extraFiles: (extra) => `図の file は 1 つだけ渡す。余分な引数: ${extra.join(" ")}`,
    noFile: (path) => `図の file が無い: ${path}`,
    unreadable: (path, detail) => `図の file を読めない: ${path} (${detail})`,
    badJson: (path, detail) => `JSON として読めない: ${path} (${detail})`,
    cannotWrite: (path, detail) => `書き出せない: ${path} (${detail})`,
    badValue: (option, value, allowed) => `使えない値: ${option} ${value} (${allowed})`,
    allowed: { lang: "ja か en", theme: "light か dark", positive: "0 より大きい数", format: `${FORMATS.join(" / ")} を , で区切る`, step: "1 以上の整数", steps: (count) => `図の段は 1 から ${count}` },
    overlap: (step, text) => `段 ${step}: ${text}`,
  },
  en: {
    usage: [
      "Usage: dragon export <diagram file (.json or .dragon)> [options]",
      "  --out <dir>        Where to write (default: the current dir)",
      "  --width <px>       Frame width. Picks the view and sets the window width when following",
      `  --palette <name>   Colors (${PALETTE_NAMES})`,
      "  --theme <mode>     light or dark",
      "  --lang <lang>      Language of the diagram text and command messages (ja or en). Defaults to en",
      "  --fps <n>          Frames per second of the mp4 (default 30)",
      "  --gif-fps <n>      Frames per second of the GIF (default 10)",
      "  --format <list>    Formats to write, separated by , (default mp4,gif,html,png)",
      "  --step <n>         Step the png shows (counted from 1, default: the last step)",
    ].join("\n"),
    embedUsage: [
      "Usage: dragon embed <HTML file> [options]",
      "  --out <file>       Where to write (default: <name>.offline.html next to the file)",
      "  --lang <lang>      Language of the command messages (ja or en). Defaults to en",
    ].join("\n"),
    embed: {
      extraFiles: (extra) => `Pass only one HTML file. Extra arguments: ${extra.join(" ")}`,
      noFile: (path) => `No such HTML file: ${path}`,
      unreadable: (path, detail) => `Cannot read the HTML file: ${path} (${detail})`,
      noEntry: (path) => `No entry line (a script whose src ends with dist/cdn/dragon.js): ${path}`,
    },
    checkUsage: [
      "Usage: dragon check <notation file (.dragon or .md) or -> [options]",
      "  --json             Print the errors and warnings as JSON",
      "  --layout           Draw the diagram and also warn about layout breaks (crowded badges or lines, parts sticking out of a box shape) per step",
      "  --blocks <file>    Read the block definitions in this file and check the diagrams with them",
      "  --lang <lang>      Language of the command messages (ja or en). Defaults to en",
    ].join("\n"),
    cannotCheck: (path) => `Cannot check this file: ${path} (pass a .dragon or .md file, or - for stdin)`,
    noBlocksFile: (path) => `No such block definitions file: ${path}`,
    notBlocksFile: (path) => `Not a block definitions file: ${path} (start it with blocks 1 after any comments)`,
    versionUsage: "Usage: dragon --version (prints the version)",
    unknownOption: (name) => `Unknown option: ${name}`,
    missingValue: (name) => `Option needs a value: ${name}`,
    extraFiles: (extra) => `Pass only one diagram file. Extra arguments: ${extra.join(" ")}`,
    noFile: (path) => `No such diagram file: ${path}`,
    unreadable: (path, detail) => `Cannot read the diagram file: ${path} (${detail})`,
    badJson: (path, detail) => `Cannot read as JSON: ${path} (${detail})`,
    cannotWrite: (path, detail) => `Cannot write: ${path} (${detail})`,
    badValue: (option, value, allowed) => `Invalid value: ${option} ${value} (${allowed})`,
    allowed: { lang: "ja or en", theme: "light or dark", positive: "a number above 0", format: `${FORMATS.join(" / ")} separated by ,`, step: "a whole number from 1", steps: (count) => `the diagram has steps 1 to ${count}` },
    overlap: (step, text) => `Step ${step}: ${text}`,
  },
};

const isLang = (value: string | undefined): value is NotationLang => value === "ja" || value === "en";

const number = (value: string | undefined): number | undefined => (value === undefined ? undefined : Number(value));

const detail = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** 設定を読む前に `--lang` の値を引く。設定の誤りの文も、選んだ言葉で出すため */
function langOf(args: string[]): string | undefined {
  for (const [i, arg] of args.entries()) {
    if (arg === "--lang") return args[i + 1];
    if (arg.startsWith("--lang=")) return arg.slice("--lang=".length);
  }
  return undefined;
}

/**
 * 設定の誤りを、Node の文ではなく命令の言葉で返す。誤りが無ければ `undefined`。
 * 値の要る設定の後ろに `-` で始まる語が続く時は、その語を値と取り違えずに値が無いとみなす (Node も同じ形を断る)。
 */
function optionProblem(args: string[], text: CliText, options: typeof OPTIONS | typeof EMBED_OPTIONS | typeof CHECK_OPTIONS = OPTIONS): string | undefined {
  const { tokens } = parseArgs({ args, options, allowPositionals: true, strict: false, tokens: true });
  const types: Readonly<Record<string, { type: string }>> = options;
  for (const token of tokens) {
    if (token.kind !== "option") continue;
    if (!Object.hasOwn(options, token.name)) return text.unknownOption(token.rawName);
    // 値を取らない設定 (`--json`) は値を確かめない
    if (types[token.name]?.type !== "string") continue;
    if (token.value === undefined || (!token.inlineValue && token.value.startsWith("-"))) return text.missingValue(token.rawName);
  }
  return undefined;
}

/**
 * 設定の値を確かめ、使えない値を命令の言葉で返す。使えない値が無ければ `undefined` (#3011)。
 * 確かめないと、`--format xyz` は何も書き出さずに成功として終わり、`--theme blue` などは既定の値で黙って書き出す。
 */
function valueProblem(values: Values, text: CliText): string | undefined {
  const bad = (name: keyof typeof OPTIONS, value: string, allowed: string): string => text.badValue(`--${name}`, value, allowed);
  if (values.lang !== undefined && !isLang(values.lang)) return bad("lang", values.lang, text.allowed.lang);
  if (values.theme !== undefined && !THEMES.some((theme) => theme === values.theme)) return bad("theme", values.theme, text.allowed.theme);
  if (values.palette !== undefined && !Object.hasOwn(PALETTES, values.palette)) return bad("palette", values.palette, PALETTE_NAMES);
  if (values.format !== undefined && !values.format.split(",").every((format) => FORMATS.some((known) => known === format))) {
    return bad("format", values.format, text.allowed.format);
  }
  for (const name of ["width", "fps", "gif-fps"] as const) {
    const value = values[name];
    if (value !== undefined && !(Number.isFinite(Number(value)) && Number(value) > 0)) return bad(name, value, text.allowed.positive);
  }
  if (values.step !== undefined && !(Number.isInteger(Number(values.step)) && Number(values.step) >= 1)) return bad("step", values.step, text.allowed.step);
  return undefined;
}

/** Node が file か dir を扱えなかった誤りなら、扱えなかった path を返す。それ以外の誤りは `undefined` */
function failedPath(error: unknown): string | undefined {
  if (!(error instanceof Error) || !("syscall" in error) || !("path" in error)) return undefined;
  return typeof error.path === "string" ? error.path : undefined;
}

/** 図の file を読む。記法の行の誤りは `lang` の言葉で出す */
function read(file: string, text: CliText, lang: NotationLang): unknown {
  let source: string;
  try {
    source = readFileSync(file, "utf8");
  } catch (error) {
    const missing = error instanceof Error && "code" in error && error.code === "ENOENT";
    throw new Error(missing ? text.noFile(file) : text.unreadable(file, detail(error)));
  }
  if (extname(file) !== ".dragon") {
    try {
      return JSON.parse(source);
    } catch (error) {
      throw new Error(text.badJson(file, detail(error)));
    }
  }
  const parsed = parseNotation(source, { lang });
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => `${file}:${e.line} ${e.message}`).join("\n"));
  // 知らせ (箱を宣言しない図の似た名前、#3438) は、誤りと同じ形で標準エラーに出し、書き出しは続ける
  for (const notice of parsed.notices ?? []) console.error(`${file}:${notice.line} ${notice.message}`);
  return parsed.diagram;
}

/** `dragon embed <HTML の file>`。埋めた1 file を書き、その path を出す (#3343) */
function embed(args: string[], text: CliText): number {
  const problem = optionProblem(args, text, EMBED_OPTIONS);
  if (problem !== undefined) {
    console.error(`${problem}\n${text.embedUsage}`);
    return 2;
  }
  const { values, positionals } = parseArgs({ args, options: EMBED_OPTIONS, allowPositionals: true });
  if (values.lang !== undefined && !isLang(values.lang)) {
    console.error(`${text.badValue("--lang", values.lang, text.allowed.lang)}\n${text.embedUsage}`);
    return 2;
  }
  const [file, ...extra] = positionals;
  if (!file) {
    console.error(text.embedUsage);
    return 2;
  }
  if (extra.length > 0) {
    console.error(`${text.embed.extraFiles(extra)}\n${text.embedUsage}`);
    return 2;
  }
  let html: string;
  try {
    html = readFileSync(file, "utf8");
  } catch (error) {
    const missing = error instanceof Error && "code" in error && error.code === "ENOENT";
    throw new Error(missing ? text.embed.noFile(file) : text.embed.unreadable(file, detail(error)));
  }
  const page = embedPage(html);
  if (page === undefined) throw new Error(text.embed.noEntry(file));
  const out = resolve(values.out ?? join(dirname(file), `${basename(file, extname(file))}.offline.html`));
  try {
    writeFileSync(out, page);
  } catch (error) {
    throw new Error(text.cannotWrite(out, detail(error)));
  }
  console.log(out);
  return 0;
}

/**
 * `dragon check <file>...`。記法の file と Markdown の file と標準入力 (`-`) を確かめる (#3455)。
 * 無い file か読めない拡張子の file が 1 つでも在れば、どれも確かめずに終わり方 2 で断る。
 * 足したブロックの定義の file も確かめ、`--blocks <file>` で渡した定義は確かめる図に渡す (#3508)。
 * 渡した定義の file が無いか定義の file でない時は終わり方 2 で断り、定義に誤りがある時はその誤りを出して終わり方 1 で終わる
 */
function check(args: string[], text: CliText): number {
  const problem = optionProblem(args, text, CHECK_OPTIONS);
  if (problem !== undefined) {
    console.error(`${problem}\n${text.checkUsage}`);
    return 2;
  }
  const { values, positionals } = parseArgs({ args, options: CHECK_OPTIONS, allowPositionals: true });
  if (values.lang !== undefined && !isLang(values.lang)) {
    console.error(`${text.badValue("--lang", values.lang, text.allowed.lang)}\n${text.checkUsage}`);
    return 2;
  }
  if (positionals.length === 0) {
    console.error(text.checkUsage);
    return 2;
  }
  const lang = values.lang ?? DEFAULT_LANG;
  const sources: { file: string; source: string; form: "notation" | "markdown" }[] = [];
  for (const file of positionals) {
    const form = file === "-" ? "notation" : CHECKED_FILES[extname(file).toLowerCase()];
    if (form === undefined) {
      console.error(text.cannotCheck(file));
      return 2;
    }
    try {
      sources.push({ file, source: readFileSync(file === "-" ? 0 : file, "utf8"), form });
    } catch (error) {
      const missing = error instanceof Error && "code" in error && error.code === "ENOENT";
      console.error(missing ? text.noFile(file) : text.unreadable(file, detail(error)));
      return 2;
    }
  }
  const blocks = values.blocks === undefined ? undefined : blocksOption(values.blocks, lang, text);
  if (typeof blocks === "number") return blocks;
  if (blocks !== undefined && !blocks.ok) return report(blocks.problems, values.json === true);
  const layout = values.layout ? CLI_TEXT[lang].overlap : undefined;
  return report(
    sources.flatMap(({ file, source, form }) => checkText(file, source, form, lang, { ...(layout !== undefined ? { layout } : {}), ...(blocks !== undefined ? { blocks: blocks.blocks } : {}) })),
    values.json === true,
  );
}

/** `--blocks` で渡した定義の file を読む。無いか定義の file でない時は断りを出し、終わり方 2 を返す (#3508) */
function blocksOption(path: string, lang: NotationLang, text: CliText): ReturnType<typeof readBlocksFile> | number {
  let source: string;
  try {
    source = readFileSync(path, "utf8");
  } catch (error) {
    const missing = error instanceof Error && "code" in error && error.code === "ENOENT";
    console.error(missing ? text.noBlocksFile(path) : text.unreadable(path, detail(error)));
    return 2;
  }
  if (!isBlocksFile(source)) {
    console.error(`${text.notBlocksFile(path)}\n${text.checkUsage}`);
    return 2;
  }
  return readBlocksFile(path, source, lang);
}

/** 誤りと知らせを出し、誤りがあれば終わり方 1、無ければ 0 を返す */
function report(problems: Problem[], json: boolean): number {
  if (json) console.log(JSON.stringify(problems, null, 2));
  else for (const found of problems) console.log(problemLine(found));
  return problems.some((found) => found.severity === "error") ? 1 : 0;
}

async function main(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;
  const chosen = langOf(argv);
  // file を読む前の文は、渡した言葉か既定の英語で出す。知らない言葉は英語の使い方で断る
  const early = CLI_TEXT[isLang(chosen) ? chosen : DEFAULT_LANG];
  if (command === "--version") {
    console.log(__DRAGON_VERSION__);
    return 0;
  }
  if (command === "embed") return embed(rest, early);
  if (command === "check") return check(rest, early);
  if (command !== "export") {
    console.error(`${early.usage}\n\n${early.embedUsage}\n\n${early.checkUsage}\n\n${early.versionUsage}`);
    return 2;
  }
  const problem = optionProblem(rest, early);
  if (problem !== undefined) {
    console.error(`${problem}\n${early.usage}`);
    return 2;
  }
  const { values, positionals } = parseArgs({ args: rest, options: OPTIONS, allowPositionals: true });
  const badValue = valueProblem(values, early);
  if (badValue !== undefined) {
    console.error(`${badValue}\n${early.usage}`);
    return 2;
  }
  const [file, ...extra] = positionals;
  if (!file) {
    console.error(early.usage);
    return 2;
  }
  // 2 つ目以降を黙って捨てると、`--out` を書き忘れた時に思った所と違う所へ書き出す (#3007)
  if (extra.length > 0) {
    console.error(`${early.extraFiles(extra)}\n${early.usage}`);
    return 2;
  }
  const width = number(values.width);
  const fps = number(values.fps);
  const gifFps = number(values["gif-fps"]);
  const step = number(values.step);
  // 言葉は渡した物だけで決める。渡さなければ、書き出しの既定 (英語) になる
  const lang = isLang(chosen) ? chosen : undefined;
  const diagram = read(file, early, lang ?? DEFAULT_LANG);
  let result: Awaited<ReturnType<typeof exportDiagram>>;
  try {
    result = await exportDiagram(diagram, {
      outDir: resolve(values.out ?? "."),
      name: basename(file, extname(file)),
      ...(values.format ? { formats: values.format.split(",") as ExportFormat[] } : {}),
      ...(width === undefined ? {} : { width }),
      ...(values.palette ? { palette: values.palette } : {}),
      ...(values.theme ? { theme: values.theme as Theme } : {}),
      ...(lang ? { lang } : {}),
      ...(fps === undefined ? {} : { fps }),
      ...(gifFps === undefined ? {} : { gifFps }),
      ...(step === undefined ? {} : { step }),
    });
  } catch (error) {
    // 図に無い段を選んだ時は、使えない値として使い方を添えて断る (#3484)
    if (error instanceof NoSuchStep) {
      console.error(`${early.badValue("--step", String(error.step), early.allowed.steps(error.count))}\n${early.usage}`);
      return 2;
    }
    // 書き出し先に書けない時だけ命令の言葉で書き直す。描けない時と道具が無い時の断りは、書き出しが言葉に合わせて出す (#3009)
    const path = failedPath(error);
    if (path !== undefined) throw new Error(CLI_TEXT[lang ?? DEFAULT_LANG].cannotWrite(path, detail(error)));
    throw error instanceof Error ? error : new Error(String(error));
  }
  for (const path of Object.values(result.files)) console.log(path);
  const said = lang ?? DEFAULT_LANG;
  for (const overlap of result.overlaps) console.error(CLI_TEXT[said].overlap(overlap.step + 1, describeOverlap(overlap, said)));
  return 0;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error(detail(error));
    process.exit(1);
  },
);
